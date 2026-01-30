import { useEffect, useState, useCallback, useRef, useMemo, memo } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Stack,
  Chip,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  MenuItem,
  FormControlLabel,
  Switch,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TablePagination,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Check as CheckIcon,
  AccountBalance as BankIcon,
  CheckCircle,
  Error as ErrorIcon,
  TrendingUp,
  TrendingDown,
  Settings as SettingsIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Restore as RestoreIcon,
} from '@mui/icons-material';
import { SelectInput } from '@renderer/components/Form/SelectInput';
import { CurrencyInput } from '@renderer/components/Form/CurrencyInput';
import { formatCurrency } from '@renderer/utils/currency';
import { formatDateToShow, parseDateSafe, formatDateToISO } from '@renderer/utils/date';
import { ImportContainer, PageHeaderContainer, UploadArea } from './styles';
import type { Account } from '@shared/interfaces/types/account.types';
import type {
  CSVPreviewData,
  ImportConfig,
  ImportPreview,
  ImportResult,
  ColumnMapping,
  FieldType,
  NumberFormat,
  ParsedTransaction,
} from '@shared/interfaces/types/import.types';
import {
  DATE_FORMAT_OPTIONS,
  NUMBER_FORMAT_OPTIONS,
  FIELD_TYPE_OPTIONS,
} from '@shared/interfaces/types/import.types';

const STEPS = ['Carregar Arquivo', 'Mapear Colunas', 'Revisar', 'Concluído'];
const ROWS_PER_PAGE_OPTIONS = [25, 50, 100];

const DEFAULT_INCOME_KEYWORDS = [
  'receita',
  'crédito',
  'credito',
  'entrada',
  'salário',
  'salario',
  'depósito',
  'deposito',
];
const DEFAULT_EXPENSE_KEYWORDS = [
  'despesa',
  'débito',
  'debito',
  'saída',
  'saida',
  'pagamento',
  'compra',
];

interface EditableTransaction extends ParsedTransaction {
  id: number;
  excluded: boolean;
}

// Memoized row component to prevent unnecessary re-renders
const TransactionRow = memo(function TransactionRow({
  tx,
  onEdit,
  onDelete,
  onRestore,
}: {
  tx: EditableTransaction;
  onEdit: (tx: EditableTransaction) => void;
  onDelete: (id: number) => void;
  onRestore: (id: number) => void;
}) {
  return (
    <TableRow sx={tx.excluded ? rowExcludedStyle : undefined}>
      <TableCell>{formatDateToShow(tx.date)}</TableCell>
      <TableCell
        sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}
      >
        {tx.description}
      </TableCell>
      <TableCell>
        <Chip
          icon={tx.type === 'income' ? <TrendingUp /> : <TrendingDown />}
          label={tx.type === 'income' ? 'Receita' : 'Despesa'}
          size="small"
          color={tx.type === 'income' ? 'success' : 'error'}
          variant="outlined"
        />
      </TableCell>
      <TableCell>{tx.category || '-'}</TableCell>
      <TableCell
        align="right"
        sx={{
          fontWeight: 500,
          color: tx.type === 'income' ? 'success.main' : 'error.main',
        }}
      >
        {formatCurrency(tx.amount)}
      </TableCell>
      <TableCell align="center">
        {tx.excluded ? (
          <Tooltip title="Restaurar">
            <IconButton
              size="small"
              onClick={() => onRestore(tx.id)}
              color="primary"
            >
              <RestoreIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : (
          <>
            <Tooltip title="Editar">
              <IconButton size="small" onClick={() => onEdit(tx)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Excluir">
              <IconButton
                size="small"
                onClick={() => onDelete(tx.id)}
                color="error"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        )}
      </TableCell>
    </TableRow>
  );
});

// Static styles to avoid recreating objects
const rowExcludedStyle = {
  opacity: 0.4,
  textDecoration: 'line-through',
  bgcolor: 'action.disabledBackground',
};

export function BankImportPage() {
  const [step, setStep] = useState(0);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvContent, setCsvContent] = useState<string>('');
  const [csvPreview, setCsvPreview] = useState<CSVPreviewData | null>(null);
  const [config, setConfig] = useState<ImportConfig>({
    hasHeader: true,
    delimiter: ',',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'auto',
    columnMappings: [],
    defaultAccountId: undefined,
    incomeKeywords: DEFAULT_INCOME_KEYWORDS,
    expenseKeywords: DEFAULT_EXPENSE_KEYWORDS,
  });
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [transactions, setTransactions] = useState<EditableTransaction[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [editingTx, setEditingTx] = useState<EditableTransaction | null>(null);
  const [editForm, setEditForm] = useState({
    date: '',
    description: '',
    amount: 0,
    type: 'expense' as 'income' | 'expense',
    category: '',
  });

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  // Memoized calculations
  const { activeTxs, summary } = useMemo(() => {
    const active = transactions.filter((tx) => !tx.excluded);
    const totalIncome = active
      .filter((tx) => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);
    const totalExpenses = active
      .filter((tx) => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);
    return {
      activeTxs: active,
      summary: {
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses,
      },
    };
  }, [transactions]);

  // Paginated transactions
  const paginatedTransactions = useMemo(() => {
    const start = page * rowsPerPage;
    return transactions.slice(start, start + rowsPerPage);
  }, [transactions, page, rowsPerPage]);

  const loadData = useCallback(async () => {
    const accRes = await window.electronAPI.account.findAll();
    if (accRes.success && accRes.data) {
      const regularAccounts = accRes.data.filter(
        (a) => a.type !== 'credit_card',
      );
      setAccounts(regularAccounts);
      if (regularAccounts.length > 0) {
        setConfig((prev) => {
          if (!prev.defaultAccountId) {
            return { ...prev, defaultAccountId: regularAccounts[0].id };
          }
          return prev;
        });
      }
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const processCsvFile = async (file: File) => {
    setLoading(true);
    try {
      const content = await file.text();
      setCsvContent(content);
      const response = await window.electronAPI.import.getCSVPreview(content);
      if (response.success && response.data) {
        setCsvPreview(response.data);
        const mappings: ColumnMapping[] = response.data.headers.map(
          (header, index) => ({
            columnIndex: index,
            columnName: header,
            fieldType: 'ignore' as FieldType,
            sampleValues: response
              .data!.rows.slice(0, 3)
              .map((row) => row[index] || ''),
          }),
        );
        mappings.forEach((mapping) => {
          const h = mapping.columnName.toLowerCase();
          if (
            h.includes('data') ||
            h.includes('date') ||
            h.includes('mês') ||
            h.includes('mes')
          )
            mapping.fieldType = 'date';
          else if (
            h.includes('descri') ||
            h.includes('histórico') ||
            h.includes('historico')
          )
            mapping.fieldType = 'description';
          else if (
            h.includes('valor') ||
            h.includes('amount') ||
            h.includes('quantia')
          )
            mapping.fieldType = 'amount';
          else if (h.includes('tipo') || h.includes('type'))
            mapping.fieldType = 'type';
          else if (h.includes('categoria') || h.includes('category'))
            mapping.fieldType = 'category';
        });
        setConfig((prev) => ({
          ...prev,
          hasHeader: response.data!.detectedHasHeader,
          delimiter: response.data!.detectedDelimiter,
          columnMappings: mappings,
        }));
        setStep(1);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      await processCsvFile(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [],
  );

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.txt')))
      await processCsvFile(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const updateColumnMapping = useCallback(
    (index: number, fieldType: FieldType) => {
      setConfig((prev) => ({
        ...prev,
        columnMappings: prev.columnMappings.map((m, i) =>
          i === index ? { ...m, fieldType } : m,
        ),
      }));
    },
    [],
  );

  const handlePreview = async () => {
    if (!csvContent) return;
    setLoading(true);
    try {
      const response = await window.electronAPI.import.previewImport(
        csvContent,
        config,
      );
      if (response.success && response.data) {
        setPreview(response.data);
        const editableTxs: EditableTransaction[] =
          response.data.sampleTransactions.map((tx, index) => ({
            ...tx,
            id: index,
            excluded: false,
          }));
        setTransactions(editableTxs);
        setPage(0);
        setStep(2);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!csvContent || transactions.length === 0) return;
    setLoading(true);
    try {
      const response = await window.electronAPI.import.importCSV(
        csvContent,
        config,
        activeTxs,
      );
      if (response.success && response.data) {
        setResult(response.data);
        setStep(3);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = useCallback(() => {
    setStep(0);
    setCsvContent('');
    setCsvPreview(null);
    setPreview(null);
    setTransactions([]);
    setResult(null);
    setPage(0);
    setConfig((prev) => ({ ...prev, columnMappings: [] }));
  }, []);

  const hasRequiredMappings = useMemo(() => {
    const mappings = config.columnMappings;
    return (
      mappings.some((m) => m.fieldType === 'date') &&
      mappings.some((m) => m.fieldType === 'amount')
    );
  }, [config.columnMappings]);

  const handleDeleteTransaction = useCallback((id: number) => {
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, excluded: true } : tx)),
    );
  }, []);

  const handleRestoreTransaction = useCallback((id: number) => {
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, excluded: false } : tx)),
    );
  }, []);

  const handleEditClick = useCallback((tx: EditableTransaction) => {
    setEditingTx(tx);
    setEditForm({
      date: formatDateToISO(tx.date) ?? new Date().toISOString().split('T')[0],
      description: tx.description,
      amount: tx.amount,
      type: tx.type,
      category: tx.category || '',
    });
  }, []);

  const handleEditSave = useCallback(() => {
    if (!editingTx) return;
    setTransactions((prev) =>
      prev.map((tx) =>
        tx.id === editingTx.id
          ? {
              ...tx,
              date: parseDateSafe(editForm.date) ?? new Date(),
              description: editForm.description,
              amount: editForm.amount,
              type: editForm.type,
              category: editForm.category || undefined,
            }
          : tx,
      ),
    );
    setEditingTx(null);
  }, [editingTx, editForm]);

  const handleCloseEdit = useCallback(() => setEditingTx(null), []);

  const handlePageChange = useCallback((_: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleRowsPerPageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage(parseInt(e.target.value, 10));
      setPage(0);
    },
    [],
  );

  return (
    <ImportContainer>
      <PageHeaderContainer>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            <BankIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
            Importar Transações
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Importe transações de arquivos CSV com mapeamento flexível de
            colunas
          </Typography>
        </Box>
      </PageHeaderContainer>

      <Stepper activeStep={step} sx={{ mb: 4 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {step === 0 && (
        <Stack spacing={3}>
          <UploadArea
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            sx={{
              borderColor: isDragging ? 'primary.main' : undefined,
              bgcolor: isDragging ? 'action.hover' : undefined,
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              hidden
              onChange={handleFileSelect}
            />
            {loading ? (
              <CircularProgress />
            ) : (
              <>
                <UploadIcon
                  sx={{ fontSize: 48, color: 'primary.main', mb: 2 }}
                />
                <Typography variant="h6">
                  {isDragging
                    ? 'Solte o arquivo aqui'
                    : 'Clique ou arraste o arquivo CSV'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Formatos aceitos: CSV, TXT
                </Typography>
              </>
            )}
          </UploadArea>
        </Stack>
      )}

      {step === 1 && csvPreview && (
        <Stack spacing={3}>
          <Card sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <SettingsIcon color="primary" />
              <Typography variant="h6">Configurações do Arquivo</Typography>
            </Stack>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              mb={3}
              flexWrap="wrap"
              useFlexGap
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={config.hasHeader}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        hasHeader: e.target.checked,
                      }))
                    }
                  />
                }
                label="Primeira linha é cabeçalho"
              />
              <TextField
                select
                label="Formato de Data"
                value={config.dateFormat}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, dateFormat: e.target.value }))
                }
                size="small"
                sx={{ minWidth: 200 }}
              >
                {DATE_FORMAT_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Formato de Número"
                value={config.numberFormat}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    numberFormat: e.target.value as NumberFormat,
                  }))
                }
                size="small"
                sx={{ minWidth: 220 }}
              >
                {NUMBER_FORMAT_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
              <SelectInput
                label="Conta Destino"
                value={config.defaultAccountId || ''}
                items={accounts.map((a) => ({ value: a.id, label: a.name }))}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    defaultAccountId: e.target.value as number,
                  }))
                }
                size="small"
                sx={{ minWidth: 200 }}
              />
            </Stack>
          </Card>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" mb={2}>
              Mapeamento de Colunas
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Defina qual campo cada coluna representa. <strong>Data</strong> e{' '}
              <strong>Valor</strong> são obrigatórios.
            </Alert>
            <Paper sx={{ overflow: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Coluna</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Amostra</TableCell>
                    <TableCell sx={{ fontWeight: 600, minWidth: 180 }}>
                      Mapear para
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {config.columnMappings.map((mapping, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {mapping.columnName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.5}>
                          {mapping.sampleValues.slice(0, 2).map((val, i) => (
                            <Typography
                              key={i}
                              variant="caption"
                              color="text.secondary"
                              noWrap
                              sx={{ maxWidth: 200 }}
                            >
                              {val || '(vazio)'}
                            </Typography>
                          ))}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <TextField
                          select
                          size="small"
                          fullWidth
                          value={mapping.fieldType}
                          onChange={(e) =>
                            updateColumnMapping(
                              index,
                              e.target.value as FieldType,
                            )
                          }
                        >
                          {FIELD_TYPE_OPTIONS.map((opt) => (
                            <MenuItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </MenuItem>
                          ))}
                        </TextField>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Card>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button onClick={handleReset}>Cancelar</Button>
            <Button
              variant="contained"
              onClick={handlePreview}
              disabled={loading || !hasRequiredMappings}
            >
              {loading ? (
                <CircularProgress size={20} />
              ) : (
                'Visualizar Importação'
              )}
            </Button>
          </Stack>
        </Stack>
      )}

      {step === 2 && preview && (
        <Stack spacing={3}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" mb={2}>
              Resumo da Importação
            </Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} mb={3}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Transações Ativas
                </Typography>
                <Typography variant="h5">
                  {activeTxs.length} / {transactions.length}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Receitas
                </Typography>
                <Typography variant="h6" color="success.main">
                  {formatCurrency(summary.totalIncome)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Despesas
                </Typography>
                <Typography variant="h6" color="error.main">
                  {formatCurrency(summary.totalExpenses)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Saldo
                </Typography>
                <Typography
                  variant="h6"
                  color={summary.balance >= 0 ? 'success.main' : 'error.main'}
                >
                  {formatCurrency(summary.balance)}
                </Typography>
              </Box>
            </Stack>
            {preview.errors.length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="subtitle2">
                  {preview.invalidRows} linhas com erro no arquivo original
                </Typography>
              </Alert>
            )}
          </Card>
          <Card sx={{ p: 3 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="h6">Transações para Importar</Typography>
              <Typography variant="body2" color="text.secondary">
                Clique em editar ou excluir para ajustar antes de importar
              </Typography>
            </Stack>
            <Paper sx={{ overflow: 'auto' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Data</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Descrição</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Tipo</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Categoria</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">
                      Valor
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">
                      Ações
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedTransactions.map((tx) => (
                    <TransactionRow
                      key={tx.id}
                      tx={tx}
                      onEdit={handleEditClick}
                      onDelete={handleDeleteTransaction}
                      onRestore={handleRestoreTransaction}
                    />
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={transactions.length}
                page={page}
                onPageChange={handlePageChange}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleRowsPerPageChange}
                rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
                labelRowsPerPage="Linhas por página:"
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} de ${count}`
                }
              />
            </Paper>
          </Card>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button onClick={() => setStep(1)}>Voltar</Button>
            <Button
              variant="contained"
              onClick={handleImport}
              disabled={loading || activeTxs.length === 0}
            >
              {loading ? (
                <CircularProgress size={20} />
              ) : (
                `Importar ${activeTxs.length} Transações`
              )}
            </Button>
          </Stack>
        </Stack>
      )}

      {step === 3 && result && (
        <Card sx={{ p: 4 }}>
          <Stack spacing={3} alignItems="center">
            {result.success ? (
              <>
                <CheckCircle color="success" sx={{ fontSize: 64 }} />
                <Typography variant="h5" color="success.main">
                  Importação Concluída!
                </Typography>
              </>
            ) : (
              <>
                <ErrorIcon color="error" sx={{ fontSize: 64 }} />
                <Typography variant="h5" color="error.main">
                  Importação com Erros
                </Typography>
              </>
            )}
            <Stack spacing={1} alignItems="center">
              <Typography variant="h6">
                {result.transactionsCreated} transações importadas
              </Typography>
              {result.categoriesCreated > 0 && (
                <Typography color="text.secondary">
                  {result.categoriesCreated} categorias criadas
                </Typography>
              )}
            </Stack>
            {result.errors.length > 0 && (
              <Alert severity="warning" sx={{ width: '100%', maxWidth: 500 }}>
                <Typography variant="subtitle2">Erros encontrados:</Typography>
                {result.errors.slice(0, 5).map((error, index) => (
                  <Typography key={index} variant="body2">
                    {error}
                  </Typography>
                ))}
              </Alert>
            )}
            <Button
              variant="contained"
              onClick={handleReset}
              startIcon={<CheckIcon />}
            >
              Nova Importação
            </Button>
          </Stack>
        </Card>
      )}

      <Dialog
        open={!!editingTx}
        onClose={handleCloseEdit}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Editar Transação</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Data"
              type="date"
              fullWidth
              value={editForm.date}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, date: e.target.value }))
              }
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Descrição"
              fullWidth
              value={editForm.description}
              onChange={(e) =>
                setEditForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
            <CurrencyInput
              label="Valor"
              fullWidth
              value={editForm.amount}
              onChange={(value) =>
                setEditForm((prev) => ({ ...prev, amount: value }))
              }
            />
            <SelectInput
              label="Tipo"
              value={editForm.type}
              items={[
                { value: 'income', label: 'Receita' },
                { value: 'expense', label: 'Despesa' },
              ]}
              onChange={(e) =>
                setEditForm((prev) => ({
                  ...prev,
                  type: e.target.value as 'income' | 'expense',
                }))
              }
              fullWidth
            />
            <TextField
              label="Categoria"
              fullWidth
              value={editForm.category}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, category: e.target.value }))
              }
              helperText="Deixe vazio para usar categoria padrão"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEdit}>Cancelar</Button>
          <Button variant="contained" onClick={handleEditSave}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </ImportContainer>
  );
}
