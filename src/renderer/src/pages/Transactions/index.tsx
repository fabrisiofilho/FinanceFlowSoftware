import { useRequestSequence } from '@renderer/hooks/requestSequence';
import { useSearchParams } from 'react-router-dom';
import { ContentLoading } from '@renderer/components/ContentLoading';
import { PageHeader } from '@renderer/components/PageHeader';
import { AppAlert } from '@renderer/components/Feedback';
import { FilterPanel, MonthRangeFields } from '@renderer/components/Filters';

import { useEffect, useState, useCallback } from 'react';
import {
  Typography,
  Button,
  IconButton,
  Tooltip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Checkbox,
  TableSortLabel,
} from '@mui/material';
import {
  AddOutlined as AddIcon,
  TrendingUpOutlined as TrendingUpIcon,
  TrendingDownOutlined as TrendingDownIcon,
  EditOutlined as EditIcon,
  DeleteOutlined as DeleteIcon,
  RefreshOutlined as RefreshIcon,
  WarningAmberRounded as WarningIcon,
  DeleteSweepOutlined as DeleteSweepIcon,
} from '@mui/icons-material';
import {
  SelectInput,
  type SelectInputItem,
} from '@renderer/components/Form/SelectInput';
import { TransactionForm } from '@renderer/components/TransactionForm';
import { Modal } from '@renderer/components/Modal';
import { formatDateToShow } from '@renderer/utils/date';
import {
  TransactionsContainer,
  TableContainer as StyledTableContainer,
  AmountCell,
  TypeBadge,
  ActionsContainer,
  CategoryChip,
  EmptyStateContainer,
  FiltersSummary,
} from './styles';
import type {
  Transaction,
  TransactionFilters,
  TransactionType,
  CreateTransactionInput,
  TransactionSortField,
  SortDirection,
} from '@shared/interfaces/types/transaction.types';
import type { Category } from '@shared/interfaces/types/category.types';
import type { Account } from '@shared/interfaces/types/account.types';
import { formatCurrency } from '@renderer/utils/currency';

const typeOptions: SelectInputItem[] = [
  { value: '', label: 'Todos' },
  { value: 'income', label: 'Receitas' },
  { value: 'expense', label: 'Despesas' },
];
const MONTH_NAMES = [
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
export function TransactionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [initialType, setInitialType] = useState<TransactionType>('expense');
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [filters, setFilters] = useState<TransactionFilters>({
    startMonth: currentMonth,
    startYear: currentYear,
    endMonth: currentMonth,
    endYear: currentYear,
  });
  const [sortField, setSortField] =
    useState<TransactionSortField>('transactionDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('DESC');
  const [isFormOpen, setIsFormOpen] = useState(false);
  useEffect(() => {
    const create = searchParams.get('new');
    if (create === 'income' || create === 'expense') {
      setInitialType(create);
      setIsFormOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] =
    useState<Transaction | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isDeleteManyModalOpen, setIsDeleteManyModalOpen] = useState(false);
  const loadCategories = useCallback(async () => {
    try {
      const response = await window.electronAPI.category.findAll();
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
    }
  }, []);
  const loadAccounts = useCallback(async () => {
    try {
      const response = await window.electronAPI.account.findAll();
      if (response.success && response.data) {
        setAccounts(response.data);
      }
    } catch (err) {
      console.error('Erro ao carregar contas:', err);
    }
  }, []);
  const { begin, isCurrent } = useRequestSequence();
  const loadTransactions = useCallback(async () => {
    const requestId = begin();
    setLoading(true);
    setError(null);
    try {
      const response = await window.electronAPI.transaction.findAll({
        ...filters,
        page,
        size: rowsPerPage,
        sort: {
          field: sortField,
          direction: sortDirection,
        },
      });
      if (!isCurrent(requestId)) return;
      if (response.success && response.data) {
        setTransactions(response.data.content);
        setTotalElements(response.data.totalElements);
      } else {
        setError('Erro ao carregar transações');
      }
    } catch (err) {
      if (!isCurrent(requestId)) return;
      console.error('Erro ao carregar transações:', err);
      setError('Erro ao carregar transações. Tente novamente.');
    } finally {
      if (isCurrent(requestId)) setLoading(false);
    }
  }, [filters, page, rowsPerPage, sortField, sortDirection, begin, isCurrent]);
  useEffect(() => {
    loadCategories();
    loadAccounts();
  }, [loadCategories, loadAccounts]);
  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);
  const handleSort = (field: TransactionSortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortField(field);
      setSortDirection('DESC');
    }
    setPage(0);
  };
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
    setSelectedIds([]);
  };
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    setSelectedIds([]);
  };
  const handleCategoryChange = (event: { target: { value: unknown } }) => {
    const value = event.target.value as string | number;
    setFilters((prev) => ({
      ...prev,
      categoryId: value ? Number(value) : undefined,
    }));
    setPage(0);
  };
  const handleTypeChange = (event: { target: { value: unknown } }) => {
    const value = event.target.value as string;
    setFilters((prev) => ({
      ...prev,
      type: value ? (value as TransactionType) : undefined,
    }));
    setPage(0);
  };
  const handleAccountChange = (event: { target: { value: unknown } }) => {
    const value = event.target.value as string | number;
    setFilters((prev) => ({
      ...prev,
      accountId: value ? Number(value) : undefined,
    }));
    setPage(0);
  };
  const handleClearFilters = () => {
    setFilters({
      startMonth: currentMonth,
      startYear: currentYear,
      endMonth: currentMonth,
      endYear: currentYear,
    });
    setPage(0);
  };
  const hasActiveFilters = () => {
    return !!(filters.categoryId || filters.type || filters.accountId);
  };
  const formatPeriod = (): string => {
    const startMonthName =
      MONTH_NAMES[(filters.startMonth ?? currentMonth) - 1];
    const endMonthName = MONTH_NAMES[(filters.endMonth ?? currentMonth) - 1];
    const startYear = filters.startYear ?? currentYear;
    const endYear = filters.endYear ?? currentYear;
    if (
      filters.startMonth === filters.endMonth &&
      filters.startYear === filters.endYear
    ) {
      return `${startMonthName}/${startYear}`;
    }
    return `${startMonthName}/${startYear} - ${endMonthName}/${endYear}`;
  };
  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsFormOpen(true);
  };
  const handleDeleteTransaction = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setIsDeleteModalOpen(true);
  };
  const handleConfirmDelete = async () => {
    if (!transactionToDelete) return;
    setDeleteLoading(true);
    try {
      const response = await window.electronAPI.transaction.delete(
        transactionToDelete.id,
      );
      if (response.success) {
        loadTransactions();
        setIsDeleteModalOpen(false);
        setTransactionToDelete(null);
      } else {
        console.error('Erro ao excluir transação:', response.error);
      }
    } catch (err) {
      console.error('Erro ao excluir transação:', err);
    } finally {
      setDeleteLoading(false);
    }
  };
  const handleSelectTransaction = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };
  const handleSelectAll = () => {
    if (selectedIds.length === transactions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(transactions.map((t) => t.id));
    }
  };
  const handleOpenDeleteMany = () => {
    if (selectedIds.length > 0) {
      setIsDeleteManyModalOpen(true);
    }
  };
  const handleConfirmDeleteMany = async () => {
    if (selectedIds.length === 0) return;
    setDeleteLoading(true);
    try {
      const response =
        await window.electronAPI.transaction.deleteMany(selectedIds);
      if (response.success) {
        loadTransactions();
        setSelectedIds([]);
        setIsDeleteManyModalOpen(false);
      } else {
        console.error('Erro ao excluir transações:', response.error);
      }
    } catch (err) {
      console.error('Erro ao excluir transações:', err);
    } finally {
      setDeleteLoading(false);
    }
  };
  const handleNewTransaction = () => {
    setSelectedTransaction(null);
    setIsFormOpen(true);
  };
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedTransaction(null);
  };
  const handleSaveTransaction = async (data: CreateTransactionInput) => {
    setFormLoading(true);
    try {
      if (selectedTransaction) {
        const response = await window.electronAPI.transaction.update(
          selectedTransaction.id,
          data,
        );
        if (!response.success) {
          throw new Error(response.error ?? 'Erro ao atualizar transação');
        }
      } else {
        const response = await window.electronAPI.transaction.create(data);
        if (!response.success) {
          throw new Error(response.error ?? 'Erro ao criar transação');
        }
      }
      loadTransactions();
    } finally {
      setFormLoading(false);
    }
  };
  const getCategoryName = (categoryId: number): string => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name ?? 'Sem categoria';
  };
  const getAccountName = (accountId: number): string => {
    const account = accounts.find((a) => a.id === accountId);
    return account?.name ?? 'Sem conta';
  };
  const categoryOptions: SelectInputItem[] = [
    { value: '', label: 'Todas as categorias' },
    ...categories.map((cat) => ({
      value: cat.id,
      label: cat.name,
    })),
  ];
  const accountOptions: SelectInputItem[] = [
    { value: '', label: 'Todas as contas' },
    ...accounts.map((acc) => ({
      value: acc.id,
      label: acc.name,
    })),
  ];

  return (
    <TransactionsContainer>
      <PageHeader
        title="Transações"
        description={<>Gerencie suas receitas e despesas</>}
        actions={
          <>
            <Stack direction="row" spacing={1} alignItems="center">
              {selectedIds.length > 0 && (
                <Chip
                  label={`${selectedIds.length} selecionada(s)`}
                  color="primary"
                  size="small"
                  onDelete={() => setSelectedIds([])}
                />
              )}
              {selectedIds.length > 0 && (
                <Tooltip title="Excluir selecionadas">
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<DeleteSweepIcon />}
                    onClick={handleOpenDeleteMany}
                  >
                    Excluir ({selectedIds.length})
                  </Button>
                </Tooltip>
              )}
              <Tooltip title="Atualizar">
                <IconButton onClick={loadTransactions} size="small">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleNewTransaction}
                sx={{ borderRadius: '0.5rem' }}
              >
                Nova Transação
              </Button>
            </Stack>
          </>
        }
      />
      {error && (
        <AppAlert severity="error" sx={{ mb: 3 }}>
          {error}
        </AppAlert>
      )}

      <FilterPanel
        onClear={handleClearFilters}
        summary={
          <FiltersSummary>
            <Chip
              label={`Período: ${formatPeriod()}`}
              size="small"
              color="primary"
              variant="outlined"
            />
            {filters.categoryId && (
              <Chip
                label={`Categoria: ${getCategoryName(filters.categoryId)}`}
                size="small"
                onDelete={() => handleCategoryChange({ target: { value: '' } })}
              />
            )}
            {filters.type && (
              <Chip
                label={`Tipo: ${filters.type === 'income' ? 'Receitas' : 'Despesas'}`}
                size="small"
                onDelete={() => handleTypeChange({ target: { value: '' } })}
              />
            )}
            {filters.accountId && (
              <Chip
                label={`Conta: ${getAccountName(filters.accountId)}`}
                size="small"
                onDelete={() => handleAccountChange({ target: { value: '' } })}
              />
            )}
          </FiltersSummary>
        }
      >
        <MonthRangeFields
          value={{
            startMonth: filters.startMonth ?? currentMonth,
            startYear: filters.startYear ?? currentYear,
            endMonth: filters.endMonth ?? currentMonth,
            endYear: filters.endYear ?? currentYear,
          }}
          onChange={(range) => {
            setFilters((prev) => ({ ...prev, ...range }));
            setPage(0);
          }}
        />
        <SelectInput
          label="Categoria"
          value={filters.categoryId ?? ''}
          items={categoryOptions}
          onChange={handleCategoryChange}
          fullWidth
        />
        <SelectInput
          label="Conta"
          value={filters.accountId ?? ''}
          items={accountOptions}
          onChange={handleAccountChange}
          fullWidth
        />
        <SelectInput
          label="Tipo"
          value={filters.type ?? ''}
          items={typeOptions}
          onChange={handleTypeChange}
          fullWidth
        />
        <SelectInput
          label="Situação"
          value={filters.status ?? ''}
          items={[
            { value: '', label: 'Todas' },
            { value: 'pending', label: 'Pendentes' },
            { value: 'settled', label: 'Liquidados' },
            { value: 'cancelled', label: 'Cancelados' },
          ]}
          onChange={(event) => {
            setPage(0);
            setFilters((previous) => ({
              ...previous,
              status: (event.target.value ||
                undefined) as TransactionFilters['status'],
            }));
          }}
          fullWidth
        />
      </FilterPanel>
      <ContentLoading loading={loading} initial="table">
        <StyledTableContainer>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={
                        selectedIds.length > 0 &&
                        selectedIds.length < transactions.length
                      }
                      checked={
                        transactions.length > 0 &&
                        selectedIds.length === transactions.length
                      }
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'description'}
                      direction={
                        sortField === 'description'
                          ? (sortDirection.toLowerCase() as 'asc' | 'desc')
                          : 'desc'
                      }
                      onClick={() => handleSort('description')}
                    >
                      Descrição
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={sortField === 'amount'}
                      direction={
                        sortField === 'amount'
                          ? (sortDirection.toLowerCase() as 'asc' | 'desc')
                          : 'desc'
                      }
                      onClick={() => handleSort('amount')}
                    >
                      Valor
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Categoria</TableCell>
                  <TableCell>Conta</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'transactionDate'}
                      direction={
                        sortField === 'transactionDate'
                          ? (sortDirection.toLowerCase() as 'asc' | 'desc')
                          : 'desc'
                      }
                      onClick={() => handleSort('transactionDate')}
                    >
                      Data
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'type'}
                      direction={
                        sortField === 'type'
                          ? (sortDirection.toLowerCase() as 'asc' | 'desc')
                          : 'desc'
                      }
                      onClick={() => handleSort('type')}
                    >
                      Tipo
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <EmptyStateContainer>
                        <WarningIcon
                          sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }}
                        />
                        <Typography variant="h6" color="text.secondary">
                          Nenhuma transação encontrada
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {hasActiveFilters()
                            ? 'Tente ajustar os filtros para ver mais resultados'
                            : 'Clique em "Nova Transação" para adicionar sua primeira transação'}
                        </Typography>
                      </EmptyStateContainer>
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => (
                    <TableRow
                      key={transaction.id}
                      hover
                      selected={selectedIds.includes(transaction.id)}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedIds.includes(transaction.id)}
                          onChange={() =>
                            handleSelectTransaction(transaction.id)
                          }
                        />
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {transaction.description}
                        </Typography>
                        <Chip
                          size="small"
                          variant="outlined"
                          color={
                            transaction.status === 'pending'
                              ? 'warning'
                              : transaction.status === 'cancelled'
                                ? 'default'
                                : 'success'
                          }
                          label={
                            transaction.status === 'pending'
                              ? 'Pendente'
                              : transaction.status === 'cancelled'
                                ? 'Cancelado'
                                : 'Liquidado'
                          }
                        />
                        {transaction.installmentNumber &&
                          transaction.totalInstallments && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Parcela {transaction.installmentNumber}/
                              {transaction.totalInstallments}
                            </Typography>
                          )}
                      </TableCell>

                      <TableCell align="right">
                        <AmountCell $type={transaction.type}>
                          {transaction.type === 'income' ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </AmountCell>
                      </TableCell>

                      <TableCell>
                        <CategoryChip>
                          {getCategoryName(transaction.categoryId)}
                        </CategoryChip>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2">
                          {getAccountName(transaction.accountId)}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2">
                          {formatDateToShow(transaction.transactionDate)}
                        </Typography>
                        {transaction.dueDate && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            Venc: {formatDateToShow(transaction.dueDate)}
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell>
                        <TypeBadge $type={transaction.type}>
                          {transaction.type === 'income' ? (
                            <>
                              <TrendingUpIcon />
                              Receita
                            </>
                          ) : (
                            <>
                              <TrendingDownIcon />
                              Despesa
                            </>
                          )}
                        </TypeBadge>
                      </TableCell>

                      <TableCell align="right">
                        <ActionsContainer>
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              onClick={() => handleEditTransaction(transaction)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Excluir">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() =>
                                handleDeleteTransaction(transaction)
                              }
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </ActionsContainer>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={totalElements}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage="Resultados por página:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}–${to} de ${count !== -1 ? count : `mais de ${to}`}`
            }
          />
        </StyledTableContainer>

        <TransactionForm
          open={isFormOpen}
          onClose={handleCloseForm}
          onSave={handleSaveTransaction}
          transaction={selectedTransaction}
          initialType={initialType}
          categories={categories}
          accounts={accounts}
          loading={formLoading}
        />

        <Modal
          variant="danger"
          open={isDeleteModalOpen}
          title="Excluir Transação"
          handleClose={() => {
            setIsDeleteModalOpen(false);
            setTransactionToDelete(null);
          }}
          handleConfirm={handleConfirmDelete}
          confirmLabel="Excluir"
          cancelLabel="Cancelar"
          loading={deleteLoading}
        >
          <Typography>
            Tem certeza que deseja excluir a transação{' '}
            <strong>{transactionToDelete?.description}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esta ação não pode ser desfeita.
          </Typography>
        </Modal>

        <Modal
          variant="danger"
          open={isDeleteManyModalOpen}
          title="Excluir Transações"
          handleClose={() => {
            setIsDeleteManyModalOpen(false);
          }}
          handleConfirm={handleConfirmDeleteMany}
          confirmLabel={`Excluir ${selectedIds.length} transações`}
          cancelLabel="Cancelar"
          loading={deleteLoading}
        >
          <Typography>
            Tem certeza que deseja excluir{' '}
            <strong>{selectedIds.length} transações</strong> selecionadas?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esta ação não pode ser desfeita.
          </Typography>
        </Modal>
      </ContentLoading>
    </TransactionsContainer>
  );
}
