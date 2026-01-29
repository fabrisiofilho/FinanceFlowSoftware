import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
  Stack,
  TextField,
  MenuItem,
} from '@mui/material';
import {
  CreditCard as CreditCardIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { Modal } from '@renderer/components/Modal';
import { FormCurrencyField } from '@renderer/components/Form/FormCurrencyField';
import { InvoiceDetails } from '@renderer/components/InvoiceDetails';
import { formatDateToShow } from '@renderer/utils/date';
import {
  CreditCardsContainer,
  PageHeaderContainer,
  CreditCardsGrid,
  CreditCardCard,
  CardHeader,
  CardIcon,
  CardInfo,
  CardName,
  CardSubtitle,
  LimitSection,
  LimitProgressBar,
  LimitValues,
  LimitValueItem,
  LimitLabel,
  LimitValue,
  InvoiceSection,
  EmptyStateContainer,
  LimitAlertIndicator,
  PaymentFormContainer,
  CardBrandBadge,
  BankBadge,
} from './styles';
import type {
  CreditCardSummary,
  CreditCardInvoice,
  PayInvoiceInput,
} from '@shared/interfaces/types/credit-card.types';
import type { Account } from '@shared/interfaces/types/account.types';
import { CARD_BRAND_LABELS } from '@shared/interfaces/types/account.types';
import { formatCurrency } from '@renderer/utils/currency';

const formatMonthYear = (month: number, year: number): string => {
  const months = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  return `${months[month - 1]} ${year}`;
};
interface PaymentFormData {
  paymentAccountId: number;
  amount?: number;
}
export function CreditCardsPage() {
  const [creditCards, setCreditCards] = useState<CreditCardSummary[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] =
    useState<CreditCardInvoice | null>(null);
  const [selectedCardName, setSelectedCardName] = useState<string>('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PaymentFormData>({
    defaultValues: {
      paymentAccountId: 0,
      amount: undefined,
    },
  });
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [creditCardsResponse, accountsResponse] = await Promise.all([
        window.electronAPI.creditCard.getCreditCardsSummary(),
        window.electronAPI.account.findAll(),
      ]);
      if (creditCardsResponse.success && creditCardsResponse.data) {
        setCreditCards(creditCardsResponse.data);
      } else {
        setError('Erro ao carregar cartões de crédito');
      }
      if (accountsResponse.success && accountsResponse.data) {
        const paymentAccounts = accountsResponse.data.filter(
          (account) => account.type !== 'credit_card',
        );
        setAccounts(paymentAccounts);
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    loadData();
  }, [loadData]);
  const handleOpenPaymentModal = (
    invoice: CreditCardInvoice,
    cardName: string,
  ) => {
    setSelectedInvoice(invoice);
    setSelectedCardName(cardName);
    reset({
      paymentAccountId: accounts.length > 0 ? accounts[0].id : 0,
      amount: invoice.totalAmount,
    });
    setIsPaymentModalOpen(true);
  };
  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setSelectedInvoice(null);
    setSelectedCardName('');
    reset();
  };
  const handlePayInvoice = async (data: PaymentFormData) => {
    if (!selectedInvoice) return;
    setPaymentLoading(true);
    try {
      const paymentInput: PayInvoiceInput = {
        invoiceId: selectedInvoice.id,
        paymentAccountId: data.paymentAccountId,
        amount: data.amount,
      };
      const response =
        await window.electronAPI.creditCard.payInvoice(paymentInput);
      if (response.success) {
        handleClosePaymentModal();
        loadData();
      } else {
        console.error('Erro ao pagar fatura:', response.error);
      }
    } catch (err) {
      console.error('Erro ao pagar fatura:', err);
    } finally {
      setPaymentLoading(false);
    }
  };
  if (loading && creditCards.length === 0) {
    return (
      <CreditCardsContainer>
        <Stack alignItems="center" justifyContent="center" minHeight="60vh">
          <CircularProgress size={48} />
          <Typography variant="body1" color="text.secondary" mt={2}>
            Carregando cartões de crédito...
          </Typography>
        </Stack>
      </CreditCardsContainer>
    );
  }
  if (error && creditCards.length === 0) {
    return (
      <CreditCardsContainer>
        <Stack alignItems="center" justifyContent="center" minHeight="60vh">
          <WarningIcon sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
          <Typography variant="h6" color="error">
            {error}
          </Typography>
          <IconButton onClick={loadData} sx={{ mt: 2 }}>
            <RefreshIcon />
          </IconButton>
        </Stack>
      </CreditCardsContainer>
    );
  }
  return (
    <CreditCardsContainer>
      {}
      <PageHeaderContainer>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Cartões de Crédito
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie seus cartões e faturas
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Atualizar">
            <IconButton onClick={loadData} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </PageHeaderContainer>
      {}
      {creditCards.length > 0 ? (
        <CreditCardsGrid>
          {creditCards.map((card) => {
            const currentInvoice = card.currentInvoice;
            const nextDueInvoice = card.nextDueInvoice;
            const displayInvoice = nextDueInvoice || currentInvoice;
            const isOverLimit = card.usedPercentage >= 80;
            return (
              <CreditCardCard key={card.accountId} $cardColor={card.cardColor}>
                {}
                <CardHeader>
                  <Stack direction="row" alignItems="center">
                    <CardIcon style={{ backgroundColor: card.cardColor ? `${card.cardColor}20` : undefined }}>
                      <CreditCardIcon style={{ color: card.cardColor || undefined }} />
                    </CardIcon>
                    <CardInfo>
                      <CardName>{card.accountName}</CardName>
                      <Stack direction="row" alignItems="center" spacing={0.5} mt={0.5}>
                        <CardSubtitle>
                          Fechamento dia {card.closingDay}
                        </CardSubtitle>
                        {card.cardBrand && (
                          <CardBrandBadge $color={card.cardColor}>
                            {CARD_BRAND_LABELS[card.cardBrand]}
                          </CardBrandBadge>
                        )}
                        {card.bankName && (
                          <BankBadge>{card.bankName}</BankBadge>
                        )}
                      </Stack>
                    </CardInfo>
                  </Stack>
                </CardHeader>
                {}
                <LimitSection>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color="text.secondary"
                    >
                      Limite Utilizado
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {card.usedPercentage.toFixed(0)}%
                    </Typography>
                  </Stack>
                  <LimitProgressBar
                    variant="determinate"
                    value={Math.min(card.usedPercentage, 100)}
                    $percentage={card.usedPercentage}
                  />
                  <LimitValues>
                    <LimitValueItem $variant="used">
                      <LimitLabel>Usado</LimitLabel>
                      <LimitValue $variant="used">
                        {formatCurrency(card.usedLimit)}
                      </LimitValue>
                    </LimitValueItem>
                    <LimitValueItem $variant="available">
                      <LimitLabel>Disponível</LimitLabel>
                      <LimitValue $variant="available">
                        {formatCurrency(card.availableLimit)}
                      </LimitValue>
                    </LimitValueItem>
                  </LimitValues>
                  <Stack direction="row" justifyContent="center" mt={1}>
                    <LimitValueItem $variant="total">
                      <LimitLabel>Limite Total</LimitLabel>
                      <LimitValue $variant="total">
                        {formatCurrency(card.creditLimit)}
                      </LimitValue>
                    </LimitValueItem>
                  </Stack>
                  {}
                  {isOverLimit && (
                    <LimitAlertIndicator>
                      <WarningIcon fontSize="small" />
                      {card.usedPercentage >= 100
                        ? 'Limite excedido!'
                        : 'Atenção: próximo do limite'}
                    </LimitAlertIndicator>
                  )}
                </LimitSection>
                {}
                {displayInvoice && (
                  <InvoiceSection>
                    <InvoiceDetails
                      invoice={displayInvoice}
                      onPayInvoice={(invoice) =>
                        handleOpenPaymentModal(invoice, card.accountName)
                      }
                      showPayButton={true}
                      showTransactions={true}
                      defaultExpanded={false}
                      variant="full"
                    />
                  </InvoiceSection>
                )}
              </CreditCardCard>
            );
          })}
        </CreditCardsGrid>
      ) : (
        <EmptyStateContainer>
          <CreditCardIcon
            sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }}
          />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Nenhum cartão de crédito cadastrado
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Cadastre um cartão de crédito na página de Contas para visualizar
            aqui
          </Typography>
        </EmptyStateContainer>
      )}
      {}
      <Modal
        variant="form"
        open={isPaymentModalOpen}
        title={`Pagar Fatura - ${selectedCardName}`}
        handleClose={handleClosePaymentModal}
        handleConfirm={handleSubmit(handlePayInvoice)}
        confirmLabel="Pagar"
        cancelLabel="Cancelar"
        loading={paymentLoading}
        setMaxWidth="450px"
      >
        <PaymentFormContainer>
          {selectedInvoice && (
            <>
              <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Fatura de{' '}
                  {formatMonthYear(selectedInvoice.month, selectedInvoice.year)}
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {formatCurrency(selectedInvoice.totalAmount)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Vencimento: {formatDateToShow(selectedInvoice.dueDate)}
                </Typography>
              </Box>
              {}
              <Controller
                name="paymentAccountId"
                control={control}
                rules={{ required: 'Selecione uma conta para pagamento' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Conta para Débito"
                    fullWidth
                    required
                    error={!!errors.paymentAccountId}
                    helperText={errors.paymentAccountId?.message}
                  >
                    {accounts.map((account) => (
                      <MenuItem key={account.id} value={account.id}>
                        {account.name} - {formatCurrency(account.balance)}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
              {}
              <FormCurrencyField
                name="amount"
                control={control}
                label="Valor do Pagamento"
                fullWidth
                required
                helperText="Deixe o valor total para pagar a fatura completa"
                rules={{
                  required: 'Valor é obrigatório',
                  min: {
                    value: 0.01,
                    message: 'Valor deve ser maior que zero',
                  },
                  max: {
                    value: selectedInvoice.totalAmount,
                    message: 'Valor não pode ser maior que o total da fatura',
                  },
                }}
              />
            </>
          )}
        </PaymentFormContainer>
      </Modal>
    </CreditCardsContainer>
  );
}
