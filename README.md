# Uplore

A Hacker-News-style idea board you can self-host in one command.

Post ideas, upvote or downvote them, react with emoji, and discuss in comments.
The best ideas float to the top by net score — no time-decay, no algorithm, just community signal.

> **Live instance:** [uplore.ykv.lv](https://uplore.ykv.lv)

---

## Features

- Feed sorted by net vote score (up/down voting, one per user per idea)
- Emoji reactions (Slack-style chips, separate from ranking)
- Flat comments on each idea
- Image attachments (up to 3 shown in feed; full gallery on detail page)
- Telegram Login Widget auth (pluggable adapter — GitHub/email can be added)
- Dev-login shortcut for local demos (`ALLOW_DEV_LOGIN=true`)
- Optional Umami analytics (cookieless, no PII)
- Single SQLite file — zero external dependencies
- One Docker container, one volume

---

## Quickstart (Docker)

```bash
# 1. Copy the example env file and fill in the required values
cp .env.example .env
# Edit .env: set SESSION_SECRET and (optionally) TELEGRAM_BOT_TOKEN

# 2. Start
docker compose up -d

# App is now running at http://localhost:3000
```

Data is persisted in a Docker volume (`uplore_data`) at `/data` inside the container — SQLite db at `/data/uplore.db`, uploads at `/data/uploads`.

To stop: `docker compose down`
To reset all data: `docker compose down -v`

---

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `SESSION_SECRET` | Yes | — | Random secret for signing session cookies. Generate: `openssl rand -base64 32` |
| `TELEGRAM_BOT_TOKEN` | No* | — | Bot token from @BotFather. Required to enable Telegram Login Widget. |
| `DATABASE_PATH` | No | `/data/uplore.db` (Docker) / `./data/uplore.db` (dev) | Path to the SQLite file. Directory is created automatically. |
| `UPLOADS_PATH` | No | `/data/uploads` (Docker) / `./uploads` (dev) | Directory for uploaded image files. |
| `PUBLIC_URL` | No | `http://localhost:3000` | Public-facing URL of your deployment (used for redirects and OG tags). |
| `ALLOW_DEV_LOGIN` | No | `false` | Set to `true` to enable username-only dev login. Always disabled in `NODE_ENV=production`. |
| `NEXT_PUBLIC_UMAMI_URL` | No | — | Base URL of your Umami instance (e.g. `https://stats.example.com`). Leave blank to disable analytics. |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | No | — | Website ID from your Umami dashboard. Required when `NEXT_PUBLIC_UMAMI_URL` is set. |

*Without `TELEGRAM_BOT_TOKEN` only dev login is available (set `ALLOW_DEV_LOGIN=true`).

---

## Telegram Login Widget setup

1. Open [@BotFather](https://t.me/BotFather) and create a bot with `/newbot`.
2. Copy the token into `TELEGRAM_BOT_TOKEN`.
3. Tell BotFather your domain: `/setdomain` → select your bot → enter `yourdomain.com`.
4. Set `PUBLIC_URL=https://yourdomain.com` in `.env`.
5. Restart the container.

Telegram requires HTTPS. For local testing use dev login instead.

---

## Local development

```bash
# Install dependencies
npm install

# Copy env
cp .env.example .env
# .env already has ALLOW_DEV_LOGIN=true — no bot token needed locally

# Start dev server with hot reload
npm run dev
# Open http://localhost:3000
# Use dev login with any username to create an account
```

---

## Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Database | SQLite via better-sqlite3 |
| Styling | Tailwind CSS |
| Auth | Telegram Login Widget (pluggable adapter) |
| Analytics | Umami (optional, cookieless) |
| Packaging | Docker (single container, standalone output) |

---

## License

MIT — see [LICENSE](LICENSE).
