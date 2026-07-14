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
