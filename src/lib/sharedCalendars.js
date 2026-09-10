// Shared calendars: the Shareables area supports multiple, fully isolated
// calendars. Tasks/Events in that area carry a calendar_id; a falsy value
// means the built-in "Main" calendar (keeps pre-existing data visible).

export const MAIN_CALENDAR_COLOR = '#f97316';

export function inCalendar(item, calendarId) {
  return calendarId ? item.calendar_id === calendarId : !item.calendar_id;
}

// Filter a list of tasks/events down to the active shared calendar (Shareables only).
export function filterByCalendar(items, area, calendarId) {
  if (area !== 'shareable') return items;
  return items.filter((i) => inCalendar(i, calendarId));
}

// Extra fields to stamp on newly created tasks/events so they land in the
// active shared calendar.
export function calendarScope(area, calendarId) {
  if (area !== 'shareable') return {};
  return { calendar_id: calendarId || null };
}

// Per-calendar key under user.share_tokens so each calendar gets its own link.
export function shareTokenKey(area, calendarId) {
  return area === 'shareable' ? `shareable:${calendarId || 'main'}` : area;
}