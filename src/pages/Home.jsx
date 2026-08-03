import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { GraduationCap, Briefcase, Heart, Share2, Sparkles, CalendarDays, ListTodo, ShieldCheck, ArrowRight } from 'lucide-react';
import WorkingCloudLogo from '@/components/WorkingCloudLogo';
import { AREA_LIST } from '@/lib/areas';

export default function Home() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/areas" replace />;

  const areaIcons = { school: GraduationCap, work: Briefcase, personal: Heart, shareable: Share2 };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-accent/40">
      {/* Nav */}
      <header className="sticky top-0 z-20 backdrop-blur bg-card/70 border-b border-border/60">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <WorkingCloudLogo className="text-lg" />
          <div className="flex items-center gap-2">
            <Link to="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
            <Link to="/register"><Button size="sm" className="rounded-xl">Get started</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-accent/60 border border-border px-3 py-1 text-xs font-semibold text-accent-foreground mb-5 animate-fade-in">
          <Sparkles className="w-3.5 h-3.5" /> Your life, organized into calm little clouds
        </div>
        <h1 className="text-4xl md:text-6xl font-bold font-heading leading-tight animate-fade-in">
          One planner for <span className="gradient-text">school, work & life</span>
        </h1>
        <p className="text-muted-foreground mt-5 max-w-xl mx-auto text-base md:text-lg animate-fade-in">
          Working Cloud keeps every part of your day in its own lane — tasks, deadlines, contacts and calendars —
          with AI that turns a syllabus into a schedule in seconds.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8 animate-fade-in">
          <Link to="/register"><Button size="lg" className="rounded-xl text-base h-12 px-8">Create your free account <ArrowRight className="w-4 h-4 ml-1.5" /></Button></Link>
          <Link to="/login"><Button size="lg" variant="outline" className="rounded-xl text-base h-12 px-8">I already have one</Button></Link>
        </div>
        <p className="text-xs text-muted-foreground mt-4">Free to start · Your data is private to you</p>
      </section>

      {/* Areas */}
      <section className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {AREA_LIST.map((a) => {
            const Icon = areaIcons[a.key] || Sparkles;
            return (
              <div key={a.key} className="rounded-2xl border border-border/70 bg-card p-5 animate-fade-in">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white mb-3" style={{ backgroundColor: a.monoBg }}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-lg">{a.label}</h3>
                <p className="text-sm text-muted-foreground mt-1">{a.tagline}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">Everything you need to stay ahead</h2>
        <p className="text-center text-muted-foreground mb-8">Built for students, professionals and anyone juggling a lot.</p>
        <div className="grid md:grid-cols-3 gap-5">
          <Feature icon={Sparkles} title="AI syllabus import" text="Upload a syllabus and let AI pull every deadline, exam date and contact — recurring schedule included." />
          <Feature icon={CalendarDays} title="Smart calendar" text="Tasks and events sit on the right day. Overdue work flags itself so nothing slips through." />
          <Feature icon={ListTodo} title="Recurring tasks" text="Daily, weekly or monthly repeats with priorities, subtasks and a priority plan that ranks your day." />
          <Feature icon={Share2} title="Shareable links" text="Send a read-only view of an organizer to anyone — no account needed to view." />
          <Feature icon={GraduationCap} title="Make it yours" text="Customize colors and layout per area. Rearrange dashboard widgets to match how you work." />
          <Feature icon={ShieldCheck} title="Private by default" text="Your data is yours alone — no one else can see it, not even other members." />
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="rounded-3xl bg-gradient-to-br from-indigo-50 via-violet-50 to-rose-50 border border-border/70 p-10">
          <h2 className="text-2xl md:text-3xl font-bold">Ready to clear the fog?</h2>
          <p className="text-muted-foreground mt-3">Create your account in seconds and start planning your day.</p>
          <Link to="/register"><Button size="lg" className="rounded-xl text-base h-12 px-8 mt-6">Get started — it's free</Button></Link>
        </div>
      </section>

      <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        <WorkingCloudLogo className="text-sm justify-center" />
        <p className="mt-2">© {new Date().getFullYear()} Working Cloud. Made for focused minds.</p>
      </footer>
    </div>
  );
}

function Feature({ icon: Icon, title, text }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 hover:shadow-md transition animate-fade-in">
      <div className="w-10 h-10 rounded-xl bg-accent/60 flex items-center justify-center text-accent-foreground mb-3"><Icon className="w-5 h-5" /></div>
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}