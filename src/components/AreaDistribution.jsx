import React from 'react';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AREA_LIST } from '@/lib/areas';
import { EyeOff } from 'lucide-react';

export default function AreaDistribution({ tasks, currentArea, onDismiss, hiddenAreas = [] }) {
  const data = AREA_LIST.filter((a) => !hiddenAreas.includes(a.key)).map((a) => {
    const list = tasks.filter((t) => t.area === a.key);
    return { name: a.label, key: a.key, total: list.length, color: a.monoBg };
  });
  const busiest = [...data].sort((a, b) => b.total - a.total)[0];
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-semibold text-lg">Where your time goes</h2>
        {onDismiss && (
          <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground transition" title="Hide overview" aria-label="Hide overview">
            <EyeOff className="w-4 h-4" />
          </button>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-4">Tasks across your areas — see which section is taking up the most.</p>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" width={72} tickLine={false} axisLine={false} style={{ fontSize: 12 }} />
            <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))' }} />
            <Bar dataKey="total" name="Tasks" radius={[0, 8, 8, 0]} barSize={22}>
              {data.map((d) => <Cell key={d.key} fill={d.color} fillOpacity={d.key === currentArea ? 1 : 0.5} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {busiest && busiest.total > 0 ? (
        <p className="text-sm mt-2"><span className="font-semibold" style={{ color: busiest.color }}>{busiest.name}</span> has the most on your plate ({busiest.total} tasks).</p>
      ) : <p className="text-sm text-muted-foreground mt-2">No tasks yet — add a few to see your distribution.</p>}
    </Card>
  );
}