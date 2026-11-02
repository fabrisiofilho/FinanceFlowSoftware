import { QuickTransactionButton } from '@renderer/components/QuickTransaction';
import { NotificationBell } from '@renderer/components/NotificationBell';
import { useAppDispatch } from '@renderer/hooks/redux';

import { openDrawer } from '@renderer/redux/slices/drawer';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import {} from '@mui/icons-material';
import { Badge, Box, IconButton } from '@mui/material';
import { useState } from 'react';
import { ProfileDrawer } from './ProfileDrawer';
import { Container } from './styles';

export function HeaderMobile() {
  const [openProfileDrawer, setOpenProfileDrawer] = useState(false);

  const dispatch = useAppDispatch();

  const handleOpenMenuDrawer = () => {
    dispatch(openDrawer());
  };

  const handleOpenProfileDrawer = () => {
    setOpenProfileDrawer(true);
  };

  const handleCloseProfileDrawer = () => {
    setOpenProfileDrawer(false);
  };

  return (
    <>
      <Box>
        <Container>
          <IconButton onClick={handleOpenMenuDrawer}>
            <MenuRoundedIcon />
          </IconButton>

          {}

          <Box display="flex" alignItems="center" gap="0.5rem">
            <QuickTransactionButton />
            <NotificationBell />

            <IconButton onClick={handleOpenProfileDrawer}>
              <Badge variant="dot" color="error">
                <PersonRoundedIcon />
              </Badge>
            </IconButton>
          </Box>
        </Container>
      </Box>

      <ProfileDrawer
        open={openProfileDrawer}
        onClose={handleCloseProfileDrawer}
      />
    </>
  );
}
