import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import MobileTabOutlet from '@/components/MobileTabOutlet';
import { LayoutDashboard, CalendarDays, ListTodo, GraduationCap, Sparkles, Wand2, Users, Trash2, LayoutGrid, Palette, Share2, Check, Settings as SettingsIcon, Bell, MessageCircle, ChevronLeft, Menu, Timer } from 'lucide-react';
import { useArea } from '@/lib/AreaContext';
import { useI18n } from '@/lib/I18nContext';
import { AREAS } from '@/lib/areas';
import { areaThemeVars, areaImage } from '@/lib/areaTheme';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import PersonalizeModal from '@/components/PersonalizeModal';
import WorkingCloudLogo from '@/components/WorkingCloudLogo';
import ShareModal from '@/components/ShareModal';
import WhatNewModal from '@/components/WhatNewModal';
import AiTaskBreakdown from '@/components/AiTaskBreakdown';
import RefreshBanner from '@/components/RefreshBanner';
import MoreSheet from '@/components/MoreSheet';
import SyllabusImporter from '@/components/SyllabusImporter';
import { useAppUpdate } from '@/hooks/useAppUpdate';
import { CHANGELOG, getUnseenChangelog } from '@/lib/changelog';

export default function Layout() {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const { area, exit } = useArea();
  const { user, checkUserAuth } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const [personalize, setPersonalize] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [whatNew, setWhatNew] = useState(false);
  const [whatNewEntries, setWhatNewEntries] = useState(CHANGELOG);
  const [aiOpen, setAiOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [docImport, setDocImport] = useState(false);
  const { needsRefresh } = useAppUpdate();
  useEffect(() => { const u = getUnseenChangelog(); if (u.length) { setWhatNewEntries(u); setWhatNew(true); } }, []);

  function openWhatNew() { setWhatNewEntries(CHANGELOG); setWhatNew(true); }
  if (!area) return <Navigate to="/" replace />;
  const a = AREAS[area];
  const areaPrefs = user?.area_themes?.[area] || (area === 'personal' ? user?.personal_theme : null);
  const theme = areaThemeVars(area, areaPrefs);
  const image = areaImage(area, areaPrefs);

  const NAV = [
    { to: '/dashboard', label: t('nav.dashboard'), Icon: LayoutDashboard },
    { to: '/calendar', label: t('nav.calendar'), Icon: CalendarDays },
    { to: '/tasks', label: t('nav.lists'), Icon: ListTodo },
    { to: '/courses', label: t('area.' + area + '.grouping'), Icon: GraduationCap },
    { to: '/contacts', label: t('nav.contacts'), Icon: Users },
    { to: '/pomodoro', label: t('nav.pomodoro'), Icon: Timer },
    { to: '/trash', label: t('nav.trash'), Icon: Trash2 },
    { kind: 'button', label: t('nav.share'), Icon: Share2, onClick: openShare },
    { to: '/settings', label: t('nav.settings'), Icon: SettingsIcon }
  ];
  if (area === 'shareable') NAV.splice(5, 0, { to: '/encourage', label: t('nav.encourage'), Icon: MessageCircle });
  const bottomNav = [
    { to: '/dashboard', label: t('nav.dashboard'), Icon: LayoutDashboard },
    { to: '/calendar', label: t('nav.calendar'), Icon: CalendarDays },
    { to: '/tasks', label: t('nav.lists'), Icon: ListTodo },
    { to: '/courses', label: t('area.' + area + '.grouping'), Icon: GraduationCap },
    { more: true, label: t('nav.more'), Icon: Menu }
  ];
  const isActive = (to) => pathname === to || pathname.startsWith(to + '/');
  function switchArea() { exit(); nav('/areas'); }

  function openShare() { setShareOpen(true); }

  function handleBack() {
    const hasModal = new URLSearchParams(window.location.search).has('modal');
    if (window.history.length > 1) nav(-1);
    else if (hasModal) nav(pathname, { replace: true });
    else nav('/dashboard');
  }

  const isChildScreen = !['/dashboard', '/calendar', '/tasks', '/courses'].includes(pathname);

  return (
    <div className="min-h-screen flex relative" style={theme}>
      {image && <div className="absolute inset-0 -z-0 bg-cover bg-center opacity-20 pointer-events-none" style={{ backgroundImage: `url(${image})` }} />}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border/60 bg-card/60 backdrop-blur px-4 py-6 sticky top-0 h-screen overflow-y-auto relative z-10">
        <div className="px-2 mb-5">
          <div className="flex items-center justify-between">
            <WorkingCloudLogo className="text-lg" />
            <div className="flex items-center gap-1">
              <button onClick={openWhatNew} className="relative p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent" title={t('nav.whatsNew')}>
                <Bell className="w-4 h-4" />
                {getUnseenChangelog().length > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />}
              </button>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">{t('area.' + area + '.label')}</p>
        </div>
        <button onClick={switchArea} className="nav-link mb-3 text-muted-foreground hover:text-primary">
          <LayoutGrid className="w-[18px] h-[18px]" /> {t('nav.allAreas')}
        </button>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => item.kind === 'button' ? (
            <button key={item.label} onClick={item.onClick} className="nav-link w-full text-left">
              <item.Icon className="w-[18px] h-[18px]" /> {item.label}
            </button>
          ) : (
            <Link key={item.to} to={item.to} className={`nav-link ${isActive(item.to) ? 'nav-link-active' : ''}`}>
              <item.Icon className="w-[18px] h-[18px]" /> {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-3">
          <button onClick={() => setPersonalize(true)} className="w-full text-left rounded-2xl bg-accent/50 border border-border p-3 hover:shadow-sm transition flex items-center gap-2">
            <Palette className="w-4 h-4 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold">{t('layout.customizeArea', { area: t('area.' + area + '.label') })}</p>
              <p className="text-[11px] text-muted-foreground">{t('layout.colorsCover')}</p>
            </div>
          </button>
          <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 p-4">
            <Sparkles className="w-5 h-5 text-indigo-600 mb-2" />
            <p className="text-sm font-semibold text-indigo-900">{t('layout.uploadSyllabus')}</p>
            <p className="text-xs text-indigo-700/80 mt-1">{t('layout.syllabusPromo')}</p>
            <button onClick={() => setDocImport(true)} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800">
              <Sparkles className="w-3.5 h-3.5" /> {t('layout.uploadNow')}
            </button>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-fuchsia-50 border border-violet-100 p-4">
            <Wand2 className="w-5 h-5 text-violet-600 mb-2" />
            <p className="text-sm font-semibold text-violet-900">AI task breakdown</p>
            <p className="text-xs text-violet-700/80 mt-1">Turn any task into small, motivating steps spread across your days.</p>
            <button onClick={() => setAiOpen(true)} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-800">
              <Sparkles className="w-3.5 h-3.5" /> Break down a task
            </button>
          </div>
          {area === 'shareable' && (
            <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 p-4">
              <Share2 className="w-5 h-5 text-orange-600 mb-2" />
              <p className="text-sm font-semibold text-orange-900">{t('layout.shareOrganizer')}</p>
              <p className="text-xs text-orange-700/80 mt-1">{t('layout.sharePromo')}</p>
              <button onClick={openShare} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-800">
                <Share2 className="w-3.5 h-3.5" /> {user?.share_tokens?.[area] ? t('layout.manageSharing') : t('layout.createLink')}
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 inset-x-0 z-30 h-[calc(3.5rem+env(safe-area-inset-top,0px))] pt-[env(safe-area-inset-top,0px)] flex items-center justify-between px-4 bg-card/80 backdrop-blur border-b border-border/60">
        {isChildScreen ? (
          <button onClick={handleBack} className="flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-primary">
            <ChevronLeft className="w-5 h-5" /> {t('nav.back')}
          </button>
        ) : (
          <>
            <WorkingCloudLogo className="text-base" />
            <div className="flex items-center gap-3">
              <button onClick={openWhatNew} className="relative text-muted-foreground hover:text-primary" title={t('nav.whatsNew')}>
                <Bell className="w-5 h-5" />
                {getUnseenChangelog().length > 0 && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500" />}
              </button>
              <button onClick={() => setPersonalize(true)} className="text-muted-foreground hover:text-primary" title={t('nav.customize')}><Palette className="w-5 h-5" /></button>
              <button onClick={openShare} className="text-muted-foreground hover:text-primary" title={t('nav.share')}><Share2 className="w-5 h-5" /></button>
              <button onClick={() => setMoreOpen(true)} className="text-muted-foreground hover:text-primary" title={t('nav.more')}><Menu className="w-5 h-5" /></button>
            </div>
          </>
        )}
      </header>

      <main className="flex-1 min-w-0 pb-24 md:pb-0 pt-[calc(3.5rem+env(safe-area-inset-top,0px))] md:pt-0 relative z-10" style={{ overflowX: 'clip' }}>
        <RefreshBanner />
        <MobileTabOutlet />
      </main>

      {/* Mobile bottom nav */}
      {!isChildScreen && (
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 grid bg-card/90 backdrop-blur border-t border-border/60 pb-[env(safe-area-inset-bottom,0px)]" style={{ gridTemplateColumns: `repeat(${bottomNav.length}, minmax(0, 1fr))` }}>
          {bottomNav.map((item) => item.more ? (
            <button key="more" type="button" onClick={() => setMoreOpen(true)} className="flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium text-muted-foreground">
              <item.Icon className="w-5 h-5" /> {item.label}
            </button>
          ) : (
            <Link key={item.to} to={item.to} onClick={(e) => { if (isActive(item.to)) { e.preventDefault(); window.scrollTo({ top: 0 }); } }} className={`flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium ${isActive(item.to) ? 'text-primary' : 'text-muted-foreground'}`}>
              <item.Icon className="w-5 h-5" /> {item.label}
            </Link>
          ))}
        </nav>
      )}

      {personalize && <PersonalizeModal open area={area} onClose={() => setPersonalize(false)} />}
      <ShareModal open={shareOpen} area={area} onClose={() => setShareOpen(false)} />
      <WhatNewModal open={whatNew} entries={whatNewEntries} onClose={() => setWhatNew(false)} />
      <AiTaskBreakdown open={aiOpen} onClose={() => setAiOpen(false)} area={area} onDone={checkUserAuth} />
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} area={area} onNavigate={(to) => nav(to)} onAreas={switchArea} onLogout={() => base44.auth.logout('/')} />
      <SyllabusImporter open={docImport} onClose={() => setDocImport(false)} area={area} courses={[]} onDone={checkUserAuth} />
    </div>
  );
}