import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trash2, RotateCcw, FileText, CalendarClock, GraduationCap, Users, Trash } from 'lucide-react';
import { restoreItem, purgeItem } from '@/lib/trash';
import { useArea } from '@/lib/AreaContext';
import { fmt } from '@/lib/planner';

const ICONS = { Task: FileText, Event: CalendarClock, Course: GraduationCap, Contact: Users };
const TINTS = { Task: 'text-indigo-600 bg-indigo-50', Event: 'text-violet-600 bg-violet-50', Course: 'text-teal-600 bg-teal-50', Contact: 'text-pink-600 bg-pink-50' };

export default function TrashPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { area } = useArea();

  async function load() {
    setLoading(true);
    const t = await base44.entities.TrashItem.filter({ area }, '-deleted_date', 200);
    setItems(t);
    setLoading(false);
  }
  useEffect(() => { load(); }, [area]);

  async function restore(it) { await restoreItem(it); load(); }
  async function purge(it) { await purgeItem(it); load(); }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2"><Trash className="w-7 h-7 text-muted-foreground" /> Trash</h1>
        <p className="text-sm text-muted-foreground mt-1">Restore anything you deleted by accident, or remove it for good.</p>
      </div>

      {loading ? <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted/60 animate-pulse" />)}</div>
        : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
            <Trash2 className="w-10 h-10 mb-3 opacity-50" />
            <p className="font-medium">Trash is empty.</p>
            <p className="text-sm mt-1">Deleted items land here so you can bring them back.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((it) => {
              const Icon = ICONS[it.entity_type] || FileText;
              const tint = TINTS[it.entity_type] || 'text-slate-600 bg-slate-100';
              return (
                <Card key={it.id} className="p-3 flex items-center gap-3">
                  <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${tint}`}><Icon className="w-4 h-4" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{it.name}</p>
                    <p className="text-xs text-muted-foreground">{it.entity_type} · deleted {fmt(it.deleted_date, 'MMM d, h:mm a')}</p>
                  </div>
                  <Button variant="outline" size="sm" className="shrink-0" onClick={() => restore(it)}><RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Restore</Button>
                  <Button variant="ghost" size="sm" className="shrink-0 text-rose-600 hover:text-rose-700" onClick={() => purge(it)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </Card>
              );
            })}
          </div>
        )}
    </div>
  );
}