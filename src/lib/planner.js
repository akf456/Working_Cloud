import {
  FileText, Award, HelpCircle, BookOpen, BookMarked,
  FolderKanban, CircleDot, CalendarClock, Flag, PartyPopper, Coffee
} from 'lucide-react';
import { format, parseISO, isValid, differenceInCalendarDays } from 'date-fns';

export const COURSE_COLORS = [
  '#6366f1', '#ec4899', '#14b8a6', '#f59e0b',
  '#8b5cf6', '#ef4444', '#0ea5e9', '#84cc16'
];

export const PRIORITY = {
  high: { label: 'High', dot: 'bg-rose-500', chip: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200' },
  medium: { label: 'Medium', dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
  low: { label: 'Low', dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' }
};

export const TASK_TYPE = {
  assignment: { label: 'Assignment', Icon: FileText, chip: 'text-indigo-700 bg-indigo-50' },
  exam: { label: 'Exam', Icon: Award, chip: 'text-rose-700 bg-rose-50' },
  quiz: { label: 'Quiz', Icon: HelpCircle, chip: 'text-amber-700 bg-amber-50' },
  study: { label: 'Study', Icon: BookOpen, chip: 'text-teal-700 bg-teal-50' },
  reading: { label: 'Reading', Icon: BookMarked, chip: 'text-sky-700 bg-sky-50' },
  project: { label: 'Project', Icon: FolderKanban, chip: 'text-violet-700 bg-violet-50' },
  misc: { label: 'Misc', Icon: CircleDot, chip: 'text-slate-700 bg-slate-100' }
};

export const EVENT_TYPE = {
  exam: { label: 'Exam', dot: '#e11d48', chip: 'text-rose-700 bg-rose-50' },
  deadline: { label: 'Deadline', dot: '#f59e0b', chip: 'text-amber-700 bg-amber-50' },
  class: { label: 'Class', dot: '#6366f1', chip: 'text-indigo-700 bg-indigo-50' },
  study: { label: 'Study', dot: '#14b8a6', chip: 'text-teal-700 bg-teal-50' },
  event: { label: 'Event', dot: '#8b5cf6', chip: 'text-violet-700 bg-violet-50' },
  holiday: { label: 'Holiday', dot: '#84cc16', chip: 'text-lime-700 bg-lime-50' }
};

export const STATUS = {
  todo: { label: 'To Do', chip: 'text-slate-600 bg-slate-100' },
  in_progress: { label: 'In Progress', chip: 'text-blue-700 bg-blue-50' },
  done: { label: 'Done', chip: 'text-emerald-700 bg-emerald-50' }
};

export const QUOTES = [
  { q: 'The secret of getting ahead is getting started.', a: 'Mark Twain' },
  { q: 'You don’t have to be great to start, but you have to start to be great.', a: 'Zig Ziglar' },
  { q: 'It always seems impossible until it’s done.', a: 'Nelson Mandela' },
  { q: 'Success is the sum of small efforts repeated day in and day out.', a: 'Robert Collier' },
  { q: 'Don’t watch the clock; do what it does. Keep going.', a: 'Sam Levenson' },
  { q: 'The future depends on what you do today.', a: 'Mahatma Gandhi' },
  { q: 'Little by little, one travels far.', a: 'J.R.R. Tolkien' }
];

export function quoteOfDay() {
  const day = Math.floor(Date.now() / 86400000);
  return QUOTES[day % QUOTES.length];
}

export function parseDate(v) {
  if (!v) return null;
  const d = typeof v === 'string' ? parseISO(v) : new Date(v);
  return isValid(d) ? d : null;
}

export function fmt(v, f = 'MMM d, yyyy') {
  const d = parseDate(v);
  return d ? format(d, f) : '—';
}

export function fmtTime(v) {
  const d = parseDate(v);
  return d ? format(d, 'h:mm a') : '';
}

export function daysUntil(v) {
  const d = parseDate(v);
  if (!d) return null;
  return differenceInCalendarDays(d, new Date());
}

export function dueLabel(v) {
  const n = daysUntil(v);
  if (n === null) return '';
  if (n < 0) return `${Math.abs(n)}d overdue`;
  if (n === 0) return 'Due today';
  if (n === 1) return 'Due tomorrow';
  return `Due in ${n}d`;
}

export function toInputDateTime(v) {
  const d = parseDate(v);
  if (!d) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromInputDateTime(v) {
  if (!v) return null;
  return new Date(v).toISOString();
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export const DUE_ICONS = { overdue: CalendarClock, soon: Flag, done: PartyPopper, break: Coffee };

// Exam-aware priority score. Higher = more urgent. Overdue floats to the top;
// exams get a boost scaled by nearness so a due-tomorrow assignment still beats
// a far-off exam.
export function priorityScore(task) {
  const days = daysUntil(task.due_date);
  const d = days === null ? 30 : days;
  const overdue = d < 0;
  const ad = Math.max(d, 0);
  const urgency = 1 / (ad + 1);
  const pw = { high: 1.5, medium: 1, low: 0.75 }[task.priority] || 1;
  let s = urgency * pw;
  if (overdue) s += 2.5;
  if (task.type === 'exam') s += urgency * 0.6 + 0.15;
  return s;
}