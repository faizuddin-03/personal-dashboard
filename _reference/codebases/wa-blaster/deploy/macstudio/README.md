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

## Resolved values (fill at install time)
- Node bin: (nvm which 20)
- PG bin:   ~/Applications/Postgres.app/Contents/Versions/16/bin
- ngrok static domain: <fill>
- DB name / user: <fill from apps/api/.env DATABASE_URL>
