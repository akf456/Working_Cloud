import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Navigate, Outlet } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, ListTodo, GraduationCap, Sparkles, Users, Trash2, LayoutGrid, Palette, Share2, Check } from 'lucide-react';
import { useArea } from '@/lib/AreaContext';
import { AREAS } from '@/lib/areas';
import { areaThemeVars, areaImage } from '@/lib/areaTheme';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import PersonalizeModal from '@/components/PersonalizeModal';

export default function Layout() {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const { area, exit } = useArea();
  const { user, checkUserAuth } = useAuth();
  const { toast } = useToast();
  const [personalize, setPersonalize] = useState(false);
  if (!area) return <Navigate to="/" replace />;
  const a = AREAS[area];
  const theme = areaThemeVars(area, user?.personal_theme);
  const image = areaImage(area, user?.personal_theme);

  const NAV = [
    { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    { to: '/calendar', label: 'Calendar', Icon: CalendarDays },
    { to: '/tasks', label: 'Tasks', Icon: ListTodo },
    { to: '/courses', label: a.groupingLabel, Icon: GraduationCap },
    { to: '/contacts', label: 'Contacts', Icon: Users },
    { to: '/trash', label: 'Trash', Icon: Trash2 }
  ];
  const isActive = (to) => pathname === to || pathname.startsWith(to + '/');
  function switchArea() { exit(); nav('/'); }

  async function copyShare() {
    try {
      let token = user?.share_token;
      if (!token) {
        token = (crypto.randomUUID?.() || Math.random().toString(36).slice(2));
        await base44.entities.ShareLink.create({ token, owner_id: user.id });
        await base44.auth.updateMe({ share_token: token });
        await checkUserAuth();
      }
      const link = `${window.location.origin}/s/${token}`;
      try { await navigator.clipboard.writeText(link); } catch { /* ignore */ }
      toast({ title: 'Share link copied!', description: 'Anyone with the link can view this shared organizer.' });
    } catch (e) {
      toast({ title: 'Could not create link', description: e.message, variant: 'destructive' });
    }
  }

  return (
    <div className="min-h-screen flex relative" style={theme}>
      {image && <div className="absolute inset-0 -z-0 bg-cover bg-center opacity-20 pointer-events-none" style={{ backgroundImage: `url(${image})` }} />}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border/60 bg-card/60 backdrop-blur px-4 py-6 relative z-10">
        <div className="flex items-center gap-2.5 px-2 mb-5">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${a.gradient} flex items-center justify-center shadow-md`}>
            <a.Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-heading font-bold text-lg leading-none">Working Buddy</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{a.label}</p>
          </div>
        </div>
        <button onClick={switchArea} className="nav-link mb-3 text-muted-foreground hover:text-primary">
          <LayoutGrid className="w-[18px] h-[18px]" /> All areas
        </button>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ to, label, Icon }) => (
            <Link key={to} to={to} className={`nav-link ${isActive(to) ? 'nav-link-active' : ''}`}>
              <Icon className="w-[18px] h-[18px]" /> {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto">
          {area === 'school' && (
            <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 p-4">
              <Sparkles className="w-5 h-5 text-indigo-600 mb-2" />
              <p className="text-sm font-semibold text-indigo-900">Upload a syllabus</p>
              <p className="text-xs text-indigo-700/80 mt-1">Let AI pull every deadline & exam date for you.</p>
              <Link to="/courses" className="mt-3 inline-block text-xs font-semibold text-indigo-600 hover:text-indigo-800">Go to {a.groupingLabel} →</Link>
            </div>
          )}
          {area === 'personal' && (
            <button onClick={() => setPersonalize(true)} className="w-full text-left rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 p-4 hover:shadow-sm transition">
              <Palette className="w-5 h-5 text-teal-600 mb-2" />
              <p className="text-sm font-semibold text-teal-900">Personalize your space</p>
              <p className="text-xs text-teal-700/80 mt-1">Pick your colors, titles & a cover photo.</p>
            </button>
          )}
          {area === 'shareable' && (
            <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 p-4">
              <Share2 className="w-5 h-5 text-orange-600 mb-2" />
              <p className="text-sm font-semibold text-orange-900">Share this organizer</p>
              <p className="text-xs text-orange-700/80 mt-1">A read-only link anyone can open. Only this area is shared.</p>
              <button onClick={copyShare} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-800">
                {user?.share_token ? <><Check className="w-3.5 h-3.5" /> Copy link</> : <><Share2 className="w-3.5 h-3.5" /> Create link</>}
              </button>
            </div>
          )}
          {area === 'work' && (
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">Focus mode</p>
              <p className="text-xs text-slate-600 mt-1">Clean, professional & clutter-free.</p>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 inset-x-0 z-30 h-14 flex items-center justify-between px-4 bg-card/80 backdrop-blur border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${a.gradient} flex items-center justify-center`}>
            <a.Icon className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading font-bold">Working Buddy</span>
        </div>
        <div className="flex items-center gap-3">
          {area === 'personal' && <button onClick={() => setPersonalize(true)} className="text-muted-foreground hover:text-primary"><Palette className="w-5 h-5" /></button>}
          {area === 'shareable' && <button onClick={copyShare} className="text-muted-foreground hover:text-primary"><Share2 className="w-5 h-5" /></button>}
          <button onClick={switchArea} className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary">
            <LayoutGrid className="w-4 h-4" /> Areas
          </button>
        </div>
      </header>

      <main className="flex-1 min-w-0 pb-24 md:pb-0 pt-14 md:pt-0 relative z-10">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 grid grid-cols-6 bg-card/90 backdrop-blur border-t border-border/60">
        {NAV.map(({ to, label, Icon }) => (
          <Link key={to} to={to} className={`flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium ${isActive(to) ? 'text-primary' : 'text-muted-foreground'}`}>
            <Icon className="w-5 h-5" /> {label}
          </Link>
        ))}
      </nav>

      {personalize && <PersonalizeModal open onClose={() => setPersonalize(false)} />}
    </div>
  );
}