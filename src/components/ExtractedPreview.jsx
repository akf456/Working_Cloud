import React from 'react';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, FileText, CalendarClock, ListChecks, Users } from 'lucide-react';
import { toInputDateTime, fromInputDateTime } from '@/lib/planner';

const rowCls = 'h-8 text-xs rounded-lg';

const KIND_OPTIONS = [
  { value: 'task', label: 'Task' },
  { value: 'todo', label: 'To-Do' },
  { value: 'event', label: 'Event' }
];

// Editable preview of what AI extracted from a document. Every row can be
// fixed, deleted, or added; tasks and events can be re-classified as Task,
// To-Do, or Event before anything is saved.
export default function ExtractedPreview({ data, onChange }) {
  const d = data || {};
  const setSection = (key, next) => onChange({ ...d, [key]: next });
  const patchItem = (key, idx, patch) => setSection(key, (d[key] || []).map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const removeItem = (key, idx) => setSection(key, (d[key] || []).filter((_, i) => i !== idx));
  const addItem = (key, blank) => setSection(key, [...(d[key] || []), blank]);

  return (
    <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4 animate-fade-in min-w-0">
      <p className="text-sm font-semibold flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-600" /> Extracted preview — edit before adding</p>
      {(d.semester || d.course_name) && (
        <p className="text-xs text-muted-foreground truncate">{[d.course_name, d.semester].filter(Boolean).join(' · ')}</p>
      )}

      <Section icon={ListChecks} title="Tasks & deadlines" empty="No tasks found — add one below."
        onAdd={() => addItem('tasks', { title: '', due_date: null, as: 'task' })}>
        {(d.tasks || []).map((t, i) => (
          <Row key={'tk' + i} onRemove={() => removeItem('tasks', i)}>
            <Input className={rowCls + ' flex-1 min-w-[120px]'} value={t.title || ''} onChange={(e) => patchItem('tasks', i, { title: e.target.value })} placeholder="Title" />
            <Input type="datetime-local" className={rowCls + ' w-full sm:w-52'} value={toInputDateTime(t.due_date)} onChange={(e) => patchItem('tasks', i, { due_date: fromInputDateTime(e.target.value) })} />
            <NativeSelect value={t.as || 'task'} onChange={(v) => patchItem('tasks', i, { as: v })} />
          </Row>
        ))}
      </Section>

      <Section icon={CalendarClock} title="Events" empty="No events found — add one below."
        onAdd={() => addItem('events', { title: '', start_date: null, as: 'event' })}>
        {(d.events || []).map((ev, i) => (
          <Row key={'ev' + i} onRemove={() => removeItem('events', i)}>
            <Input className={rowCls + ' flex-1 min-w-[120px]'} value={ev.title || ''} onChange={(e) => patchItem('events', i, { title: e.target.value })} placeholder="Title" />
            <Input type="datetime-local" className={rowCls + ' w-full sm:w-52'} value={toInputDateTime(ev.start_date)} onChange={(e) => patchItem('events', i, { start_date: fromInputDateTime(e.target.value) })} />
            <NativeSelect value={ev.as || 'event'} onChange={(v) => patchItem('events', i, { as: v })} />
          </Row>
        ))}
      </Section>

      <Section icon={Users} title="Contacts" empty="No contacts found — add one below."
        onAdd={() => addItem('contacts', { name: '', role: '', email: '', phone: '', office_location: '' })}>
        {(d.contacts || []).map((c, i) => (
          <Row key={'ct' + i} onRemove={() => removeItem('contacts', i)}>
            <Input className={rowCls + ' flex-1 min-w-[110px]'} value={c.name || ''} onChange={(e) => patchItem('contacts', i, { name: e.target.value })} placeholder="Name" />
            <Input className={rowCls + ' w-full sm:w-40'} value={c.email || ''} onChange={(e) => patchItem('contacts', i, { email: e.target.value })} placeholder="Email" />
            <Input className={rowCls + ' w-full sm:w-32'} value={c.phone || ''} onChange={(e) => patchItem('contacts', i, { phone: e.target.value })} placeholder="Phone" />
            <Input className={rowCls + ' w-full sm:w-36'} value={c.office_location || ''} onChange={(e) => patchItem('contacts', i, { office_location: e.target.value })} placeholder="Office" />
          </Row>
        ))}
      </Section>

      <p className="text-xs text-muted-foreground">Delete or fix anything irrelevant, add anything missing, and reclassify items as Task, To-Do, or Event — only what you keep gets added.</p>
    </div>
  );
}

function Section({ icon: Icon, title, empty, onAdd, children }) {
  return (
    <div className="space-y-1.5 text-sm min-w-0">
      <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><Icon className="w-3.5 h-3.5" /> {title}</p>
      <div className="space-y-1">
        {React.Children.count(children) === 0 && <p className="text-xs text-muted-foreground px-1">{empty}</p>}
        {children}
      </div>
      <button type="button" onClick={onAdd} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1 px-1">
        <Plus className="w-3.5 h-3.5" /> Add
      </button>
    </div>
  );
}

function Row({ onRemove, children }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 bg-card rounded-lg px-2 py-1.5 min-w-0">
      {children}
      <button type="button" onClick={onRemove} className="p-1 rounded-lg text-muted-foreground hover:text-rose-600 transition shrink-0" title="Remove">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function NativeSelect({ value, onChange }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="h-8 text-xs rounded-lg border border-input bg-background px-2 shrink-0 cursor-pointer">
      {KIND_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}