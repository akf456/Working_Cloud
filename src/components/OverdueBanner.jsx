import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { daysUntil, parseDate } from '@/lib/planner';

export default function OverdueBanner({ tasks, courses }) {
  const courseMap = Object.fromEntries((courses || []).map((c) => [c.id, c]));
  const overdue = tasks
    .filter((t) => t.status !== 'done' && daysUntil(t.due_date) !== null && daysUntil(t.due_date) < 0)
    .sort((a, b) => parseDate(a.due_date) - parseDate(b.due_date));
  if (overdue.length === 0) return null;

  return (
    <div className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-4 mb-6 animate-pop">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-5 h-5 text-rose-600" />
        <h3 className="font-bold text-rose-700">Overdue — let’s get these finished!</h3>
        <span className="text-xs font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">{overdue.length}</span>
      </div>
      <div className="space-y-1.5">
        {overdue.map((t) => {
          const c = courseMap[t.course_id];
          const n = daysUntil(t.due_date);
          return (
            <div key={t.id} className="flex items-center gap-2 text-sm">
              <span className="font-bold text-rose-700 truncate">{t.title}</span>
              {c && <span className="text-xs text-rose-500/80 shrink-0">· {c.code || c.name}</span>}
              <span className="ml-auto text-xs font-bold text-rose-600 shrink-0">{Math.abs(n)}d overdue</span>
            </div>
          );
        })}
      </div>
      <Link to="/tasks" className="inline-block mt-2 text-xs font-bold text-rose-600 hover:text-rose-800 underline">Review in Tasks →</Link>
    </div>
  );
}