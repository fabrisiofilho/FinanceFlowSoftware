import { NotificationBell } from '@renderer/components/NotificationBell';
import { Stack, Typography } from '@mui/material';

import { SignOutButton } from '../HeaderActions/SignOutButton';
import { TransactionActions } from '../TransactionActions';
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
        <TransactionActions />
        <NotificationBell />
        <SignOutButton />
      </Stack>
    </Container>
  );
}
