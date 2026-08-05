import { base44 } from '@/api/base44Client';
import { format, startOfDay } from 'date-fns';

export function isRecurring(task) {
  return !!(task && task.repeat && task.repeat !== 'none');
}

// Whether a task is completed for a given day (yyyy-MM-dd). Recurring tasks
// track per-day completion in `completed_dates`; one-off tasks use `status`.
export function isTaskDoneOnDay(task, dateStr) {
  if (!task) return false;
  if (isRecurring(task)) {
    return Array.isArray(task.completed_dates) && task.completed_dates.includes(dateStr);
  }
  return task.status === 'done';
}

// Toggle a task's completion for a specific day. For recurring tasks this
// adds/removes the date in `completed_dates` (leaving other days untouched).
// For one-off tasks it toggles the overall status.
export async function toggleTaskDayCompletion(task, dateStr) {
  if (isRecurring(task)) {
    const cur = Array.isArray(task.completed_dates) ? [...task.completed_dates] : [];
    const i = cur.indexOf(dateStr);
    if (i >= 0) cur.splice(i, 1); else cur.push(dateStr);
    await base44.entities.Task.update(task.id, { completed_dates: cur });
    return { ...task, completed_dates: cur };
  }
  const nextStatus = task.status === 'done' ? 'todo' : 'done';
  await base44.entities.Task.update(task.id, { status: nextStatus });
  return { ...task, status: nextStatus };
}

// Used by the Tasks tab, which has no specific day — toggles today's
// occurrence for recurring tasks, or the overall status otherwise.
export async function toggleTaskStatus(task) {
  const todayStr = format(startOfDay(new Date()), 'yyyy-MM-dd');
  return toggleTaskDayCompletion(task, todayStr);
}