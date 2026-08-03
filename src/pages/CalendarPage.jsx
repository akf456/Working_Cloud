import React, { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Plus, CalendarDays, Printer } from 'lucide-react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  addMonths, subMonths, isSameMonth, isSameDay, parseISO, isValid, format, startOfDay
} from 'date-fns';
import { EVENT_TYPE, parseDate, fmtTime, fmt, expandTaskOccurrences } from '@/lib/planner';
import EventModal from '@/components/EventModal';
import { trashItem } from '@/lib/trash';
import { useArea } from '@/lib/AreaContext';

export default function CalendarPage() {
  const [cursor, setCursor] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selected, setSelected] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const { area } = useArea();

  async function load() {
    setLoading(true);
    const [e, t, c] = await Promise.all([
      base44.entities.Event.filter({ area }, '-start_date', 300),
      base44.entities.Task.filter({ area }, '-due_date', 300),
      base44.entities.Course.filter({ area })
    ]);
    setEvents(e); setTasks(t); setCourses(c);
    setLoading(false);
  }
  useEffect(() => { load(); }, [area]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const today = useMemo(() => startOfDay(new Date()), []);

  // Build a map of day -> items, expanding recurring tasks into occurrences and
  // floating overdue (past-due, incomplete) tasks onto today's cell flagged red.
  const { dayMap, overdueTasks } = useMemo(() => {
    const map = new Map();
    const key = (d) => format(d, 'yyyy-MM-dd');
    const cell = (d) => {
      const k = key(d);
      if (!map.has(k)) map.set(k, { evs: [], tks: [] });
      return map.get(k);
    };
    events.forEach((e) => { const d = parseDate(e.start_date); if (d) cell(startOfDay(d)).evs.push(e); });

    const gridEnd = days[days.length - 1];
    const genEnd = gridEnd.getTime() > today.getTime() ? gridEnd : today;
    const overdue = [];
    tasks.filter((t) => t.status !== 'done').forEach((t) => {
      const occs = expandTaskOccurrences(t, genEnd);
      let missed = null;
      occs.forEach((o) => {
        if (o.getTime() >= today.getTime()) {
          if (o.getTime() <= gridEnd.getTime()) cell(o).tks.push(t);
        } else if (!missed || o.getTime() > missed.getTime()) {
          missed = o;
        }
      });
      if (missed) overdue.push({ task: t, due: missed });
    });
    return { dayMap: map, overdueTasks: overdue };
  }, [events, tasks, days, today]);

  function itemsForDay(day) {
    const entry = dayMap.get(format(day, 'yyyy-MM-dd')) || { evs: [], tks: [] };
    const tks = entry.tks.map((t) => ({ ...t }));
    if (isSameDay(day, today)) {
      const byId = new Map(tks.map((t) => [t.id, t]));
      overdueTasks.forEach((o) => {
        const existing = byId.get(o.task.id);
        if (existing) { existing._overdue = true; existing._overdueDue = o.due; }
        else { const copy = { ...o.task, _overdue: true, _overdueDue: o.due }; tks.push(copy); byId.set(o.task.id, copy); }
      });
    }
    return { evs: entry.evs, tks };
  }

  const courseMap = Object.fromEntries(courses.map((c) => [c.id, c]));
  const evColor = (e) => (courseMap[e.course_id]?.color) || (EVENT_TYPE[e.type] || EVENT_TYPE.event).dot;
  const tkColor = (t) => courseMap[t.course_id]?.color || '#f59e0b';
  const selectedItems = itemsForDay(selected);

  async function saveEvent(data) {
    if (data.id) await base44.entities.Event.update(data.id, data);
    else await base44.entities.Event.create({ ...data, area });
    setEditEvent(null); load();
  }

  async function deleteEvent(e) {
    await trashItem('Event', e, area); load();
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Calendar</h1>
          <p className="text-sm text-muted-foreground mt-1">Exams, deadlines, classes & events in one view.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()} className="rounded-xl"><Printer className="w-4 h-4 mr-1.5" /> Print</Button>
          <Button onClick={() => { setEditEvent(null); setModal(true); }} className="rounded-xl"><Plus className="w-4 h-4 mr-1.5" /> Add event</Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{format(cursor, 'MMMM yyyy')}</h2>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => setCursor(subMonths(cursor, 1))}><ChevronLeft className="w-4 h-4" /></Button>
              <Button variant="ghost" size="sm" onClick={() => { setCursor(new Date()); setSelected(new Date()); }}>Today</Button>
              <Button variant="ghost" size="icon" onClick={() => setCursor(addMonths(cursor, 1))}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
            {courses.length > 0 && <span className="text-[11px] font-semibold text-muted-foreground mr-1">Key:</span>}
            {courses.map((c) => (
              <span key={c.id} className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color || '#6366f1' }} />
                {c.code || c.name}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5 text-[11px] text-rose-600">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600" /> Overdue
            </span>
          </div>
          <div className="grid grid-cols-7 text-center text-xs font-medium text-muted-foreground mb-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d} className="py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const { evs, tks } = itemsForDay(day);
              const inMonth = isSameMonth(day, cursor);
              const isSel = isSameDay(day, selected);
              const isToday = isSameDay(day, today);
              return (
                <button key={day.toISOString()} onClick={() => setSelected(day)}
                  className={`min-h-[58px] md:min-h-[84px] rounded-lg border p-1.5 text-left transition flex flex-col
                    ${isSel ? 'border-indigo-400 bg-indigo-50/50' : 'border-transparent hover:bg-accent/50'}
                    ${!inMonth ? 'opacity-35' : ''}`}>
                  <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white' : ''}`}>{format(day, 'd')}</span>
                  <div className="mt-1 space-y-0.5 overflow-hidden">
                    {evs.slice(0, 2).map((e) => {
                      const col = evColor(e);
                      return <div key={e.id} className="text-[10px] truncate rounded px-1 py-0.5" style={{ backgroundColor: col + '22', color: col }}>{e.title}</div>;
                    })}
                    {tks.slice(0, 2).map((t, i) => {
                      const overdue = !!t._overdue;
                      const col = overdue ? '#dc2626' : tkColor(t);
                      return <div key={t.id + (overdue ? '-o' : '') + i} className="text-[10px] truncate rounded px-1 py-0.5 font-medium" style={{ backgroundColor: col + '22', color: col }}>{overdue ? '⚠ ' : '⚑ '}{t.title}</div>;
                    })}
                    {(evs.length + tks.length) > 4 && <div className="text-[10px] text-muted-foreground px-1">+{evs.length + tks.length - 4} more</div>}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Day detail */}
        <Card className="p-5">
          <h2 className="text-lg font-semibold">{format(selected, 'EEEE, MMM d')}</h2>
          <p className="text-sm text-muted-foreground mb-4">{selectedItems.evs.length + selectedItems.tks.length} item(s)</p>
          <div className="space-y-2">
            {selectedItems.evs.map((e) => {
              const E = EVENT_TYPE[e.type] || EVENT_TYPE.event;
              const c = courseMap[e.course_id];
              return (
                <div key={e.id} className="group rounded-xl border border-border/60 p-3 hover:bg-accent/30 transition">
                  <div className="flex items-start gap-2">
                    <span className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: courseMap[e.course_id]?.color || E.dot }} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm">{e.title}</p>
                      <p className="text-xs text-muted-foreground">{E.label}{c ? ` · ${c.code || c.name}` : ''}</p>
                      {!e.all_day && <p className="text-xs text-muted-foreground">{fmtTime(e.start_date)}{e.end_date ? ` – ${fmtTime(e.end_date)}` : ''}</p>}
                      {e.location && <p className="text-xs text-muted-foreground">📍 {e.location}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition">
                    <button className="text-xs text-indigo-600 hover:underline" onClick={() => { setEditEvent(e); setModal(true); }}>Edit</button>
                    <button className="text-xs text-rose-600 hover:underline" onClick={() => deleteEvent(e)}>Delete</button>
                  </div>
                </div>
              );
            })}
            {selectedItems.tks.map((t, i) => {
              const c = courseMap[t.course_id];
              const overdue = !!t._overdue;
              return (
                <div key={t.id + (overdue ? '-o' : '') + i} className={`rounded-xl border p-3 ${overdue ? 'border-rose-300 bg-rose-50/60' : 'border-amber-200 bg-amber-50/40'}`}>
                  <p className="font-medium text-sm text-rose-700">{overdue ? '⚠ ' : '⚑ '}{t.title}</p>
                  <p className="text-xs text-muted-foreground">{overdue ? `Overdue · was due ${fmt(t._overdueDue)}` : 'Task deadline'}{c ? ` · ${c.code || c.name}` : ''}</p>
                </div>
              );
            })}
            {selectedItems.evs.length === 0 && selectedItems.tks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                <CalendarDays className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">Nothing scheduled.</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => { setEditEvent(null); setModal(true); }}>Add event</Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      <EventModal open={modal} onClose={() => { setModal(false); setEditEvent(null); }} onSave={saveEvent} event={editEvent} courses={courses}
        defaultStart={selected.toISOString()} />
    </div>
  );
}