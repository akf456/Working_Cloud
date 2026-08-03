import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { AREAS } from '@/lib/areas';

const AREA_DEFAULTS = {
  school: { primary: '#a78bfa', accent: '#ddd6fe', text: '#1f2937', background: '', image: '' },
  work: { primary: '#334155', accent: '#e2e8f0', text: '#1e293b', background: '', image: '' },
  personal: { primary: '#0d9488', accent: '#99f6e4', text: '#1f2937', background: '', image: '' },
  shareable: { primary: '#f97316', accent: '#fed7aa', text: '#1f2937', background: '', image: '' }
};

const NOTES = {
  school: 'School is pastel by default.',
  work: 'Work is professional monotone by default.',
  personal: 'Personal is fully yours.',
  shareable: 'Each member sees their own colors in Shareables.'
};

export default function Settings() {
  const { user, checkUserAuth } = useAuth();
  const { toast } = useToast();
  const [area, setArea] = useState('personal');
  const [p, setP] = useState(AREA_DEFAULTS.personal);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const saved = user?.area_themes?.[area] || (area === 'personal' ? user?.personal_theme : null);
    setP({ ...AREA_DEFAULTS[area], ...saved });
  }, [area, user]);

  async function save() {
    setSaving(true);
    try {
      const next = { ...(user?.area_themes || {}), [area]: p };
      await base44.auth.updateMe({ area_themes: next });
      await checkUserAuth();
      toast({ title: `${AREAS[area].label} colors saved ✨` });
    } catch (e) {
      toast({ title: 'Could not save', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto animate-fade-in">
      <h1 className="text-2xl md:text-3xl font-bold mb-1">Settings</h1>
      <p className="text-sm text-muted-foreground mb-6">Manage your color scheme & preferences.</p>

      <Card className="p-5 mb-5">
        <h2 className="font-semibold text-lg mb-1">Color scheme</h2>
        <p className="text-sm text-muted-foreground mb-4">Pick the colors that feel like you. Each area keeps its own style — override any of them below. {NOTES[area]}</p>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Area</Label>
            <Select value={area} onValueChange={setArea}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.values(AREAS).map((a) => <SelectItem key={a.key} value={a.key}>{a.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <ColorRow label="Primary / accent" value={p.primary} onChange={(v) => setP({ ...p, primary: v })} />
          <ColorRow label="Secondary accent" value={p.accent} onChange={(v) => setP({ ...p, accent: v })} />
          <ColorRow label="Text & titles" value={p.text} onChange={(v) => setP({ ...p, text: v })} />
          <ColorRow label="Background (optional)" value={p.background || '#fdfcfb'} onChange={(v) => setP({ ...p, background: v })} />
          <div className="space-y-1.5">
            <Label>Cover image URL (optional)</Label>
            <Input value={p.image || ''} onChange={(e) => setP({ ...p, image: e.target.value })} placeholder="https://…" />
          </div>
        </div>
        <div className="flex justify-end mt-5"><Button onClick={save} disabled={saving}>{saving ? 'Saving…' : `Save ${AREAS[area].label} colors`}</Button></div>
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold text-lg mb-2">Your areas</h2>
        <div className="space-y-2 text-sm">
          {Object.values(AREAS).map((a) => (
            <div key={a.key} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: a.accent }} />
              <span className="font-medium">{a.label}</span>
              <span className="text-muted-foreground">— {a.tagline}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
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