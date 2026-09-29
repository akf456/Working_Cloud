// Hidden-course visibility helpers. A hidden course disappears from every
// surface of its area (courses page, calendar, tasks, contacts, dashboard) —
// its tasks, events, contacts and notes are filtered out too, but nothing is
// deleted. Unhiding brings everything back.

export function hiddenCourseIds(courses) {
  return new Set((courses || []).filter((c) => c.hidden).map((c) => c.id));
}

// Drop records whose course_id points at a hidden course. Records without a
// course always stay visible.
export function withoutHidden(records, hiddenIds) {
  return (records || []).filter((r) => !r.course_id || !hiddenIds.has(r.course_id));
}