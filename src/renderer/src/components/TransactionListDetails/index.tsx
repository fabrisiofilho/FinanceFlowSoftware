import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import { Input } from '../Form/Input';
import { AppAlert } from '../Feedback';
import { formatCurrency } from '@renderer/utils/currency';
import { formatDateToShow } from '@renderer/utils/date';
import type {
  Transaction,
  TransactionFilters,
} from '@shared/interfaces/types/transaction.types';

export function TransactionListDetails({
  filters,
}: {
  filters: TransactionFilters;
}) {
  const [search, setSearch] = useState(''),
    [query, setQuery] = useState(''),
    [page, setPage] = useState(0);
  const [rows, setRows] = useState<Transaction[]>([]),
    [total, setTotal] = useState(0),
    [busy, setBusy] = useState(true),
    [error, setError] = useState('');
  const sentinel = useRef<HTMLDivElement>(null);
  const key = JSON.stringify(filters);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== query) {
        setPage(0);
        setQuery(search);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, query]);
  useEffect(() => {
    let current = true;
    setBusy(true);
    setError('');
    void window.electronAPI.transaction
      .findAll({ ...JSON.parse(key), search: query, page, size: 25 })
      .then((result) => {
        if (!current) return;
        if (!result.success || !result.data)
          throw new Error(result.error || 'Não foi possível carregar.');
        const data = result.data;
        setRows((previous) =>
          page === 0
            ? data.content
            : [
                ...previous,
                ...data.content.filter(
                  (item) => !previous.some((row) => row.id === item.id),
                ),
              ],
        );
        setTotal(data.totalElements);
      })
      .catch((error) => {
        if (current)
          setError(
            error instanceof Error ? error.message : 'Erro ao carregar.',
          );
      })
      .finally(() => {
        if (current) setBusy(false);
      });
    return () => {
      current = false;
    };
  }, [key, query, page]);
  useEffect(() => {
    if (!sentinel.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries.some((e) => e.isIntersecting) &&
          !busy &&
          !error &&
          rows.length < total
        )
          setPage((p) => p + 1);
      },
      { rootMargin: '100px' },
    );
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [busy, error, rows.length, total]);
  return (
    <Stack spacing={2}>
      <Input
        autoFocus
        label="Buscar lançamentos"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <Typography variant="caption">
        {total} lançamento(s) · busca e paginação no banco de dados
      </Typography>
      {error && <AppAlert severity="error">{error}</AppAlert>}
      {rows.map((row) => (
        <Stack
          key={row.id}
          direction="row"
          spacing={2}
          sx={{ py: 1, borderBottom: 1, borderColor: 'divider' }}
          justifyContent="space-between"
        >
          <Box>
            <Typography>{row.description}</Typography>
            <Typography variant="caption">
              {formatDateToShow(row.transactionDate)}
            </Typography>
          </Box>
          <Typography
            color={row.type === 'income' ? 'success.main' : 'error.main'}
          >
            {row.type === 'income' ? '+' : '−'}
            {formatCurrency(row.amount)}
          </Typography>
        </Stack>
      ))}
      {!rows.length && !busy && !error && (
        <Typography>Nenhum lançamento encontrado.</Typography>
      )}
      <Box ref={sentinel} sx={{ textAlign: 'center', py: 2 }}>
        {busy ? (
          <CircularProgress size={24} />
        ) : (
          rows.length < total &&
          !error && (
            <Button onClick={() => setPage((p) => p + 1)}>Carregar mais</Button>
          )
        )}
      </Box>
    </Stack>
  );
}
