import { useEffect, useRef, useState } from 'react';
import { useLocation, useOutlet, useNavigationType } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useArea } from '@/lib/AreaContext';
import Dashboard from '@/pages/Dashboard';
import CalendarPage from '@/pages/CalendarPage';
import TasksPage from '@/pages/TasksPage';
import CoursesPage from '@/pages/CoursesPage';

const TABS = [
  { path: '/dashboard', Comp: Dashboard },
  { path: '/calendar', Comp: CalendarPage },
  { path: '/tasks', Comp: TasksPage },
  { path: '/courses', Comp: CoursesPage },
];
const TAB_PATHS = TABS.map((t) => t.path);

export default function MobileTabOutlet() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const f = () => setIsMobile(mq.matches);
    mq.addEventListener('change', f);
    return () => mq.removeEventListener('change', f);
  }, []);

  const location = useLocation();
  const outlet = useOutlet();
  const navType = useNavigationType();
  const path = location.pathname;
  const isTab = TAB_PATHS.includes(path);
  const { area } = useArea();

  // Per-tab scroll memory. Desktop keeps the original path-only in-memory behavior;
  // mobile keys by area+path and persists to sessionStorage so positions survive
  // tab switches, area switches and refreshes.
  const savedScroll = useRef({});
  const prevPath = useRef(path);
  const prevKey = useRef(`${area}:${path}`);

  useEffect(() => {
    if (!isMobile) {
      savedScroll.current[prevPath.current] = window.scrollY;
      prevPath.current = path;
      if (TAB_PATHS.includes(path)) window.scrollTo({ top: savedScroll.current[path] ?? 0 });
      else window.scrollTo({ top: 0 });
      return;
    }

    const curKey = `${area}:${path}`;
    savedScroll.current[prevKey.current] = window.scrollY;
    try { sessionStorage.setItem('wc_scroll:' + prevKey.current, String(window.scrollY)); } catch {}
    prevKey.current = curKey;

    if (TAB_PATHS.includes(path)) {
      let y = savedScroll.current[curKey];
      if (y == null) { try { y = Number(sessionStorage.getItem('wc_scroll:' + curKey)) || 0; } catch { y = 0; } }
      const top = y || 0;
      window.scrollTo({ top });
      const raf = requestAnimationFrame(() => window.scrollTo({ top }));
      return () => cancelAnimationFrame(raf);
    }
    window.scrollTo({ top: 0 });
  }, [path, area, isMobile]);

  if (!isMobile) return <>{outlet}</>;

  const pop = navType === 'POP';

  return (
    <>
      {TABS.map((t) => (
        <div key={t.path} style={{ display: path === t.path ? 'block' : 'none' }} aria-hidden={path !== t.path}>
          <t.Comp />
        </div>
      ))}
      <AnimatePresence mode="popLayout">
        {!isTab && (
          <motion.div key={path}
            initial={{ x: pop ? '-100%' : '100%' }}
            animate={{ x: 0 }}
            exit={{ x: pop ? '100%' : '-100%' }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="bg-background"
          >
            {outlet}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}