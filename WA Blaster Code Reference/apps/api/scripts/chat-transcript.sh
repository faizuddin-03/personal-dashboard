#!/usr/bin/env bash
# Print the WhatsApp chatbot transcript (exact inbound/outbound messages).
# Usage:
#   ./scripts/chat-transcript.sh            # most recent conversation
#   ./scripts/chat-transcript.sh <convId>   # a specific conversation id
set -euo pipefail
cd "$(dirname "$0")/.."

DBURL=$(grep -E "^DATABASE_URL=" .env | cut -d= -f2- | tr -d '"')
DBNAME=$(echo "$DBURL" | sed -E 's#.*/([^?]+).*#\1#')
DBUSER=$(echo "$DBURL" | sed -E 's#.*//([^:]+):.*#\1#')
DBPW=$(echo "$DBURL"   | sed -E 's#.*//[^:]+:([^@]+)@.*#\1#')
CID=$(docker ps --format '{{.ID}} {{.Image}}' | grep -iE "postgres|pgvector" | awk '{print $1}' | head -1)

CONV="${1:-}"
if [ -z "$CONV" ]; then
  CONV=$(docker exec -e PGPASSWORD="$DBPW" "$CID" psql -U "$DBUSER" -d "$DBNAME" -tAc \
    "SELECT id FROM conversations ORDER BY last_inbound_at DESC NULLS LAST LIMIT 1")
fi

echo "Conversation: $CONV"
docker exec -e PGPASSWORD="$DBPW" "$CID" psql -U "$DBUSER" -d "$DBNAME" -P pager=off -c "
SELECT to_char(ts,'HH24:MI:SS') AS time, dir, body FROM (
  SELECT received_at AS ts, 'IN ' AS dir, body
    FROM conversation_inbound_messages WHERE conversation_id='$CONV'
  UNION ALL
  SELECT COALESCE(sent_at, created_at) AS ts, 'OUT' AS dir, body
    FROM conversation_outbound_messages WHERE conversation_id='$CONV'
) t ORDER BY ts;"
