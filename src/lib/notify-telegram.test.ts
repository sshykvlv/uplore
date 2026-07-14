import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { notifyNewIdea, notifyNewComment } from './notify-telegram'

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

  it('redacts the bot token from logged errors', async () => {
    process.env.TELEGRAM_TEAM_CHAT_ID = '-100123'
    process.env.TELEGRAM_BOT_TOKEN = 'super-secret-token'
    const fetchMock = vi.fn().mockRejectedValue(
      new Error('Failed to parse URL from https://api.telegram.org/botsuper-secret-token/sendMessage'),
    )
    vi.stubGlobal('fetch', fetchMock)
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await notifyNewIdea({ id: 1, body: 'x', authorName: 'Sasha' })

    const loggedArgs = errorSpy.mock.calls.flat().join(' ')
    expect(loggedArgs).not.toContain('super-secret-token')
    errorSpy.mockRestore()
  })

  it('redacts the bot token from a non-ok response body too', async () => {
    process.env.TELEGRAM_TEAM_CHAT_ID = '-100123'
    process.env.TELEGRAM_BOT_TOKEN = 'super-secret-token'
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => 'Forbidden: token super-secret-token is invalid',
    })
    vi.stubGlobal('fetch', fetchMock)
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await notifyNewIdea({ id: 1, body: 'x', authorName: 'Sasha' })

    const loggedArgs = errorSpy.mock.calls.flat().join(' ')
    expect(loggedArgs).not.toContain('super-secret-token')
    errorSpy.mockRestore()
  })
})

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
