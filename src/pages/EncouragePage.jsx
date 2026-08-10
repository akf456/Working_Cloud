import React, { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Heart, Trash2, Sparkles, Users, Lock } from 'lucide-react';
import EncourageComposer from '@/components/EncourageComposer';
import EncourageMembers from '@/components/EncourageMembers';
import { useI18n } from '@/lib/I18nContext';

export default function EncouragePage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [roster, setRoster] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [rosters, msgs] = await Promise.all([
      base44.entities.SharableRoster.filter({}),
      base44.entities.Encouragement.list('-created_date', 200)
    ]);
    setRoster(rosters.find((r) => r.created_by_id === user?.id) || null);
    setMessages(msgs);
  }, [user?.id]);

  useEffect(() => { (async () => { setLoading(true); await load(); setLoading(false); })(); }, [load]);

  async function remove(n) {
    await base44.entities.Encouragement.delete(n.id);
    load();
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2"><Heart className="w-6 h-6 text-rose-500" /> {t('encourage.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('encourage.subtitle')}</p>
      </div>

      <EncourageMembers roster={roster} onChange={load} />
      <EncourageComposer roster={roster} user={user} onSent={load} />

      <h2 className="font-semibold mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> {t('encourage.messages')}</h2>
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{[...Array(3)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-muted/60 animate-pulse" />)}</div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <Sparkles className="w-10 h-10 mb-3 opacity-50" />
          <p className="font-medium">No messages yet.</p>
          <p className="text-sm mt-1">Add members and send the first note!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {messages.map((n) => (
            <div key={n.id} className="rounded-2xl p-4 shadow-sm border border-border/60 relative animate-pop" style={{ backgroundColor: n.color || '#fcd34b' }}>
              <div className="flex items-center gap-1.5 mb-1 text-[11px] font-semibold text-slate-700/70">
                {n.is_group ? <><Users className="w-3 h-3" /> Everyone in your Shareable</> : <><Lock className="w-3 h-3" /> To: {(n.recipient_names || []).join(', ') || 'you'}</>}
                {n.allow_others && <span className="ml-auto">Open to all</span>}
              </div>
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