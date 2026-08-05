import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  isSameMonth, isSameDay, format
} from 'date-fns';

const WD = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function CalendarYearView({
  yearDate, today, itemsForDay, evColor, tkColor,
  onSelectDay, onPrevYear, onNextYear, onToday
}) {
  const year = yearDate.getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));

  return (
    <Card className="lg:col-span-2 p-4 md:p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{format(yearDate, 'yyyy')}</h2>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onPrevYear}><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm" onClick={onToday}>Today</Button>
          <Button variant="ghost" size="icon" onClick={onNextYear}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {months.map((m) => {
          const mStart = startOfWeek(startOfMonth(m), { weekStartsOn: 0 });
          const mEnd = endOfWeek(endOfMonth(m), { weekStartsOn: 0 });
          const mDays = eachDayOfInterval({ start: mStart, end: mEnd });
          return (
            <div key={m.getMonth()} className="rounded-lg border border-border/60 p-2">
              <p className="text-sm font-semibold text-center mb-1">{format(m, 'MMMM')}</p>
              <div className="grid grid-cols-7 text-center text-[9px] text-muted-foreground mb-0.5">
                {WD.map((d, i) => <div key={i}>{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {mDays.map((d) => {
                  const inM = isSameMonth(d, m);
                  const items = itemsForDay(d);
                  const cnt = items.evs.length + items.tks.length;
                  const isToday = isSameDay(d, today);
                  return (
                    <button
                      key={d.toISOString()}
                      onClick={() => onSelectDay(d)}
                      className={`relative aspect-square rounded text-[9px] flex flex-col items-center justify-center transition
                        ${inM ? '' : 'opacity-30'}
                        ${isToday ? 'bg-indigo-600 text-white font-bold' : 'hover:bg-accent/50'}`}
                    >
                      <span>{format(d, 'd')}</span>
                      {cnt > 0 && inM && (
                        <span className="absolute bottom-0.5 flex gap-0.5">
                          {items.evs.slice(0, 3).map((e, i) => (
                            <span key={'e' + i} className="w-1 h-1 rounded-full" style={{ backgroundColor: isToday ? '#fff' : evColor(e) }} />
                          ))}
                          {items.tks.slice(0, 2).map((t, i) => (
                            <span key={'t' + i} className="w-1 h-1 rounded-full" style={{ backgroundColor: isToday ? '#fff' : tkColor(t) }} />
                          ))}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}