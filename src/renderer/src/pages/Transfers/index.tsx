import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  ArrowForward as ArrowIcon,
  SwapHoriz as SwapIcon,
} from '@mui/icons-material';
import { SelectInput } from '@renderer/components/Form/SelectInput';
import { CurrencyInput } from '@renderer/components/Form/CurrencyInput';
import { formatCurrency } from '@renderer/utils/currency';
import { formatDateToShow } from '@renderer/utils/date';
import {
  TransfersContainer,
  PageHeaderContainer,
  TransferCard,
  AccountBadge,
  ArrowContainer,
} from './styles';
import type { Transfer } from '@shared/interfaces/types/transfer.types';
import type { Account } from '@shared/interfaces/types/account.types';

export function TransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    fromAccountId: 0,
    toAccountId: 0,
    amount: 0,
    description: '',
    transferDate: new Date().toISOString().split('T')[0],
  });

  const loadAccounts = useCallback(async () => {
    const response = await window.electronAPI.account.findAll();
    if (response.success && response.data) setAccounts(response.data);
  }, []);

  const loadTransfers = useCallback(async () => {
    setLoading(true);
    const response = await window.electronAPI.transfer.findAll();
    if (response.success && response.data) setTransfers(response.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAccounts();
    loadTransfers();
  }, [loadAccounts, loadTransfers]);

  const handleSave = async () => {
    if (!formData.fromAccountId || !formData.toAccountId || !formData.amount)
      return;
    if (formData.fromAccountId === formData.toAccountId) return;
    setFormLoading(true);
    try {
      await window.electronAPI.transfer.create({
        fromAccountId: formData.fromAccountId,
        toAccountId: formData.toAccountId,
        amount: formData.amount,
        description: formData.description || undefined,
        transferDate: new Date(formData.transferDate),
      });
      setIsFormOpen(false);
      setFormData({
        fromAccountId: 0,
        toAccountId: 0,
        amount: 0,
        description: '',
        transferDate: new Date().toISOString().split('T')[0],
      });
      loadTransfers();
      loadAccounts();
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    await window.electronAPI.transfer.delete(id);
    loadTransfers();
    loadAccounts();
  };

  if (loading && transfers.length === 0) {
    return (
      <TransfersContainer>
        <Stack alignItems="center" justifyContent="center" minHeight="60vh">
          <CircularProgress />
        </Stack>
      </TransfersContainer>
    );
  }

  return (
    <TransfersContainer>
      <PageHeaderContainer>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            <SwapIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
            Transferências
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Movimente dinheiro entre suas contas
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Atualizar">
            <IconButton onClick={loadTransfers}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsFormOpen(true)}
            disabled={accounts.length < 2}
          >
            Nova Transferência
          </Button>
        </Stack>
      </PageHeaderContainer>

      {accounts.length < 2 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Você precisa ter pelo menos 2 contas cadastradas para fazer
          transferências.
        </Alert>
      )}

      {transfers.length === 0 ? (
        <Alert severity="info">Nenhuma transferência realizada ainda.</Alert>
      ) : (
        <Stack spacing={1}>
          {transfers.map((transfer) => (
            <TransferCard key={transfer.id}>
              <AccountBadge>
                <Typography variant="caption" color="text.secondary">
                  De
                </Typography>
                <Typography variant="subtitle2" fontWeight={600}>
                  {transfer.fromAccountName}
                </Typography>
              </AccountBadge>
              <ArrowContainer>
                <ArrowIcon />
              </ArrowContainer>
              <AccountBadge>
                <Typography variant="caption" color="text.secondary">
                  Para
                </Typography>
                <Typography variant="subtitle2" fontWeight={600}>
                  {transfer.toAccountName}
                </Typography>
              </AccountBadge>
              <Box flex={1}>
                <Typography variant="h6" fontWeight={700} color="primary.main">
                  {formatCurrency(transfer.amount)}
                </Typography>
                {transfer.description && (
                  <Typography variant="body2" color="text.secondary">
                    {transfer.description}
                  </Typography>
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                {formatDateToShow(transfer.transferDate)}
              </Typography>
              <Tooltip title="Excluir">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDelete(transfer.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </TransferCard>
          ))}
        </Stack>
      )}

      <Dialog
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Nova Transferência</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <SelectInput
              label="Conta de Origem"
              value={formData.fromAccountId}
              items={accounts
                .filter((a) => a.id !== formData.toAccountId)
                .map((a) => ({
                  value: a.id,
                  label: `${a.name} (${formatCurrency(a.balance)})`,
                }))}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  fromAccountId: e.target.value as number,
                }))
              }
              fullWidth
            />
            <SelectInput
              label="Conta de Destino"
              value={formData.toAccountId}
              items={accounts
                .filter((a) => a.id !== formData.fromAccountId)
                .map((a) => ({
                  value: a.id,
                  label: `${a.name} (${formatCurrency(a.balance)})`,
                }))}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  toAccountId: e.target.value as number,
                }))
              }
              fullWidth
            />
            <CurrencyInput
              label="Valor"
              fullWidth
              value={formData.amount}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, amount: value }))
              }
            />
            <TextField
              label="Descrição (opcional)"
              fullWidth
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
            <TextField
              label="Data"
              type="date"
              fullWidth
              value={formData.transferDate}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  transferDate: e.target.value,
                }))
              }
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsFormOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={
              formLoading ||
              !formData.fromAccountId ||
              !formData.toAccountId ||
              !formData.amount ||
              formData.fromAccountId === formData.toAccountId
            }
          >
            {formLoading ? <CircularProgress size={20} /> : 'Transferir'}
          </Button>
        </DialogActions>
      </Dialog>
    </TransfersContainer>
  );
}
