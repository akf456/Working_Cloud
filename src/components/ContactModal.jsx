import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

export const CONTACT_ROLE = {
  professor: { label: 'Professor' },
  ta: { label: 'Teaching Assistant' },
  advisor: { label: 'Advisor' },
  tutor: { label: 'Tutor' },
  classmate: { label: 'Classmate' },
  other: { label: 'Other' }
};

export default function ContactModal({ open, onClose, onSave, contact, courses, area = 'school' }) {
  const [form, setForm] = useState({});

  useEffect(() => {
    if (!open) return;
    setForm({
      name: '', role: 'professor', email: '', phone: '',
      office_location: '', course_id: '', office_hours: '', class_times: '', notes: '',
      ...(contact || {})
    });
  }, [open, contact]);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  function submit() {
    if (!form.name?.trim()) return;
    onSave(form);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{contact ? 'Edit contact' : 'New contact'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input value={form.name || ''} onChange={(e) => set('name', e.target.value)} placeholder={area === 'school' ? 'Dr. Jane Patel' : 'Name'} autoFocus />
            </div>
            {area === 'school' && (
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select value={form.role || 'professor'} onValueChange={(v) => set('role', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CONTACT_ROLE).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email || ''} onChange={(e) => set('email', e.target.value)} placeholder="name@school.edu" />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} placeholder="(555) 123-4567" />
            </div>
          </div>
          {area === 'school' && (
            <div className="space-y-1.5">
              <Label>Course</Label>
              <Select value={form.course_id || 'none'} onValueChange={(v) => set('course_id', v === 'none' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="No course" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No course</SelectItem>
                  {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.code || c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{area === 'school' ? 'Office / Location' : 'Location'}</Label>
              <Input value={form.office_location || ''} onChange={(e) => set('office_location', e.target.value)} placeholder={area === 'school' ? 'Science Bldg, Rm 204' : 'Office, address or place'} />
            </div>
            {area === 'school' && (
              <div className="space-y-1.5">
                <Label>Class times</Label>
                <Input value={form.class_times || ''} onChange={(e) => set('class_times', e.target.value)} placeholder="MWF 9:00–9:50am" />
              </div>
            )}
          </div>
          {area === 'school' && (
            <div className="space-y-1.5">
              <Label>Office hours</Label>
              <Input value={form.office_hours || ''} onChange={(e) => set('office_hours', e.target.value)} placeholder="Mon 2–4pm, Wed 1–3pm" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} rows={3} placeholder="Anything else worth remembering…" className="resize-y" />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>{contact ? 'Save changes' : 'Add contact'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}