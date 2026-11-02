import { useState } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { PageContainer, ContentSurface } from '@renderer/components/PageLayout';
import { PageHeader } from '@renderer/components/PageHeader';
import { CurrencyInput } from '@renderer/components/Form/CurrencyInput';
import { Input } from '@renderer/components/Form/Input';
import { AppAlert } from '@renderer/components/Feedback';
import {
  simulateIncomeTax,
  INCOME_TAX_SOURCE,
  type IncomeTaxInput,
} from '@shared/finance/income-tax';
import { formatCurrency } from '@renderer/utils/currency';

const empty: IncomeTaxInput = {
  taxableCents: 0,
  expectedCents: 0,
  withheldCents: 0,
  socialSecurityCents: 0,
  medicalCents: 0,
  dependents: 0,
  educationCents: [0],
  pensionCents: 0,
  pgblCents: 0,
};
const fields = [
  [
    'taxableCents',
    'Renda tributável já recebida',
    'Total bruto, incluindo rendimentos tributáveis dos dependentes.',
  ],
  [
    'expectedCents',
    'Renda tributável prevista até dezembro',
    'Somente o restante do ano. Não repita o valor já recebido.',
  ],
  [
    'withheldCents',
    'IR retido e antecipações no ano',
    'Inclua apenas imposto compensável no ajuste e sua previsão restante.',
  ],
  [
    'socialSecurityCents',
    'Previdência oficial (INSS)',
    'Total anual dedutível, incluindo a previsão restante.',
  ],
  [
    'medicalCents',
    'Saúde dedutível',
    'Despesas elegíveis menos reembolsos, com comprovantes.',
  ],
  [
    'pensionCents',
    'Pensão alimentícia dedutível',
    'Somente pagamentos admitidos pela legislação.',
  ],
  [
    'pgblCents',
    'PGBL elegível',
    'Limitado a 12% da renda tributável. Exige atender às condições legais; VGBL não é dedutível.',
  ],
] as const;
const money = (cents: number) => formatCurrency(cents / 100);
export function IncomeTaxPage() {
  const [input, setInput] = useState<IncomeTaxInput>(empty);
  const [result, setResult] = useState<ReturnType<
    typeof simulateIncomeTax
  > | null>(null);
  const [error, setError] = useState('');
  function change(next: IncomeTaxInput) {
    setInput(next);
    setResult(null);
    setError('');
  }
  function calculate() {
    try {
      setResult(simulateIncomeTax(input));
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Revise os dados.');
    }
  }
  return (
    <PageContainer>
      <PageHeader
        title="Simulação de IR"
        description="Ano-calendário 2026 · declaração de 2027. Planeje o ajuste anual por contribuinte."
      />
      <Stack spacing={3}>
        <AppAlert severity="info">
          Informe valores brutos anuais e deduções elegíveis. Entradas de conta
          não são automaticamente renda tributável. A simulação fica nesta tela
          e não altera lançamentos.
        </AppAlert>
        <ContentSurface sx={{ p: 3 }}>
          <Typography variant="h6" mb={2}>
            Rendimentos e deduções
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 3,
            }}
          >
            {fields.map(([key, label, helper]) => (
              <CurrencyInput
                key={key}
                label={label}
                helperText={helper}
                value={input[key] / 100}
                onChange={(value) =>
                  change({ ...input, [key]: Math.round(value * 100) })
                }
              />
            ))}
            <Input
              label="Dependentes elegíveis"
              type="number"
              value={input.dependents}
              slotProps={{ htmlInput: { min: 0, max: 30, step: 1 } }}
              helperText="Inclua a renda dos dependentes no total bruto acima."
              onChange={(event) => {
                const count = Number(event.target.value);
                if (Number.isInteger(count) && count >= 0 && count <= 30)
                  change({
                    ...input,
                    dependents: count,
                    educationCents: Array.from(
                      { length: count + 1 },
                      (_, index) => input.educationCents[index] ?? 0,
                    ),
                  });
              }}
            />
            {input.educationCents.map((value, index) => (
              <CurrencyInput
                key={index}
                label={
                  index === 0
                    ? 'Educação do titular'
                    : `Educação do dependente ${index}`
                }
                helperText="Somente instrução elegível; limite aplicado individualmente."
                value={value / 100}
                onChange={(value) =>
                  change({
                    ...input,
                    educationCents: input.educationCents.map((old, position) =>
                      position === index ? Math.round(value * 100) : old,
                    ),
                  })
                }
              />
            ))}
          </Box>
          <Stack direction="row" spacing={2} mt={3}>
            <Button variant="contained" onClick={calculate}>
              Calcular simulação
            </Button>
            <Button onClick={() => change({ ...empty, educationCents: [0] })}>
              Limpar
            </Button>
          </Stack>
        </ContentSurface>
        {error && <AppAlert severity="error">{error}</AppAlert>}
        {result &&
          (result.outsideScope ? (
            <AppAlert severity="warning">
              Renda acima de R$ 600 mil exige avaliar a tributação mínima de
              altas rendas. Esta simulação não apresenta um fechamento para esse
              caso.
            </AppAlert>
          ) : (
            <>
              <AppAlert severity="success">
                Menor imposto estimado:{' '}
                {result.best === 'legal'
                  ? 'deduções legais'
                  : 'desconto simplificado'}
                . Renda anual projetada: {money(result.income)}.
              </AppAlert>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: 3,
                }}
              >
                {(['simplified', 'legal'] as const).map((mode) => {
                  const item = result[mode];
                  return (
                    <ContentSurface key={mode} sx={{ p: 3 }}>
                      <Typography variant="h6" mb={2}>
                        {mode === 'legal'
                          ? 'Deduções legais'
                          : 'Desconto simplificado'}
                      </Typography>
                      <Stack spacing={1}>
                        <Typography>
                          Deduções: {money(item.deduction)}
                        </Typography>
                        <Typography>
                          Base tributável: {money(item.base)}
                        </Typography>
                        <Typography>
                          Redução de 2026: {money(item.reduction)}
                        </Typography>
                        <Typography>
                          Imposto anual: {money(item.tax)}
                        </Typography>
                        <Typography
                          variant="h6"
                          color={
                            item.balance > 0 ? 'warning.main' : 'primary.main'
                          }
                        >
                          {item.balance > 0
                            ? 'A pagar'
                            : item.balance < 0
                              ? 'A restituir'
                              : 'Saldo zero'}
                          : {money(Math.abs(item.balance))}
                        </Typography>
                        {item.balance > 0 && (
                          <Typography color="text.secondary">
                            Reserva mensal em 12 meses:{' '}
                            {money(Math.ceil(item.balance / 12))}
                          </Typography>
                        )}
                      </Stack>
                    </ContentSurface>
                  );
                })}
              </Box>
            </>
          ))}
        <AppAlert severity="warning">
          Estimativa do ajuste ordinário, sem 13º salário, PLR, ganhos de
          capital, bolsa, renda exterior ou tributação mínima. Não determina
          obrigação de declarar e não envia declaração. Confira os informes e as
          regras de elegibilidade antes de usar o resultado.
        </AppAlert>
        <Typography variant="body2" color="text.secondary">
          Fonte:{' '}
          <a href={INCOME_TAX_SOURCE} target="_blank" rel="noreferrer">
            Receita Federal · tabelas de 2026
          </a>
          . Verificadas em 02/11/2026.
        </Typography>
      </Stack>
    </PageContainer>
  );
}
