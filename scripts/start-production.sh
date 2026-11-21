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

echo "[start] migrations applied, starting Next.js"
exec npm run start
