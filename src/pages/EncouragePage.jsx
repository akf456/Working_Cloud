import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Heart, Trash2, Send, Sparkles } from 'lucide-react';

const COLORS = ['#fcd34b', '#fda4af', '#a7f3d0', '#bfdbfe', '#ddd6fe', '#fbcfe8'];

export default function EncouragePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [from, setFrom] = useState(user?.full_name || user?.email || '');
  const [color, setColor] = useState(COLORS[0]);

  async function load() {
    setLoading(true);
    const list = await base44.entities.Encouragement.list('-created_date', 200);
    setNotes(list);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function send() {
    if (!message.trim()) return;
    await base44.entities.Encouragement.create({ message: message.trim(), from_name: from.trim() || 'Someone', color });
    setMessage('');
    toast({ title: 'Note sent! 💛', description: 'Your encouragement is on the board.' });
    load();
  }
  async function remove(n) {
    await base44.entities.Encouragement.delete(n.id);
    load();
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2"><Heart className="w-6 h-6 text-rose-500" /> Encouragement Board</h1>
        <p className="text-sm text-muted-foreground mt-1">Drop a kind note for everyone in the Shareables area. Lift each other up! ✨</p>
      </div>

      <div className="surface p-4 mb-6 space-y-3">
        <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write a word of encouragement…" rows={3} />
        <div className="flex flex-wrap items-center gap-2">
          <Input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Your name" className="flex-1 min-w-[140px]" />
          <div className="flex gap-1.5">
            {COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setColor(c)} className={`w-7 h-7 rounded-full border-2 transition ${color === c ? 'border-primary scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />
            ))}
          </div>
          <Button onClick={send} disabled={!message.trim()}><Send className="w-4 h-4 mr-1.5" /> Send</Button>
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{[...Array(6)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-muted/60 animate-pulse" />)}</div>
      ) : notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <Sparkles className="w-10 h-10 mb-3 opacity-50" />
          <p className="font-medium">No notes yet.</p>
          <p className="text-sm mt-1">Be the first to share some encouragement!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {notes.map((n) => (
            <div key={n.id} className="rounded-2xl p-4 shadow-sm border border-border/60 relative animate-pop" style={{ backgroundColor: n.color || '#fcd34b' }}>
              <p className="text-sm font-medium text-slate-800 whitespace-pre-wrap break-words pr-6">{n.message}</p>
              <p className="text-xs font-semibold text-slate-700/80 mt-3">— {n.from_name || 'Someone'}</p>
              {n.created_by_id === user?.id && (
                <button onClick={() => remove(n)} className="absolute top-2 right-2 p-1 rounded-lg bg-black/5 hover:bg-black/10 text-slate-600" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}