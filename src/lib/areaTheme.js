import { AREAS } from '@/lib/areas';

function hexToHsl(hex) {
  if (!hex) return null;
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6) return null;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let hue = 0, sat = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    sat = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: hue = (g - b) / d + (g < b ? 6 : 0); break;
      case g: hue = (b - r) / d + 2; break;
      case b: hue = (r - g) / d + 4; break;
    }
    hue /= 6;
  }
  return `${Math.round(hue * 360)} ${Math.round(sat * 100)}% ${Math.round(l * 100)}%`;
}

// prefs = this user's saved theme object for the given area (any area is customizable).
export function areaThemeVars(area, prefs) {
  const base = AREAS[area]?.theme || {};
  const vars = { ...base };
  if (prefs) {
    const primary = hexToHsl(prefs.primary);
    const accent = hexToHsl(prefs.accent);
    const text = hexToHsl(prefs.text);
    const bg = hexToHsl(prefs.background);
    if (primary) { vars['--primary'] = primary; vars['--ring'] = primary; }
    if (accent) { vars['--accent'] = accent; vars['--secondary'] = accent; }
    if (text) vars['--foreground'] = text;
    if (bg) { vars['--background'] = bg; vars['--card'] = bg; }
  }
  return vars;
}

export function areaImage(area, prefs) {
  return prefs?.image || null;
}