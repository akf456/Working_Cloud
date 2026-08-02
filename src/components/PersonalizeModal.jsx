import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const DEFAULTS = { primary: '#0d9488', accent: '#99f6e4', text: '#1f2937', background: '', image: '' };

export default function PersonalizeModal({ open, onClose }) {
  const { user, checkUserAuth } = useAuth();
  const { toast } = useToast();
  const [p, setP] = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setP({ ...DEFAULTS, ...(user?.personal_theme || {}) });
  }, [open, user]);

  async function save() {
    setSaving(true);
    try {
      await base44.auth.updateMe({ personal_theme: p });
      await checkUserAuth();
      toast({ title: 'Your space is styled ✨' });
      onClose();
    } catch (e) {
      toast({ title: 'Could not save', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Personalize your space</DialogTitle>
          <DialogDescription>Pick the colors that feel like you. They apply to titles, accents & the background of your Personal area.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <ColorRow label="Primary / accent" value={p.primary} onChange={(v) => setP({ ...p, primary: v })} />
          <ColorRow label="Secondary accent" value={p.accent} onChange={(v) => setP({ ...p, accent: v })} />
          <ColorRow label="Text & titles" value={p.text} onChange={(v) => setP({ ...p, text: v })} />
          <ColorRow label="Background (optional)" value={p.background || '#fdfcfb'} onChange={(v) => setP({ ...p, background: v })} />
          <div className="space-y-1.5">
            <Label>Cover image URL (optional)</Label>
            <Input value={p.image || ''} onChange={(e) => setP({ ...p, image: e.target.value })} placeholder="https://…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save look'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ColorRow({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-9 h-9 rounded-lg border border-border cursor-pointer bg-transparent" />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="w-28" />
      </div>
    </div>
  );
}