import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, ListTodo, GraduationCap, Sparkles, Users, Trash2 } from 'lucide-react';

const NAV = [
  { to: '/', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/calendar', label: 'Calendar', Icon: CalendarDays },
  { to: '/tasks', label: 'Tasks', Icon: ListTodo },
  { to: '/courses', label: 'Courses', Icon: GraduationCap },
  { to: '/contacts', label: 'Contacts', Icon: Users },
  { to: '/trash', label: 'Trash', Icon: Trash2 }
];

export default function Layout() {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border/60 bg-card/50 backdrop-blur px-4 py-6">
        <div className="flex items-center gap-2.5 px-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#a78bfa] to-[#f9a8d4] flex items-center justify-center shadow-md shadow-indigo-500/20">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-heading font-bold text-lg leading-none">Working Buddy</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Stay ahead, calmly.</p>
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ to, label, Icon }) => {
            const active = to === '/' ? pathname === '/' : pathname.startsWith(to);
            return (
              <Link key={to} to={to} className={`nav-link ${active ? 'nav-link-active' : ''}`}>
                <Icon className="w-[18px] h-[18px]" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 p-4">
          <Sparkles className="w-5 h-5 text-indigo-600 mb-2" />
          <p className="text-sm font-semibold text-indigo-900">Upload a syllabus</p>
          <p className="text-xs text-indigo-700/80 mt-1">Let AI pull every deadline & exam date for you.</p>
          <Link to="/courses" className="mt-3 inline-block text-xs font-semibold text-indigo-600 hover:text-indigo-800">Go to Courses →</Link>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 inset-x-0 z-30 h-14 flex items-center justify-between px-4 bg-card/80 backdrop-blur border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#a78bfa] to-[#f9a8d4] flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading font-bold">Working Buddy</span>
        </div>
      </header>

      <main className="flex-1 min-w-0 pb-24 md:pb-0 pt-14 md:pt-0">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 grid grid-cols-6 bg-card/90 backdrop-blur border-t border-border/60">
        {NAV.map(({ to, label, Icon }) => {
          const active = to === '/' ? pathname === '/' : pathname.startsWith(to);
          return (
            <Link key={to} to={to} className={`flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium ${active ? 'text-indigo-600' : 'text-muted-foreground'}`}>
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}