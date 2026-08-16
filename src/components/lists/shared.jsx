import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import SheetSelect from '@/components/SheetSelect';
import SubtaskList from '@/components/SubtaskList';
import { Search, Pencil, Trash2, Copy, ChevronDown, CalendarClock, ListChecks } from 'lucide-react';
import { format, startOfDay } from 'date-fns';
import { PRIORITY, taskTypeMeta, dueLabel, daysUntil, parseDate, fmt, fmtTime, EVENT_TYPE } from '@/lib/planner';
import { isTaskDoneOnDay } from '@/lib/tasks';
import { isEventCompletable, isEventDoneOnDay } from '@/lib/events';

export function CollapsibleGroup({ storageKey, badge, count, children, defaultOpen = true }) {
  const [open, setOpen] = useState(() => {
    try { return localStorage.getItem(storageKey) !== '0'; } catch { return defaultOpen; }
  });
  function toggle() {
    const o = !open; setOpen(o);
    try { localStorage.setItem(storageKey, o ? '1' : '0'); } catch { /* ignore */ }
  }
  return (
    <div>
      <button onClick={toggle} className="flex items-center gap-2 mb-2 w-full text-left">
        {badge}
        <span className="text-xs text-muted-foreground">{count}</span>
        <div className="flex-1 h-px bg-border/60" />
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? '' : '-rotate-90'}`} />
      </button>
      {open && <div className="space-y-2">{children}</div>}
    </div>
  );
}

export function ListFilters({ area, courses, typeOptions, variant = 'task', values, onPatch, searchPlaceholder = 'Search…' }) {
  const set = (k) => (v) => onPatch({ [k]: v });
  const showCourse = area === 'school';
  const showTaskFilters = variant !== 'note';
  return (
    <Card className="p-3 mb-5 flex flex-wrap gap-2">
      <div className="relative w-full md:flex-1 min-w-[180px]">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={values.q} onChange={(e) => set('q')(e.target.value)} placeholder={searchPlaceholder} className="pl-9" />
      </div>
      {showCourse && (
        <div className="w-full md:w-36">
          <SheetSelect value={values.course} onValueChange={set('course')} placeholder="Course"
            options={[{ value: 'all', label: 'All courses' }, ...courses.map((c) => ({ value: c.id, label: c.code || c.name }))]} />
        </div>
      )}
      {showTaskFilters && (
        <>
          <div className="w-full md:w-36">
            <SheetSelect value={values.priority} onValueChange={set('priority')} placeholder="Priority"
              options={[{ value: 'all', label: 'All priorities' }, { value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }]} />
          </div>
          <div className="w-full md:w-36">
            <SheetSelect value={values.due} onValueChange={set('due')} placeholder="Due"
              options={[{ value: 'all', label: 'Any due date' }, { value: 'overdue', label: 'Overdue' }, { value: 'today', label: 'Due today' }, { value: 'week', label: 'Due this week' }, { value: 'month', label: 'Due this month' }]} />
          </div>
          <div className="w-full md:w-36">
            <SheetSelect value={values.status} onValueChange={set('status')} placeholder="Status"
              options={[{ value: 'all', label: 'All status' }, { value: 'overdue', label: 'Overdue' }, { value: 'todo', label: 'To Do' }, { value: 'in_progress', label: 'In Progress' }, { value: 'done', label: 'Done' }]} />
          </div>
          <div className="w-full md:w-36">
            <SheetSelect value={values.type} onValueChange={set('type')} placeholder="Type"
              options={[{ value: 'all', label: 'All types' }, ...typeOptions]} />
          </div>
        </>
      )}
    </Card>
  );
}

export function TaskRow({ task, course, onToggle, onEdit, onDelete, onDuplicate, selectMode, selected, onSelect }) {
  const [open, setOpen] = useState(false);
  const T = taskTypeMeta(task.type);
  const P = PRIORITY[task.priority] || PRIORITY.medium;
  const todayStr = format(startOfDay(new Date()), 'yyyy-MM-dd');
  const done = isTaskDoneOnDay(task, todayStr);
  const n = daysUntil(task.due_date);
  const overdue = n !== null && n < 0 && !done;
  return (
    <div>
      <div className={`group flex items-center gap-3 rounded-xl border px-3 py-3 hover:bg-accent/30 transition ${task.flag ? 'border-rose-400 bg-rose-50' : overdue ? 'border-rose-300 bg-rose-50' : 'border-border/60'} ${done ? 'opacity-60' : ''} ${selected ? 'border-primary ring-2 ring-primary/40' : ''}`}>
        {task.color && <span className="w-1.5 self-stretch rounded-full shrink-0" style={{ backgroundColor: task.color }} />}
        {selectMode && <Checkbox checked={selected} onCheckedChange={onSelect} className="shrink-0" />}
        <Checkbox checked={done} onCheckedChange={onToggle} className="shrink-0" />
        <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${T.chip}`}><T.Icon className="w-4 h-4" /></span>
        <div className="min-w-0 flex-1">
          <p className={`font-medium text-sm truncate ${done ? 'line-through' : ''} ${overdue ? 'text-rose-700 font-bold' : ''}`}>{task.title}</p>
          <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground mt-0.5">
            <span className="inline-flex items-center gap-1"><span className={`w-1.5 h-1.5 rounded-full ${P.dot}`} />{P.label}</span>
            <span>· {T.label}</span>
            {course && <><span>·</span><span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: course.color }} />{course.code || course.name}</span></>}
            {task.source === 'syllabus' && <span className="text-indigo-500">· from syllabus</span>}
            {task.flag && <span className="text-rose-600 font-semibold">· {task.flag === 'manual' ? 'Flagged' : task.flag}</span>}
          </div>
        </div>
        {task.due_date && <span className={`text-xs font-semibold shrink-0 ${overdue ? 'text-rose-600' : 'text-muted-foreground'}`}>{dueLabel(task.due_date)}</span>}
        <button onClick={() => setOpen((o) => !o)} className="p-1.5 rounded-lg hover:bg-background text-muted-foreground hover:text-primary transition shrink-0" title="Subtasks">
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition shrink-0">
          <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-background text-muted-foreground hover:text-indigo-600" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
          <button onClick={onDuplicate} className="p-1.5 rounded-lg hover:bg-background text-muted-foreground hover:text-emerald-600" title="Duplicate"><Copy className="w-3.5 h-3.5" /></button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-background text-muted-foreground hover:text-rose-600" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>
      {open && <SubtaskList parent={task} />}
    </div>
  );
}

export function EventRow({ event, course, onToggle, onEdit }) {
  const E = EVENT_TYPE[event.type] || EVENT_TYPE.event;
  const completable = isEventCompletable(event);
  const d = parseDate(event.start_date) || new Date();
  const dateStr = format(startOfDay(d), 'yyyy-MM-dd');
  const done = completable && isEventDoneOnDay(event, dateStr);
  const n = daysUntil(event.start_date);
  const overdue = n !== null && n < 0;
  return (
    <div className={`group flex items-center gap-3 rounded-xl border px-3 py-3 hover:bg-accent/30 transition ${overdue ? 'border-rose-300 bg-rose-50' : 'border-border/60'} ${done ? 'opacity-60' : ''}`}>
      <span className="w-1.5 self-stretch rounded-full shrink-0" style={{ backgroundColor: E.dot }} />
      {completable && <Checkbox checked={done} onCheckedChange={onToggle} className="shrink-0" />}
      <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${E.chip}`}><CalendarClock className="w-4 h-4" /></span>
      <div className="min-w-0 flex-1">
        <p className={`font-medium text-sm truncate ${done ? 'line-through' : ''} ${overdue ? 'text-rose-700 font-bold' : ''}`}>{event.title}</p>
        <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground mt-0.5">
          <span>· {E.label}</span>
          {course && <><span>·</span><span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: course.color }} />{course.code || course.name}</span></>}
          {event.source === 'syllabus' && <span className="text-indigo-500">· from syllabus</span>}
          {event.location && <span>· {event.location}</span>}
        </div>
      </div>
      <span className={`text-xs font-semibold shrink-0 ${overdue ? 'text-rose-600' : 'text-muted-foreground'}`}>{fmt(event.start_date, 'MMM d')}{!event.all_day ? ` · ${fmtTime(event.start_date)}` : ''}</span>
      <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition shrink-0">
        <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-background text-muted-foreground hover:text-indigo-600" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
}

export function TodoListRow({ task, onToggle, onEdit, onDelete, onDuplicate }) {
  const [open, setOpen] = useState(false);
  const done = task.status === 'done';
  const n = daysUntil(task.due_date);
  const overdue = n !== null && n < 0 && !done;
  return (
    <div>
      <div className={`group flex items-center gap-3 rounded-xl border px-3 py-3 hover:bg-accent/30 transition ${overdue ? 'border-rose-300 bg-rose-50' : 'border-border/60'} ${done ? 'opacity-60' : ''}`}>
        {task.color && <span className="w-1.5 self-stretch rounded-full shrink-0" style={{ backgroundColor: task.color }} />}
        <Checkbox checked={done} onCheckedChange={onToggle} className="shrink-0" />
        <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-indigo-700 bg-indigo-50"><ListChecks className="w-4 h-4" /></span>
        <div className="min-w-0 flex-1">
          <p className={`font-medium text-sm truncate ${done ? 'line-through' : ''} ${overdue ? 'text-rose-700 font-bold' : ''}`}>{task.title}</p>
          {task.due_date && <p className={`text-xs mt-0.5 ${overdue ? 'text-rose-600 font-semibold' : 'text-muted-foreground'}`}>{dueLabel(task.due_date)}</p>}
        </div>
        <button onClick={() => setOpen((o) => !o)} className="p-1.5 rounded-lg hover:bg-background text-muted-foreground hover:text-primary transition shrink-0" title="Items">
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition shrink-0">
          <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-background text-muted-foreground hover:text-indigo-600" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
          <button onClick={onDuplicate} className="p-1.5 rounded-lg hover:bg-background text-muted-foreground hover:text-emerald-600" title="Duplicate"><Copy className="w-3.5 h-3.5" /></button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-background text-muted-foreground hover:text-rose-600" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>
      {open && <SubtaskList parent={task} />}
    </div>
  );
}