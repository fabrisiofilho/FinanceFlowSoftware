/** IRPF ordinário, ano-calendário 2026 / exercício 2027. Valores em centavos. */
export const INCOME_TAX_SOURCE =
  'https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2026';
export interface IncomeTaxInput {
  taxableCents: number;
  expectedCents: number;
  withheldCents: number;
  socialSecurityCents: number;
  medicalCents: number;
  dependents: number;
  educationCents: number[];
  pensionCents: number;
  pgblCents: number;
}
export interface IncomeTaxCalculation {
  deduction: number;
  base: number;
  beforeReduction: number;
  reduction: number;
  tax: number;
  balance: number;
}
export interface IncomeTaxResult {
  income: number;
  simplified: IncomeTaxCalculation;
  legal: IncomeTaxCalculation;
  best: 'legal' | 'simplified';
  outsideScope: boolean;
}
export function simulateIncomeTax(input: IncomeTaxInput): IncomeTaxResult {
  const values = [
    input.taxableCents,
    input.expectedCents,
    input.withheldCents,
    input.socialSecurityCents,
    input.medicalCents,
    input.pensionCents,
    input.pgblCents,
    ...input.educationCents,
  ];
  if (
    values.some(
      (value) =>
        !Number.isSafeInteger(value) || value < 0 || value > 100_000_000_00,
    ) ||
    !Number.isInteger(input.dependents) ||
    input.dependents < 0 ||
    input.dependents > 30 ||
    input.educationCents.length !== input.dependents + 1
  )
    throw new Error('Revise os valores, dependentes e despesas de educação.');
  const income = input.taxableCents + input.expectedCents;
  const simplifiedDeduction = Math.min(Math.floor(income / 5), 1764000);
  const legalDeduction =
    input.socialSecurityCents +
    input.medicalCents +
    input.pensionCents +
    input.dependents * 227508 +
    input.educationCents.reduce(
      (sum, value) => sum + Math.min(value, 356150),
      0,
    ) +
    Math.min(input.pgblCents, Math.floor((income * 12) / 100));
  const calculate = (deduction: number): IncomeTaxCalculation => {
    const base = Math.max(0, income - deduction);
    const [rate, offset] =
      base <= 2914560
        ? [0, 0]
        : base <= 3391980
          ? [75, 218592]
          : base <= 4501260
            ? [150, 472991]
            : base <= 5597616
              ? [225, 810585]
              : [275, 1090466];
    const beforeReduction = Math.max(
      0,
      Math.round((base * rate) / 1000) - offset,
    );
    const reduction =
      income <= 6000000
        ? Math.min(beforeReduction, 269415)
        : income < 8820000
          ? Math.min(
              beforeReduction,
              Math.max(0, Math.round(842973 - (income * 95575) / 1000000)),
            )
          : 0;
    const tax = beforeReduction - reduction;
    return {
      deduction: Math.min(income, deduction),
      base,
      beforeReduction,
      reduction,
      tax,
      balance: tax - input.withheldCents,
    };
  };
  const simplified = calculate(simplifiedDeduction),
    legal = calculate(legalDeduction);
  return {
    income,
    simplified,
    legal,
    best:
      legal.tax < simplified.tax ? ('legal' as const) : ('simplified' as const),
    outsideScope: income > 60000000,
  };
}
