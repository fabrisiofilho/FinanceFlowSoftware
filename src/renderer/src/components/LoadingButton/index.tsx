import { Button, type ButtonProps, CircularProgress } from '@mui/material';
import type { ReactNode } from 'react';

type LoadingButtonProps = Omit<ButtonProps, 'loading'> & {
  children: ReactNode;
  loading?: boolean;
};

export function LoadingButton({
  children,
  loading = false,
  ...rest
}: Readonly<LoadingButtonProps>) {
  return (
    <Button
      {...rest}
      aria-busy={loading}
      disabled={loading || rest.disabled}
      startIcon={
        loading ? (
          <CircularProgress size={18} color="inherit" />
        ) : (
          rest.startIcon
        )
      }
    >
      {children}
    </Button>
  );
}
