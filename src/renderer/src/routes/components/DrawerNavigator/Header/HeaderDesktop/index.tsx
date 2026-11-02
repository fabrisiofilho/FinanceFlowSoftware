import { NotificationBell } from '@renderer/components/NotificationBell';
import { Button, Stack, Typography } from '@mui/material';
import { QuickTransactionButton } from '@renderer/components/QuickTransaction';
import {} from '@mui/icons-material';

import { SignOutButton } from '../HeaderActions/SignOutButton';
import { Container } from './styles';

export function HeaderDesktop() {
  return (
    <Container>
      <Stack direction="row" alignItems="center" gap="1.5rem">
        <Typography variant="h6" color="primary">
          Seu espaço financeiro
        </Typography>
      </Stack>

      <Stack direction="row" alignItems="center" gap="1rem">
        <Button
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent('quick-transaction', { detail: 'income' }),
            )
          }
          data-tour="income-create"
          color="success"
          size="small"
        >
          Nova receita
        </Button>
        <Button
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent('quick-transaction', { detail: 'expense' }),
            )
          }
          data-tour="expense-create"
          color="error"
          size="small"
          variant="outlined"
        >
          Nova despesa
        </Button>
        <QuickTransactionButton />
        <NotificationBell />
        <SignOutButton />
      </Stack>
    </Container>
  );
}
