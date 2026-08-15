import React, { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import SheetSelect from '@/components/SheetSelect';
import PullToRefresh from '@/components/PullToRefresh';
import { Plus, Search, Pencil, Trash2, Inbox, Download, CheckSquare, ChevronDown, Copy, CalendarClock, Flag } from 'lucide-react';
import { toggleTaskStatus, isTaskDoneOnDay, isRecurring } from '@/lib/tasks';
import { taskTypeMeta, PRIORITY, STATUS, dueLabel, daysUntil, parseDate, fmt, fmtTime, EVENT_TYPE } from '@/lib/planner';
import { format, startOfDay } from 'date-fns';
import { isEventCompletable, isEventDoneOnDay, toggleEventDayCompletion } from '@/lib/events';
import TaskModal from '@/components/TaskModal';
import EventModal from '@/components/EventModal';
import PriorityView from '@/components/PriorityView';
import { celebrate } from '@/lib/celebrate';
import { useToast } from '@/components/ui/use-toast';
import { trashItem } from '@/lib/trash';
import { downloadCSV } from '@/lib/exportCsv';
import OverdueBanner from '@/components/OverdueBanner';
import SubtaskList from '@/components/SubtaskList';
import { useArea } from '@/lib/AreaContext';
import { useI18n } from '@/lib/I18nContext';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalEvent, setModalEvent] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [q, setQ] = useState('');
  const [course, setCourse] = useState('all');
  const [status, setStatus] = useState('all');
  const [type, setType] = useState('all');
  const [searchParams, setSearchParams] = useSearchParams();
  const modalTask = searchParams.get('modal') === 'task';
  const taskIdParam = searchParams.get('id');
  const editTask = (modalTask && taskIdParam && taskIdParam !== 'new') ? tasks.find((t) => t.id === taskIdParam) || null : null;
  function openTaskModal(t) {
    setSearchParams((prev) => { const n = new URLSearchParams(prev); n.set('modal', 'task'); n.set('id', t?.id || 'new'); return n; });
  }
  function closeTaskModal() {
    setSearchParams((prev) => { const n = new URLSearchParams(prev); n.delete('modal'); n.delete('id'); return n; });
  }
  const [view, setView] = useState('status');
  const [priority, setPriority] = useState('all');
  const [due, setDue] = useState('all');
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const { area } = useArea();
  const { t } = useI18n();

  async function load() {
    setLoading(true);
    const [t, e, c] = await Promise.all([
      base44.entities.Task.filter({ area }, '-due_date', 300),
      base44.entities.Event.filter({ area }, '-start_date', 300),
      base44.entities.Course.filter({ area })
    ]);
    setTasks(t); setEvents(e); setCourses(c);
    setLoading(false);
  }
  useEffect(() => { load(); }, [area]);

  const courseMap = Object.fromEntries(courses.map((c) => [c.id, c]));

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (q && !t.title.toLowerCase().includes(q.toLowerCase())) return false;
      if (course !== 'all' && t.course_id !== course) return false;
      if (status === 'overdue') {
        const days = daysUntil(t.due_date);
        if (days === null || days >= 0 || t.status === 'done') return false;
      } else if (status !== 'all' && t.status !== status) return false;
      if (type !== 'all' && t.type !== type) return false;
      if (priority !== 'all' && t.priority !== priority) return false;
      if (due !== 'all') {
        const days = daysUntil(t.due_date);
        if (days === null) return false;
        if (due === 'overdue' && !(days < 0 && t.status !== 'done')) return false;
        if (due === 'today' && days !== 0) return false;
        if (due === 'week' && !(days >= 0 && days <= 7)) return false;
        if (due === 'month' && !(days >= 0 && days <= 30)) return false;
      }
      return true;
    });
  }, [tasks, q, course, status, type, priority, due]);

  const overdueItems = filtered.filter((t) => { const n = daysUntil(t.due_date); return n !== null && n < 0 && t.status !== 'done'; })
    .sort((a, b) => (parseDate(a.due_date)?.getTime() || 0) - (parseDate(b.due_date)?.getTime() || 0));
  const overdueIds = new Set(overdueItems.map((t) => t.id));

  const { toast } = useToast();
  async function toggle(t) {
    const todayStr = format(startOfDay(new Date()), 'yyyy-MM-dd');
    const wasDone = isTaskDoneOnDay(t, todayStr);
    setTasks((prev) => prev.map((x) => {
      if (x.id !== t.id) return x;
      if (isRecurring(x)) {
        const cur = Array.isArray(x.completed_dates) ? [...x.completed_dates] : [];
        const i = cur.indexOf(todayStr);
        if (i >= 0) cur.splice(i, 1); else cur.push(todayStr);
        return { ...x, completed_dates: cur };
      }
      return { ...x, status: wasDone ? 'todo' : 'done' };
    }));
    try {
      await toggleTaskStatus(t);
      if (!wasDone) toast({ title: 'Task completed! 🎉', description: celebrate() });
    } catch (e) {
      toast({ title: 'Could not update task', variant: 'destructive' });
    }
    load();
  }
  async function remove(t) {
    setTasks((prev) => prev.filter((x) => x.id !== t.id));
    try { await trashItem('Task', t, area); } catch (e) { toast({ title: 'Could not delete', variant: 'destructive' }); }
    load();
  }
  async function duplicate(t) {
    const { id, created_date, updated_date, created_by_id, ...rest } = t;
    await base44.entities.Task.create({ ...rest, title: `${t.title} (copy)` });
    load();
  }
  function toggleSelect(id) { setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; }); }
  function selectAll() { setSelected(new Set(filtered.map((t) => t.id))); }
  function clearSel() { setSelected(new Set()); }
  async function bulkTrash() {
    const ids = new Set(selected);
    setTasks((prev) => prev.filter((t) => !ids.has(t.id)));
    const items = tasks.filter((t) => ids.has(t.id));
    for (const t of items) await trashItem('Task', t, area);
    setSelected(new Set()); setSelectMode(false); load();
  }
  async function bulkStatus(s) {
    if (!selected.size) return;
    const ids = [...selected];
    setTasks((prev) => prev.map((t) => ids.includes(t.id) ? { ...t, status: s } : t));
    try { await base44.entities.Task.bulkUpdate(ids.map((id) => ({ id, status: s }))); } catch (e) { toast({ title: 'Could not update', variant: 'destructive' }); }
    setSelected(new Set()); load();
  }
  function exportTasks() {
    const rows = filtered.map((t) => ({ Title: t.title || '', Type: taskTypeMeta(t.type).label, Priority: t.priority || '', Status: t.status || '', Due: t.due_date ? fmt(t.due_date) : '', Group: courseMap[t.course_id]?.name || '' }));
    downloadCSV(`tasks-${area}.csv`, rows);
  }
  async function saveTask(data) {
    if (data.id) {
      setTasks((prev) => prev.map((t) => t.id === data.id ? { ...t, ...data } : t));
      try { await base44.entities.Task.update(data.id, data); } catch (e) { toast({ title: 'Could not save', variant: 'destructive' }); }
    } else {
      const temp = { ...data, area, id: `temp-${Date.now()}`, created_date: new Date().toISOString(), status: data.status || 'todo' };
      setTasks((prev) => [temp, ...prev]);
      try { await base44.entities.Task.create({ ...data, area }); } catch (e) { toast({ title: 'Could not create', variant: 'destructive' }); }
    }
    load();
  }
  async function applyColorToTasks(ids, color) {
    if (!ids.length) return;
    await base44.entities.Task.bulkUpdate(ids.map((id) => ({ id, color })));
    load();
  }

  function openEventModal(e) { setEditEvent(e || null); setModalEvent(true); }
  function closeEventModal() { setModalEvent(false); setEditEvent(null); }
  async function saveEvent(data) {
    if (data.id) {
      setEvents((prev) => prev.map((x) => x.id === data.id ? { ...x, ...data } : x));
      try { await base44.entities.Event.update(data.id, data); } catch (err) { toast({ title: 'Could not save', variant: 'destructive' }); }
    } else {
      const temp = { ...data, area, id: `temp-${Date.now()}`, created_date: new Date().toISOString() };
      setEvents((prev) => [temp, ...prev]);
      try { await base44.entities.Event.create({ ...data, area }); } catch (err) { toast({ title: 'Could not create', variant: 'destructive' }); }
    }
    load();
  }
  async function toggleEvent(e) {
    const d = parseDate(e.start_date) || new Date();
    const dateStr = format(startOfDay(d), 'yyyy-MM-dd');
    const wasDone = isEventDoneOnDay(e, dateStr);
    setEvents((prev) => prev.map((x) => {
      if (x.id !== e.id) return x;
      const cur = Array.isArray(x.completed_dates) ? [...x.completed_dates] : [];
      const i = cur.indexOf(dateStr);
      if (i >= 0) cur.splice(i, 1); else cur.push(dateStr);
      return { ...x, completed_dates: cur };
    }));
    try {
      await toggleEventDayCompletion(e, dateStr);
      if (!wasDone) toast({ title: 'Completed! 🎉', description: celebrate() });
    } catch (err) {
      toast({ title: 'Could not update', variant: 'destructive' });
    }
    load();
  }

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (!e.start_date) return false;
      if (q && !e.title.toLowerCase().includes(q.toLowerCase())) return false;
      if (course !== 'all' && e.course_id !== course) return false;
      if (type !== 'all' && e.type !== type) return false;
      if (due !== 'all') {
        const n = daysUntil(e.start_date);
        if (n === null) return false;
        if (due === 'overdue' && !(n < 0)) return false;
        if (due === 'today' && n !== 0) return false;
        if (due === 'week' && !(n >= 0 && n <= 7)) return false;
        if (due === 'month' && !(n >= 0 && n <= 30)) return false;
      }
      return true;
    }).sort((a, b) => (parseDate(a.start_date)?.getTime() || 0) - (parseDate(b.start_date)?.getTime() || 0));
  }, [events, q, course, type, due]);

  const todoTasks = filtered.filter((tk) => (tk.status === 'todo' || tk.status === 'in_progress') && !overdueIds.has(tk.id));
  const flaggedTasks = todoTasks.filter((tk) => tk.flag || tk.priority === 'high')
    .sort((a, b) => (parseDate(a.due_date)?.getTime() || Infinity) - (parseDate(b.due_date)?.getTime() || Infinity));
  const flaggedTaskIds = new Set(flaggedTasks.map((tk) => tk.id));
  const restToDo = todoTasks.filter((tk) => !flaggedTaskIds.has(tk.id))
    .sort((a, b) => (parseDate(a.due_date)?.getTime() || Infinity) - (parseDate(b.due_date)?.getTime() || Infinity));
  const flaggedEvents = filteredEvents.filter((e) => e.flag || e.type === 'exam' || e.type === 'deadline');
  const eventIsDone = (e) => {
    if (!isEventCompletable(e)) return false;
    const d = parseDate(e.start_date) || new Date();
    return isEventDoneOnDay(e, format(startOfDay(d), 'yyyy-MM-dd'));
  };
  const flaggedEventsActive = flaggedEvents.filter((e) => !eventIsDone(e));
  const flaggedEventsDone = flaggedEvents.filter((e) => eventIsDone(e));
  const flaggedCount = flaggedTasks.length + flaggedEventsActive.length;
  const doneTasks = filtered.filter((t) => t.status === 'done' && !overdueIds.has(t.id))
    .sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date));

  const row = (t) => <TaskRow key={t.id} task={t} course={courseMap[t.course_id]} selectMode={selectMode} selected={selected.has(t.id)} onSelect={() => toggleSelect(t.id)} onToggle={() => toggle(t)} onEdit={() => openTaskModal(t)} onDelete={() => remove(t)} onDuplicate={() => duplicate(t)} />;

  function renderGroup(key, label) {
    const items = filtered.filter((t) => t.status === key && !overdueIds.has(t.id)).sort((a, b) => {
      if (key === 'done') return new Date(b.updated_date) - new Date(a.updated_date);
      const da = parseDate(a.due_date)?.getTime() || Infinity;
      const db = parseDate(b.due_date)?.getTime() || Infinity;
      return da - db;
    });
    if (items.length === 0) return null;
    return (
      <CollapsibleGroup key={key} area={area} groupKey={key}
        badge={<span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS[key].chip}`}>{label}</span>}
        count={items.length}>
        {items.map(row)}
      </CollapsibleGroup>
    );
  }

  return (
    <PullToRefresh onRefresh={load} className="p-4 md:p-8 max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{t('tasks.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('tasks.subtitle')}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant={selectMode ? 'default' : 'outline'} onClick={() => { setSelectMode((m) => !m); setSelected(new Set()); }} className="rounded-xl"><CheckSquare className="w-4 h-4 mr-1.5" /> {selectMode ? t('tasks.done') : t('tasks.select')}</Button>
          <Button variant="outline" onClick={exportTasks} className="rounded-xl"><Download className="w-4 h-4 mr-1.5" /> {t('tasks.export')}</Button>
          <Button onClick={() => openTaskModal(null)} className="rounded-xl"><Plus className="w-4 h-4 mr-1.5" /> {t('tasks.newTask')}</Button>
        </div>
      </div>

      <OverdueBanner tasks={tasks} courses={courses} onDone={load} />

      <div className="inline-flex rounded-xl bg-muted p-1 mb-5 self-start">
        <button onClick={() => setView('status')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${view === 'status' ? 'bg-background shadow-sm text-indigo-600' : 'text-muted-foreground hover:text-foreground'}`}>{t('tasks.byStatus')}</button>
        <button onClick={() => setView('priority')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${view === 'priority' ? 'bg-background shadow-sm text-indigo-600' : 'text-muted-foreground hover:text-foreground'}`}>{t('tasks.priority')}</button>
      </div>

      {/* Filters */}
      <Card className="p-3 mb-5 flex flex-wrap gap-2">
        <div className="relative w-full md:flex-1 min-w-[180px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('tasks.search')} className="pl-9" />
        </div>
        {area === 'school' && (
          <div className="w-full md:w-36">
            <SheetSelect value={course} onValueChange={setCourse} placeholder="Course"
              options={[{ value: 'all', label: 'All courses' }, ...courses.map((c) => ({ value: c.id, label: c.code || c.name }))]} />
          </div>
        )}
        <div className="w-full md:w-36">
          <SheetSelect value={priority} onValueChange={setPriority} placeholder="Priority"
            options={[{ value: 'all', label: 'All priorities' }, { value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }]} />
        </div>
        <div className="w-full md:w-36">
          <SheetSelect value={due} onValueChange={setDue} placeholder="Due"
            options={[{ value: 'all', label: 'Any due date' }, { value: 'overdue', label: 'Overdue' }, { value: 'today', label: 'Due today' }, { value: 'week', label: 'Due this week' }, { value: 'month', label: 'Due this month' }]} />
        </div>
        <div className="w-full md:w-36">
          <SheetSelect value={status} onValueChange={setStatus} placeholder="Status"
            options={[{ value: 'all', label: 'All status' }, { value: 'overdue', label: 'Overdue' }, { value: 'todo', label: 'To Do' }, { value: 'in_progress', label: 'In Progress' }, { value: 'done', label: 'Done' }]} />
        </div>
        <div className="w-full md:w-36">
          <SheetSelect value={type} onValueChange={setType} placeholder="Type"
            options={[{ value: 'all', label: 'All types' }, ...[...new Set(tasks.map((t) => t.type).filter(Boolean))].map((k) => ({ value: k, label: taskTypeMeta(k).label }))]} />
        </div>
      </Card>

      {selectMode && (
        <div className="flex items-center gap-2 mb-5 flex-wrap rounded-xl border border-border bg-muted/40 px-3 py-2 animate-fade-in">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <Button size="sm" variant="ghost" onClick={selectAll}>Select all</Button>
          <div className="flex-1" />
          <Button size="sm" variant="outline" onClick={() => bulkStatus('todo')} disabled={!selected.size}>To Do</Button>
          <Button size="sm" variant="outline" onClick={() => bulkStatus('in_progress')} disabled={!selected.size}>In Progress</Button>
          <Button size="sm" variant="outline" onClick={() => bulkStatus('done')} disabled={!selected.size}>Done</Button>
          <Button size="sm" variant="destructive" onClick={bulkTrash} disabled={!selected.size}><Trash2 className="w-3.5 h-3.5 mr-1" /> Trash</Button>
          <Button size="sm" variant="ghost" onClick={clearSel}>Clear</Button>
        </div>
      )}

      {loading ? <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted/60 animate-pulse" />)}</div>
        : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
            <Inbox className="w-10 h-10 mb-3 opacity-50" />
            <p className="font-medium">No tasks here.</p>
            <p className="text-sm mt-1">Add one to get started.</p>
          </div>
        ) : view === 'priority' ? (
          <PriorityView tasks={filtered} events={[]} courses={courses} onToggle={toggle} />
        ) : (
          <div className="space-y-6">
            {overdueItems.length > 0 && (
              <CollapsibleGroup area={area} groupKey="overdue"
                badge={<span className="text-xs font-semibold px-2 py-0.5 rounded-full text-rose-700 bg-rose-50 ring-1 ring-rose-200">Overdue</span>}
                count={overdueItems.length}>
                {overdueItems.map(row)}
              </CollapsibleGroup>
            )}
            <CollapsibleGroup area={area} groupKey="todo"
              badge={<span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS.todo.chip}`}>To Do</span>}
              count={todoTasks.length}>
              {flaggedCount > 0 && (
                <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50/40 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full text-rose-700 bg-rose-50 ring-1 ring-rose-200"><Flag className="w-3 h-3" /> Flagged / High Priority</span>
                    <span className="text-xs text-muted-foreground">{flaggedCount}</span>
                  </div>
                  <div className="space-y-2">
                    {flaggedTasks.map(row)}
                    {flaggedEventsActive.map((e) => <EventRow key={e.id} event={e} course={courseMap[e.course_id]} onToggle={() => toggleEvent(e)} onEdit={() => openEventModal(e)} />)}
                  </div>
                </div>
              )}
              {restToDo.map(row)}
            </CollapsibleGroup>
            {(doneTasks.length + flaggedEventsDone.length) > 0 && (
              <CollapsibleGroup area={area} groupKey="done"
                badge={<span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS.done.chip}`}>Done</span>}
                count={doneTasks.length + flaggedEventsDone.length}>
                {doneTasks.map(row)}
                {flaggedEventsDone.map((e) => <EventRow key={e.id} event={e} course={courseMap[e.course_id]} onToggle={() => toggleEvent(e)} onEdit={() => openEventModal(e)} />)}
              </CollapsibleGroup>
            )}
          </div>
        )}

      <TaskModal open={modalTask} onClose={closeTaskModal} onSave={saveTask} task={editTask} courses={courses} area={area} tasks={tasks} onApplyColor={applyColorToTasks} />
      <EventModal open={modalEvent} onClose={closeEventModal} onSave={saveEvent} event={editEvent} courses={courses} area={area} defaultStart={editEvent?.start_date} />
    </PullToRefresh>
  );
}

function CollapsibleGroup({ area, groupKey, badge, count, children }) {
  const [open, setOpen] = useState(() => {
    try { return localStorage.getItem(`wb_tc_${area}_${groupKey}`) !== '0'; } catch { return true; }
  });
  function toggle() {
    const o = !open; setOpen(o);
    try { localStorage.setItem(`wb_tc_${area}_${groupKey}`, o ? '1' : '0'); } catch { /* ignore */ }
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

function EventRow({ event, course, onToggle, onEdit }) {
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

function TaskRow({ task, course, onToggle, onEdit, onDelete, onDuplicate, selectMode, selected, onSelect }) {
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
          <span className={`inline-flex items-center gap-1`}><span className={`w-1.5 h-1.5 rounded-full ${P.dot}`} />{P.label}</span>
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