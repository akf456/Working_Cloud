import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SheetSelect from '@/components/SheetSelect';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { EVENT_TYPE, toInputDateTime, fromInputDateTime, toInputDate, fromInputDate } from '@/lib/planner';

const WDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

  useEffect(() => {
    const base = event?.start_date || defaultStart;
    setTitle(event?.title || '');
    setDescription(event?.description || '');
    setStart(base ? toInputDateTime(base) : '');
    setEnd(event?.end_date ? toInputDateTime(event.end_date) : '');
    setAllDay(event?.all_day ?? false);
    setType(event?.type || 'event');
    setCourseId(event?.course_id || 'none');
    setLocation(event?.location || '');
    setRepeat(event?.repeat || 'none');
    setRepeatDays(Array.isArray(event?.repeat_days) ? event.repeat_days : []);
    setRepeatStart(event?.repeat_start_date ? toInputDate(event.repeat_start_date) : (base ? toInputDate(base) : ''));
    setRepeatEnd(event?.repeat_end_date ? toInputDate(event.repeat_end_date) : '');
  }, [event, open, defaultStart]);

  function toggleDay(i) {
    setRepeatDays((p) => (p.includes(i) ? p.filter((d) => d !== i) : [...p, i]));
  }

  function submit() {
    if (!title.trim() || !start) return;
    const startISO = fromInputDateTime(start);
    onSave({
      ...(event?.id ? { id: event.id } : {}),
      title: title.trim(),
      description: description.trim(),
      start_date: startISO,
      end_date: end ? fromInputDateTime(end) : startISO,
      all_day: allDay,
      type,
      course_id: courseId === 'none' ? null : courseId,
      location: location.trim(),
      repeat,
      repeat_days: repeat !== 'none' ? repeatDays : [],
      repeat_start_date: repeat !== 'none' ? (repeatStart ? fromInputDate(repeatStart) : startISO) : null,
      repeat_end_date: repeat !== 'none' && repeatEnd ? fromInputDate(repeatEnd) : null
    });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{event ? 'Edit event' : 'New event'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
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
              <Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} disabled={allDay && false} />
            </div>
            <div className="space-y-1.5">
              <Label>Ends</Label>
              <Input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
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
                <Input type="date" value={repeatStart} onChange={(e) => setRepeatStart(e.target.value)} />
                <p className="text-[11px] text-muted-foreground">Defaults to the start date.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Ends on (optional)</Label>
                <Input type="date" value={repeatEnd} onChange={(e) => setRepeatEnd(e.target.value)} />
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Location</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Room / link" />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={!title.trim() || !start}>{event ? 'Save changes' : 'Add event'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}