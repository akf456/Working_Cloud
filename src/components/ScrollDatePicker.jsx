import React, { useState, useCallback } from 'react';
import { format, isValid, addMonths } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Date (and optional time) picker. Users can TYPE the date/time directly in the
// inputs OR open the mini-calendar popover. The popover mini-calendar shows
// prev/next month arrow buttons AND lets users scroll / swipe to move between
// months. The date and time stack vertically so they never overlap inside
// narrow grid cells. value/onChange use ISO strings ('' when empty).
export default function ScrollDatePicker({ value, onChange, withTime = true, placeholder }) {
  const parsed = value ? new Date(value) : null;
  const valid = parsed && isValid(parsed);
  const selected = valid ? parsed : undefined;
  const timeStr = withTime && valid ? format(parsed, 'HH:mm') : '';
  const dateStr = valid ? format(parsed, 'yyyy-MM-dd') : '';

  const [month, setMonth] = useState(() => (valid ? parsed : new Date()));

  // Non-passive wheel + touch-swipe handler attached to the popover body so
  // scrolling changes the displayed month (alongside the arrow buttons).
  const attachNav = useCallback((el) => {
    if (!el || el._wcNav) return;
    el._wcNav = true;
    let accum = 0;
    let last = 0;
    const step = (dir) => setMonth((m) => addMonths(m, dir));
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      accum += e.deltaY;
      const now = Date.now();
      if (now - last < 60 || Math.abs(accum) < 24) return;
      last = now;
      step(accum > 0 ? 1 : -1);
      accum = 0;
    }, { passive: false });
    let touchY = null;
    el.addEventListener('touchstart', (e) => { touchY = e.touches[0].clientY; }, { passive: true });
    el.addEventListener('touchend', (e) => {
      if (touchY == null) return;
      const dy = touchY - e.changedTouches[0].clientY;
      if (Math.abs(dy) > 28) step(dy > 0 ? 1 : -1);
      touchY = null;
    }, { passive: true });
  }, []);

  function applyDate(d) {
    if (!d) { onChange(''); return; }
    const dt = new Date(d);
    if (withTime) {
      const [hh, mm] = (timeStr || '00:00').split(':').map(Number);
      dt.setHours(hh || 0, mm || 0, 0, 0);
    } else {
      dt.setHours(0, 0, 0, 0);
    }
    onChange(dt.toISOString());
  }

  function onDateInputChange(e) {
    const v = e.target.value;
    if (!v) { onChange(''); return; }
    const [y, m, d] = v.split('-').map(Number);
    applyDate(new Date(y, m - 1, d));
  }

  function onTimeInputChange(e) {
    const v = e.target.value;
    if (!v) return;
    const base = valid ? new Date(parsed) : new Date();
    const [hh, mm] = v.split(':').map(Number);
    base.setHours(hh || 0, mm || 0, 0, 0);
    onChange(base.toISOString());
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input type="date" value={dateStr} onChange={onDateInputChange} className="flex-1" aria-label={placeholder || 'Date'} />
        <Popover onOpenChange={(o) => { if (o && valid) setMonth(parsed); }}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="icon" className="shrink-0" title="Pick from calendar">
              <CalendarIcon className="w-4 h-4 opacity-70" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <div ref={attachNav}>
              <Calendar
                mode="single"
                selected={selected}
                month={month}
                onMonthChange={setMonth}
                onSelect={(d) => applyDate(d)}
                initialFocus
              />
              <p className="text-[11px] text-muted-foreground text-center pb-2 px-3">Use the arrows, scroll, or swipe to change months</p>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      {withTime && (
        <Input type="time" value={timeStr} onChange={onTimeInputChange} />
      )}
    </div>
  );
}