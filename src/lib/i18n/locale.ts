/**
 * Server-side locale resolution.
 * Reads the `locale` cookie first, then Accept-Language, then falls back to 'en'.
 * This is a Server Component helper — never import into client components.
 */

import { cookies, headers } from 'next/headers'
import type { Locale, Dict, ClientDict } from './dictionaries'
import { dictionaries, clientDictionaries, LOCALES } from './dictionaries'

export type { Locale }
export { LOCALES }

const VALID: Set<string> = new Set<string>(LOCALES.map((l) => l.code))

/** Pick the best locale from an Accept-Language header value. */
function parseAcceptLanguage(header: string): Locale {
  const entries = header
    .split(',')
    .map((part) => {
      const [lang, q] = part.trim().split(';q=')
      return { lang: lang.trim().toLowerCase(), q: q ? parseFloat(q) : 1 }
    })
    .sort((a, b) => b.q - a.q)

  for (const { lang } of entries) {
    if (VALID.has(lang)) return lang as Locale
    const base = lang.split('-')[0]
    if (VALID.has(base)) return base as Locale
  }
  return 'en'
}

/** Resolve the active locale for the current request. */
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const fromCookie = cookieStore.get('locale')?.value
  if (fromCookie && VALID.has(fromCookie)) return fromCookie as Locale

  const headerStore = await headers()
  const acceptLang = headerStore.get('accept-language')
  if (acceptLang) return parseAcceptLanguage(acceptLang)

  return 'en'
}

/** Full server-side dictionary (contains functions — NOT for RSC props). */
export async function getDict(): Promise<Dict> {
  const locale = await getLocale()
  return dictionaries[locale]
}

/** Serializable client dictionary — safe to pass as RSC props to client components. */
export async function getClientDict(): Promise<ClientDict> {
  const locale = await getLocale()
  return clientDictionaries[locale]
}
