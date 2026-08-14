// App version + changelog. Bump APP_VERSION here AND the <meta name="app-version"> in index.html
// together each time you publish, so the in-app "refresh to update" banner and What's New modal fire.
export const APP_VERSION = '2026.08.14-1';

export const CHANGELOG = [
  {
    version: '2026.08.14-1',
    date: 'Aug 14, 2026',
    title: 'New ways to plan',
    items: [
      "All Areas calendar now shows every task & event across your spaces, color-coded by area — completed items fade back so you can focus on what's left.",
      'Tasks page reordered: To-Do, then Events & Deadlines, then Done.',
      'Upload a document in any area — bring in a syllabus, a previous calendar, or any file and AI fills in your tasks, deadlines & contacts.',
      "New AI task breakdown — pick any task and let AI split it into small, motivating steps spread across your chosen days.",
      "What's New now pops up only when there's something new — past updates live in the bell icon."
    ]
  },
  {
    version: '2026.08.04-1',
    date: 'Aug 4, 2026',
    title: 'Fresh updates!',
    items: [
      'Apply a task\'s color to many tasks at once — filter by course or type to recolor a whole group in one tap.',
      'Recurring calendar events now repeat across every occurrence day, and any event can be duplicated.',
      'New shared Encouragement Board in the Shareables area — exchange kind notes with others.',
      'Share and Settings are now easy-to-find tabs right under Trash in every area.',
      'Toasts now auto-dismiss and can be closed manually.',
      'More responsive modals on phone and tablet.'
    ]
  }
];

const STORAGE_KEY = 'wb_last_seen_version';

export function getLastSeenVersion() {
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}

export function setLastSeenVersion(v) {
  try { localStorage.setItem(STORAGE_KEY, v); } catch { /* ignore */ }
}

// Returns changelog entries newer than the last version the user acknowledged.
// CHANGELOG is sorted newest-first.
export function getUnseenChangelog() {
  const seen = getLastSeenVersion();
  if (!seen) return CHANGELOG;
  const idx = CHANGELOG.findIndex((e) => e.version === seen);
  if (idx === -1) return CHANGELOG;
  return CHANGELOG.slice(0, idx);
}