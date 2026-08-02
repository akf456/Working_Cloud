import React from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useArea } from '@/lib/AreaContext';
import { AREA_LIST } from '@/lib/areas';
import { ArrowRight } from 'lucide-react';

export default function Areas() {
  const { area, enter } = useArea();
  const nav = useNavigate();
  if (area) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="text-center mb-10 animate-fade-in">
          <h1 className="text-3xl md:text-5xl font-bold gradient-text">Working Buddy</h1>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">Pick a space to focus on. Everything stays neatly in its own lane.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-5 max-w-4xl w-full">
          {AREA_LIST.map((a) => (
            <button
              key={a.key}
              onClick={() => { enter(a.key); nav('/dashboard'); }}
              className="group text-left rounded-3xl border border-border/70 bg-card p-6 hover:shadow-lg hover:-translate-y-1 transition-all animate-fade-in"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${a.gradient} flex items-center justify-center text-white shadow-sm mb-4`}>
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
      </div>
    </div>
  );
}