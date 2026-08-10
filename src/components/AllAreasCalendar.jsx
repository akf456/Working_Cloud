import React, { useState, useMemo } from 'react';
import { AREAS, AREA_LIST } from '@/lib/areas';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function ymd(d) {
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt.getTime())) return null;
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}
function textColor(areaKey) {
  return areaKey === 'school' ? '#1f2937' : '#ffffff';
}

export default function AllAreasCalendar({ tasks = [], events = [], hiddenAreas = [] }) {
  const [cursor, setCursor] = useState(new Date());

  const byDay = useMemo(() => {
    const hidden = new Set(hiddenAreas);
    const map = {};
    const add = (d, area, title) => {
      if (!area || hidden.has(area)) return;
      const k = ymd(d);
      if (!k) return;
      (map[k] = map[k] || []).push({ area, title: title || '' });
    };
    tasks.forEach((t) => { if (t.due_date) add(t.due_date, t.area, t.title); });
    events.forEach((e) => { if (e.start_date) add(e.start_date, e.area, e.title); });
    return map;
  }, [tasks, events, hiddenAreas]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthLabel = new Date(year, month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const startWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const todayKey = ymd(new Date());

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 md:p-5 mt-4">
      <div className="flex items-center justify-between mb-4 gap-3">
        <div>
          <h2 className="font-semibold text-lg">All areas calendar</h2>
          <p className="text-xs text-muted-foreground">{monthLabel}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={() => setCursor(new Date(year, month - 1, 1))}><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>Today</Button>
          <Button variant="outline" size="icon" onClick={() => setCursor(new Date(year, month + 1, 1))}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        {AREA_LIST.filter((a) => !new Set(hiddenAreas).has(a.key)).map((a) => (
          <div key={a.key} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: a.monoBg }} />
            <span className="text-xs text-muted-foreground">{a.label}</span>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto -mx-1 px-1 pb-1">
        <div className="min-w-[680px] grid grid-cols-7 gap-px bg-border/40 rounded-lg overflow-hidden">
          {WEEKDAYS.map((w) => (
            <div key={w} className="bg-card text-center text-xs font-semibold text-muted-foreground py-2">{w}</div>
          ))}
          {cells.map((c, i) => {
            if (!c) return <div key={i} className="bg-card min-h-[112px]" />;
            const k = ymd(c);
            const items = (byDay[k] || []).slice().sort((a, b) => (a.area < b.area ? -1 : a.area > b.area ? 1 : 0));
            const isToday = k === todayKey;
            return (
              <div key={i} className="bg-card p-1.5 min-h-[112px]">
                <div className={`text-xs font-semibold mb-1 inline-flex items-center justify-center rounded-full w-6 h-6 ${isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'}`}>{c.getDate()}</div>
                <div className="space-y-1">
                  {items.slice(0, 4).map((it, idx) => (
                    <div
                      key={idx}
                      className="text-[10px] leading-tight truncate rounded px-1 py-0.5 font-medium"
                      style={{ backgroundColor: AREAS[it.area]?.monoBg, color: textColor(it.area) }}
                      title={it.title}
                    >
                      {it.title}
                    </div>
                  ))}
                  {items.length > 4 && <div className="text-[10px] text-muted-foreground">+{items.length - 4} more</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}