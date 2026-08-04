import { useEffect, useState } from 'react';
import { APP_VERSION } from '@/lib/changelog';

// Compares the running app's baked-in APP_VERSION against the version marker
// in the deployed index.html. When they differ (a new version was published),
// we prompt the user to refresh. Polls every few minutes.
export function useAppUpdate(intervalMs = 5 * 60 * 1000) {
  const [needsRefresh, setNeedsRefresh] = useState(false);

  useEffect(() => {
    let active = true;
    async function check() {
      try {
        const res = await fetch(`${window.location.origin}/?_v=${Date.now()}`, { cache: 'no-store' });
        const html = await res.text();
        const m = html.match(/<meta\s+name="app-version"\s+content="([^"]+)"/);
        if (m && m[1] && m[1] !== APP_VERSION && active) setNeedsRefresh(true);
      } catch {
        /* ignore network errors */
      }
    }
    check();
    const id = setInterval(check, intervalMs);
    return () => { active = false; clearInterval(id); };
  }, [intervalMs]);

  return { needsRefresh };
}