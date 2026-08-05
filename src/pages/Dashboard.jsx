import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { GraduationCap, ListTodo, CalendarClock, Award, Plus, ArrowRight, CheckCircle2, SlidersHorizontal } from 'lucide-react';
import { greeting, quoteOfDay, fmt, dueLabel, daysUntil, taskTypeMeta, EVENT_TYPE, parseDate } from '@/lib/planner';
import { isToday, isThisWeek, isThisMonth, isAfter } from 'date-fns';
import TaskModal from '@/components/TaskModal';
import WorkloadBreakdown from '@/components/WorkloadBreakdown';
import OverdueBanner from '@/components/OverdueBanner';
import DashboardCustomizeModal from '@/components/DashboardCustomizeModal';
import PullToRefresh from '@/components/PullToRefresh';
import { DASHBOARD_WIDGETS, DEFAULT_DASHBOARD_ORDER } from '@/lib/dashboardWidgets';
import { useArea } from '@/lib/AreaContext';
import { useAuth } from '@/lib/AuthContext';
import { AREAS } from '@/lib/areas';

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskModal, setTaskModal] = useState(false);
  const [customize, setCustomize] = useState(false);
  const { area } = useArea();
  const { user, checkUserAuth } = useAuth();

  async function load() {
    setLoading(true);
    const [t, e, c] = await Promise.all([
      base44.entities.Task.filter({ area }, '-due_date', 200),
      base44.entities.Event.filter({ area }, '-start_date', 200),
      base44.entities.Course.filter({ area })
    ]);
    setTasks(t); setEvents(e); setCourses(c);
    setLoading(false);
  }
  useEffect(() => { load(); }, [area]);

  const open = tasks.filter((t) => t.status !== 'done');
  const done = tasks.filter((t) => t.status === 'done');
  const dueThisWeek = open.filter((t) => {
    const d = parseDate(t.due_date); return d && (isThisWeek(d, { weekStartsOn: 1 }) || daysUntil(t.due_date) <= 7);
  });
  const upcomingEvents = events.filter((e) => parseDate(e.start_date) && isAfter(parseDate(e.start_date), new Date()));
  const todayTasks = open.filter((t) => parseDate(t.due_date) && isToday(parseDate(t.due_date)));
  const todayEvents = events.filter((e) => parseDate(e.start_date) && isToday(parseDate(e.start_date)));
  const upcoming = [...open].filter((t) => parseDate(t.due_date)).sort((a, b) => new Date(a.due_date) - new Date(b.due_date)).slice(0, 6);
  const total = tasks.length;
  const pct = total ? Math.round((done.length / total) * 100) : 0;
  const courseMap = Object.fromEntries(courses.map((c) => [c.id, c]));
  const quote = quoteOfDay(area, courses);
  const dueTodayAll = tasks.filter((t) => parseDate(t.due_date) && isToday(parseDate(t.due_date)));
  const dayDone = dueTodayAll.filter((t) => t.status === 'done').length;
  const dayTotal = dueTodayAll.length;
  const dueMonthAll = tasks.filter((t) => parseDate(t.due_date) && isThisMonth(parseDate(t.due_date)));
  const monthDone = dueMonthAll.filter((t) => t.status === 'done').length;
  const monthTotal = dueMonthAll.length;

  async function saveTask(data) {
    if (data.id) await base44.entities.Task.update(data.id, data);
    else await base44.entities.Task.create({ ...data, area });
    load();
  }

  // Widget order / visibility (per area, stored on the user)
  const cfg = user?.dashboard_widgets?.[area] || {};
  const order = cfg.order?.length ? cfg.order : DEFAULT_DASHBOARD_ORDER;
  const hidden = new Set(cfg.hidden || []);
  const allKeys = DASHBOARD_WIDGETS.map((w) => w.key);
  const orderedVisible = order.filter((k) => allKeys.includes(k) && !hidden.has(k));
  const extras = allKeys.filter((k) => !order.includes(k) && !hidden.has(k));
  const visibleWidgets = [...orderedVisible, ...extras];

  async function saveLayout(layout) {
    try {
      const next = { ...(user?.dashboard_widgets || {}), [area]: layout };
      await base44.auth.updateMe({ dashboard_widgets: next });
      await checkUserAuth();
      setCustomize(false);
    } catch { setCustomize(false); }
  }

  function renderWidget(key) {
    const w = DASHBOARD_WIDGETS.find((x) => x.key === key);
    const span = w?.span || 'lg:col-span-1';
    if (key === 'stats') {
      return (
        <div key={key} className={span}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <StatCard icon={GraduationCap} tint="indigo" label={AREAS[area]?.groupingLabel || 'Courses'} value={courses.length} link="/courses" />
            <StatCard icon={ListTodo} tint="violet" label="Open tasks" value={open.length} link="/tasks" />
            <StatCard icon={CalendarClock} tint="amber" label="Due this week" value={dueThisWeek.length} link="/tasks" />
            <StatCard icon={Award} tint="rose" label="Upcoming events" value={upcomingEvents.length} link="/calendar" />
          </div>
        </div>
      );
    }
    if (key === 'today') {
      return (
        <div key={key} className={span}>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-5">
              <h2 className="font-semibold text-lg mb-3">Today’s focus</h2>
              {todayTasks.length === 0 ? <Empty icon={CheckCircle2} text="No tasks due today." /> : (
                <ul className="space-y-2">{todayTasks.map((t) => <TodayTask key={t.id} task={t} courses={courseMap} />)}</ul>
              )}
            </Card>
            <Card className="p-5">
              <h2 className="font-semibold text-lg mb-3">Today’s events</h2>
              {todayEvents.length === 0 ? <Empty icon={CalendarClock} text="No events scheduled today." /> : (
                <ul className="space-y-2">
                  {todayEvents.map((e) => {
                    const E = EVENT_TYPE[e.type] || EVENT_TYPE.event;
                    return (
                      <li key={e.id} className="flex items-center gap-3 rounded-xl border border-border/60 px-3 py-2.5">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: E.dot }} />
                        <div className="min-w-0 flex-1"><p className="font-medium text-sm truncate">{e.title}</p>{e.location && <p className="text-xs text-muted-foreground">{e.location}</p>}</div>
                        <span className="text-xs text-muted-foreground shrink-0">{fmt(e.start_date, 'h:mm a')}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </div>
        </div>
      );
    }
    if (key === 'deadlines') {
      return (
        <div key={key} className={span}>
          <Card className="p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Upcoming deadlines</h2>
              <Link to="/tasks" className="text-sm text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1">All tasks <ArrowRight className="w-3.5 h-3.5" /></Link>
            </div>
            {loading ? <SkeletonRows /> : upcoming.length === 0 ? (
              <Empty icon={CheckCircle2} text="Nothing due soon. Enjoy the calm — or plan ahead." />
            ) : (
              <div className="space-y-2">
                {upcoming.map((t) => {
                  const T = taskTypeMeta(t.type);
                  const c = courseMap[t.course_id];
                  const n = daysUntil(t.due_date);
                  const overdue = n < 0;
                  return (
                    <div key={t.id} className="flex items-center gap-3 rounded-xl border border-border/60 px-3 py-2.5 hover:bg-accent/40 transition">
                      <span className={`w-9 h-9 rounded-lg flex items-center justify-center ${T.chip}`}><T.Icon className="w-4 h-4" /></span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate text-sm">{t.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {c && <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />{c.code || c.name}</span>}
                          <span>· {T.label}</span>
                        </div>
                      </div>
                      <span className={`text-xs font-semibold shrink-0 ${overdue ? 'text-rose-600' : 'text-muted-foreground'}`}>{dueLabel(t.due_date)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      );
    }
    if (key === 'progress') {
      return (
        <div key={key} className={span}>
          <Card className="p-5 flex flex-col h-full">
            <h2 className="font-semibold text-lg mb-1">Weekly progress</h2>
            <p className="text-sm text-muted-foreground mb-4">{done.length} of {total} tasks done</p>
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--muted))" strokeWidth="12" />
                  <circle cx="60" cy="60" r="52" fill="none" stroke="url(#g)" strokeWidth="12" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 52}`} strokeDashoffset={`${2 * Math.PI * 52 * (1 - pct / 100)}`} className="transition-all duration-700" />
                  <defs>
                    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#d946ef" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold gradient-text">{pct}%</span>
                  <span className="text-xs text-muted-foreground">complete</span>
                </div>
              </div>
            </div>
            <Progress value={pct} className="mt-4" />
          </Card>
        </div>
      );
    }
    if (key === 'workload') {
      return (
        <div key={key} className={span}>
          <WorkloadBreakdown tasks={tasks} />
        </div>
      );
    }
    if (key === 'daily') {
      return (
        <div key={key} className={span}>
          <Card className="p-5 h-full">
            <h2 className="font-semibold text-lg mb-4">Daily & monthly</h2>
            <div className="grid grid-cols-2 gap-4">
              <MiniRing label="Today" done={dayDone} total={dayTotal} color="#6366f1" />
              <MiniRing label="This month" done={monthDone} total={monthTotal} color="#d946ef" />
            </div>
          </Card>
        </div>
      );
    }
    return null;
  }

  return (
    <PullToRefresh onRefresh={load} className="p-4 md:p-8 max-w-6xl mx-auto animate-fade-in">
      {/* Hero */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          <h1 className="text-3xl md:text-4xl font-bold mt-1">{greeting()} 👋</h1>
          <p className="text-muted-foreground mt-2 max-w-md italic">“{quote.q}” <span className="not-italic text-xs">— {quote.a}</span></p>
        </div>
        <div className="flex gap-2 self-start md:self-auto">
          <Button variant="outline" onClick={() => setCustomize(true)} className="rounded-xl"><SlidersHorizontal className="w-4 h-4 mr-1.5" /> Customize</Button>
          <Button onClick={() => setTaskModal(true)} className="rounded-xl"><Plus className="w-4 h-4 mr-1.5" /> Quick add task</Button>
        </div>
      </div>

      <OverdueBanner tasks={tasks} courses={courses} onDone={load} />

      <div className="grid lg:grid-cols-3 gap-6">
        {visibleWidgets.map((k) => renderWidget(k))}
      </div>

      <TaskModal open={taskModal} onClose={() => setTaskModal(false)} onSave={saveTask} courses={courses} area={area} />
      <DashboardCustomizeModal open={customize} onClose={() => setCustomize(false)} order={order} hidden={[...hidden]} onSave={saveLayout} />
    </PullToRefresh>
  );
}

function StatCard({ icon: Icon, tint, label, value, link }) {
  const tints = {
    indigo: 'bg-indigo-50 text-indigo-600', violet: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600', rose: 'bg-rose-50 text-rose-600'
  };
  return (
    <Link to={link}>
      <Card className="p-4 hover:shadow-md transition cursor-pointer h-full">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tints[tint]} mb-3`}><Icon className="w-5 h-5" /></div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </Card>
    </Link>
  );
}

function TodayTask({ task, courses }) {
  const T = taskTypeMeta(task.type);
  const c = courses[task.course_id];
  return (
    <li className="flex items-center gap-3 rounded-xl border border-border/60 px-3 py-2.5">
      <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${T.chip}`}><T.Icon className="w-4 h-4" /></span>
      <div className="min-w-0 flex-1"><p className="font-medium text-sm truncate">{task.title}</p>{c && <p className="text-xs text-muted-foreground">{c.code || c.name}</p>}</div>
    </li>
  );
}

function SkeletonRows() {
  return <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-muted/60 animate-pulse" />)}</div>;
}

function Empty({ icon: Icon, text }) {
  return <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground"><Icon className="w-8 h-8 mb-2 opacity-60" /><p className="text-sm max-w-[200px]">{text}</p></div>;
}

function MiniRing({ label, done, total, color }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-20 h-20">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
          <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} className="transition-all duration-700" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-base font-bold">{pct}%</span>
          <span className="text-[10px] text-muted-foreground -mt-0.5">{done}/{total}</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground mt-2">{label}</span>
    </div>
  );
}