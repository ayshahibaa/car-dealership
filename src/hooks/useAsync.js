import { useEffect, useState } from 'react';

/**
 * useAsync — runs an async function and tracks loading / error / data.
 *
 *   const { data, loading, error } = useAsync(() => getCarById(id), [id]);
 *
 * Results from an outdated call (e.g. the user navigated away) are ignored.
 */
export function useAsync(asyncFn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    asyncFn()
      .then((data) => !cancelled && setState({ data, loading: false, error: null }))
      .catch((error) => !cancelled && setState({ data: null, loading: false, error }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
