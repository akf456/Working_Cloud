import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { AREAS } from '@/lib/areas';
import { Share2, Eye, Pencil, Info } from 'lucide-react';

export default function ShareModal({ open, area, onClose }) {
  const { user, checkUserAuth } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState('view');
  const [editors, setEditors] = useState('');
  const [linkId, setLinkId] = useState(null);
  const [token, setToken] = useState(null);
  const [saving, setSaving] = useState(false);
  const a = AREAS[area];

  useEffect(() => {
    if (!open) return;
    setMode('view'); setEditors(''); setLinkId(null); setToken(null);
    const t = user?.share_tokens?.[area];
    if (t) {
      setToken(t);
      (async () => {
        try {
          const links = await base44.entities.ShareLink.filter({ token: t });
          if (links[0]) { setLinkId(links[0].id); setMode(links[0].mode || 'view'); setEditors((links[0].editors || []).join(', ')); }
        } catch { /* ignore */ }
      })();
    }
  }, [open, area, user]);

  async function save() {
    setSaving(true);
    try {
      const editorList = editors.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
      let t = token || (crypto.randomUUID?.() || Math.random().toString(36).slice(2));
      if (linkId) await base44.entities.ShareLink.update(linkId, { mode, editors: editorList });
      else { const c = await base44.entities.ShareLink.create({ token: t, owner_id: user.id, area, mode, editors: editorList }); setLinkId(c.id); setToken(t); }
      await base44.auth.updateMe({ share_tokens: { ...(user.share_tokens || {}), [area]: t } });
      await checkUserAuth();
      const link = `${window.location.origin}/s/${t}`;
      try { await navigator.clipboard.writeText(link); } catch { /* ignore */ }
      toast({ title: 'Share link copied!', description: mode === 'edit' ? 'Editors who join the app can edit. Others view only.' : `Anyone with the link can view your ${a?.label || ''} area.` });
      onClose();
    } catch (e) {
      toast({ title: 'Could not share', description: e.message, variant: 'destructive' });
    } finally { setSaving(false); }
  }

  const link = token ? `${window.location.origin}/s/${token}` : null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Share2 className="w-4 h-4" /> Share {a?.label || 'area'}</DialogTitle>
          <DialogDescription>Create a link to this area. Recipients only see this organizer — nothing else.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-2">
            <ModeCard active={mode === 'view'} onClick={() => setMode('view')} Icon={Eye} title="Viewer" desc="Read-only" />
            <ModeCard active={mode === 'edit'} onClick={() => setMode('edit')} Icon={Pencil} title="Editor" desc="Can add & edit" />
          </div>
          {mode === 'edit' && (
            <div className="space-y-1.5">
              <Label>Editor emails</Label>
              <Textarea value={editors} onChange={(e) => setEditors(e.target.value)} rows={2} placeholder="teammate@email.com, family@email.com" />
              <p className="text-xs text-muted-foreground">Only people who join Working Cloud with these emails can edit. Everyone else gets view-only.</p>
            </div>
          )}
          <div className="rounded-lg bg-amber-50 text-amber-700 text-xs px-3 py-2 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>Note: people not using this app can only view — they can't edit.</span>
          </div>
          {link && <div className="text-xs text-muted-foreground break-all rounded-lg bg-muted px-3 py-2">{link}</div>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : (token ? 'Update & copy link' : 'Create & copy link')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ModeCard({ active, onClick, Icon, title, desc }) {
  return (
    <button type="button" onClick={onClick} className={`text-left rounded-xl border p-3 transition ${active ? 'border-primary bg-accent/50' : 'border-border hover:bg-accent/30'}`}>
      <Icon className={`w-4 h-4 mb-1 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </button>
  );
}