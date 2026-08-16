import React, { useState, useMemo } from 'react';
import { Inbox } from 'lucide-react';
import { taskTypeMeta, daysUntil, parseDate } from '@/lib/planner';
import { CollapsibleGroup, TodoListRow, ListFilters } from './shared';
import { useI18n } from '@/lib/I18nContext';

const EMPTY = { q: '', course: 'all', priority: 'all', due: 'all', status: 'all', type: 'all' };

export default function TodoSection({ tasks, courses, area, onToggle, onRemove, onDuplicate, onEdit }) {
  const { t } = useI18n();
  const [filters, setFilters] = useState(EMPTY);
  const patch = (p) => setFilters((f) => ({ ...f, ...p }));
  const typeOptions = useMemo(() => [...new Set(tasks.map((tk) => tk.type).filter(Boolean))].map((k) => ({ value: k, label: taskTypeMeta(k).label })), [tasks]);

  const filtered = useMemo(() => tasks.filter((tk) => {
    if (filters.q && !tk.title.toLowerCase().includes(filters.q.toLowerCase())) return false;
    if (filters.course !== 'all' && tk.course_id !== filters.course) return false;
    if (filters.status === 'overdue') { const d = daysUntil(tk.due_date); if (d === null || d >= 0 || tk.status === 'done') return false; }
    else if (filters.status !== 'all' && tk.status !== filters.status) return false;
    if (filters.type !== 'all' && tk.type !== filters.type) return false;
    if (filters.priority !== 'all' && tk.priority !== filters.priority) return false;
    if (filters.due !== 'all') {
      const d = daysUntil(tk.due_date); if (d === null) return false;
      if (filters.due === 'overdue' && !(d < 0 && tk.status !== 'done')) return false;
      if (filters.due === 'today' && d !== 0) return false;
      if (filters.due === 'week' && !(d >= 0 && d <= 7)) return false;
      if (filters.due === 'month' && !(d >= 0 && d <= 30)) return false;
    }
    return true;
  }), [tasks, filters]);

  const active = filtered.filter((tk) => tk.status !== 'done').sort((a, b) => (parseDate(a.due_date)?.getTime() || Infinity) - (parseDate(b.due_date)?.getTime() || Infinity));
  const done = filtered.filter((tk) => tk.status === 'done').sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date));

  const row = (tk) => <TodoListRow key={tk.id} task={tk} onToggle={() => onToggle(tk)} onEdit={() => onEdit(tk)} onDelete={() => onRemove(tk)} onDuplicate={() => onDuplicate(tk)} />;

  return (
    <div>
      <ListFilters area={area} courses={courses} typeOptions={typeOptions} variant="todo" values={filters} onPatch={patch} searchPlaceholder={t('tasks.search')} />
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
          <Inbox className="w-10 h-10 mb-3 opacity-50" />
          <p className="font-medium">{t('lists.noTodo')}</p>
          <p className="text-sm mt-1">{t('lists.addFirst')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          <CollapsibleGroup storageKey={`wb_lists_todo_active_${area}`}
            badge={<span className="text-xs font-semibold px-2 py-0.5 rounded-full text-slate-600 bg-slate-100">{t('lists.todoActive')}</span>}
            count={active.length}>
            {active.map(row)}
          </CollapsibleGroup>
          {done.length > 0 && (
            <CollapsibleGroup storageKey={`wb_lists_todo_done_${area}`}
              badge={<span className="text-xs font-semibold px-2 py-0.5 rounded-full text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200">{t('lists.todoDone')}</span>}
              count={done.length}>
              {done.map(row)}
            </CollapsibleGroup>
          )}
        </div>
      )}
    </div>
  );
}