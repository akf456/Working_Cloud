import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { taskTypeMeta, taskTypeColor, tasksToTodayUnits } from '@/lib/planner';

// Polar -> cartesian. 0deg = top, clockwise.
function polar(cx, cy, r, deg) {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

// Donut slice path between [start, end) degrees.
function donutSlice(cx, cy, rO, rI, start, end) {
  if (end - start >= 359.999) end = start + 359.999;
  const [ox1, oy1] = polar(cx, cy, rO, start);
  const [ox2, oy2] = polar(cx, cy, rO, end);
  const [ix2, iy2] = polar(cx, cy, rI, end);
  const [ix1, iy1] = polar(cx, cy, rI, start);
  const large = end - start > 180 ? 1 : 0;
  return `M ${ox1} ${oy1} A ${rO} ${rO} 0 ${large} 1 ${ox2} ${oy2} L ${ix2} ${iy2} A ${rI} ${rI} 0 ${large} 0 ${ix1} ${iy1} Z`;
}

function typeColor(items, typeKey) {
  const colors = items.map((o) => o.color).filter(Boolean);
  if (colors.length) {
    const freq = {};
    let best = colors[0];
    let max = 0;
    colors.forEach((c) => { freq[c] = (freq[c] || 0) + 1; if (freq[c] > max) { max = freq[c]; best = c; } });
    return best;
  }
  return taskTypeColor(typeKey);
}

function shade(hex, alpha) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function WorkloadBreakdown({ tasks }) {
  // One unit per task for today: recurring tasks count once (today's
  // occurrence, done when completed today) instead of N per day, so a
  // daily-repeating task reads 1/1 and restarts each day.
  // Only tasks you haven't finished yet, so completed items don't clutter the
  // chart. Completing the last task in a type drops its slice; unchecking a
  // done task brings the slice back (the parent re-passes tasks on change).
  const occurrences = useMemo(() => tasksToTodayUnits(tasks).filter((o) => !o.done), [tasks]);

  const byType = {};
  occurrences.forEach((o) => {
    const k = o.type || 'misc';
    if (!byType[k]) byType[k] = { items: [], total: 0, done: 0 };
    byType[k].items.push(o);
    byType[k].total++;
    if (o.done) byType[k].done++;
  });

  const rows = Object.entries(byType)
    .filter(([, v]) => v.total > 0)
    .map(([k, v]) => ({
      key: k,
      name: taskTypeMeta(k).label,
      total: v.total,
      done: v.done,
      remaining: v.total - v.done,
      pct: v.total ? Math.round((v.done / v.total) * 100) : 0,
      color: typeColor(v.items, k)
    }))
    .sort((a, b) => b.total - a.total);

  const grandTotal = rows.reduce((s, r) => s + r.total, 0);

  let angle = 0;
  const slices = rows.map((r) => {
    const span = grandTotal ? (r.total / grandTotal) * 360 : 0;
    const s = { ...r, start: angle, span, end: angle + span };
    angle += span;
    return s;
  });

  return (
    <Card className="p-5">
      <h2 className="font-semibold text-lg mb-1">Workload breakdown</h2>
      <p className="text-sm text-muted-foreground mb-4">Only tasks you haven't finished yet — finish the last one in a type and its slice disappears; uncheck it and the slice comes back.</p>
      <div className="grid sm:grid-cols-2 gap-4 items-center">
        <div className="relative h-44">
          {grandTotal === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
              <p className="text-sm">No tasks left 🎉</p>
            </div>
          ) : (
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {slices.map((s) => {
                if (s.span <= 0) return null;
                return (
                  <path key={s.key} d={donutSlice(100, 100, 80, 54, s.start, s.end)} fill={s.color} stroke="hsl(var(--background))" strokeWidth="1.5" />
                );
              })}
            </svg>
          )}
          {grandTotal > 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold gradient-text">{grandTotal}</span>
              <span className="text-[11px] text-muted-foreground">tasks left</span>
            </div>
          )}
        </div>
        <div className="space-y-2.5">
          {rows.length === 0 && <p className="text-sm text-muted-foreground">No tasks left 🎉</p>}
          {rows.map((r) => (
            <div key={r.key}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="inline-flex items-center gap-2 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                  {r.name}
                </span>
                <span className="text-muted-foreground">{r.total} left</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${grandTotal ? (r.total / grandTotal) * 100 : 0}%`, backgroundColor: r.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}