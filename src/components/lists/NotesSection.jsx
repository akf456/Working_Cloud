import React, { useState, useMemo } from 'react';
import { Pencil, Trash2, StickyNote, Inbox, ChevronDown } from 'lucide-react';
import { CollapsibleGroup, ListFilters } from './shared';
import { useI18n } from '@/lib/I18nContext';

const EMPTY = { q: '', course: 'all' };

function NoteRow({ note, course, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="group rounded-xl border border-border/60 px-3 py-3 hover:bg-accent/30 transition" style={{ borderLeft: `3px solid ${note.color || '#fde68a'}` }}>
      <div className="flex items-center gap-3">
        <StickyNote className="w-4 h-4 text-amber-500 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm truncate">{note.title}</p>
          {course && <p className="text-xs text-muted-foreground">{course.code || course.name}</p>}
        </div>
        {note.content && <button onClick={() => setOpen((o) => !o)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary transition shrink-0"><ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} /></button>}
        <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition shrink-0">
          <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-background text-muted-foreground hover:text-indigo-600" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-background text-muted-foreground hover:text-rose-600" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>
      {open && note.content && <div className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap px-1">{note.content}</div>}
    </div>
  );
}

export default function NotesSection({ notes, courses, area, onEdit, onDelete }) {
  const { t } = useI18n();
  const [filters, setFilters] = useState(EMPTY);
  const patch = (p) => setFilters((f) => ({ ...f, ...p }));
  const courseMap = Object.fromEntries(courses.map((c) => [c.id, c]));

  const filtered = useMemo(() => notes.filter((n) => {
    if (filters.q) {
      const q = filters.q.toLowerCase();
      if (!(n.title || '').toLowerCase().includes(q) && !(n.content || '').toLowerCase().includes(q)) return false;
    }
    if (filters.course !== 'all' && n.course_id !== filters.course) return false;
    return true;
  }).sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date)), [notes, filters]);

  return (
    <div>
      <ListFilters area={area} courses={courses} typeOptions={[]} variant="note" values={filters} onPatch={patch} searchPlaceholder={t('tasks.search')} />
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
          <Inbox className="w-10 h-10 mb-3 opacity-50" />
          <p className="font-medium">{t('lists.noNotes')}</p>
          <p className="text-sm mt-1">{t('lists.addFirst')}</p>
        </div>
      ) : (
        <CollapsibleGroup storageKey={`wb_lists_notes_${area}`}
          badge={<span className="text-xs font-semibold px-2 py-0.5 rounded-full text-amber-700 bg-amber-50 ring-1 ring-amber-200">{t('lists.notesGroup')}</span>}
          count={filtered.length}>
          {filtered.map((n) => <NoteRow key={n.id} note={n} course={courseMap[n.course_id]} onEdit={() => onEdit(n)} onDelete={() => onDelete(n)} />)}
        </CollapsibleGroup>
      )}
    </div>
  );
}