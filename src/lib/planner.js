import {
  FileText, Award, HelpCircle, BookOpen, BookMarked,
  FolderKanban, CircleDot, CalendarClock, Flag, PartyPopper, Coffee,
  Presentation, Clock, FlaskConical
} from 'lucide-react';
import { format, parseISO, isValid, differenceInCalendarDays, addDays, addMonths, startOfDay } from 'date-fns';

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
  lecture: { label: 'Lecture', Icon: Presentation, chip: 'text-indigo-700 bg-indigo-50' },
  office_hours: { label: 'Office Hours', Icon: Clock, chip: 'text-emerald-700 bg-emerald-50' },
  lab: { label: 'Lab', Icon: FlaskConical, chip: 'text-cyan-700 bg-cyan-50' },
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

export const TYPE_COLORS = {
  assignment: '#6366f1', exam: '#e11d48', quiz: '#f59e0b', study: '#14b8a6',
  reading: '#0ea5e9', project: '#8b5cf6', lecture: '#6366f1', office_hours: '#10b981', lab: '#06b6d4', misc: '#94a3b8'
};

const QUOTES_SCHOOL = [
  { q: 'The secret of getting ahead is getting started.', a: 'Mark Twain' },
  { q: 'Study a little each day — cramming is a trap.', a: 'Working Buddy' },
  { q: 'Exams reward the steady, not the hurried.', a: 'Working Buddy' },
  { q: 'Understand today what others skim tonight.', a: 'Working Buddy' },
  { q: 'A syllabus is a map — follow it and you won’t get lost.', a: 'Working Buddy' },
  { q: 'Small, consistent reps beat one big night.', a: 'Working Buddy' }
];
const QUOTES_WORK = [
  { q: 'Done is better than perfect — ship the draft.', a: 'Sheryl Sandberg' },
  { q: 'Focus is the new productivity.', a: 'Working Buddy' },
  { q: 'Protect your deep-work hours like meetings.', a: 'Working Buddy' },
  { q: 'Clarity beats speed — know the goal before the grind.', a: 'Working Buddy' },
  { q: 'The professional prepares so the work looks easy.', a: 'Working Buddy' },
  { q: 'Inbox zero is a feeling, not a finish line.', a: 'Working Buddy' }
];
const QUOTES_PERSONAL = [
  { q: 'You don’t have to be great to start, but you have to start to be great.', a: 'Zig Ziglar' },
  { q: 'Little by little, one travels far.', a: 'J.R.R. Tolkien' },
  { q: 'Be kind to yourself — progress, not perfection.', a: 'Working Buddy' },
  { q: 'Rest is part of the work, not the opposite of it.', a: 'Working Buddy' },
  { q: 'Today, do one small thing your future self will thank you for.', a: 'Working Buddy' },
  { q: 'You’re allowed to go slow.', a: 'Working Buddy' }
];
const QUOTES_SHAREABLE = [
  { q: 'Alone we can go fast; together we can go far.', a: 'African Proverb' },
  { q: 'Many hands make light work.', a: 'Proverb' },
  { q: 'Shared plans become shared wins.', a: 'Working Buddy' },
  { q: 'Teamwork divides the task and multiplies the outcome.', a: 'Working Buddy' },
  { q: 'Small acts of coordination build big trust.', a: 'Working Buddy' },
  { q: 'When we plan together, we show up together.', a: 'Working Buddy' }
];

export function quoteOfDay(area, courses) {
  const pool = area === 'work' ? QUOTES_WORK
    : area === 'shareable' ? QUOTES_SHAREABLE
    : area === 'school' ? QUOTES_SCHOOL
    : QUOTES_PERSONAL;
  const day = Math.floor(Date.now() / 86400000);
  let q = pool[day % pool.length];
  if (area === 'school' && courses && courses.length) {
    const c = courses[day % courses.length];
    const name = c.code || c.name;
    const templated = [
      { q: `Stay on top of ${name} — small steady steps win exams.`, a: 'Working Buddy' },
      { q: `A little ${name} each day keeps the cram away.`, a: 'Working Buddy' },
      { q: `Knock out ${name} early, then breathe.`, a: 'Working Buddy' }
    ];
    if (day % 3 === 0) q = templated[day % templated.length];
  }
  return q;
}

export function taskTypeMeta(type) {
  const known = TASK_TYPE[type];
  if (known) return known;
  return { label: type || 'Misc', Icon: CircleDot, chip: 'text-slate-700 bg-slate-100' };
}

export function taskTypeColor(type) {
  if (TYPE_COLORS[type]) return TYPE_COLORS[type];
  let h = 0;
  for (const ch of String(type || 'misc')) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return `hsl(${h} 55% 55%)`;
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

export function toInputDate(v) {
  const d = parseDate(v);
  if (!d) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromInputDate(v) {
  if (!v) return null;
  return new Date(v + 'T12:00:00').toISOString();
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

// Expand a task into its occurrence dates (start-of-day) up to `genEnd`.
// Non-recurring tasks return their single due date (if any).
// For recurring tasks, occurrences run from repeat_start_date (or due_date) to
// repeat_end_date (or genEnd), respecting daily/weekly (with repeat_days)/monthly.
export function expandTaskOccurrences(task, genEnd) {
  if (!task.repeat || task.repeat === 'none') {
    const d = parseDate(task.due_date);
    return d ? [startOfDay(d)] : [];
  }
  const anchor = parseDate(task.repeat_start_date || task.due_date);
  if (!anchor) return [];
  const a0 = startOfDay(anchor);
  const end = task.repeat_end_date ? startOfDay(parseDate(task.repeat_end_date)) : startOfDay(genEnd);
  const cap = startOfDay(genEnd);
  const out = [];
  const wdays = (task.repeat_days && task.repeat_days.length) ? task.repeat_days.map(Number) : null;
  if (task.repeat === 'daily') {
    let d = a0, n = 0;
    while (d.getTime() <= end.getTime() && d.getTime() <= cap.getTime() && n < 1000) {
      if (!wdays || wdays.includes(d.getDay())) out.push(d);
      d = addDays(d, 1); n++;
    }
  } else if (task.repeat === 'weekly') {
    const days = wdays || [a0.getDay()];
    let d = a0, n = 0;
    while (d.getTime() <= end.getTime() && d.getTime() <= cap.getTime() && n < 7000) {
      if (days.includes(d.getDay())) out.push(d);
      d = addDays(d, 1); n++;
    }
  } else if (task.repeat === 'monthly') {
    const dom = a0.getDate();
    for (let i = 0; i < 36; i++) {
      const y = a0.getFullYear(), m = a0.getMonth() + i;
      const dim = new Date(y, m + 1, 0).getDate();
      const d = startOfDay(new Date(y, m, Math.min(dom, dim)));
      if (d.getTime() > end.getTime() || d.getTime() > cap.getTime()) break;
      if (!wdays || wdays.includes(d.getDay())) out.push(d);
    }
  }
  return out;
}