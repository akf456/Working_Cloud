import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { AREAS } from '@/lib/areas';

const DEFAULTS = { primary: '#0d9488', accent: '#99f6e4', text: '#000000', background: '', image: '' };

export default function Settings() {
  const { user, checkUserAuth } = useAuth();
  const { toast } = useToast();
  const [p, setP] = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setP({ ...DEFAULTS, ...(user?.personal_theme || {}) }); }, [user]);

  async function save() {
    setSaving(true);
    try {
      await base44.auth.updateMe({ personal_theme: p });
      await checkUserAuth();
      toast({ title: 'Settings saved ✨' });
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
        <p className="text-sm text-muted-foreground mb-4">These colors style your <span className="font-medium">Personal</span> area — text, titles, accents & background. School stays pastel, Work stays professional monotone, Shareable stays warm.</p>
        <div className="space-y-4">
          <ColorRow label="Primary / accent" value={p.primary} onChange={(v) => setP({ ...p, primary: v })} />
          <ColorRow label="Secondary accent" value={p.accent} onChange={(v) => setP({ ...p, accent: v })} />
          <ColorRow label="Text & titles" value={p.text} onChange={(v) => setP({ ...p, text: v })} />
          <ColorRow label="Background (optional)" value={p.background || '#fdfcfb'} onChange={(v) => setP({ ...p, background: v })} />
          <div className="space-y-1.5">
            <Label>Cover image URL (optional)</Label>
            <Input value={p.image || ''} onChange={(e) => setP({ ...p, image: e.target.value })} placeholder="https://…" />
          </div>
        </div>
        <div className="flex justify-end mt-5"><Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save color scheme'}</Button></div>
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