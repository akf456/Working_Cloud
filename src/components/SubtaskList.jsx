import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { daysUntil, dueLabel, parseDate, toInputDate, fromInputDate } from '@/lib/planner';

export default function SubtaskList({ parent }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');
  const [editId, setEditId] = useState(null);
  const [editVal, setEditVal] = useState('');

  const parentDue = parent.due_date ? toInputDate(parent.due_date) : '';
  const parentDate = parseDate(parent.due_date);

  async function load() {
    setLoading(true);
    const all = await base44.entities.Subtask.filter({ parent_task_id: parent.id });
    setItems(all.sort((a, b) => {
      const da = parseDate(a.due_date)?.getTime() || Infinity;
      const db = parseDate(b.due_date)?.getTime() || Infinity;
      return da - db;
    }));
    setLoading(false);
  }
  useEffect(() => { load(); }, [parent.id]);

  async function add() {
    if (!title.trim()) return;
    if (due && parentDate && new Date(due) > parentDate) {
      alert("A subtask can't be due after its parent task. Pick a date on or before " + toInputDate(parent.due_date) + '.');
      return;
    }
    const temp = { id: `temp-${Date.now()}`, parent_task_id: parent.id, title: title.trim(), due_date: due ? fromInputDate(due) : null, status: 'todo' };
    setItems((prev) => [...prev, temp]);
    setTitle(''); setDue('');
    try {
      await base44.entities.Subtask.create({ parent_task_id: parent.id, title: temp.title, due_date: temp.due_date, status: 'todo' });
    } catch (e) { /* load will reconcile */ }
    load();
  }

  async function toggle(st) {
    const next = st.status === 'done' ? 'todo' : 'done';
    setItems((prev) => prev.map((i) => i.id === st.id ? { ...i, status: next } : i));
    try { await base44.entities.Subtask.update(st.id, { status: next }); } catch (e) { /* load will reconcile */ }
    load();
  }
  async function remove(id) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    try { await base44.entities.Subtask.delete(id); } catch (e) { /* load will reconcile */ }
    load();
  }

  function startEdit(st) {
    setEditId(st.id);
    setEditVal(st.title || '');
  }

  async function commitEdit() {
    if (editId === null) return;
    const v = editVal.trim();
    const cur = items.find((i) => i.id === editId);
    if (cur && v && v !== cur.title) {
      setItems((prev) => prev.map((i) => (i.id === editId ? { ...i, title: v } : i)));
      try { await base44.entities.Subtask.update(editId, { title: v }); } catch (e) { /* load will reconcile */ }
      load();
    }
    setEditId(null);
    setEditVal('');
  }

  const doneCount = items.filter((i) => i.status === 'done').length;
  const pct = items.length ? Math.round((doneCount / items.length) * 100) : 0;

  return (
    <div className="mt-3 rounded-xl bg-muted/50 p-3 border border-border/60">
      {items.length > 0 && (
        <div className="mb-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span className="font-semibold">{doneCount}/{items.length} subtasks done</span>
            <span>{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-background overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
      <div className="space-y-1.5">
        {items.map((st) => {
          const isDone = st.status === 'done';
          const n = daysUntil(st.due_date);
          const overdue = n !== null && n < 0 && !isDone;
          return (
            <div key={st.id} className="group flex items-center gap-2">
              <Checkbox checked={isDone} onCheckedChange={() => toggle(st)} className="shrink-0" />
              {editId === st.id ? (
                <Input
                  autoFocus
                  value={editVal}
                  onChange={(e) => setEditVal(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); commitEdit(); }
                    else if (e.key === 'Escape') { setEditId(null); setEditVal(''); }
                  }}
                  className="h-8 text-sm flex-1"
                />
              ) : (
                <span onDoubleClick={() => startEdit(st)} className={`text-sm flex-1 truncate cursor-text ${isDone ? 'line-through text-muted-foreground' : ''}`} title="Double-click to rename">{st.title}</span>
              )}
              {st.due_date && <span className={`text-[11px] font-semibold shrink-0 ${overdue ? 'text-rose-600' : 'text-muted-foreground'}`}>{dueLabel(st.due_date)}</span>}
              <button onClick={() => startEdit(st)} className="opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1 rounded-lg text-muted-foreground hover:text-indigo-600 transition" title="Rename"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={() => remove(st.id)} className="opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1 rounded-lg text-muted-foreground hover:text-rose-600 transition" title="Remove"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          );
        })}
        {items.length === 0 && !loading && <p className="text-xs text-muted-foreground">No subtasks yet — break this into smaller steps.</p>}
      </div>
      <div className="flex gap-2 mt-2.5">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add a subtask…" className="h-8 text-sm"
          onKeyDown={(e) => e.key === 'Enter' && add()} />
        <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} max={parentDue} className="h-8 text-sm w-auto" />
        <Button size="icon" className="h-8 w-8 shrink-0" onClick={add}><Plus className="w-4 h-4" /></Button>
      </div>
    </div>
  );
}