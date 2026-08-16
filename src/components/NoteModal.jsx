import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import SheetSelect from '@/components/SheetSelect';

const PALETTE = ['#fde68a', '#fcd34b', '#a7f3d0', '#bfdbfe', '#ddd6fe', '#fbcfe8'];

export default function NoteModal({ open, onClose, onSave, note, courses = [], area = 'school' }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState('#fde68a');
  const [courseId, setCourseId] = useState('none');

  useEffect(() => {
    setTitle(note?.title || '');
    setContent(note?.content || '');
    setColor(note?.color || '#fde68a');
    setCourseId(note?.course_id || 'none');
  }, [note, open]);

  function submit() {
    if (!title.trim()) return;
    onSave({
      ...(note?.id ? { id: note.id } : {}),
      title: title.trim(),
      content: content.trim(),
      color,
      course_id: courseId === 'none' ? null : courseId
    });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{note ? 'Edit note' : 'New note'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="n-title">Title</Label>
            <Input id="n-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note title" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>Content</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={5} placeholder="Ideas, reminders, anything…" />
          </div>
          {area === 'school' && (
            <div className="space-y-1.5">
              <Label>Course</Label>
              <SheetSelect value={courseId} onValueChange={setCourseId} placeholder="No course"
                options={[{ value: 'none', label: 'No course' }, ...courses.map((c) => ({ value: c.id, label: c.code ? `${c.code} — ${c.name}` : c.name }))]} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex gap-1.5 flex-wrap">
              {PALETTE.map((c) => (
                <button type="button" key={c} onClick={() => setColor(c)} className={`w-7 h-7 rounded-full border-2 transition ${color === c ? 'border-foreground' : 'border-transparent'}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={!title.trim()}>{note ? 'Save changes' : 'Add note'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}