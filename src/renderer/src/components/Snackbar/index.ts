import { styled, alpha } from '@mui/material';
import { MaterialDesignContent } from 'notistack';
export const CustomMaterialDesignContent = styled(MaterialDesignContent)(
  ({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    border: '1px solid ' + theme.palette.divider,
    borderRadius: 14,
    padding: '8px 12px',
    boxShadow: '0 8px 32px ' + alpha(theme.palette.common.black, 0.12),
    fontSize: 14,
    maxWidth: 460,
    '& #notistack-snackbar': {
      gap: 10,
      flexWrap: 'nowrap',
      overflowWrap: 'anywhere',
    },
    ...Object.fromEntries(
      ['success', 'error', 'warning', 'info'].map((severity) => {
        const color =
          theme.palette[severity as 'success' | 'error' | 'warning' | 'info']
            .main;
        return [
          '&.notistack-MuiContent-' + severity,
          {
            borderLeft: '4px solid ' + color,
            '& #notistack-snackbar > svg': { color, flexShrink: 0 },
          },
        ];
      }),
    ),
  }),
);
