/**
 * Pluggable auth adapter — spec §9.
 *
 * Each provider validates its own callback and returns a normalised identity.
 * The core auth routes (`/api/auth/telegram`, etc.) call the matching provider,
 * then upsert a `users` row and issue a session cookie.
 */

export interface NormalisedIdentity {
  providerId: string
  username?: string
  displayName?: string
  avatarUrl?: string
}

export interface AuthProvider {
  id: 'telegram' | 'github' | 'email' | 'dev'
  verify(payload: Record<string, string>): Promise<NormalisedIdentity>
}

// Registry — add providers here or call registerProvider() at startup
const registry = new Map<string, AuthProvider>()

export function registerProvider(provider: AuthProvider): void {
  registry.set(provider.id, provider)
}

export function getProvider(id: string): AuthProvider | undefined {
  return registry.get(id)
}
