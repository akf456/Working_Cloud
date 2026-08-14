import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';

const AreaContext = createContext({ area: null, enter: () => {}, exit: () => {} });
const KEY = 'wb_area';

export function AreaProvider({ children }) {
  const { user } = useAuth();
  const [area, setArea] = useState(() => {
    try { return localStorage.getItem(KEY) || null; } catch { return null; }
  });
  const adopted = useRef(false);

  useEffect(() => {
    try {
      if (area) localStorage.setItem(KEY, area);
      else localStorage.removeItem(KEY);
    } catch { /* ignore */ }
  }, [area]);

  // Adopt the profile's last area on sign-in so it syncs across devices.
  useEffect(() => {
    if (!user) { adopted.current = false; return; }
    if (adopted.current) return;
    adopted.current = true;
    const pa = user.active_area || null;
    if (pa !== area) setArea(pa);
  }, [user]);

  function enter(a) {
    setArea(a);
    if (user) base44.auth.updateMe({ active_area: a }).catch(() => {});
  }
  function exit() {
    setArea(null);
    if (user) base44.auth.updateMe({ active_area: null }).catch(() => {});
  }

  return (
    <AreaContext.Provider value={{ area, enter, exit }}>
      {children}
    </AreaContext.Provider>
  );
}

export const useArea = () => useContext(AreaContext);