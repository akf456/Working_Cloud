import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '@/components/ui/card';
import { TASK_TYPE } from '@/lib/planner';

const TYPE_COLORS = {
  assignment: '#6366f1', exam: '#e11d48', quiz: '#f59e0b', study: '#14b8a6',
  reading: '#0ea5e9', project: '#8b5cf6', misc: '#94a3b8'
};

export default function WorkloadBreakdown({ tasks }) {
  const byType = {};
  Object.keys(TASK_TYPE).forEach((k) => { byType[k] = { total: 0, done: 0 }; });
  tasks.forEach((t) => {
    const k = t.type || 'misc';
    if (!byType[k]) byType[k] = { total: 0, done: 0 };
    byType[k].total++;
    if (t.status === 'done') byType[k].done++;
  });

  const rows = Object.entries(byType).filter(([, v]) => v.total > 0).map(([k, v]) => ({
    key: k, name: TASK_TYPE[k].label, remaining: v.total - v.done, total: v.total,
    done: v.done, pct: v.total ? Math.round((v.done / v.total) * 100) : 0, color: TYPE_COLORS[k] || '#94a3b8'
  }));
  const pieData = rows.filter((r) => r.remaining > 0);
  const allDone = pieData.length === 0;

  return (
    <Card className="p-5">
      <h2 className="font-semibold text-lg mb-1">Workload breakdown</h2>
      <p className="text-sm text-muted-foreground mb-4">What's left, by type — slices show remaining work.</p>
      <div className="grid sm:grid-cols-2 gap-4 items-center">
        <div className="relative h-44">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={allDone ? [{ name: 'Done', value: 1 }] : pieData} dataKey="value" nameKey="name"
                innerRadius={52} outerRadius={78} paddingAngle={2} stroke="none">
                {allDone
                  ? <Cell fill="#e2e8f0" />
                  : pieData.map((d) => <Cell key={d.key} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {allDone ? (
              <span className="text-sm font-semibold text-emerald-600">All done 🎉</span>
            ) : (
              <>
                <span className="text-2xl font-bold gradient-text">{pieData.reduce((s, d) => s + d.value, 0)}</span>
                <span className="text-[11px] text-muted-foreground">remaining</span>
              </>
            )}
          </div>
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