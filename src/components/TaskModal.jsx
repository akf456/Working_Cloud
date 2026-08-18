import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SheetSelect from '@/components/SheetSelect';
import { Textarea } from '@/components/ui/textarea';
import { PRIORITY, TASK_TYPE } from '@/lib/planner';
import { toInputDate, fromInputDate } from '@/lib/planner';
import ScrollDatePicker from '@/components/ScrollDatePicker';
import { AREAS } from '@/lib/areas';
import ApplyColorPanel from '@/components/ApplyColorPanel';

const WDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PALETTE = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444', '#0ea5e9', '#84cc16'];

export default function TaskModal({ open, onClose, onSave, task, courses = [], area = 'school', tasks = [], onApplyColor, listType = 'task' }) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [dueDate, setDueDate] = useState(task?.due_date || '');
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
  const [recolorIds, setRecolorIds] = useState(new Set());

  React.useEffect(() => {
    setTitle(task?.title || '');
    setDescription(task?.description || '');
    setDueDate(task?.due_date || '');
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
    setRecolorIds(new Set());
  }, [task, open]);

  function toggleDay(i) {
    setRepeatDays((p) => (p.includes(i) ? p.filter((d) => d !== i) : [...p, i]));
  }
  function toggleRecolor(id) { setRecolorIds((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; }); }

  function submit() {
    if (!title.trim() || (listType !== 'todo' && !dueDate)) return;
    const flag = flagged ? 'manual' : (task?.flag === 'manual' ? null : (task?.flag || null));
    onSave({
      ...(task?.id ? { id: task.id } : {}),
      title: title.trim(),
      description: description.trim(),
      due_date: dueDate || null,
      list_type: listType,
      priority, status, type, repeat,
      repeat_days: repeat !== 'none' ? repeatDays : [],
      repeat_start_date: repeat !== 'none' ? (repeatStart ? fromInputDate(repeatStart) : dueDate) : null,
      repeat_end_date: repeat !== 'none' && repeatEnd ? fromInputDate(repeatEnd) : null,
      color: color || null,
      flag,
      course_id: courseId === 'none' ? null : courseId
    });
    if (recolorIds.size && color && onApplyColor) onApplyColor([...recolorIds], color);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? (listType === 'todo' ? 'Edit list' : 'Edit task') : (listType === 'todo' ? 'New list' : 'New task')}</DialogTitle>
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
                <SheetSelect value={type} onValueChange={setType} placeholder="Type"
                  options={Object.entries(TASK_TYPE).map(([k, v]) => ({ value: k, label: v.label }))} />
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
              <SheetSelect value={priority} onValueChange={setPriority} placeholder="Priority"
                options={Object.entries(PRIORITY).map(([k, v]) => ({ value: k, label: v.label }))} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Deadline {listType !== 'todo' && <span className="text-rose-500">*</span>}</Label>
              <ScrollDatePicker value={dueDate} onChange={setDueDate} withTime placeholder={listType === 'todo' ? 'Optional date' : 'Pick a deadline'} />
              <p className="text-[11px] text-muted-foreground">{listType === 'todo' ? 'Optional — add a date to show this list on the calendar.' : 'A deadline is required.'}</p>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <SheetSelect value={status} onValueChange={setStatus} placeholder="Status"
                options={[{ value: 'todo', label: 'To Do' }, { value: 'in_progress', label: 'In Progress' }, { value: 'done', label: 'Done' }]} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Repeat</Label>
            <SheetSelect value={repeat} onValueChange={setRepeat} placeholder="Repeat"
              options={[{ value: 'none', label: 'Does not repeat' }, { value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }]} />
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
              <SheetSelect value={courseId} onValueChange={setCourseId} placeholder="No course"
                options={[{ value: 'none', label: 'No course' }, ...courses.map((c) => ({ value: c.id, label: c.code ? `${c.code} — ${c.name}` : c.name }))]} />
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
          {color && (
            <ApplyColorPanel
              color={color}
              tasks={tasks.filter((t) => t.id !== task?.id)}
              area={area}
              courses={courses}
              selectedIds={recolorIds}
              onToggle={toggleRecolor}
              onSelectAll={(ids) => setRecolorIds(new Set(ids))}
              onClear={() => setRecolorIds(new Set())}
            />
          )}
          <div className="space-y-1.5">
            <Label htmlFor="t-desc">Notes</Label>
            <Textarea id="t-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Details, links, requirements…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={!title.trim() || (listType !== 'todo' && !dueDate)}>{task ? 'Save changes' : (listType === 'todo' ? 'Add list' : 'Add task')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}