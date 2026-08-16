import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Inbox, Download, CheckSquare, Trash2 } from 'lucide-react';
import { format, startOfDay } from 'date-fns';
import { STATUS, taskTypeMeta, daysUntil, parseDate } from '@/lib/planner';
import { isEventCompletable, isEventDoneOnDay } from '@/lib/events';
import PriorityView from '@/components/PriorityView';
import { downloadCSV } from '@/lib/exportCsv';
import { CollapsibleGroup, TaskRow, EventRow, ListFilters } from './shared';
import { useI18n } from '@/lib/I18nContext';

const EMPTY = { q: '', course: 'all', priority: 'all', due: 'all', status: 'all', type: 'all' };

export default function TasksSection({ tasks, events, courses, area, onToggle, onRemove, onDuplicate, onEditTask, onEditEvent, onToggleEvent, onBulkStatus, onBulkTrash }) {
  const { t } = useI18n();
  const [filters, setFilters] = useState(EMPTY);
  const [view, setView] = useState('status');
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const patch = (p) => setFilters((f) => ({ ...f, ...p }));

  const courseMap = Object.fromEntries(courses.map((c) => [c.id, c]));
  const typeOptions = useMemo(() => [...new Set(tasks.map((tk) => tk.type).filter(Boolean))].map((k) => ({ value: k, label: taskTypeMeta(k).label })), [tasks]);

  const filtered = useMemo(() => tasks.filter((tk) => {
    if (filters.q && !tk.title.toLowerCase().includes(filters.q.toLowerCase())) return false;
    if (filters.course !== 'all' && tk.course_id !== filters.course) return false;
    if (filters.status === 'overdue') { const d = daysUntil(tk.due_date); if (d === null || d >= 0 || tk.status === 'done') return false; }
    else if (filters.status !== 'all' && tk.status !== filters.status) return false;
    if (filters.type !== 'all' && tk.type !== filters.type) return false;
    if (filters.priority !== 'all' && tk.priority !== filters.priority) return false;
    if (filters.due !== 'all') {
      const d = daysUntil(tk.due_date); if (d === null) return false;
      if (filters.due === 'overdue' && !(d < 0 && tk.status !== 'done')) return false;
      if (filters.due === 'today' && d !== 0) return false;
      if (filters.due === 'week' && !(d >= 0 && d <= 7)) return false;
      if (filters.due === 'month' && !(d >= 0 && d <= 30)) return false;
    }
    return true;
  }), [tasks, filters]);

  const filteredEvents = useMemo(() => events.filter((e) => {
    if (!e.start_date) return false;
    if (filters.q && !e.title.toLowerCase().includes(filters.q.toLowerCase())) return false;
    if (filters.course !== 'all' && e.course_id !== filters.course) return false;
    if (filters.type !== 'all' && e.type !== filters.type) return false;
    if (filters.due !== 'all') {
      const d = daysUntil(e.start_date); if (d === null) return false;
      if (filters.due === 'overdue' && !(d < 0)) return false;
      if (filters.due === 'today' && d !== 0) return false;
      if (filters.due === 'week' && !(d >= 0 && d <= 7)) return false;
      if (filters.due === 'month' && !(d >= 0 && d <= 30)) return false;
    }
    return true;
  }).sort((a, b) => (parseDate(a.start_date)?.getTime() || 0) - (parseDate(b.start_date)?.getTime() || 0)), [events, filters]);

  const eventDoneOrPast = (e) => {
    const d = parseDate(e.start_date);
    const past = d && d.getTime() < startOfDay(new Date()).getTime();
    const done = isEventCompletable(e) && isEventDoneOnDay(e, format(startOfDay(d || new Date()), 'yyyy-MM-dd'));
    return done || past;
  };

  const activeTasks = filtered.filter((tk) => tk.status !== 'done').sort((a, b) => (parseDate(a.due_date)?.getTime() || Infinity) - (parseDate(b.due_date)?.getTime() || Infinity));
  const doneTasks = filtered.filter((tk) => tk.status === 'done').sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date));
  const activeEvents = filteredEvents.filter((e) => !eventDoneOrPast(e));
  const doneEvents = filteredEvents.filter((e) => eventDoneOrPast(e));

  function toggleSelect(id) { setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; }); }
  function selectAll() { setSelected(new Set(filtered.map((tk) => tk.id))); }
  function clearSel() { setSelected(new Set()); }
  function exportTasks() {
    const rows = filtered.map((tk) => ({ Title: tk.title || '', Type: taskTypeMeta(tk.type).label, Priority: tk.priority || '', Status: tk.status || '', Due: tk.due_date ? new Date(tk.due_date).toLocaleString() : '', Group: courseMap[tk.course_id]?.name || '' }));
    downloadCSV(`tasks-${area}.csv`, rows);
  }

  const row = (tk) => <TaskRow key={tk.id} task={tk} course={courseMap[tk.course_id]} selectMode={selectMode} selected={selected.has(tk.id)} onSelect={() => toggleSelect(tk.id)} onToggle={() => onToggle(tk)} onEdit={() => onEditTask(tk)} onDelete={() => onRemove(tk)} onDuplicate={() => onDuplicate(tk)} />;
  const eRow = (e) => <EventRow key={e.id} event={e} course={courseMap[e.course_id]} onToggle={() => onToggleEvent(e)} onEdit={() => onEditEvent(e)} />;

  const activeCount = activeTasks.length + activeEvents.length;
  const doneCount = doneTasks.length + doneEvents.length;
  const isEmpty = filtered.length === 0 && filteredEvents.length === 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="inline-flex rounded-xl bg-muted p-1">
          <button onClick={() => setView('status')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${view === 'status' ? 'bg-background shadow-sm text-indigo-600' : 'text-muted-foreground hover:text-foreground'}`}>{t('tasks.byStatus')}</button>
          <button onClick={() => setView('priority')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${view === 'priority' ? 'bg-background shadow-sm text-indigo-600' : 'text-muted-foreground hover:text-foreground'}`}>{t('tasks.priority')}</button>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant={selectMode ? 'default' : 'outline'} size="sm" onClick={() => { setSelectMode((m) => !m); setSelected(new Set()); }} className="rounded-xl"><CheckSquare className="w-4 h-4 mr-1.5" /> {selectMode ? t('tasks.done') : t('tasks.select')}</Button>
          <Button variant="outline" size="sm" onClick={exportTasks} className="rounded-xl"><Download className="w-4 h-4 mr-1.5" /> {t('tasks.export')}</Button>
        </div>
      </div>

      <ListFilters area={area} courses={courses} typeOptions={typeOptions} variant="task" values={filters} onPatch={patch} searchPlaceholder={t('tasks.search')} />

      {selectMode && (
        <div className="flex items-center gap-2 mb-5 flex-wrap rounded-xl border border-border bg-muted/40 px-3 py-2 animate-fade-in">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <Button size="sm" variant="ghost" onClick={selectAll}>Select all</Button>
          <div className="flex-1" />
          <Button size="sm" variant="outline" onClick={() => { onBulkStatus([...selected], 'todo'); clearSel(); }} disabled={!selected.size}>To Do</Button>
          <Button size="sm" variant="outline" onClick={() => { onBulkStatus([...selected], 'in_progress'); clearSel(); }} disabled={!selected.size}>In Progress</Button>
          <Button size="sm" variant="outline" onClick={() => { onBulkStatus([...selected], 'done'); clearSel(); }} disabled={!selected.size}>Done</Button>
          <Button size="sm" variant="destructive" onClick={() => { onBulkTrash([...selected]); clearSel(); }} disabled={!selected.size}><Trash2 className="w-3.5 h-3.5 mr-1" /> Trash</Button>
          <Button size="sm" variant="ghost" onClick={clearSel}>Clear</Button>
        </div>
      )}

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
          <Inbox className="w-10 h-10 mb-3 opacity-50" />
          <p className="font-medium">{t('lists.noTasks')}</p>
          <p className="text-sm mt-1">{t('lists.addFirst')}</p>
        </div>
      ) : view === 'priority' ? (
        <PriorityView tasks={filtered} events={filteredEvents} courses={courses} onToggle={onToggle} />
      ) : (
        <div className="space-y-6">
          <CollapsibleGroup storageKey={`wb_lists_tasks_active_${area}`}
            badge={<span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS.todo.chip}`}>{t('lists.tasksActive')}</span>}
            count={activeCount}>
            {activeTasks.map(row)}
            {activeEvents.map(eRow)}
          </CollapsibleGroup>
          {doneCount > 0 && (
            <CollapsibleGroup storageKey={`wb_lists_tasks_done_${area}`}
              badge={<span className="text-xs font-semibold px-2 py-0.5 rounded-full text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200">{t('lists.tasksDone')}</span>}
              count={doneCount}>
              {doneTasks.map(row)}
              {doneEvents.map(eRow)}
            </CollapsibleGroup>
          )}
        </div>
      )}
    </div>
  );
}