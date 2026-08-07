import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { taskTypeMeta, taskTypeColor, expandTasksToOccurrences } from '@/lib/planner';

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
  // Expand recurring tasks into one occurrence per day so a daily-recurring
  // task counts as N subtasks (e.g. 17 days = 17), each restartable & done per day.
  const occurrences = useMemo(() => expandTasksToOccurrences(tasks), [tasks]);

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
  const grandDone = rows.reduce((s, r) => s + r.done, 0);
  const grandPct = grandTotal ? Math.round((grandDone / grandTotal) * 100) : 0;
  const allDone = grandTotal > 0 && grandDone === grandTotal;

  let angle = 0;
  const slices = rows.map((r) => {
    const span = grandTotal ? (r.total / grandTotal) * 360 : 0;
    const doneSpan = (r.done / r.total) * span;
    const s = { ...r, start: angle, span, doneSpan, end: angle + span };
    angle += span;
    return s;
  });

  return (
    <Card className="p-5">
      <h2 className="font-semibold text-lg mb-1">Workload breakdown</h2>
      <p className="text-sm text-muted-foreground mb-4">Slices sized by task count (recurring tasks count one per day) — each fills as you complete tasks in that type.</p>
      <div className="grid sm:grid-cols-2 gap-4 items-center">
        <div className="relative h-44">
          {grandTotal === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
              <p className="text-sm">No tasks yet.</p>
            </div>
          ) : (
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {slices.map((s) => {
                const remainingStart = s.start + s.doneSpan;
                const remainingEnd = s.end;
                const hasRemaining = s.remaining > 0;
                const fullRing = s.done === s.total;
                return (
                  <g key={s.key}>
                    {hasRemaining && (
                      <path d={donutSlice(100, 100, 80, 54, remainingStart, remainingEnd)} fill={shade(s.color, 0.22)} stroke="hsl(var(--background))" strokeWidth="1.5" />
                    )}
                    {s.done > 0 && (
                      <path d={donutSlice(100, 100, 80, 54, s.start, fullRing ? s.end : remainingStart)} fill={s.color} stroke="hsl(var(--background))" strokeWidth="1.5" />
                    )}
                  </g>
                );
              })}
            </svg>
          )}
          {grandTotal > 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              {allDone ? (
                <span className="text-sm font-semibold text-emerald-600">All done 🎉</span>
              ) : (
                <>
                  <span className="text-2xl font-bold gradient-text">{grandPct}%</span>
                  <span className="text-[11px] text-muted-foreground">{grandDone}/{grandTotal} done</span>
                </>
              )}
            </div>
          )}
        </div>
        <div className="space-y-2.5">
          {rows.length === 0 && <p className="text-sm text-muted-foreground">No tasks yet.</p>}
          {rows.map((r) => (
            <div key={r.key}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="inline-flex items-center gap-2 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                  {r.name}
                </span>
                <span className="text-muted-foreground">{r.done}/{r.total} done · {r.pct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${r.pct}%`, backgroundColor: r.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}