import type { ReactNode } from 'react';
import { AlertTitle, Box } from '@mui/material';
import { AppAlert } from '../Feedback';
export enum AlertBoxVariantsEnum {
  success = 'success',
  info = 'info',
  danger = 'danger',
  warn = 'warn',
  primary = 'primary',
}
export type AlertBoxVariants = keyof typeof AlertBoxVariantsEnum;
type Props = {
  title: string;
  description: ReactNode;
  show?: boolean;
  onClose?: () => void;
  variant?: AlertBoxVariants;
  icon?: AlertBoxVariants;
  noMargin?: boolean;
};
const severity = {
  success: 'success',
  info: 'info',
  danger: 'error',
  warn: 'warning',
  primary: 'info',
} as const;
export function AlertBox({
  title,
  description,
  show = true,
  onClose,
  variant = 'info',
  noMargin = false,
}: Readonly<Props>) {
  if (!show) return null;
  return (
    <AppAlert
      severity={severity[variant]}
      onClose={onClose}
      sx={{ mb: noMargin ? 0 : 3 }}
    >
      <AlertTitle>{title}</AlertTitle>
      <Box>{description}</Box>
    </AppAlert>
  );
}
