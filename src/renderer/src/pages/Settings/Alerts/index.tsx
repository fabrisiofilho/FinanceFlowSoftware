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
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Add as AddIcon,
  NotificationsOutlined as NotificationsIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  NotificationsActive as NotificationsActiveIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { Modal } from '@renderer/components/Modal';
import { FormCurrencyField } from '@renderer/components/Form/FormCurrencyField';
import {
  AlertsContainer,
  PageHeaderContainer,
  AlertsGrid,
  AlertCard,
  AlertCardHeader,
  AlertIcon,
  AlertInfo,
  AlertCategoryName,
  AlertLimit,
  AlertActions,
  StatusSection,
  AlertProgressBar,
  ValuesContainer,
  ValueItem,
  ValueLabel,
  ValueAmount,
  PercentageDisplay,
  StatusBadge,
  EmptyStateContainer,
  FormContainer,
} from './styles';
import type {
  AlertWithStatus,
  AlertStatus,
  CreateAlertInput,
  UpdateAlertInput,
} from '@shared/interfaces/types/alert.types';
import type { Category } from '@shared/interfaces/types/category.types';
import { formatCurrency } from '@renderer/utils/currency';

const getStatusText = (status: AlertStatus): string => {
  switch (status) {
    case 'ok':
      return 'Dentro do limite';
    case 'warning':
      return 'Atenção: próximo do limite';
    case 'critical':
      return 'Limite ultrapassado!';
    default:
      return 'Status desconhecido';
  }
};
const getStatusIcon = (status: AlertStatus) => {
  switch (status) {
    case 'ok':
      return <CheckCircleIcon />;
    case 'warning':
      return <WarningIcon />;
    case 'critical':
      return <ErrorIcon />;
    default:
      return <NotificationsIcon />;
  }
};
interface AlertFormData {
  categoryId: number;
  limitAmount: number;
}
export function AlertsPage() {
  const [alertsWithStatus, setAlertsWithStatus] = useState<AlertWithStatus[]>(
    [],
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<AlertWithStatus | null>(
    null,
  );
  const [formLoading, setFormLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [alertToDelete, setAlertToDelete] = useState<AlertWithStatus | null>(
    null,
  );
  const [deleteLoading, setDeleteLoading] = useState(false);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AlertFormData>({
    defaultValues: {
      categoryId: 0,
      limitAmount: 0,
    },
  });
  const loadCategories = useCallback(async () => {
    try {
      const response = await window.electronAPI.category.findByType('expense');
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
    }
  }, []);
  const loadAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.electronAPI.alert.checkAlerts();
      if (response.success && response.data) {
        setAlertsWithStatus(response.data);
      } else {
        setError('Erro ao carregar alertas');
      }
    } catch (err) {
      console.error('Erro ao carregar alertas:', err);
      setError('Erro ao carregar alertas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    loadCategories();
    loadAlerts();
  }, [loadCategories, loadAlerts]);
  const handleNewAlert = () => {
    setSelectedAlert(null);
    reset({
      categoryId: 0,
      limitAmount: 0,
    });
    setIsFormOpen(true);
  };
  const handleEditAlert = (alert: AlertWithStatus) => {
    setSelectedAlert(alert);
    reset({
      categoryId: alert.categoryId,
      limitAmount: alert.limitAmount,
    });
    setIsFormOpen(true);
  };
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedAlert(null);
    reset();
  };
  const handleSaveAlert = async (data: AlertFormData) => {
    setFormLoading(true);
    try {
      if (selectedAlert) {
        const updateData: UpdateAlertInput = {
          categoryId: data.categoryId,
          limitAmount: data.limitAmount,
        };
        const response = await window.electronAPI.alert.update(
          selectedAlert.alertId,
          updateData,
        );
        if (!response.success) {
          throw new Error(response.error ?? 'Erro ao atualizar alerta');
        }
      } else {
        const createData: CreateAlertInput = {
          categoryId: data.categoryId,
          limitAmount: data.limitAmount,
        };
        const response = await window.electronAPI.alert.create(createData);
        if (!response.success) {
          throw new Error(response.error ?? 'Erro ao criar alerta');
        }
      }
      handleCloseForm();
      loadAlerts();
    } catch (err) {
      console.error('Erro ao salvar alerta:', err);
    } finally {
      setFormLoading(false);
    }
  };
  const handleDeleteAlert = (alert: AlertWithStatus) => {
    setAlertToDelete(alert);
    setIsDeleteModalOpen(true);
  };
  const handleConfirmDelete = async () => {
    if (!alertToDelete) return;
    setDeleteLoading(true);
    try {
      const response = await window.electronAPI.alert.delete(
        alertToDelete.alertId,
      );
      if (response.success) {
        setIsDeleteModalOpen(false);
        setAlertToDelete(null);
        loadAlerts();
      } else {
        console.error('Erro ao excluir alerta:', response.error);
      }
    } catch (err) {
      console.error('Erro ao excluir alerta:', err);
    } finally {
      setDeleteLoading(false);
    }
  };
  const getAvailableCategories = (): Category[] => {
    if (selectedAlert) {
      return categories;
    }
    const usedCategoryIds = alertsWithStatus.map((a) => a.categoryId);
    return categories.filter((c) => !usedCategoryIds.includes(c.id));
  };
  if (loading && alertsWithStatus.length === 0) {
    return (
      <AlertsContainer>
        <Stack alignItems="center" justifyContent="center" minHeight="60vh">
          <CircularProgress size={48} />
          <Typography variant="body1" color="text.secondary" mt={2}>
            Carregando alertas...
          </Typography>
        </Stack>
      </AlertsContainer>
    );
  }
  if (error && alertsWithStatus.length === 0) {
    return (
      <AlertsContainer>
        <Stack alignItems="center" justifyContent="center" minHeight="60vh">
          <WarningIcon sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
          <Typography variant="h6" color="error">
            {error}
          </Typography>
          <IconButton onClick={loadAlerts} sx={{ mt: 2 }}>
            <RefreshIcon />
          </IconButton>
        </Stack>
      </AlertsContainer>
    );
  }
  return (
    <AlertsContainer>
      {}
      <PageHeaderContainer>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Alertas de Gastos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure limites de gastos por categoria e monitore seus gastos
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Atualizar">
            <IconButton onClick={loadAlerts} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNewAlert}
            sx={{ borderRadius: '0.5rem' }}
            disabled={getAvailableCategories().length === 0}
          >
            Novo Alerta
          </Button>
        </Stack>
      </PageHeaderContainer>
      {}
      {alertsWithStatus.length > 0 ? (
        <AlertsGrid>
          {alertsWithStatus.map((alert) => (
            <AlertCard key={alert.alertId} $status={alert.status}>
              {}
              <AlertCardHeader>
                <Stack direction="row" alignItems="center" flex={1}>
                  <AlertIcon $status={alert.status}>
                    {alert.status === 'critical' ? (
                      <NotificationsActiveIcon />
                    ) : (
                      <NotificationsIcon />
                    )}
                  </AlertIcon>
                  <AlertInfo>
                    <AlertCategoryName>{alert.categoryName}</AlertCategoryName>
                    <AlertLimit>
                      Limite: {formatCurrency(alert.limitAmount)}
                    </AlertLimit>
                  </AlertInfo>
                </Stack>
                <AlertActions>
                  <Tooltip title="Editar">
                    <IconButton
                      size="small"
                      onClick={() => handleEditAlert(alert)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Excluir">
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteAlert(alert)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </AlertActions>
              </AlertCardHeader>
              {}
              <StatusSection>
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
                    Uso do Limite
                  </Typography>
                  <PercentageDisplay $status={alert.status}>
                    {alert.percentage.toFixed(0)}%
                  </PercentageDisplay>
                </Stack>
                <AlertProgressBar
                  variant="determinate"
                  value={Math.min(alert.percentage, 100)}
                  $status={alert.status}
                />
                <ValuesContainer>
                  <ValueItem>
                    <ValueLabel>Gasto Atual</ValueLabel>
                    <ValueAmount $variant="current">
                      {formatCurrency(alert.currentSpent)}
                    </ValueAmount>
                  </ValueItem>
                  <ValueItem $align="right">
                    <ValueLabel>Limite Mensal</ValueLabel>
                    <ValueAmount $variant="limit">
                      {formatCurrency(alert.limitAmount)}
                    </ValueAmount>
                  </ValueItem>
                </ValuesContainer>
                {}
                <StatusBadge $status={alert.status}>
                  {getStatusIcon(alert.status)}
                  {getStatusText(alert.status)}
                </StatusBadge>
              </StatusSection>
            </AlertCard>
          ))}
        </AlertsGrid>
      ) : (
        <EmptyStateContainer>
          <NotificationsIcon
            sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }}
          />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Nenhum alerta configurado
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Clique em "Novo Alerta" para configurar um limite de gastos por
            categoria
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNewAlert}
            disabled={categories.length === 0}
          >
            Novo Alerta
          </Button>
          {categories.length === 0 && (
            <Typography variant="caption" color="text.secondary" mt={2}>
              Cadastre categorias de despesa primeiro
            </Typography>
          )}
        </EmptyStateContainer>
      )}
      {}
      <Modal
        variant="form"
        open={isFormOpen}
        title={selectedAlert ? 'Editar Alerta' : 'Novo Alerta'}
        handleClose={handleCloseForm}
        handleConfirm={handleSubmit(handleSaveAlert)}
        confirmLabel="Salvar"
        cancelLabel="Cancelar"
        loading={formLoading}
        setMaxWidth="500px"
      >
        <FormContainer>
          {}
          <Controller
            name="categoryId"
            control={control}
            rules={{
              required: 'Categoria é obrigatória',
              validate: (value) => value > 0 || 'Selecione uma categoria',
            }}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.categoryId}>
                <InputLabel id="category-label">Categoria</InputLabel>
                <Select
                  {...field}
                  labelId="category-label"
                  label="Categoria"
                  disabled={!!selectedAlert}
                >
                  <MenuItem value={0} disabled>
                    Selecione uma categoria
                  </MenuItem>
                  {getAvailableCategories().map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.categoryId && (
                  <Typography
                    variant="caption"
                    color="error"
                    sx={{ mt: 0.5, ml: 1.5 }}
                  >
                    {errors.categoryId.message}
                  </Typography>
                )}
              </FormControl>
            )}
          />
          {}
          <FormCurrencyField
            name="limitAmount"
            control={control}
            label="Limite Mensal"
            fullWidth
            required
            helperText="Defina o valor máximo de gastos para esta categoria"
            rules={{
              required: 'Limite é obrigatório',
              min: { value: 0.01, message: 'Limite deve ser maior que zero' },
            }}
          />
          {}
          <Box
            sx={{
              p: 2,
              borderRadius: 1,
              bgcolor: 'grey.100',
              mt: 1,
            }}
          >
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Como funciona o status:
            </Typography>
            <Stack spacing={0.5}>
              <Typography variant="caption" color="success.main">
                ✓ OK: Gastos abaixo de 80% do limite
              </Typography>
              <Typography variant="caption" color="warning.main">
                ⚠ Atenção: Gastos entre 80% e 100% do limite
              </Typography>
              <Typography variant="caption" color="error.main">
                ✕ Crítico: Gastos acima de 100% do limite
              </Typography>
            </Stack>
          </Box>
        </FormContainer>
      </Modal>
      {}
      <Modal
        variant="danger"
        open={isDeleteModalOpen}
        title="Excluir Alerta"
        handleClose={() => {
          setIsDeleteModalOpen(false);
          setAlertToDelete(null);
        }}
        handleConfirm={handleConfirmDelete}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        loading={deleteLoading}
      >
        <Typography>
          Tem certeza que deseja excluir o alerta da categoria{' '}
          <strong>{alertToDelete?.categoryName}</strong>?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Esta ação não pode ser desfeita. O monitoramento de gastos desta
          categoria será removido.
        </Typography>
      </Modal>
    </AlertsContainer>
  );
}
