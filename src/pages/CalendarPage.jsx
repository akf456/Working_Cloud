import React, { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Plus, CalendarDays, Printer } from 'lucide-react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  addMonths, subMonths, isSameMonth, isSameDay, parseISO, isValid, format, startOfDay
} from 'date-fns';
import { EVENT_TYPE, parseDate, fmtTime, fmt, expandTaskOccurrences, expandEventOccurrences } from '@/lib/planner';
import EventModal from '@/components/EventModal';
import { trashItem } from '@/lib/trash';
import { useArea } from '@/lib/AreaContext';
import { useSearchParams } from 'react-router-dom';

export default function CalendarPage() {
  const [cursor, setCursor] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selected, setSelected] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const { area } = useArea();
  const modalEvent = searchParams.get('modal') === 'event';
  const eventIdParam = searchParams.get('id');
  const editEvent = (modalEvent && eventIdParam && eventIdParam !== 'new') ? events.find((e) => e.id === eventIdParam) || null : null;
  function openEventModal(e) {
    setSearchParams((prev) => { const n = new URLSearchParams(prev); n.set('modal', 'event'); n.set('id', e?.id || 'new'); return n; });
  }
  function closeEventModal() {
    setSearchParams((prev) => { const n = new URLSearchParams(prev); n.delete('modal'); n.delete('id'); return n; });
  }

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

  // Each task appears ONLY on its due date / occurrence dates (expanded for
  // recurring tasks). Past-due incomplete tasks stay on their due-date cell
  // flagged red — they never float to today or appear on days before they're due.
  const dayMap = useMemo(() => {
    const map = new Map();
    const key = (d) => format(d, 'yyyy-MM-dd');
    const cell = (d) => {
      const k = key(d);
      if (!map.has(k)) map.set(k, { evs: [], tks: [] });
      return map.get(k);
    };
    const gridStart = days[0];
    const gridEnd = days[days.length - 1];
    events.forEach((e) => {
      const occs = expandEventOccurrences(e, gridEnd);
      occs.forEach((o) => {
        if (o.getTime() >= gridStart.getTime() && o.getTime() <= gridEnd.getTime()) {
          cell(o).evs.push(e);
        }
      });
    });
    tasks.filter((t) => t.status !== 'done').forEach((t) => {
      const occs = expandTaskOccurrences(t, gridEnd);
      occs.forEach((o) => {
        if (o.getTime() >= gridStart.getTime() && o.getTime() <= gridEnd.getTime()) {
          cell(o).tks.push({ ...t, _overdue: o.getTime() < today.getTime() });
        }
      });
    });
    return map;
  }, [events, tasks, days, today]);

  function itemsForDay(day) {
    return dayMap.get(format(day, 'yyyy-MM-dd')) || { evs: [], tks: [] };
  }

  const courseMap = Object.fromEntries(courses.map((c) => [c.id, c]));
  const evColor = (e) => (courseMap[e.course_id]?.color) || (EVENT_TYPE[e.type] || EVENT_TYPE.event).dot;
  const tkColor = (t) => t.color || courseMap[t.course_id]?.color || '#f59e0b';
  const selectedItems = itemsForDay(selected);

  async function saveEvent(data) {
    if (data.id) await base44.entities.Event.update(data.id, data);
    else await base44.entities.Event.create({ ...data, area });
    load();
  }

  async function deleteEvent(e) {
    await trashItem('Event', e, area); load();
  }

  async function duplicateEvent(e) {
    const copy = {
      title: `${e.title} (copy)`,
      description: e.description || '',
      start_date: e.start_date,
      end_date: e.end_date || e.start_date,
      all_day: e.all_day ?? false,
      type: e.type || 'event',
      course_id: e.course_id || null,
      location: e.location || '',
      repeat: e.repeat || 'none',
      repeat_days: Array.isArray(e.repeat_days) ? e.repeat_days : [],
      repeat_start_date: e.repeat_start_date || null,
      repeat_end_date: e.repeat_end_date || null,
      source: 'manual',
      area
    };
    await base44.entities.Event.create(copy);
    load();
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
          <Button onClick={() => openEventModal(null)} className="rounded-xl"><Plus className="w-4 h-4 mr-1.5" /> Add event</Button>
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
                      const flagged = t.flag === 'manual';
                      const col = overdue ? '#dc2626' : tkColor(t);
                      const sym = overdue ? '⚠ ' : flagged ? '⚑ ' : '';
                      return <div key={t.id + (overdue ? '-o' : '') + i} className="text-[10px] truncate rounded px-1 py-0.5 font-medium" style={{ backgroundColor: col + '22', color: col }}>{sym}{t.title}</div>;
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
                  <div className="flex flex-wrap gap-3 mt-2">
                    <button className="text-xs font-medium text-indigo-600 hover:underline" onClick={() => openEventModal(e)}>Edit</button>
                    <button className="text-xs font-medium text-indigo-600 hover:underline" onClick={() => duplicateEvent(e)}>Duplicate</button>
                    <button className="text-xs font-medium text-rose-600 hover:underline" onClick={() => deleteEvent(e)}>Delete</button>
                  </div>
                </div>
              );
            })}
            {selectedItems.tks.map((t, i) => {
              const c = courseMap[t.course_id];
              const overdue = !!t._overdue;
              const flagged = t.flag === 'manual';
              const col = overdue ? '#dc2626' : tkColor(t);
              const sym = overdue ? '⚠ ' : flagged ? '⚑ ' : '';
              return (
                <div key={t.id + (overdue ? '-o' : '') + i} className="rounded-xl border p-3" style={{ borderColor: col + '55', backgroundColor: col + '14' }}>
                  <p className="font-medium text-sm" style={{ color: overdue ? '#be123c' : col }}>{sym}{t.title}</p>
                  <p className="text-xs text-muted-foreground">{overdue ? 'Overdue' : flagged ? 'Flagged' : 'Task deadline'}{c ? ` · ${c.code || c.name}` : ''}</p>
                </div>
              );
            })}
            {selectedItems.evs.length === 0 && selectedItems.tks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                <CalendarDays className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">Nothing scheduled.</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => openEventModal(null)}>Add event</Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      <EventModal open={modalEvent} onClose={closeEventModal} onSave={saveEvent} event={editEvent} courses={courses}
        defaultStart={selected.toISOString()} area={area} />
    </div>
  );
}