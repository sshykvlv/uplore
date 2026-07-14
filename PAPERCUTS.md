# Papercuts

## 2026-07-14 15:05 — Sonnet 5
Deploying archive-ideas feature → `docker compose build` failed once (`npm run build` exit code 1 inside the builder stage, no error detail visible with `tail -10`), then succeeded immediately on retry with no code changes. Possible transient resource hiccup on the Hetzner box during the first attempt. Fix if it recurs: always capture full `--progress=plain` output (not `tail -N`) on a failed build before retrying, so the actual error is visible instead of just the generic "did not complete successfully" line.

## 2026-07-14 15:10 — Sonnet 5
Manually creating a table via `sqlite3 ... "CREATE TABLE ... DEFAULT (datetime(\"now\"))"` through an ssh one-liner failed with `default value of column [archived_at] is not constant` — double-quoted `"now"` gets parsed as an identifier reference by SQLite, not a string literal, when shell-escaping forces double quotes. Fix: write the SQL to a file (heredoc) and pipe it in (`sqlite3 db < file.sql`) instead of inlining it in a quoted shell string — avoids the quoting collision entirely.

## 2026-07-14 15:00 — Sonnet 5
New DB tables created via `CREATE TABLE IF NOT EXISTS` in `db.ts` don't actually exist on disk until some code path imports `@/lib/db` — and `/api/health` doesn't. After a fresh deploy, `curl /api/health` returning 200 does NOT prove new schema migrations have run; a public `curl https://.../` also doesn't touch it here because the ACCESS_CODE gate middleware intercepts and 307-redirects before any page component (and its `getFeedIdeas`/db import) executes. Verify schema changes by reading the actual sqlite file (`sqlite3 <volume-path>/uplore.db ".tables"`), not by inferring from an unrelated 200.

## 2026-07-14 11:30 — Sonnet 5
Repo's `package-lock.json`, regenerated with a plain `npm install` on macOS/arm64, silently omits `@emnapi/core@1.11.2`/`@emnapi/runtime@1.11.2` entries that the Docker build's `node:20-alpine` (linux/musl) target actually needs (a different rollup native-binary optional-dependency subtree pins a different emnapi version per platform). `npm ci` then fails inside the Docker build with EUSAGE "missing from lock file", but a full local relock on macOS reproduces the same broken lockfile — it's not a stale-lockfile problem, it's a genuine cross-platform npm resolution gap. Fix: regenerate the lockfile inside the actual target image (`docker run -v $(pwd):/app -w /app node:20-alpine npm install`) and commit that, not a Mac-generated one.
