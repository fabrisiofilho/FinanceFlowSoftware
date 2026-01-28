import { useState, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  Stack,
  Typography,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import {
  Upload,
  CheckCircle,
  Error as ErrorIcon,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';
import { enqueueSnackbar } from 'notistack';
import { formatDateToShow } from '@renderer/utils/date';
import type {
  ImportPreview,
  ImportResult,
} from '@shared/interfaces/types/import.types';
export function ImportPage() {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [csvContent, setCsvContent] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setPreview(null);
    setResult(null);
    try {
      const content = await file.text();
      setCsvContent(content);
      const response = await window.electronAPI.import.previewCSV(content);
      if (response.success && response.data) {
        setPreview(response.data);
      } else {
        enqueueSnackbar({
          variant: 'error',
          message: response.error || 'Erro ao processar arquivo',
        });
      }
    } catch {
      enqueueSnackbar({
        variant: 'error',
        message: 'Erro ao ler arquivo',
      });
    } finally {
      setLoading(false);
    }
  };
  const handleImport = async () => {
    if (!csvContent) return;
    setLoading(true);
    try {
      const response = await window.electronAPI.import.importCSV(csvContent);
      if (response.success && response.data) {
        setResult(response.data);
        enqueueSnackbar({
          variant: 'success',
          message: `Importação concluída! ${response.data.transactionsCreated} transações criadas.`,
        });
      } else {
        enqueueSnackbar({
          variant: 'error',
          message: response.error || 'Erro na importação',
        });
      }
    } catch {
      enqueueSnackbar({
        variant: 'error',
        message: 'Erro ao importar dados',
      });
    } finally {
      setLoading(false);
    }
  };
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      month: '2-digit',
      year: 'numeric',
    });
  };
  const isSimpleFormat = preview?.format === 'simple';
  return (
    <Box p={3}>
      <Typography variant="h5" mb={3}>
        Importar Dados Financeiros
      </Typography>
      <Card sx={{ p: 3, mb: 3 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="body1" color="text.secondary" mb={2}>
              Importe seu histórico financeiro a partir de um arquivo CSV.
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Formato esperado do CSV:
              </Typography>
              <Box
                component="code"
                sx={{
                  display: 'block',
                  bgcolor: 'grey.100',
                  p: 1,
                  borderRadius: 1,
                  fontSize: '0.85rem',
                  fontFamily: 'monospace',
                }}
              >
                Mês/Ano,Tipo,Categoria,Valor
                <br />
                01/2024,Receita,salario,5000.00
                <br />
                01/2024,Despesa,energia,250.00
                <br />
                01/2024,Despesa,cartao_bb,1500.00
              </Box>
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Colunas:</strong> Mês/Ano (MM/AAAA), Tipo (Receita ou
                Despesa), Categoria, Valor
              </Typography>
            </Alert>
          </Box>
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <Upload />}
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
          >
            Selecionar Arquivo CSV
          </Button>
        </Stack>
      </Card>
      {preview && !result && (
        <Card sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" mb={2}>
            Preview da Importação
          </Typography>
          <Stack spacing={2}>
            <Alert severity="info">
              {preview.totalRows} registros encontrados de{' '}
              {formatDate(preview.dateRange.start)} até{' '}
              {formatDate(preview.dateRange.end)}
            </Alert>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Resumo Financeiro:
              </Typography>
              <Stack direction="row" spacing={4}>
                <Typography color="success.main">
                  Receitas: {formatCurrency(preview.summary.totalIncome)}
                </Typography>
                <Typography color="error.main">
                  Despesas: {formatCurrency(preview.summary.totalExpenses)}
                </Typography>
                <Typography
                  color={
                    preview.summary.balance >= 0 ? 'success.main' : 'error.main'
                  }
                >
                  Saldo: {formatCurrency(preview.summary.balance)}
                </Typography>
              </Stack>
            </Box>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Contas a serem criadas:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {preview.accountsToCreate.map((account) => (
                  <Chip
                    key={account}
                    label={account}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Stack>
            </Box>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Categorias a serem criadas:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {preview.categoriesToCreate.map((category) => (
                  <Chip
                    key={category}
                    label={category}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Stack>
            </Box>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Amostra dos dados:
              </Typography>
              {isSimpleFormat && preview.simpleSampleRows ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Mês/Ano</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Categoria</TableCell>
                      <TableCell align="right">Valor</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {preview.simpleSampleRows.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row.mesAno}</TableCell>
                        <TableCell>
                          <Chip
                            icon={
                              row.tipo === 'Receita' ? (
                                <TrendingUp />
                              ) : (
                                <TrendingDown />
                              )
                            }
                            label={row.tipo}
                            size="small"
                            color={row.tipo === 'Receita' ? 'success' : 'error'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{row.categoria}</TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            color:
                              row.tipo === 'Receita'
                                ? 'success.main'
                                : 'error.main',
                            fontWeight: 500,
                          }}
                        >
                          {formatCurrency(row.valor)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Data</TableCell>
                      <TableCell align="right">Salário</TableCell>
                      <TableCell align="right">Cartão BB</TableCell>
                      <TableCell align="right">Cartão Sant.</TableCell>
                      <TableCell align="right">Excedente</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {preview.sampleRows.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {formatDateToShow(row.dataReferencia)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(row.salario)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(row.cartaoBB)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(row.cartaoSantander)}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            color:
                              row.excedente >= 0
                                ? 'success.main'
                                : 'error.main',
                          }}
                        >
                          {formatCurrency(row.excedente)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
            <Button
              variant="contained"
              color="primary"
              onClick={handleImport}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              Confirmar Importação
            </Button>
          </Stack>
        </Card>
      )}
      {result && (
        <Card sx={{ p: 3 }}>
          <Stack spacing={2} alignItems="center">
            {result.success ? (
              <>
                <CheckCircle color="success" sx={{ fontSize: 64 }} />
                <Typography variant="h6" color="success.main">
                  Importação Concluída!
                </Typography>
              </>
            ) : (
              <>
                <ErrorIcon color="error" sx={{ fontSize: 64 }} />
                <Typography variant="h6" color="error.main">
                  Importação com Erros
                </Typography>
              </>
            )}
            <Stack spacing={1} alignItems="center">
              <Typography>{result.accountsCreated} contas criadas</Typography>
              <Typography>
                {result.categoriesCreated} categorias criadas
              </Typography>
              <Typography>
                {result.transactionsCreated} transações importadas
              </Typography>
            </Stack>
            {result.errors.length > 0 && (
              <Alert severity="warning" sx={{ width: '100%' }}>
                <Typography variant="subtitle2">Erros encontrados:</Typography>
                {result.errors.map((error, index) => (
                  <Typography key={index} variant="body2">
                    {error}
                  </Typography>
                ))}
              </Alert>
            )}
            <Button
              variant="outlined"
              onClick={() => {
                setPreview(null);
                setResult(null);
                setCsvContent('');
              }}
            >
              Nova Importação
            </Button>
          </Stack>
        </Card>
      )}
    </Box>
  );
}
