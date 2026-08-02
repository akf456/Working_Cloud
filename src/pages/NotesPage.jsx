import React, { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Plus, Pencil, Trash2, NotebookPen, Search } from 'lucide-react';
import NoteModal from '@/components/NoteModal';

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState(null);

  async function load() {
    setLoading(true);
    const [n, c] = await Promise.all([base44.entities.Note.list('-updated_date', 200), base44.entities.Course.list()]);
    setNotes(n); setCourses(c);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const courseMap = Object.fromEntries(courses.map((c) => [c.id, c]));

  const filtered = useMemo(() => {
    if (!q) return notes;
    const s = q.toLowerCase();
    return notes.filter((n) => (n.title || '').toLowerCase().includes(s) || (n.content || '').toLowerCase().includes(s) || (n.tags || []).some((t) => t.toLowerCase().includes(s)));
  }, [notes, q]);

  async function saveNote(data) {
    if (data.id) await base44.entities.Note.update(data.id, data);
    else await base44.entities.Note.create(data);
    setEdit(null); load();
  }
  async function remove(id) { await base44.entities.Note.delete(id); load(); }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Notes</h1>
          <p className="text-sm text-muted-foreground mt-1">Lecture notes, study snippets, ideas — color-coded & searchable.</p>
        </div>
        <Button onClick={() => { setEdit(null); setModal(true); }} className="rounded-xl"><Plus className="w-4 h-4 mr-1.5" /> New note</Button>
      </div>

      <div className="relative mb-5 max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search notes…" className="pl-9" />
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-40 rounded-2xl bg-muted/60 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
          <NotebookPen className="w-10 h-10 mb-3 opacity-50" />
          <p className="font-medium">No notes yet.</p>
          <p className="text-sm mt-1">Capture your first thought.</p>
          <Button className="mt-4" onClick={() => { setEdit(null); setModal(true); }}><Plus className="w-4 h-4 mr-1.5" /> New note</Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((n) => {
            const c = courseMap[n.course_id];
            const plain = (n.content || '').replace(/<[^>]+>/g, ' ').trim();
            return (
              <Card key={n.id} className="group relative p-4 hover:shadow-md transition cursor-pointer overflow-hidden" style={{ backgroundColor: n.color || '#fef9c3' }}
                onClick={() => { setEdit(n); setModal(true); }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-semibold pr-8">{n.title}</p>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition absolute top-3 right-3">
                    <button onClick={(e) => { e.stopPropagation(); setEdit(n); setModal(true); }} className="p-1.5 rounded-lg hover:bg-black/5 text-slate-600"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={(e) => { e.stopPropagation(); remove(n.id); }} className="p-1.5 rounded-lg hover:bg-black/5 text-slate-600 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <p className="text-sm text-slate-700/80 line-clamp-4 whitespace-pre-wrap">{plain || 'No content'}</p>
                <div className="flex items-center gap-2 flex-wrap mt-3">
                  {c && <span className="text-[11px] inline-flex items-center gap-1 bg-black/5 rounded-full px-2 py-0.5 text-slate-700"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />{c.code || c.name}</span>}
                  {(n.tags || []).map((t) => <span key={t} className="text-[11px] bg-black/5 rounded-full px-2 py-0.5 text-slate-700">#{t}</span>)}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <NoteModal open={modal} onClose={() => { setModal(false); setEdit(null); }} onSave={saveNote} note={edit} courses={courses} />
    </div>
  );
}