import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import { Input } from '../Form/Input';
import { AppAlert } from '../Feedback';
import { useContentLoading } from '../ContentLoading';
import type {
  ListingKind,
  ListingRecords,
} from '@shared/interfaces/types/listing.types';

export function MultiFilter({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: string; label: string }[];
  value: string[];
  onChange: (value: string[]) => void;
}) {
  return (
    <Autocomplete
      multiple
      renderTags={(selected, getTagProps) => (
        <Box
          data-multi-values
          sx={{
            display: 'flex',
            flex: '0 1 auto',
            minWidth: 0,
            maxWidth: 'calc(100% - 48px)',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            scrollbarWidth: 'thin',
            gap: 0.5,
          }}
        >
          {selected.map((item, index) => {
            const { key, ...tagProps } = getTagProps({ index });
            return (
              <Chip
                key={key}
                {...tagProps}
                label={item.label}
                size="small"
                sx={{ flexShrink: 0, maxWidth: 'none' }}
              />
            );
          })}
        </Box>
      )}
      options={options}
      value={options.filter((o) => value.includes(o.id))}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      getOptionLabel={(o) => o.label}
      onChange={(_, items) => onChange(items.map((item) => item.id))}
      renderInput={(params) => <Input {...params} label={label} />}
      sx={{
        minWidth: 0,
        width: '100%',
        flex: 1,
        '& .MuiAutocomplete-inputRoot': { flexWrap: 'nowrap' },
        '& .MuiAutocomplete-input': {
          minWidth: '24px !important',
          flex: '1 1 24px',
        },
      }}
    />
  );
}

export function useBoardListing<K extends ListingKind>(
  kind: K,
  setRows: Dispatch<SetStateAction<ListingRecords[K][]>>,
) {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [types, setTypes] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const cursor = useRef(0),
    generation = useRef(0),
    inFlight = useRef(false);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(timer);
  }, [search]);
  const first = useCallback(async () => {
    const token = ++generation.current;
    inFlight.current = true;
    setBusy(true);
    setError('');
    try {
      const response = await window.electronAPI.listing.query({
        kind,
        search: debounced,
        types,
        page: 0,
        size: 24,
      });
      if (token !== generation.current)
        return { success: false, error: 'Consulta substituída' };
      if (!response.success || !response.data)
        throw new Error(
          response.error || 'Não foi possível carregar os registros.',
        );
      cursor.current = 0;
      setRows(response.data.content);
      setTotal(response.data.totalElements);
      setHasMore(response.data.totalPages > 1);
      return { success: true, data: response.data.content };
    } catch (error) {
      if (token === generation.current)
        setError(error instanceof Error ? error.message : 'Erro ao carregar.');
      return { success: false, error: 'Erro ao carregar.' };
    } finally {
      if (token === generation.current) {
        inFlight.current = false;
        setBusy(false);
      }
    }
  }, [kind, debounced, types, setRows]);
  const more = useCallback(async () => {
    if (inFlight.current || !hasMore || error) return;
    const token = generation.current;
    inFlight.current = true;
    setBusy(true);
    try {
      const response = await window.electronAPI.listing.query({
        kind,
        search: debounced,
        types,
        page: cursor.current + 1,
        size: 24,
      });
      if (token !== generation.current) return;
      if (!response.success || !response.data)
        throw new Error(
          response.error || 'Não foi possível carregar mais registros.',
        );
      cursor.current++;
      const incoming = response.data.content;
      setRows((rows) => [
        ...rows,
        ...incoming.filter((item) => !rows.some((row) => row.id === item.id)),
      ]);
      setTotal(response.data.totalElements);
      setHasMore(cursor.current + 1 < response.data.totalPages);
    } catch (error) {
      if (token === generation.current)
        setError(error instanceof Error ? error.message : 'Erro ao carregar.');
    } finally {
      if (token === generation.current) {
        inFlight.current = false;
        setBusy(false);
      }
    }
  }, [kind, debounced, types, setRows, hasMore, error]);
  useEffect(
    () => () => {
      generation.current++;
    },
    [],
  );
  return {
    search,
    setSearch,
    types,
    setTypes,
    busy,
    error,
    total,
    hasMore,
    first,
    more,
  };
}

type BoardState = ReturnType<typeof useBoardListing>;
export function BoardFilters({
  board,
  typeOptions = [],
}: {
  board: BoardState;
  typeOptions?: { id: string; label: string }[];
}) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
      <Input
        label="Buscar registros"
        value={board.search}
        onChange={(event) => board.setSearch(event.target.value)}
        sx={{ flex: 2 }}
      />
      {typeOptions.length > 0 && (
        <MultiFilter
          label="Tipos"
          options={typeOptions}
          value={board.types}
          onChange={board.setTypes}
        />
      )}
      <Typography variant="caption" sx={{ alignSelf: 'center' }}>
        {board.total} registro(s)
      </Typography>
    </Stack>
  );
}
export function BoardMore({ board }: { board: BoardState }) {
  return (
    <InfiniteMore
      busy={board.busy}
      error={board.error}
      hasMore={board.hasMore}
      onMore={board.more}
      onRetry={board.first}
    />
  );
}
export function InfiniteMore({
  busy,
  error,
  hasMore,
  onMore,
  onRetry,
}: {
  busy: boolean;
  error?: string;
  hasMore: boolean;
  onMore: () => unknown;
  onRetry: () => unknown;
}) {
  const contentLoading = useContentLoading();
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!sentinel.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          !busy &&
          !contentLoading &&
          !error &&
          hasMore &&
          entries.some((entry) => entry.isIntersecting)
        )
          void onMore();
      },
      { rootMargin: '200px' },
    );
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [busy, contentLoading, error, hasMore, onMore]);
  return (
    <Box ref={sentinel} sx={{ py: 3, textAlign: 'center' }}>
      {error && (
        <AppAlert
          severity="error"
          action={
            <Button onClick={() => void onRetry()}>Tentar novamente</Button>
          }
        >
          {error}
        </AppAlert>
      )}
      {busy ? (
        <CircularProgress size={24} />
      ) : (
        hasMore &&
        !error && <Button onClick={() => void onMore()}>Carregar mais</Button>
      )}
    </Box>
  );
}
