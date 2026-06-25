'use client'

import { useEffect, useRef } from 'react'

interface TelegramLoginButtonProps {
  botUsername: string
  /** Absolute callback URL the widget redirects to after auth. */
  authUrl: string
}

/**
 * Telegram Login Widget, embedded the SPA-safe way.
 *
 * The widget is a <script> from telegram.org that, when it runs, replaces
 * itself with the login-button iframe. A <script> injected via
 * dangerouslySetInnerHTML is parsed but NOT executed by the browser, so the
 * button only appeared on a full page load and silently vanished on client-side
 * navigation (clicking the header "Sign in" <Link>). Creating the script element
 * imperatively in an effect makes it execute on every mount, however the user
 * arrived at this page.
 */
export default function TelegramLoginButton({ botUsername, authUrl }: TelegramLoginButtonProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = ref.current
    if (!container) return

    // Clear any prior render (e.g. fast refresh / re-mount) to avoid duplicates.
    container.innerHTML = ''

    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.async = true
    script.setAttribute('data-telegram-login', botUsername)
    script.setAttribute('data-size', 'large')
    script.setAttribute('data-radius', '20')
    script.setAttribute('data-auth-url', authUrl)
    script.setAttribute('data-request-access', 'write')
    container.appendChild(script)

    return () => {
      container.innerHTML = ''
    }
  }, [botUsername, authUrl])

  return (
    <div
      ref={ref}
      style={{ display: 'flex', justifyContent: 'center', minHeight: 48 }}
    />
  )
}
