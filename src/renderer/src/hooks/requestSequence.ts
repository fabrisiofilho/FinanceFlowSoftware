import { useCallback, useEffect, useRef } from 'react';
/** Respostas de um filtro antigo não podem sobrescrever o filtro mais recente. */
export function useRequestSequence() {
  const current = useRef(0);
  useEffect(
    () => () => {
      current.current++;
    },
    [],
  );
  const begin = useCallback(() => ++current.current, []);
  const isCurrent = useCallback((id: number) => current.current === id, []);
  return { begin, isCurrent };
}
