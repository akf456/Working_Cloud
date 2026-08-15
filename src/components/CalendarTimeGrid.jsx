import React, { useMemo, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { parseDate } from '@/lib/planner';
import { isEventCompletable } from '@/lib/events';

const HOUR_H = 52;
const ALLDAY_H = 46;

function fmtTime(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const ampm = h < 12 ? 'AM' : 'PM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hh}${ampm}` : `${hh}:${String(m).padStart(2, '0')}${ampm}`;
}

// Greedy first-fit column assignment grouped by connected overlap components,
// so overlapping events sit side-by-side (like Google Calendar) with text kept
// visible. Each group's column count = its peak concurrency.
function layoutTimed(timed) {
  const sorted = [...timed].sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);
  const groups = [];
  let cur = [];
  let curMax = -1;
  sorted.forEach((it) => {
    if (cur.length && it.startMin >= curMax) { groups.push(cur); cur = []; }
    cur.push(it);
    curMax = Math.max(curMax, it.endMin);
  });
  if (cur.length) groups.push(cur);
  groups.forEach((g) => {
    const cols = [];
    g.forEach((it) => {
      let ci = cols.findIndex((c) => c <= it.startMin);
      if (ci === -1) { ci = cols.length; cols.push(it.endMin); } else cols[ci] = it.endMin;
      it._col = ci;
    });
    const total = cols.length;
    g.forEach((it) => { it._cols = total; });
  });
  return sorted;
}

function DayColumn({ day, cell, evColor, tkColor, today, onEditEvent, onEditTask, onToggleEvent, onSelectDay, compact }) {
  const { allDay, timed } = useMemo(() => {
    const all = [];
    const tm = [];
    cell.evs.forEach((e) => {
      if (e.all_day) { all.push({ kind: 'event', id: e.id, title: e.title, color: evColor(e), done: !!e._done, raw: e }); return; }
      const s = parseDate(e.start_date);
      const en = parseDate(e.end_date);
      if (!s) { all.push({ kind: 'event', id: e.id, title: e.title, color: evColor(e), done: !!e._done, raw: e }); return; }
      const startMin = s.getHours() * 60 + s.getMinutes();
      let endMin = en ? en.getHours() * 60 + en.getMinutes() : startMin + 60;
      if (endMin <= startMin) endMin = startMin + 60;
      tm.push({ kind: 'event', id: e.id, title: e.title, color: evColor(e), startMin, endMin, done: !!e._done, raw: e, completable: isEventCompletable(e) });
    });
    cell.tks.forEach((t) => {
      all.push({ kind: 'task', id: t.id, title: t.title, color: tkColor(t), done: !!t._done, raw: t });
    });
    return { allDay: all, timed: tm };
  }, [cell, evColor, tkColor]);

  const laid = useMemo(() => layoutTimed(timed), [timed]);
  const isToday = format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();

  return (
    <div className="border-l border-foreground/50 first:border-l-0">
      {/* All-day strip + day header */}
      <button
        type="button"
        onClick={() => onSelectDay && onSelectDay(day)}
        className={`block w-full text-left px-1.5 pt-1 sticky top-0 z-20 bg-card border-b border-foreground/50 ${onSelectDay ? 'hover:bg-accent/40' : ''}`}
        style={{ height: ALLDAY_H }}
      >
        <div className="flex items-baseline gap-1.5">
          <span className={`text-xs font-semibold ${isToday ? 'text-indigo-600' : 'text-muted-foreground'}`}>{format(day, compact ? 'EEE' : 'EEEE')}</span>
          <span className={`text-sm font-bold ${isToday ? 'bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}`}>{format(day, 'd')}</span>
        </div>
        <div className="flex flex-wrap gap-1 mt-0.5 overflow-hidden" style={{ maxHeight: 28 }}>
          {allDay.slice(0, 3).map((it, i) => (
            <span
              key={it.kind + it.id + i}
              title={it.title}
              onClick={(e) => { e.stopPropagation(); it.kind === 'event' ? onEditEvent(it.raw) : onEditTask(it.raw); }}
              className={`text-[10px] leading-tight px-1.5 py-0.5 rounded truncate max-w-full cursor-pointer ${it.done ? 'line-through opacity-60' : ''}`}
              style={{ backgroundColor: it.color + '22', color: it.color }}
            >
              {it.kind === 'task' ? '⚑ ' : ''}{it.title}
            </span>
          ))}
          {allDay.length > 3 && <span className="text-[10px] text-muted-foreground self-center">+{allDay.length - 3}</span>}
        </div>
      </button>

      {/* 24-hour time grid */}
      <div className="relative" style={{ height: 24 * HOUR_H }}>
        {Array.from({ length: 24 }).map((_, h) => (
          <div key={h} className="absolute left-0 right-0 border-t border-foreground/50" style={{ top: h * HOUR_H }} />
        ))}
        {laid.map((it) => {
          const top = (it.startMin / 60) * HOUR_H;
          const h = Math.max(((it.endMin - it.startMin) / 60) * HOUR_H, 20);
          const wPct = 100 / it._cols;
          return (
            <div
              key={it.id}
              onClick={() => onEditEvent(it.raw)}
              className="absolute rounded-md px-1.5 py-1 overflow-hidden cursor-pointer hover:brightness-95 transition"
              style={{
                top, height: h,
                left: `calc(${it._col * wPct}% + 2px)`,
                width: `calc(${wPct}% - 4px)`,
                backgroundColor: it.color + '26',
                borderLeft: `3px solid ${it.color}`
              }}
            >
              <div className="flex items-start gap-1">
                {it.completable && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onToggleEvent(it.raw); }}
                    className={`shrink-0 w-3.5 h-3.5 mt-0.5 rounded-full border-2 flex items-center justify-center ${it.done ? 'bg-emerald-500 border-emerald-500' : ''}`}
                    style={!it.done ? { borderColor: it.color } : undefined}
                  >
                    {it.done && <span className="text-white text-[8px] leading-none">✓</span>}
                  </button>
                )}
                <div className="min-w-0">
                  <p className={`text-[11px] font-semibold leading-tight truncate ${it.done ? 'line-through opacity-60' : ''}`} style={{ color: it.color }} title={it.title}>{it.title}</p>
                  <p className="text-[9px] text-muted-foreground leading-tight">{fmtTime(it.startMin)}–{fmtTime(it.endMin)}</p>
                </div>
              </div>
            </div>
          );
        })}
        {isToday && (
          <div className="absolute left-0 right-0 z-10 flex items-center pointer-events-none" style={{ top: (nowMin / 60) * HOUR_H }}>
            <span className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
            <div className="flex-1 h-px bg-red-500" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function CalendarTimeGrid({ days, itemsForDay, evColor, tkColor, today, onEditEvent, onEditTask, onToggleEvent, onSelectDay, compact }) {
  const scrollRef = useRef(null);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = 7 * HOUR_H; }, []);
  const hours = Array.from({ length: 24 });

  return (
    <div className="surface p-2 md:p-3">
      <div ref={scrollRef} className={`overflow-y-auto ${compact ? 'overflow-x-auto' : ''}`} style={{ maxHeight: '72vh' }}>
        <div className="flex" style={compact ? { minWidth: 720 } : undefined}>
          {/* hour gutter */}
          <div className="w-12 shrink-0 border-r border-foreground/50">
            <div className="sticky top-0 z-20 bg-card" style={{ height: ALLDAY_H }} />
            <div className="relative" style={{ height: 24 * HOUR_H }}>
              {hours.map((_, h) => (
                <div key={h} className="absolute right-1.5 text-[10px] text-muted-foreground" style={{ top: h * HOUR_H, transform: 'translateY(-7px)' }}>
                  {fmtTime(h * 60)}
                </div>
              ))}
            </div>
          </div>
          {/* day columns */}
          <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
            {days.map((d) => (
              <DayColumn
                key={d.toISOString()}
                day={d}
                cell={itemsForDay(d)}
                evColor={evColor}
                tkColor={tkColor}
                today={today}
                onEditEvent={onEditEvent}
                onEditTask={onEditTask}
                onToggleEvent={onToggleEvent}
                onSelectDay={onSelectDay}
                compact={compact}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}