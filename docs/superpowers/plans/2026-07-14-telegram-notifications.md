# Telegram Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Send a Telegram message to a configured team chat when a new idea is posted, and a personal Telegram DM to an idea's author when someone comments on it.

**Architecture:** A single new module `src/lib/notify-telegram.ts` wraps the Telegram Bot `sendMessage` API (reusing the existing `TELEGRAM_BOT_TOKEN`) behind two fire-and-forget, soft-failing functions. The two existing POST route handlers (`/api/ideas`, `/api/ideas/[id]/comments`) call these functions after their DB insert. Team notifications are opt-in via a new `TELEGRAM_TEAM_CHAT_ID` env var; personal DMs need no new config since they reuse data already stored at login.

**Tech Stack:** Next.js 14 (App Router) API routes, better-sqlite3, native `fetch`, Vitest (new — this repo has no test runner yet).

**Design spec:** `docs/superpowers/specs/2026-07-14-telegram-notifications-design.md`

---

### Task 1: Add Vitest test runner

This repo currently has zero test infrastructure. Add the minimum needed to unit-test the notification module.

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install vitest**

Run: `npm install --save-dev vitest@^4.1.10`

- [ ] **Step 2: Add the `test` script**

Edit `package.json` `scripts` block to:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test": "vitest run"
},
```

- [ ] **Step 3: Create the Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
  },
})
```

- [ ] **Step 4: Verify the runner works with a throwaway test**

Create a temporary file `src/lib/__smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest'

describe('smoke', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2)
  })
})
```

Run: `npm test`
Expected: `1 passed`

Delete `src/lib/__smoke.test.ts` (it was only to confirm the runner works — Task 2 adds the real tests).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "test: add Vitest as the test runner"
```

---

### Task 2: `notify-telegram.ts` — new-idea notification (TDD)

**Files:**
- Create: `src/lib/notify-telegram.ts`
- Test: `src/lib/notify-telegram.test.ts`

- [ ] **Step 1: Write the failing tests for `notifyNewIdea`**

Create `src/lib/notify-telegram.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { notifyNewIdea } from './notify-telegram'

const ORIGINAL_ENV = { ...process.env }

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV }
})

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
  vi.unstubAllGlobals()
})

describe('notifyNewIdea', () => {
  it('does nothing when TELEGRAM_TEAM_CHAT_ID is unset', async () => {
    delete process.env.TELEGRAM_TEAM_CHAT_ID
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await notifyNewIdea({ id: 1, body: 'Test idea', authorName: 'Sasha' })

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('posts to the team chat with the idea link when configured', async () => {
    process.env.TELEGRAM_TEAM_CHAT_ID = '-100123'
    process.env.TELEGRAM_BOT_TOKEN = 'test-token'
    process.env.PUBLIC_URL = 'https://ideas.norm.place'
    delete process.env.TELEGRAM_TEAM_THREAD_ID
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => '' })
    vi.stubGlobal('fetch', fetchMock)

    await notifyNewIdea({ id: 42, body: 'Test idea', authorName: 'Sasha' })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.telegram.org/bottest-token/sendMessage')
    const payload = JSON.parse(options.body)
    expect(payload.chat_id).toBe('-100123')
    expect(payload.text).toContain('https://ideas.norm.place/idea/42')
    expect(payload.text).toContain('Sasha')
    expect(payload.message_thread_id).toBeUndefined()
  })

  it('includes message_thread_id when TELEGRAM_TEAM_THREAD_ID is set', async () => {
    process.env.TELEGRAM_TEAM_CHAT_ID = '-100123'
    process.env.TELEGRAM_TEAM_THREAD_ID = '5288'
    process.env.TELEGRAM_BOT_TOKEN = 'test-token'
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => '' })
    vi.stubGlobal('fetch', fetchMock)

    await notifyNewIdea({ id: 1, body: 'x', authorName: 'Sasha' })

    const payload = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(payload.message_thread_id).toBe(5288)
  })

  it('truncates long idea bodies to ~200 chars', async () => {
    process.env.TELEGRAM_TEAM_CHAT_ID = '-100123'
    process.env.TELEGRAM_BOT_TOKEN = 'test-token'
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => '' })
    vi.stubGlobal('fetch', fetchMock)

    const longBody = 'x'.repeat(300)
    await notifyNewIdea({ id: 1, body: longBody, authorName: 'Sasha' })

    const payload = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(payload.text.length).toBeLessThan(longBody.length)
    expect(payload.text).toContain('…')
  })

  it('swallows a fetch rejection without throwing', async () => {
    process.env.TELEGRAM_TEAM_CHAT_ID = '-100123'
    process.env.TELEGRAM_BOT_TOKEN = 'test-token'
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'))
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      notifyNewIdea({ id: 1, body: 'x', authorName: 'Sasha' }),
    ).resolves.toBeUndefined()
  })

  it('swallows a non-ok response without throwing', async () => {
    process.env.TELEGRAM_TEAM_CHAT_ID = '-100123'
    process.env.TELEGRAM_BOT_TOKEN = 'test-token'
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 403, text: async () => 'Forbidden' })
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      notifyNewIdea({ id: 1, body: 'x', authorName: 'Sasha' }),
    ).resolves.toBeUndefined()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module './notify-telegram'` (file doesn't exist yet)

- [ ] **Step 3: Implement `notify-telegram.ts` (new-idea half only)**

Create `src/lib/notify-telegram.ts`:

```ts
const TELEGRAM_API = 'https://api.telegram.org'
const MAX_SNIPPET_LENGTH = 200

async function sendTelegramMessage(chatId: string, text: string, threadId?: string): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) return

  try {
    const res = await fetch(`${TELEGRAM_API}/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        ...(threadId ? { message_thread_id: Number(threadId) } : {}),
      }),
    })
    if (!res.ok) {
      const body = await res.text()
      console.error(`[notify-telegram] sendMessage failed (${res.status}): ${body}`)
    }
  } catch (err) {
    console.error('[notify-telegram] sendMessage threw:', err)
  }
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text
}

function ideaUrl(ideaId: number): string {
  const base = process.env.PUBLIC_URL ?? 'http://localhost:3000'
  return `${base}/idea/${ideaId}`
}

export async function notifyNewIdea(idea: {
  id: number
  body: string
  authorName: string
}): Promise<void> {
  const chatId = process.env.TELEGRAM_TEAM_CHAT_ID
  if (!chatId) return

  const text = `💡 New idea from ${idea.authorName}\n${truncate(idea.body, MAX_SNIPPET_LENGTH)}\n\n${ideaUrl(idea.id)}`
  await sendTelegramMessage(chatId, text, process.env.TELEGRAM_TEAM_THREAD_ID)
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: `6 passed` (all `notifyNewIdea` tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/notify-telegram.ts src/lib/notify-telegram.test.ts
git commit -m "feat: add Telegram new-idea team-chat notification"
```

---

### Task 3: `notify-telegram.ts` — comment-reply notification (TDD)

**Files:**
- Modify: `src/lib/notify-telegram.ts`
- Modify: `src/lib/notify-telegram.test.ts`

- [ ] **Step 1: Write the failing tests for `notifyNewComment`**

Append to `src/lib/notify-telegram.test.ts`:

```ts
import { notifyNewComment } from './notify-telegram'

describe('notifyNewComment', () => {
  it('DMs the idea author using their provider_id as chat_id', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'test-token'
    process.env.PUBLIC_URL = 'https://ideas.norm.place'
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => '' })
    vi.stubGlobal('fetch', fetchMock)

    await notifyNewComment({
      ideaId: 7,
      ideaAuthorProviderId: '999888777',
      commenterName: 'Dana',
      commentBody: 'Love this!',
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(payload.chat_id).toBe('999888777')
    expect(payload.text).toContain('Dana replied to your idea')
    expect(payload.text).toContain('Love this!')
    expect(payload.text).toContain('https://ideas.norm.place/idea/7')
  })

  it('does nothing when TELEGRAM_BOT_TOKEN is unset', async () => {
    delete process.env.TELEGRAM_BOT_TOKEN
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await notifyNewComment({
      ideaId: 1,
      ideaAuthorProviderId: '123',
      commenterName: 'Dana',
      commentBody: 'x',
    })

    expect(fetchMock).not.toHaveBeenCalled()
  })
})
```

Update the top-level import line (merge with the existing `notifyNewIdea` import):

```ts
import { notifyNewIdea, notifyNewComment } from './notify-telegram'
```

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `npm test`
Expected: FAIL — `notifyNewComment is not exported` (2 failing, 6 still passing)

- [ ] **Step 3: Implement `notifyNewComment`**

Append to `src/lib/notify-telegram.ts`:

```ts
export async function notifyNewComment(params: {
  ideaId: number
  ideaAuthorProviderId: string
  commenterName: string
  commentBody: string
}): Promise<void> {
  const text = `💬 ${params.commenterName} replied to your idea\n${truncate(params.commentBody, MAX_SNIPPET_LENGTH)}\n\n${ideaUrl(params.ideaId)}`
  await sendTelegramMessage(params.ideaAuthorProviderId, text)
}
```

- [ ] **Step 4: Run tests to verify they all pass**

Run: `npm test`
Expected: `8 passed`

- [ ] **Step 5: Commit**

```bash
git add src/lib/notify-telegram.ts src/lib/notify-telegram.test.ts
git commit -m "feat: add Telegram comment-reply DM notification"
```

---

### Task 4: Wire `notifyNewIdea` into `POST /api/ideas`

**Files:**
- Modify: `src/app/api/ideas/route.ts:1-9` (imports), `src/app/api/ideas/route.ts:104` (return)

- [ ] **Step 1: Add the import**

In `src/app/api/ideas/route.ts`, add after the existing imports (after `import fs from 'fs'` on line 7):

```ts
import { notifyNewIdea } from '@/lib/notify-telegram'
```

- [ ] **Step 2: Fire the notification after images are saved**

In `src/app/api/ideas/route.ts`, replace:

```ts
  return NextResponse.json({ id: ideaId }, { status: 201 })
}
```

with:

```ts
  void notifyNewIdea({
    id: ideaId,
    body: bodyText,
    authorName: user.display_name ?? user.username ?? 'Someone',
  })

  return NextResponse.json({ id: ideaId }, { status: 201 })
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/app/api/ideas/route.ts
git commit -m "feat: notify team chat when a new idea is posted"
```

---

### Task 5: Wire `notifyNewComment` into `POST /api/ideas/[id]/comments`

**Files:**
- Modify: `src/app/api/ideas/[id]/comments/route.ts`

- [ ] **Step 1: Add the import**

In `src/app/api/ideas/[id]/comments/route.ts`, add after the existing imports (after `import { db } from '@/lib/db'` on line 3):

```ts
import { notifyNewComment } from '@/lib/notify-telegram'
```

- [ ] **Step 2: Replace the existence check with one that also fetches the author**

Replace:

```ts
  // Verify idea exists
  const idea = db.prepare('SELECT id FROM ideas WHERE id = ?').get(ideaId)
  if (!idea) return NextResponse.json({ error: 'Idea not found' }, { status: 404 })
```

with:

```ts
  // Verify idea exists, and fetch its author for the reply notification below
  const idea = db
    .prepare(
      `SELECT ideas.id AS id, users.id AS author_id, users.provider AS author_provider,
              users.provider_id AS author_provider_id
       FROM ideas
       JOIN users ON users.id = ideas.author_id
       WHERE ideas.id = ?`,
    )
    .get(ideaId) as
    | { id: number; author_id: number; author_provider: string; author_provider_id: string }
    | undefined
  if (!idea) return NextResponse.json({ error: 'Idea not found' }, { status: 404 })
```

- [ ] **Step 3: Fire the notification after the comment insert**

Replace:

```ts
  const result = db
    .prepare(
      `INSERT INTO comments (idea_id, author_id, body, created_at) VALUES (?, ?, ?, datetime('now'))`,
    )
    .run(ideaId, user.id, text)

  return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 })
}
```

with:

```ts
  const result = db
    .prepare(
      `INSERT INTO comments (idea_id, author_id, body, created_at) VALUES (?, ?, ?, datetime('now'))`,
    )
    .run(ideaId, user.id, text)

  if (idea.author_provider === 'telegram' && idea.author_id !== user.id) {
    void notifyNewComment({
      ideaId,
      ideaAuthorProviderId: idea.author_provider_id,
      commenterName: user.display_name ?? user.username ?? 'Someone',
      commentBody: text,
    })
  }

  return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 })
}
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add "src/app/api/ideas/[id]/comments/route.ts"
git commit -m "feat: DM idea author when someone comments on their idea"
```

---

### Task 6: Document the new env vars

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Add the notifications section**

In `.env.example`, insert after the `GATE_TOKEN` block and its shareable-link comment (before the `# ─── Analytics (optional) ───` section):

```
# ─── Notifications (optional) ────────────────────────────────────────────
# Chat ID to post new-idea announcements to. Leave unset to disable team
# notifications entirely (personal reply-DMs to idea authors are unaffected
# and need no extra config — they reuse TELEGRAM_BOT_TOKEN above).
TELEGRAM_TEAM_CHAT_ID=

# Optional forum topic (message_thread_id) within TELEGRAM_TEAM_CHAT_ID.
# Leave unset to post to the chat's General topic.
TELEGRAM_TEAM_THREAD_ID=

```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "docs: document TELEGRAM_TEAM_CHAT_ID / TELEGRAM_TEAM_THREAD_ID"
```

---

### Task 7: Manual smoke test and prod rollout

No staging environment exists for Uplore (single Docker container, direct-to-prod). This task verifies against the real bot using a private test chat before touching the real team topic.

**Files:** none (operational task)

- [ ] **Step 1: Run the full test suite one more time**

Run: `npm test`
Expected: `8 passed`

- [ ] **Step 2: Get a personal test chat id**

Message `@userinfobot` (or any "get my Telegram id" bot) from your own Telegram account to get your numeric id. This is your personal chat id — use it as `TELEGRAM_TEAM_CHAT_ID` for the smoke test so team-chat testing doesn't spam the real "Team" topic.

- [ ] **Step 3: Smoke test locally**

In `.env.local`, temporarily set:

```
TELEGRAM_BOT_TOKEN=<the real @nrmtmbot token>
TELEGRAM_TEAM_CHAT_ID=<your personal numeric id from Step 2>
PUBLIC_URL=http://localhost:3000
```

Run: `npm run dev`

- Log in via the Telegram widget (or `/api/auth/dev` if `ALLOW_DEV_LOGIN=true`), post a new idea.
  Expected: a Telegram DM arrives from `@nrmtmbot` on your account with the idea text and a `localhost:3000/idea/<id>` link.
- Log in as a **second** Telegram-linked account (a colleague, or a second Telegram account of your own) and comment on that idea.
  Expected: the **first** account receives a DM starting "💬 ... replied to your idea".
- Comment on your own idea as the same account that posted it.
  Expected: no DM (self-comment is skipped).

- [ ] **Step 4: Revert the test env vars**

Remove the temporary `TELEGRAM_TEAM_CHAT_ID` override from `.env.local` (or leave it unset locally — production config is separate).

- [ ] **Step 5: Deploy to production**

```bash
git checkout main
git pull --ff-only
git merge feat/telegram-notifications --no-edit
git push
```

On the Hetzner server (`ssh ykvlv@135.181.151.210`, `~/uplore`):

```bash
git pull
echo 'TELEGRAM_TEAM_CHAT_ID=-1003523697043' >> .env
echo 'TELEGRAM_TEAM_THREAD_ID=5288' >> .env
docker compose up -d --build
```

- [ ] **Step 6: Verify in production**

Post one real idea on `https://ideas.norm.place` and confirm the message lands in the Hermes "Team" topic (thread 5288). Then have a second team member comment on it and confirm the author gets the personal DM.

---

## Self-Review Notes

- **Spec coverage:** §2 config vars → Task 6. §3 `notify-telegram.ts` + call sites → Tasks 2–5. §4 message format → verified word-for-word in Task 2/3 test assertions. §5 error handling (missing config, non-Telegram author, API failure) → covered by the "does nothing" / "swallows" tests in Task 2 and the `author_provider === 'telegram'` guard in Task 5. §6 testing/rollout → Task 7.
- **No placeholders:** every step has literal code, exact commands, and expected output.
- **Type consistency:** `notifyNewIdea({ id, body, authorName })` and `notifyNewComment({ ideaId, ideaAuthorProviderId, commenterName, commentBody })` signatures are identical between their Task 2/3 implementations, their test calls, and their Task 4/5 call sites.
