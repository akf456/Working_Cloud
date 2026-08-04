import { useState, useRef } from 'react';
import { Loader2, ChevronDown } from 'lucide-react';

const THRESHOLD = 70;

export default function PullToRefresh({ onRefresh, children, className }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const pulling = useRef(false);

  function onTouchStart(e) {
    if (refreshing) return;
    if (window.scrollY > 0) { startY.current = null; return; }
    startY.current = e.touches[0].clientY;
  }
  function onTouchMove(e) {
    if (startY.current == null || refreshing) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy <= 0) { pulling.current = false; setPull(0); return; }
    pulling.current = true;
    setPull(Math.min(dy * 0.5, 100));
  }
  async function onTouchEnd() {
    if (!pulling.current) { startY.current = null; return; }
    pulling.current = false;
    startY.current = null;
    if (pull >= THRESHOLD) {
      setRefreshing(true);
      setPull(THRESHOLD);
      try { await onRefresh?.(); } finally {
        setRefreshing(false);
        setPull(0);
      }
    } else {
      setPull(0);
    }
  }

  return (
    <div className={className} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div className="flex items-center justify-center overflow-hidden transition-[height] duration-150" style={{ height: pull }}>
        {refreshing ? (
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        ) : (
          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${pull >= THRESHOLD ? 'rotate-180' : ''}`} />
        )}
      </div>
      {children}
    </div>
  );
}