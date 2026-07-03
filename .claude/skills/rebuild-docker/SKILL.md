---
name: rebuild-docker
description: Rebuild and restart the Fintrix app in Docker on port 3100 so the user can test changes. Use whenever the user wants to see/test changes in the running app, says the changes "não apareceram", or mentions "buildar/rebuild docker", "testar no 3100", or "subir o container". This is the user's real testing environment — always rebuild here after code changes.
---

# Rebuild the Fintrix Docker app (port 3100)

The user tests the app in **Docker on http://localhost:3100**, NOT via `npm run dev`. A running
container serves a **pre-built image** — code changes on disk do NOT appear until the image is
rebuilt. If the user says "não apareceu" / "não surtiu efeito", the cause is almost always a stale
container or an unrebuilt image. Always rebuild after making code changes.

## Environment map (all share one MySQL)

| What | Host port | Notes |
|------|-----------|-------|
| `fintrix_app` (Docker, prod build) | **3100** → 3000 | **The user's testing env.** Serves a built image. |
| `npm run dev` (Next dev) | 3000 | Hot-reloads on save. Optional, for fast iteration. |
| `fintrix_db` (MySQL) | 3310 → 3306 | Shared by BOTH the container and the dev server (`DATABASE_URL` → `localhost:3310`). |
| `fintrix_adminer` | 8090 | DB UI. |

Because the DB is shared, a migration applied from the host also affects the container, and vice versa.

## Rebuild + restart (the main action)

Run the build in the background and wait for the container to come back up:

```bash
cd "c:/Programação/Fintrix"
(docker compose up -d --build app > /tmp/fintrix-docker-build.log 2>&1 &)
```

Then wait for readiness (do NOT chain blind sleeps — poll):

```bash
until docker ps --filter "name=fintrix_app" --format '{{.Status}}' | grep -q "Up"; do
  grep -qi "error\|failed" /tmp/fintrix-docker-build.log && { tail -15 /tmp/fintrix-docker-build.log; break; }
  sleep 5
done
# confirm HTTP is answering
for i in $(seq 1 30); do
  [ "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3100/login)" = "200" ] && { echo "PRONTO 3100"; break; }
  sleep 2
done
```

`docker compose up -d --build app` also runs the `fintrix_migrate` container, which applies pending
Prisma migrations (`prisma migrate deploy`) before the app starts. So a schema change with a
committed migration is picked up automatically on rebuild.

## After rebuilding — tell the user

The app is a **PWA with a service worker** that caches aggressively. After a rebuild the user must:
1. Hard refresh: **Ctrl+Shift+R** on http://localhost:3100, or
2. If still stale: F12 → **Application → Service Workers → Unregister** → reload, or use an incognito tab.

Without this they may still see the old UI even though the container is new.

## Prisma migrations gotcha (shadow DB)

The `fintrix` DB user cannot create databases, so `prisma migrate dev` fails with **P3014 / P1010**
(shadow database). Do NOT use `migrate dev` against this DB. Instead:

1. Edit `prisma/schema.prisma`.
2. Create the migration folder + SQL by hand:
   `prisma/migrations/<YYYYMMDDHHMMSS>_<name>/migration.sql` (mirror the SQL style of existing
   migrations — plain `ALTER TABLE ...`).
3. Apply it: `npx prisma migrate deploy` (no shadow DB needed), then `npx prisma generate`.
4. On the next Docker rebuild, `fintrix_migrate` re-runs `migrate deploy` (idempotent).

## Do not

- Don't kill all node with `taskkill //F //IM node.exe` and walk away — it also stops the user's dev
  server. If you stop something, restart it or tell the user.
- Don't assume `npm run dev` (3000) is what the user sees — they test on **3100**.
