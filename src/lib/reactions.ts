/**
 * Canonical reaction emoji set — shared by the picker (client) and the
 * /react route (server validation) so the two can never drift out of sync.
 */
export const REACTION_EMOJIS = [
  // everyday reactions
  '🔥', '❤️', '👍', '🎉', '🚀', '💯',
  '✨', '⭐', '💡', '🙌', '👏', '💪',
  '😄', '😍', '🤩', '😎', '🤔', '👀',
  '😂', '😅', '🙃', '😮', '👎', '🙏',
  // creepy / weird block
  '💀', '👻', '🤡', '👽', '🤖', '😈',
  '👿', '🫠', '🥴', '🤯', '🫥', '🤪',
] as const
