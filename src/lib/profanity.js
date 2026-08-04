// Basic clean-language filter for encouragement messages.
// Blocks common profanity/vulgarity while allowing free text and emojis.
const BLOCKED = [
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'dick', 'pussy', 'cunt',
  'whore', 'slut', 'dickhead', 'cock', 'motherfucker', 'wanker', 'twat',
  'bollocks', 'prick', 'arsehole', 'damn', 'crap'
];

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function containsProfanity(text) {
  if (!text) return false;
  const lower = ` ${text.toLowerCase()} `;
  return BLOCKED.some((w) => new RegExp(`(^|[^a-z])${escapeRe(w)}([^a-z]|$)`).test(lower));
}