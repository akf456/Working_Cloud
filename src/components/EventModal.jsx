import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { EVENT_TYPE, toInputDateTime, fromInputDateTime } from '@/lib/planner';

export default function EventModal({ open, onClose, onSave, event, courses = [], defaultStart }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [type, setType] = useState('event');
  const [courseId, setCourseId] = useState('none');
  const [location, setLocation] = useState('');

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
  }, [event, open, defaultStart]);

  function submit() {
    if (!title.trim() || !start) return;
    onSave({
      title: title.trim(),
      description: description.trim(),
      start_date: fromInputDateTime(start),
      end_date: end ? fromInputDateTime(end) : fromInputDateTime(start),
      all_day: allDay,
      type,
      course_id: courseId === 'none' ? null : courseId,
      location: location.trim()
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(EVENT_TYPE).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
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
          </div>
          <div className="grid grid-cols-2 gap-3">
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