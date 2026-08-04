import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { UserPlus, X, Users } from 'lucide-react';

export default function EncourageMembers({ roster, onChange }) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const members = roster ? roster.member_emails || [] : [];
  const names = roster ? roster.member_names || [] : [];

  async function add() {
    const e = email.trim().toLowerCase();
    if (!e || !e.includes('@')) { toast({ title: 'Enter a valid email', variant: 'destructive' }); return; }
    if (members.includes(e)) { toast({ title: 'Already a member' }); return; }
    const nextEmails = [...members, e];
    const nextNames = [...names, name.trim() || e];
    if (roster) {
      await base44.entities.SharableRoster.update(roster.id, { member_emails: nextEmails, member_names: nextNames });
    } else {
      await base44.entities.SharableRoster.create({ member_emails: nextEmails, member_names: nextNames });
    }
    setName(''); setEmail('');
    toast({ title: 'Member added' });
    onChange?.();
  }
  async function remove(e) {
    const idx = members.indexOf(e);
    if (idx < 0) return;
    const nextEmails = members.filter((x) => x !== e);
    const nextNames = names.filter((_, i) => i !== idx);
    await base44.entities.SharableRoster.update(roster.id, { member_emails: nextEmails, member_names: nextNames });
    toast({ title: 'Access removed' });
    onChange?.();
  }

  return (
    <div className="surface p-4 mb-6">
      <h2 className="font-semibold flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-primary" /> Shareable members</h2>
      <p className="text-xs text-muted-foreground mb-3">People here can receive your group messages and be picked for threads. Remove someone to revoke their access.</p>
      <div className="space-y-1.5 mb-3">
        {members.length === 0 && <p className="text-sm text-muted-foreground">No members yet.</p>}
        {members.map((e, i) => (
          <div key={e} className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{names[i] || e}</p>
              <p className="text-xs text-muted-foreground truncate">{e}</p>
            </div>
            <button onClick={() => remove(e)} className="p-1.5 rounded-lg hover:bg-rose-50 text-muted-foreground hover:text-rose-600" title="Remove access"><X className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="flex-1 min-w-[120px]" />
        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="flex-1 min-w-[160px]" />
        <Button onClick={add} variant="outline"><UserPlus className="w-4 h-4 mr-1.5" /> Add</Button>
      </div>
    </div>
  );
}