import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, Pause, RotateCcw, SkipForward, Settings as SettingsIcon, Coffee, Brain } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useI18n } from '@/lib/I18nContext';
import { useToast } from '@/components/ui/use-toast';
import PomodoroSettings from '@/components/PomodoroSettings';

const DEFAULTS = { focus: 25, short: 5, long: 15, longEvery: 4, color: '#7c3aed', autoStartBreaks: true, autoStartFocus: false };

const FOCUS_MSGS = [
  "You've got this — one focused block at a time.",
  "Deep work mode: on. Let's make it count.",
  "Small steps, big progress. Keep going!",
  "Your future self will thank you for this focus.",
  "Tune out the noise. You're in the zone.",
];
const BREAK_MSGS = [
  "Nice work! Step away and recharge.",
  "Stretch, breathe, hydrate — you earned this break.",
  "Pause proudly. Breaks make you sharper.",
  "Give your mind a rest. You'll come back stronger.",
  "Take a real break. Your brain is still processing.",
];
const RESUME_MSGS = [
  "Ready to dive back in? Let's go!",
  "Refreshed and recharged — back to it.",
  "Break's over. Let's crush the next block.",
];
const pick = (a) => a[Math.floor(Math.random() * a.length)];

export default function PomodoroPage() {
  const { user, checkUserAuth } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const settings = { ...DEFAULTS, ...(user?.pomodoro_settings || {}) };
  const phaseMinutes = (p) => (p === 'focus' ? settings.focus : p === 'short' ? settings.short : settings.long);

  const [phase, setPhase] = useState('focus');
  const [secondsLeft, setSecondsLeft] = useState(phaseMinutes('focus') * 60);
  const [running, setRunning] = useState(false);
  const [completedFocus, setCompletedFocus] = useState(0);
  const [sessionsToday, setSessionsToday] = useState(0);
  const [message, setMessage] = useState(pick(FOCUS_MSGS));
  const [showSettings, setShowSettings] = useState(false);

  // Reset current phase duration when durations change (only when idle).
  useEffect(() => {
    if (!running) setSecondsLeft(phaseMinutes(phase) * 60);
    // eslint-disable-next-line
  }, [settings.focus, settings.short, settings.long, phase]);

  // Ask for notification permission once.
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Tick.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);

  // Phase completion.
  useEffect(() => {
    if (!running || secondsLeft !== 0) return;
    function notify(title, body) {
      try {
        if ('Notification' in window && Notification.permission === 'granted') new Notification(title, { body });
      } catch {}
    }
    if (phase === 'focus') {
      const newCount = completedFocus + 1;
      setCompletedFocus(newCount);
      setSessionsToday((c) => c + 1);
      const isLong = newCount % settings.longEvery === 0;
      const next = isLong ? 'long' : 'short';
      const m = pick(BREAK_MSGS);
      setMessage(m);
      toast({ title: isLong ? t('pomo.longBreak') : t('pomo.shortBreak'), description: m });
      notify(isLong ? 'Long break time!' : 'Break time!', m);
      setPhase(next);
      setSecondsLeft(phaseMinutes(next) * 60);
      setRunning(settings.autoStartBreaks);
    } else {
      const m = pick(RESUME_MSGS);
      setMessage(m);
      toast({ title: 'Break over!', description: m });
      notify('Break over!', m);
      setPhase('focus');
      setSecondsLeft(settings.focus * 60);
      setRunning(settings.autoStartFocus);
    }
    // eslint-disable-next-line
  }, [secondsLeft, running]);

  function startPause() { if (secondsLeft === 0) return; setRunning((r) => !r); }
  function reset() { setRunning(false); setSecondsLeft(phaseMinutes(phase) * 60); }
  function skip() {
    setRunning(false);
    if (phase === 'focus') {
      const next = (completedFocus + 1) % settings.longEvery === 0 ? 'long' : 'short';
      setPhase(next); setSecondsLeft(phaseMinutes(next) * 60);
    } else {
      setPhase('focus'); setSecondsLeft(settings.focus * 60);
    }
  }
  function choosePhase(p) {
    setRunning(false); setPhase(p); setSecondsLeft(phaseMinutes(p) * 60);
    setMessage(p === 'focus' ? pick(FOCUS_MSGS) : pick(BREAK_MSGS));
  }
  async function saveSettings(next) {
    setShowSettings(false);
    try { await base44.auth.updateMe({ pomodoro_settings: next }); await checkUserAuth(); } catch {}
  }

  const total = phaseMinutes(phase) * 60;
  const circ = 2 * Math.PI * 54;
  const frac = total ? (total - secondsLeft) / total : 0;
  const hLeft = Math.floor(secondsLeft / 3600);
  const mm = hLeft ? String(Math.floor((secondsLeft % 3600) / 60)).padStart(2, '0') : String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');
  const timeText = hLeft > 0 ? `${hLeft}:${mm}:${ss}` : `${mm}:${ss}`;
  const phaseLabel = phase === 'focus' ? t('pomo.focus') : phase === 'short' ? t('pomo.shortBreak') : t('pomo.longBreak');
  const PhaseIcon = phase === 'focus' ? Brain : Coffee;
  const tabs = [
    { k: 'focus', label: t('pomo.focus') },
    { k: 'short', label: t('pomo.shortBreak') },
    { k: 'long', label: t('pomo.longBreak') },
  ];

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{t('nav.pomodoro')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('pomo.sessionsToday')}: {sessionsToday}</p>
        </div>
        <Button variant="outline" onClick={() => setShowSettings(true)} className="rounded-xl"><SettingsIcon className="w-4 h-4 mr-1.5" /> {t('pomo.settings')}</Button>
      </div>

      <Card className="p-6 md:p-8 flex flex-col items-center">
        <div className="flex gap-2 mb-6 flex-wrap justify-center">
          {tabs.map((tb) => (
            <button key={tb.k} onClick={() => choosePhase(tb.k)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${phase === tb.k ? 'text-white' : 'bg-muted text-muted-foreground hover:bg-accent'}`} style={phase === tb.k ? { backgroundColor: settings.color } : undefined}>{tb.label}</button>
          ))}
        </div>

        <div className="relative w-64 h-64 md:w-72 md:h-72">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
            <circle cx="60" cy="60" r="54" fill="none" stroke={settings.color} strokeWidth="8" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - frac)} className="transition-all duration-500" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: settings.color }}><PhaseIcon className="w-4 h-4" />{phaseLabel}</div>
            <span className="text-5xl md:text-6xl font-bold tabular-nums">{timeText}</span>
            <span className="text-xs text-muted-foreground mt-1">{running ? 'Running' : 'Paused'}</span>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-5 max-w-sm italic">“{message}”</p>

        <div className="flex items-center gap-3 mt-6">
          <Button variant="outline" size="icon" onClick={reset} title={t('pomo.reset')}><RotateCcw className="w-5 h-5" /></Button>
          <Button onClick={startPause} className="rounded-full px-8" style={{ backgroundColor: settings.color }}>
            <span className="flex items-center gap-2">{running ? <><Pause className="w-5 h-5" />{t('pomo.pause')}</> : <><Play className="w-5 h-5" />{t('pomo.start')}</>}</span>
          </Button>
          <Button variant="outline" size="icon" onClick={skip} title={t('pomo.skip')}><SkipForward className="w-5 h-5" /></Button>
        </div>

        <div className="flex items-center gap-1.5 mt-5">
          {Array.from({ length: settings.longEvery }).map((_, i) => (
            <span key={i} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: i < (completedFocus % settings.longEvery) ? settings.color : 'hsl(var(--muted))' }} />
          ))}
        </div>
      </Card>

      <PomodoroSettings open={showSettings} onClose={() => setShowSettings(false)} settings={settings} onSave={saveSettings} />
    </div>
  );
}