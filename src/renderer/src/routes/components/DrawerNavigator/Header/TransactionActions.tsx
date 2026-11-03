import { Button } from '@mui/material';

export function TransactionActions() {
  return (
    <>
      <Button
        onClick={() =>
          window.dispatchEvent(
            new CustomEvent('quick-transaction', { detail: 'income' }),
          )
        }
        data-tour="income-create"
        color="success"
        size="small"
      >
        Nova receita
      </Button>
      <Button
        onClick={() =>
          window.dispatchEvent(
            new CustomEvent('quick-transaction', { detail: 'expense' }),
          )
        }
        data-tour="expense-create"
        color="error"
        size="small"
        variant="outlined"
      >
        Nova despesa
      </Button>
    </>
  );
}
