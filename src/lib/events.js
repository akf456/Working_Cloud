import { base44 } from '@/api/base44Client';

// Event types that represent something you attend / show up for, so they can
// be checked off per occurrence. Excludes pure date markers (exam, deadline,
// holiday) which aren't "completed" — they just pass.
export const COMPLETABLE_EVENT_TYPES = ['class', 'study', 'event'];

export function isEventCompletable(event) {
  return !!event && COMPLETABLE_EVENT_TYPES.includes(event.type);
}

export function isEventDoneOnDay(event, dateStr) {
  return !!event && Array.isArray(event.completed_dates) && event.completed_dates.includes(dateStr);
}

// Toggle an event's completion for a specific occurrence day (yyyy-MM-dd).
// Works for both recurring and one-off events — one-off events simply mark
// their single start-date occurrence.
export async function toggleEventDayCompletion(event, dateStr) {
  const cur = Array.isArray(event.completed_dates) ? [...event.completed_dates] : [];
  const i = cur.indexOf(dateStr);
  if (i >= 0) cur.splice(i, 1); else cur.push(dateStr);
  await base44.entities.Event.update(event.id, { completed_dates: cur });
  return { ...event, completed_dates: cur };
}