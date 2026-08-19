/**
 * Telegram login entry point.
 *
 * Previously rendered the Telegram Login Widget (an injected <script> that
 * replaces itself with an iframe). That flow is retired in favour of
 * Telegram Login via OIDC: this is now a plain link that starts the
 * authorize redirect at /api/auth/telegram/start, which sets a pending
 * cookie and 302s to Telegram. No client-side JS or env-derived props needed.
 */
export default function TelegramLoginButton() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', minHeight: 48 }}>
      <a
        href="/api/auth/telegram/start"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          width: '100%',
          padding: '12px 20px',
          borderRadius: 20,
          background: '#2AABEE',
          color: '#fff',
          fontWeight: 600,
          fontSize: 15,
          textDecoration: 'none',
        }}
      >
        Log in with Telegram
      </a>
    </div>
  )
}
