'use client'

/**
 * Umami analytics helper.
 *
 * All functions are no-ops when NEXT_PUBLIC_UMAMI_URL / NEXT_PUBLIC_UMAMI_WEBSITE_ID
 * are not set. Never sends PII; cookieless by default (Umami's own behaviour).
 */

declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: Record<string, string | number | boolean>) => void
    }
  }
}

function track(event: string, data?: Record<string, string | number | boolean>) {
  if (typeof window === 'undefined') return
  if (!process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID || !process.env.NEXT_PUBLIC_UMAMI_URL) return
  window.umami?.track(event, data)
}

export const analytics = {
  ideaPosted: () => track('idea_posted'),
  vote: (direction: 'up' | 'down' | 'clear') => track('vote', { direction }),
  reactionAdded: (emoji: string) => track('reaction_added', { emoji }),
  commentPosted: () => track('comment_posted'),
  signin: (method: string) => track('signin', { method }),
}
