#!/bin/bash
# Bring up the FULL Mac Studio stack (run after any reboot) — also safe to run
# every few minutes from cron (idempotent: only starts what's down).
# cron has a minimal PATH, so set a full one (need /usr/sbin for lsof, nvm bin for node/corepack):
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$HOME/.nvm/versions/node/v22.22.3/bin:$PATH"
export HOME="${HOME:-/Users/team05}"
# Bring up the FULL Mac Studio stack. Idempotent.
#   infra: ollama, postgres, redis        app: API (:3000) + worker
#   dashboard: vite (:5173)  ->  ngrok collage-dorsal-mounting (account1)
#   chatbot:   API  (:3000)  ->  ngrok thaw-scallop-crispy   (account2, chatbot.yml)  [Meta webhook]
#   + caffeinate (block idle sleep)
PGB="$HOME/Applications/Postgres.app/Contents/Versions/16/bin"
NODE="$(. ~/.nvm/nvm.sh; nvm which 22)"
OLLAMA="$HOME/Applications/Ollama.app/Contents/Resources/ollama"
NG=~/opt/ngrok/ngrok
CFG_CHAT="$HOME/Library/Application Support/ngrok/chatbot.yml"
L=~/Library/Logs; mkdir -p "$L"
up() { curl -s --max-time 3 "$1" >/dev/null 2>&1; }

up localhost:11434/api/tags && echo "ollama: up" || { nohup "$OLLAMA" serve </dev/null >"$L/ollama.log" 2>&1 & disown; sleep 5; echo "ollama: started"; }
"$PGB/pg_ctl" -D ~/pgdata status >/dev/null 2>&1 && echo "postgres: up" || { "$PGB/pg_ctl" -D ~/pgdata -o "-p 5432" -l ~/pgdata/server.log start >/dev/null 2>&1; sleep 2; echo "postgres: started"; }
~/opt/redis/src/redis-cli -p 6379 ping >/dev/null 2>&1 && echo "redis: up" || { nohup ~/opt/redis/src/redis-server --port 6379 --dir ~/opt/redis-data </dev/null >"$L/chatbot-redis.out.log" 2>&1 & disown; sleep 1; echo "redis: started"; }
up localhost:3000/api/health && echo "api: up" || { (cd ~/whatsapp-blasting/apps/api && nohup "$NODE" dist/main </dev/null >"$L/chatbot-api.out.log" 2>&1 & disown); sleep 11; echo "api: started"; }
pgrep -f "dist/worker" >/dev/null 2>&1 && echo "worker: up" || { (cd ~/whatsapp-blasting/apps/api && nohup "$NODE" dist/worker </dev/null >"$L/chatbot-worker.out.log" 2>&1 & disown); sleep 2; echo "worker: started"; }
lsof -nP -iTCP:5173 -sTCP:LISTEN >/dev/null 2>&1 && echo "dashboard: up" || { (cd ~/whatsapp-blasting && . ~/.nvm/nvm.sh && nohup corepack pnpm --filter web dev </dev/null >"$L/dashboard-web.log" 2>&1 & disown); sleep 8; echo "dashboard: started"; }
pgrep -f "collage-dorsal-mounting" >/dev/null 2>&1 && echo "ngrok-dashboard: up" || { nohup "$NG" http --url=https://collage-dorsal-mounting.ngrok-free.dev 5173 --log=stdout </dev/null >"$L/dashboard-ngrok.log" 2>&1 & disown; sleep 6; echo "ngrok-dashboard: started"; }
pgrep -f "thaw-scallop-crispy" >/dev/null 2>&1 && echo "ngrok-chatbot: up" || { nohup "$NG" http --config "$CFG_CHAT" --url=https://thaw-scallop-crispy.ngrok-free.dev 3000 --log=stdout </dev/null >"$L/chatbot2-ngrok.log" 2>&1 & disown; sleep 6; echo "ngrok-chatbot: started"; }
pgrep -f "caffeinate -dimsu" >/dev/null 2>&1 && echo "caffeinate: up" || { nohup caffeinate -dimsu </dev/null >/dev/null 2>&1 & disown; echo "caffeinate: started"; }

echo "=== status ==="
curl -s -o /dev/null -w "  api(:3000): %{http_code}\n" localhost:3000/api/health
curl -s -o /dev/null -w "  dashboard(:5173): %{http_code}\n" localhost:5173/
