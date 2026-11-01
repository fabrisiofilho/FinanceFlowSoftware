# Contabily — auditoria funcional, consolidação e roadmap V2

**Data:** 2026-11-01  
**Repositório analisado:** https://github.com/fabrisiofilho/FinanceFlowSoftware (branch `main`)  
**Natureza:** diagnóstico estático orientado a produto, não homologação funcional completa.  
**Fontes:** README.md, AGENTS.md, docs/PLANO.md, docs/VALIDACAO.md, package.json, rotas, menu, serviços de dashboard e investimentos, controller e repository de investimentos, inventário da árvore do repositório (603 entradas). Não foram executados testes locais nem fluxos reais com banco; a classificação das demais telas requer validação em execução antes de exclusão.

## 1. Decisão de produto

O Contabily deve ser um **gerenciador financeiro pessoal e patrimonial local-first**, não um ERP contábil fiscal. A primeira tela precisa responder em segundos: **quanto tenho disponível; quanto entrou/saiu; o que vence; quanto está investido; quanto posso gastar; e como evoluiu meu patrimônio?**

Os eixos são: (1) dinheiro e movimentos; (2) planejamento, obrigações e metas; (3) carteira e patrimônio; (4) análises. A navegação deve ser simples; complexidade deve aparecer progressivamente quando solicitada.

## 2. O que existe de fato e o que não está homologado

### Confirmado por código/documentação
- Electron, React, TypeScript, Material UI, Redux Toolkit, TypeORM, SQLite via `better-sqlite3`.
- Tela de dashboard; transações; contas; cartões; metas; categorias; alertas; relatórios; orçamento; transferências; recorrências; fluxo de caixa; relatórios avançados; importação de transações; investimentos; manual.
- Investimentos têm cadastro, valor inicial em centavos, registro mensal manual de rendimento (um por competência com upsert), exclusão, projeção por taxa mensal digitada, sem integração automática com contas.
- Painel usa seleção de mês, mas seu serviço mistura indicadores do mês selecionado com informações atuais e série dos últimos seis meses.
- Testes declarados de regras específicas e verificações descritas em `docs/VALIDACAO.md`; parte dos testes visuais usa IPC fictício.
- O README reconhece que módulos herdados não estão todos homologados.

### Não assumir como pronto
- Fluxo real de pagamento/baixa, competência versus liquidação, parcelamentos íntegros de ponta a ponta, restauração integral testada, conciliação bancária, movimentos de investimentos integrados a contas, performance de dados reais e instalador validado em uso cotidiano.
- A presença de arquivo de página, controller, tabela ou rota **não prova qualidade funcional**.

## 3. Matriz de decisão — manter, melhorar, unificar, ocultar ou adicionar

| Área encontrada | Decisão proposta | Resultado desejado | Prioridade | Observação de evidência |
|---|---|---|---|---|
| Dashboard | **MANTER + MELHORAR** | visão do período, realizado e previsto separados; saldo disponível, próximos vencimentos e patrimônio; ações rápidas | P0 | serviço inspecionado |
| Transações | **MANTER + MELHORAR** | lançamento rápido, busca, filtros persistentes, status, competência, vencimento e liquidação | P0 | rota + README |
| Contas | **MANTER + MELHORAR** | saldo reconciliável, inicial e atual, transferência, histórico, arquivamento | P0 | rota + README |
| Cartões | **MANTER + HOMOLOGAR** | compras, parcelas, fechamento, vencimento e pagamento sem contagem dupla | P0 | rota + módulos herdados |
| Transferências | **UNIFICAR NA EXPERIÊNCIA** | mesma ação de novo movimento, operação própria no domínio; sem afetar receita/despesa | P0 | rota própria existente |
| Categorias | **MANTER, MOVER PARA CONFIGURAÇÕES** | gestão com arquivamento e histórico intacto | P1 | rota existente |
| Recorrentes | **UNIFICAR NO CADASTRO** | opção recorrente no lançamento e gestão em tela secundária | P1 | rota própria existente |
| Orçamento | **MANTER + MELHORAR** | limite por categoria, gasto realizado, comprometido e alertas discretos | P1 | rota existente |
| Metas | **MANTER + INTEGRAR** | reserva, entrada do imóvel e outros objetivos com progresso por aportes efetivos | P1 | rota existente |
| Investimentos | **MANTER + RECONSTRUIR MODELO OPERACIONAL** | aportes, resgates, rendimentos, taxas, IR, posição e conciliação com contas | P0/P1 | código inspecionado: hoje manual/simulado |
| Fluxo de caixa | **UNIFICAR COM PLANEJAMENTO** | visão futura baseada em obrigações e recorrência, sem outra verdade financeira | P1 | rota própria |
| Relatórios + relatórios avançados | **UNIFICAR** | uma página com básico e análise avançada sob filtros comuns | P1 | duas rotas existentes |
| Importar transações | **MOVER PARA CONTAS > IMPORTAR** | CSV/OFX quando suportado, prévia, deduplicação, conciliação, rollback | P1 | rota existe; formato/fluxo devem ser verificados |
| Alertas | **MOVER PARA PREFERÊNCIAS/SININHO** | central de notificações com configurações agrupadas e silenciamento | P2 | notificação/documentação existentes |
| Manual | **MANTER CONTEXTUAL** | ajuda acessível no rodapé e links em telas, não item principal | P2 | menu já separa do restante |
| Login/usuário local | **MANTER, REVISAR UX/SEGURANÇA** | primeiro acesso simples, isolamento de dados e recuperação consciente | P1 | README descreve usuário local |
| Atualização herdada / referências corporativas antigas | **REMOVER SÓ APÓS CONFERIR USO** | eliminar artefatos e branding não utilizados sem quebrar build | P2 | pacote contém updater; árvore contém assets legados |
| Backup versionado e restauração | **ADICIONAR/CONCLUIR** | backup íntegro, importação atômica, validação e recuperação ensaiada | P0 | explicitamente pendente |
| Patrimônio consolidado | **ADICIONAR** | caixa + aplicações + demais bens − obrigações, com rastreabilidade | P1 | nova capacidade |
| Fechamento/conciliação mensal | **ADICIONAR** | identificar divergências e finalizar mês sem perda de ajuste auditável | P1 | nova capacidade |

**Importante:** “unificar” significa a experiência/navegação, **não apagar controllers, tabelas ou regras especializadas**. Remoções destrutivas só com inventário de referências, migração, backup, testes e aceite.

## 4. Navegação recomendada

- **Visão geral**: dashboard pessoal (primeira rota).
- **Movimentações**: receitas, despesas, transferências, recorrências e parcelamentos por abas/filtros e ação única “Novo”.
- **Contas e cartões**: contas, cartões, faturas e importação/conciliação.
- **Investimentos**: posição, eventos, performance, simulações e proventos.
- **Planejamento**: orçamento, contas futuras, fluxo projetado e metas.
- **Análises**: relatórios consolidados com filtros e exportações.
- **Configurações**: categorias, alertas, backup/restauração, preferências e segurança.
- **Ajuda**: acesso contextual/fixo.

Evitar que todas as rotas internas apareçam como opções primárias do menu. Manter URLs/redirects antigos durante transição.

## 5. Cinco fluxos cotidianos que devem ficar excelentes

### 5.1 Anotar um gasto em poucos segundos
Clique em `+ Novo` > `Despesa`; valor, descrição, conta/cartão e categoria (sugestão pelo histórico); data padrão hoje. Campos avançados recolhidos: vencimento, competência, parcelamento, tags, anexo e recorrência. Enter salva com confirmação e permite cadastrar outro. Erro mantém o formulário intacto.

### 5.2 Compra com cartão e pagamento de fatura
A compra entra na fatura correspondente, por fechamento e vencimento, respeitando parcelas; o pagamento transfere dinheiro da conta para amortização da obrigação. **Não lançar a compra e o pagamento simultaneamente como duas despesas.** Separar consumo por competência de saída de caixa por liquidação.

### 5.3 Renda fixa aplicada a partir da conta
Aplicação em CDB: debitar da conta de origem e creditar posição financeira (não é despesa); registrar aporte, rendimento, resgate, IR/IOF quando cabível, taxas e datas. A posição total deve conciliar com caixa e patrimônio.

### 5.4 Conferência semanal
Dashboard mostra valores pendentes, vencimentos próximos, transações sem categoria, eventual diferença de saldo e rendimentos ainda não registrados. Ações disponíveis no próprio contexto: liquidar, conciliar, corrigir e dispensar alerta.

### 5.5 Revisão do mês
Filtrar o mês; distinguir receitas/despesas por competência, entradas/saídas por liquidação, saldo de caixa e resultado; comparar orçamento versus realizado; fechar mês com checklist e reabrir mediante registro de alteração.

## 6. Regras financeiras que bloqueiam release se incorretas

1. **Dinheiro:** usar inteiro em centavos para BRL, sem cálculos intermediários em ponto flutuante; introduzir migração de dados decimais existentes com política explícita de arredondamento e testes.
2. **Datas:** competência (`YYYY-MM`), vencimento (`YYYY-MM-DD`), liquidação (`YYYY-MM-DD`) e timestamp técnico são conceitos distintos.
3. **Situação:** pendente, liquidado, cancelado/estornado com regras e trilha de mudanças; não inferir pagamento só porque passou uma data.
4. **Transferência:** movimenta contas sem receita/despesa.
5. **Cartão:** compra afeta consumo/obrigação; pagamento afeta conta/obrigação; sem contagem dupla.
6. **Investimento:** aporte/resgate desloca patrimônio; rendimento positivo/negativo altera valor patrimonial, com fluxo realizado separado de valorização não realizada.
7. **Parcelas:** soma das parcelas igual ao total original; ajustes de centavos tratados deterministicamente; edição de grupo com confirmação.
8. **Recorrências:** geração idempotente; evitar entradas duplicadas, definir comportamento ao mudar regras.
9. **Importação:** prévia antes de gravar, deduplicação, rollback e associação inequívoca à conta.
10. **Auditoria:** rastrear criação, edição, estorno, exclusão lógica/arquivamento; conciliação não deve desaparecer silenciosamente.
11. **Histórico e backups:** migrações versionadas, backup antes das destrutivas, teste de restauração.
12. **Cálculos e UI:** dashboard e relatórios devem usar as mesmas definições de indicadores e filtros, não somas paralelas contraditórias.

## 7. Diagnósticos específicos encontrados no código

### 7.1 Dashboard com recortes de datas mistos
`DashboardService.getDashboardData(userId, filters)` aplica ano/mês ao resumo e categorias, mas obtém série dos **últimos seis meses**, transações recentes, próximos vencimentos e saldos **atuais**. Isso é aceitável se cada bloco for rotulado, mas induz percepção incorreta de que tudo corresponde ao mês escolhido. Além disso, `getProjectedBalance` soma transações até o fim do mês atual sem demonstrar que filtra somente pendências, podendo contar dinheiro já refletido no saldo. **Ação P0:** estabelecer contrato explícito para cada indicador e testar previsão contra pagamentos e saldo de abertura.

### 7.2 Investimentos ainda não possuem livro de movimentações
O cadastro grava `principal_cents`, `monthly_rate` e `start_month`; rendimentos são gravados em `investment_yields` uma vez por mês. A tela calcula `principal + soma(rendimentos)`, e informa que não movimenta contas. Não há no fluxo inspecionado operações de aporte adicional, resgate, compra/venda, imposto, custódia ou remuneração vinculada a índices. **Ação P0/P1:** manter registros existentes e adicionar eventos financeiros com importação/migração segura; não substituir diretamente o histórico manual.

### 7.3 Menu principal excessivamente granular
`panel.routes.tsx` declara 16 rotas (incluindo Manual), com Relatórios e Relatórios Avançados separados, além de Transferências, Recorrentes e Importar Transações como destinos primários. **Ação P1:** grupos e ações contextuais; medir cliques para cinco fluxos cotidianos.

### 7.4 Legado e documentação não são prova de funcionamento
O README diz explicitamente que módulos herdados não foram integralmente homologados. `docs/VALIDACAO.md` documenta testes sintéticos, mas também limitações em integrações, formulários, restauração e instalador. **Ação P0:** homologação funcional antes de exclusões ou da classificação “pronto”.

### 7.5 Contraste entre base e evolução planejada
O plano prevê centavos inteiros para todos os lançamentos, distinção entre competência e liquidação, backup integral e importação atômica. Já o código legado de dashboard ainda converte `entity.amount` para `Number` e trabalha com `transactionDate`. **Ação P0:** migrações e regras de consolidação antes de relatórios patrimoniais.

## 8. Modelo conceitual recomendado

- `Account`: conta monetária e saldo conciliado.
- `Category`: classificação, tipo, status ativo/arquivado.
- `FinancialEntry`: intenção/obrigação (receita/despesa), competência, vencimento, status, origem, recorrência e grupo de parcelas.
- `Settlement`: liquidação parcial/integral, data, conta, valor, comprovante.
- `AccountMovement`: débito/crédito imutável ou compensado por estorno; referencia liquidação, transferência ou evento de investimento.
- `CreditCard`, `CardPurchase`, `Invoice`, `InvoicePayment`: ciclo de obrigação e pagamento.
- `RecurrenceRule`, `InstallmentSchedule`: geração idempotente e previsibilidade.
- `InvestmentAsset`, `InvestmentHolding`, `InvestmentEvent`: aporte, aplicação, compra, venda, resgate, rendimento, distribuição, taxa, imposto e ajuste.
- `PriceObservation`, `BenchmarkObservation`: marcação de preço/índices, com origem, data e confiabilidade; offline/manual inicialmente.
- `Budget`, `Goal`, `GoalAllocation`: objetivos versus dinheiro realmente alocado, sem duplicar patrimônio.
- `ImportBatch`, `ImportCandidate`, `Reconciliation`: deduplicação, correspondência e reversão.
- `AuditEvent`, `SchemaMigration`, `BackupManifest`: rastreabilidade e recuperação.

**Estratégia:** não criar tudo em uma grande migração. Fazer desenho de compatibilidade com entidades existentes, incrementar por domínio, manter scripts reversíveis onde possível. Evitar modelo contábil genérico excessivo se os movimentos simples e invariantes resolverem o produto.

## 9. Investimentos — escopo realista e incremental

**V1 melhorada:** cadastrar instituição, classe, produto, índice/referência, liquidez, vencimento, valor aplicado, eventos de aporte/resgate e rendimento observado; conciliar movimento de dinheiro; consolidar carteira por instituição/classe; exibir bruto, imposto estimado quando regras aplicáveis forem configuradas, líquido estimado e histórico.

**V2:** CDB pós-fixado ao CDI, prefixado, IPCA+, Tesouro Direto e fundos; títulos e taxas por lote; calendário, impostos, datas de carência e indicadores de risco. Modelar regras tributárias versionadas e conferir legislação vigente antes do cálculo automatizado; não simular como garantia.

**V3:** ações/FIIs/ETFs, dividendos, amortizações, preço médio e eventos corporativos; moeda estrangeira e câmbio por evento; custo de aquisição e impostos. Preços de mercado externos somente com fonte, timestamp, consentimento e política de ausência de dados.

**Sempre:** separar `aporte`, `saldo investido`, `rendimento acumulado`, `rendimento realizado`, `rentabilidade percentual` e `projeção hipotética`. Não misturar rendimento digitado com projeção. Exibir avisos claros quando rentabilidade é estimada, e nunca somar duas vezes resgates ou aplicações.

## 10. Dashboard cotidiano — ordem de importância

1. **Saldo disponível** das contas, excluindo cartões e investimentos.
2. **Recebido / pago** no mês selecionado (efetivo).
3. **Previsto / a vencer**, com diferença entre planejado e realizado.
4. **Gastos por categoria** e comparação com orçamento.
5. **Vencimentos e faturas** com ação de baixa.
6. **Carteira e patrimônio líquido** com data de atualização.
7. **Evolução de meses** e alertas relevantes, recolhidos por padrão se não exigirem ação.

Card deve abrir detalhe filtrado com o mesmo período; legendas de disponibilidade, competência, liquidação e atualização devem ser visíveis. Não impor gráficos decorativos ou muitos cards em primeiro plano.

## 11. Usabilidade e acessibilidade

- Uma ação primária `+ Novo` global, com atalhos; não duplicar formulários diferentes para a mesma regra.
- Autocomplete de descrição/categoria/conta pelo histórico local, sem enviar dados a serviços externos.
- Campos mínimos primeiro; avançados sob expansão. Navegação por teclado, foco restaurado ao fechar modal, labels e erros próximos ao campo.
- Estados vazios guiados, skeletons, confirmação de ações destrutivas, undo/estorno quando possível e mensagens sem termos técnicos.
- Filtros de mês persistentes e contextualizados; opção explícita para limpar filtros.
- Preferências de notificações agrupadas; permitir desligar avisos que não dependam de segurança.
- Dark neutro, tokens visuais, `ExpandableCard` e `ContentSurface` existentes; não reintroduzir modo claro sem nova decisão documentada.
- Performance: carregamento paginado e agregações SQL; evitar buscar todo o histórico no renderer por padrão.

## 12. Privacidade, segurança e confiabilidade

Electron com isolamento de contexto e IPC validado; main concentra DB, arquivos e importações. SQL parametrizado e escopo de usuário em todas as consultas. Não inserir detalhes financeiros em logs de produção, crash reports nem exemplos versionados. Backups podem conter dados extremamente sensíveis: oferecer criptografia por senha (com KDF apropriado) e teste de recuperação; deixar explícito que esquecer a senha impede leitura do backup. Oferecer exportação sem criptografia apenas com aviso.

Evitar sincronização bancária até que um provedor e modelo de consentimento sejam definidos. Arquivos CSV importados e exportados devem proteger contra fórmulas perigosas. Verificar acesso a caminhos de arquivos, anexos, navegação do Electron e empacotamento. Não reutilizar atualizador herdado sem canal próprio.

## 13. Sequência de implementação para o Codex

### Fase 0 — inventário e proteção de dados (P0)
- Registrar SHA da revisão do repositório e snapshot de rotas/entidades/IPC/tabelas.
- Rodar lint, typecheck, testes, SQLite e build, e registrar baseline.
- Backup integral, validação e ensaio de restauração em banco temporário; nunca executar testes no banco pessoal.
- Escrever testes de invariantes financeiras atuais e casos que falham.

### Fase 1 — semântica financeira correta (P0)
- Migração para centavos inteiros nas transações legadas, preservando moeda e datas.
- Competência, vencimento, liquidação, pendências e saldos; contratos de totais, transferência e cartão.
- Corrigir projeção do dashboard e garantir que gráficos e relatórios usem mesma semântica.

### Fase 2 — experiência e navegação (P1)
- Unificar navegação e entrada rápida, mantendo caminhos antigos como redirecionamentos.
- Consolidar relatórios, mover importação para contas, categorias para configurações, recorrências para ação contextual.
- Testar percursos: gasto em até 3 passos essenciais, compra parcelada, pagamento de fatura, aplicação e conferência mensal.

### Fase 3 — carteira patrimonial (P1)
- Implementar eventos de investimento e movimentações vinculadas a contas.
- Migrar histórico manual sem perder rendimentos, projeções e identificadores.
- Patrimônio e alocação, aportes, resgates, rentabilidade por período e explicação de cálculos.

### Fase 4 — automação e sofisticação (P2)
- Importação/conciliação inteligente, orçamento e metas ligados a patrimônio, projeções de fluxo.
- Indexadores/tributação versionados, investimentos multiativos, moeda estrangeira e relatórios exportáveis.

## 14. Critérios de aceite essenciais

| Caso | Esperado |
|---|---|
| Receita R$ 5.000 e despesa R$ 1.200 liquidadas no mês | realizado R$ 3.800 |
| Despesa pendente R$ 500 | altera previsto, não realizado nem saldo disponível |
| Transferência de R$ 1.000 entre contas | total de caixa inalterado, receita/despesa zero |
| Compra cartão R$ 600 em 3 parcelas | R$ 600 de consumo sem duplicação no pagamento da fatura |
| Aplicação de R$ 10.000 em CDB a partir da conta | caixa −R$ 10.000; carteira +R$ 10.000; patrimônio líquido inalterado antes de taxas |
| Resgate de R$ 2.000 sem rendimento | caixa +R$ 2.000; carteira −R$ 2.000; não vira salário/receita |
| Rendimento positivo de R$ 100 | patrimônio +R$ 100; caixa só muda quando recebido/resgatado, conforme produto |
| Troca de mês | todo bloco indica sua própria referência temporal |
| Importação inválida | nenhum dado alterado |
| Backup restaurado | mesmos saldos, histórico e vínculos no banco restaurado |
| Reiniciar app | mesmas posições e lançamentos |
| Edição/estorno | histórico coerente, sem números fantasmas |

## 15. Prompt principal para Codex

> Leia `AGENTS.md`, `README.md`, `docs/DIRETRIZES.md`, `docs/PLANO.md`, `docs/VALIDACAO.md` e este documento. Não implemente tudo de uma vez. Primeiro gere um inventário validado de arquivos, rotas, IPC, entidades, migrações e testes associados a cada item da matriz; identifique riscos de dados e discrepâncias entre documentação e código. Preserve o banco pessoal e as funcionalidades homologadas. Execute a Fase 0 em branch própria, com testes antes de alterações destrutivas. Para cada mudança, apresente: decisão (manter/melhorar/unificar/ocultar/remover/adicionar), evidência do código, plano de migração, critérios de aceite, testes e riscos. Só depois implemente pequenas entregas ordenadas. Não reative atualização automática nem publique releases. Nunca apague tabelas ou dados para simplificar refatorações.

## 16. Checklist para auditoria final em execução

- [ ] Percorrer cada tela real com banco fictício de múltiplos meses e contas.
- [ ] Validar entradas, edições, exclusões, erros e transações parciais.
- [ ] Conferir cartão/parcelamento e vencimento versus liquidação.
- [ ] Conferir transferências e totais em relatório/dashboard.
- [ ] Conferir recorrência idempotente após reinício.
- [ ] Conferir conciliação/importação e detecção de duplicados.
- [ ] Conferir carteira e contas em aplicação/resgate.
- [ ] Conferir notificações e atalhos reais no Windows.
- [ ] Conferir backup, restauração, atualização por migração e instalador.
- [ ] Conferir teclado, foco, tamanhos de janela e cenários sem dados.

---

**Conclusão:** preservar a base e suas funcionalidades úteis, reduzir a fragmentação do menu, corrigir primeiro a semântica de dinheiro e datas, conectar investimento ao caixa e só depois ampliar a sofisticação. Esta é uma matriz de decisões fundamentada em inspeção estática parcial; exclusões e homologações requerem exploração e testes do aplicativo real.
