import { TablePagination, type TablePaginationProps } from '@mui/material';

type Props = Omit<TablePaginationProps, 'component'> & { hasNext?: boolean };

export function ListPagination({
  hasNext,
  rowsPerPageOptions = [],
  ...props
}: Props) {
  return (
    <TablePagination
      component="div"
      rowsPerPageOptions={rowsPerPageOptions}
      labelRowsPerPage="Resultados por página:"
      labelDisplayedRows={({ from, to, count, page }) =>
        count < 0
          ? `Página ${page + 1}`
          : count === 0
            ? '0 resultados'
            : `${from}–${to} de ${count}`
      }
      getItemAriaLabel={(type) =>
        ({
          first: 'Primeira página',
          last: 'Última página',
          next: 'Próxima página',
          previous: 'Página anterior',
        })[type]
      }
      slotProps={
        hasNext === undefined
          ? undefined
          : {
              actions: { nextButton: { disabled: !hasNext || props.disabled } },
            }
      }
      {...props}
    />
  );
}
