import { useEffect, useRef, useState } from 'react';
import { useLocation, useOutlet, useNavigationType } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
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

  // Per-tab scroll memory so switching cached tabs restores position.
  const savedScroll = useRef({});
  const prevPath = useRef(path);
  useEffect(() => {
    savedScroll.current[prevPath.current] = window.scrollY;
    prevPath.current = path;
    if (TAB_PATHS.includes(path)) window.scrollTo({ top: savedScroll.current[path] ?? 0 });
    else window.scrollTo({ top: 0 });
  }, [path]);

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