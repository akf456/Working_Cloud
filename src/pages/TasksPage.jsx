import React, { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Plus, Search, Pencil, Trash2, Inbox } from 'lucide-react';
import { TASK_TYPE, PRIORITY, STATUS, dueLabel, daysUntil, parseDate } from '@/lib/planner';
import TaskModal from '@/components/TaskModal';
import PriorityView from '@/components/PriorityView';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [course, setCourse] = useState('all');
  const [status, setStatus] = useState('all');
  const [type, setType] = useState('all');
  const [modal, setModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [view, setView] = useState('status');

  async function load() {
    setLoading(true);
    const [t, c] = await Promise.all([
      base44.entities.Task.list('-due_date', 300),
      base44.entities.Course.list()
    ]);
    setTasks(t); setCourses(c);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const courseMap = Object.fromEntries(courses.map((c) => [c.id, c]));

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (q && !t.title.toLowerCase().includes(q.toLowerCase())) return false;
      if (course !== 'all' && t.course_id !== course) return false;
      if (status !== 'all' && t.status !== status) return false;
      if (type !== 'all' && t.type !== type) return false;
      return true;
    });
  }, [tasks, q, course, status, type]);

  const groups = [
    { key: 'todo', label: 'To Do' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'done', label: 'Done' }
  ];

  async function toggle(t) {
    const next = t.status === 'done' ? 'todo' : 'done';
    await base44.entities.Task.update(t.id, { status: next });
    load();
  }
  async function remove(id) { await base44.entities.Task.delete(id); load(); }
  async function saveTask(data) {
    if (data.id) await base44.entities.Task.update(data.id, data);
    else await base44.entities.Task.create(data);
    setEditTask(null); load();
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">Assignments, exams prep, reading — keep it moving.</p>
        </div>
        <Button onClick={() => { setEditTask(null); setModal(true); }} className="rounded-xl"><Plus className="w-4 h-4 mr-1.5" /> New task</Button>
      </div>

      <div className="inline-flex rounded-xl bg-muted p-1 mb-5 self-start">
        <button onClick={() => setView('status')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${view === 'status' ? 'bg-background shadow-sm text-indigo-600' : 'text-muted-foreground hover:text-foreground'}`}>By status</button>
        <button onClick={() => setView('priority')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${view === 'priority' ? 'bg-background shadow-sm text-indigo-600' : 'text-muted-foreground hover:text-foreground'}`}>Priority</button>
      </div>

      {/* Filters */}
      <Card className="p-3 mb-5 grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="relative col-span-2 md:col-span-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="pl-9" />
        </div>
        <Select value={course} onValueChange={setCourse}>
          <SelectTrigger><SelectValue placeholder="Course" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All courses</SelectItem>
            {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.code || c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="todo">To Do</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {Object.entries(TASK_TYPE).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </Card>

      {loading ? <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted/60 animate-pulse" />)}</div>
        : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
            <Inbox className="w-10 h-10 mb-3 opacity-50" />
            <p className="font-medium">No tasks here.</p>
            <p className="text-sm mt-1">Add one, or import a syllabus to auto-fill deadlines.</p>
          </div>
        ) : view === 'priority' ? (
          <PriorityView tasks={filtered} events={[]} courses={courses} onToggle={toggle} />
        ) : (
          <div className="space-y-6">
            {groups.map(({ key, label }) => {
              const items = filtered.filter((t) => t.status === key).sort((a, b) => {
                if (key === 'done') return new Date(b.updated_date) - new Date(a.updated_date);
                const da = parseDate(a.due_date)?.getTime() || Infinity;
                const db = parseDate(b.due_date)?.getTime() || Infinity;
                return da - db;
              });
              if (items.length === 0) return null;
              return (
                <div key={key}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS[key].chip}`}>{label}</span>
                    <span className="text-xs text-muted-foreground">{items.length}</span>
                    <div className="flex-1 h-px bg-border/60" />
                  </div>
                  <div className="space-y-2">
                    {items.map((t) => <TaskRow key={t.id} task={t} course={courseMap[t.course_id]} onToggle={() => toggle(t)} onEdit={() => { setEditTask(t); setModal(true); }} onDelete={() => remove(t.id)} />)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      <TaskModal open={modal} onClose={() => { setModal(false); setEditTask(null); }} onSave={saveTask} task={editTask} courses={courses} />
    </div>
  );
}

function TaskRow({ task, course, onToggle, onEdit, onDelete }) {
  const T = TASK_TYPE[task.type] || TASK_TYPE.misc;
  const P = PRIORITY[task.priority] || PRIORITY.medium;
  const done = task.status === 'done';
  const n = daysUntil(task.due_date);
  const overdue = n !== null && n < 0 && !done;
  return (
    <div className={`group flex items-center gap-3 rounded-xl border border-border/60 px-3 py-3 hover:bg-accent/30 transition ${done ? 'opacity-60' : ''}`}>
      <Checkbox checked={done} onCheckedChange={onToggle} className="shrink-0" />
      <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${T.chip}`}><T.Icon className="w-4 h-4" /></span>
      <div className="min-w-0 flex-1">
        <p className={`font-medium text-sm truncate ${done ? 'line-through' : ''}`}>{task.title}</p>
        <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground mt-0.5">
          <span className={`inline-flex items-center gap-1`}><span className={`w-1.5 h-1.5 rounded-full ${P.dot}`} />{P.label}</span>
          <span>· {T.label}</span>
          {course && <><span>·</span><span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: course.color }} />{course.code || course.name}</span></>}
          {task.source === 'syllabus' && <span className="text-indigo-500">· from syllabus</span>}
        </div>
      </div>
      {task.due_date && <span className={`text-xs font-semibold shrink-0 ${overdue ? 'text-rose-600' : 'text-muted-foreground'}`}>{dueLabel(task.due_date)}</span>}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
        <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-background text-muted-foreground hover:text-indigo-600"><Pencil className="w-3.5 h-3.5" /></button>
        <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-background text-muted-foreground hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
}