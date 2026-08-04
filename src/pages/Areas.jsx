import React, { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useArea } from '@/lib/AreaContext';
import { AREA_LIST } from '@/lib/areas';
import { ArrowRight, BarChart3 } from 'lucide-react';
import WorkingCloudLogo from '@/components/WorkingCloudLogo';
import AreaDistribution from '@/components/AreaDistribution';
import ManageAreas from '@/components/ManageAreas';
import { base44 } from '@/api/base44Client';

const HIDE_KEY = 'wc_hide_time_goes';
const HIDDEN_AREAS_KEY = 'wc_hidden_areas';

export default function Areas() {
  const { area, enter } = useArea();
  const nav = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [hidden, setHidden] = useState(() => localStorage.getItem(HIDE_KEY) === '1');
  const [hiddenAreas, setHiddenAreas] = useState(() => new Set(JSON.parse(localStorage.getItem(HIDDEN_AREAS_KEY) || '[]')));

  useEffect(() => {
    if (area) return;
    base44.entities.Task.list('-due_date', 500).then(setTasks).catch(() => {});
  }, [area]);

  if (area) return <Navigate to="/dashboard" replace />;

  const dismiss = () => { setHidden(true); localStorage.setItem(HIDE_KEY, '1'); };
  const show = () => { setHidden(false); localStorage.removeItem(HIDE_KEY); };

  const toggleArea = (key) => {
    setHiddenAreas((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      localStorage.setItem(HIDDEN_AREAS_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  const visible = AREA_LIST.filter((a) => !hiddenAreas.has(a.key));

  return (
    <div className="relative min-h-screen bg-background flex flex-col pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]">
      <div className="absolute top-[calc(1rem+env(safe-area-inset-top,0px))] right-[calc(1rem+env(safe-area-inset-right,0px))] z-10">
        <ManageAreas hidden={hiddenAreas} onToggle={toggleArea} />
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="text-center mb-10 animate-fade-in">
          <h1 className="text-3xl md:text-5xl font-bold"><WorkingCloudLogo className="text-3xl md:text-5xl" /></h1>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">Pick a space to focus on. Everything stays neatly in its own lane.</p>
        </div>
        {visible.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">All areas are hidden. Use “Manage areas” to bring one back.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl w-full">
            {visible.map((a) => (
              <button
                key={a.key}
                onClick={() => { enter(a.key); nav('/dashboard'); }}
                className="group text-left rounded-3xl border border-border/70 bg-card p-6 hover:shadow-lg hover:-translate-y-1 transition-all animate-fade-in"
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-sm mb-4" style={{ backgroundColor: a.monoBg }}>
                  <a.Icon className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-bold mb-1">{a.label}</h2>
                <p className="text-sm text-muted-foreground mb-4">{a.tagline}</p>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all">
                  Open {a.label} <ArrowRight className="w-4 h-4" />
                </span>
              </button>
            ))}
          </div>
        )}

        {visible.length > 0 && (
          <div className="max-w-4xl w-full mt-8 animate-fade-in">
            {hidden ? (
              <button onClick={show} className="w-full rounded-2xl border border-dashed border-border bg-card/50 px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/40 transition inline-flex items-center justify-center gap-2">
                <BarChart3 className="w-4 h-4" /> Show “Where your time goes”
              </button>
            ) : (
              <AreaDistribution tasks={tasks} onDismiss={dismiss} hiddenAreas={[...hiddenAreas]} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}