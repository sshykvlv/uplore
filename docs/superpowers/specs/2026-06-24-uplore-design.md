# Uplore — Design Spec

**Date:** 2026-06-24
**Status:** Approved design, ready for implementation planning
**Type:** New open-source project (standalone, meant to be self-hosted by others)
**Repo:** `uplore` · **Our instance:** `uplore.ykv.lv`

## 1. Purpose

A Hacker-News-style idea board. Any registered user posts a short idea; everyone
else upvotes/downvotes and comments. Ideas with the highest net score float to the
top. Born out of the pain of running idea voting inside a Telegram bot (`@nrmtmbot`),
which was awkward to use. Uplore is a clean, minimal web service that anyone can
self-host and hand to their own community.

The name **Uplore** is a coined word — *up* (rising to the top) + *explore/lore*
(discovering ideas and knowledge). No literal dictionary meaning; a brandable
neologism.

**Primary goals**
- Frictionless idea capture (one short text, optional images).
- Honest community ranking by net votes.
- Lightweight discussion via comments and emoji reactions.
- Trivial to self-host: one Docker container, one SQLite file.

**Non-goals (YAGNI for v1)**
- No tabs / multiple sort modes (Hot/New/Top). One feed, sorted by votes.
- No separate title field on ideas.
- No tags, categories, or user profile pages.
- No deeply nested comment threads.
- No multi-language UI (English only; i18n may come later).
- No time-decay ranking (this is feature voting, not news — good old ideas stay good).

## 2. Stack

| Concern | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | Familiar, SSR for SEO/share, single deployable |
| DB | SQLite via better-sqlite3 | One file, zero external deps — ideal for self-host |
| Styling | Tailwind CSS | Fast, consistent, easy to re-theme |
| Auth | Telegram Login Widget (v1) behind a pluggable adapter | Matches our world; adapter keeps GitHub/email addable |
| Analytics | Umami (self-hosted, `stats.ykv.lv`) | Cookieless, already running |
| Packaging | Docker (single container) | `docker run` and you're live |

## 3. Ranking

Single feed. No tabs, no time decay.

```
score = SUM(votes.value)        -- value ∈ {+1, −1}
ORDER BY score DESC, created_at DESC
```

Rationale: feature/idea voting is not news. A great idea from three months ago is
still great; time-decay would unfairly bury it. The "rich get richer" risk (top ideas
pinned forever) is accepted for v1; if it bites, a "Trending" view (recent vote
velocity) can be added later without schema changes.

## 4. Data model (SQLite)

```sql
users (
  id            INTEGER PK,
  provider      TEXT NOT NULL,         -- 'telegram' | 'github' | 'email' (v1: telegram)
  provider_id   TEXT NOT NULL,         -- stable id from the provider
  username      TEXT,                  -- @handle
  display_name  TEXT,
  avatar_url    TEXT,
  created_at    TEXT NOT NULL,
  UNIQUE(provider, provider_id)
)

ideas (
  id            INTEGER PK,
  author_id     INTEGER NOT NULL REFERENCES users(id),
  body          TEXT NOT NULL,         -- the idea, 1–2 sentences (plain text v1)
  created_at    TEXT NOT NULL
)

idea_images (
  id            INTEGER PK,
  idea_id       INTEGER NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  position      INTEGER NOT NULL DEFAULT 0
)

votes (
  idea_id       INTEGER NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  user_id       INTEGER NOT NULL REFERENCES users(id),
  value         INTEGER NOT NULL,      -- +1 or −1
  created_at    TEXT NOT NULL,
  PRIMARY KEY (idea_id, user_id)       -- one vote per user per idea
)

reactions (
  idea_id       INTEGER NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  user_id       INTEGER NOT NULL REFERENCES users(id),
  emoji         TEXT NOT NULL,
  created_at    TEXT NOT NULL,
  PRIMARY KEY (idea_id, user_id, emoji) -- one of each emoji per user per idea
)

comments (
  id            INTEGER PK,
  idea_id       INTEGER NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  author_id     INTEGER NOT NULL REFERENCES users(id),
  body          TEXT NOT NULL,
  created_at    TEXT NOT NULL
)
```

Score is computed (`SUM(votes.value)`), not stored — fine at this scale; can be
denormalized later if needed.

## 5. Voting behavior

- One vote per user per idea, value ±1.
- Click ↑ when not voted → +1. Click ↑ again → removes vote. Click ↓ → switches to −1.
- States (see `design-mocks/states.html`):
  - **not voted** — neutral capsule, grey arrows.
  - **upvoted** — ember accent (`#e8602c`) fill + up arrow.
  - **downvoted** — quiet grey fill, down arrow darkened (negative stays neutral, never "burns").

## 6. Reactions

Emoji reactions on each idea card, separate from the vote (do not affect ranking in v1).
Slack-style: existing reaction chips show `emoji + count`; an add-button (`🙂` +
label "React" when none yet, `🙂 ＋` when some exist) opens an emoji picker. One of
each emoji per user per idea.

## 7. Comments

Flat list, single level (no nested replies). Posting requires auth. Default
oldest-first ordering.

## 8. Images

- Optional, attached at idea creation. Stored as files; `idea_images.url` points to them.
- Feed card: right-side **tight row** of up to 3 square thumbnails; overflow collapses
  to a `+N` tile (see `design-mocks/index.html`, option D). Fixed footprint — never
  inflates card height.
- Detail page: full gallery / lightbox.

## 9. Auth (pluggable)

v1 ships **Telegram Login Widget** only, but behind a thin adapter so others can enable
more providers without touching core logic.

```ts
interface AuthProvider {
  id: 'telegram' | 'github' | 'email'
  // verifies the provider callback, returns a normalized identity
  verify(req): Promise<{ providerId: string; username?: string;
                         displayName?: string; avatarUrl?: string }>
}
```

Session: signed HTTP-only cookie (same pattern as our cabinet auth). Telegram widget
requires HTTPS + a bot token configured in BotFather with the site domain.

## 10. UI / visual language

Light theme, minimal, mobile-first. Reference mockups live in `design-mocks/`.

- **Accent:** ember orange `#e8602c` (single accent; easy to re-theme for forks).
- **Header:** floating rounded bar, slightly wider than content (~radius overhang),
  blurred white, subtle shadow — à la norm.place.
- **Buttons:** pill-shaped ("колбаски"). Primary = ember.
- **Vote control:** horizontal capsule, line-arrow glyphs (↑ ↓ with stem), neutral grey
  icons; per-arrow hover highlights colour only (no circle): ↑ ember, ↓ grey.
- **Idea card:** vote capsule top-left (aligned to first text line) · idea text (no
  title) · meta (`@user · time · 💬 N`) · reaction chips · optional image row on the right.
- **Controls** in header are equal height (36px).

## 11. Pages

1. **Feed** (`/`) — list of ideas sorted by score; header with `+ New idea`, sign-in/avatar.
2. **Idea detail** (`/idea/[id]`) — full text, image gallery, reactions, comments.
3. **New idea** — modal or page: text + image upload.
4. **Auth callback** — Telegram widget handling.

## 12. Analytics (Umami)

Events: `idea_posted`, `vote` (with direction), `reaction_added`, `comment_posted`,
`signin`. No PII beyond what Umami captures (cookieless).

## 13. Deployment

- Single Docker image; SQLite volume mounted for `uplore.db` + uploaded images.
- Our instance at `uplore.ykv.lv` (wildcard `*.ykv.lv` already resolves).
- Env: `TELEGRAM_BOT_TOKEN`, `SESSION_SECRET`, `UMAMI_*`, `PUBLIC_URL`.
- README with a one-command `docker run` quickstart for self-hosters.

## 14. Open decisions (non-blocking)

- Image storage: local volume (v1) vs object storage (later).
- Whether reactions ever influence ranking (v1: no).
- Logo glyph: current ✦ spark is a placeholder; revisit for an "up / surfacing" motif.

## 15. Out of scope for v1

Tabs/sort modes, tags, profiles, nested comments, i18n, time-decay ranking, moderation
tooling, email/GitHub auth (adapter ready, not wired).
