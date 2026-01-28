export interface SimpleCSVRow {
  mesAno: string;
  tipo: 'Receita' | 'Despesa';
  categoria: string;
  valor: number;
}
export interface ParsedCSVRow {
  mesRef: string;
  dataReferencia: Date;
  salario: number;
  dinheiroEmConta: number;
  bonus: number;
  cartaoBB: number;
  cartaoSantander: number;
  energia: number;
  internetEscola: number;
  aluguel: number;
  receitaTotal: number;
  despesaTotal: number;
  excedente: number;
}
export interface ImportPreview {
  totalRows: number;
  dateRange: {
    start: Date;
    end: Date;
  };
  summary: {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
  };
  accountsToCreate: string[];
  categoriesToCreate: string[];
  format?: 'simple' | 'complete';
  simpleSampleRows?: SimpleCSVRow[];
  sampleRows: ParsedCSVRow[];
}
export interface ImportResult {
  success: boolean;
  accountsCreated: number;
  categoriesCreated: number;
  transactionsCreated: number;
  errors: string[];
}
