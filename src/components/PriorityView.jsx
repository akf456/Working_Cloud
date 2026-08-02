import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Flame, AlertTriangle, Award, CalendarClock } from 'lucide-react';
import { isToday, isThisWeek, isThisMonth } from 'date-fns';
import { priorityScore, daysUntil, dueLabel, taskTypeMeta, PRIORITY, parseDate } from '@/lib/planner';

const RANGES = [
  { key: 'day', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' }
];

export default function PriorityView({ tasks, events, courses, onToggle }) {
  const [range, setRange] = useState('week');
  const courseMap = Object.fromEntries(courses.map((c) => [c.id, c]));

  const ranked = useMemo(() => {
    const inRange = (t) => {
      const d = parseDate(t.due_date);
      if (!d) return false;
      const n = daysUntil(t.due_date);
      if (n !== null && n < 0) return true; // overdue always shows
      if (range === 'day') return isToday(d);
      if (range === 'week') return isThisWeek(d, { weekStartsOn: 1 });
      return isThisMonth(d);
    };
    return tasks
      .filter((t) => t.status !== 'done' && inRange(t))
      .map((t) => ({ t, score: priorityScore(t) }))
      .sort((a, b) => b.score - a.score);
  }, [tasks, range]);

  return (
    <Card className="p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="font-semibold text-lg flex items-center gap-2"><Flame className="w-5 h-5 text-orange-500" /> Priority plan</h2>
          <p className="text-sm text-muted-foreground">Auto-ranked by deadline urgency & weight — exams included but never over a due-tomorrow task.</p>
        </div>
        <div className="inline-flex rounded-xl bg-muted p-1">
          {RANGES.map((r) => (
            <button key={r.key} onClick={() => setRange(r.key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${range === r.key ? 'bg-background shadow-sm text-indigo-600' : 'text-muted-foreground hover:text-foreground'}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {ranked.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <CalendarClock className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-sm">Nothing due in this window — a great time to get ahead.</p>
        </div>
      ) : (
        <ol className="space-y-2">
          {ranked.map(({ t, score }, i) => {
            const T = taskTypeMeta(t.type);
            const P = PRIORITY[t.priority] || PRIORITY.medium;
            const c = courseMap[t.course_id];
            const n = daysUntil(t.due_date);
            const overdue = n !== null && n < 0;
            const dueSoon = n === 0 || n === 1;
            return (
              <li key={t.id} className="flex items-center gap-3 rounded-xl border border-border/60 px-3 py-2.5 hover:bg-accent/30 transition">
                <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                <Checkbox checked={false} onCheckedChange={() => onToggle(t)} className="shrink-0" />
                <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${T.chip}`}><T.Icon className="w-4 h-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{t.title}</p>
                  <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground mt-0.5">
                    <span className="inline-flex items-center gap-1"><span className={`w-1.5 h-1.5 rounded-full ${P.dot}`} />{P.label}</span>
                    <span>· {T.label}</span>
                    {c && <><span>·</span><span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />{c.code || c.name}</span></>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`text-xs font-semibold ${overdue ? 'text-rose-600' : dueSoon ? 'text-amber-600' : 'text-muted-foreground'}`}>{dueLabel(t.due_date)}</span>
                  {overdue ? <Badge Icon={AlertTriangle} text="Overdue" cls="bg-rose-50 text-rose-600" />
                    : t.type === 'exam' ? <Badge Icon={Award} text="Exam" cls="bg-rose-50 text-rose-600" />
                    : dueSoon ? <Badge Icon={CalendarClock} text="Due soon" cls="bg-amber-50 text-amber-600" /> : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}

function Badge({ Icon, text, cls }) {
  return <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cls}`}><Icon className="w-3 h-3" />{text}</span>;
}