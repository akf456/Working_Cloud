import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { taskTypeMeta, fmt, dueLabel } from '@/lib/planner';
import { CheckCircle2, CalendarDays, Link2, Loader2, Plus, Trash2, Info } from 'lucide-react';
import { AREAS } from '@/lib/areas';

export default function ShareBoard() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [nt, setNt] = useState('');
  const [et, setEt] = useState('');
  const [ed, setEd] = useState('');
  const [acting, setActing] = useState(false);

  async function load() {
    try {
      const res = await base44.functions.invoke('getShareBoard', { token });
      setData(res.data);
    } catch (e) { setErr(e?.message || 'Could not load'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [token]);

  async function act(action, payload) {
    setActing(true);
    try { await base44.functions.invoke('shareBoardAction', { token, action, payload }); await load(); }
    catch { /* ignore */ }
    finally { setActing(false); }
  }

  if (loading) return <Center><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></Center>;
  if (err || !data) return <Center><div className="text-center"><Link2 className="w-8 h-8 mx-auto mb-2 opacity-50" /><p className="text-sm text-muted-foreground">This shared organizer isn't available.</p></div></Center>;

  const tasks = data.tasks || [];
  const events = data.events || [];
  const canEdit = !!data.can_edit;
  const areaLabel = AREAS[data.area]?.label || 'organizer';
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
          <h1 className="text-xl font-bold">Shared {areaLabel}</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-2">A shared view of the tasks & events in this organizer.</p>
        <div className={`text-xs rounded-lg px-3 py-2 mb-6 inline-flex items-center gap-2 ${canEdit ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
          <Info className="w-3.5 h-3.5" />
          {canEdit ? 'You can edit — add, check off & delete. Only signed-in collaborators can edit; everyone else views.' : 'View-only. The owner can enable editor access for collaborators using the app.'}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-5">
            <h2 className="font-semibold mb-3">Tasks</h2>
            {canEdit && (
              <div className="flex gap-2 mb-3">
                <Input value={nt} onChange={(e) => setNt(e.target.value)} placeholder="Add a task…" />
                <Button onClick={() => { if (nt.trim()) { act('addTask', { title: nt.trim() }); setNt(''); } }} disabled={acting || !nt.trim()}><Plus className="w-4 h-4" /></Button>
              </div>
            )}
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
                        <div key={t.id} className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${t.flag ? 'border-rose-400 bg-rose-50' : 'border-border/60'}`}>
                          {canEdit ? <Checkbox checked={t.status === 'done'} onCheckedChange={() => act('toggleTask', { id: t.id })} disabled={acting} /> : <span className={`w-7 h-7 rounded-md flex items-center justify-center ${T.chip}`}><T.Icon className="w-3.5 h-3.5" /></span>}
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm font-medium truncate ${t.status === 'done' ? 'line-through opacity-60' : ''}`}>{t.title}</p>
                            <p className="text-xs text-muted-foreground">{T.label}{t.due_date ? ` · ${dueLabel(t.due_date)}` : ''}{t.flag ? ` · ${t.flag}` : ''}</p>
                          </div>
                          {canEdit && <button onClick={() => act('deleteTask', { id: t.id })} disabled={acting} className="text-muted-foreground hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>}
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
            {canEdit && (
              <div className="grid grid-cols-[1fr_auto] gap-2 mb-3">
                <Input value={et} onChange={(e) => setEt(e.target.value)} placeholder="Event title" />
                <Input type="date" value={ed} onChange={(e) => setEd(e.target.value)} className="w-36" />
                <Button onClick={() => { if (et.trim() && ed) { act('addEvent', { title: et.trim(), start_date: new Date(ed).toISOString() }); setEt(''); setEd(''); } }} disabled={acting || !et.trim() || !ed} className="col-span-2"><Plus className="w-4 h-4 mr-1.5" /> Add event</Button>
              </div>
            )}
            {events.length === 0 ? <Empty text="No events shared." /> : events.slice(0, 12).map((e) => (
              <div key={e.id} className={`flex items-center gap-2 rounded-lg border px-3 py-2 mb-1.5 ${e.flag ? 'border-rose-400 bg-rose-50' : 'border-border/60'}`}>
                <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
                <div className="min-w-0 flex-1"><p className="text-sm font-medium truncate">{e.title}</p><p className="text-xs text-muted-foreground">{fmt(e.start_date)}{e.location ? ` · ${e.location}` : ''}{e.flag ? ` · ${e.flag}` : ''}</p></div>
                {canEdit && <button onClick={() => act('deleteEvent', { id: e.id })} disabled={acting} className="text-muted-foreground hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>}
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