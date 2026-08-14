import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { CHANGELOG, APP_VERSION, setLastSeenVersion } from '@/lib/changelog';

export default function WhatNewModal({ open, onClose, entries }) {
  const list = entries && entries.length ? entries : CHANGELOG;
  function close() {
    setLastSeenVersion(APP_VERSION);
    onClose();
  }
  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> What's New
          </DialogTitle>
          <DialogDescription>The latest improvements to Working Cloud.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {list.map((entry) => (
            <div key={entry.version}>
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-sm">{entry.title}</p>
                <span className="text-[11px] text-muted-foreground shrink-0">{entry.date}</span>
              </div>
              <ul className="mt-1.5 space-y-1.5">
                {entry.items.map((it, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2 leading-relaxed">
                    <span className="text-primary shrink-0">•</span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <Button onClick={close} className="w-full">Got it</Button>
      </DialogContent>
    </Dialog>
  );
}