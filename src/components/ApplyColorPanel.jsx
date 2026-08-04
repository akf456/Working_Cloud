import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ChevronDown } from 'lucide-react';
import { taskTypeMeta } from '@/lib/planner';

export default function ApplyColorPanel({ color, tasks, area, courses, selectedIds, onToggle, onSelectAll, onClear }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [fcourse, setFcourse] = useState('all');
  const [ftype, setFtype] = useState('all');

  const courseMap = Object.fromEntries(courses.map((c) => [c.id, c]));
  const typeOptions = useMemo(() => [...new Set(tasks.map((t) => t.type).filter(Boolean))], [tasks]);

  const matched = useMemo(() => tasks.filter((t) => {
    if (q && !t.title.toLowerCase().includes(q.toLowerCase())) return false;
    if (area === 'school' && fcourse !== 'all' && t.course_id !== fcourse) return false;
    if (ftype !== 'all' && t.type !== ftype) return false;
    return true;
  }), [tasks, q, fcourse, ftype, area]);

  const allMatchedSelected = matched.length > 0 && matched.every((t) => selectedIds.has(t.id));

  return (
    <div className="space-y-1.5 rounded-xl border border-border bg-muted/30 p-3">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 w-full text-left text-sm font-medium">
        <span className="w-3.5 h-3.5 rounded-full border border-border shrink-0" style={{ backgroundColor: color }} />
        Apply this color to other tasks
        <span className="text-xs text-muted-foreground ml-auto">{selectedIds.size} selected</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="space-y-2 pt-1">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tasks…" className="h-8 text-xs" />
          <div className="flex gap-2 flex-wrap">
            {area === 'school' && (
              <Select value={fcourse} onValueChange={setFcourse}>
                <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Course" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All courses</SelectItem>
                  {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.code || c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Select value={ftype} onValueChange={setFtype}>
              <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {typeOptions.map((k) => <SelectItem key={k} value={k}>{taskTypeMeta(k).label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <button type="button" className="text-indigo-600 hover:underline font-medium" onClick={() => onSelectAll(allMatchedSelected ? [] : matched.map((t) => t.id))}>
              {allMatchedSelected ? 'Unselect all' : 'Select all'} ({matched.length})
            </button>
            {selectedIds.size > 0 && <button type="button" className="text-muted-foreground hover:underline" onClick={onClear}>Clear</button>}
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {matched.length === 0 && <p className="text-xs text-muted-foreground py-2 text-center">No matching tasks.</p>}
            {matched.map((t) => {
              const c = courseMap[t.course_id];
              const on = selectedIds.has(t.id);
              return (
                <label key={t.id} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 cursor-pointer border ${on ? 'border-primary/40 bg-primary/5' : 'border-transparent hover:bg-accent/50'}`}>
                  <Checkbox checked={on} onCheckedChange={() => onToggle(t.id)} className="shrink-0" />
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: t.color || 'transparent', outline: t.color ? 'none' : '1px dashed #cbd5e1', outlineOffset: '-1px' }} />
                  <span className="text-xs font-medium truncate flex-1">{t.title}</span>
                  <span className="text-[11px] text-muted-foreground shrink-0">{taskTypeMeta(t.type).label}{c ? ` · ${c.code || c.name}` : ''}</span>
                </label>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground">Selected tasks get this color when you save. Filter by course or type to recolor a whole group at once.</p>
        </div>
      )}
    </div>
  );
}