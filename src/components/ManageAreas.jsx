import React from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal } from 'lucide-react';
import { AREA_LIST } from '@/lib/areas';

export default function ManageAreas({ hidden, onToggle }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 rounded-xl bg-card/80 backdrop-blur">
          <SlidersHorizontal className="w-4 h-4" /> Manage areas
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-3">
        <p className="text-sm font-semibold mb-0.5">Manage areas</p>
        <p className="text-xs text-muted-foreground mb-3">Toggle on to hide an area. Your data is kept safe — nothing is deleted.</p>
        <div className="space-y-1">
          {AREA_LIST.map((a) => (
            <div key={a.key} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-accent/40">
              <span className="inline-flex items-center gap-2 text-sm font-medium">
                <span className="w-7 h-7 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: a.monoBg }}>
                  <a.Icon className="w-4 h-4" />
                </span>
                {a.label}
              </span>
              <Switch checked={hidden.has(a.key)} onCheckedChange={() => onToggle(a.key)} aria-label={`Hide ${a.label}`} />
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}