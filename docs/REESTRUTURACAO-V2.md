# Reestruturação V2 — primeira entrega

## Atualização de autorização — 2026-11-01

O proprietário informou que não há usuários nem dados a preservar e autorizou alterações incompatíveis sem migração do banco anterior. Ele fará a limpeza do banco quando avisado. Essa decisão substitui os requisitos de migração e de backup prévio como bloqueio descritos abaixo, preservados como histórico do plano inicial. Não apagar bancos automaticamente. Mudanças financeiras continuam exigindo testes e indicação explícita da necessidade de banco novo. Trabalhar e publicar na branch principal existente `main` (referida como master pelo proprietário), sem branches de tarefa. A entrega de navegação não exige limpar o banco; a próxima revisão do esquema deverá documentar essa necessidade.

Referência: [auditoria recebida](reference/AUDITORIA-V2.md). Produto: gerenciador financeiro pessoal e patrimonial local, sem escopo fiscal. Branch: refactor/contabily-v2-foundation. A revisão exata, rotas, páginas, entidades, serviços, repositórios, canais IPC, migrações e testes estão em [INVENTARIO-V2.json](INVENTARIO-V2.json); atualizar com `node scripts/inventory.mjs` na raiz do projeto. Inventário estático não é homologação.

## Entregue nesta etapa

### Base dos lançamentos — implementação iniciada

- TransactionService executa criação, edição, exclusão e exclusão em lote usando repositórios vinculados ao mesmo EntityManager transacional. Grupos de parcelas/recorrências e seus ajustes de saldo são confirmados ou revertidos juntos.
- entry-schedule.ts centraliza divisão em centavos, validação de precisão e calendário ancorado. Parcelas conservam a soma; o ajuste fica na última, também mostrado na prévia do formulário. Semanas avançam sete dias e o dia 31 não transborda fevereiro.
- calendar-date.ts centraliza leitura de datas locais entre main e renderer, rejeitando datas inválidas em vez de normalizá-las silenciosamente.
- Não há mudança de esquema neste bloco e não é necessário limpar o banco para usá-lo. Armazenamento decimal legado, status pendente/liquidado, separação de competência/liquidação e integração de investimentos com contas ainda estão pendentes. A lógica de saldos futura será substituída pelo modelo de liquidação; esta entrega não deve ser interpretada como conclusão dessa fase.
- Testes de serviço usam repositórios e driver transacional fictícios, incluindo reversão de falha na segunda parcela. Testes SQLite existentes continuam cobrindo investimentos e migrações, não toda a integração ORM dos lançamentos.

- Melhorar: pontilhado menta translúcido somente no canto inferior direito do painel, fixo na área útil, sem bloquear cliques. Retirado o padrão repetido no fundo inteiro.
- Unificar experiência: oito destinos principais (incluindo ajuda), com páginas especializadas em subitens contextuais. Navegação de produto separada do registro de rotas em routes/navigation.ts. As 16 URLs continuam funcionando; nenhum controller, tabela ou funcionalidade foi excluído.
- Corrigir acesso: Categorias estava declarada nas rotas mas ausente dos grupos do menu. Agora integra Configurações, junto de Alertas. Importação fica em Contas e cartões; Fluxo de caixa e Metas em Planejamento; Relatórios avançados em Análises.
- Manter: dark neutro, formulários, indicadores, carregamento dos cards e central de notificações. Unificação nesta etapa é de navegação; as páginas e seus filtros ainda são especializados.

## Evidências e decisões para as próximas entregas

| Área | Evidência local | Decisão / critério antes de migrar |
|---|---|---|
| Dashboard | renderer/pages/Dashboard; main/application/services/dashboard-service.ts | Melhorar: renderer consulta contas/transações/relatórios diretamente, não o DashboardService agregado. Corrigir o contrato usado de fato antes de trocar indicadores. Rotular mês versus informações atuais. |
| Dinheiro e datas | transaction.entity.ts, transaction-service.ts, migrations/001_finance_flow_schema.sql | Migrar por domínio com cópia temporária, política de arredondamento, reconciliação antes/depois e teste de rollback. Não converter a base decimal silenciosamente. |
| Cartões e transferências | credit-card-service.ts, transfer-service.ts | Manter e homologar: compra/fatura/pagamento sem dupla despesa; transferência deve preservar caixa consolidado. Testes específicos ainda necessários. |
| Investimentos | investment-service.ts, investment-repository.ts, migrations/004_investments.sql | Manter histórico manual e projeções. Adicionar eventos e caixa em transação atômica, com migração dos identificadores; não reinterpretar rendimentos existentes como depósitos. |
| Backup e recuperação | infraestrutura SQLite e migrations; tests/sqlite-investments.mjs | Adicionar serviço dedicado, contrato IPC específico e ensaio de restauração integral em base temporária antes de qualquer migração financeira. Teste SQLite atual não equivale a backup completo. |
| Relatórios / importação | report-service.ts, bank-import-service.ts; tests/report-filters.test.mjs | Unificar filtros apenas após conferir semântica e formatos realmente suportados; testar prévia, duplicidade e rollback. |
| Legado / updater | infrastructure/auto-updater | Manter desativado; remoção exige inventário de referências e build. Nenhuma exclusão nesta etapa. |

Caminhos de serviços acima são relativos a src/main/application/services; caminhos de entidades a src/main/application/entities. As fontes completas constam no inventário.

## Sequência e limites

1. Fundação: inventário e baseline; navegação reversível entregue. Backup/restauração integral e homologação real de todos os fluxos continuam pendentes na Fase 0.
2. Semântica: centavos, competência, vencimento e liquidação, testes de saldos e cartão. Só iniciar alterações persistentes após a recuperação integral estar ensaiada.
3. Experiência: ação Novo compartilhada e análises sob filtros comuns, preservando contratos especializados.
4. Carteira: eventos de aporte/resgate e conta de origem, com migração conciliada e testes de patrimônio.
5. Sofisticação: conciliação, fechamento mensal, índices e tributos versionados.

Critérios financeiros são os da auditoria: R$5.000 recebidos menos R$1.200 pagos = R$3.800; pendência não altera realizado; aplicação troca caixa por posição sem criar despesa. Esses critérios são metas de teste; não afirmar que todo o legado já os cumpre. Não foi criado backup do banco pessoal nem executada migração sobre ele. Nenhum lançamento foi alterado.
