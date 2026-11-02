import { changeMonthRange, type MonthRange } from './month-range';
import { useId, useState, type PropsWithChildren, type ReactNode } from 'react';
import { Box, Button, Collapse, Stack, Typography } from '@mui/material';
import {
  ExpandLessRounded,
  ExpandMoreRounded,
  FilterAltOutlined,
  RestartAltRounded,
} from '@mui/icons-material';
import { ContentSurface } from '../PageLayout';
import { MonthField } from '../Form/MonthField';

export function FilterPanel({
  children,
  onClear,
  summary,
}: PropsWithChildren<{ onClear: () => void; summary?: ReactNode }>) {
  const [expanded, setExpanded] = useState(true);
  const id = useId();
  return (
    <ContentSurface data-filter-panel loading={false} sx={{ p: 3, mb: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        gap={2}
        flexWrap="wrap"
      >
        <Stack direction="row" gap={1} alignItems="center">
          <FilterAltOutlined color="action" />
          <Typography fontWeight={600}>Filtros</Typography>
        </Stack>
        <Stack direction="row" gap={1}>
          <Button
            size="small"
            startIcon={<RestartAltRounded />}
            onClick={onClear}
          >
            Limpar filtros
          </Button>
          <Button
            size="small"
            aria-expanded={expanded}
            aria-controls={id}
            endIcon={expanded ? <ExpandLessRounded /> : <ExpandMoreRounded />}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Recolher' : 'Expandir'}
          </Button>
        </Stack>
      </Stack>
      <Collapse in={expanded} id={id}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
            gap: 2,
            mt: 2,
          }}
        >
          {children}
        </Box>
      </Collapse>
      {summary && <Box sx={{ mt: 2 }}>{summary}</Box>}
    </ContentSurface>
  );
}

export function MonthRangeFields({
  value,
  onChange,
}: {
  value: MonthRange;
  onChange: (value: MonthRange) => void;
}) {
  const format = (year: number, month: number): string =>
    `${year}-${String(month).padStart(2, '0')}`;
  const update = (side: 'start' | 'end', text: string): void => {
    onChange(changeMonthRange(value, side, text));
  };
  return (
    <>
      <MonthField
        label="De"
        value={format(value.startYear, value.startMonth)}
        onChange={(text) => update('start', text)}
      />
      <MonthField
        label="Até"
        value={format(value.endYear, value.endMonth)}
        onChange={(text) => update('end', text)}
      />
    </>
  );
}
