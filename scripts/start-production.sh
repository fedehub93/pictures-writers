#!/bin/sh
set -eu

attempt=0
until npx prisma migrate deploy; do
  attempt=$((attempt + 1))
  echo "[start] migrate failed (attempt ${attempt}/30), retrying in 5s..."
  if [ "$attempt" -ge 30 ]; then
    echo "[start] giving up after 30 attempts"
    exit 1
  fi
  sleep 5
done

echo "[start] migrations applied, ensuring the rendition manifest carries every address"
# Release A's server never reads Media.url, so the addresses it holds must be in
# Media.renditions before the first request. The command is idempotent and a
# no-op once the contraction has removed the column.
npm run media:backfill-manifest-urls

echo "[start] starting Next.js"
exec npm run start
