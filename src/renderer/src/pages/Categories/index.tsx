import {
  useBoardListing,
  BoardFilters,
  BoardMore,
} from '@renderer/components/BoardListing';
import { ContentLoading } from '@renderer/components/ContentLoading';
import { PageHeader } from '@renderer/components/PageHeader';
import { AppAlert } from '@renderer/components/Feedback';
import { ExpandableCard as Paper } from '@renderer/components/ExpandableCard';
import { Input as TextField } from '@renderer/components/Form/Input';

import { useEffect, useState, useCallback } from 'react';
import {
  Typography,
  Button,
  IconButton,
  Tooltip,
  Stack,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import {
  AddOutlined as AddIcon,
  CategoryOutlined as CategoryIcon,
  RefreshOutlined as RefreshIcon,
  EditOutlined as EditIcon,
  DeleteOutlined as DeleteIcon,
} from '@mui/icons-material';
import * as MuiIcons from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { Modal } from '@renderer/components/Modal';
import { IconPicker } from '@renderer/components/IconPicker';
import {
  CategoriesContainer,
  EmptyStateContainer,
  FormContainer,
} from './styles';
import type {
  Category,
  CategoryType,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '@shared/interfaces/types/category.types';

const categoryTypeOptions = [
  { value: 'income', label: 'Receita' },
  { value: 'expense', label: 'Despesa' },
];

interface CategoryFormData {
  name: string;
  type: CategoryType;
  icon?: string;
}

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [formLoading, setFormLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null,
  );
  const [deleteLoading, setDeleteLoading] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    defaultValues: {
      name: '',
      type: 'expense',
      icon: '',
    },
  });

  const board = useBoardListing('categories', setCategories);
  const queryFirst = board.first;
  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await queryFirst();
      if (!response.success && response.error !== 'Consulta substituída') {
        setError('Erro ao carregar categorias');
      }
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
      setError('Erro ao carregar categorias. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [queryFirst]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleNewCategory = () => {
    setSelectedCategory(null);
    reset({
      name: '',
      type: 'expense',
      icon: '',
    });
    setIsFormOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    reset({
      name: category.name,
      type: category.type,
      icon: category.icon || '',
    });
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedCategory(null);
    reset();
  };

  const handleSaveCategory = async (data: CategoryFormData) => {
    setFormLoading(true);
    try {
      if (selectedCategory) {
        const updateData: UpdateCategoryInput = {
          name: data.name,
          icon: data.icon || undefined,
        };
        const response = await window.electronAPI.category.update(
          selectedCategory.id,
          updateData,
        );
        if (!response.success) {
          throw new Error(response.error ?? 'Erro ao atualizar categoria');
        }
      } else {
        const createData: CreateCategoryInput = {
          name: data.name,
          type: data.type,
          icon: data.icon || undefined,
        };
        const response = await window.electronAPI.category.create(createData);
        if (!response.success) {
          throw new Error(response.error ?? 'Erro ao criar categoria');
        }
      }
      handleCloseForm();
      loadCategories();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erro ao salvar categoria.',
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteCategory = (category: Category) => {
    setCategoryToDelete(category);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    setDeleteLoading(true);
    try {
      const response = await window.electronAPI.category.delete(
        categoryToDelete.id,
      );
      if (response.success) {
        setIsDeleteModalOpen(false);
        setCategoryToDelete(null);
        loadCategories();
      } else {
        console.error('Erro ao excluir categoria:', response.error);
      }
    } catch (err) {
      console.error('Erro ao excluir categoria:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const paginatedCategories = categories;

  return (
    <CategoriesContainer>
      <PageHeader
        title="Categorias"
        description={<>Gerencie as categorias de receitas e despesas</>}
        actions={
          <>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Atualizar">
                <IconButton onClick={loadCategories} size="small">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleNewCategory}
                sx={{ borderRadius: '0.5rem' }}
              >
                Nova Categoria
              </Button>
            </Stack>
          </>
        }
      />
      <BoardFilters
        board={board}
        typeOptions={[
          { id: 'income', label: 'Receita' },
          { id: 'expense', label: 'Despesa' },
        ]}
      />
      <ContentLoading loading={loading} initial="cards">
        {error && (
          <AppAlert severity="error" sx={{ mb: 3 }}>
            {error}
          </AppAlert>
        )}

        {categories.length > 0 ? (
          <Paper
            data-tour="categories-list"
            sx={{ width: '100%', overflow: 'hidden', borderRadius: '1rem' }}
          >
            <TableContainer>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Nome</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Padrão</TableCell>
                    <TableCell align="right">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedCategories.map((category) => {
                    const IconComponent = category.icon
                      ? (MuiIcons as Record<string, React.ComponentType>)[
                          category.icon
                        ]
                      : CategoryIcon;
                    return (
                      <TableRow key={category.id} hover>
                        <TableCell>
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1}
                          >
                            {IconComponent && (
                              <IconComponent fontSize="small" color="action" />
                            )}
                            <Typography>{category.name}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={
                              category.type === 'income' ? 'Receita' : 'Despesa'
                            }
                            color={
                              category.type === 'income' ? 'success' : 'error'
                            }
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          {category.isDefault ? (
                            <Chip
                              label="Sim"
                              size="small"
                              color="info"
                              variant="outlined"
                            />
                          ) : (
                            <Chip label="Não" size="small" variant="outlined" />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              onClick={() => handleEditCategory(category)}
                              disabled={category.isDefault}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Excluir">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteCategory(category)}
                              disabled={category.isDefault}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        ) : (
          <EmptyStateContainer>
            <CategoryIcon
              sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }}
            />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Nenhuma categoria cadastrada
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Clique em "Nova Categoria" para adicionar sua primeira categoria
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleNewCategory}
            >
              Nova Categoria
            </Button>
          </EmptyStateContainer>
        )}

        <Modal
          variant="form"
          open={isFormOpen}
          title={selectedCategory ? 'Editar Categoria' : 'Nova Categoria'}
          handleClose={handleCloseForm}
          handleConfirm={handleSubmit(handleSaveCategory)}
          confirmLabel="Salvar"
          cancelLabel="Cancelar"
          loading={formLoading}
          setMaxWidth="400px"
        >
          <FormContainer data-tour="category-form">
            {error && <AppAlert severity="error">{error}</AppAlert>}
            <Controller
              name="name"
              control={control}
              rules={{
                required: 'Nome é obrigatório',
                validate: (value) =>
                  Boolean(value.trim()) || 'Nome é obrigatório',
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Nome da Categoria"
                  placeholder="Ex: Alimentação, Salário"
                  fullWidth
                  required
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              )}
            />

            <Controller
              name="type"
              control={control}
              rules={{ required: 'Tipo é obrigatório' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Tipo"
                  fullWidth
                  required
                  disabled={!!selectedCategory}
                  error={!!errors.type}
                  helperText={
                    errors.type?.message ||
                    (selectedCategory ? 'O tipo não pode ser alterado' : '')
                  }
                >
                  {categoryTypeOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            <Controller
              name="icon"
              control={control}
              render={({ field }) => (
                <IconPicker
                  value={field.value || ''}
                  onChange={field.onChange}
                  label="Ícone (opcional)"
                />
              )}
            />
          </FormContainer>
        </Modal>

        <Modal
          variant="danger"
          open={isDeleteModalOpen}
          title="Excluir Categoria"
          handleClose={() => {
            setIsDeleteModalOpen(false);
            setCategoryToDelete(null);
          }}
          handleConfirm={handleConfirmDelete}
          confirmLabel="Excluir"
          cancelLabel="Cancelar"
          loading={deleteLoading}
        >
          <Typography>
            Tem certeza que deseja excluir a categoria{' '}
            <strong>{categoryToDelete?.name}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esta ação não pode ser desfeita. Transações vinculadas a esta
            categoria podem ser afetadas.
          </Typography>
        </Modal>
        <BoardMore board={board} />
      </ContentLoading>
    </CategoriesContainer>
  );
}
