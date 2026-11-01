import { Alert, type AlertProps, alpha, type Theme } from '@mui/material';
import {
  CheckCircleOutlineRounded,
  ErrorOutlineRounded,
  InfoOutlined,
  WarningAmberRounded,
} from '@mui/icons-material';

export const feedbackIcons = {
  success: <CheckCircleOutlineRounded fontSize="small" />,
  error: <ErrorOutlineRounded fontSize="small" />,
  warning: <WarningAmberRounded fontSize="small" />,
  info: <InfoOutlined fontSize="small" />,
};
export function feedbackStyle(
  theme: Theme,
  severity: 'success' | 'error' | 'warning' | 'info',
) {
  const color = theme.palette[severity].main;
  return {
    backgroundColor: alpha(color, theme.palette.mode === 'dark' ? 0.12 : 0.06),
    border: `1px solid ${alpha(color, 0.24)}`,
    borderRadius: 14,
    color: theme.palette.text.primary,
    '& .MuiAlert-icon': {
      color:
        theme.palette.mode === 'dark' ? color : theme.palette[severity].dark,
    },
  };
}
export function AppAlert(props: AlertProps) {
  return <Alert variant="outlined" iconMapping={feedbackIcons} {...props} />;
}
