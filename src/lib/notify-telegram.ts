const TELEGRAM_API = 'https://api.telegram.org'
const MAX_SNIPPET_LENGTH = 200

async function sendTelegramMessage(
  chatId: string,
  text: string,
  threadId?: string,
  botToken = process.env.TELEGRAM_BOT_TOKEN,
): Promise<void> {
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
      console.error(`[notify-telegram] sendMessage failed (${res.status}): ${body.replaceAll(botToken, '<redacted>')}`)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[notify-telegram] sendMessage threw: ${message.replaceAll(botToken, '<redacted>')}`)
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

  // Team-chat posts go out via a separate bot identity so the login/DM bot
  // doesn't also have to be a member of the team's group chat. Falls back to
  // the login/DM bot for self-hosters who don't run a second bot.
  const notifyBotToken = process.env.TELEGRAM_NOTIFY_BOT_TOKEN ?? process.env.TELEGRAM_BOT_TOKEN
  const text = `💡 Новая идея от ${idea.authorName}:\n${truncate(idea.body, MAX_SNIPPET_LENGTH)}\n\n${ideaUrl(idea.id)}`
  await sendTelegramMessage(chatId, text, process.env.TELEGRAM_TEAM_THREAD_ID, notifyBotToken)
}

export async function notifyNewComment(params: {
  ideaId: number
  ideaAuthorProviderId: string
  commenterName: string
  commentBody: string
}): Promise<void> {
  const text = `💬 ${params.commenterName} комментирует вашу идею:\n${truncate(params.commentBody, MAX_SNIPPET_LENGTH)}\n\n${ideaUrl(params.ideaId)}`
  await sendTelegramMessage(params.ideaAuthorProviderId, text)
}
