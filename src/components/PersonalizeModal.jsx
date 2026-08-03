import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { AREAS } from '@/lib/areas';

const DEFAULTS = { primary: '', accent: '', text: '', background: '', image: '' };

const AREA_DEFAULTS = {
  school: { primary: '#a78bfa', accent: '#ddd6fe', text: '#1f2937', background: '', image: '' },
  work: { primary: '#334155', accent: '#e2e8f0', text: '#1e293b', background: '', image: '' },
  personal: { primary: '#0d9488', accent: '#99f6e4', text: '#1f2937', background: '', image: '' },
  shareable: { primary: '#f97316', accent: '#fed7aa', text: '#1f2937', background: '', image: '' }
};

const NOTES = {
  school: 'School is pastel by default — make it yours anytime.',
  work: 'Work is professional monotone by default — tweak it if you like.',
  personal: 'Personal is fully yours — pick any colors & a cover photo.',
  shareable: 'Each member sees their own colors here — yours stays private to you.'
};

export default function PersonalizeModal({ open, area = 'personal', onClose }) {
  const { user, checkUserAuth } = useAuth();
  const { toast } = useToast();
  const [p, setP] = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      const saved = user?.area_themes?.[area] || (area === 'personal' ? user?.personal_theme : null);
      setP({ ...AREA_DEFAULTS[area], ...saved });
    }
  }, [open, area, user]);

  async function save() {
    setSaving(true);
    try {
      const next = { ...(user?.area_themes || {}), [area]: p };
      await base44.auth.updateMe({ area_themes: next });
      await checkUserAuth();
      toast({ title: `${AREAS[area].label} styled ✨` });
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
          <DialogTitle>Customize {AREAS[area].label}</DialogTitle>
          <DialogDescription>{NOTES[area]} These style your titles, accents & background for this area.</DialogDescription>
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