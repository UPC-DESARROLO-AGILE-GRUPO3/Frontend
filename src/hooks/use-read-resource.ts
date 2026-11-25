import { useCallback, useEffect, useState } from 'react';

type ReadResult<T> = {
  read: () => Promise<T>;
  revision: number;
} & ({ data: T; error: null } | { data: null; error: unknown });

export function useReadResource<T>(read: (() => Promise<T>) | null) {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<ReadResult<T> | null>(null);

  useEffect(() => {
    if (!read) return;

    let active = true;
    void read().then(
      data => {
        if (active) setResult({ read, revision, data, error: null });
      },
      (error: unknown) => {
        if (active) setResult({ read, revision, data: null, error });
      }
    );

    return () => { active = false; };
  }, [read, revision]);

  const refresh = useCallback(() => setRevision(current => current + 1), []);
  const current = read && result?.read === read ? result : null;

  return {
    data: current?.data ?? null,
    error: current?.revision === revision ? current.error : null,
    isLoading: !!read && current?.revision !== revision,
    refresh,
  };
}

export function readErrorMessage(error: unknown, fallback: string) {
  if (error == null) return null;
  return error instanceof Error ? error.message : fallback;
}
