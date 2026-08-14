import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Sparkles, Pencil, Trash2, BookOpen, ListTodo, CalendarClock, GraduationCap } from 'lucide-react';
import { fmt, dueLabel, daysUntil, parseDate } from '@/lib/planner';
import SyllabusImporter from '@/components/SyllabusImporter';
import PullToRefresh from '@/components/PullToRefresh';
import { trashItem } from '@/lib/trash';
import { useArea } from '@/lib/AreaContext';
import { AREAS } from '@/lib/areas';
import { useI18n } from '@/lib/I18nContext';

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [importer, setImporter] = useState(false);
  const [edit, setEdit] = useState(null);
  const { area } = useArea();
  const a = AREAS[area];
  const { t } = useI18n();

  async function load() {
    setLoading(true);
    const [c, t, e] = await Promise.all([
      base44.entities.Course.filter({ area }),
      base44.entities.Task.filter({ area }, '-due_date', 300),
      base44.entities.Event.filter({ area }, '-start_date', 200)
    ]);
    setCourses(c); setTasks(t); setEvents(e);
    setLoading(false);
  }
  useEffect(() => { load(); }, [area]);

  async function saveCourse(data) {
    if (data.id) await base44.entities.Course.update(data.id, data);
    else await base44.entities.Course.create({ ...data, area });
    setEdit(null); setModal(false); load();
  }
  async function remove(c) {
    await trashItem('Course', c, area); load();
  }

  return (
    <PullToRefresh onRefresh={load} className="p-4 md:p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{t('area.' + area + '.grouping')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{area === 'school' ? t('courses.subtitleSchool') : t('courses.subtitleOther')}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setImporter(true)} className="rounded-xl"><Sparkles className="w-4 h-4 mr-1.5 text-indigo-600" /> {area === 'school' ? t('courses.importSyllabus') : t('courses.importDoc')}</Button>
          <Button onClick={() => { setEdit(null); setModal(true); }} className="rounded-xl"><Plus className="w-4 h-4 mr-1.5" /> {t('courses.add', { singular: t('area.' + area + '.singular') })}</Button>
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <div key={i} className="h-44 rounded-2xl bg-muted/60 animate-pulse" />)}</div>
      ) : courses.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4"><GraduationCap className="w-7 h-7 text-indigo-600" /></div>
          <p className="font-semibold text-lg">No {a.groupingLabel.toLowerCase()} yet</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">{area === 'school' ? 'Add a course manually, or import a syllabus to create one with all deadlines auto-filled.' : 'Add one manually, or import a document to auto-fill tasks, deadlines & contacts.'}</p>
          <div className="flex gap-2 justify-center mt-5">
            <Button onClick={() => setImporter(true)}><Sparkles className="w-4 h-4 mr-1.5" /> {area === 'school' ? t('courses.importSyllabus') : t('courses.importDoc')}</Button>
            <Button variant="outline" onClick={() => { setEdit(null); setModal(true); }}>{t('courses.addManually')}</Button>
          </div>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((c) => {
            const ctasks = tasks.filter((t) => t.course_id === c.id);
            const open = ctasks.filter((t) => t.status !== 'done');
            const next = open.filter((t) => parseDate(t.due_date)).sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0];
            const cevents = events.filter((e) => e.course_id === c.id);
            const exams = cevents.filter((e) => e.type === 'exam');
            return (
              <Card key={c.id} className="p-5 relative overflow-hidden group hover:shadow-md transition">
                <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: c.color }} />
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0" style={{ backgroundColor: c.color }}>{(c.code || c.name || '?').slice(0, 2).toUpperCase()}</div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{area === 'school' ? `${c.code || ''}${c.instructor ? ` · ${c.instructor}` : ''}` : (c.notes || '')}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition">
                    <button onClick={() => { setEdit(c); setModal(true); }} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-indigo-600"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => remove(c)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <span className="inline-flex items-center gap-1"><ListTodo className="w-3.5 h-3.5" />{open.length} open</span>
                  <span className="inline-flex items-center gap-1"><CalendarClock className="w-3.5 h-3.5" />{area === 'school' ? `${exams.length} exams` : `${cevents.length} events`}</span>
                </div>
                {next ? (
                  <div className="rounded-lg bg-amber-50/60 border border-amber-100 px-3 py-2">
                    <p className="text-xs text-amber-700 font-medium">Next due</p>
                    <p className="text-sm font-medium truncate">{next.title}</p>
                    <p className="text-xs text-amber-600">{dueLabel(next.due_date)}</p>
                  </div>
                ) : (
                  <div className="rounded-lg bg-emerald-50/50 border border-emerald-100 px-3 py-2 text-sm text-emerald-700 flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> All caught up</div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <CourseModal open={modal} onClose={() => { setModal(false); setEdit(null); }} onSave={saveCourse} course={edit} index={courses.length} areaLabel={a.singular} area={area} />
      <SyllabusImporter open={importer} onClose={() => setImporter(false)} courses={courses} area={area} onDone={load} />
    </PullToRefresh>
  );
}

function CourseModal({ open, onClose, onSave, course, index, areaLabel = 'Course', area = 'school' }) {
  const COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444', '#0ea5e9', '#84cc16'];
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [instructor, setInstructor] = useState('');
  const [semester, setSemester] = useState('');
  const [notes, setNotes] = useState('');
  const [color, setColor] = useState(COLORS[0]);

  React.useEffect(() => {
    setName(course?.name || '');
    setCode(course?.code || '');
    setInstructor(course?.instructor || '');
    setSemester(course?.semester || '');
    setNotes(course?.notes || '');
    setColor(course?.color || COLORS[index % COLORS.length]);
  }, [course, open, index]);

  function submit() {
    if (!name.trim()) return;
    const payload = { ...(course?.id ? { id: course.id } : {}), name: name.trim(), color };
    if (area === 'school') { payload.code = code.trim(); payload.instructor = instructor.trim(); payload.semester = semester.trim(); }
    else { payload.notes = notes.trim(); }
    onSave(payload);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{course ? `Edit ${areaLabel}` : `New ${areaLabel}`}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5"><Label>{areaLabel} name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder={area === 'school' ? 'Linear Algebra' : areaLabel} list="cat-names" autoFocus />
            <datalist id="cat-names">{(AREAS[area]?.groupingSuggestions || []).map((s) => <option key={s} value={s} />)}</datalist>
          </div>
          {area === 'school' ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Code</Label><Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="MATH 211" /></div>
                <div className="space-y-1.5"><Label>Semester</Label><Input value={semester} onChange={(e) => setSemester(e.target.value)} placeholder="Fall 2026" /></div>
              </div>
              <div className="space-y-1.5"><Label>Instructor</Label><Input value={instructor} onChange={(e) => setInstructor(e.target.value)} placeholder="Dr. Smith" /></div>
            </>
          ) : (
            <div className="space-y-1.5"><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder={`Anything important about this ${areaLabel.toLowerCase()}…`} className="resize-y" /></div>
          )}
          <div className="space-y-1.5"><Label>Color</Label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => <button key={c} type="button" onClick={() => setColor(c)} className={`w-8 h-8 rounded-full border-2 transition ${color === c ? 'border-slate-800 scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />)}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={!name.trim()}>{course ? 'Save changes' : `Add ${areaLabel.toLowerCase()}`}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}