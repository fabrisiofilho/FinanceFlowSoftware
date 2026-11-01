import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
  type PaperProps,
} from '@mui/material';
import {
  CloseRounded,
  OpenInFullRounded,
  SearchRounded,
} from '@mui/icons-material';
import { Input } from '../Form/Input';
import { CardSkeleton, useContentLoading } from '../ContentLoading';

const ExpandedContext = createContext(false);
export const ExpandableCard = forwardRef<
  HTMLDivElement,
  PaperProps & { loading?: boolean }
>(function ExpandableCard(
  {
    children,
    loading: explicitLoading,
    ...props
  }: PaperProps & { loading?: boolean },
  ref,
) {
  const contextLoading = useContentLoading();
  const busy = explicitLoading ?? contextLoading;
  const expandedParent = useContext(ExpandedContext);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [count, setCount] = useState(0);
  const body = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement | null>(null);
  const [title, setTitle] = useState('Detalhes do card');
  useEffect(() => {
    if (!open || !body.current) return;
    const rows = Array.from(
      body.current.querySelectorAll<HTMLElement>(
        'tbody tr, li, [data-card-row]',
      ),
    );
    const elements = rows.length
      ? rows
      : Array.from(
          body.current.querySelectorAll<HTMLElement>('p, h2, h3, h4, h5, h6'),
        );
    const normalize = (text: string): string =>
      text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
    const matches = elements.filter((element) =>
      normalize(element.textContent || '').includes(normalize(query)),
    );
    elements.forEach((element) => {
      element.dataset.cardFilterHidden = String(
        Boolean(query) && rows.length > 0 && !matches.includes(element),
      );
      element.style.outline =
        query && matches.includes(element) ? '1px solid #81c9a4' : '';
    });
    setCount(query ? matches.length : 0);
    return () =>
      elements.forEach((element) => {
        delete element.dataset.cardFilterHidden;
        element.style.outline = '';
      });
  }, [open, query, children]);
  return (
    <>
      <Paper
        {...props}
        aria-busy={busy}
        ref={(node) => {
          card.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        elevation={0}
        sx={{
          minWidth: 0,
          position: 'relative',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          bgcolor: 'background.paper',
          transition: 'border-color 160ms ease, box-shadow 160ms ease',
          '&:hover': {
            borderColor: '#4b5563',
            boxShadow: '0 0 0 1px #ffffff05',
          },
          ...props.sx,
        }}
      >
        <Box sx={{ display: 'contents' }} inert={busy} aria-hidden={busy}>
          {children}
        </Box>
        <Box
          aria-hidden="true"
          data-card-skeleton
          sx={{
            position: 'absolute',
            inset: 0,
            p: 3,
            zIndex: 2,
            bgcolor: 'background.paper',
            opacity: busy ? 1 : 0,
            pointerEvents: busy ? 'auto' : 'none',
            transition: 'opacity 180ms ease',
            borderRadius: 'inherit',
            '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
          }}
        >
          <CardSkeleton />
        </Box>
        {!expandedParent && !props['aria-hidden'] && (
          <Tooltip title="Ampliar card">
            <IconButton
              size="small"
              disabled={busy}
              aria-label="Ampliar card"
              className="expand-card"
              sx={{
                position: 'absolute',
                right: 6,
                top: 6,
                opacity: 0.5,
                '&:hover': { opacity: 1 },
                zIndex: 1,
              }}
              onClick={(event) => {
                event.stopPropagation();
                setTitle(
                  card.current?.querySelector(
                    '[data-card-title],h2,h3,h4,h5,h6,p,span',
                  )?.textContent || 'Detalhes do card',
                );
                setQuery('');
                setOpen(true);
              }}
            >
              <OpenInFullRounded sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
        )}
      </Paper>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="lg"
        scroll="paper"
      >
        <DialogTitle>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography component="span" variant="h6">
              {title}
            </Typography>
            <IconButton
              aria-label="Fechar detalhes"
              onClick={() => setOpen(false)}
            >
              <CloseRounded />
            </IconButton>
          </Stack>
        </DialogTitle>
        <Box sx={{ px: 3, pb: 2 }}>
          <Input
            fullWidth
            label="Buscar neste card"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <SearchRounded sx={{ mr: 1, color: 'text.secondary' }} />
                ),
              },
            }}
          />
          {query && (
            <Typography variant="caption">{count} correspondências</Typography>
          )}
        </Box>
        <DialogContent dividers>
          <ExpandedContext.Provider value={true}>
            <Box
              ref={body}
              sx={{
                minWidth: 0,
                '[data-card-filter-hidden=true]': { display: 'none' },
                '& .expand-card': { display: 'none' },
                overflow: 'auto',
              }}
            >
              {children}
            </Box>
          </ExpandedContext.Provider>
        </DialogContent>
      </Dialog>
    </>
  );
});
