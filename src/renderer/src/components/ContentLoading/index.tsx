import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { Box, Skeleton, Stack } from '@mui/material';

const LoadingContext = createContext(false);
export const useContentLoading = (): boolean => useContext(LoadingContext);

/** A moldura e o conteúdo anterior permanecem montados durante atualizações. */
export function ContentLoading({
  loading,
  initial = 'inline',
  children,
}: PropsWithChildren<{
  loading: boolean;
  initial?: 'inline' | 'cards' | 'table';
}>) {
  const [loaded, setLoaded] = useState(false);
  const [visible, setVisible] = useState(loading);
  const shownAt = useRef(0);
  useEffect(() => {
    if (visible && shownAt.current === 0) shownAt.current = performance.now();
    if (!loading) {
      const finish = (): void => {
        setLoaded(true);
        setVisible(false);
      };
      const remaining = visible
        ? Math.max(0, 220 - (performance.now() - shownAt.current))
        : 0;
      const timer = window.setTimeout(finish, remaining);
      return () => window.clearTimeout(timer);
    }
    if (!loaded) {
      setVisible(true);
      return;
    }
    if (visible) return;
    const timer = window.setTimeout(() => {
      shownAt.current = performance.now();
      setVisible(true);
    }, 140);
    return () => window.clearTimeout(timer);
  }, [loading, visible, loaded]);
  const initialSkeleton = visible && !loaded && initial !== 'inline';
  return (
    <LoadingContext.Provider value={visible}>
      {visible && (
        <span className="sr-only" role="status">
          Atualizando conteúdo…
        </span>
      )}
      {initialSkeleton && (
        <Box
          aria-hidden="true"
          sx={{
            display: 'grid',
            gridTemplateColumns:
              initial === 'cards'
                ? { xs: '1fr', md: 'repeat(3,minmax(0,1fr))' }
                : '1fr',
            gap: 3,
          }}
        >
          {Array.from({ length: initial === 'cards' ? 3 : 1 }, (_, index) => (
            <Box
              key={index}
              sx={{
                height: initial === 'cards' ? 240 : 380,
                p: 3,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                bgcolor: 'background.paper',
              }}
            >
              <CardSkeleton />
            </Box>
          ))}
        </Box>
      )}
      <Box sx={{ display: initialSkeleton ? 'none' : 'contents' }}>
        {children}
      </Box>
    </LoadingContext.Provider>
  );
}

export function CardSkeleton() {
  return (
    <Stack
      aria-hidden="true"
      spacing={1}
      sx={{ width: '100%', height: '100%', overflow: 'hidden' }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Skeleton
          variant="rounded"
          width={28}
          height={28}
          sx={{ flexShrink: 0 }}
        />
        <Skeleton width="44%" height={22} />
      </Stack>
      <Skeleton width="62%" height={20} sx={{ flexShrink: 0 }} />
      <Skeleton
        variant="rounded"
        sx={{ flex: 1, minHeight: 0, width: '100%' }}
      />
    </Stack>
  );
}
