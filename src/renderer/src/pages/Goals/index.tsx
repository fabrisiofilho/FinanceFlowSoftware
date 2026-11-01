import { ContentLoading } from '@renderer/components/ContentLoading';
import { PageHeader } from '@renderer/components/PageHeader';
import { AppAlert } from '@renderer/components/Feedback';
import { DateStringField } from '@renderer/components/Form/DatePicker/DateStringField';
import { Input as TextField } from '@renderer/components/Form/Input';

import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Stack,
} from '@mui/material';
import {
  AddOutlined as AddIcon,
  FlagOutlined as FlagIcon,
  RefreshOutlined as RefreshIcon,
  EditOutlined as EditIcon,
  DeleteOutlined as DeleteIcon,
  AddCircleOutlined as AddCircleIcon,
  CheckCircleOutlineRounded as CheckCircleIcon,
  ScheduleOutlined as ScheduleIcon,
  EmojiEventsOutlined as TrophyIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { Modal } from '@renderer/components/Modal';
import { FormCurrencyField } from '@renderer/components/Form/FormCurrencyField';
import { formatDateToShow, parseDateSafe } from '@renderer/utils/date';
import {
  GoalsContainer,
  GoalsGrid,
  GoalCard,
  GoalCardHeader,
  GoalIcon,
  GoalInfo,
  GoalName,
  GoalDeadline,
  GoalActions,
  ProgressSection,
  ProgressBar,
  ProgressValues,
  ProgressValueItem,
  ProgressLabel,
  ProgressValue,
  ProgressPercentage,
  CompletedBadge,
  EmptyStateContainer,
  FormContainer,
  ContributionFormContainer,
  GoalSummaryBox,
  RemainingDaysInfo,
} from './styles';
import type {
  Goal,
  CreateGoalInput,
  UpdateGoalInput,
  AddContributionInput,
} from '@shared/interfaces/types/goal.types';
import { formatCurrency } from '@renderer/utils/currency';
const calculateRemainingDays = (
  deadline: Date | string | undefined,
): number | null => {
  if (!deadline) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = parseDateSafe(deadline);
  if (!deadlineDate) return null;
  deadlineDate.setHours(0, 0, 0, 0);
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};
interface GoalFormData {
  name: string;
  targetAmount: number;
  deadline: string;
}
interface ContributionFormData {
  amount: number;
}
export function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const [goalForContribution, setGoalForContribution] = useState<Goal | null>(
    null,
  );
  const [contributionLoading, setContributionLoading] = useState(false);
  const {
    control: goalControl,
    handleSubmit: handleGoalSubmit,
    reset: resetGoalForm,
    formState: { errors: goalErrors },
  } = useForm<GoalFormData>({
    defaultValues: {
      name: '',
      targetAmount: 0,
      deadline: '',
    },
  });
  const {
    control: contributionControl,
    handleSubmit: handleContributionSubmit,
    reset: resetContributionForm,
  } = useForm<ContributionFormData>({
    defaultValues: {
      amount: 0,
    },
  });
  const loadGoals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.electronAPI.goal.findAll();
      if (response.success && response.data) {
        setGoals(response.data);
      } else {
        setError('Erro ao carregar metas');
      }
    } catch (err) {
      console.error('Erro ao carregar metas:', err);
      setError('Erro ao carregar metas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    loadGoals();
  }, [loadGoals]);
  const handleNewGoal = () => {
    setSelectedGoal(null);
    resetGoalForm({
      name: '',
      targetAmount: 0,
      deadline: '',
    });
    setIsFormOpen(true);
  };
  const handleEditGoal = (goal: Goal) => {
    setSelectedGoal(goal);
    const deadlineDate = parseDateSafe(goal.deadline);
    resetGoalForm({
      name: goal.name,
      targetAmount: goal.targetAmount,
      deadline: deadlineDate
        ? `${deadlineDate.getFullYear()}-${String(deadlineDate.getMonth() + 1).padStart(2, '0')}-${String(deadlineDate.getDate()).padStart(2, '0')}`
        : '',
    });
    setIsFormOpen(true);
  };
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedGoal(null);
    resetGoalForm();
  };
  const handleSaveGoal = async (data: GoalFormData) => {
    setFormLoading(true);
    try {
      if (selectedGoal) {
        const updateData: UpdateGoalInput = {
          name: data.name,
          targetAmount: data.targetAmount,
          deadline: data.deadline
            ? (parseDateSafe(data.deadline) ?? undefined)
            : undefined,
        };
        const response = await window.electronAPI.goal.update(
          selectedGoal.id,
          updateData,
        );
        if (!response.success) {
          throw new Error(response.error ?? 'Erro ao atualizar meta');
        }
      } else {
        const createData: CreateGoalInput = {
          name: data.name,
          targetAmount: data.targetAmount,
          deadline: data.deadline
            ? (parseDateSafe(data.deadline) ?? undefined)
            : undefined,
        };
        const response = await window.electronAPI.goal.create(createData);
        if (!response.success) {
          throw new Error(response.error ?? 'Erro ao criar meta');
        }
      }
      handleCloseForm();
      loadGoals();
    } catch (err) {
      console.error('Erro ao salvar meta:', err);
    } finally {
      setFormLoading(false);
    }
  };
  const handleDeleteGoal = (goal: Goal) => {
    setGoalToDelete(goal);
    setIsDeleteModalOpen(true);
  };
  const handleConfirmDelete = async () => {
    if (!goalToDelete) return;
    setDeleteLoading(true);
    try {
      const response = await window.electronAPI.goal.delete(goalToDelete.id);
      if (response.success) {
        setIsDeleteModalOpen(false);
        setGoalToDelete(null);
        loadGoals();
      } else {
        console.error('Erro ao excluir meta:', response.error);
      }
    } catch (err) {
      console.error('Erro ao excluir meta:', err);
    } finally {
      setDeleteLoading(false);
    }
  };
  const handleOpenContributionModal = (goal: Goal) => {
    setGoalForContribution(goal);
    resetContributionForm({
      amount: 0,
    });
    setIsContributionModalOpen(true);
  };
  const handleCloseContributionModal = () => {
    setIsContributionModalOpen(false);
    setGoalForContribution(null);
    resetContributionForm();
  };
  const handleAddContribution = async (data: ContributionFormData) => {
    if (!goalForContribution) return;
    setContributionLoading(true);
    try {
      const contributionData: AddContributionInput = {
        amount: data.amount,
      };
      const response = await window.electronAPI.goal.addContribution(
        goalForContribution.id,
        contributionData,
      );
      if (response.success) {
        handleCloseContributionModal();
        loadGoals();
      } else {
        console.error('Erro ao adicionar contribuição:', response.error);
      }
    } catch (err) {
      console.error('Erro ao adicionar contribuição:', err);
    } finally {
      setContributionLoading(false);
    }
  };

  return (
    <GoalsContainer>
      <PageHeader
        title="Metas"
        description={<>Acompanhe seu progresso em direção aos seus objetivos</>}
        actions={
          <>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Atualizar">
                <IconButton onClick={loadGoals} size="small">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleNewGoal}
                sx={{ borderRadius: '0.5rem' }}
              >
                Nova Meta
              </Button>
            </Stack>
          </>
        }
      />
      <ContentLoading loading={loading} initial="cards">
        {error && (
          <AppAlert severity="error" sx={{ mb: 3 }}>
            {error}
          </AppAlert>
        )}

        {goals.length > 0 ? (
          <GoalsGrid>
            {goals.map((goal) => {
              const isCompleted = goal.progress >= 100;
              const remainingDays = calculateRemainingDays(goal.deadline);
              const isExpired = remainingDays !== null && remainingDays < 0;
              const isUrgent =
                remainingDays !== null &&
                remainingDays <= 30 &&
                remainingDays >= 0;
              const remainingAmount = goal.targetAmount - goal.currentAmount;
              return (
                <GoalCard key={goal.id} $completed={isCompleted}>
                  <GoalCardHeader>
                    <Stack direction="row" alignItems="center" flex={1}>
                      <GoalIcon $completed={isCompleted}>
                        {isCompleted ? <TrophyIcon /> : <FlagIcon />}
                      </GoalIcon>
                      <GoalInfo>
                        <GoalName>{goal.name}</GoalName>
                        {goal.deadline && (
                          <GoalDeadline $expired={isExpired}>
                            {isExpired
                              ? `Venceu em ${formatDateToShow(goal.deadline)}`
                              : `Prazo: ${formatDateToShow(goal.deadline)}`}
                          </GoalDeadline>
                        )}
                      </GoalInfo>
                    </Stack>
                    <GoalActions>
                      {!isCompleted && (
                        <Tooltip title="Adicionar Valor">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenContributionModal(goal)}
                            color="primary"
                          >
                            <AddCircleIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => handleEditGoal(goal)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Excluir">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteGoal(goal)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </GoalActions>
                  </GoalCardHeader>

                  <ProgressSection>
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
                        Progresso
                      </Typography>
                      <ProgressPercentage $percentage={goal.progress}>
                        {goal.progress.toFixed(0)}%
                      </ProgressPercentage>
                    </Stack>
                    <ProgressBar
                      variant="determinate"
                      value={Math.min(goal.progress, 100)}
                      $percentage={goal.progress}
                    />
                    <ProgressValues>
                      <ProgressValueItem $variant="current">
                        <ProgressLabel>Valor Atual</ProgressLabel>
                        <ProgressValue $variant="current">
                          {formatCurrency(goal.currentAmount)}
                        </ProgressValue>
                      </ProgressValueItem>
                      <ProgressValueItem $variant="target">
                        <ProgressLabel>Valor Alvo</ProgressLabel>
                        <ProgressValue $variant="target">
                          {formatCurrency(goal.targetAmount)}
                        </ProgressValue>
                      </ProgressValueItem>
                    </ProgressValues>
                    {!isCompleted && remainingAmount > 0 && (
                      <Stack direction="row" justifyContent="center" mt={1}>
                        <ProgressValueItem $variant="remaining">
                          <ProgressLabel>Falta</ProgressLabel>
                          <ProgressValue $variant="remaining">
                            {formatCurrency(remainingAmount)}
                          </ProgressValue>
                        </ProgressValueItem>
                      </Stack>
                    )}

                    {remainingDays !== null && !isCompleted && (
                      <RemainingDaysInfo $urgent={isUrgent || isExpired}>
                        <ScheduleIcon />
                        {isExpired
                          ? `Prazo expirado há ${Math.abs(remainingDays)} dias`
                          : remainingDays === 0
                            ? 'Último dia!'
                            : remainingDays === 1
                              ? '1 dia restante'
                              : `${remainingDays} dias restantes`}
                      </RemainingDaysInfo>
                    )}

                    {isCompleted && (
                      <CompletedBadge>
                        <CheckCircleIcon />
                        Meta Atingida!
                      </CompletedBadge>
                    )}
                  </ProgressSection>
                </GoalCard>
              );
            })}
          </GoalsGrid>
        ) : (
          <EmptyStateContainer>
            <FlagIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Nenhuma meta cadastrada
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Clique em "Nova Meta" para definir seu primeiro objetivo
              financeiro
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleNewGoal}
            >
              Nova Meta
            </Button>
          </EmptyStateContainer>
        )}

        <Modal
          variant="form"
          open={isFormOpen}
          title={selectedGoal ? 'Editar Meta' : 'Nova Meta'}
          handleClose={handleCloseForm}
          handleConfirm={handleGoalSubmit(handleSaveGoal)}
          confirmLabel="Salvar"
          cancelLabel="Cancelar"
          loading={formLoading}
          setMaxWidth="500px"
        >
          <FormContainer>
            <Controller
              name="name"
              control={goalControl}
              rules={{ required: 'Nome é obrigatório' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Nome da Meta"
                  placeholder="Ex: Viagem, Carro Novo, Reserva de Emergência"
                  fullWidth
                  required
                  error={!!goalErrors.name}
                  helperText={goalErrors.name?.message}
                />
              )}
            />

            <FormCurrencyField
              name="targetAmount"
              control={goalControl}
              label="Valor Alvo"
              fullWidth
              required
              rules={{
                required: 'Valor alvo é obrigatório',
                min: { value: 0.01, message: 'Valor deve ser maior que zero' },
              }}
            />

            <Controller
              name="deadline"
              control={goalControl}
              render={({ field }) => (
                <DateStringField
                  {...field}
                  label="Data limite (opcional)"
                  fullWidth
                  helperText="Defina um prazo para alcançar sua meta"
                />
              )}
            />
          </FormContainer>
        </Modal>

        <Modal
          variant="danger"
          open={isDeleteModalOpen}
          title="Excluir Meta"
          handleClose={() => {
            setIsDeleteModalOpen(false);
            setGoalToDelete(null);
          }}
          handleConfirm={handleConfirmDelete}
          confirmLabel="Excluir"
          cancelLabel="Cancelar"
          loading={deleteLoading}
        >
          <Typography>
            Tem certeza que deseja excluir a meta{' '}
            <strong>{goalToDelete?.name}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esta ação não pode ser desfeita. Todo o histórico de contribuições
            será perdido.
          </Typography>
        </Modal>

        <Modal
          variant="form"
          open={isContributionModalOpen}
          title="Adicionar Valor"
          handleClose={handleCloseContributionModal}
          handleConfirm={handleContributionSubmit(handleAddContribution)}
          confirmLabel="Adicionar"
          cancelLabel="Cancelar"
          loading={contributionLoading}
          setMaxWidth="450px"
        >
          <ContributionFormContainer>
            {goalForContribution && (
              <>
                <GoalSummaryBox>
                  <Typography variant="subtitle2" color="text.secondary">
                    {goalForContribution.name}
                  </Typography>
                  <Stack direction="row" justifyContent="space-between" mt={1}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Valor Atual
                      </Typography>
                      <Typography variant="h6" fontWeight={600} color="primary">
                        {formatCurrency(goalForContribution.currentAmount)}
                      </Typography>
                    </Box>
                    <Box textAlign="right">
                      <Typography variant="caption" color="text.secondary">
                        Valor Alvo
                      </Typography>
                      <Typography variant="h6" fontWeight={600}>
                        {formatCurrency(goalForContribution.targetAmount)}
                      </Typography>
                    </Box>
                  </Stack>
                  <ProgressBar
                    variant="determinate"
                    value={Math.min(goalForContribution.progress, 100)}
                    $percentage={goalForContribution.progress}
                    sx={{ mt: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Falta{' '}
                    <strong>
                      {formatCurrency(
                        goalForContribution.targetAmount -
                          goalForContribution.currentAmount,
                      )}
                    </strong>{' '}
                    para atingir a meta
                  </Typography>
                </GoalSummaryBox>

                <FormCurrencyField
                  name="amount"
                  control={contributionControl}
                  label="Valor da Contribuição"
                  fullWidth
                  required
                  autoFocus
                  rules={{
                    required: 'Valor é obrigatório',
                    min: {
                      value: 0.01,
                      message: 'Valor deve ser maior que zero',
                    },
                  }}
                />
              </>
            )}
          </ContributionFormContainer>
        </Modal>
      </ContentLoading>
    </GoalsContainer>
  );
}
