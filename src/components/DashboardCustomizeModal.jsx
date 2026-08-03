import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, Eye, EyeOff, GripVertical } from 'lucide-react';
import { DASHBOARD_WIDGETS, DEFAULT_DASHBOARD_ORDER } from '@/lib/dashboardWidgets';

export default function DashboardCustomizeModal({ open, onClose, order, hidden, onSave }) {
  const [o, setO] = useState(DEFAULT_DASHBOARD_ORDER);
  const [h, setH] = useState(new Set());

  useEffect(() => {
    if (open) {
      setO(order?.length ? order : DEFAULT_DASHBOARD_ORDER);
      setH(new Set(hidden || []));
    }
  }, [open, order, hidden]);

  function move(i, dir) {
    const n = [...o]; const j = i + dir;
    if (j < 0 || j >= n.length) return;
    [n[i], n[j]] = [n[j], n[i]]; setO(n);
  }
  function toggle(k) { const n = new Set(h); n.has(k) ? n.delete(k) : n.add(k); setH(n); }
  function save() { onSave({ order: o, hidden: [...h] }); }

  return (
    <Dialog open={open} onOpenChange={(x) => !x && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Customize dashboard</DialogTitle>
          <DialogDescription>Reorder or hide widgets. Saved to your account for this area.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          {o.map((k, i) => {
            const w = DASHBOARD_WIDGETS.find((x) => x.key === k);
            if (!w) return null;
            const visible = !h.has(k);
            return (
              <div key={k} className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${visible ? 'border-border' : 'border-dashed opacity-60'}`}>
                <GripVertical className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{w.label}</p></div>
                <button onClick={() => toggle(k)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground" title={visible ? 'Hide' : 'Show'}>{visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}</button>
                <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                <button onClick={() => move(i, 1)} disabled={i === o.length - 1} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>Save layout</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}