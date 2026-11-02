import {
  useBoardListing,
  BoardFilters,
  BoardMore,
} from '@renderer/components/BoardListing';
import { ContentLoading } from '@renderer/components/ContentLoading';
import { PageHeader } from '@renderer/components/PageHeader';
import { AppAlert } from '@renderer/components/Feedback';
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
  MenuItem,
} from '@mui/material';
import {
  AddOutlined as AddIcon,
  AccountBalanceWalletOutlined as WalletIcon,
  RefreshOutlined as RefreshIcon,
  CalculateOutlined as CalculateIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { Modal } from '@renderer/components/Modal';
import { AccountCard } from '@renderer/components/AccountCard';
import { FormCurrencyField } from '@renderer/components/Form/FormCurrencyField';
import {
  AccountsContainer,
  AccountsGrid,
  EmptyStateContainer,
  FormContainer,
  FormRow,
  TotalBalanceCard,
  TotalBalanceIcon,
  TotalBalanceContent,
  TotalBalanceValue,
  TotalBalanceLabel,
} from './styles';
import type {
  Account,
  AccountType,
  CardBrand,
  CreateAccountInput,
  UpdateAccountInput,
} from '@shared/interfaces/types/account.types';
import {
  CARD_BRAND_LABELS,
  BANK_OPTIONS,
  CARD_COLOR_OPTIONS,
} from '@shared/interfaces/types/account.types';
import { formatCurrency } from '@renderer/utils/currency';
const accountTypeOptions = [
  { value: 'checking', label: 'Conta Corrente' },
  { value: 'savings', label: 'Poupança' },
  { value: 'credit_card', label: 'Cartão de Crédito' },
  { value: 'wallet', label: 'Carteira' },
];
interface AccountFormData {
  name: string;
  type: AccountType;
  balance: number;
  creditLimit?: number;
  closingDay?: number;
  dueDay?: number;
  cardColor?: string;
  imageData?: string | null;
  cardBrand?: CardBrand;
  bankName?: string;
}
export function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [recalculateLoading, setRecalculateLoading] = useState(false);
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AccountFormData>({
    defaultValues: {
      name: '',
      type: 'checking',
      balance: 0,
      creditLimit: undefined,
      closingDay: undefined,
      dueDay: undefined,
      cardColor: '#1a1a2e',
      cardBrand: undefined,
      bankName: undefined,
      imageData: null,
    },
  });
  const watchedType = watch('type');
  const isCreditCard = watchedType === 'credit_card';
  const board = useBoardListing('accounts', setAccounts);
  const queryFirst = board.first;
  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [accountsResponse, totalBalanceResponse] = await Promise.all([
        queryFirst(),
        window.electronAPI.account.getTotalBalance(),
      ]);
      if (
        !accountsResponse.success &&
        accountsResponse.error !== 'Consulta substituída'
      ) {
        setError('Erro ao carregar contas');
      }
      if (totalBalanceResponse.success) {
        setTotalBalance(totalBalanceResponse.data ?? 0);
      }
    } catch (err) {
      console.error('Erro ao carregar contas:', err);
      setError('Erro ao carregar contas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [queryFirst]);
  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);
  const handleNewAccount = () => {
    setSelectedAccount(null);
    reset({
      name: '',
      type: 'checking',
      balance: 0,
      creditLimit: undefined,
      closingDay: undefined,
      dueDay: undefined,
      cardColor: '#1a1a2e',
      cardBrand: undefined,
      bankName: undefined,
      imageData: null,
    });
    setIsFormOpen(true);
  };
  const handleEditAccount = (account: Account) => {
    setSelectedAccount(account);
    reset({
      name: account.name,
      type: account.type,
      balance: account.balance,
      creditLimit: account.creditLimit,
      closingDay: account.closingDay,
      dueDay: account.dueDay,
      cardColor: account.cardColor || '#1a1a2e',
      cardBrand: account.cardBrand,
      bankName: account.bankName,
      imageData: account.imageData,
    });
    setIsFormOpen(true);
  };
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedAccount(null);
    reset();
  };
  const handleSaveAccount = async (data: AccountFormData) => {
    setFormLoading(true);
    try {
      if (selectedAccount) {
        const updateData: UpdateAccountInput = {
          name: data.name,
          imageData: data.imageData,
          dueDay: data.dueDay,
          cardColor: data.cardColor,
        };
        if (data.type === 'credit_card') {
          updateData.creditLimit = data.creditLimit;
          updateData.closingDay = data.closingDay;
          updateData.cardColor = data.cardColor;
          updateData.cardBrand = data.cardBrand;
          updateData.bankName = data.bankName;
        }
        const response = await window.electronAPI.account.update(
          selectedAccount.id,
          updateData,
        );
        if (!response.success) {
          throw new Error(response.error ?? 'Erro ao atualizar conta');
        }
      } else {
        const createData: CreateAccountInput = {
          name: data.name,
          type: data.type,
          balance: data.balance,
          imageData: data.imageData,
          cardColor: data.cardColor,
          dueDay: data.dueDay,
        };
        if (data.type === 'credit_card') {
          createData.creditLimit = data.creditLimit;
          createData.closingDay = data.closingDay;
          createData.cardColor = data.cardColor;
          createData.cardBrand = data.cardBrand;
          createData.bankName = data.bankName;
        }
        const response = await window.electronAPI.account.create(createData);
        if (!response.success) {
          throw new Error(response.error ?? 'Erro ao criar conta');
        }
      }
      handleCloseForm();
      loadAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar conta.');
    } finally {
      setFormLoading(false);
    }
  };
  const handleDeleteAccount = (account: Account) => {
    setAccountToDelete(account);
    setIsDeleteModalOpen(true);
  };
  const handleConfirmDelete = async () => {
    if (!accountToDelete) return;
    setDeleteLoading(true);
    try {
      const response = await window.electronAPI.account.delete(
        accountToDelete.id,
      );
      if (response.success) {
        setIsDeleteModalOpen(false);
        setAccountToDelete(null);
        loadAccounts();
      } else {
        console.error('Erro ao excluir conta:', response.error);
      }
    } catch (err) {
      console.error('Erro ao excluir conta:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleRecalculateBalances = async () => {
    setRecalculateLoading(true);
    try {
      const response =
        await window.electronAPI.account.recalculateAllBalances();
      if (response.success) {
        loadAccounts();
      } else {
        console.error('Erro ao recalcular saldos:', response.error);
      }
    } catch (err) {
      console.error('Erro ao recalcular saldos:', err);
    } finally {
      setRecalculateLoading(false);
    }
  };

  return (
    <AccountsContainer>
      <PageHeader
        title="Contas"
        description={<>Gerencie suas contas financeiras</>}
        actions={
          <>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Recalcular saldos baseado nas transações">
                <IconButton
                  onClick={handleRecalculateBalances}
                  size="small"
                  disabled={recalculateLoading}
                >
                  {recalculateLoading ? (
                    <CircularProgress size={20} />
                  ) : (
                    <CalculateIcon />
                  )}
                </IconButton>
              </Tooltip>
              <Tooltip title="Atualizar">
                <IconButton onClick={loadAccounts} size="small">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleNewAccount}
                data-tour="account-create"
                sx={{ borderRadius: '0.5rem' }}
              >
                Nova Conta
              </Button>
            </Stack>
          </>
        }
      />
      <BoardFilters
        board={board}
        typeOptions={[
          { id: 'checking', label: 'Conta corrente' },
          { id: 'savings', label: 'Poupança' },
          { id: 'wallet', label: 'Carteira' },
          { id: 'credit_card', label: 'Cartão de crédito' },
        ]}
      />
      <ContentLoading loading={loading} initial="cards">
        {error && (
          <AppAlert severity="error" sx={{ mb: 3 }}>
            {error}
          </AppAlert>
        )}

        <TotalBalanceCard>
          <TotalBalanceIcon>
            <WalletIcon />
          </TotalBalanceIcon>
          <TotalBalanceContent>
            <TotalBalanceLabel>Saldo Total</TotalBalanceLabel>
            <TotalBalanceValue $negative={totalBalance < 0}>
              {formatCurrency(totalBalance)}
            </TotalBalanceValue>
          </TotalBalanceContent>
        </TotalBalanceCard>

        {accounts.length > 0 ? (
          <AccountsGrid>
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onEdit={handleEditAccount}
                onDelete={handleDeleteAccount}
              />
            ))}
          </AccountsGrid>
        ) : (
          <EmptyStateContainer>
            <WalletIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Nenhuma conta cadastrada
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Clique em "Nova Conta" para adicionar sua primeira conta
              financeira
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleNewAccount}
            >
              Nova Conta
            </Button>
          </EmptyStateContainer>
        )}

        <Modal
          variant="form"
          open={isFormOpen}
          title={selectedAccount ? 'Editar Conta' : 'Nova Conta'}
          handleClose={handleCloseForm}
          handleConfirm={handleSubmit(handleSaveAccount)}
          confirmLabel="Salvar"
          cancelLabel="Cancelar"
          loading={formLoading}
          setMaxWidth="500px"
        >
          <FormContainer data-tour="account-form">
            {error && <AppAlert severity="error">{error}</AppAlert>}
            <Controller
              name="name"
              control={control}
              rules={{
                required: 'Nome é obrigatório',
                validate: (value) =>
                  Boolean(value.trim()) || 'Nome é obrigatório',
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Nome da Conta"
                  placeholder="Ex: Nubank, Itaú, Carteira"
                  fullWidth
                  required
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              )}
            />

            <Controller
              name="type"
              control={control}
              rules={{ required: 'Tipo é obrigatório' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Tipo de Conta"
                  fullWidth
                  required
                  disabled={!!selectedAccount}
                  error={!!errors.type}
                  helperText={
                    errors.type?.message ||
                    (selectedAccount ? 'O tipo não pode ser alterado' : '')
                  }
                >
                  {accountTypeOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            {!selectedAccount && (
              <FormCurrencyField
                name="balance"
                control={control}
                label="Saldo Inicial"
                fullWidth
                required
                rules={{
                  required: 'Saldo inicial é obrigatório',
                }}
              />
            )}

            {isCreditCard && (
              <FormRow>
                <FormCurrencyField
                  name="creditLimit"
                  control={control}
                  label="Limite de Crédito"
                  fullWidth
                  required={isCreditCard}
                  rules={{
                    required: isCreditCard
                      ? 'Limite é obrigatório para cartão de crédito'
                      : false,
                    validate: (value: number) =>
                      !isCreditCard ||
                      value > 0 ||
                      'Limite deve ser maior que zero',
                  }}
                />

                <Controller
                  name="closingDay"
                  control={control}
                  rules={{
                    required: isCreditCard
                      ? 'Dia de fechamento é obrigatório'
                      : false,
                    min: { value: 1, message: 'Dia deve ser entre 1 e 31' },
                    max: { value: 31, message: 'Dia deve ser entre 1 e 31' },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Dia de Fechamento"
                      type="number"
                      fullWidth
                      required={isCreditCard}
                      error={!!errors.closingDay}
                      helperText={errors.closingDay?.message || 'Dia 1 a 31'}
                      slotProps={{
                        input: {
                          inputProps: { min: 1, max: 31 },
                        },
                      }}
                    />
                  )}
                />
              </FormRow>
            )}
            {isCreditCard && (
              <FormRow>
                <Controller
                  name="cardBrand"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label="Bandeira"
                      fullWidth
                      value={field.value || ''}
                    >
                      <MenuItem value="">Selecione...</MenuItem>
                      {Object.entries(CARD_BRAND_LABELS).map(
                        ([value, label]) => (
                          <MenuItem key={value} value={value}>
                            {label}
                          </MenuItem>
                        ),
                      )}
                    </TextField>
                  )}
                />
                <Controller
                  name="bankName"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label="Banco"
                      fullWidth
                      value={field.value || ''}
                    >
                      <MenuItem value="">Selecione...</MenuItem>
                      {BANK_OPTIONS.map((bank) => (
                        <MenuItem key={bank} value={bank}>
                          {bank}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </FormRow>
            )}
            {isCreditCard && (
              <Controller
                name="dueDay"
                control={control}
                rules={{
                  required: 'Informe o dia de vencimento',
                  min: { value: 1, message: 'Dia entre 1 e 31' },
                  max: { value: 31, message: 'Dia entre 1 e 31' },
                }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    onChange={(event) =>
                      field.onChange(Number(event.target.value))
                    }
                    label="Dia de vencimento da fatura"
                    type="number"
                    error={!!fieldState.error}
                    helperText={
                      fieldState.error?.message ||
                      'Se for anterior ou igual ao fechamento, vence no mês seguinte. Em meses curtos, usa o último dia.'
                    }
                    required
                    fullWidth
                  />
                )}
              />
            )}
            {
              <Controller
                name="cardColor"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Cor de identificação"
                    fullWidth
                    value={field.value || '#1a1a2e'}
                    SelectProps={{
                      renderValue: (selected) => {
                        const option = CARD_COLOR_OPTIONS.find(
                          (opt) => opt.value === selected,
                        );
                        return (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <Box
                              sx={{
                                width: 20,
                                height: 20,
                                borderRadius: '4px',
                                backgroundColor: selected as string,
                                border: '1px solid rgba(0,0,0,0.2)',
                              }}
                            />
                            {option?.label || 'Selecione...'}
                          </Box>
                        );
                      },
                    }}
                  >
                    {CARD_COLOR_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <Box
                            sx={{
                              width: 20,
                              height: 20,
                              borderRadius: '4px',
                              backgroundColor: option.value,
                              border: '1px solid rgba(0,0,0,0.2)',
                            }}
                          />
                          {option.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            }
            <Stack direction="row" spacing={2} alignItems="center">
              <Button component="label">
                Selecionar logo / imagem
                <input
                  hidden
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    if (file.size > 512000) {
                      setError('Use uma imagem de até 500 KB.');
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () =>
                      setValue('imageData', String(reader.result));
                    reader.readAsDataURL(file);
                  }}
                />
              </Button>
              {watch('imageData') && (
                <>
                  <Box
                    component="img"
                    alt="Logo da conta"
                    src={watch('imageData') || ''}
                    sx={{ width: 48, height: 48, objectFit: 'contain' }}
                  />
                  <Button onClick={() => setValue('imageData', null)}>
                    Remover
                  </Button>
                </>
              )}
            </Stack>
          </FormContainer>
        </Modal>

        <Modal
          variant="danger"
          open={isDeleteModalOpen}
          title="Excluir Conta"
          handleClose={() => {
            setIsDeleteModalOpen(false);
            setAccountToDelete(null);
          }}
          handleConfirm={handleConfirmDelete}
          confirmLabel="Excluir"
          cancelLabel="Cancelar"
          loading={deleteLoading}
        >
          <Typography>
            Tem certeza que deseja excluir a conta{' '}
            <strong>{accountToDelete?.name}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esta ação não pode ser desfeita. Todas as transações vinculadas a
            esta conta também serão afetadas.
          </Typography>
        </Modal>
        <BoardMore board={board} />
      </ContentLoading>
    </AccountsContainer>
  );
}
