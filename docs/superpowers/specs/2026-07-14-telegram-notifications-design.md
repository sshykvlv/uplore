# Telegram Notifications — Design Spec

**Date:** 2026-07-14
**Status:** Approved design, ready for implementation planning
**Type:** Feature addition to existing project (Uplore)
**Repo:** `uplore` · **Our instance:** `ideas.norm.place`

## 1. Purpose

Uplore currently has no outbound notifications — a new idea or a new comment is
silent unless someone happens to check the site. This adds two Telegram
notifications, sent through the same bot (`TELEGRAM_BOT_TOKEN`) already used for
the Login Widget:

1. **New idea** → a message to a configured team chat/topic.
2. **New comment** → a personal DM to the idea's author (skipped if the author
   is replying to their own idea).

Since Uplore is a self-hostable open-source project, both features must degrade
gracefully for hosters who don't want them — no hardcoded chat IDs, no hard
dependency beyond the bot token that auth already requires.

**Non-goals (YAGNI for v1)**
- No notification preferences/opt-out UI. If a hoster doesn't set the team chat
  env var, team notifications are simply off. Personal DMs to the idea author
  are on by default whenever the author logged in via Telegram (no separate
  toggle — matches "you get notified about replies to your own stuff" as a
  reasonable default for a small idea board, not something to gate behind a
  settings page for v1).
- No delivery retries/queue. Fire-and-forget with a soft-fail log line.
- No notifications for votes/reactions — comments and new ideas only.
- No de-duplication of rapid-fire comments (each comment = one DM).

## 2. Configuration

New optional env vars (added to `.env.example`):

```
# ─── Notifications (optional) ────────────────────────────────────────────
# Chat ID to post new-idea announcements to. Leave unset to disable team
# notifications entirely (personal reply-DMs are unaffected).
TELEGRAM_TEAM_CHAT_ID=

# Optional forum topic (message_thread_id) within TELEGRAM_TEAM_CHAT_ID.
# Leave unset to post to the chat's General topic.
TELEGRAM_TEAM_THREAD_ID=
```

Personal reply-DMs need no new config — they reuse `TELEGRAM_BOT_TOKEN` and the
recipient's `users.provider_id` (already stored as the Telegram numeric id at
login), and `PUBLIC_URL` (already present) to build the idea link.

## 3. Components

### `src/lib/notify-telegram.ts` (new)

A single small helper, following the existing repo convention of one bot token
read straight from `process.env`:

```ts
async function sendTelegramMessage(chatId: string, text: string, threadId?: string): Promise<void>
```

- Plain text only (no `parse_mode` — matches house style of unformatted
  Telegram messages).
- POSTs to `https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/sendMessage`.
- Catches and logs (`console.error`) any failure — network error, bot blocked
  by user, invalid chat — and returns without throwing. Callers never await
  failure handling; a broken notification must never fail the API request that
  triggered it.

Two thin wrappers on top of `sendTelegramMessage`:

- `notifyNewIdea(idea: { id: number; body: string; authorName: string })` —
  no-ops immediately if `TELEGRAM_TEAM_CHAT_ID` is unset. Otherwise sends to
  the team chat/topic.
- `notifyNewComment(params: { ideaId, ideaAuthorProviderId, commenterName, commentBody })` —
  sends a DM to `ideaAuthorProviderId` as the chat id.

### Call sites

- `src/app/api/ideas/route.ts` `POST` — after the idea insert (and after image
  save, so the notification reflects the final state), call
  `notifyNewIdea(...)`. Don't `await` in a way that blocks the response
  longer than necessary — call it and let it settle in the background is fine
  since Next's route handler keeps the process alive until it resolves; a
  fire-and-forget `void notifyNewIdea(...)` (no await) is acceptable since
  failures are already swallowed internally.
- `src/app/api/ideas/[id]/comments/route.ts` `POST` — after the comment
  insert, look up the idea's author (`SELECT author_id, provider, provider_id
  FROM ideas JOIN users ON users.id = ideas.author_id WHERE ideas.id = ?`).
  If `author.provider === 'telegram'` and `author.id !== commenter.id`, call
  `notifyNewComment(...)`.

## 4. Message format

Plain text, short:

- New idea (to team chat):
  ```
  💡 New idea from {authorName}
  {body, truncated to ~200 chars}

  {PUBLIC_URL}/idea/{id}
  ```
- New comment (DM to idea author):
  ```
  💬 {commenterName} replied to your idea
  {comment body, truncated to ~200 chars}

  {PUBLIC_URL}/idea/{id}
  ```

`authorName`/`commenterName` = `display_name ?? username ?? 'Someone'`.

## 5. Error handling

- Missing `TELEGRAM_TEAM_CHAT_ID` → `notifyNewIdea` no-ops (not an error).
- Idea author isn't a Telegram user (e.g. dev-login) → `notifyNewComment`
  no-ops.
- Telegram API error (400/403, e.g. user never started a chat with the bot,
  or blocked it) → logged via `console.error`, swallowed. The comment/idea
  API call still returns 201 to the client regardless of notification outcome.

## 6. Testing / rollout

Uplore has no staging environment (single Docker container, direct-to-prod
deploys per its existing HANDOFF). Verification plan:
- Unit-test `notify-telegram.ts` helpers with a mocked `fetch` (no-op when env
  unset, correct payload shape when set, swallows a rejected fetch).
- Manual smoke test against the real bot before calling this done: post a test
  idea and a test reply from two different Telegram-linked accounts, confirm
  the team-chat message and the personal DM both arrive.
- Deploy directly to prod (matches existing project practice) after the smoke
  test passes locally against a temporary `.env.local` pointed at the real bot
  token but a personal test chat id (not the real team topic) to avoid
  spamming the team channel during testing.
