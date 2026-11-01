import { Stack, Typography } from '@mui/material';
import { SpaOutlined } from '@mui/icons-material';
import { Loading } from '@renderer/components/Loading';
import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@renderer/hooks/redux';
import { loadAuthData } from '@renderer/redux/slices/auth/thunks';
import { useNavigate } from 'react-router-dom';
import { isThunkLoading } from '@renderer/utils/thunk';

export function LoadingPage() {
  const navigate = useNavigate();

  const dispatch = useAppDispatch();

  const { user, authDataLoading } = useAppSelector((state) => state.auth);

  const handleDataLoaded = useCallback(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    navigate('/panel');
  }, [user, navigate]);

  useEffect(() => {
    dispatch(loadAuthData());
  }, [dispatch]);

  useEffect(() => {
    const authLoaded = !isThunkLoading(authDataLoading, true);

    if (authLoaded) {
      handleDataLoaded();
    }
  }, [authDataLoading, handleDataLoaded]);

  return (
    <Stack
      flex={1}
      height="var(--app-height)"
      alignItems="center"
      justifyContent="center"
    >
      <SpaOutlined sx={{ fontSize: 40, color: 'secondary.main', mb: 2 }} />
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Preparando seu espaço financeiro…
      </Typography>

      <Loading size="3.5rem" />
    </Stack>
  );
}
