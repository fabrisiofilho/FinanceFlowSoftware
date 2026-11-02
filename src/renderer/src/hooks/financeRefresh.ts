import { useEffect } from 'react';
/** Refresh the current query without remounting a page or losing its filters. */
export function useFinanceRefresh(refresh: () => unknown) {
  useEffect(() => {
    const listener = () => { void refresh(); };
    window.addEventListener('finance-data-changed', listener);
    return () => window.removeEventListener('finance-data-changed', listener);
  }, [refresh]);
}
