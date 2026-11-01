# 001 — Reutilizar a base Electron

Data: 2026-11-01

## Contexto

FinanceFlowSoftware já contém React, TypeScript, TypeORM/SQLite e separação main/preload/renderer. Reescrever os módulos financeiros duplicaria estrutura existente e ampliaria o risco de regressões.

## Decisão

Reutilizar a base e seus serviços/repositórios, criar identidade Contabily e priorizar consulta mensal de ganhos e gastos. Manter os módulos adicionais da base sem expandi-los nesta etapa. Não trocar bibliotecas nem o esquema financeiro antes de validar os fluxos existentes.

Desativar integralmente o updater herdado: não consultar releases do produto anterior nem carregar credenciais embutidas. Manter o contrato IPC de versão/estado para compatibilidade com a interface. Usar appId e nome de produto próprios para separar instalações e dados.

## Consequências

O primeiro incremento conserva valores decimais em reais e a data única de transação da base. Centavos inteiros, competência separada de liquidação e backup transacional exigem migrações e testes próprios; são planejamento, não funcionalidades entregues. O sandbox do preload precisa de avaliação antes de ser ativado, pois sua compilação depende da estrutura existente. Nenhuma alteração será enviada ao remoto de origem automaticamente.