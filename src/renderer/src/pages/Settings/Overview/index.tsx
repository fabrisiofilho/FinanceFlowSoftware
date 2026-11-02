import { useState } from 'react';
import { AutoAwesomeRounded } from '@mui/icons-material';
import { Button, Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { PageContainer, ContentSurface } from '@renderer/components/PageLayout';
import { PageHeader } from '@renderer/components/PageHeader';
import { Input } from '@renderer/components/Form/Input';
import { LoadingButton } from '@renderer/components/LoadingButton';
import { AppAlert } from '@renderer/components/Feedback';
export function SettingsPage() {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const run = async (action: 'export' | 'restore'): Promise<void> => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await window.electronAPI.backup[action](password);
      if (!result.success)
        throw new Error(result.error || 'Não foi possível concluir.');
      if (result.data)
        setMessage(
          action === 'export'
            ? 'Backup criptografado salvo. Guarde a senha em local seguro.'
            : 'Backup restaurado. Reiniciando o aplicativo…',
        );
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Não foi possível concluir.',
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <PageContainer>
      <PageHeader
        title="Configurações"
        description="Organize suas preferências e proteja os dados locais."
      />
      <ContentSurface sx={{ p: 3, mb: 3 }}>
        <Button
          startIcon={<AutoAwesomeRounded />}
          onClick={() =>
            window.dispatchEvent(new Event('contabily:start-tour'))
          }
          sx={{ mb: 2 }}
        >
          Fazer tour guiado
        </Button>
        <Stack direction="row" gap={2} flexWrap="wrap">
          <Button component={Link} to="/panel/diagnostics" variant="outlined">Diagnóstico local</Button>
          <Button component={Link} to="/panel/categories" variant="outlined">
            Categorias
          </Button>
          <Button component={Link} to="/panel/alerts" variant="outlined">
            Regras de alertas
          </Button>
          <Button component={Link} to="/panel/manual" variant="outlined">
            Manual do sistema
          </Button>
        </Stack>
      </ContentSurface>
      <ContentSurface data-tour="backup-section" sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h6">Backup e restauração</Typography>
          <Typography color="text.secondary">
            O backup inclui todos os perfis, contas, lançamentos e anexos deste
            computador. Ele é criptografado por senha. Se perder essa senha, não
            será possível recuperar o arquivo.
          </Typography>
          <AppAlert severity="warning">
            Restaurar substitui todos os dados locais e reinicia a aplicação.
            Será solicitada confirmação antes da substituição. A cópia local de
            segurança do banco anterior não é criptografada e deve ser protegida
            como o próprio banco.
          </AppAlert>
          <Input
            type="password"
            label="Senha do arquivo de backup"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            helperText="No mínimo 10 caracteres. Para restaurar, informe a senha usada ao criar o arquivo."
            autoComplete="off"
            disabled={busy}
          />
          {error && <AppAlert severity="error">{error}</AppAlert>}
          {message && <AppAlert severity="success">{message}</AppAlert>}
          <Stack direction="row" gap={2} flexWrap="wrap">
            <LoadingButton
              variant="contained"
              loading={busy}
              disabled={password.length < 10}
              onClick={() => void run('export')}
            >
              Criar backup
            </LoadingButton>
            <Button
              variant="outlined"
              disabled={busy || password.length < 10}
              onClick={() => void run('restore')}
            >
              Restaurar backup
            </Button>
          </Stack>
        </Stack>
      </ContentSurface>
    </PageContainer>
  );
}
