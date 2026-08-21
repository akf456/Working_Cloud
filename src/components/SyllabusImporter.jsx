import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SheetSelect from '@/components/SheetSelect';
import { UploadCloud, Loader2, CheckCircle2, FileText, CalendarClock, ListChecks, Sparkles, Users } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { COURSE_COLORS, TASK_TYPE, EVENT_TYPE } from '@/lib/planner';

const ROLE_MAP = [
  { re: /ta|teaching assistant/i, v: 'ta' },
  { re: /prof|instructor|lecturer/i, v: 'professor' },
  { re: /advisor/i, v: 'advisor' },
  { re: /tutor/i, v: 'tutor' },
  { re: /classmate|peer/i, v: 'classmate' }
];
function mapRole(r, area) {
  if (area !== 'school') return 'other';
  for (const m of ROLE_MAP) if (m.re.test(r || '')) return m.v;
  return 'other';
}

function norm(s) { return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }

// mode: 'syllabus' (default) | 'calendar'
export default function SyllabusImporter({ open, onClose, courses = [], area = 'school', onDone, mode = 'syllabus' }) {
  const isSchool = area === 'school';
  const isCalendarMode = mode === 'calendar';
  const [file, setFile] = useState(null);
  const [courseId, setCourseId] = useState('new');
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [summary, setSummary] = useState(null);

  React.useEffect(() => {
    if (open) {
      setFile(null); setCourseId('new'); setCourseName(''); setCourseCode('');
      setLoading(false); setData(null); setError(''); setSaving(false); setDone(false); setSummary(null);
    }
  }, [open]);

  async function handleExtract() {
    if (!file) return;
    setLoading(true); setError(''); setData(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const res = await base44.functions.invoke('extractSyllabus', { file_url });
      const d = res.data;
      setData(d);
      if (isSchool && !isCalendarMode) {
        if (d.course_name && courseId === 'new' && !courseName) setCourseName(d.course_name);
        if (d.course_code && courseId === 'new' && !courseCode) setCourseCode(d.course_code);
      }
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Could not read the document.');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    setSaving(true); setError('');
    try {
      const incomingTasks = (data?.tasks || []).filter((t) => t.title);
      const incomingEvents = (data?.events || []).filter((e) => e.title && e.start_date);
      const incomingContacts = (data?.contacts || []).filter((c) => c.name);

      const taskFields = (t, cid) => ({
        title: t.title, description: t.description || '', due_date: t.due_date || null,
        type: t.type || 'misc', status: 'todo', priority: 'medium',
        repeat: t.repeat || 'none',
        repeat_days: Array.isArray(t.repeat_days) ? t.repeat_days.map(Number) : [],
        repeat_start_date: t.repeat_start_date || null,
        repeat_end_date: t.repeat_end_date || null,
        course_id: cid || null, source: 'syllabus', area
      });
      const eventFields = (e, cid) => ({
        title: e.title, description: e.description || '', start_date: e.start_date,
        end_date: e.end_date || e.start_date, all_day: e.all_day ?? false,
        type: EVENT_TYPE[e.type] ? e.type : 'event', location: e.location || '',
        repeat: e.repeat || 'none',
        repeat_days: Array.isArray(e.repeat_days) ? e.repeat_days.map(Number) : [],
        repeat_start_date: e.repeat_start_date || null,
        repeat_end_date: e.repeat_end_date || null,
        course_id: cid || null, source: 'syllabus', area
      });
      const contactFields = (c, cid) => ({
        name: c.name, role: mapRole(c.role, area), email: c.email || '', phone: c.phone || '',
        office_location: c.office_location || '', office_hours: c.office_hours || '',
        class_times: c.class_times || '', course_id: cid || null, area
      });

      let added = 0, skipped = 0;

      if (isCalendarMode) {
        // Calendar import: deduplicate against existing events/tasks by title+date.
        const [existEvents, existTasks] = await Promise.all([
          base44.entities.Event.filter({ area, source: 'syllabus' }, null, 500),
          base44.entities.Task.filter({ area, source: 'syllabus' }, null, 500)
        ]);

        const existEventKeys = new Set(existEvents.map((e) => norm(e.title) + '|' + (e.start_date || '').slice(0, 10)));
        const existTaskKeys = new Set(existTasks.map((t) => norm(t.title) + '|' + (t.due_date || '').slice(0, 10)));

        const newEvents = incomingEvents.filter((e) => {
          const k = norm(e.title) + '|' + (e.start_date || '').slice(0, 10);
          return !existEventKeys.has(k);
        });
        const newTasks = incomingTasks.filter((t) => {
          const k = norm(t.title) + '|' + (t.due_date || '').slice(0, 10);
          return !existTaskKeys.has(k);
        });

        skipped = (incomingEvents.length - newEvents.length) + (incomingTasks.length - newTasks.length);

        if (newEvents.length) { await base44.entities.Event.bulkCreate(newEvents.map((e) => eventFields(e, null))); added += newEvents.length; }
        if (newTasks.length) { await base44.entities.Task.bulkCreate(newTasks.map((t) => taskFields(t, null))); added += newTasks.length; }
        if (incomingContacts.length) { await base44.entities.Contact.bulkCreate(incomingContacts.map((c) => contactFields(c, null))); added += incomingContacts.length; }

        setSummary({ calendar: true, added, skipped });
      } else if (!isSchool) {
        if (incomingTasks.length) { await base44.entities.Task.bulkCreate(incomingTasks.map((t) => taskFields(t, null))); added += incomingTasks.length; }
        if (incomingEvents.length) { await base44.entities.Event.bulkCreate(incomingEvents.map((e) => eventFields(e, null))); added += incomingEvents.length; }
        if (incomingContacts.length) { await base44.entities.Contact.bulkCreate(incomingContacts.map((c) => contactFields(c, null))); added += incomingContacts.length; }
        setSummary({ diff: false, added });
      } else {
        let cid = courseId;
        const isNew = courseId === 'new';
        if (isNew) {
          const color = COURSE_COLORS[courses.length % COURSE_COLORS.length];
          const created = await base44.entities.Course.create({
            name: courseName.trim() || data?.course_name || 'Untitled Course',
            code: courseCode.trim() || data?.course_code || '',
            color, instructor: data?.instructor || '', semester: data?.semester || '', area: 'school'
          });
          cid = created.id;
        }

        if (isNew) {
          if (incomingTasks.length) { await base44.entities.Task.bulkCreate(incomingTasks.map((t) => taskFields(t, cid))); added += incomingTasks.length; }
          if (incomingEvents.length) { await base44.entities.Event.bulkCreate(incomingEvents.map((e) => eventFields(e, cid))); added += incomingEvents.length; }
          if (incomingContacts.length) { await base44.entities.Contact.bulkCreate(incomingContacts.map((c) => contactFields(c, cid))); added += incomingContacts.length; }
          setSummary({ diff: false, added });
        } else {
          const [existTasks, existEvents] = await Promise.all([
            base44.entities.Task.filter({ course_id: cid, source: 'syllabus' }),
            base44.entities.Event.filter({ course_id: cid, source: 'syllabus' })
          ]);
          const toAddTasks = [];
          const matchedTaskIds = new Set();
          const taskUpdates = [];
          for (const t of incomingTasks) {
            const m = existTasks.find((e) => norm(e.title) === norm(t.title));
            if (m) { matchedTaskIds.add(m.id); if (t.due_date && t.due_date !== m.due_date) taskUpdates.push({ id: m.id, due_date: t.due_date }); }
            else toAddTasks.push(t);
          }
          const toFlagTasks = existTasks.filter((e) => !matchedTaskIds.has(e.id) && e.flag !== 'Previous syllabus');
          const toAddEvents = [];
          const matchedEventIds = new Set();
          for (const e of incomingEvents) {
            const m = existEvents.find((x) => norm(x.title) === norm(e.title));
            if (m) matchedEventIds.add(m.id);
            else toAddEvents.push(e);
          }
          const toFlagEvents = existEvents.filter((e) => !matchedEventIds.has(e.id) && e.flag !== 'Previous syllabus');

          if (toAddTasks.length) { await base44.entities.Task.bulkCreate(toAddTasks.map((t) => taskFields(t, cid))); added += toAddTasks.length; }
          if (toAddEvents.length) { await base44.entities.Event.bulkCreate(toAddEvents.map((e) => eventFields(e, cid))); added += toAddEvents.length; }
          if (incomingContacts.length) { await base44.entities.Contact.bulkCreate(incomingContacts.map((c) => contactFields(c, cid))); added += incomingContacts.length; }
          if (taskUpdates.length) await base44.entities.Task.bulkUpdate(taskUpdates);
          if (toFlagTasks.length) await base44.entities.Task.bulkUpdate(toFlagTasks.map((t) => ({ id: t.id, flag: 'Previous syllabus' })));
          if (toFlagEvents.length) await base44.entities.Event.bulkUpdate(toFlagEvents.map((e) => ({ id: e.id, flag: 'Previous syllabus' })));
          setSummary({ diff: true, added, flagged: toFlagTasks.length + toFlagEvents.length });
        }
      }

      setDone(true);
      onDone?.();
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  }

  const title = isCalendarMode ? 'Import calendar' : 'Upload document';
  const description = isCalendarMode
    ? 'Upload a school district calendar, schedule PDF, screenshot, or fax copy — AI extracts holidays, breaks, events, and key dates. Duplicates are automatically skipped.'
    : (isSchool && courseId !== 'new'
      ? 'AI compares this to the existing course — new items are added, and items no longer in the document are flagged, never deleted.'
      : 'Upload any document — a syllabus, calendar, schedule PDF, Word doc, screenshot, or image — and AI pulls out tasks, deadlines, events & contacts for this space. Adjust anything anytime.');

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[88vh] flex flex-col overflow-hidden p-0 gap-0">
        <DialogHeader className="p-6 pb-2 shrink-0 text-center">
          <DialogTitle className="flex items-center justify-center gap-2"><Sparkles className="w-5 h-5 text-indigo-600" /> {title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-2 min-h-0">
        {done ? (
          <div className="py-10 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <p className="font-semibold text-lg">{summary?.diff ? 'Updated!' : 'All set!'}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {summary?.calendar
                ? `Added ${summary.added} item${summary.added !== 1 ? 's' : ''} to your calendar.${summary.skipped ? ` Skipped ${summary.skipped} duplicate${summary.skipped !== 1 ? 's' : ''}.` : ''}`
                : summary?.diff
                  ? `Added ${summary.added} new · flagged ${summary.flagged} from the previous syllabus (never deleted).`
                  : 'Tasks, events & contacts were added to your planner. Adjust anything anytime.'}
            </p>
            <Button className="mt-5" onClick={onClose}>Done</Button>
          </div>
        ) : (
          <div className="space-y-4 py-1">
            {isSchool && !isCalendarMode && (
              <div className="space-y-1.5">
                <Label>Attach to course</Label>
                <SheetSelect value={courseId} onValueChange={setCourseId} placeholder="Attach to course"
                  options={[{ value: 'new', label: '+ Create new course' }, ...courses.map((c) => ({ value: c.id, label: c.code ? `${c.code} — ${c.name}` : c.name }))]} />
              </div>
            )}

            {isSchool && !isCalendarMode && courseId === 'new' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Course name</Label>
                  <Input value={courseName} onChange={(e) => setCourseName(e.target.value)} placeholder="Calculus II" />
                </div>
                <div className="space-y-1.5">
                  <Label>Course code</Label>
                  <Input value={courseCode} onChange={(e) => setCourseCode(e.target.value)} placeholder="MATH 152" />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>{isCalendarMode ? 'Calendar file (PDF, image, screenshot, fax copy)' : 'Document file'}</Label>
              <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border hover:border-indigo-400 hover:bg-indigo-50/40 transition cursor-pointer py-6 px-4 text-center">
                <UploadCloud className="w-7 h-7 text-indigo-500" />
                <span className="text-sm font-medium">{file ? file.name : 'Click to upload — PDF, Word, image, screenshot, calendar'}</span>
                <span className="text-xs text-muted-foreground">{file ? `${(file.size / 1024).toFixed(0)} KB` : 'or drop it here'}</span>
                <input type="file" className="hidden" accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif,.webp,.tiff,.bmp,.ics,.xls,.xlsx,.csv,.ppt,.pptx,.html" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </label>
            </div>

            {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}

            {data && (
              <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4 animate-fade-in min-w-0">
                <p className="text-sm font-semibold flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-600" /> Extracted preview</p>
                {(data.semester || data.course_name) && (
                  <p className="text-xs text-muted-foreground truncate">{[data.course_name, data.semester].filter(Boolean).join(' · ')}</p>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <Stat icon={ListChecks} label="Tasks" n={data.tasks?.length || 0} />
                  <Stat icon={CalendarClock} label="Events" n={data.events?.length || 0} />
                  <Stat icon={Users} label="Contacts" n={data.contacts?.length || 0} />
                  <Stat icon={FileText} label="Topics" n={data.topics?.length || 0} />
                </div>
                {(data.contacts?.length > 0) && (
                  <div className="space-y-1.5 text-sm min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground">Contacts</p>
                    {(data.contacts || []).slice(0, 4).map((c, i) => (
                      <div key={'c' + i} className="flex items-center justify-between gap-2 bg-card rounded-lg px-3 py-1.5 min-w-0">
                        <span className="truncate min-w-0">{c.name}{c.role ? ` · ${c.role}` : ''}</span>
                        <span className="text-xs text-muted-foreground shrink-0 truncate max-w-[50%]">{c.email || c.phone || c.office_location || ''}</span>
                      </div>
                    ))}
                    {data.contacts.length > 4 && <p className="text-xs text-muted-foreground pl-1">+{data.contacts.length - 4} more</p>}
                  </div>
                )}
                {(data.tasks?.length > 0 || data.events?.length > 0) && (
                  <div className="space-y-1.5 text-sm min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground">Events &amp; tasks</p>
                    {(data.events || []).slice(0, 6).map((e, i) => (
                      <div key={'e' + i} className="flex items-center justify-between gap-2 bg-card rounded-lg px-3 py-1.5 min-w-0">
                        <span className="truncate min-w-0">{e.title}</span>
                        <span className="text-xs text-muted-foreground shrink-0 truncate max-w-[50%]">{EVENT_TYPE[e.type]?.label || 'Event'}{e.start_date ? ` · ${new Date(e.start_date).toLocaleDateString()}` : ''}{e.repeat && e.repeat !== 'none' ? ` · ${e.repeat}` : ''}</span>
                      </div>
                    ))}
                    {(data.tasks || []).slice(0, 6).map((t, i) => (
                      <div key={'t' + i} className="flex items-center justify-between gap-2 bg-card rounded-lg px-3 py-1.5 min-w-0">
                        <span className="truncate min-w-0">{t.title}</span>
                        <span className="text-xs text-muted-foreground shrink-0 truncate max-w-[50%]">{TASK_TYPE[t.type]?.label || 'Misc'}{t.due_date ? ` · ${new Date(t.due_date).toLocaleDateString()}` : ''}</span>
                      </div>
                    ))}
                    {(((data.events?.length || 0) + (data.tasks?.length || 0)) > 12) && (
                      <p className="text-xs text-muted-foreground pl-1">+{(data.events?.length || 0) + (data.tasks?.length || 0) - 12} more — all are added, edit after.</p>
                    )}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">Review the details — you can edit everything after it's added.</p>
              </div>
            )}

          </div>
        )}
        </div>
        {!done && (
          <DialogFooter className="p-6 pt-3 shrink-0 border-t border-border/60 bg-background sm:flex-row sm:justify-center">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            {!data ? (
              <Button onClick={handleExtract} disabled={!file || loading}>
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Reading…</> : <><Sparkles className="w-4 h-4 mr-2" /> Extract</>}
              </Button>
            ) : (
              <Button onClick={handleConfirm} disabled={saving}>
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : (isCalendarMode ? 'Import to calendar' : (isSchool && courseId !== 'new' ? 'Update planner' : 'Add to planner'))}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Stat({ icon: Icon, label, n }) {
  return (
    <div className="bg-card rounded-lg py-2 px-1 border border-border/60">
      <Icon className="w-4 h-4 mx-auto text-indigo-500" />
      <p className="text-lg font-bold leading-tight mt-0.5">{n}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}