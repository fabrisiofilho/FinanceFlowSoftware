import { createContext, forwardRef, useContext, useRef, useState } from 'react';
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
import { CloseRounded, OpenInFullRounded } from '@mui/icons-material';

import { CardSkeleton, useContentLoading } from '../ContentLoading';

const ExpandedContext = createContext(false);
export const ExpandableCard = forwardRef<
  HTMLDivElement,
  PaperProps & {
    loading?: boolean;
    expandable?: boolean;
    expandedContent?: React.ReactNode;
    expandedTitle?: string;
  }
>(function ExpandableCard(
  {
    children,
    loading: explicitLoading,
    expandable = false,
    expandedContent,
    expandedTitle,
    ...props
  }: PaperProps & {
    loading?: boolean;
    expandable?: boolean;
    expandedContent?: React.ReactNode;
    expandedTitle?: string;
  },
  ref,
) {
  const contextLoading = useContentLoading();
  const busy = explicitLoading ?? contextLoading;
  const expandedParent = useContext(ExpandedContext);
  const [open, setOpen] = useState(false);
  const card = useRef<HTMLDivElement | null>(null);
  const [title, setTitle] = useState('Detalhes');
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
        {expandable && !expandedParent && !props['aria-hidden'] && (
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
                  expandedTitle ||
                    card.current?.querySelector(
                      '[data-card-title],h2,h3,h4,h5,h6,p,span',
                    )?.textContent ||
                    'Detalhes do card',
                );

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
        <DialogContent dividers>
          <ExpandedContext.Provider value={true}>
            <Box
              sx={{
                minWidth: 0,

                '& .expand-card': { display: 'none' },
                overflow: 'auto',
              }}
            >
              {expandedContent ?? children}
            </Box>
          </ExpandedContext.Provider>
        </DialogContent>
      </Dialog>
    </>
  );
});
