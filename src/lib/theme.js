// Global appearance preferences: theme mode (light/dark/system) and an optional
// custom page background color. Defaults to a light cream theme — never auto-dark
// unless the user explicitly chooses "system" or "dark".

const MODE_KEY = 'wc_theme';
const BG_KEY = 'wc_bg';

// Hex of the default cream/beige background (matches the --background token).
export const DEFAULT_BG_HEX = '#f7f3ea';

export function getThemeMode() {
  try { return localStorage.getItem(MODE_KEY) || 'light'; } catch { return 'light'; }
}

export function setThemeMode(mode) {
  try { localStorage.setItem(MODE_KEY, mode); } catch {}
  applyTheme();
}

export function getCustomBg() {
  try { return localStorage.getItem(BG_KEY) || ''; } catch { return ''; }
}

export function setCustomBg(color) {
  try { if (color) localStorage.setItem(BG_KEY, color); else localStorage.removeItem(BG_KEY); } catch {}
  applyTheme();
}

export function isDarkActive() {
  const mode = getThemeMode();
  if (mode === 'dark') return true;
  if (mode === 'system') {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
}

export function applyTheme() {
  if (typeof document === 'undefined') return;
  const isDark = isDarkActive();
  document.documentElement.classList.toggle('dark', isDark);
  const custom = getCustomBg();
  // The custom background is a light-mode personalization.
  document.body.style.backgroundColor = custom && !isDark ? custom : '';
}