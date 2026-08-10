import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SheetSelect from '@/components/SheetSelect';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { AREAS } from '@/lib/areas';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Trash2, MessageSquare, Send } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { getThemeMode, setThemeMode as setModePref, getCustomBg, setCustomBg as setBgPref, DEFAULT_BG_HEX } from '@/lib/theme';
import { useI18n } from '@/lib/I18nContext';

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
  const { t, lang, setLang, languages } = useI18n();
  const { toast } = useToast();
  const [area, setArea] = useState('personal');
  const [p, setP] = useState(AREA_DEFAULTS.personal);
  const [saving, setSaving] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [mode, setMode] = useState(getThemeMode());
  const [bg, setBg] = useState(getCustomBg());
  const [fbMsg, setFbMsg] = useState('');
  const [fbCat, setFbCat] = useState('general');
  const [fbSending, setFbSending] = useState(false);
  const [feedbackList, setFeedbackList] = useState([]);
  const isAdmin = user?.role === 'admin';

  async function loadFeedback() {
    try { const list = await base44.entities.Feedback.list('-created_date', 50); setFeedbackList(list); } catch {}
  }
  useEffect(() => { if (isAdmin) loadFeedback(); }, [isAdmin]);
  async function submitFeedback() {
    if (!fbMsg.trim()) return;
    setFbSending(true);
    try {
      await base44.entities.Feedback.create({ message: fbMsg.trim(), category: fbCat, from_name: user?.full_name || '', from_email: user?.email || '' });
      setFbMsg(''); setFbCat('general');
      toast({ title: t('toast.thanks') });
      if (isAdmin) loadFeedback();
    } catch (e) { toast({ title: t('toast.couldNotSubmit'), description: e.message, variant: 'destructive' }); }
    finally { setFbSending(false); }
  }

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
      toast({ title: t('toast.saved', { area: t('area.' + area + '.label') }) });
    } catch (e) {
      toast({ title: t('toast.couldNotSave'), description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function deleteAccount() {
    setDelOpen(false);
    try {
      await base44.functions.invoke('deleteAccount', {});
    } catch (e) {
      toast({ title: 'Could not delete data', description: e.message, variant: 'destructive' });
    }
    await base44.auth.logout('/');
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto animate-fade-in pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
      <h1 className="text-2xl md:text-3xl font-bold mb-1">{t('settings.title')}</h1>
      <p className="text-sm text-muted-foreground mb-6">{t('settings.subtitle')}</p>

      <Card className="p-5 mb-5">
        <h2 className="font-semibold text-lg mb-1">{t('settings.colorScheme')}</h2>
        <p className="text-sm text-muted-foreground mb-4">{t('settings.colorSchemeDesc')} {t('settings.note.' + area)}</p>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t('settings.area')}</Label>
            <SheetSelect value={area} onValueChange={setArea} placeholder={t('settings.area')}
              options={Object.values(AREAS).map((a) => ({ value: a.key, label: t('area.' + a.key + '.label') }))} />
          </div>
          <ColorRow label={t('settings.primaryAccent')} value={p.primary} onChange={(v) => setP({ ...p, primary: v })} />
          <ColorRow label={t('settings.secondaryAccent')} value={p.accent} onChange={(v) => setP({ ...p, accent: v })} />
          <ColorRow label={t('settings.textTitles')} value={p.text} onChange={(v) => setP({ ...p, text: v })} />
          <ColorRow label={t('settings.backgroundOptional')} value={p.background || '#fdfcfb'} onChange={(v) => setP({ ...p, background: v })} />
          <div className="space-y-1.5">
            <Label>{t('settings.coverImage')}</Label>
            <Input value={p.image || ''} onChange={(e) => setP({ ...p, image: e.target.value })} placeholder="https://…" />
          </div>
        </div>
        <div className="flex justify-end mt-5"><Button onClick={save} disabled={saving}>{saving ? '…' : t('settings.saveArea', { area: t('area.' + area + '.label') })}</Button></div>
      </Card>

      <Card className="p-5 mb-5">
        <h2 className="font-semibold text-lg mb-1">{t('settings.appearance')}</h2>
        <p className="text-sm text-muted-foreground mb-4">{t('settings.appearanceDesc')}</p>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t('settings.theme')}</Label>
            <div className="flex gap-2 flex-wrap">
              {[{ v: 'light', l: t('settings.light') }, { v: 'dark', l: t('settings.dark') }, { v: 'system', l: t('settings.matchSystem') }].map((o) => (
                <Button key={o.v} variant={mode === o.v ? 'default' : 'outline'} onClick={() => { setModePref(o.v); setMode(o.v); }}>{o.l}</Button>
              ))}
            </div>
          </div>
          <ColorRow label={t('settings.bgColorLight')} value={bg || DEFAULT_BG_HEX} onChange={(v) => { setBgPref(v); setBg(v); }} />
          {bg && <Button variant="ghost" size="sm" onClick={() => { setBgPref(''); setBg(''); }}>{t('settings.resetDefault')}</Button>}
        </div>
      </Card>

      <Card className="p-5 mb-5">
        <h2 className="font-semibold text-lg mb-1">{t('settings.language')}</h2>
        <p className="text-sm text-muted-foreground mb-4">{t('settings.languageDesc')}</p>
        <SheetSelect value={lang} onValueChange={setLang} placeholder={t('settings.language')}
          options={languages.map((l) => ({ value: l.code, label: l.label }))} />
      </Card>

      <Card className="p-5 mb-5">
        <h2 className="font-semibold text-lg mb-1 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-indigo-500" /> {t('settings.feedback')}</h2>
        <p className="text-sm text-muted-foreground mb-4">{t('settings.feedbackDesc')}</p>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>{t('settings.category')}</Label>
            <SheetSelect value={fbCat} onValueChange={setFbCat} placeholder={t('settings.category')}
              options={[
                { value: 'general', label: t('settings.general') },
                { value: 'bug', label: t('settings.bug') },
                { value: 'suggestion', label: t('settings.suggestion') },
                { value: 'other', label: t('settings.other') }
              ]} />
          </div>
          <div className="space-y-1.5">
            <Label>{t('settings.yourMessage')}</Label>
            <Textarea value={fbMsg} onChange={(e) => setFbMsg(e.target.value)} rows={4} placeholder={t('settings.yourMessage')} />
          </div>
          <div className="flex justify-end"><Button onClick={submitFeedback} disabled={fbSending || !fbMsg.trim()}><Send className="w-4 h-4 mr-1.5" /> {fbSending ? t('settings.sending') : t('settings.sendFeedback')}</Button></div>
        </div>
        {isAdmin && feedbackList.length > 0 && (
          <div className="mt-5 border-t border-border/60 pt-4">
            <h3 className="font-semibold text-sm mb-2">{t('settings.received', { count: feedbackList.length })}</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {feedbackList.map((f) => (
                <div key={f.id} className="rounded-lg border border-border/60 p-2.5 text-sm">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                    <span className="font-medium">{f.from_name || f.from_email || t('settings.anonymous')}</span>
                    <span>{new Date(f.created_date).toLocaleDateString()}</span>
                  </div>
                  <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-accent text-accent-foreground mb-1.5 capitalize">{f.category}</span>
                  <p className="text-sm">{f.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold text-lg mb-2">{t('settings.yourAreas')}</h2>
        <div className="space-y-2 text-sm">
          {Object.values(AREAS).map((a) => (
            <div key={a.key} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: a.accent }} />
              <span className="font-medium">{t('area.' + a.key + '.label')}</span>
              <span className="text-muted-foreground">— {t('area.' + a.key + '.tagline')}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5 mt-5 border-rose-200">
        <h2 className="font-semibold text-lg mb-1 text-rose-700">{t('settings.deleteAccount')}</h2>
        <p className="text-sm text-muted-foreground mb-4">{t('settings.deleteAccountDesc')}</p>
        <Button variant="destructive" onClick={() => setDelOpen(true)}><Trash2 className="w-4 h-4 mr-1.5" /> {t('settings.deleteAccount')}</Button>
      </Card>

      <AlertDialog open={delOpen} onOpenChange={setDelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('settings.deleteConfirmDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t('settings.yesDelete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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