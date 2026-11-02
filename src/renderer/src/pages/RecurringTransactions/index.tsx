import { AppAlert } from '@renderer/components/Feedback';
import { QuickCreate } from '@renderer/components/QuickCreate';
import {
  useBoardListing,
  BoardFilters,
  BoardMore,
} from '@renderer/components/BoardListing';
import { ContentLoading } from '@renderer/components/ContentLoading';
import { PageHeader } from '@renderer/components/PageHeader';
import { DateStringField } from '@renderer/components/Form/DatePicker/DateStringField';
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
  Switch,
  FormControlLabel,
  Chip,
} from '@mui/material';
import {
  AddOutlined as AddIcon,
  RefreshOutlined as RefreshIcon,
  DeleteOutlined as DeleteIcon,
  EditOutlined as EditIcon,
  PlayArrowOutlined as PlayIcon,
  TrendingUpOutlined as TrendingUp,
  TrendingDownOutlined as TrendingDown,
  CreditCardOutlined as CreditCardIcon,
} from '@mui/icons-material';
import { SelectInput } from '@renderer/components/Form/SelectInput';
import { CurrencyInput } from '@renderer/components/Form/CurrencyInput';
import { formatCurrency } from '@renderer/utils/currency';
import {
  formatDateToShow,
  parseDateSafe,
  formatDateToISO,
} from '@renderer/utils/date';
import { RecurringContainer, RecurringCard, FrequencyBadge } from './styles';
import type {
  RecurringTransaction,
  CreateRecurringTransactionInput,
  UpdateRecurringTransactionInput,
} from '@shared/interfaces/types/recurring.types';
import type { PaymentMethod } from '@shared/interfaces/types/transaction.types';
import type { Category } from '@shared/interfaces/types/category.types';
import type { Account } from '@shared/interfaces/types/account.types';

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Diário',
  weekly: 'Semanal',
  biweekly: 'Quinzenal',
  monthly: 'Mensal',
  yearly: 'Anual',
};

const PAYMENT_METHOD_OPTIONS = [
  { value: 'debit', label: 'Débito em Conta' },
  { value: 'credit', label: 'Cartão de Crédito' },
];

export function RecurringTransactionsPage() {
  const [recurrings, setRecurrings] = useState<RecurringTransaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [quick, setQuick] = useState<'account' | 'category' | null>(null);
  const [quickField, setQuickField] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    description: '',
    amount: 0,
    type: 'expense' as 'income' | 'expense',
    frequency: 'monthly',
    paymentMethod: 'debit' as PaymentMethod,
    accountId: 0,
    creditCardId: 0,
    categoryId: 0,
    startDate: new Date().toISOString().split('T')[0],
    autoConfirm: false,
  });

  // Separate accounts by type
  const regularAccounts = accounts.filter((a) => a.type !== 'credit_card');
  const creditCards = accounts.filter((a) => a.type === 'credit_card');
  const isCreditCard = formData.paymentMethod === 'credit';

  const board = useBoardListing('recurring', setRecurrings);
  const queryFirst = board.first;
  const loadData = useCallback(async () => {
    setLoading(true);
    const [, catRes, accRes] = await Promise.all([
      queryFirst(),
      window.electronAPI.category.findAll(),
      window.electronAPI.account.findAll(),
    ]);
    if (catRes.success && catRes.data) setCategories(catRes.data);
    if (accRes.success && accRes.data) setAccounts(accRes.data);
    setLoading(false);
  }, [queryFirst]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async () => {
    const effectiveAccountId = isCreditCard
      ? formData.creditCardId
      : formData.accountId;

    if (
      !formData.description ||
      !formData.amount ||
      !effectiveAccountId ||
      !formData.categoryId
    )
      return;
    setFormError('');
    setFormLoading(true);
    try {
      if (editingId) {
        const updateData: UpdateRecurringTransactionInput = {
          description: formData.description,
          amount: formData.amount,
          frequency: formData.frequency as any,
          accountId: effectiveAccountId,
          categoryId: formData.categoryId,
          autoConfirm: formData.autoConfirm,
          paymentMethod:
            formData.type === 'expense' ? formData.paymentMethod : undefined,
        };
        const response = await window.electronAPI.recurring.update(
          editingId,
          updateData,
        );
        if (!response.success)
          throw new Error(
            response.error || 'Não foi possível salvar a recorrência.',
          );
      } else {
        const createData: CreateRecurringTransactionInput = {
          description: formData.description,
          amount: formData.amount,
          type: formData.type,
          frequency: formData.frequency as any,
          accountId: effectiveAccountId,
          categoryId: formData.categoryId,
          startDate: parseDateSafe(formData.startDate) ?? new Date(),
          autoConfirm: formData.autoConfirm,
          paymentMethod:
            formData.type === 'expense' ? formData.paymentMethod : undefined,
        };
        const response = await window.electronAPI.recurring.create(createData);
        if (!response.success)
          throw new Error(
            response.error || 'Não foi possível salvar a recorrência.',
          );
      }
      closeForm();
      loadData();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Não foi possível salvar.',
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    await window.electronAPI.recurring.delete(id);
    loadData();
  };

  const handleGenerate = async () => {
    setLoading(true);
    await window.electronAPI.recurring.generate();
    loadData();
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData({
      description: '',
      amount: 0,
      type: 'expense',
      frequency: 'monthly',
      paymentMethod: 'debit',
      accountId: 0,
      creditCardId: 0,
      categoryId: 0,
      startDate: new Date().toISOString().split('T')[0],
      autoConfirm: false,
    });
  };

  const openEdit = (r: RecurringTransaction) => {
    // Check if the account is a credit card
    const account = accounts.find((a) => a.id === r.accountId);
    const isCredit =
      account?.type === 'credit_card' || r.paymentMethod === 'credit';

    setEditingId(r.id);
    setFormData({
      description: r.description,
      amount: r.amount,
      type: r.type,
      frequency: r.frequency,
      paymentMethod: isCredit ? 'credit' : 'debit',
      accountId: isCredit ? 0 : r.accountId,
      creditCardId: isCredit ? r.accountId : 0,
      categoryId: r.categoryId,
      startDate:
        formatDateToISO(r.startDate) ?? new Date().toISOString().split('T')[0],
      autoConfirm: r.autoConfirm,
    });
    setIsFormOpen(true);
  };

  const filteredCategories = categories.filter((c) => c.type === formData.type);

  return (
    <RecurringContainer>
      <PageHeader
        title="Recorrências"
        description={
          <>Configure receitas e despesas que se repetem automaticamente</>
        }
        actions={
          <>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<PlayIcon />}
                onClick={handleGenerate}
              >
                Gerar Pendentes
              </Button>
              <Tooltip title="Atualizar">
                <IconButton onClick={loadData}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setIsFormOpen(true)}
              >
                Nova Recorrência
              </Button>
            </Stack>
          </>
        }
      />
      <BoardFilters
        board={board}
        typeOptions={[
          { id: 'income', label: 'Receita' },
          { id: 'expense', label: 'Despesa' },
        ]}
      />
      <ContentLoading loading={loading} initial="cards">
        {recurrings.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={4}>
            Nenhuma transação recorrente configurada.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {recurrings.map((r) => {
              const account = accounts.find((a) => a.id === r.accountId);
              const isCredit =
                account?.type === 'credit_card' || r.paymentMethod === 'credit';
              return (
                <RecurringCard key={r.id} $type={r.type}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Box flex={1}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        {r.type === 'income' ? (
                          <TrendingUp color="success" />
                        ) : (
                          <TrendingDown color="error" />
                        )}
                        <Typography variant="subtitle1" fontWeight={600}>
                          {r.description}
                        </Typography>
                        <FrequencyBadge>
                          {FREQUENCY_LABELS[r.frequency]}
                        </FrequencyBadge>
                        {isCredit && (
                          <Chip
                            size="small"
                            icon={<CreditCardIcon />}
                            label="Crédito"
                            color="info"
                            variant="outlined"
                          />
                        )}
                        {!r.isActive && (
                          <Chip size="small" label="Inativo" color="default" />
                        )}
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {r.categoryName} • {r.accountName}
                      </Typography>
                    </Box>
                    <Box textAlign="right" mr={2}>
                      <Typography
                        variant="h6"
                        fontWeight={700}
                        color={
                          r.type === 'income' ? 'success.main' : 'error.main'
                        }
                      >
                        {r.type === 'income' ? '+' : '-'}
                        {formatCurrency(r.amount)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Próxima: {formatDateToShow(r.nextOccurrence)}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={0.5}>
                      <IconButton size="small" onClick={() => openEdit(r)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(r.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Stack>
                </RecurringCard>
              );
            })}
          </Stack>
        )}

        <Dialog open={isFormOpen} onClose={closeForm} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingId ? 'Editar' : 'Nova'} Transação Recorrente
          </DialogTitle>
          <DialogContent>
            {formError && (
              <AppAlert severity="error" sx={{ mb: 2 }}>
                {formError}
              </AppAlert>
            )}
            <Stack spacing={2} mt={1}>
              <TextField
                label="Descrição"
                fullWidth
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
              <CurrencyInput
                label="Valor"
                fullWidth
                value={formData.amount}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, amount: value }))
                }
              />
              {!editingId && (
                <SelectInput
                  label="Tipo"
                  value={formData.type}
                  items={[
                    { value: 'expense', label: 'Despesa' },
                    { value: 'income', label: 'Receita' },
                  ]}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      type: e.target.value as any,
                      categoryId: 0,
                    }))
                  }
                  fullWidth
                />
              )}
              <SelectInput
                label="Frequência"
                value={formData.frequency}
                items={Object.entries(FREQUENCY_LABELS).map(([v, l]) => ({
                  value: v,
                  label: l,
                }))}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    frequency: e.target.value as string,
                  }))
                }
                fullWidth
              />
              {formData.type === 'expense' && (
                <SelectInput
                  label="Forma de Pagamento"
                  value={formData.paymentMethod}
                  items={PAYMENT_METHOD_OPTIONS}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      paymentMethod: e.target.value as PaymentMethod,
                      accountId:
                        e.target.value === 'credit' ? 0 : prev.accountId,
                      creditCardId:
                        e.target.value === 'debit' ? 0 : prev.creditCardId,
                    }))
                  }
                  fullWidth
                />
              )}
              {isCreditCard && formData.type === 'expense' ? (
                <SelectInput
                  label="Cartão de Crédito"
                  onCreate={() => {
                    setQuick('account');
                    setQuickField('creditCardId');
                  }}
                  value={formData.creditCardId}
                  items={creditCards.map((c) => ({
                    value: c.id,
                    label: c.name,
                  }))}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      creditCardId: e.target.value as number,
                    }))
                  }
                  fullWidth
                />
              ) : (
                <SelectInput
                  label="Conta"
                  onCreate={() => {
                    setQuick('account');
                    setQuickField('accountId');
                  }}
                  value={formData.accountId}
                  items={regularAccounts.map((a) => ({
                    value: a.id,
                    label: a.name,
                  }))}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      accountId: e.target.value as number,
                    }))
                  }
                  fullWidth
                />
              )}
              <SelectInput
                label="Categoria"
                onCreate={() => {
                  setQuick('category');
                  setQuickField('categoryId');
                }}
                value={formData.categoryId}
                items={filteredCategories.map((c) => ({
                  value: c.id,
                  label: c.name,
                }))}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    categoryId: e.target.value as number,
                  }))
                }
                fullWidth
              />
              {!editingId && (
                <DateStringField
                  label="Data de Início"
                  fullWidth
                  value={formData.startDate}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, startDate: value }))
                  }
                />
              )}
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.autoConfirm}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        autoConfirm: e.target.checked,
                      }))
                    }
                  />
                }
                label="Confirmar automaticamente (atualiza saldo)"
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeForm}>Cancelar</Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={formLoading}
            >
              {formLoading ? <CircularProgress size={20} /> : 'Salvar'}
            </Button>
          </DialogActions>
        </Dialog>
        <BoardMore board={board} />
      </ContentLoading>
      {quick && (
        <QuickCreate
          kind={quick}
          initialAccountType={
            quickField === 'creditCardId' ? 'credit_card' : 'checking'
          }
          type={formData.type}
          onClose={() => setQuick(null)}
          onAccount={(account) => {
            setAccounts((rows) => [...rows, account]);
            setFormData((previous) => ({
              ...previous,
              [quickField]: account.id,
            }));
          }}
          onCategory={(category) => {
            setCategories((rows) => [...rows, category]);
            setFormData((previous) => ({
              ...previous,
              categoryId: category.id,
            }));
          }}
        />
      )}
    </RecurringContainer>
  );
}
