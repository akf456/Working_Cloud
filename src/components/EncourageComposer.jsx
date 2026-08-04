import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { base44 } from '@/api/base44Client';
import { Send, Users, UserPlus, ShieldCheck } from 'lucide-react';
import { containsProfanity } from '@/lib/profanity';

const COLORS = ['#fcd34b', '#fda4af', '#a7f3d0', '#bfdbfe', '#ddd6fe', '#fbcfe8'];

export default function EncourageComposer({ roster, user, onSent }) {
  const { toast } = useToast();
  const [mode, setMode] = useState('group');
  const [selected, setSelected] = useState(new Set());
  const [customEmail, setCustomEmail] = useState('');
  const [message, setMessage] = useState('');
  const [from, setFrom] = useState(user?.full_name || user?.email || '');
  const [color, setColor] = useState(COLORS[0]);
  const [allowOthers, setAllowOthers] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const members = roster ? roster.member_emails || [] : [];
  const memberNames = roster ? roster.member_names || [] : [];
  const memberCount = members.length;

  function toggle(email) {
    setSelected((p) => { const n = new Set(p); n.has(email) ? n.delete(email) : n.add(email); return n; });
  }
  function addCustom() {
    const e = customEmail.trim().toLowerCase();
    if (!e || !e.includes('@')) { toast({ title: 'Enter a valid email', variant: 'destructive' }); return; }
    setSelected((p) => new Set(p).add(e));
    setCustomEmail('');
  }

  const recipients = useMemo(() => {
    if (mode === 'group') return members.map((email, i) => ({ email, name: memberNames[i] || email }));
    return [...selected].map((email) => {
      const idx = members.indexOf(email);
      return { email, name: idx >= 0 ? memberNames[idx] || email : email };
    });
  }, [mode, members, memberNames, selected]);

  function trySend() {
    if (!message.trim()) { toast({ title: 'Write a message first', variant: 'destructive' }); return; }
    if (containsProfanity(message) || containsProfanity(from)) {
      toast({ title: 'Please keep it clean', description: 'No profanity or vulgar language. Emojis are welcome! 🙂', variant: 'destructive' });
      return;
    }
    if (mode === 'group' && memberCount === 0) { toast({ title: 'No members yet', description: 'Add members to your Shareable first.', variant: 'destructive' }); return; }
    if (mode === 'thread' && recipients.length === 0) { toast({ title: 'Pick at least one recipient', variant: 'destructive' }); return; }
    setConfirm({ recipients });
  }

  async function doSend() {
    await base44.entities.Encouragement.create({
      message: message.trim(),
      from_name: from.trim() || 'Someone',
      color,
      recipient_emails: recipients.map((r) => r.email.toLowerCase()),
      recipient_names: recipients.map((r) => r.name),
      is_group: mode === 'group',
      allow_others: allowOthers
    });
    setMessage(''); setSelected(new Set()); setAllowOthers(false); setConfirm(null);
    toast({ title: 'Note sent! 💛' });
    onSent?.();
  }

  return (
    <div className="surface p-4 mb-6 space-y-4">
      <div className="inline-flex rounded-xl bg-muted p-1">
        <button onClick={() => setMode('group')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${mode === 'group' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'}`}><Users className="w-3.5 h-3.5 inline mr-1" /> Group</button>
        <button onClick={() => setMode('thread')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${mode === 'thread' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'}`}><UserPlus className="w-3.5 h-3.5 inline mr-1" /> Thread</button>
      </div>

      {mode === 'group' ? (
        <p className="text-sm text-muted-foreground">Sends to everyone in your Shareable ({memberCount} {memberCount === 1 ? 'member' : 'members'}).{memberCount === 0 && ' Add members below first.'}</p>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-medium">Choose recipients:</p>
          {memberCount === 0 && <p className="text-xs text-muted-foreground">No members yet — add some below, or enter an email directly.</p>}
          <div className="grid sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
            {members.map((email, i) => (
              <label key={email} className="flex items-center gap-2 rounded-lg px-2 py-1.5 border border-border/60 hover:bg-accent/50 cursor-pointer">
                <Checkbox checked={selected.has(email)} onCheckedChange={() => toggle(email)} />
                <span className="text-sm truncate">{memberNames[i] || email}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={customEmail} onChange={(e) => setCustomEmail(e.target.value)} placeholder="Add a recipient by email…" className="flex-1" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }} />
            <Button type="button" variant="outline" onClick={addCustom}>Add</Button>
          </div>
          {selected.size > 0 && <p className="text-xs text-muted-foreground">{selected.size} selected</p>}
        </div>
      )}

      <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write a word of encouragement… (keep it clean, emojis welcome 🙂)" rows={3} />
      <div className="flex flex-wrap items-center gap-2">
        <Input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Your name" className="flex-1 min-w-[140px]" />
        <div className="flex gap-1.5">
          {COLORS.map((c) => (
            <button key={c} type="button" onClick={() => setColor(c)} className={`w-7 h-7 rounded-full border-2 transition ${color === c ? 'border-primary scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />
          ))}
        </div>
        <Button onClick={trySend} disabled={!message.trim()}><Send className="w-4 h-4 mr-1.5" /> Send</Button>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <Switch checked={allowOthers} onCheckedChange={setAllowOthers} />
        <span><ShieldCheck className="w-3.5 h-3.5 inline mr-1 text-muted-foreground" />Allow others (beyond recipients) to see this message</span>
      </label>

      <Dialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm recipients</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-1">Please confirm who this message is going to.</p>
          <div className="space-y-1.5 max-h-56 overflow-y-auto">
            <p className="text-xs font-semibold text-muted-foreground pt-1">{mode === 'group' ? 'GROUP — everyone in your Shareable:' : 'THREAD to:'}</p>
            {confirm?.recipients.map((r) => (
              <div key={r.email} className="text-sm flex justify-between gap-2 border-b border-border/40 pb-1">
                <span className="truncate font-medium">{r.name}</span>
                <span className="text-muted-foreground text-xs truncate">{r.email}</span>
              </div>
            ))}
            <p className="text-sm mt-2 p-2 rounded-lg" style={{ backgroundColor: color }}>{message}</p>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button onClick={doSend}>Confirm & Send</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}