import React, { createContext, useContext, useState, useEffect } from 'react';

const AreaContext = createContext({ area: null, enter: () => {}, exit: () => {} });
const KEY = 'wb_area';

export function AreaProvider({ children }) {
  const [area, setArea] = useState(() => {
    try { return localStorage.getItem(KEY) || null; } catch { return null; }
  });
  useEffect(() => {
    try {
      if (area) localStorage.setItem(KEY, area);
      else localStorage.removeItem(KEY);
    } catch { /* ignore */ }
  }, [area]);
  return (
    <AreaContext.Provider value={{ area, enter: setArea, exit: () => setArea(null) }}>
      {children}
    </AreaContext.Provider>
  );
}

export const useArea = () => useContext(AreaContext);