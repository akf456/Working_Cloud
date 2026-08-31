import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft } from 'lucide-react';
import { format, startOfDay } from 'date-fns';
import PullToRefresh from '@/components/PullToRefresh';
import TaskModal from '@/components/TaskModal';
import EventModal from '@/components/EventModal';
import NoteModal from '@/components/NoteModal';
import OverdueBanner from '@/components/OverdueBanner';
import ListsOverview from '@/components/lists/ListsOverview';
import TasksSection from '@/components/lists/TasksSection';
import TodoSection from '@/components/lists/TodoSection';
import NotesSection from '@/components/lists/NotesSection';
import ChecklistModal from '@/components/ChecklistModal';
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
  const [view, setView] = useState('overview');
  const [modalEvent, setModalEvent] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [noteModal, setNoteModal] = useState({ open: false, note: null });
  const [checklistModal, setChecklistModal] = useState({ open: false, list: null });
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
  async function saveChecklist({ id, title, items, color }) {
    try {
      if (id) {
        setTasks((prev) => prev.map((tk) => (tk.id === id ? { ...tk, title, color: color || null } : tk)));
        await base44.entities.Task.update(id, { title, color: color || null });
        const existing = await base44.entities.Subtask.filter({ parent_task_id: id });
        const finalIds = new Set(items.filter((i) => i.id).map((i) => i.id));
        for (const s of existing) {
          if (!finalIds.has(s.id)) { try { await base44.entities.Subtask.delete(s.id); } catch (e) {} }
        }
        const toCreate = items.filter((i) => !i.id).map((i) => ({ parent_task_id: id, title: i.title, status: i.status || 'todo' }));
        if (toCreate.length) await base44.entities.Subtask.bulkCreate(toCreate);
        for (const i of items.filter((x) => x.id)) {
          const ex = existing.find((s) => s.id === i.id);
          if (!ex) continue;
          const patch = {};
          if (ex.status !== i.status) patch.status = i.status;
          if (ex.title !== i.title) patch.title = i.title;
          if (Object.keys(patch).length) { try { await base44.entities.Subtask.update(i.id, patch); } catch (e) {} }
        }
      } else {
        const created = await base44.entities.Task.create({ title, list_type: 'todo', area, status: 'todo', color: color || null });
        if (items.length) await base44.entities.Subtask.bulkCreate(items.map((i) => ({ parent_task_id: created.id, title: i.title, status: i.status || 'todo' })));
      }
    } catch (e) { toast({ title: 'Could not save checklist', variant: 'destructive' }); }
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

  const subsectionLabel = view === 'tasks' ? t('lists.tab.tasks') : view === 'todo' ? t('lists.tab.todo') : view === 'notes' ? t('lists.tab.notes') : '';
  const newLabel = view === 'tasks' ? t('lists.newTask') : view === 'todo' ? t('lists.newList') : view === 'notes' ? t('lists.newNote') : '';
  function handleNew() {
    if (view === 'tasks') openTaskModal(null, 'task');
    else if (view === 'todo') setChecklistModal({ open: true, list: null });
    else if (view === 'notes') openNoteModal(null);
  }

  return (
    <PullToRefresh onRefresh={load} className="p-4 md:p-8 max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{t('lists.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('lists.subtitle')}</p>
        </div>
        {view !== 'overview' && <Button onClick={handleNew} className="rounded-xl"><Plus className="w-4 h-4 mr-1.5" /> {newLabel}</Button>}
      </div>

      {view === 'overview' ? (
        <ListsOverview regularTasks={regularTasks} todoLists={todoLists} events={events} notes={notes} loading={loading} onPick={(k) => setView(k)} />
      ) : loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted/60 animate-pulse" />)}</div>
      ) : (
        <>
          <Button variant="outline" onClick={() => setView('overview')} className="rounded-xl mb-4"><ChevronLeft className="w-4 h-4 mr-1.5" /> {t('lists.back')}</Button>
          {view === 'tasks' && (
            <>
              <OverdueBanner tasks={regularTasks} courses={courses} onDone={load} />
              <h2 className="text-xl font-bold mb-4">{subsectionLabel}</h2>
              <TasksSection tasks={regularTasks} events={events} courses={courses} area={area}
                onToggle={toggle} onRemove={remove} onDuplicate={duplicate} onEditTask={(tk) => openTaskModal(tk, tk.list_type || 'task')} onEditEvent={openEventModal} onToggleEvent={toggleEvent} onBulkStatus={bulkStatus} onBulkTrash={bulkTrash} />
            </>
          )}
          {view === 'todo' && (
            <>
              <h2 className="text-xl font-bold mb-4">{subsectionLabel}</h2>
              <TodoSection tasks={todoLists} courses={courses} area={area}
                onToggle={toggleTodo} onRemove={remove} onDuplicate={duplicate} onEdit={(tk) => setChecklistModal({ open: true, list: tk })} />
            </>
          )}
          {view === 'notes' && (
            <>
              <h2 className="text-xl font-bold mb-4">{subsectionLabel}</h2>
              <NotesSection notes={notes} courses={courses} area={area} onEdit={openNoteModal} onDelete={removeNote} />
            </>
          )}
        </>
      )}

      <TaskModal open={modalTask} onClose={closeTaskModal} onSave={saveTask} task={editTask} courses={courses} area={area} tasks={tasks} onApplyColor={applyColorToTasks} listType={taskListType} />
      <EventModal open={modalEvent} onClose={closeEventModal} onSave={saveEvent} event={editEvent} courses={courses} area={area} defaultStart={editEvent?.start_date} />
      <NoteModal open={noteModal.open} onClose={closeNoteModal} onSave={saveNote} note={noteModal.note} courses={courses} area={area} />
      <ChecklistModal open={checklistModal.open} onClose={() => setChecklistModal({ open: false, list: null })} onSave={saveChecklist} list={checklistModal.list} />
    </PullToRefresh>
  );
}