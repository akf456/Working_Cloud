import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { format, startOfDay } from 'date-fns';
import PullToRefresh from '@/components/PullToRefresh';
import TaskModal from '@/components/TaskModal';
import EventModal from '@/components/EventModal';
import NoteModal from '@/components/NoteModal';
import OverdueBanner from '@/components/OverdueBanner';
import TasksSection from '@/components/lists/TasksSection';
import TodoSection from '@/components/lists/TodoSection';
import NotesSection from '@/components/lists/NotesSection';
import { toggleTaskStatus, isTaskDoneOnDay, isRecurring } from '@/lib/tasks';
import { toggleEventDayCompletion, isEventDoneOnDay } from '@/lib/events';
import { celebrate } from '@/lib/celebrate';
import { useToast } from '@/components/ui/use-toast';
import { trashItem } from '@/lib/trash';
import { useArea } from '@/lib/AreaContext';
import { useI18n } from '@/lib/I18nContext';
import { parseDate } from '@/lib/planner';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('tasks');
  const [modalEvent, setModalEvent] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [noteModal, setNoteModal] = useState({ open: false, note: null });
  const [searchParams, setSearchParams] = useSearchParams();
  const { area } = useArea();
  const { t } = useI18n();
  const { toast } = useToast();

  const modalTask = searchParams.get('modal') === 'task';
  const taskIdParam = searchParams.get('id');
  const listParam = searchParams.get('list');
  const editTask = (modalTask && taskIdParam && taskIdParam !== 'new') ? tasks.find((tk) => tk.id === taskIdParam) || null : null;
  const taskListType = editTask?.list_type || (listParam === 'todo' ? 'todo' : 'task');

  function openTaskModal(tk, listType) {
    setSearchParams((prev) => { const n = new URLSearchParams(prev); n.set('modal', 'task'); n.set('id', tk?.id || 'new'); if (listType) n.set('list', listType); else n.delete('list'); return n; });
  }
  function closeTaskModal() {
    setSearchParams((prev) => { const n = new URLSearchParams(prev); n.delete('modal'); n.delete('id'); n.delete('list'); return n; });
  }
  function openEventModal(e) { setEditEvent(e || null); setModalEvent(true); }
  function closeEventModal() { setModalEvent(false); setEditEvent(null); }
  function openNoteModal(n) { setNoteModal({ open: true, note: n || null }); }
  function closeNoteModal() { setNoteModal({ open: false, note: null }); }

  async function load() {
    setLoading(true);
    const [tk, ev, c, nt] = await Promise.all([
      base44.entities.Task.filter({ area }, '-due_date', 300),
      base44.entities.Event.filter({ area }, '-start_date', 300),
      base44.entities.Course.filter({ area }),
      base44.entities.Note.filter({ area }, '-updated_date', 300)
    ]);
    setTasks(tk); setEvents(ev); setCourses(c); setNotes(nt);
    setLoading(false);
  }
  useEffect(() => { load(); }, [area]);

  const regularTasks = tasks.filter((tk) => tk.list_type !== 'todo');
  const todoLists = tasks.filter((tk) => tk.list_type === 'todo');

  async function toggle(tk) {
    const todayStr = format(startOfDay(new Date()), 'yyyy-MM-dd');
    const wasDone = isTaskDoneOnDay(tk, todayStr);
    setTasks((prev) => prev.map((x) => {
      if (x.id !== tk.id) return x;
      if (isRecurring(x)) {
        const cur = Array.isArray(x.completed_dates) ? [...x.completed_dates] : [];
        const i = cur.indexOf(todayStr);
        if (i >= 0) cur.splice(i, 1); else cur.push(todayStr);
        return { ...x, completed_dates: cur };
      }
      return { ...x, status: wasDone ? 'todo' : 'done' };
    }));
    try {
      await toggleTaskStatus(tk);
      if (!wasDone) toast({ title: 'Completed! 🎉', description: celebrate() });
    } catch (e) { toast({ title: 'Could not update', variant: 'destructive' }); }
    load();
  }
  async function toggleTodo(list) {
    const next = list.status === 'done' ? 'todo' : 'done';
    setTasks((prev) => prev.map((x) => x.id === list.id ? { ...x, status: next } : x));
    try { await base44.entities.Task.update(list.id, { status: next }); } catch (e) { toast({ title: 'Could not update', variant: 'destructive' }); }
    load();
  }
  async function remove(tk) {
    setTasks((prev) => prev.filter((x) => x.id !== tk.id));
    try { await trashItem('Task', tk, area); } catch (e) { toast({ title: 'Could not delete', variant: 'destructive' }); }
    load();
  }
  async function duplicate(tk) {
    const { id, created_date, updated_date, created_by_id, ...rest } = tk;
    await base44.entities.Task.create({ ...rest, title: `${tk.title} (copy)` });
    load();
  }
  async function saveTask(data) {
    if (data.id) {
      setTasks((prev) => prev.map((tk) => tk.id === data.id ? { ...tk, ...data } : tk));
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
  async function bulkStatus(ids, s) {
    if (!ids.length) return;
    setTasks((prev) => prev.map((tk) => ids.includes(tk.id) ? { ...tk, status: s } : tk));
    try { await base44.entities.Task.bulkUpdate(ids.map((id) => ({ id, status: s }))); } catch (e) { toast({ title: 'Could not update', variant: 'destructive' }); }
    load();
  }
  async function bulkTrash(ids) {
    if (!ids.length) return;
    const idSet = new Set(ids);
    setTasks((prev) => prev.filter((tk) => !idSet.has(tk.id)));
    const items = tasks.filter((tk) => idSet.has(tk.id));
    for (const tk of items) await trashItem('Task', tk, area);
    load();
  }
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
    } catch (err) { toast({ title: 'Could not update', variant: 'destructive' }); }
    load();
  }
  async function saveNote(data) {
    if (data.id) {
      setNotes((prev) => prev.map((n) => n.id === data.id ? { ...n, ...data } : n));
      try { await base44.entities.Note.update(data.id, data); } catch (e) { toast({ title: 'Could not save', variant: 'destructive' }); }
    } else {
      const temp = { ...data, area, id: `temp-${Date.now()}`, created_date: new Date().toISOString() };
      setNotes((prev) => [temp, ...prev]);
      try { await base44.entities.Note.create({ ...data, area }); } catch (e) { toast({ title: 'Could not create', variant: 'destructive' }); }
    }
    load();
  }
  async function removeNote(n) {
    setNotes((prev) => prev.filter((x) => x.id !== n.id));
    try { await base44.entities.Note.delete(n.id); } catch (e) { toast({ title: 'Could not delete', variant: 'destructive' }); }
    load();
  }

  const newLabel = tab === 'tasks' ? t('lists.newTask') : tab === 'todo' ? t('lists.newList') : t('lists.newNote');
  function handleNew() {
    if (tab === 'tasks') openTaskModal(null, 'task');
    else if (tab === 'todo') openTaskModal(null, 'todo');
    else openNoteModal(null);
  }

  const TABS = [
    { key: 'tasks', label: t('lists.tab.tasks') },
    { key: 'todo', label: t('lists.tab.todo') },
    { key: 'notes', label: t('lists.tab.notes') },
  ];

  return (
    <PullToRefresh onRefresh={load} className="p-4 md:p-8 max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{t('lists.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('lists.subtitle')}</p>
        </div>
        <Button onClick={handleNew} className="rounded-xl"><Plus className="w-4 h-4 mr-1.5" /> {newLabel}</Button>
      </div>

      <OverdueBanner tasks={regularTasks} courses={courses} onDone={load} />

      <div className="inline-flex rounded-xl bg-muted p-1 mb-5 self-start gap-1">
        {TABS.map((tb) => (
          <button key={tb.key} onClick={() => setTab(tb.key)} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${tab === tb.key ? 'bg-background shadow-sm text-indigo-600' : 'text-muted-foreground hover:text-foreground'}`}>{tb.label}</button>
        ))}
      </div>

      {loading ? <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted/60 animate-pulse" />)}</div> : (
        <>
          {tab === 'tasks' && (
            <TasksSection tasks={regularTasks} events={events} courses={courses} area={area}
              onToggle={toggle} onRemove={remove} onDuplicate={duplicate} onEditTask={(tk) => openTaskModal(tk, tk.list_type || 'task')} onEditEvent={openEventModal} onToggleEvent={toggleEvent} onBulkStatus={bulkStatus} onBulkTrash={bulkTrash} />
          )}
          {tab === 'todo' && (
            <TodoSection tasks={todoLists} courses={courses} area={area}
              onToggle={toggleTodo} onRemove={remove} onDuplicate={duplicate} onEdit={(tk) => openTaskModal(tk, 'todo')} />
          )}
          {tab === 'notes' && (
            <NotesSection notes={notes} courses={courses} area={area} onEdit={openNoteModal} onDelete={removeNote} />
          )}
        </>
      )}

      <TaskModal open={modalTask} onClose={closeTaskModal} onSave={saveTask} task={editTask} courses={courses} area={area} tasks={tasks} onApplyColor={applyColorToTasks} listType={taskListType} />
      <EventModal open={modalEvent} onClose={closeEventModal} onSave={saveEvent} event={editEvent} courses={courses} area={area} defaultStart={editEvent?.start_date} />
      <NoteModal open={noteModal.open} onClose={closeNoteModal} onSave={saveNote} note={noteModal.note} courses={courses} area={area} />
    </PullToRefresh>
  );
}