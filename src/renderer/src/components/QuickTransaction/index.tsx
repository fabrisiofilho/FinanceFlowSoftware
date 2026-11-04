import { useEffect, useRef, useState } from 'react';
import { Button, Menu, MenuItem } from '@mui/material';
import { enqueueSnackbar } from 'notistack';
import { TransactionForm } from '../TransactionForm';
import type { Account } from '@shared/interfaces/types/account.types';
import type { Category } from '@shared/interfaces/types/category.types';
import type { CreateTransactionInput } from '@shared/interfaces/types/transaction.types';

export function QuickTransactionButton() {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <>
      <Button
        variant="contained"
        aria-haspopup="menu"
        aria-expanded={!!anchor}
        onClick={(e) => setAnchor(e.currentTarget)}
      >
        + Novo
      </Button>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
        {(['income', 'expense'] as const).map((type) => (
          <MenuItem
            key={type}
            onClick={() => {
              setAnchor(null);
              window.dispatchEvent(
                new CustomEvent('quick-transaction', { detail: type }),
              );
            }}
          >
            {type === 'income' ? 'Receita' : 'Despesa'}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

/** Mounted once above every authenticated route. */
export function QuickTransactionDialog() {
  const [type, setType] = useState<'income' | 'expense' | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]),
    [categories, setCategories] = useState<Category[]>([]);
  const [busy, setBusy] = useState(false);
  const opening = useRef(false),
    trigger = useRef<HTMLElement | null>(null);
  useEffect(() => {
    let active = true;
    async function open(event: Event) {
      if (opening.current) return;
      const desired = (event as CustomEvent).detail;
      if (desired !== 'income' && desired !== 'expense') return;
      opening.current = true;
      trigger.current = document.activeElement as HTMLElement;
      try {
        const [a, c] = await Promise.all([
          window.electronAPI.account.findAll(),
          window.electronAPI.category.findAll(),
        ]);
        if (!a.success || !c.success)
          throw new Error(
            a.error ||
              c.error ||
              'Não foi possível carregar contas e categorias',
          );
        if (active) {
          setAccounts(a.data ?? []);
          setCategories(c.data ?? []);
          setType(desired);
        }
      } catch (reason) {
        if (active)
          enqueueSnackbar(
            reason instanceof Error
              ? reason.message
              : 'Falha ao abrir formulário',
            { variant: 'error' },
          );
      } finally {
        opening.current = false;
      }
    }
    function keyboard(event: KeyboardEvent) {
      if (
        event.ctrlKey &&
        event.shiftKey &&
        ['r', 'd'].includes(event.key.toLowerCase()) &&
        !document.querySelector('[role="dialog"]')
      ) {
        event.preventDefault();
        window.dispatchEvent(
          new CustomEvent('quick-transaction', {
            detail: event.key.toLowerCase() === 'r' ? 'income' : 'expense',
          }),
        );
      }
    }
    window.addEventListener('quick-transaction', open);
    window.addEventListener('keydown', keyboard);
    return () => {
      active = false;
      window.removeEventListener('quick-transaction', open);
      window.removeEventListener('keydown', keyboard);
    };
  }, []);
  async function save(input: CreateTransactionInput) {
    setBusy(true);
    try {
      const result = await window.electronAPI.transaction.create(input);
      if (!result.success)
        throw new Error(result.error || 'Não foi possível salvar');
      window.dispatchEvent(new Event('finance-data-changed'));
      enqueueSnackbar('Lançamento salvo', { variant: 'success' });
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {type && (
        <TransactionForm
          open
          initialType={type}
          accounts={accounts}
          categories={categories}
          loading={busy}
          onSave={save}
          onClose={() => {
            setType(null);
            setTimeout(() => trigger.current?.focus(), 0);
          }}
        />
      )}
    </>
  );
}
