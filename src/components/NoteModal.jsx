import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const NOTE_COLORS = [
  { name: 'Lemon', value: '#fef9c3' },
  { name: 'Sky', value: '#dbeafe' },
  { name: 'Mint', value: '#dcfce7' },
  { name: 'Rose', value: '#ffe4e6' },
  { name: 'Violet', value: '#ede9fe' },
  { name: 'Slate', value: '#f1f5f9' }
];

export default function NoteModal({ open, onClose, onSave, note, courses = [] }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState('#fef9c3');
  const [courseId, setCourseId] = useState('none');
  const [tags, setTags] = useState('');

  useEffect(() => {
    setTitle(note?.title || '');
    setContent(note?.content || '');
    setColor(note?.color || '#fef9c3');
    setCourseId(note?.course_id || 'none');
    setTags(Array.isArray(note?.tags) ? note.tags.join(', ') : '');
  }, [note, open]);

  function submit() {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      content,
      color,
      course_id: courseId === 'none' ? null : courseId,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean)
    });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{note ? 'Edit note' : 'New note'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note title" className="text-base font-semibold" autoFocus />
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} placeholder="Write your notes…" className="resize-y" />
          <div className="grid grid-cols-2 gap-3">
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
            <div className="space-y-1.5">
              <Label>Tags</Label>
              <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="comma, separated" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap">
              {NOTE_COLORS.map((c) => (
                <button key={c.value} type="button" onClick={() => setColor(c.value)} title={c.name}
                  className={`w-8 h-8 rounded-full border-2 transition ${color === c.value ? 'border-indigo-500 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c.value }} />
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