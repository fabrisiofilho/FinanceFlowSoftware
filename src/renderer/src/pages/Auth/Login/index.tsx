import { Box, Stack, Typography, Link as MuiLink } from '@mui/material';
import { ArrowForwardRounded, LockOutlined } from '@mui/icons-material';
import { yupResolver } from '@hookform/resolvers/yup';
import { FormTextField } from '@renderer/components/Form/FormTextField';
import { useForm } from 'react-hook-form';
import { FormPasswordField } from '@renderer/components/Form/FormPasswordField';
import { LoadingButton } from '@renderer/components/LoadingButton';
import { AuthPageTemplate } from '../components/AuthPageTemplate';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '@renderer/redux/slices/auth/thunks';
import { useAppDispatch, useAppSelector } from '@renderer/hooks/redux';
import { isThunkLoading } from '@renderer/utils/thunk';
import * as yup from 'yup';

const LoginCredentialsSchema = yup.object({
  email: yup.string().email('E-mail inválido').required('E-mail é obrigatório'),
  password: yup.string().required('Senha é obrigatória'),
});

type SubmitData = yup.InferType<typeof LoginCredentialsSchema>;

export function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { control, handleSubmit } = useForm({
    resolver: yupResolver(LoginCredentialsSchema),
    defaultValues: { email: '', password: '' },
  });

  const { loginLoading } = useAppSelector((state) => state.auth);

  const loading = isThunkLoading(loginLoading);

  const onSubmit = async (data: SubmitData) => {
    const result = await dispatch(
      login({
        ...data,
        cb: () => undefined,
      }),
    );
    if (login.fulfilled.match(result))
      navigate('/panel/dashboard', { replace: true });
  };

  return (
    <AuthPageTemplate>
      <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)}>
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '.14em',
            color: 'text.secondary',
            mb: 2,
          }}
        >
          SEU ESPAÇO FINANCEIRO
        </Typography>
        <Typography
          variant="h3"
          component="h1"
          sx={{ fontWeight: 600, letterSpacing: '-.045em', mb: 1.5 }}
        >
          Bom ter você aqui.
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ lineHeight: 1.8, mb: 4 }}
        >
          Entre na sua conta para acompanhar o que entra, o que sai e o que vem
          pela frente.
        </Typography>
        <Stack spacing={2.5}>
          <FormTextField
            control={control}
            name="email"
            type="email"
            fullWidth
            label="E-mail"
            autoComplete="username"
            disabled={loading}
            sx={{ '& .MuiOutlinedInput-root': { minHeight: 44 } }}
          />
          <FormPasswordField
            control={control}
            name="password"
            label="Senha"
            autoComplete="current-password"
            disabled={loading}
            sx={{ minHeight: 44 }}
          />
          <LoadingButton
            loading={loading}
            fullWidth
            variant="contained"
            color="secondary"
            type="submit"
            size="large"
            endIcon={<ArrowForwardRounded />}
            sx={{ minHeight: 50, mt: 1, borderRadius: 2 }}
          >
            Entrar na minha conta
          </LoadingButton>
        </Stack>
        <Stack
          direction="row"
          alignItems="center"
          gap={1}
          sx={{ mt: 3, color: 'text.secondary' }}
        >
          <LockOutlined sx={{ fontSize: 15 }} />
          <Typography variant="caption" color="text.secondary">
            Acesso local. Seus dados ficam neste dispositivo.
          </Typography>
        </Stack>
        <Box
          sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}
        >
          <Typography variant="body2" color="text.secondary">
            Sua primeira vez aqui?{' '}
            <MuiLink
              component={Link}
              to="/register"
              underline="hover"
              sx={{ fontWeight: 600 }}
            >
              Criar uma conta
            </MuiLink>
          </Typography>
        </Box>
      </Box>
    </AuthPageTemplate>
  );
}
