import { QuickCreate } from '@renderer/components/QuickCreate';
import { useRequestSequence } from '@renderer/hooks/requestSequence';
import { ContentLoading } from '@renderer/components/ContentLoading';
import { PageHeader } from '@renderer/components/PageHeader';
import { FilterPanel } from '@renderer/components/Filters';
import { MonthField } from '@renderer/components/Form/MonthField';
import { AppAlert as Alert } from '@renderer/components/Feedback';

import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Stack,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material';
import {
  AddOutlined as AddIcon,
  RefreshOutlined as RefreshIcon,
  ContentCopyOutlined as CopyIcon,
  EditOutlined as EditIcon,
  DeleteOutlined as DeleteIcon,
  WarningAmberRounded as WarningIcon,
} from '@mui/icons-material';
import { SelectInput } from '@renderer/components/Form/SelectInput';
import { CurrencyInput } from '@renderer/components/Form/CurrencyInput';
import { formatCurrency } from '@renderer/utils/currency';
import {
  BudgetContainer,
  SummaryCard,
  BudgetCard,
  ProgressContainer,
  BudgetGrid,
} from './styles';
import type {
  Budget,
  BudgetSummary,
} from '@shared/interfaces/types/budget.types';
import type { Category } from '@shared/interfaces/types/category.types';

export function BudgetPage() {
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [quick, setQuick] = useState<'account' | 'category' | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [formData, setFormData] = useState({
    categoryId: 0,
    plannedAmount: 0,
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const loadCategories = useCallback(async () => {
    const response = await window.electronAPI.category.findByType('expense');
    if (response.success && response.data) setCategories(response.data);
  }, []);

  const [error, setError] = useState<string | null>(null);
  const { begin, isCurrent } = useRequestSequence();
  const loadSummary = useCallback(async () => {
    const requestId = begin();
    setLoading(true);
    setError(null);
    try {
      const response = await window.electronAPI.budget.getSummary(year, month);
      if (!isCurrent(requestId)) return;
      if (!response.success || !response.data)
        throw new Error('Não foi possível carregar o orçamento.');
      setSummary(response.data);
    } catch (error) {
      if (isCurrent(requestId))
        setError(
          error instanceof Error
            ? error.message
            : 'Erro ao carregar o orçamento.',
        );
    } finally {
      if (isCurrent(requestId)) setLoading(false);
    }
  }, [year, month, begin, isCurrent]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);
  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const handleSave = async () => {
    if (!formData.categoryId || !formData.plannedAmount) return;
    setFormError('');
    setFormLoading(true);
    try {
      if (editingBudget) {
        const response = await window.electronAPI.budget.update(
          editingBudget.id,
          {
            plannedAmount: formData.plannedAmount,
          },
        );
        if (!response.success)
          throw new Error(
            response.error || 'Não foi possível salvar o orçamento.',
          );
      } else {
        const response = await window.electronAPI.budget.create({
          categoryId: formData.categoryId,
          year,
          month,
          plannedAmount: formData.plannedAmount,
        });
        if (!response.success)
          throw new Error(
            response.error || 'Não foi possível salvar o orçamento.',
          );
      }
      setIsFormOpen(false);
      setEditingBudget(null);
      setFormData({ categoryId: 0, plannedAmount: 0 });
      loadSummary();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Não foi possível salvar.',
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    await window.electronAPI.budget.delete(id);
    loadSummary();
  };

  const handleCopyFromPrevious = async () => {
    setLoading(true);
    await window.electronAPI.budget.copyFromPreviousMonth(year, month);
    loadSummary();
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 100) return 'error';
    if (percent >= 80) return 'warning';
    return 'success';
  };

  const availableCategories = categories.filter(
    (c) => !summary?.budgets.some((b) => b.categoryId === c.id),
  );

  return (
    <BudgetContainer>
      <PageHeader
        title="Orçamento"
        description={<>Planeje e acompanhe seus gastos por categoria</>}
        actions={
          <>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Copiar do mês anterior">
                <IconButton onClick={handleCopyFromPrevious}>
                  <CopyIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Atualizar">
                <IconButton onClick={loadSummary}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                data-tour="budget-create"
                onClick={() => {
                  setEditingBudget(null);
                  setFormData({ categoryId: 0, plannedAmount: 0 });
                  setIsFormOpen(true);
                }}
                disabled={availableCategories.length === 0}
              >
                Novo Orçamento
              </Button>
            </Stack>
          </>
        }
      />
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      <FilterPanel
        onClear={() => {
          const now = new Date();
          setYear(now.getFullYear());
          setMonth(now.getMonth() + 1);
        }}
      >
        <MonthField
          label="Mês de referência"
          value={year + '-' + String(month).padStart(2, '0')}
          onChange={(value) => {
            const [y, m] = value.split('-').map(Number);
            setYear(y);
            setMonth(m);
          }}
        />
      </FilterPanel>
      <ContentLoading loading={loading} initial="cards">
        {summary && (
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={3}>
            <SummaryCard sx={{ flex: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Total Planejado
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                {formatCurrency(summary.totalPlanned)}
              </Typography>
            </SummaryCard>
            <SummaryCard sx={{ flex: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Total Gasto
              </Typography>
              <Typography
                variant="h5"
                fontWeight={700}
                color={
                  summary.totalSpent > summary.totalPlanned
                    ? 'error.main'
                    : 'text.primary'
                }
              >
                {formatCurrency(summary.totalSpent)}
              </Typography>
            </SummaryCard>
            <SummaryCard sx={{ flex: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Restante
              </Typography>
              <Typography
                variant="h5"
                fontWeight={700}
                color={
                  summary.totalRemaining < 0 ? 'error.main' : 'success.main'
                }
              >
                {formatCurrency(summary.totalRemaining)}
              </Typography>
            </SummaryCard>
            <SummaryCard sx={{ flex: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Utilização
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                {summary.overallPercentUsed.toFixed(0)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={Math.min(summary.overallPercentUsed, 100)}
                color={getProgressColor(summary.overallPercentUsed)}
                sx={{ mt: 1, height: 8, borderRadius: 4 }}
              />
            </SummaryCard>
          </Stack>
        )}

        {summary?.budgets.length === 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Nenhum orçamento definido para este mês. Clique em "Novo Orçamento"
            para começar.
          </Alert>
        )}

        <BudgetGrid>
          {summary?.budgets.map((budget) => (
            <BudgetCard key={budget.id}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="subtitle1" fontWeight={600}>
                  {budget.categoryName}
                </Typography>
                <Stack direction="row" spacing={0.5}>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setEditingBudget(budget);
                      setFormData({
                        categoryId: budget.categoryId,
                        plannedAmount: budget.plannedAmount,
                      });
                      setIsFormOpen(true);
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(budget.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Stack>
              <Stack direction="row" justifyContent="space-between" mt={1}>
                <Typography variant="body2" color="text.secondary">
                  {formatCurrency(budget.spentAmount ?? 0)} /{' '}
                  {formatCurrency(budget.plannedAmount)}
                </Typography>
                <Chip
                  size="small"
                  label={`${(budget.percentUsed ?? 0).toFixed(0)}%`}
                  color={getProgressColor(budget.percentUsed ?? 0)}
                />
              </Stack>
              <ProgressContainer>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(budget.percentUsed ?? 0, 100)}
                  color={getProgressColor(budget.percentUsed ?? 0)}
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </ProgressContainer>
            </BudgetCard>
          ))}
        </BudgetGrid>

        {summary?.categoriesWithoutBudget &&
          summary.categoriesWithoutBudget.length > 0 && (
            <Box mt={4}>
              <Typography variant="h6" mb={2}>
                <WarningIcon
                  sx={{ verticalAlign: 'middle', mr: 1, color: 'warning.main' }}
                />
                Categorias sem orçamento
              </Typography>
              <BudgetGrid>
                {summary.categoriesWithoutBudget.map((cat) => (
                  <BudgetCard key={cat.categoryId} sx={{ opacity: 0.7 }}>
                    <Typography variant="subtitle1">
                      {cat.categoryName}
                    </Typography>
                    <Typography variant="body2" color="error.main">
                      Gasto: {formatCurrency(cat.spent)}
                    </Typography>
                  </BudgetCard>
                ))}
              </BudgetGrid>
            </Box>
          )}

        <Dialog
          open={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>
            {editingBudget ? 'Editar Orçamento' : 'Novo Orçamento'}
          </DialogTitle>
          <DialogContent>
            {formError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formError}
              </Alert>
            )}
            <Stack spacing={2} mt={1}>
              {!editingBudget && (
                <SelectInput
                  label="Categoria"
                  onCreate={() => setQuick('category')}
                  value={formData.categoryId}
                  items={availableCategories.map((c) => ({
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
              )}
              <CurrencyInput
                label="Valor Planejado"
                fullWidth
                value={formData.plannedAmount}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    plannedAmount: value,
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
              {formLoading ? <CircularProgress size={20} /> : 'Salvar'}
            </Button>
          </DialogActions>
        </Dialog>
      </ContentLoading>
      {quick && (
        <QuickCreate
          kind="category"
          type="expense"
          onClose={() => setQuick(null)}
          onCategory={(category) => {
            setCategories((rows) => [...rows, category]);
            setFormData((previous) => ({
              ...previous,
              categoryId: category.id,
            }));
          }}
        />
      )}
    </BudgetContainer>
  );
}
