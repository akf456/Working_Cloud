import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useArea } from '@/lib/AreaContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import ShareModal from '@/components/ShareModal';
import { inCalendar, MAIN_CALENDAR_COLOR } from '@/lib/sharedCalendars';
import { CalendarPlus, Share2, Pencil, Trash2, Loader2, Check } from 'lucide-react';

const PALETTE = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444', '#0ea5e9', '#84cc16'];

export default function SharedCalendarsPage() {
  const nav = useNavigate();
  const { sharedCalendarId, setSharedCalendar } = useArea();
  const { toast } = useToast();
  const [cals, setCals] = useState([]);
  const [items, setItems] = useState({ tasks: [], events: [] });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [shareFor, setShareFor] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const [c, tk, ev] = await Promise.all([
        base44.entities.SharedCalendar.list('-created_date', 100),
        base44.entities.Task.filter({ area: 'shareable' }, '-due_date', 300),
        base44.entities.Event.filter({ area: 'shareable' }, '-start_date', 300)
      ]);
      setCals(c);
      setItems({ tasks: tk, events: ev });
    } catch {
      toast({ title: 'Could not load calendars', variant: 'destructive' });
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const rows = [
    { id: null, name: 'Main', color: MAIN_CALENDAR_COLOR, main: true },
    ...cals.map((c) => ({ id: c.id, name: c.name, color: c.color || PALETTE[0] }))
  ];
  const counts = (id) => ({
    tasks: items.tasks.filter((t) => inCalendar(t, id)).length,
    events: items.events.filter((e) => inCalendar(e, id)).length
  });

  function openCalendar(id) {
    setSharedCalendar(id);
    nav('/calendar');
  }

  async function saveCalendar() {
    if (!editing?.name?.trim()) return;
    setSaving(true);
    try {
      if (editing.id) await base44.entities.SharedCalendar.update(editing.id, { name: editing.name.trim(), color: editing.color });
      else await base44.entities.SharedCalendar.create({ name: editing.name.trim(), color: editing.color || PALETTE[0] });
      setEditing(null);
      load();
    } catch {
      toast({ title: 'Could not save calendar', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function deleteCalendar() {
    const cal = deleting;
    if (!cal) return;
    try {
      await base44.entities.Task.updateMany({ calendar_id: cal.id }, { $set: { calendar_id: null } });
      await base44.entities.Event.updateMany({ calendar_id: cal.id }, { $set: { calendar_id: null } });
      try { await base44.entities.ShareLink.deleteMany({ calendar_id: cal.id }); } catch { /* ignore */ }
      await base44.entities.SharedCalendar.delete(cal.id);
      if (sharedCalendarId === cal.id) setSharedCalendar(null);
      toast({ title: `Deleted "${cal.name}"`, description: 'Its tasks & events moved to your Main calendar.' });
    } catch {
      toast({ title: 'Could not delete calendar', variant: 'destructive' });
    }
    setDeleting(null);
    load();
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Shared calendars</h1>
          <p className="text-sm text-muted-foreground mt-1">Each calendar keeps its own tasks, events & share link — nothing overlaps.</p>
        </div>
        <Button onClick={() => setEditing({ name: '', color: PALETTE[0] })}><CalendarPlus className="w-4 h-4 mr-1.5" /> New calendar</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((c) => {
            const cnt = counts(c.id);
            const active = sharedCalendarId === c.id;
            return (
              <Card key={c.id || 'main'} className={`p-4 flex flex-col gap-3 ${active ? 'ring-2 ring-primary/60' : ''}`}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{cnt.tasks} tasks · {cnt.events} events</p>
                  </div>
                  {active && <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary shrink-0"><Check className="w-3 h-3" /> Viewing</span>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant={active ? 'secondary' : 'default'} onClick={() => openCalendar(c.id)}>Open</Button>
                  <Button size="sm" variant="outline" onClick={() => setShareFor({ id: c.id, name: c.name })}><Share2 className="w-3.5 h-3.5 mr-1" /> Share</Button>
                  {!c.main && (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => setEditing({ id: c.id, name: c.name, color: c.color })}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="ghost" className="text-rose-600 hover:text-rose-700" onClick={() => setDeleting(c)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-6">Open a calendar to add tasks & events — they stay inside that calendar. Share each one with its own people via its own link.</p>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Edit calendar' : 'New calendar'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Calendar name</Label>
              <Input value={editing?.name || ''} onChange={(e) => setEditing((d) => ({ ...(d || {}), name: e.target.value }))} placeholder="e.g. Sister's calendar" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex gap-1.5 flex-wrap">
                {PALETTE.map((c) => (
                  <button type="button" key={c} onClick={() => setEditing((d) => ({ ...(d || {}), color: c }))} className={`w-7 h-7 rounded-full border-2 transition ${editing?.color === c ? 'border-foreground' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveCalendar} disabled={saving || !editing?.name?.trim()}>{saving ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleting?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>Its tasks and events will move to your Main calendar. People with this calendar's share link will lose access.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteCalendar}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ShareModal open={!!shareFor} area="shareable" calendarId={shareFor?.id} calendarName={shareFor?.name} onClose={() => setShareFor(null)} />
    </div>
  );
}