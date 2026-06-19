# Mac Studio 24/7 Chatbot Deployment — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run the WhatsApp insurance chatbot 24/7 on the Mac Studio (Postgres+pgvector, Redis, API, worker, Ollama, ngrok — all user-level under `team05`, kept alive by launchd), so the laptop can be off and no tunnel is ever connected by hand.

**Architecture:** Everything runs on the Studio over `localhost`. Per-user LaunchAgents (`RunAtLoad`+`KeepAlive`) supervise each service. A stable ngrok domain is registered with Meta once. Reproducible deploy artifacts (plists, env template, runbook) live in the repo under `deploy/macstudio/`; the Studio gets copies.

**Tech Stack:** macOS launchd, nvm/Node 20, Postgres 16 + pgvector (Postgres.app + source-built extension), Redis (source build), pnpm, Prisma, ngrok, Ollama.

**Spec:** `docs/superpowers/specs/2026-06-18-macstudio-24-7-deployment-design.md`

**Connection:** Studio = `team05@10.20.50.22` (key auth works; host `ai-c-ms.local`). "On the Studio" blocks run inside `ssh team05@10.20.50.22 '<cmd>'` or an interactive SSH session.

---

## Inputs to gather before starting

- [ ] **ngrok authtoken** — from the user's ngrok dashboard. Added on the Studio directly (Task 14) so it never passes through the agent.
- [ ] **ngrok static domain** — confirm the user has one (e.g. `something.ngrok-free.app`) or create one in the ngrok dashboard. Needed in Task 14.

---

## Phase 0 — Repo deploy artifacts (reproducible, committable)

### Task 1: Create the deploy directory + runbook

**Files:**
- Create: `deploy/macstudio/README.md`

- [ ] **Step 1: Write the runbook**

```markdown
# Mac Studio Deployment (team05, non-admin, user-level)

Runs the chatbot 24/7 on ai-c-ms.local. All services are user-level under
~team05 and supervised by launchd LaunchAgents (see *.plist here).

## Services & ports
- Ollama 11434 (desktop app, pre-existing)
- Postgres 5432 (Postgres.app binaries + source-built pgvector; data in ~/pgdata)
- Redis 6379 (source build in ~/opt/redis)
- API 3000 (node dist/main)
- Worker (node dist/worker)
- ngrok -> stable domain -> 3000

## Control
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.modefair.<svc>.plist
launchctl bootout   gui/$(id -u)/com.modefair.<svc>
launchctl kickstart -k gui/$(id -u)/com.modefair.<svc>   # restart
launchctl print gui/$(id -u)/com.modefair.<svc>          # status
Logs: ~/Library/Logs/chatbot-<svc>.{out,err}.log

## Reboot caveat
Auto-login is OFF (needs admin). After a reboot, log team05 in once; all
agents then start automatically.
```

- [ ] **Step 2: Commit**

```bash
cd /Users/modefair/whatsapp-blasting
git add deploy/macstudio/README.md
git commit -m "deploy(macstudio): add deployment runbook"
```

### Task 2: Create the LaunchAgent plist templates

**Files:**
- Create: `deploy/macstudio/com.modefair.postgres.plist`
- Create: `deploy/macstudio/com.modefair.redis.plist`
- Create: `deploy/macstudio/com.modefair.chatbot-api.plist`
- Create: `deploy/macstudio/com.modefair.chatbot-worker.plist`
- Create: `deploy/macstudio/com.modefair.ngrok.plist`

> Paths use `/Users/team05`. `__PG_BIN__`, `__STATIC_DOMAIN__` get filled at install time (Tasks 9/14). These are committed templates; the install step copies and substitutes.

- [ ] **Step 1: postgres plist**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>com.modefair.postgres</string>
  <key>ProgramArguments</key>
  <array>
    <string>__PG_BIN__/postgres</string>
    <string>-D</string><string>/Users/team05/pgdata</string>
    <string>-p</string><string>5432</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>/Users/team05/Library/Logs/chatbot-postgres.out.log</string>
  <key>StandardErrorPath</key><string>/Users/team05/Library/Logs/chatbot-postgres.err.log</string>
</dict></plist>
```

- [ ] **Step 2: redis plist**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>com.modefair.redis</string>
  <key>ProgramArguments</key>
  <array>
    <string>/Users/team05/opt/redis/src/redis-server</string>
    <string>--port</string><string>6379</string>
    <string>--dir</string><string>/Users/team05/opt/redis-data</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>/Users/team05/Library/Logs/chatbot-redis.out.log</string>
  <key>StandardErrorPath</key><string>/Users/team05/Library/Logs/chatbot-redis.err.log</string>
</dict></plist>
```

- [ ] **Step 3: chatbot-api plist** (`WorkingDirectory` = repo's apps/api so dotenv + dist resolve)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>com.modefair.chatbot-api</string>
  <key>ProgramArguments</key>
  <array><string>__NODE_BIN__</string><string>dist/main</string></array>
  <key>WorkingDirectory</key><string>/Users/team05/whatsapp-blasting/apps/api</string>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>ThrottleInterval</key><integer>10</integer>
  <key>StandardOutPath</key><string>/Users/team05/Library/Logs/chatbot-api.out.log</string>
  <key>StandardErrorPath</key><string>/Users/team05/Library/Logs/chatbot-api.err.log</string>
</dict></plist>
```

- [ ] **Step 4: chatbot-worker plist**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>com.modefair.chatbot-worker</string>
  <key>ProgramArguments</key>
  <array><string>__NODE_BIN__</string><string>dist/worker</string></array>
  <key>WorkingDirectory</key><string>/Users/team05/whatsapp-blasting/apps/api</string>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>ThrottleInterval</key><integer>10</integer>
  <key>StandardOutPath</key><string>/Users/team05/Library/Logs/chatbot-worker.out.log</string>
  <key>StandardErrorPath</key><string>/Users/team05/Library/Logs/chatbot-worker.err.log</string>
</dict></plist>
```

- [ ] **Step 5: ngrok plist**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>com.modefair.ngrok</string>
  <key>ProgramArguments</key>
  <array>
    <string>/Users/team05/opt/ngrok/ngrok</string>
    <string>http</string><string>3000</string>
    <string>--domain=__STATIC_DOMAIN__</string>
    <string>--log=stdout</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>/Users/team05/Library/Logs/chatbot-ngrok.out.log</string>
  <key>StandardErrorPath</key><string>/Users/team05/Library/Logs/chatbot-ngrok.err.log</string>
</dict></plist>
```

- [ ] **Step 6: Commit**

```bash
git add deploy/macstudio/com.modefair.*.plist
git commit -m "deploy(macstudio): add launchd LaunchAgent plists"
```

### Task 3: Capture environment values from the laptop

- [ ] **Step 1: Record the laptop's DB name, PG version, Node version**

```bash
cd /Users/modefair/whatsapp-blasting
grep -E "^DATABASE_URL" apps/api/.env          # note db name + user
docker exec wbs_postgres postgres --version     # confirm PG 16.x
node --version                                   # note major (target same on Studio)
```
Expected: a `postgresql://USER:PW@localhost:5432/DBNAME` URL, `postgres (PostgreSQL) 16.x`, and a Node version (e.g. v20.x). Record DBNAME and Node major for later tasks.

---

## Phase 1 — Studio toolchain + de-risk the hard part (user-level, no sudo)

### Task 4: Install nvm + Node + pnpm on the Studio

- [ ] **Step 1: Install nvm and Node**

On the Studio:
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"
nvm install 20    # match laptop major from Task 3
corepack enable
```

- [ ] **Step 2: Verify**

```bash
. "$HOME/.nvm/nvm.sh"; node --version; corepack pnpm --version
```
Expected: `v20.x` and a pnpm version. Record absolute node path: `echo "$(nvm which 20)"` → use as `__NODE_BIN__`.

### Task 5: Install Redis (source build) and verify

- [ ] **Step 1: Build Redis**

On the Studio:
```bash
mkdir -p ~/opt ~/opt/redis-data
cd ~/opt && curl -L https://download.redis.io/redis-stable.tar.gz | tar xz
mv redis-stable redis && cd redis && make -j4
```

- [ ] **Step 2: Verify it runs**

```bash
~/opt/redis/src/redis-server --port 6379 --dir ~/opt/redis-data --daemonize yes
~/opt/redis/src/redis-cli -p 6379 ping
```
Expected: `PONG`. Then stop it: `~/opt/redis/src/redis-cli -p 6379 shutdown nosave` (LaunchAgent manages it later).

### Task 6: Install Postgres 16 (Postgres.app) — DE-RISK GATE

> This is the riskiest task. Validate it fully before proceeding.

- [ ] **Step 1: Download Postgres.app into ~/Applications (no admin)**

On the Studio:
```bash
mkdir -p ~/Applications
cd /tmp && curl -L -o Postgres.dmg https://github.com/PostgresApp/PostgresApp/releases/download/v2.7.8/Postgres-2.7.8-16.dmg
hdiutil attach Postgres.dmg
cp -R "/Volumes/Postgres-2.7.8-16/Postgres.app" ~/Applications/
hdiutil detach "/Volumes/Postgres-2.7.8-16"
```

- [ ] **Step 2: Locate the PG 16 binaries (`__PG_BIN__`)**

```bash
ls ~/Applications/Postgres.app/Contents/Versions/16/bin/postgres && \
echo "PG_BIN=$HOME/Applications/Postgres.app/Contents/Versions/16/bin"
```
Expected: the `postgres` binary path prints. Record `__PG_BIN__`.

- [ ] **Step 3: initdb a user-owned cluster**

```bash
PG_BIN="$HOME/Applications/Postgres.app/Contents/Versions/16/bin"
"$PG_BIN/initdb" -D ~/pgdata -U team05 --encoding=UTF8
"$PG_BIN/pg_ctl" -D ~/pgdata -o "-p 5432" -l ~/pgdata/server.log start
"$PG_BIN/psql" -p 5432 -U team05 -d postgres -c "select version();"
```
Expected: `PostgreSQL 16.x ... aarch64-apple-darwin`.

**If Postgres.app download/structure differs (fallback):** use user-prefix Homebrew — `git clone https://github.com/Homebrew/brew ~/homebrew && ~/homebrew/bin/brew install postgresql@16`, then `__PG_BIN__=~/homebrew/opt/postgresql@16/bin`. Re-run Steps 3 onward.

### Task 7: Build + install pgvector against this Postgres — DE-RISK GATE

- [ ] **Step 1: Build pgvector with the Postgres.app pg_config**

On the Studio:
```bash
PG_BIN="$HOME/Applications/Postgres.app/Contents/Versions/16/bin"
cd /tmp && rm -rf pgvector && git clone --branch v0.8.0 https://github.com/pgvector/pgvector.git
cd pgvector && make PG_CONFIG="$PG_BIN/pg_config" && make install PG_CONFIG="$PG_BIN/pg_config"
```
Expected: compiles and installs `vector.so` + `vector.control` into the Postgres.app bundle (user-writable). No permission errors.

- [ ] **Step 2: Verify the extension loads**

```bash
PG_BIN="$HOME/Applications/Postgres.app/Contents/Versions/16/bin"
"$PG_BIN/psql" -p 5432 -U team05 -d postgres -c "CREATE EXTENSION IF NOT EXISTS vector; SELECT '[1,2,3]'::vector;"
```
Expected: `CREATE EXTENSION` then a `[1,2,3]` vector row. **This gate proves the whole user-level DB approach works.**

---

## Phase 2 — Database create + data migration

### Task 8: Create the app database + role

- [ ] **Step 1: Create role + DB matching the laptop's DATABASE_URL**

On the Studio (substitute USER/PW/DBNAME from Task 3):
```bash
PG_BIN="$HOME/Applications/Postgres.app/Contents/Versions/16/bin"
"$PG_BIN/psql" -p 5432 -U team05 -d postgres -c "CREATE ROLE \"USER\" LOGIN PASSWORD 'PW';"
"$PG_BIN/createdb" -p 5432 -U team05 -O "USER" DBNAME
"$PG_BIN/psql" -p 5432 -U team05 -d DBNAME -c "CREATE EXTENSION IF NOT EXISTS vector;"
```
Expected: `CREATE ROLE`, db created, `CREATE EXTENSION`.

### Task 9: Migrate data from the laptop

- [ ] **Step 1: Dump on the laptop**

```bash
cd /Users/modefair/whatsapp-blasting
docker exec -t wbs_postgres pg_dump -U USER -d DBNAME --no-owner --no-privileges -Fc -f /tmp/chatbot.dump
docker cp wbs_postgres:/tmp/chatbot.dump /tmp/chatbot.dump
```

- [ ] **Step 2: Copy to the Studio and restore**

```bash
scp /tmp/chatbot.dump team05@10.20.50.22:/tmp/chatbot.dump
ssh team05@10.20.50.22 'PG_BIN="$HOME/Applications/Postgres.app/Contents/Versions/16/bin"; "$PG_BIN/pg_restore" -p 5432 -U team05 -d DBNAME --no-owner --no-privileges /tmp/chatbot.dump'
```
Expected: restore completes (warnings about the `vector` extension already existing are OK).

- [ ] **Step 3: Verify row counts match the laptop**

```bash
# laptop
docker exec wbs_postgres psql -U USER -d DBNAME -tAc "select count(*) from chatbot_document_chunks;"
# studio
ssh team05@10.20.50.22 '"$HOME/Applications/Postgres.app/Contents/Versions/16/bin/psql" -p 5432 -U team05 -d DBNAME -tAc "select count(*) from chatbot_document_chunks;"'
```
Expected: identical counts. (Use the real chunk table name from `prisma/schema.prisma` if different.)

**Fallback (if vector restore fails):** skip the dump; after Task 11 run `pnpm --filter api db:migrate` (deploy) on a fresh DB, then re-run the KB ingest/publish scripts (see [[insurance-kb-pdf-extraction]] workflow). Conversation history is not preserved on this path.

---

## Phase 3 — App build + config + smoke test

### Task 10: Sync the repo on the Studio to feat/ai-chatbot

- [ ] **Step 1: Fetch + checkout**

On the Studio:
```bash
cd ~/whatsapp-blasting && git fetch origin && git checkout feat/ai-chatbot && git pull --ff-only
git log --oneline -1
```
Expected: HEAD matches the laptop's `feat/ai-chatbot` tip.

### Task 11: Install deps, build, sync schema

- [ ] **Step 1: Install + build**

```bash
cd ~/whatsapp-blasting && . "$HOME/.nvm/nvm.sh"
corepack pnpm install
corepack pnpm --filter api build
```
Expected: build produces `apps/api/dist/main.js` and `apps/api/dist/worker.js`.

- [ ] **Step 2: Apply migrations (production form)**

```bash
cd ~/whatsapp-blasting/apps/api && npx prisma migrate deploy
```
Expected: "All migrations have been applied" (or "already in sync" after the restore).

### Task 12: Create the Studio .env

- [ ] **Step 1: Copy the laptop .env, then repoint hosts**

```bash
scp /Users/modefair/whatsapp-blasting/apps/api/.env team05@10.20.50.22:/Users/team05/whatsapp-blasting/apps/api/.env
ssh team05@10.20.50.22 'chmod 600 ~/whatsapp-blasting/apps/api/.env'
```

- [ ] **Step 2: Edit on the Studio so all services are localhost + real mode**

Set in `~/whatsapp-blasting/apps/api/.env`:
```
DATABASE_URL=postgresql://USER:PW@localhost:5432/DBNAME
REDIS_URL=redis://localhost:6379
LLM_OLLAMA_URL=http://localhost:11434/v1
EMBEDDINGS_OLLAMA_URL=http://localhost:11434/v1
WHATSAPP_MOCK_MODE=false
CHATBOT_ENABLED=true
PORT=3000
```
Expected: `grep -E 'DATABASE_URL|REDIS_URL|OLLAMA_URL|MOCK_MODE' .env` shows localhost + false.

### Task 13: Foreground smoke test (before any LaunchAgent)

- [ ] **Step 1: Start Redis + Postgres (foreground/background) and the API**

```bash
~/opt/redis/src/redis-server --port 6379 --dir ~/opt/redis-data --daemonize yes
"$HOME/Applications/Postgres.app/Contents/Versions/16/bin/pg_ctl" -D ~/pgdata -o "-p 5432" -l ~/pgdata/server.log start
cd ~/whatsapp-blasting/apps/api && . "$HOME/.nvm/nvm.sh" && node dist/main &
sleep 8
```

- [ ] **Step 2: Verify health + dependencies reachable**

```bash
curl -s localhost:3000/api/health || curl -s localhost:3000/api
curl -s localhost:11434/api/tags | python3 -c "import json,sys;print('ollama models:',[m['name'] for m in json.load(sys.stdin)['models']])"
```
Expected: API responds (health/200), Ollama lists the models. Check `~/Library/Logs` not needed yet; watch console. Then `kill %1` the API and stop redis/pg (LaunchAgents take over next).

---

## Phase 4 — ngrok + Meta (stable URL, one-time registration)

### Task 14: Install ngrok + authtoken + static domain

- [ ] **Step 1: Install ngrok binary (user-level)**

On the Studio:
```bash
mkdir -p ~/opt/ngrok && cd ~/opt/ngrok
curl -L -o ngrok.zip https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-darwin-arm64.zip
unzip -o ngrok.zip && ./ngrok --version
```
Expected: ngrok version prints.

- [ ] **Step 2: Add authtoken (user runs this — secret stays off-agent)**

```bash
~/opt/ngrok/ngrok config add-authtoken <AUTHTOKEN>
```
Expected: "Authtoken saved".

- [ ] **Step 3: Smoke-test the tunnel against the (foreground) API**

Start the API again (Task 13 Step 1), then:
```bash
~/opt/ngrok/ngrok http 3000 --domain=<STATIC_DOMAIN> --log=stdout &
sleep 5
curl -s "https://<STATIC_DOMAIN>/api/webhooks/meta?hub.mode=subscribe&hub.verify_token=DESAMAZINGBLASTERANDCHATBOTWOW&hub.challenge=ok123"
```
Expected: echoes `ok123`. Then kill the foreground ngrok + API.

### Task 15: Register the stable URL with Meta (one-time)

- [ ] **Step 1: Register via Graph API**

From the laptop (has app secret):
```bash
ENV=/Users/modefair/whatsapp-blasting/apps/api/.env
SECRET=$(grep -E "^WHATSAPP_APP_SECRET=" "$ENV" | cut -d= -f2-)
curl -s -X POST "https://graph.facebook.com/v23.0/759679567234336/subscriptions" \
  -d object=whatsapp_business_account \
  -d "callback_url=https://<STATIC_DOMAIN>/api/webhooks/meta" \
  -d verify_token=DESAMAZINGBLASTERANDCHATBOTWOW \
  -d "fields=messages,history,message_template_components_update,message_template_quality_update,message_template_status_update" \
  -d "access_token=759679567234336|$SECRET"
```
Expected: `{"success":true}`. Verify with the GET `/subscriptions` (active=true, correct URL).

---

## Phase 5 — LaunchAgents (persistence)

### Task 16: Install + fill the plists on the Studio

- [ ] **Step 1: Copy templates + substitute placeholders**

```bash
scp deploy/macstudio/com.modefair.*.plist team05@10.20.50.22:/Users/team05/Library/LaunchAgents/
ssh team05@10.20.50.22 'cd ~/Library/LaunchAgents; \
  NODE_BIN="$(. ~/.nvm/nvm.sh; nvm which 20)"; \
  PG_BIN="$HOME/Applications/Postgres.app/Contents/Versions/16/bin"; \
  sed -i "" "s#__NODE_BIN__#$NODE_BIN#g" com.modefair.chatbot-*.plist; \
  sed -i "" "s#__PG_BIN__#$PG_BIN#g" com.modefair.postgres.plist; \
  sed -i "" "s#__STATIC_DOMAIN__#<STATIC_DOMAIN>#g" com.modefair.ngrok.plist'
```
Expected: no `__...__` tokens remain (`grep -r __ ~/Library/LaunchAgents/com.modefair.*` returns nothing).

### Task 17: Bootstrap all agents + verify they run

- [ ] **Step 1: Load them (postgres + redis first)**

```bash
ssh team05@10.20.50.22 'U=$(id -u); for s in postgres redis chatbot-api chatbot-worker ngrok; do launchctl bootstrap gui/$U ~/Library/LaunchAgents/com.modefair.$s.plist; done; sleep 10; for s in postgres redis chatbot-api chatbot-worker ngrok; do echo -n "$s: "; launchctl print gui/$U/com.modefair.$s 2>/dev/null | grep -m1 "state =" || echo missing; done'
```
Expected: each prints `state = running`.

- [ ] **Step 2: Verify the stack end to end (internal)**

```bash
ssh team05@10.20.50.22 'curl -s localhost:3000/api/health || curl -s localhost:3000/api; "$HOME/Applications/Postgres.app/Contents/Versions/16/bin/psql" -p 5432 -U team05 -d DBNAME -tAc "select 1"; ~/opt/redis/src/redis-cli ping'
```
Expected: API ok, `1`, `PONG`.

### Task 18: Crash-restart test (prove KeepAlive)

- [ ] **Step 1: Kill the API and confirm launchd restarts it**

```bash
ssh team05@10.20.50.22 'pkill -f "dist/main"; sleep 12; launchctl print gui/$(id -u)/com.modefair.chatbot-api | grep -m1 "state ="; curl -s -o /dev/null -w "api http %{http_code}\n" localhost:3000/api'
```
Expected: `state = running` again and an HTTP code (restarted within ~12s).

---

## Phase 6 — Cutover + validation + laptop standdown

### Task 19: End-to-end test with the laptop OFF

- [ ] **Step 1: Quit the laptop's production role**

On the laptop: stop the laptop API/worker/cloudflared (or simply close the laptop lid / shut down). Confirm the laptop is not serving.

- [ ] **Step 2: Send a real WhatsApp message**

From the test phone (+60183825227) message the business number. Watch Studio logs:
```bash
ssh team05@10.20.50.22 'tail -n 40 ~/Library/Logs/chatbot-worker.out.log'
```
Expected: an inbound is processed and a reply is sent (decision log line), and the phone receives the answer — with the laptop off.

### Task 20: Final persistence test + cleanup

- [ ] **Step 1: Logout/login resurrection (optional but recommended)**

Have team05 log out and back in on the Studio (or reboot + login). Then:
```bash
ssh team05@10.20.50.22 'for s in postgres redis chatbot-api chatbot-worker ngrok; do echo -n "$s: "; launchctl print gui/$(id -u)/com.modefair.$s 2>/dev/null | grep -m1 "state =" || echo missing; done'
```
Expected: all `state = running` without manual intervention.

- [ ] **Step 2: Decommission the laptop tunnels (only after Studio proven)**

On the laptop: stop cloudflared and the autossh Ollama tunnel; they're no longer needed for production. Keep the laptop repo/.env for dev.

- [ ] **Step 3: Update memory + the runbook with final values**

Record the static ngrok domain, `__PG_BIN__`, `__NODE_BIN__`, and DBNAME in `deploy/macstudio/README.md`; commit. Update the [[chatbot-whatsapp-live]] memory: production now on the Studio, stable URL, no manual tunnels.

---

## Rollback

At any point before Task 20 Step 2, revert by re-registering the Meta webhook to the laptop and restarting the laptop stack:
```bash
# re-point Meta back to the laptop's (running) tunnel URL
curl -s -X POST ".../759679567234336/subscriptions" -d "callback_url=https://<laptop-tunnel>/api/webhooks/meta" ... # as Task 15
```
The Studio agents can be left running (harmless) or booted out: `launchctl bootout gui/$(id -u)/com.modefair.<svc>`.

---

## Self-review notes

- **Spec coverage:** topology (Tasks 16-17), user-level Postgres+pgvector (6-7), Redis (5), Node (4), app build+migrate (10-11), env (12), ngrok+Meta once (14-15), LaunchAgents incl. KeepAlive/RunAtLoad (16-18), data migration (8-9), cutover+rollback (19-20 + Rollback), reboot caveat (README + Task 20). All covered.
- **Risk gates:** Tasks 6 and 7 are explicit de-risk gates with fallbacks (user-prefix brew; re-ingest KB) before downstream work depends on them.
- **Placeholders:** `USER/PW/DBNAME`, `<AUTHTOKEN>`, `<STATIC_DOMAIN>`, `__NODE_BIN__`, `__PG_BIN__` are real inputs discovered in Tasks 3/4/6/14, not unspecified work. Verify a value exists before each first use.
