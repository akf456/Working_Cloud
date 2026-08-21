import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SheetSelect from '@/components/SheetSelect';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { EVENT_TYPE } from '@/lib/planner';
import ScrollDatePicker from '@/components/ScrollDatePicker';

const WDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PALETTE = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444', '#0ea5e9', '#84cc16'];

export default function EventModal({ open, onClose, onSave, event, courses = [], defaultStart, area = 'school' }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [type, setType] = useState('event');
  const [courseId, setCourseId] = useState('none');
  const [location, setLocation] = useState('');
  const [repeat, setRepeat] = useState('none');
  const [repeatDays, setRepeatDays] = useState([]);
  const [repeatStart, setRepeatStart] = useState('');
  const [repeatEnd, setRepeatEnd] = useState('');
  const [color, setColor] = useState('');

  useEffect(() => {
    const base = event?.start_date || defaultStart;
    setTitle(event?.title || '');
    setDescription(event?.description || '');
    setStart(base || '');
    setEnd(event?.end_date || '');
    setAllDay(event?.all_day ?? false);
    setType(event?.type || 'event');
    setCourseId(event?.course_id || 'none');
    setLocation(event?.location || '');
    setRepeat(event?.repeat || 'none');
    setRepeatDays(Array.isArray(event?.repeat_days) ? event.repeat_days : []);
    setRepeatStart(event?.repeat_start_date || (base || ''));
    setRepeatEnd(event?.repeat_end_date || '');
    setColor(event?.color || '');
  }, [event, open, defaultStart]);

  function toggleDay(i) {
    setRepeatDays((p) => (p.includes(i) ? p.filter((d) => d !== i) : [...p, i]));
  }

  function submit() {
    if (!title.trim() || !start) return;
    const repeating = repeat !== 'none';
    onSave({
      ...(event?.id ? { id: event.id } : {}),
      title: title.trim(),
      description: description.trim(),
      start_date: start,
      end_date: end || start,
      all_day: allDay,
      type,
      course_id: courseId === 'none' ? null : courseId,
      location: location.trim(),
      repeat,
      repeat_days: repeating ? repeatDays : [],
      repeat_start_date: repeating ? (repeatStart || start) : null,
      repeat_end_date: repeating && repeatEnd ? repeatEnd : null,
      color: color || null
    });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[88vh] flex flex-col overflow-hidden p-0 gap-0">
        <DialogHeader className="p-6 pb-2 shrink-0">
          <DialogTitle>{event ? 'Edit event' : 'New event'}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-2 min-w-0 space-y-4">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Midterm Exam" autoFocus />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <SheetSelect value={type} onValueChange={setType} placeholder="Type"
                options={Object.entries(EVENT_TYPE).map(([k, v]) => ({ value: k, label: v.label }))} />
            </div>
            {area === 'school' && (
              <div className="space-y-1.5">
                <Label>Course</Label>
                <SheetSelect value={courseId} onValueChange={setCourseId} placeholder="No course"
                  options={[{ value: 'none', label: 'No course' }, ...courses.map((c) => ({ value: c.id, label: c.code ? `${c.code} — ${c.name}` : c.name }))]} />
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Starts</Label>
              <ScrollDatePicker value={start} onChange={setStart} withTime placeholder="Pick start" />
            </div>
            <div className="space-y-1.5">
              <Label>Ends</Label>
              <ScrollDatePicker value={end} onChange={setEnd} withTime placeholder="Pick end" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={allDay} onCheckedChange={(v) => setAllDay(!!v)} />
            All day
          </label>
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
              <p className="text-[11px] text-muted-foreground">Pick the weekdays it occurs on. Leave empty to repeat on every occurrence.</p>
            </div>
          )}
          {repeat !== 'none' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Starts on</Label>
                <ScrollDatePicker value={repeatStart} onChange={setRepeatStart} withTime={false} placeholder="Pick a start" />
                <p className="text-[11px] text-muted-foreground">Defaults to the start date.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Ends on (optional)</Label>
                <ScrollDatePicker value={repeatEnd} onChange={setRepeatEnd} withTime={false} placeholder="Pick an end" />
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Location</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Room / link" />
          </div>
          <div className="space-y-1.5">
            <Label>Event color</Label>
            <div className="flex items-center gap-2 flex-wrap">
              <input type="color" value={color || '#6366f1'} onChange={(e) => setColor(e.target.value)} className="w-9 h-9 p-1 rounded-lg cursor-pointer border border-input bg-transparent" />
              <div className="flex gap-1 flex-wrap items-center min-w-0">
                {PALETTE.map((c) => (
                  <button type="button" key={c} onClick={() => setColor(c)} className={`w-6 h-6 rounded-full border-2 transition ${color === c ? 'border-foreground' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                ))}
                {color && <button type="button" onClick={() => setColor('')} className="text-xs text-muted-foreground hover:text-foreground ml-1">Clear</button>}
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">Optional — overrides the type/course color on the calendar.</p>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter className="p-6 pt-3 shrink-0 border-t border-border/60 bg-background">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={!title.trim() || !start}>{event ? 'Save changes' : 'Add event'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}