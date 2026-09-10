import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';

const AreaContext = createContext({ area: null, enter: () => {}, exit: () => {}, sharedCalendarId: null, setSharedCalendar: () => {} });
const KEY = 'wb_area';
const SC_KEY = 'wb_sc';

export function AreaProvider({ children }) {
  const { user } = useAuth();
  const [area, setArea] = useState(() => {
    try { return localStorage.getItem(KEY) || null; } catch { return null; }
  });
  const [sharedCalendarId, setSharedCalendarId] = useState(() => {
    try { return localStorage.getItem(SC_KEY) || null; } catch { return null; }
  });
  const adopted = useRef(false);

  useEffect(() => {
    try {
      if (area) localStorage.setItem(KEY, area);
      else localStorage.removeItem(KEY);
    } catch { /* ignore */ }
  }, [area]);

  useEffect(() => {
    try {
      if (sharedCalendarId) localStorage.setItem(SC_KEY, sharedCalendarId);
      else localStorage.removeItem(SC_KEY);
    } catch { /* ignore */ }
  }, [sharedCalendarId]);

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
  function setSharedCalendar(id) { setSharedCalendarId(id); }

  return (
    <AreaContext.Provider value={{ area, enter, exit, sharedCalendarId, setSharedCalendar }}>
      {children}
    </AreaContext.Provider>
  );
}

export const useArea = () => useContext(AreaContext);