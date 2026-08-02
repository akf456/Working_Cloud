import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { taskTypeMeta, fmt, dueLabel } from '@/lib/planner';
import { CheckCircle2, CalendarDays, Link2, Loader2 } from 'lucide-react';

export default function ShareBoard() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke('getShareBoard', { token });
        setData(res.data);
      } catch (e) {
        setErr(e?.message || 'Could not load');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) return <Center><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></Center>;
  if (err || !data) return <Center><div className="text-center"><Link2 className="w-8 h-8 mx-auto mb-2 opacity-50" /><p className="text-sm text-muted-foreground">This shared organizer isn't available.</p></div></Center>;

  const tasks = data.tasks || [];
  const events = data.events || [];
  const groups = [
    { key: 'todo', label: 'To Do' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'done', label: 'Done' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-4 md:p-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-400 to-amber-300 flex items-center justify-center"><CalendarDays className="w-4 h-4 text-white" /></span>
          <h1 className="text-xl font-bold">Shared organizer</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-6">A read-only view of the tasks & events shared with you.</p>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-5">
            <h2 className="font-semibold mb-3">Tasks</h2>
            {tasks.length === 0 ? <Empty text="No tasks shared." /> : groups.map((g) => {
              const items = tasks.filter((t) => t.status === g.key);
              if (!items.length) return null;
              return (
                <div key={g.key} className="mb-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-1.5">{g.label} · {items.length}</p>
                  <div className="space-y-1.5">
                    {items.map((t) => {
                      const T = taskTypeMeta(t.type);
                      return (
                        <div key={t.id} className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2">
                          <span className={`w-7 h-7 rounded-md flex items-center justify-center ${T.chip}`}><T.Icon className="w-3.5 h-3.5" /></span>
                          <div className="min-w-0 flex-1"><p className="text-sm font-medium truncate">{t.title}</p><p className="text-xs text-muted-foreground">{T.label}</p></div>
                          {t.due_date && <span className="text-xs text-muted-foreground">{dueLabel(t.due_date)}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </Card>

          <Card className="p-5">
            <h2 className="font-semibold mb-3">Upcoming events</h2>
            {events.length === 0 ? <Empty text="No events shared." /> : events.slice(0, 12).map((e) => (
              <div key={e.id} className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 mb-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
                <div className="min-w-0 flex-1"><p className="text-sm font-medium truncate">{e.title}</p><p className="text-xs text-muted-foreground">{fmt(e.start_date)}{e.location ? ` · ${e.location}` : ''}</p></div>
              </div>
            ))}
          </Card>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">This view is limited to the shared organizer only.</p>
      </div>
    </div>
  );
}

function Center({ children }) { return <div className="min-h-screen flex items-center justify-center p-6">{children}</div>; }
function Empty({ text }) { return <div className="flex flex-col items-center justify-center py-8 text-muted-foreground"><CheckCircle2 className="w-7 h-7 mb-2 opacity-50" /><p className="text-sm">{text}</p></div>; }