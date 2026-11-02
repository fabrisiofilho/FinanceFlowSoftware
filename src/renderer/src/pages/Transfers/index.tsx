import { amountToCents } from '@shared/finance/entry-schedule';
import { AppAlert } from '@renderer/components/Feedback';
import { QuickCreate } from '@renderer/components/QuickCreate';
import {
  useBoardListing,
  BoardFilters,
  BoardMore,
} from '@renderer/components/BoardListing';
import { ContentLoading } from '@renderer/components/ContentLoading';
import { PageHeader } from '@renderer/components/PageHeader';
import { DatePicker } from '@renderer/components/Form/DatePicker';
import { format } from 'date-fns';
import { AppAlert as Alert } from '@renderer/components/Feedback';
import { Input as TextField } from '@renderer/components/Form/Input';

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
} from '@mui/material';
import {
  AddOutlined as AddIcon,
  RefreshOutlined as RefreshIcon,
  DeleteOutlined as DeleteIcon,
  ArrowForwardOutlined as ArrowIcon,
} from '@mui/icons-material';
import { SelectInput } from '@renderer/components/Form/SelectInput';
import { CurrencyInput } from '@renderer/components/Form/CurrencyInput';
import { formatCurrency } from '@renderer/utils/currency';
import { formatDateToShow, parseDateSafe } from '@renderer/utils/date';
import {
  TransfersContainer,
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
  const [quick, setQuick] = useState<'account' | 'category' | null>(null);
  const [quickField, setQuickField] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formError, setFormError] = useState('');
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

  const board = useBoardListing('transfers', setTransfers);
  const queryFirst = board.first;
  const loadTransfers = useCallback(async () => {
    setLoading(true);
    await queryFirst();
    setLoading(false);
  }, [queryFirst]);

  useEffect(() => {
    loadAccounts();
    loadTransfers();
  }, [loadAccounts, loadTransfers]);

  const handleSave = async () => {
    if (!formData.fromAccountId || !formData.toAccountId) {
      setFormError('Selecione as contas de origem e destino.');
      return;
    }
    if (formData.fromAccountId === formData.toAccountId) {
      setFormError('Origem e destino devem ser diferentes.');
      return;
    }
    try {
      amountToCents(formData.amount);
    } catch {
      setFormError(
        'Informe um valor positivo válido, com até duas casas decimais.',
      );
      return;
    }
    if (!parseDateSafe(formData.transferDate)) {
      setFormError('Informe uma data válida.');
      return;
    }
    setFormError('');
    setFormLoading(true);
    try {
      const response = await window.electronAPI.transfer.create({
        fromAccountId: formData.fromAccountId,
        toAccountId: formData.toAccountId,
        amount: formData.amount,
        description: formData.description || undefined,
        transferDate: parseDateSafe(formData.transferDate)!,
      });
      if (!response.success)
        throw new Error(
          response.error || 'Não foi possível salvar a transferência.',
        );
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
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Não foi possível salvar.',
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    await window.electronAPI.transfer.delete(id);
    loadTransfers();
    loadAccounts();
  };

  return (
    <TransfersContainer>
      <PageHeader
        title="Transferências"
        description={<>Movimente dinheiro entre suas contas</>}
        actions={
          <>
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
          </>
        }
      />
      <BoardFilters board={board} />
      <ContentLoading loading={loading} initial="table">
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
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    color="primary.main"
                  >
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
            {formError && (
              <AppAlert severity="error" sx={{ mb: 2 }}>
                {formError}
              </AppAlert>
            )}
            <Stack spacing={2} mt={1}>
              <SelectInput
                label="Conta de Origem"
                required
                onCreate={() => {
                  setQuick('account');
                  setQuickField('fromAccountId');
                }}
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
                required
                onCreate={() => {
                  setQuick('account');
                  setQuickField('toAccountId');
                }}
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
                required
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
              <DatePicker
                label="Data"
                required
                fullWidth
                value={formData.transferDate}
                onChange={(date) =>
                  setFormData((prev) => ({
                    ...prev,
                    transferDate:
                      date && Number.isFinite(date.getTime())
                        ? format(date, 'yyyy-MM-dd')
                        : '',
                  }))
                }
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsFormOpen(false)}>Cancelar</Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={formLoading}
            >
              {formLoading ? <CircularProgress size={20} /> : 'Transferir'}
            </Button>
          </DialogActions>
        </Dialog>
        <BoardMore board={board} />
      </ContentLoading>
      {quick && (
        <QuickCreate
          kind="account"
          allowedAccountTypes={['checking', 'savings', 'wallet']}
          onClose={() => setQuick(null)}
          onAccount={(account) => {
            setAccounts((rows) => [...rows, account]);
            setFormData((previous) => ({
              ...previous,
              [quickField]: account.id,
            }));
          }}
        />
      )}
    </TransfersContainer>
  );
}
