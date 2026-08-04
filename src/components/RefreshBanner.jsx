import React, { useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { useAppUpdate } from '@/hooks/useAppUpdate';

export default function RefreshBanner() {
  const { needsRefresh } = useAppUpdate();
  const [dismissed, setDismissed] = useState(false);
  if (!needsRefresh || dismissed) return null;
  return (
    <div className="mx-3 md:mx-6 mt-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white px-4 py-2.5 flex items-center gap-3 shadow-md animate-fade-in">
      <RefreshCw className="w-4 h-4 shrink-0" />
      <p className="text-sm font-medium flex-1">A new version is here — refresh to update the app with new features!</p>
      <button onClick={() => window.location.reload()} className="text-xs font-semibold bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1.5 shrink-0">Refresh</button>
      <button onClick={() => setDismissed(true)} className="p-1 hover:bg-white/20 rounded-lg shrink-0"><X className="w-4 h-4" /></button>
    </div>
  );
}