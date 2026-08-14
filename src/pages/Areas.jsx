import React, { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useArea } from '@/lib/AreaContext';
import { AREA_LIST } from '@/lib/areas';
import { ArrowRight, BarChart3, CalendarDays } from 'lucide-react';
import WorkingCloudLogo from '@/components/WorkingCloudLogo';
import AreaDistribution from '@/components/AreaDistribution';
import AllAreasCalendar from '@/components/AllAreasCalendar';
import ManageAreas from '@/components/ManageAreas';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/I18nContext';
import { useAuth } from '@/lib/AuthContext';

const HIDE_KEY = 'wc_hide_time_goes';
const HIDE_CAL_KEY = 'wc_hide_all_areas_calendar';
const HIDDEN_AREAS_KEY = 'wc_hidden_areas';

export default function Areas() {
  const { area, enter } = useArea();
  const nav = useNavigate();
  const { t } = useI18n();
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [hideTimeGoes, setHideTimeGoes] = useState(() => localStorage.getItem(HIDE_KEY) === '1');
  const [hideCalendar, setHideCalendar] = useState(() => localStorage.getItem(HIDE_CAL_KEY) === '1');
  const [hiddenAreas, setHiddenAreas] = useState(() => new Set(JSON.parse(localStorage.getItem(HIDDEN_AREAS_KEY) || '[]')));

  useEffect(() => {
    if (area) return;
    base44.entities.Task.list('-due_date', 500).then(setTasks).catch(() => {});
    base44.entities.Event.list('-start_date', 500).then(setEvents).catch(() => {});
  }, [area]);

  // Adopt widget + hidden-areas preferences from the profile (cross-device sync).
  useEffect(() => {
    if (!user) return;
    if (Array.isArray(user.hidden_areas)) setHiddenAreas(new Set(user.hidden_areas));
    if (typeof user.hide_time_goes === 'boolean') setHideTimeGoes(user.hide_time_goes);
    if (typeof user.hide_all_areas_calendar === 'boolean') setHideCalendar(user.hide_all_areas_calendar);
  }, [user]);

  if (area) return <Navigate to="/dashboard" replace />;

  const dismissTimeGoes = () => { setHideTimeGoes(true); localStorage.setItem(HIDE_KEY, '1'); if (user) base44.auth.updateMe({ hide_time_goes: true }).catch(() => {}); };
  const showTimeGoes = () => { setHideTimeGoes(false); localStorage.removeItem(HIDE_KEY); if (user) base44.auth.updateMe({ hide_time_goes: false }).catch(() => {}); };
  const dismissCalendar = () => { setHideCalendar(true); localStorage.setItem(HIDE_CAL_KEY, '1'); if (user) base44.auth.updateMe({ hide_all_areas_calendar: true }).catch(() => {}); };
  const showCalendar = () => { setHideCalendar(false); localStorage.removeItem(HIDE_CAL_KEY); if (user) base44.auth.updateMe({ hide_all_areas_calendar: false }).catch(() => {}); };

  const toggleArea = (key) => {
    setHiddenAreas((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      const arr = [...next];
      localStorage.setItem(HIDDEN_AREAS_KEY, JSON.stringify(arr));
      if (user) base44.auth.updateMe({ hidden_areas: arr }).catch(() => {});
      return next;
    });
  };

  const visible = AREA_LIST.filter((a) => !hiddenAreas.has(a.key));
  const n = visible.length;
  const gridCls = n === 1 ? 'grid grid-cols-1 sm:grid-cols-1 gap-5 w-full max-w-sm'
    : n === 2 ? 'grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-xl'
    : n === 3 ? 'grid grid-cols-1 sm:grid-cols-3 gap-5 w-full max-w-3xl'
    : 'grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-xl';

  return (
    <div className="relative min-h-screen bg-background flex flex-col pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]">
      <div className="absolute top-[calc(1rem+env(safe-area-inset-top,0px))] right-[calc(1rem+env(safe-area-inset-right,0px))] z-10">
        <ManageAreas hidden={hiddenAreas} onToggle={toggleArea} />
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="text-center mb-10 animate-fade-in">
          <h1 className="text-3xl md:text-5xl font-bold"><WorkingCloudLogo className="text-3xl md:text-5xl" /></h1>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">{t('areas.subtitle')}</p>
        </div>
        {visible.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">{t('areas.allHidden')}</p>
        ) : (
          <div className={gridCls}>
            {visible.map((a) => (
              <button
                key={a.key}
                onClick={() => { enter(a.key); nav('/dashboard'); }}
                className="group text-left rounded-3xl border border-border/70 bg-card p-6 hover:shadow-lg hover:-translate-y-1 transition-all animate-fade-in"
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-sm mb-4" style={{ backgroundColor: a.monoBg }}>
                  <a.Icon className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-bold mb-1">{t('area.' + a.key + '.label')}</h2>
                <p className="text-sm text-muted-foreground mb-4">{t('area.' + a.key + '.tagline')}</p>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all">
                  {t('areas.open', { area: t('area.' + a.key + '.label') })} <ArrowRight className="w-4 h-4" />
                </span>
              </button>
            ))}
          </div>
        )}

        {visible.length > 0 && (
          <div className="max-w-4xl w-full mt-8 animate-fade-in space-y-4">
            {hideTimeGoes ? (
              <button onClick={showTimeGoes} className="w-full rounded-2xl border border-dashed border-border bg-card/50 px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/40 transition inline-flex items-center justify-center gap-2">
                <BarChart3 className="w-4 h-4" /> {t('areas.showTime')}
              </button>
            ) : (
              <AreaDistribution tasks={tasks} onDismiss={dismissTimeGoes} hiddenAreas={[...hiddenAreas]} />
            )}
            {hideCalendar ? (
              <button onClick={showCalendar} className="w-full rounded-2xl border border-dashed border-border bg-card/50 px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/40 transition inline-flex items-center justify-center gap-2">
                <CalendarDays className="w-4 h-4" /> {t('areas.showCalendar')}
              </button>
            ) : (
              <AllAreasCalendar tasks={tasks} events={events} hiddenAreas={[...hiddenAreas]} onDismiss={dismissCalendar} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}