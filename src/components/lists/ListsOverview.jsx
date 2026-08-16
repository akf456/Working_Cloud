import React from 'react';
import { ArrowRight, ListTodo, ListChecks, StickyNote } from 'lucide-react';
import { useI18n } from '@/lib/I18nContext';
import { parseDate } from '@/lib/planner';
import { isEventCompletable, isEventDoneOnDay } from '@/lib/events';
import { format, startOfDay } from 'date-fns';

export default function ListsOverview({ regularTasks, todoLists, events, notes, onPick, loading }) {
  const { t } = useI18n();

  const eventActive = events.filter((e) => {
    const d = parseDate(e.start_date);
    if (!d) return false;
    const past = d.getTime() < startOfDay(new Date()).getTime();
    const done = isEventCompletable(e) && isEventDoneOnDay(e, format(startOfDay(d), 'yyyy-MM-dd'));
    return !past && !done;
  }).length;

  const tasksActive = regularTasks.filter((tk) => tk.status !== 'done').length;
  const todoActive = todoLists.filter((tk) => tk.status !== 'done').length;

  const cards = [
    { key: 'tasks', label: t('lists.tab.tasks'), tagline: t('lists.tasksTagline'), Icon: ListTodo, color: '#6366f1', count: tasksActive + eventActive },
    { key: 'todo', label: t('lists.tab.todo'), tagline: t('lists.todoTagline'), Icon: ListChecks, color: '#14b8a6', count: todoActive },
    { key: 'notes', label: t('lists.tab.notes'), tagline: t('lists.notesTagline'), Icon: StickyNote, color: '#f59e0b', count: notes.length },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full max-w-3xl mx-auto">
        {[...Array(3)].map((_, i) => <div key={i} className="h-48 rounded-3xl bg-muted/60 animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full max-w-3xl mx-auto">
      {cards.map((c) => (
        <button key={c.key} onClick={() => onPick(c.key)} className="group text-left rounded-3xl border border-border/70 bg-card p-6 hover:shadow-lg hover:-translate-y-1 transition-all animate-fade-in">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-sm mb-4" style={{ backgroundColor: c.color }}>
            <c.Icon className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold mb-1">{c.label}</h2>
          <p className="text-sm text-muted-foreground mb-1">{c.tagline}</p>
          <p className="text-xs text-muted-foreground mb-4">{c.count} active</p>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all">
            {t('lists.open', { name: c.label })} <ArrowRight className="w-4 h-4" />
          </span>
        </button>
      ))}
    </div>
  );
}