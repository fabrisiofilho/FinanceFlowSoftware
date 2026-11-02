import { QuickCreate } from '../QuickCreate';
import { installmentAmounts } from '@shared/finance/entry-schedule';
import { AppAlert as Alert } from '@renderer/components/Feedback';
import { Input as TextField } from '@renderer/components/Form/Input';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ToggleButton,
  FormControlLabel,
  Switch,
  Typography,
} from '@mui/material';
import {
  TrendingUpOutlined as TrendingUpIcon,
  TrendingDownOutlined as TrendingDownIcon,
} from '@mui/icons-material';
import { FormTextField } from '@renderer/components/Form/FormTextField';
import { FormSelectField } from '@renderer/components/Form/FormSelectField';
import { FormDatePickerField } from '@renderer/components/Form/FormDatePickerField';
import { FormCurrencyField } from '@renderer/components/Form/FormCurrencyField';
import type { SelectInputItem } from '@renderer/components/Form/SelectInput';
import { Modal } from '@renderer/components/Modal';
import { formatCurrency } from '@renderer/utils/currency';
import { parseDateSafe } from '@renderer/utils/date';
import type {
  Transaction,
  TransactionType,
  PaymentMethod,
  ExpenseType,
  Recurrence,
  CreateTransactionInput,
} from '@shared/interfaces/types/transaction.types';
import type { Category } from '@shared/interfaces/types/category.types';
import type { Account } from '@shared/interfaces/types/account.types';
import {
  FormContainer,
  FormSection,
  SectionTitle,
  FormGrid,
  FullWidthField,
  TransactionTypeToggle,
  AdditionalOptionsContainer,
  InstallmentsContainer,
  InstallmentText,
  InstallmentPreview,
  FormDivider,
} from './styles';
interface TransactionFormData {
  type: TransactionType;
  description: string;
  amount: number;
  categoryId: number;
  accountId: number;
  transactionDate: Date;
  dueDate?: Date | null;
  status: 'pending' | 'settled' | 'cancelled';
  settlementDate?: Date | null;
  paymentMethod?: PaymentMethod;
  expenseType?: ExpenseType;
  recurrence: Recurrence;
  hasInstallments: boolean;
  totalInstallments?: number;
}
interface TransactionFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateTransactionInput) => Promise<void>;
  transaction?: Transaction | null;
  categories: Category[];
  accounts: Account[];
  loading?: boolean;
  initialType?: TransactionType;
}
const createValidationSchema = (type: TransactionType) =>
  yup.object().shape({
    type: yup
      .string()
      .oneOf(['income', 'expense'] as const)
      .required('Tipo é obrigatório'),
    description: yup
      .string()
      .trim()
      .required('Descrição é obrigatória')
      .min(3, 'Descrição deve ter no mínimo 3 caracteres')
      .max(100, 'Descrição deve ter no máximo 100 caracteres'),
    amount: yup
      .number()
      .required('Valor é obrigatório')
      .positive('Valor deve ser maior que zero')
      .typeError('Valor inválido'),
    categoryId: yup
      .number()
      .required('Categoria é obrigatória')
      .positive('Selecione uma categoria')
      .typeError('Selecione uma categoria'),
    accountId: yup
      .number()
      .required('Conta é obrigatória')
      .positive('Selecione uma conta')
      .typeError('Selecione uma conta'),
    transactionDate: yup
      .date()
      .required('Data é obrigatória')
      .typeError('Data inválida'),
    status: yup.string().oneOf(['pending', 'settled', 'cancelled']).required(),
    settlementDate: yup
      .date()
      .nullable()
      .when('status', {
        is: 'settled',
        then: (schema) => schema.required('Informe a data de liquidação'),
        otherwise: (schema) => schema.nullable(),
      })
      .typeError('Data de liquidação inválida'),
    dueDate: yup.date().nullable().typeError('Data de vencimento inválida'),
    paymentMethod:
      type === 'expense'
        ? yup
            .string()
            .oneOf(['credit', 'debit', 'pix', 'cash'] as const)
            .required('Forma de pagamento é obrigatória')
        : yup
            .string()
            .oneOf(['credit', 'debit', 'pix', 'cash'] as const)
            .nullable(),
    expenseType:
      type === 'expense'
        ? yup
            .string()
            .oneOf(['fixed', 'variable'] as const)
            .required('Tipo de despesa é obrigatório')
        : yup
            .string()
            .oneOf(['fixed', 'variable'] as const)
            .nullable(),
    recurrence: yup
      .string()
      .oneOf(['once', 'monthly', 'weekly'] as const)
      .required('Recorrência é obrigatória'),
    hasInstallments: yup.boolean(),
    totalInstallments: yup.number().when('hasInstallments', {
      is: true,
      then: (schema) =>
        schema
          .required('Número de parcelas é obrigatório')
          .min(2, 'Mínimo de 2 parcelas')
          .max(48, 'Máximo de 48 parcelas')
          .integer('Número de parcelas deve ser inteiro'),
      otherwise: (schema) => schema.nullable(),
    }),
  });
const paymentMethodOptions: SelectInputItem[] = [
  { value: 'credit', label: 'Crédito' },
  { value: 'debit', label: 'Débito' },
  { value: 'pix', label: 'PIX' },
  { value: 'cash', label: 'Dinheiro' },
];
const expenseTypeOptions: SelectInputItem[] = [
  { value: 'fixed', label: 'Fixa' },
  { value: 'variable', label: 'Variável' },
];
const recurrenceOptions: SelectInputItem[] = [
  { value: 'once', label: 'Única' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'weekly', label: 'Semanal' },
];

export function TransactionForm({
  open,
  onClose,
  onSave,
  transaction,
  categories,
  accounts,
  loading = false,
  initialType = 'expense',
}: Readonly<TransactionFormProps>) {
  const [moreOptions, setMoreOptions] = useState(false);
  const [quick, setQuick] = useState<'account' | 'category' | null>(null);
  const [createdAccounts, setCreatedAccounts] = useState<Account[]>([]);
  const [createdCategories, setCreatedCategories] = useState<Category[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [transactionType, setTransactionType] = useState<TransactionType>(
    transaction?.type ?? initialType,
  );
  const defaultValues: TransactionFormData = useMemo(
    () => ({
      type: transaction?.type ?? initialType,
      description: transaction?.description ?? '',
      amount: transaction?.amount ?? 0,
      categoryId: transaction?.categoryId ?? 0,
      accountId: transaction?.accountId ?? 0,
      transactionDate: transaction?.transactionDate
        ? (parseDateSafe(transaction.transactionDate) ?? new Date())
        : new Date(),
      status: transaction?.status ?? 'settled',
      settlementDate: transaction?.settlementDate
        ? parseDateSafe(transaction.settlementDate)
        : new Date(),
      dueDate: transaction?.dueDate ? parseDateSafe(transaction.dueDate) : null,
      paymentMethod: transaction?.paymentMethod ?? 'debit',
      expenseType: transaction?.expenseType ?? 'variable',
      recurrence: transaction?.recurrence ?? 'once',
      hasInstallments: (transaction?.totalInstallments ?? 0) > 1,
      totalInstallments: transaction?.totalInstallments ?? 2,
    }),
    [transaction, initialType],
  );
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { isSubmitting, isDirty },
  } = useForm<TransactionFormData>({
    defaultValues,
    resolver: yupResolver(createValidationSchema(transactionType)) as any,
    mode: 'onChange',
  });
  const watchStatus = watch('status');
  const watchType = watch('type');
  const watchAmount = watch('amount');
  const watchHasInstallments = watch('hasInstallments');
  const watchTotalInstallments = watch('totalInstallments');
  const watchRecurrence = watch('recurrence');
  const watchPaymentMethod = watch('paymentMethod');
  useEffect(() => {
    setTransactionType(watchType);
  }, [watchType]);
  useEffect(() => {
    if (open) {
      reset(defaultValues);
      setTransactionType(defaultValues.type);
      setSubmitError(null);
    }
  }, [open, defaultValues, reset]);
  const filteredCategories = useMemo(() => {
    return [
      ...categories,
      ...createdCategories.filter(
        (c) => !categories.some((existing) => existing.id === c.id),
      ),
    ].filter((cat) => cat.type === transactionType);
  }, [categories, createdCategories, transactionType]);
  const categoryOptions: SelectInputItem[] = useMemo(
    () => [
      { value: 0, label: 'Selecione uma categoria' },
      ...filteredCategories.map((cat) => ({
        value: cat.id,
        label: cat.name,
      })),
    ],
    [filteredCategories],
  );
  const accountOptions: SelectInputItem[] = useMemo(
    () => [
      { value: 0, label: 'Selecione uma conta' },
      ...[
        ...accounts,
        ...createdAccounts.filter(
          (a) => !accounts.some((existing) => existing.id === a.id),
        ),
      ].map((acc) => ({
        value: acc.id,
        label: acc.name,
      })),
    ],
    [accounts, createdAccounts],
  );
  const installments = useMemo(() => {
    if (
      !watchHasInstallments ||
      !watchTotalInstallments ||
      watchTotalInstallments < 2
    )
      return [];
    try {
      return installmentAmounts(watchAmount, watchTotalInstallments);
    } catch {
      return [];
    }
  }, [watchAmount, watchHasInstallments, watchTotalInstallments]);
  const canHaveInstallments = useMemo(() => {
    return (
      transactionType === 'expense' &&
      watchRecurrence === 'once' &&
      watchPaymentMethod === 'credit'
    );
  }, [transactionType, watchRecurrence, watchPaymentMethod]);
  useEffect(() => {
    if (!canHaveInstallments && watchHasInstallments) {
      setValue('hasInstallments', false);
    }
  }, [canHaveInstallments, watchHasInstallments, setValue]);
  const handleTypeChange = useCallback(
    (_: React.MouseEvent<HTMLElement>, newType: TransactionType | null) => {
      if (newType) {
        setValue('type', newType);
        setTransactionType(newType);
        setValue('categoryId', 0);
        if (newType === 'income') {
          setValue('paymentMethod', undefined);
          setValue('expenseType', undefined);
          setValue('hasInstallments', false);
        } else {
          setValue('paymentMethod', 'debit');
          setValue('expenseType', 'variable');
        }
      }
    },
    [setValue],
  );
  const onSubmit = async (data: TransactionFormData) => {
    setSubmitError(null);
    try {
      const transactionData: CreateTransactionInput = {
        description: data.description.trim(),
        amount: data.amount,
        type: data.type,
        categoryId: data.categoryId,
        accountId: data.accountId,
        transactionDate: data.transactionDate,
        dueDate: data.dueDate ?? undefined,
        status: data.status,
        settlementDate: data.status === 'settled' ? data.settlementDate : null,
        recurrence: data.recurrence,
      };
      if (data.type === 'expense') {
        transactionData.paymentMethod = data.paymentMethod;
        transactionData.expenseType = data.expenseType;
        if (
          data.hasInstallments &&
          data.totalInstallments &&
          data.totalInstallments > 1
        ) {
          transactionData.totalInstallments = data.totalInstallments;
        }
      }
      await onSave(transactionData);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Erro ao salvar transação. Tente novamente.',
      );
    }
  };
  const modalTitle = transaction
    ? 'Editar Transação'
    : transactionType === 'income'
      ? 'Nova Receita'
      : 'Nova Despesa';
  return (
    <>
      <Modal
        variant="form"
        open={open}
        title={modalTitle}
        handleClose={() => { if (!loading && !isSubmitting && (!isDirty || window.confirm('Descartar as alterações não salvas?'))) onClose(); }}
        handleConfirm={handleSubmit(onSubmit)}
        confirmLabel="Salvar"
        cancelLabel="Cancelar"
        loading={loading || isSubmitting}
        confirmDisabled={loading || isSubmitting}
        setMaxWidth="600px"
        width="100%"
      >
        <FormContainer data-tour="transaction-form">
          {}
          {submitError && (
            <Alert severity="error" onClose={() => setSubmitError(null)}>
              {submitError}
            </Alert>
          )}
          {}
          <FormSection>
            <SectionTitle>Tipo de Transação</SectionTitle>
            <TransactionTypeToggle
              value={watchType}
              exclusive
              onChange={handleTypeChange}
              aria-label="tipo de transação"
            >
              <ToggleButton value="income" aria-label="receita">
                <TrendingUpIcon sx={{ mr: 0.5 }} />
                Receita
              </ToggleButton>
              <ToggleButton value="expense" aria-label="despesa">
                <TrendingDownIcon sx={{ mr: 0.5 }} />
                Despesa
              </ToggleButton>
            </TransactionTypeToggle>
          </FormSection>
          <FormDivider />
          {}
          <FormSection>
            <SectionTitle>Informações Básicas</SectionTitle>
            <FormGrid>
              {}
              <FullWidthField>
                <FormTextField
                  control={control}
                  name="description"
                  label="Descrição"
                  placeholder="Ex: Salário, Aluguel, Supermercado..."
                  required
                  fullWidth
                />
              </FullWidthField>
              {}
              <FormCurrencyField
                control={control}
                name="amount"
                label="Valor"
                required
                fullWidth
              />
              {}
              <FormSelectField
                control={control}
                name="categoryId"
                label="Categoria"
                items={categoryOptions}
                onCreate={() => setQuick('category')}
                createLabel="Cadastrar categoria"
                required
                fullWidth
              />
              {}
              <FormSelectField
                control={control}
                name="accountId"
                label="Conta"
                items={accountOptions}
                onCreate={() => setQuick('account')}
                createLabel="Cadastrar conta"
                required
                fullWidth
              />
              {}
              <FormDatePickerField
                control={control}
                name="transactionDate"
                label="Data de competência"
                required
                fullWidth
              />
              {}
              <FormSelectField
                control={control}
                name="status"
                label="Situação"
                items={[
                  { value: 'pending', label: 'Pendente' },
                  { value: 'settled', label: 'Liquidado' },
                  { value: 'cancelled', label: 'Cancelado' },
                ]}
                fullWidth
              />
              {watchStatus === 'settled' && (
                <FormDatePickerField
                  control={control}
                  name="settlementDate"
                  label="Pago / recebido em"
                  required
                  fullWidth
                />
              )}
              {transactionType === 'expense' && (
                <FormDatePickerField
                  control={control}
                  name="dueDate"
                  label="Data de Vencimento"
                  fullWidth
                />
              )}
            </FormGrid>
          </FormSection>
          {}
          <Accordion expanded={moreOptions} onChange={(_,expanded) => setMoreOptions(expanded)}><AccordionSummary>Mais opções</AccordionSummary><AccordionDetails>
          {transactionType === 'expense' && (
            <>
              <FormDivider />
              <FormSection>
                <SectionTitle>Detalhes da Despesa</SectionTitle>
                <FormGrid>
                  {}
                  <FormSelectField
                    control={control}
                    name="paymentMethod"
                    label="Forma de Pagamento"
                    items={paymentMethodOptions}
                    required
                    fullWidth
                  />
                  {}
                  <FormSelectField
                    control={control}
                    name="expenseType"
                    label="Tipo de Despesa"
                    items={expenseTypeOptions}
                    required
                    fullWidth
                  />
                </FormGrid>
              </FormSection>
            </>
          )}
          <FormDivider />
          {}
          <FormSection>
            <SectionTitle>Recorrência</SectionTitle>
            <FormGrid>
              <FormSelectField
                control={control}
                name="recurrence"
                label="Frequência"
                items={recurrenceOptions}
                required
                fullWidth
              />
            </FormGrid>
            {watchRecurrence !== 'once' && (
              <Alert severity="info" sx={{ mt: 1 }}>
                {watchRecurrence === 'monthly'
                  ? 'Esta transação será repetida mensalmente nos próximos 12 meses.'
                  : 'Esta transação será repetida semanalmente nas próximas 12 semanas.'}
              </Alert>
            )}
          </FormSection>
          {}
          {transactionType === 'expense' && (
            <>
              <FormDivider />
              <FormSection>
                <SectionTitle>Parcelamento</SectionTitle>
                <AdditionalOptionsContainer>
                  <Controller
                    control={control}
                    name="hasInstallments"
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Switch
                            {...field}
                            checked={field.value}
                            disabled={!canHaveInstallments}
                          />
                        }
                        label="Parcelar"
                      />
                    )}
                  />
                  {watchHasInstallments && canHaveInstallments && (
                    <InstallmentsContainer>
                      <InstallmentText>em</InstallmentText>
                      <Controller
                        control={control}
                        name="totalInstallments"
                        render={({ field, fieldState: { error } }) => (
                          <TextField
                            {...field}
                            type="number"
                            size="small"
                            sx={{ width: 80 }}
                            inputProps={{ min: 2, max: 48 }}
                            error={!!error}
                            helperText={error?.message}
                          />
                        )}
                      />
                      <InstallmentText>vezes</InstallmentText>
                      {installments.length > 0 && (
                        <InstallmentPreview>
                          {formatCurrency(installments[0])} / parcela
                          {installments.at(-1) !== installments[0] &&
                            ' · última: ' +
                              formatCurrency(installments.at(-1)!)}
                        </InstallmentPreview>
                      )}
                    </InstallmentsContainer>
                  )}
                </AdditionalOptionsContainer>
                {!canHaveInstallments && transactionType === 'expense' && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    Parcelamento disponível apenas para despesas únicas no
                    cartão de crédito.
                  </Typography>
                )}
              </FormSection>
            </>
          )}
          </AccordionDetails></Accordion>
        </FormContainer>
      </Modal>
      {quick && (
        <QuickCreate
          kind={quick}
          type={transactionType}
          onClose={() => setQuick(null)}
          onAccount={(account) => {
            setCreatedAccounts((current) => [...current, account]);
            setValue('accountId', account.id, { shouldValidate: true });
          }}
          onCategory={(category) => {
            setCreatedCategories((current) => [...current, category]);
            setValue('categoryId', category.id, { shouldValidate: true });
          }}
        />
      )}
    </>
  );
}
export default TransactionForm;
