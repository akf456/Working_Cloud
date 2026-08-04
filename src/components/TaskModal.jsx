import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PRIORITY, TASK_TYPE } from '@/lib/planner';
import { toInputDateTime, fromInputDateTime, toInputDate, fromInputDate } from '@/lib/planner';
import { AREAS } from '@/lib/areas';

const WDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PALETTE = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444', '#0ea5e9', '#84cc16'];

export default function TaskModal({ open, onClose, onSave, task, courses = [], area = 'school' }) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [dueDate, setDueDate] = useState(task?.due_date ? toInputDateTime(task.due_date) : '');
  const [priority, setPriority] = useState(task?.priority || 'medium');
  const [status, setStatus] = useState(task?.status || 'todo');
  const [type, setType] = useState(task?.type || (area === 'school' ? 'misc' : ''));
  const [courseId, setCourseId] = useState(task?.course_id || 'none');
  const [repeat, setRepeat] = useState(task?.repeat || 'none');
  const [repeatDays, setRepeatDays] = useState(task?.repeat_days || []);
  const [repeatStart, setRepeatStart] = useState(task?.repeat_start_date ? toInputDate(task.repeat_start_date) : '');
  const [repeatEnd, setRepeatEnd] = useState(task?.repeat_end_date ? toInputDate(task.repeat_end_date) : '');
  const [color, setColor] = useState(task?.color || '');
  const [flagged, setFlagged] = useState(task?.flag === 'manual');

  React.useEffect(() => {
    setTitle(task?.title || '');
    setDescription(task?.description || '');
    setDueDate(task?.due_date ? toInputDateTime(task.due_date) : '');
    setPriority(task?.priority || 'medium');
    setStatus(task?.status || 'todo');
    setType(task?.type || (area === 'school' ? 'misc' : ''));
    setCourseId(task?.course_id || 'none');
    setRepeat(task?.repeat || 'none');
    setRepeatDays(task?.repeat_days || []);
    setRepeatStart(task?.repeat_start_date ? toInputDate(task.repeat_start_date) : '');
    setRepeatEnd(task?.repeat_end_date ? toInputDate(task.repeat_end_date) : '');
    setColor(task?.color || '');
    setFlagged(task?.flag === 'manual');
  }, [task, open]);

  function toggleDay(i) {
    setRepeatDays((p) => (p.includes(i) ? p.filter((d) => d !== i) : [...p, i]));
  }

  function submit() {
    if (!title.trim() || !dueDate) return;
    const due = fromInputDateTime(dueDate);
    const flag = flagged ? 'manual' : (task?.flag === 'manual' ? null : (task?.flag || null));
    onSave({
      ...(task?.id ? { id: task.id } : {}),
      title: title.trim(),
      description: description.trim(),
      due_date: due,
      priority, status, type, repeat,
      repeat_days: repeat !== 'none' ? repeatDays : [],
      repeat_start_date: repeat !== 'none' ? (repeatStart ? fromInputDate(repeatStart) : due) : null,
      repeat_end_date: repeat !== 'none' && repeatEnd ? fromInputDate(repeatEnd) : null,
      color: color || null,
      flag,
      course_id: courseId === 'none' ? null : courseId
    });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit task' : 'New task'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="t-title">Title</Label>
            <Input id="t-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={AREAS[area]?.titlePlaceholder || 'Task title'} list="task-titles" autoFocus />
            <datalist id="task-titles">{(AREAS[area]?.taskTitleSuggestions || []).map((s) => <option key={s} value={s} />)}</datalist>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              {area === 'school' ? (
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(TASK_TYPE).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              ) : (
                <>
                  <Input value={type} onChange={(e) => setType(e.target.value)} placeholder="Name this type…" list="task-types" />
                  <datalist id="task-types">
                    {(AREAS[area]?.typeSuggestions || []).map((s) => <option key={s} value={s} />)}
                  </datalist>
                </>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(PRIORITY).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Deadline <span className="text-rose-500">*</span></Label>
              <Input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              <p className="text-[11px] text-muted-foreground">A deadline is required.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Repeat</Label>
            <Select value={repeat} onValueChange={setRepeat}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Does not repeat</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {repeat !== 'none' && (
            <div className="space-y-1.5">
              <Label>On these days</Label>
              <div className="flex gap-1.5">
                {WDAYS.map((w, i) => {
                  const on = repeatDays.includes(i);
                  return (
                    <button type="button" key={i} onClick={() => toggleDay(i)}
                      className={`w-9 h-9 rounded-lg text-xs font-medium border transition ${on ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-accent'}`}>
                      {w[0]}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted-foreground">Pick the weekdays you want it to appear on. Leave empty to repeat on every occurrence.</p>
            </div>
          )}
          {repeat !== 'none' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Starts on</Label>
                <Input type="date" value={repeatStart} onChange={(e) => setRepeatStart(e.target.value)} />
                <p className="text-[11px] text-muted-foreground">Defaults to the deadline.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Ends on (optional)</Label>
                <Input type="date" value={repeatEnd} onChange={(e) => setRepeatEnd(e.target.value)} />
              </div>
            </div>
          )}
          {area === 'school' && (
            <div className="space-y-1.5">
              <Label>Course</Label>
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger><SelectValue placeholder="No course" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No course</SelectItem>
                  {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.code ? `${c.code} — ` : ''}{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Task color</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={color || '#6366f1'} onChange={(e) => setColor(e.target.value)} className="w-9 h-9 p-1 rounded-lg cursor-pointer border border-input bg-transparent" />
                <div className="flex gap-1 flex-wrap items-center">
                  {PALETTE.map((c) => (
                    <button type="button" key={c} onClick={() => setColor(c)} className={`w-6 h-6 rounded-full border-2 transition ${color === c ? 'border-foreground' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                  ))}
                  {color && <button type="button" onClick={() => setColor('')} className="text-xs text-muted-foreground hover:text-foreground ml-1">Clear</button>}
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">Optional — shows on the calendar. Priority colors stay red/orange/yellow.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Flag</Label>
              <button type="button" onClick={() => setFlagged((f) => !f)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition w-full ${flagged ? 'border-rose-400 bg-rose-50 text-rose-700' : 'border-input hover:bg-accent'}`}>
                <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${flagged ? 'bg-rose-500 border-rose-500' : 'border-input'}`}>{flagged && <span className="w-2 h-2 bg-white rounded-sm" />}</span>
                Mark as important
              </button>
              <p className="text-[11px] text-muted-foreground">Overdue tasks are flagged automatically.</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-desc">Notes</Label>
            <Textarea id="t-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Details, links, requirements…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={!title.trim() || !dueDate}>{task ? 'Save changes' : 'Add task'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}