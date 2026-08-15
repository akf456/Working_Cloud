import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

const PRESETS = ['#7c3aed', '#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#10b981', '#ef4444', '#0ea5e9'];
const clamp = (v, min, max) => Math.min(max, Math.max(min, Number(v) || min));

export default function PomodoroSettings({ open, onClose, settings, onSave }) {
  const [s, setS] = useState(settings);
  useEffect(() => { if (open) setS(settings); }, [open, settings]);
  const set = (k, v) => setS((p) => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Customize timer</DialogTitle>
          <DialogDescription>Set durations, pick a color, and choose auto-start for breaks and focus.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-3">
            {[
              { key: 'focus', label: 'Focus' },
              { key: 'short', label: 'Short break' },
              { key: 'long', label: 'Long break' },
            ].map((p) => {
              const total = s[p.key];
              const h = Math.floor(total / 60);
              const m = total % 60;
              return (
                <div key={p.key} className="grid grid-cols-[1fr_auto_auto] items-end gap-2">
                  <Label className="text-xs self-center">{p.label}</Label>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Hours</Label>
                    <Input type="number" min={0} max={23} value={h} onChange={(e) => set(p.key, Math.max(1, clamp(e.target.value, 0, 23) * 60 + m))} className="w-20" />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Min</Label>
                    <Input type="number" min={0} max={59} value={m} onChange={(e) => set(p.key, Math.max(1, h * 60 + clamp(e.target.value, 0, 59)))} className="w-20" />
                  </div>
                </div>
              );
            })}
          </div>
          <div>
            <Label className="text-xs">Long break every (focus sessions)</Label>
            <Input type="number" min={2} max={8} value={s.longEvery} onChange={(e) => set('longEvery', clamp(e.target.value, 2, 8))} />
          </div>
          <div>
            <Label className="text-xs mb-2 block">Timer color</Label>
            <div className="flex flex-wrap items-center gap-2">
              {PRESETS.map((c) => (
                <button key={c} type="button" onClick={() => set('color', c)} className={`w-8 h-8 rounded-full border-2 transition ${s.color === c ? 'border-foreground scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} aria-label={c} />
              ))}
              <label className="w-8 h-8 rounded-full border border-border overflow-hidden cursor-pointer relative" title="Custom color">
                <span className="absolute inset-0" style={{ backgroundColor: s.color }} />
                <input type="color" value={s.color} onChange={(e) => set('color', e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
              </label>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5">
            <span className="text-sm">Auto-start breaks</span>
            <Switch checked={!!s.autoStartBreaks} onCheckedChange={(v) => set('autoStartBreaks', v)} />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5">
            <span className="text-sm">Auto-start next focus</span>
            <Switch checked={!!s.autoStartFocus} onCheckedChange={(v) => set('autoStartFocus', v)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(s)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}