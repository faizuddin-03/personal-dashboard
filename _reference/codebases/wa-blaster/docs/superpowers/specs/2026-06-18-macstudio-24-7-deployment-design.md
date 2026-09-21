# Mac Studio 24/7 Chatbot Deployment — Design

**Date:** 2026-06-18
**Status:** Design approved; pending spec review → implementation plan
**Branch:** feat/ai-chatbot

## Goal

Run the WhatsApp insurance chatbot **24/7 on the Mac Studio**, so it keeps working
when the developer's laptop is off — with **zero manual tunnel management** (no
autossh Ollama tunnel, no manually-started cloudflared). The only public tunnel is
ngrok, started automatically by `launchd`; the user never connects anything by hand.

## Constraints (discovered, non-negotiable)

- **Target host:** Mac Studio `ai-c-ms.local` (`10.20.50.22`), user `team05`.
  macOS 26.4.1, arm64, 36 GB RAM, 333 GB free.
- **`team05` is a non-admin account with no sudo.** Everything must install and run
  user-level under `~team05`. This rules out Docker/Colima and any system package
  manager that needs admin.
- **Available on the Studio already:** Ollama desktop app (local, auto-starts) with
  `qwen2.5:14b`, `bge-m3`, `qwen3:14b`; git; Xcode Command Line Tools (`clang`,
  `make`) — so source builds are possible. SSH key auth from the laptop works.
- **Not present:** Node, pnpm, Homebrew, Docker, Postgres, Redis.
- **Auto-login is OFF** and enabling it needs admin → a full reboot pauses the stack
  until `team05` logs back in. Accepted limitation.

## Current state (before)

- **Laptop** runs almost everything: API (:3000), worker, Postgres (Docker
  `wbs_postgres`, pgvector/pg16), Redis (Docker `wbs_redis`), the public tunnel
  (cloudflared, URL rotates), and an autossh tunnel to reach the Studio's Ollama.
- **Studio** runs only Ollama.
- Meta webhook → cloudflared → laptop API. Dies whenever the laptop sleeps/off.

## Target architecture (after)

Everything runs on the Studio, all services talking over `localhost` — no
inter-machine tunnels:

| Service | Port | How it runs |
| --- | --- | --- |
| Ollama | 11434 | existing desktop app (local) |
| Postgres 16 + pgvector | 5432 | user-level build, LaunchAgent |
| Redis | 6379 | user-level build, LaunchAgent |
| API (`node dist/main`) | 3000 | LaunchAgent |
| Worker (`node dist/worker`) | — | LaunchAgent |
| ngrok (stable domain → 3000) | — | LaunchAgent |

**Inbound message flow:** Customer → Meta → ngrok (stable URL) → Studio API →
Redis queue (BullMQ) → Worker → RAG over local pgvector + local Ollama → reply via
Meta Graph API. The laptop is not involved. The laptop reverts to dev-only and its
autossh Ollama tunnel is retired from production.

## Components (all user-level, no sudo)

1. **Node runtime** — nvm in `~/.nvm`; Node 20 LTS (match the laptop); pnpm via
   `corepack enable`.
2. **Postgres 16 + pgvector** — built/installed user-level (primary plan:
   user-prefix Homebrew in `~/homebrew` → `brew install postgresql@16 pgvector`,
   building from source since CLT is present; fallback: Postgres.app in
   `~/Applications` + build pgvector against its `pg_config`). Data directory owned
   by `team05` (e.g. `~/pgdata`), cluster `initdb`'d, listening on `localhost:5432`.
   PG **16** chosen to match the laptop's `pgvector/pgvector:pg16` for a clean
   dump/restore.
3. **Redis** — user-level (same user-prefix Homebrew or source build), default
   config, `localhost:6379`.
4. **Application** — existing `~/whatsapp-blasting` checkout: fetch + switch to
   `feat/ai-chatbot`, `pnpm install`, `pnpm --filter api build`, then
   `prisma migrate deploy` (production migration, **not** `migrate dev`).
5. **ngrok** — user binary; `ngrok config add-authtoken <token>`; one **static
   domain** (free tier includes one) so the callback URL never changes; run
   `ngrok http 3000 --domain=<static>`. Register that URL with Meta **once** via the
   Graph API (`POST /{app-id}/subscriptions`).
6. **Environment** — `apps/api/.env` copied from the laptop (the source of truth for
   real secrets), `chmod 600`, with:
   - `DATABASE_URL` → `postgresql://…@localhost:5432/…`
   - `REDIS_URL` → `redis://localhost:6379`
   - `LLM_OLLAMA_URL` / `EMBEDDINGS_OLLAMA_URL` → `http://localhost:11434/v1`
   - `WHATSAPP_MOCK_MODE=false`, `CHATBOT_ENABLED=true`, real WhatsApp/JWT/OpenAI
     secrets. Never committed.

## Process management & persistence (launchd LaunchAgents — no admin)

One plist per service in `~/Library/LaunchAgents/` (Ollama already has its own):

- `com.modefair.postgres.plist`
- `com.modefair.redis.plist`
- `com.modefair.chatbot-api.plist`
- `com.modefair.chatbot-worker.plist`
- `com.modefair.ngrok.plist`

Each uses `RunAtLoad=true` (start on `team05` login) + `KeepAlive=true` (auto-restart
on crash). Postgres and Redis have no native ordering guarantee vs the app, so the
API/worker rely on `KeepAlive` to restart until the DB/Redis accept connections
(Prisma/BullMQ fail fast on a closed port; launchd relaunches them within seconds).
Logs go to `~/Library/Logs/chatbot-*.log` (stdout/stderr redirected in each plist),
so everything is tailable without attaching to a session.

**Why launchd, not tmux/nohup/pm2:** only launchd both auto-restarts on crash *and*
auto-starts on login without admin. tmux/nohup survive SSH disconnect but not a
crash or login cycle; pm2's boot persistence needs a sudo-installed LaunchDaemon.

**Reboot caveat:** LaunchAgents start at login. With auto-login off (admin-gated),
a reboot pauses the stack until `team05` logs in. While the Studio stays powered on
and logged in, the stack is fully hands-off.

## Data migration (preserve KB + conversations)

1. On the laptop: `pg_dump` the chatbot DB out of the `wbs_postgres` container
   (DB name from `DATABASE_URL`), custom or plain format.
2. `scp` the dump to the Studio.
3. On the Studio: `createdb`, ensure pgvector is installed and run
   `CREATE EXTENSION IF NOT EXISTS vector;` **before** restore (so the `vector` type
   exists), then restore.
4. `prisma migrate deploy` to confirm the schema matches the codebase.
5. Verify row counts match the laptop: KB documents/chunks, embeddings,
   conversations, settings.
6. **Fallback** if vector-column restore is troublesome: run `prisma migrate deploy`
   on a fresh DB and re-ingest the KB from source docs (embeddings regenerate via
   the local Ollama bge-m3). Conversation history would not carry over in this path.

## Cutover & rollback (safe — no downtime gamble)

1. Stand up the full Studio stack and **send a real WhatsApp test message**,
   confirming an end-to-end reply, **before** changing anything on the laptop.
2. Point the Meta webhook at the Studio's stable ngrok URL (one-time Graph API
   registration).
3. Keep the laptop stack fully intact during validation. **Rollback** = re-register
   the Meta webhook back to the laptop's tunnel and restart the laptop API/worker.
4. Only after the Studio runs clean (incl. a crash-restart test via `KeepAlive`)
   stop the laptop's API/worker/tunnels and retire its production role.

## Prerequisites / inputs needed from the user

- **ngrok authtoken** (from their ngrok account) and confirmation of an existing
  **static domain** — or approval to create one on the free tier.

## Risks & mitigations

- **Reboot needs manual login** (auto-login is admin-gated) — main limitation.
  Mitigation: keep the Studio powered on; optionally ask an admin to enable
  auto-login later (turns this fully hands-off).
- **User-level Postgres/pgvector build may snag** (formulae assuming `/opt/homebrew`).
  Mitigation: Postgres.app + source-built pgvector fallback.
- **ngrok free-tier limits** (one domain, bandwidth/connection caps) — fine for a
  low-volume insurance chatbot; upgrade path exists.
- **Secrets on a shared machine** — `.env` holds real tokens. `chmod 600`, never
  commit; transfer via `scp` over the existing key-auth SSH.
- **36 GB shared with Ollama** — Ollama already runs there; Postgres/Redis/API/worker
  are light next to the 14b model. More headroom than the laptop's 16 GB.

## Out of scope

- Enabling auto-login or anything requiring admin on the Studio.
- AWS/cloud deployment (the system-design doc's future path).
- Monitoring/alerting beyond LaunchAgent logs.
- Decommissioning the laptop dev environment (it stays as dev).

## Success criteria

- Laptop **off** → message the WhatsApp number → bot replies end-to-end.
- A killed API/worker/ngrok/DB process is **auto-restarted** by launchd.
- After a `team05` logout/login, the whole stack **comes back on its own**.
- The Meta callback URL is **stable** and never needs re-registering during normal
  operation.
