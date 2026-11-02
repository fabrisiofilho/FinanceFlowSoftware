import { useState } from 'react';
import { Stack } from '@mui/material';
import { Modal } from '../Modal';
import { Input } from '../Form/Input';
import { SelectInput } from '../Form/SelectInput';
import { CurrencyInput } from '../Form/CurrencyInput';
import { IconPicker } from '../IconPicker';
import { AppAlert } from '../Feedback';
import type {
  Account,
  AccountType,
} from '@shared/interfaces/types/account.types';
import type { Category } from '@shared/interfaces/types/category.types';

export function QuickCreate({
  kind,
  type = 'expense',
  initialAccountType = 'checking',
  allowedAccountTypes,
  onClose,
  onAccount,
  onCategory,
}: {
  kind: 'account' | 'category';
  type?: 'income' | 'expense';
  initialAccountType?: AccountType;
  allowedAccountTypes?: AccountType[];
  onClose: () => void;
  onAccount?: (account: Account) => void;
  onCategory?: (category: Category) => void;
}) {
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>(
    allowedAccountTypes && !allowedAccountTypes.includes(initialAccountType)
      ? allowedAccountTypes[0]
      : initialAccountType,
  );
  const [amount, setAmount] = useState(0);
  const [limit, setLimit] = useState(0);
  const [closing, setClosing] = useState('1');
  const [due, setDue] = useState('10');
  const [icon, setIcon] = useState(
    type === 'income' ? 'Payments' : 'ShoppingCart',
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function save() {
    if (!name.trim()) {
      setError('Informe o nome.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      if (kind === 'account') {
        const response = await window.electronAPI.account.create({
          name,
          type: accountType,
          balance: amount,
          ...(accountType === 'credit_card'
            ? {
                creditLimit: limit,
                closingDay: Number(closing),
                dueDay: Number(due),
              }
            : {}),
        });
        if (!response.success || !response.data)
          throw new Error(response.error || 'Não foi possível cadastrar.');
        onAccount?.(response.data);
      } else {
        const response = await window.electronAPI.category.create({
          name,
          type,
          icon,
        });
        if (!response.success || !response.data)
          throw new Error(response.error || 'Não foi possível cadastrar.');
        onCategory?.(response.data);
      }
      window.dispatchEvent(new Event('finance-data-changed'));
      onClose();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Não foi possível cadastrar.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      variant="form"
      open
      title={
        kind === 'account'
          ? 'Cadastrar conta'
          : `Cadastrar categoria de ${type === 'income' ? 'receita' : 'despesa'}`
      }
      handleClose={onClose}
      handleConfirm={save}
      confirmLabel="Cadastrar e selecionar"
      cancelLabel="Cancelar"
      loading={busy}
      setMaxWidth="500px"
    >
      <Stack spacing={3}>
        {error && <AppAlert severity="error">{error}</AppAlert>}
        <Input
          autoFocus
          label="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        {kind === 'category' ? (
          <IconPicker value={icon} onChange={setIcon} />
        ) : (
          <>
            <SelectInput
              label="Tipo de conta"
              required
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as AccountType)}
              items={[
                { value: 'checking', label: 'Conta corrente' },
                { value: 'savings', label: 'Poupança' },
                { value: 'wallet', label: 'Carteira' },
                { value: 'credit_card', label: 'Cartão de crédito' },
              ].filter(
                (option) =>
                  !allowedAccountTypes ||
                  allowedAccountTypes.includes(option.value as AccountType),
              )}
            />
            <CurrencyInput
              label="Saldo inicial"
              value={amount}
              onChange={setAmount}
            />
            {accountType === 'credit_card' && (
              <>
                <CurrencyInput
                  label="Limite de crédito"
                  required
                  value={limit}
                  onChange={setLimit}
                />
                <Input
                  label="Dia de fechamento"
                  required
                  type="number"
                  value={closing}
                  onChange={(e) => setClosing(e.target.value)}
                />
                <Input
                  label="Dia de vencimento"
                  required
                  type="number"
                  value={due}
                  onChange={(event) => setDue(event.target.value)}
                />
              </>
            )}
          </>
        )}
      </Stack>
    </Modal>
  );
}
