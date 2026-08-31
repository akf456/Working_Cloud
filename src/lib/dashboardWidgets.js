export const DASHBOARD_WIDGETS = [
  { key: 'stats', label: 'Overview stats', span: 'lg:col-span-3' },
  { key: 'today', label: "Today's focus & events", span: 'lg:col-span-3' },
  { key: 'deadlines', label: 'Upcoming deadlines', span: 'lg:col-span-2' },
  { key: 'progress', label: 'Weekly progress', span: 'lg:col-span-1' },
  { key: 'todoProgress', label: 'To-Do list progress', span: 'lg:col-span-1' },
  { key: 'workload', label: 'Workload breakdown', span: 'lg:col-span-2' },
  { key: 'daily', label: 'Daily & monthly progress', span: 'lg:col-span-1' }
];

export const DEFAULT_DASHBOARD_ORDER = DASHBOARD_WIDGETS.map((w) => w.key);