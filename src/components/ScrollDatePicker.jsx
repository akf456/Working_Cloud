import React, { useState, useCallback } from 'react';
import { format, isValid, addMonths } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Date (and optional time) picker that lets users scroll or swipe to move
// between months instead of clicking prev/next buttons. value/onChange use
// ISO strings ('' when empty).
export default function ScrollDatePicker({ value, onChange, withTime = true, placeholder }) {
  const parsed = value ? new Date(value) : null;
  const valid = parsed && isValid(parsed);
  const selected = valid ? parsed : undefined;
  const timeStr = withTime && valid ? format(parsed, 'HH:mm') : '';

  const [month, setMonth] = useState(() => (valid ? parsed : new Date()));

  // Non-passive wheel + touch-swipe handler attached to the popover body so
  // scrolling changes the displayed month (replacing the click buttons).
  const attachNav = useCallback((el) => {
    if (!el || el._wcNav) return;
    el._wcNav = true;
    let lock = false;
    const step = (dir) => {
      if (lock) return;
      lock = true;
      setTimeout(() => { lock = false; }, 200);
      setMonth((m) => addMonths(m, dir));
    };
    el.addEventListener('wheel', (e) => { e.preventDefault(); step(e.deltaY > 0 ? 1 : -1); }, { passive: false });
    let touchY = null;
    el.addEventListener('touchstart', (e) => { touchY = e.touches[0].clientY; }, { passive: true });
    el.addEventListener('touchend', (e) => {
      if (touchY == null) return;
      const dy = touchY - e.changedTouches[0].clientY;
      if (Math.abs(dy) > 28) step(dy > 0 ? 1 : -1);
      touchY = null;
    }, { passive: true });
  }, []);

  function emit(date, time) {
    if (!date) { onChange(''); return; }
    const d = new Date(date);
    if (withTime) {
      const [hh, mm] = (time || '00:00').split(':').map(Number);
      d.setHours(hh || 0, mm || 0, 0, 0);
    } else {
      d.setHours(0, 0, 0, 0);
    }
    onChange(d.toISOString());
  }

  const label = valid ? format(parsed, withTime ? 'MMM d, yyyy · h:mm a' : 'MMM d, yyyy') : (placeholder || 'Pick a date');

  return (
    <div className="flex gap-2 items-center">
      <Popover onOpenChange={(o) => { if (o && valid) setMonth(parsed); }}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className="rounded-xl justify-start text-left font-normal flex-1 h-9">
            <CalendarIcon className="w-4 h-4 mr-2 opacity-70" />
            <span className="truncate">{label}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div ref={attachNav}>
            <Calendar
              mode="single"
              selected={selected}
              month={month}
              onMonthChange={setMonth}
              onSelect={(d) => emit(d, timeStr)}
              initialFocus
              classNames={{ nav: 'hidden' }}
            />
            <p className="text-[11px] text-muted-foreground text-center pb-2 px-3">Scroll or swipe to change months</p>
          </div>
        </PopoverContent>
      </Popover>
      {withTime && (
        <Input type="time" value={timeStr} disabled={!selected} onChange={(e) => emit(selected || new Date(), e.target.value)} className="w-28" />
      )}
    </div>
  );
}