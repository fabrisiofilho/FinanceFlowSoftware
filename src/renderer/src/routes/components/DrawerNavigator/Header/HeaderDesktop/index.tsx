import { NotificationBell } from '@renderer/components/NotificationBell';
import { Button, Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
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
          component={Link}
          to="/panel/transactions?new=income"
          color="success"
          size="small"
        >
          Nova receita
        </Button>
        <Button
          component={Link}
          to="/panel/transactions?new=expense"
          color="error"
          size="small"
          variant="outlined"
        >
          Nova despesa
        </Button>
        <NotificationBell />
        <SignOutButton />
      </Stack>
    </Container>
  );
}
