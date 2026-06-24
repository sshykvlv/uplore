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
| `TELEGRAM_BOT_TOKEN` | No* | — | Bot token from @BotFather. Used **server-side** to verify the Login Widget callback signature. |
| `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` | No* | — | Bot @username **without the @** (e.g. `mybot`). Used to render the Login Widget button. Read at request time by the server component — no rebuild needed when changed. See note below. |
| `DATABASE_PATH` | No | `/data/uplore.db` (Docker) / `./data/uplore.db` (dev) | Path to the SQLite file. Directory is created automatically. |
| `UPLOADS_PATH` | No | `/data/uploads` (Docker) / `./uploads` (dev) | Directory for uploaded image files. |
| `PUBLIC_URL` | No | `http://localhost:3000` | Public-facing URL of your deployment (used for post-login redirects and OG tags). Must match the domain registered with BotFather `/setdomain`. |
| `ALLOW_DEV_LOGIN` | No | `false` | Set to `true` to enable username-only dev login. Always disabled in `NODE_ENV=production`. |
| `NEXT_PUBLIC_UMAMI_URL` | No | — | Base URL of your Umami instance (e.g. `https://stats.example.com`). Leave blank to disable analytics. |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | No | — | Website ID from your Umami dashboard. Required when `NEXT_PUBLIC_UMAMI_URL` is set. |

*Without both `TELEGRAM_BOT_TOKEN` **and** `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` only dev login is available (set `ALLOW_DEV_LOGIN=true`).

> **Note on `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`:** The login widget button is rendered by a Next.js **server component** that reads `process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` at request time, not at build time. This means you can change it in `.env` and restart the container without rebuilding the image. If you ever move any usage to a client component, remember that `NEXT_PUBLIC_*` vars **are** embedded at build time in client bundles — you would need to rebuild after changing them.

---

## Telegram Login Widget setup

1. Open [@BotFather](https://t.me/BotFather) and create a bot with `/newbot`.
2. Copy the **token** into `TELEGRAM_BOT_TOKEN` — used server-side to verify callback signatures.
3. Copy the **@username** (without `@`) into `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` — used to render the widget button.
4. Tell BotFather your domain: `/setdomain` → select your bot → enter `yourdomain.com` (must match the host in `PUBLIC_URL`). This is required for the widget to render — Telegram checks the domain against the registered one.
5. Set `PUBLIC_URL=https://yourdomain.com` in `.env`.
6. Restart the container (no rebuild needed).

Telegram requires HTTPS and a registered domain (`/setdomain`). For local testing use dev login instead.

---

## Reverse proxy (nginx)

The Docker container binds only to `127.0.0.1` so nginx must proxy to it.
Example server block:

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    # Allow image uploads up to 10 MB (the app enforces 5 MB per file, 6 files max)
    client_max_body_size 10m;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;

        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;

        # WebSocket support (for Next.js HMR in dev — harmless in prod)
        proxy_set_header   Upgrade           $http_upgrade;
        proxy_set_header   Connection        "upgrade";
    }
}
```

`X-Forwarded-Proto $scheme` is required so that the post-login redirect goes to `https://` rather than `http://`. Make sure `PUBLIC_URL` is set to `https://yourdomain.com`.

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
