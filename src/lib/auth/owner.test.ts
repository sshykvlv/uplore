import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { db } from '@/lib/db'
import { isOwner } from './owner'

const ORIGINAL_ENV = { ...process.env }

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV }
  db.exec('DELETE FROM users')
})

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
  db.exec('DELETE FROM users')
})

function insertUser(providerId: string): number {
  const result = db
    .prepare(
      `INSERT INTO users (provider, provider_id, username, display_name, avatar_url, created_at)
       VALUES ('telegram', ?, NULL, NULL, NULL, datetime('now'))`,
    )
    .run(providerId)
  return Number(result.lastInsertRowid)
}

describe('isOwner', () => {
  it('returns false when userId is null', () => {
    process.env.OWNER_TELEGRAM_ID = '742893'
    expect(isOwner(null)).toBe(false)
  })

  it('returns false when OWNER_TELEGRAM_ID is unset', () => {
    delete process.env.OWNER_TELEGRAM_ID
    const userId = insertUser('742893')
    expect(isOwner(userId)).toBe(false)
  })

  it('returns true when the user provider_id matches OWNER_TELEGRAM_ID', () => {
    process.env.OWNER_TELEGRAM_ID = '742893'
    const userId = insertUser('742893')
    expect(isOwner(userId)).toBe(true)
  })

  it('returns false when the user provider_id does not match OWNER_TELEGRAM_ID', () => {
    process.env.OWNER_TELEGRAM_ID = '742893'
    const userId = insertUser('999999')
    expect(isOwner(userId)).toBe(false)
  })

  it('returns false for a non-existent userId', () => {
    process.env.OWNER_TELEGRAM_ID = '742893'
    expect(isOwner(999999)).toBe(false)
  })
})
