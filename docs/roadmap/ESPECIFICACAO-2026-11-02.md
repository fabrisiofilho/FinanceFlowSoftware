# Contabily — Análise funcional, técnica e roadmap de evolução

**Data:** 02/11/2026  
**Repositório:** https://github.com/fabrisiofilho/contabily  
**Versão declarada em `package.json`:** 2.2.2  
**Objetivo:** melhorar a experiência de uso pessoal, confiabilidade financeira, consumo de recursos, tamanho do instalador e preparar um aplicativo Android/iOS de núcleo reduzido.

> **Nível de evidência.** Esta análise foi baseada em arquivos do repositório obtidos via GitHub (`README.md`, `package.json`, `electron-builder.yml`) e documentos técnicos existentes (`docs/REVISAO-COMPLETA-2026-11-02.md`, `docs/ENTREGA-2.1.0.md`, `docs/RELEASE-2.2.0.md`, `docs/INVENTARIO-V2.json`, entre outros). A auditoria de 2.0.1 é histórica e diversos defeitos ali listados foram corrigidos em 2.1.0. **Não foi realizado clone completo, profiling, medição real de memória, build ou teste manual da versão 2.2.2 nesta revisão.** Itens não verificados são hipóteses ou tarefas de validação, não defeitos comprovados.

## 1. Parecer executivo

**Conclusão:** o Contabily faz sentido como aplicativo de finanças pessoais *local-first*, especialmente para uma pessoa gerenciar receitas, despesas, contas, cartões, investimentos e planejamento. O escopo atual já é amplo; adicionar mais módulos sem simplificar a navegação pode reduzir a utilidade. O principal ganho imediato será **menos cliques para registrar movimentações**, projeções que não confundam rendimento hipotético com patrimônio real, e alertas acionáveis.

**Condição para utilização confiável como registro principal:** concluir ensaios ponta a ponta com banco SQLite real, ter backup criptografado restaurável e demonstrar reconciliação de saldos, cartões e investimentos. Os testes documentados são relevantes, mas ensaios com IPC fictício não substituem homologação integral. O programa não deve ser tratado como contabilidade fiscal profissional nem sincronização multiusuário.

### 1.1 Prioridades

| Prioridade | Trabalho | Justificativa |
|---|---|---|
| P0 | Backup/restauração testados, integridade monetária, autorização por perfil e regressões financeiras | Evitar perda ou exposição de dados |
| P1 | Modal global de receita/despesa, alertas x notificações, acessibilidade e scroll uniforme | Melhorar uso diário |
| P1 | Simulador CDB organizado e coluna acumulada | Clareza e correção dos cálculos |
| P1 | Telemetria local e otimização orientada a medições | Melhorar memória, inicialização e tamanho |
| P2 | Repositório React Native, MVP offline Android, APK de teste | Uso rápido fora do computador |
| P2 | Migração/importação segura entre desktop e mobile | Evitar dois históricos divergentes |
| P3 | Sincronização bidirecional, recursos familiares e automações avançadas | Depende de modelo de identidade, conflitos e segurança |

## 2. Inventário de funcionalidades existentes

A classificação a seguir combina presença de módulos e declarações do README/documentação. **Presente não significa integralmente homologado.**

| Área | Recursos encontrados/documentados | Decisão |
|---|---|---|
| Visão geral | Receitas, despesas, resultado, saldo atual, evolução e lançamentos recentes | Manter; rotular claramente mês selecionado x saldo atual; permitir detalhar composição |
| Transações | Receita, despesa, editar/excluir, categorias, conta, datas, liquidação, filtros e paginação | Núcleo principal; ação de lançamento global |
| Contas | Contas financeiras, saldos e ajuste, imagem/acento de identificação | Manter; reconciliar cada ajuste no histórico, permitir arquivamento |
| Cartões | Cartões, faturas, fechamento, vencimento, pagamentos | Manter; testar estornos, vencimentos e vínculo de compra |
| Transferências | Transferência entre contas, sem contabilizar como renda/despesa | Manter; preservar operação atômica |
| Categorias | Categorias por tipo e padrões iniciais | Permitir personalização/arquivamento com migração segura de vínculos |
| Orçamento | Limites por categoria/mês e avisos | Mostrar realizado, comprometido, disponível e excesso separadamente |
| Recorrências | Criação e geração de receitas/despesas repetitivas | Testar ocorrências vencidas, deduplicação e edição de série |
| Fluxo de caixa | Projeções financeiras e compromissos | Incluir pendências vencidas e faturas, separar previsão/realizado |
| Metas | Metas e contribuições | Manter aporte gerencial distinto de transferência real |
| Investimentos | Aplicações, movimentos, rendimentos mensais e projeção manual | Simplificar modal, acumulados e distinguir rendimento real/hipotético |
| Relatórios | Filtros, CSV e apresentação/exportação | Garantir PDF verdadeiro ou rotular HTML; paridade entre tela e exportação |
| Relatórios avançados | Tendências, comparações, padrões, saúde financeira | Nunca emitir score quando dados insuficientes |
| Importação | CSV, importação bancária, prévia e conciliação | Evidenciar duplicidade, sucesso parcial e erros por linha |
| Alertas | Regras/limiares de atenção e gestão de alertas | Separar de mensagens e preferências de entrega |
| Notificações | Sininho, central, leitura, descarte, preferências e avaliação local | Definir semântica e impedir duplicidades |
| IR | Simulação 2026/2027 por cenários manuais | Rotular limites e evitar prometer declaração fiscal |
| Moedas e dados externos | Referências de dólar/euro, Selic, CDI, IPCA e conversor | Manter fonte/data/unidades e cache, não equiparar a carteira multimoeda |
| Autenticação e perfis | Cadastro/login local, sessão e senha com hash | Esclarecer ausência de conta online e criptografia automática do banco |
| Backup e anexos | Backup integral criptografado, restauração, anexos e arquivos locais | Fluxo guiado, restore verificado, diretório claro e arquivos órfãos |
| Ajustes, ajuda e tour | Preferências, manual, busca, onboarding guiado | Manter; atualizar instruções conforme comportamento real |
| Atualização | Instalador Windows, GitHub Releases e atualizador | Validar instalação e atualização em máquina limpa |

**Organização:** cerca de 18 rotas funcionais no inventário V2, além de autenticação e componentes auxiliares; documentação da versão 2.2.0 menciona ensaio automatizado de 19 telas. Evitar misturar contagem de rotas com total de telas/variações.

## 3. CDB — Rendimentos e simulação

### 3.1 Objetivo

Redesenhar o modal detalhado do investimento para que o usuário encontre a informação desejada sem rolagem excessiva, conservando uma única fonte de dados para posições, eventos e rendimentos.

### 3.2 Estrutura recomendada

- **Cabeçalho fixo:** nome da aplicação, tipo, situação, saldo investido e ações principais (`Registrar rendimento`, `Aportar`, `Resgatar`). Distinguir valores realizados de estimativas.
- **Aba Resumo:** principal atualizado, rendimento registrado no período, total de rendimentos registrados, valor atual calculado e gráfico simples. Mostrar a data de referência.
- **Aba Rendimentos:** tabela por competência com mês, rendimento registrado, acumulado até o mês, impostos registrados (se houver) e observações. Permitir corrigir sem sobrescrever histórico indevidamente.
- **Aba Simulação:** principal de partida, taxa hipotética, período, aportes programados opcionais e tabela com mês, rendimento previsto, rendimento acumulado, aportes acumulados, saldo projetado. Campo de comparação de cenários somente se o fluxo básico estiver claro.
- **Aba Movimentações:** aportes, resgates, eventuais tributos/taxas e vínculos com contas; totais reconciliáveis.
- **Aba Detalhes:** instituição, tipo, vencimento, liquidez, indexador e metadados cadastrados, sem inventar taxa real.

**Usabilidade:** abas com conteúdo curto, tabelas paginadas/virtualizadas para 360 meses, cabeçalho e ações estáveis. Em telas pequenas, abas roláveis horizontalmente ou seleção simplificada. Não aplicar abas indiscriminadamente em formulários de poucos campos.

### 3.3 Nova coluna de rendimento acumulado

Na projeção, a coluna acumula somente os rendimentos hipotéticos mês a mês, *não* soma novamente o saldo inteiro do mês anterior:

```text
saldo[0] = principalInicial
rendAcum[0] = 0
aportesAcum[0] = 0

para m = 1 ... N:
    aporte = aporteProgramado[m]
    base = saldo[m-1] + (aporte se aporteNoInicioDoMes senão 0)
    rendimento = arredondarCentavos(base * taxaMensalDecimal)
    saldo[m] = saldo[m-1] + aporte + rendimento - resgate[m] - imposto[m] - taxa[m]
    rendAcum[m] = rendAcum[m-1] + rendimento
    aportesAcum[m] = aportesAcum[m-1] + aporte
```

Se o aporte for feito no fim do mês, não renderá neste mês. `saldoProjetado = principalInicial + aportesAcum + rendAcum - resgatesAcum - impostosAcum - taxasAcum`. Cada cenário deve declarar essa convenção e distinguir bruto de líquido. Se a simulação não modelar impostos, exibir **bruto, sem estimativa tributária**. O CDI consultado no Banco Central não substitui automaticamente uma taxa mensal de CDB; percentuais do CDI, dias úteis, taxas efetivas, IR regressivo e IOF devem ser uma evolução própria com testes.

**Exemplo simples:** R$ 10.000, taxa hipotética de 1% ao mês, sem novos aportes, resgates ou impostos.

| Mês | Rendimento do mês | Rendimento acumulado | Saldo projetado |
|---|---:|---:|---:|
| 1 | R$ 100,00 | R$ 100,00 | R$ 10.100,00 |
| 2 | R$ 101,00 | R$ 201,00 | R$ 10.201,00 |
| 3 | R$ 102,01 | R$ 303,01 | R$ 10.303,01 |

**Critérios de aceite:** 0–360 meses; taxa zero; taxa negativa se admitida explicitamente; arredondamento determinístico em centavos; aporte no início/fim; mesmo resultado ao reabrir; nenhuma projeção altera lançamentos ou rendimentos reais; exportação reproduz os mesmos números; total acumulado igual à soma de rendimentos mensais arredondados.

## 4. Modais, formulários e ação global

### 4.1 Ação `+ Novo` presente em qualquer tela

Adicionar botão global na barra superior (e atalho de teclado), que abre um menu **Receita**, **Despesa** e, se desejado, **Transferência**. O modal pertence ao layout raiz, não a uma página isolada. Ele deve abrir sobre qualquer rota, manter o contexto e devolver foco ao controle anterior ao fechar.

**Formulário enxuto:** valor, descrição, conta, categoria, data, estado pago/pendente; campos de recorrência, parcelas, tags e anexos em uma seção **Mais opções**. Ao abrir a partir de uma conta/categoria, pré-selecionar o vínculo. Após salvar, refletir alteração em indicadores, lista e saldos por invalidação controlada de consultas. Reutilizar serviços atuais; não duplicar regras no componente.

**Comportamentos obrigatórios:** validação inline, prevenção de duplo clique, `Escape` fecha quando seguro, aviso de alterações não salvas, navegação por teclado, seletor acessível, feedback após persistência, criação de conta/categoria em submodal sem apagar campos anteriores, suporte a valores em BRL/centavos e data local. Não fechar no erro.

### 4.2 Onde usar abas

| Modal | Decisão |
|---|---|
| CDB/investimento detalhado | **Sim**: Resumo / Rendimentos / Simulação / Movimentações / Detalhes |
| Cartão/fatura | **Sim, se o conteúdo atual for extenso**: Fatura / Compras / Pagamentos; não duplicar abas dentro de abas |
| Importação bancária | **Preferir etapas progressivas**: Arquivo → Prévia → Conciliação → Resultado |
| Backup/restauração | **Não**: wizard com etapas, mensagens de risco e validação |
| Receita/despesa simples | **Não**: campos essenciais e `Mais opções` |
| Preferências | Navegação por seções ou abas de nível de página; evitar modal gigante |
| Detalhes de relatório | Preferir tela de consulta e filtros, não empilhar modal |

Padronizar `DialogShell`, `DialogHeader`, `DialogActions`, componentes de formulário e regras de responsividade. Um único modal ativo no topo, exceto criação contextual controlada.

### 4.3 Scroll e select

Criar tokens de scrollbar globais para superfícies que realmente aceitam rolagem e padronizar `overflow`, largura, contraste, thumb, hover, track e cantos. **Atenção:** menus MUI Select/Autocomplete/DatePicker geralmente são portais em outra parte do DOM; CSS limitado ao container da página não os alcança. Aplicar `slotProps`/`MenuProps`/`PaperProps` nos componentes e estilos do tema para `MenuList`, `Listbox`, `Popover` e `DialogContent`. Preservar suporte a mouse, touch, teclado e leitor de tela; scrollbar customizada pode não se comportar igual em todos os sistemas operacionais. Não desativar scrolling do menu para forçar estilo.

## 5. Alertas versus notificações: separação de responsabilidades

| Conceito | O que é | Exemplo | Como aparece |
|---|---|---|---|
| **Regra de alerta** | Condição configurada que merece atenção | Orçamento acima de 90%, saldo baixo, fatura próxima | Tela de alertas/regras; ativa, pausada, limiar |
| **Ocorrência de alerta** | Condição concreta identificada para conta/período | Orçamento de mercado ultrapassou limite em novembro | Central de alertas, severidade, origem, resolver/dispensar |
| **Notificação** | Mensagem entregue ou registrada para informar algo | “Sua fatura vence em três dias” | Sininho/caixa de entrada; lida/não lida/dispensada |
| **Preferência de entrega** | Onde/quando avisar | Não repetir, notificações do sistema, horário silencioso | Configurações de notificações |

**Fluxo:** evento financeiro → motor de regras → ocorrência persistida com ID e chave de deduplicação → política de notificação → central/sistema operacional. O alerta pode continuar ativo mesmo depois de sua notificação ser lida. Marcar mensagem como lida **não** resolve o problema; resolver uma ocorrência pode arquivar as mensagens relacionadas. Avisos informativos (backup recomendado, atualização disponível) podem existir sem alerta financeiro.

**UX proposta:** tela `Alertas` focada em `Críticos / Atenção / Resolvidos` e configuração de limites; sininho focado em `Não lidas / Todas`, agrupamento por data e ação contextual. Distinção visual de severidade com ícone + rótulo + cor (não apenas cor), estados vazios apropriados, filtros por tipo e origem. Centralizar motor de avaliação no main; deduplicar por `tipo + entidade + competência + mudança de estado`. Prevenir notificações repetidas em cada abertura. Evitar polling contínuo sem necessidade.

## 6. Revisão técnica de performance e consumo de memória

### 6.1 Primeiro medir

Implementar uma tela `Configurações → Diagnóstico` (ou `Ajuda → Diagnóstico`) com métricas **locais**: versão, Electron/Chromium, memória RSS do processo main, renderer e processos auxiliares quando a API permitir, heap JS, duração de startup, duração de consultas principais, tamanho do SQLite, WAL/SHM, arquivos/anexos, tamanho do cache e diretório de dados. Atualizar somente quando a tela estiver aberta e em intervalo moderado (ex.: 5 segundos); botão para copiar relatório sem dados financeiros. Não vender RSS como “memória exclusiva do aplicativo”: processos compartilham páginas. Jamais exibir informações pessoais nos logs por padrão.

**Coletar baseline comparável:** cold start, janela pronta, tela de investimentos com 100/1.000/10.000 registros, alternância de filtros, abrir/fechar modal CDB 50 vezes, importação de CSV grande, backup/restauração, 30 minutos ocioso, carga de anexos e saída. Comparar percentis de latência e curva de memória em Windows limpo e máquina de desenvolvimento.

### 6.2 Áreas concretas a auditar

1. **Consultas SQLite:** `EXPLAIN QUERY PLAN` nas consultas de extrato, por usuário/conta/data/estado, investidor/competência e notificações. Índices compostos somente após confirmar padrão de consulta; índice demais prejudica escrita. Paginadores já existem em várias listagens: confirmar `LIMIT`, ordenação estável e índices apropriados.
2. **Renderer React:** perfis de renders e retenções; estados Redux demasiadamente amplos, objetos recriados e assinaturas globais. Usar memoização seletiva e `React.Profiler`, não aplicar `memo` cegamente. Evitar renderizar 360 linhas + gráficos pesados a cada alteração de input; debouncing do recálculo e virtualização quando necessário.
3. **Processo main:** melhor-sqlite3 é síncrono; operações SQLite longas podem bloquear o main. Medir consultas, backup, importação e exportação; considerar worker dedicado/filas sem permitir duas gravações concorrentes.
4. **IPC:** retornos paginados e contratos pequenos; não transportar todos os registros para filtragem no front-end. Descartar respostas antigas e cancelar chamadas quando possível.
5. **Notificações:** verificar se avaliação recorrente, timers e listeners são limpos ao sair da tela ou encerrar sessão. Evitar intervalos duplicados após hot reload/reativação.
6. **Gráficos:** reduzir reprocessamento de dados, agregações no SQLite, atualizações só quando período/filtro mudar.
7. **Anexos:** não carregar todos os blobs como base64 no Redux. Buscar sob demanda, gerar miniaturas, URLs de objeto com revogação, limites de tamanho, proteção contra arquivos órfãos.
8. **Cache e DB:** aferir cache em memória, checkpoint/limpeza controlada de WAL; não executar `VACUUM` indiscriminadamente nem apagar banco ou anexos. Backup antes de manutenção.
9. **Rastreamento de vazamento:** comparar heap snapshots antes/depois de repetidas aberturas de modais, navegação e troca de perfis; remover listeners, observers e subscriptions no cleanup.
10. **Dados externos:** cache de 30 minutos e intervalo de atualização manual já documentados; verificar abort/timeout e não reconsultar em cada remontagem do componente.

### 6.3 Tamanho do instalador e inicialização

Stack inclui MUI, ícones MUI e Lucide, Emotion, styled-components, Vite/Electron, TypeORM e `better-sqlite3`. Dependências simultâneas podem merecer revisão, **mas não concluir redundância apenas pelo package.json**: verificar imports realmente usados e dependências transitivas. `electron-builder.yml` já usa ASAR e filtros; conferir artefato final com ferramenta de inspeção (ASAR e instalador), localizar binários nativos duplicados, assets grandes, source maps indevidos, locale packs e pacotes presentes no bundle. Não excluir arquivos por heurística: `better-sqlite3`, migrações e updater são críticos.

**Possíveis melhorias mediante evidência:** importação sob demanda de páginas e modais pesados; dividir chunks; tree-shaking de ícones; eliminar bibliotecas não utilizadas após inspeção de imports; evitar incluir fixtures/dev-tools; otimizar PNG/JPEG/WebP; usar build Windows x64 como baseline e comparar executável/unpacked/instalador. Electron inclui runtime Chromium: tamanho de download não chegará ao patamar de aplicativo nativo muito pequeno apenas com minificação.

**Orçamentos iniciais propostos (metas, não medidas):** cold start p50 até 3 s em hardware-alvo definido; navegação p95 até 250 ms em dados locais moderados; ação de salvar p95 até 300 ms sem importação pesada; memória ociosa sem crescimento contínuo após GC; APK inicial preferencialmente abaixo de 40 MB se viável; reduzir instalador desktop pelo menos 10% *apenas se* a medição mostrar oportunidades seguras. Registrar equipamento, SO, versão, tamanho da base e metodologia antes de exigir metas.

## 7. Confiabilidade, segurança e qualidade de dados

- **Prioridade P0:** preservar testes de autorização IPC e cadeia de propriedade (anexo, tag, importação, conta, usuário), integridade de faturas, contribuições concorrentes e ajustes de saldo. A entrega 2.1.0 documenta correções; adicionar testes regressivos em operações compostas.
- **Backup:** validação de senha, adulteração, arquivos anexos, restauração em ambiente temporário e rollback, confirmação de versão do esquema. Não sobrescrever a base principal sem backup recuperável. Confirmar restauração no computador de destino.
- **Calendário:** competência x pagamento, timezone local, fim de mês, fevereiro, recorrências atrasadas, parcela paga vs pendente, taxas e arredondamento.
- **Relatórios:** a auditoria histórica aponta exportação rotulada como PDF que salvava HTML; confirmar estado na 2.2.2 e corrigir ou renomear. CSV deve impedir injeção de fórmulas; 2.1.0 documenta a correção.
- **Cartões:** tratamento inequívoco de compra parcelada, fechamento, vencimento, pagamento, estorno e mudança de fatura. Sem contagem dupla de gasto e pagamento.
- **Investimentos:** aportes/resgates trocam posição por caixa; rendimento não vira receita disponível sem resgate/liquidação definida. Não somar patrimônio total à receita do mês.
- **Qualidade:** testes unitários + SQLite/ORM + integração UI com dados reais fictícios + instalação/upgrade em máquina limpa; sempre apresentar resultados e limitações.

## 8. Proposta do aplicativo mobile — `contabily-mobile`

### 8.1 Objetivo e decisão técnica

**Stack proposta:** React Native + Expo + TypeScript, Expo Router, SQLite local (`expo-sqlite`), componentes acessíveis e tema alinhado aos tokens de desktop. Mesma linguagem visual: dark neutro, acentos discretos e cores de severidade; não replicar sidebar desktop nem tabelas densas em uma tela pequena. Compartilhar funções financeiras puras de `src/shared/finance` via pacote versionado quando adequadas ao ambiente nativo; **não importar Electron, TypeORM desktop, Node ou better-sqlite3 no Android**.

**MVP offline no Android:** nenhuma conta cloud obrigatória; dados no dispositivo e backups portáteis sob controle do usuário. O desktop continua operando de forma independente.

### 8.2 Escopo do MVP

| Tela/fluxo | MVP? | Justificativa |
|---|---|---|
| Início — saldo, entradas, saídas, resultado | Sim | Acompanhamento diário |
| Novo lançamento — receita/despesa | Sim | Ação mais frequente; botão flutuante ou na barra |
| Histórico com busca e filtros | Sim | Consulta e edição no dia a dia |
| Contas e saldos | Sim | Conferência rápida |
| Cartões/faturas — consulta e vencimentos | Sim, leitura + pagamento conforme integridade modelada | Alta utilidade |
| Alertas e notificações locais | Sim, versão simples | Lembretes acionáveis sem push remoto |
| Investimentos — resumo e rendimentos | Sim, leitura/registro simples | Consultar patrimônio sem modal complexo |
| Orçamento mensal | Sim, resumo | Controle de limite |
| Configurações e exportar/importar backup | Sim | Recuperação e portabilidade |
| Relatórios avançados, IR, importação bancária, conversor, tour completo | Não na primeira versão | Escopo desktop ou fase posterior |
| Simulador CDB com 360 meses e tabelas extensas | Opcional pós-MVP | Mobile pode abrir simulação resumida |
| Administração familiar/sync simultâneo | Não no MVP | Exige modelo de identidade e resolução de conflitos |

**Navegação:** abas `Início | Movimentações | Contas | Planejamento | Mais`; ação global `+` visível. Usar Bottom Sheet para nova transação; formulários acima do teclado, gestos de voltar previsíveis e confirmação de alterações não salvas. Gráficos econômicos compactos, sem competir com a ação de registrar gasto.

### 8.3 Dados, compatibilidade e sincronização

**Ponto crítico:** um APK offline com SQLite próprio **não sincroniza** com o desktop automaticamente. Para evitar expectativas falsas, distinguir claramente:

1. **Fase A — offline isolado:** banco local, backup/restauração. O app pode iniciar vazio; não prometer que mostra saldo desktop sem importação.
2. **Fase B — portabilidade manual:** exportador desktop e importador mobile com esquema **portátil, versionado e por perfil/livro**, criptografado; prévia, IDs globais, integridade dos anexos, checksum, snapshot e confirmação para substituir/mesclar. Evitar cópia direta do SQLite entre plataformas.
3. **Fase C — sincronização opcional:** definir backend/serviço ou adaptador seguro, autenticação, autorização, IDs globais, fila offline, idempotência, reconciliação e resolução de conflito. Google Sheets pode servir como relatório/exportação optativa, mas não é recomendado como fonte de verdade de operações financeiras concorrentes.

Modelar `transactionId`, `accountId`, `bookId`, `deviceId`, `schemaVersion`, `updatedAt`, `revision` e tombstones antes de prometer multi-dispositivo. Testar dinheiro em centavos, datas sem deslocamento, duplicação de importação e conflitos de edição.

### 8.4 Repositório e estrutura sugerida

```text
contabily-mobile/
  app/                     # Expo Router: rotas e layouts
  src/components/          # UI reutilizável
  src/features/            # dashboard, transactions, accounts, investments...
  src/data/                # SQLite, migrations, repositories
  src/domain/              # adaptadores para regras financeiras puras
  src/theme/               # tokens e cores
  src/services/            # backup, notificações, importação
  tests/                   # regras, banco e fluxos
  assets/                  # ícones e fontes permitidas
  app.json
  eas.json
  package.json
  README.md
```

**Nome sugerido do GitHub:** `fabrisiofilho/contabily-mobile` (kebab-case). Preservar propriedade e autorização de acesso. Iniciar como repositório separado, com changelog próprio, issue templates, `CI` (typecheck/lint/test), documentação de privacidade e workflow Android.

### 8.5 APK e critérios para entrega real

Para gerar um **APK instalável**, não basta ter código React Native. É preciso projeto válido, dependências e ferramentas de build, identidade de pacote, ícone, permissão mínima, assinatura Android para distribuição e testes. Com Expo/EAS, configurar o perfil Android `buildType: apk`; gerar também AAB no futuro para publicação em loja. Credenciais de assinatura não devem entrar no Git.

Checklist: instalar em dispositivo Android real; abrir sem internet; registrar receita/despesa; fechar e reiniciar; validar persistência e saldos; backup/exportação/restauração; permissões e notificações; uso de memória; atualização mantendo dados; análise de APK; instalar apenas artefato produzido e validado. **Não marcar APK como entregue sem arquivo `.apk` verificável e teste de instalação.**

## 9. Roadmap operacional e tarefas

### Fase 0 — baseline e proteção de dados
- [ ] Congelar versão, commit e esquema analisados.
- [ ] Validar backup/restauração em perfil de testes e documentar recuperação.
- [ ] Executar `npm run typecheck`, `npm test`, `npm run test:sqlite`, `npm run test:orm`, `npm run lint`, `npm run build`, `npm run test:ui`.
- [ ] Ensaiar lançamentos, liquidação, cartões, metas, investimentos e saldos com SQLite real.
- [ ] Registrar memória, startup, tamanho do banco e pacote Windows.

### Fase 1 — melhorias de uso diário
- [ ] Implementar serviço/componente global `QuickTransactionDialog`.
- [ ] Criar padrão de modal, foco, teclado, validação e carregamento.
- [ ] Corrigir listas Select/Autocomplete/menus/portais MUI e scroll acessível.
- [ ] Reformular `Alertas` como regras/ocorrências; central de notificações como mensagens.
- [ ] Adicionar testes de não duplicação, leitura e resolução.

### Fase 2 — investimentos
- [ ] Reorganizar modal CDB em abas coerentes.
- [ ] Adicionar rendimento acumulado e saldo projetado com centavos.
- [ ] Separar cenários brutos de efetivamente tributados.
- [ ] Mostrar movimentos e rendimentos efetivos separadamente.
- [ ] Testar 0–360 meses, aportes, resgates, calendário, arredondamento e exportação.

### Fase 3 — performance e distribuição desktop
- [ ] Implementar painel de diagnóstico local com opção de copiar métricas anônimas.
- [ ] Analisar SQLite/índices e re-renderizações com perfis reproduzíveis.
- [ ] Corrigir listeners/retentores e cargas excessivas comprovadas.
- [ ] Auditar dependências e conteúdo ASAR/NSIS antes de excluir qualquer coisa.
- [ ] Comparar baseline vs alterações e manter benchmark no CI onde possível.
- [ ] Testar atualização completa e recuperação de dados em outra máquina.

### Fase 4 — mobile
- [ ] Criar `contabily-mobile` como novo repositório.
- [ ] Inicializar Expo/React Native com TypeScript e tema visual.
- [ ] Adaptar regras puras e construir SQLite local/migrações.
- [ ] Implementar Início, Lançamentos, Histórico, Contas, Orçamento e Investimentos resumidos.
- [ ] Implementar backup portátil e testes offline.
- [ ] Gerar APK assinado de teste, publicar como artefato de release e homologar em Android real.
- [ ] Planejar iOS após estabilizar o MVP.

### Fase 5 — integração opcional
- [ ] Definir formato portátil por perfil e migração entre desktop/mobile.
- [ ] Fazer exportação/importação com verificação de origem, esquema e duplicidade.
- [ ] Só então avaliar sincronização, custo, criptografia e conflitos.

## 10. Critérios de conclusão do projeto para uso pessoal

Um release é considerado pronto para uso diário após: criação e edição de receita/despesa por qualquer tela; ausência de duplicação em pagamento de fatura; reconciliação de saldo e patrimônio; criação/correção de rendimentos sem alterar projeções; alertas que representam condições reais e notificações deduplicadas; modal acessível no teclado e nos diversos tamanhos; restauração comprovada; ausência de crescimento sustentado de heap em cenário repetido; instalação e atualização sem perda de dados. Para Android, acrescentar teste em aparelho e arquivo APK real.

## 11. O que NÃO recomendo por enquanto

- Criar novos módulos complexos antes de resolver fluidez do registro diário.
- Transformar toda janela em abas ou ampliar excessivamente o modal simples.
- Tratar rendimento hipotético como saldo investido realizado.
- Usar Google Sheets diretamente como banco transacional bidirecional.
- Prometer sincronização desktop/mobile apenas por ambos usarem SQLite.
- Remover bibliotecas ou arquivos nativos sem inspeção do build e testes de regressão.
- Migrar/destruir dados locais antigos automaticamente.
- Afirmar números exatos de consumo e tamanho sem benchmark reproduzível.

## 12. Fontes técnicas dentro do próprio repositório

- `README.md` — recursos e descrição da versão atual.
- `package.json` — 2.2.2, stack e scripts.
- `electron-builder.yml` — filtros de pacote e targets.
- `docs/INVENTARIO-V2.json` — rotas, serviços, entidades, IPC e migrações (snapshot histórico).
- `docs/REVISAO-COMPLETA-2026-11-02.md` — auditoria de 2.0.1 e limites, **não** diagnóstico automático de 2.2.2.
- `docs/ENTREGA-2.1.0.md` — correções e evidência já documentadas.
- `docs/RELEASE-2.2.0.md` — dados externos e guia de uso.
- `docs/PLANO-MOBILE-GOOGLE-SHEETS.md` — proposta anterior mobile/offline.

**Situação desta entrega documental:** análise e especificação realizadas; nenhuma alteração no código-fonte, criação de repositório mobile ou APK é reivindicada neste documento.


---

# ADENDO — Financiamentos, usabilidade e auditoria funcional (02/11/2026)

> **Natureza:** especificação e plano de validação baseado no repositório `fabrisiofilho/contabily`, README 2.2.2, `package.json` e relatórios `docs/REVISAO-COMPLETA-2026-11-02.md` e `docs/ENTREGA-2.1.0.md`. Não representa execução nova dos testes, nem certificação de que todos os fluxos estão livres de erros. A auditoria histórica é da versão 2.0.1; vários achados foram corrigidos na entrega 2.1.0, exigindo regressão na versão atual.

## 1. Novo módulo: financiamentos e obrigações com parcelas variáveis [P1]

### Objetivo e escopo
Adicionar página **Financiamentos**, acessível no grupo Planejamento ou Contas e cartões (escolher uma localização primária, com atalhos nas outras telas). Suportar: financiamento imobiliário, veículo, empréstimo pessoal/consignado e obrigação parcelada com valor mensal variável. Não misturar com compras de cartão parceladas: estas possuem fatura e ciclo próprios. Recorrência comum continua para aluguel, escola e contas variáveis sem dívida amortizável.

### Experiência de cadastro
- Cadastro assistido em abas/etapas: **Dados gerais** (nome, credor, tipo, descrição, conta pagadora, categoria, datas); **Contrato** (principal, entrada, prazo, valor financiado, taxa, periodicidade, SAC/Price/manual, indexador e data-base); **Custos** (seguro, taxa administrativa, tarifas e encargos); **Revisão** (tabela projetada, avisos e confirmação).
- Modo **simplificado**: nome, data, parcela prevista, periodicidade e conta; não calcular saldo devedor se não há dados suficientes. Modo **detalhado** para contratos com matemática de amortização.
- Campos opcionais de taxa fixa e atualização variável mediante índices, reajustes contratuais ou lançamentos manuais. Capturar se taxas são ao mês ou ao ano e se são nominais/efetivas; não converter sem explicação.
- Importação inicial de parcelas existentes, para quem já está pagando; permitir informar saldo devedor na data de corte, quantidade de parcelas remanescentes e histórico anterior opcional.
- Suporte explícito a pausa, carência, liquidação antecipada e renegociação com versão do contrato; preservar histórico.

### Modelo e integridade
Entidades sugeridas:
- `financing_contract`: UUID, ownerId, creditor, type, accountId, categoryId, startDate, dueDay, currency, principalCents, outstandingBasisDate, method (SAC|PRICE|MANUAL|CUSTOM), interestTerms, indexationTerms, termMonths, status, version, timestamps.
- `financing_installment`: UUID, financingId, number, dueDate, scheduledPrincipalCents, scheduledInterestCents, scheduledFeesCents, scheduledInsuranceCents, projectedTotalCents, actualTotalCents, status, calculationVersion, source/overrideReason.
- `financing_payment`: UUID, installmentId, transactionId, paidAt, amountCents, principalAppliedCents, interestPaidCents, feesPaidCents, idempotencyKey.
- `financing_adjustment`: UUID, financingId, effectiveDate, adjustmentType (index|rate|prepayment|renegotiation|fee|manual), amountCents/parameters, reason, linkedTransactionId, createdAt.
- `financing_contract_revision` para preservar parâmetros antigos e explicar recálculos.

Regras inegociáveis:
1. Valores monetários sempre em **centavos inteiros**; taxa de juros pode exigir precisão decimal separada e arredondamento contratual. Nunca calcular juros sobre saldo via `float` sem política definida.
2. **Parcela projetada não movimenta saldo de conta.** Pagamento real gera/relaciona uma transação efetiva (uma vez), de forma atômica; evitar duplicação de despesa na tela de transações.
3. Saldo devedor só é apresentado como calculado quando houver dados contratuais suficientes; caso contrário mostrar **não informado** ou saldo declarado pelo usuário com data-base.
4. **Principal, juros, seguro e taxas** precisam ser discriminados no detalhe. Na visão de fluxo de caixa, contabilizar a saída total; na análise de despesas, explicitar se a amortização de principal é considerada consumo ou redução de passivo, para não distorcer patrimônio.
5. Histórico liquidado é imutável quanto à projeção: renegociações e novas taxas recalculam apenas parcelas futuras e criam revisão auditável.
6. Suportar pagamento parcial, atrasado, antecipado, em mais de uma transação, juros de mora e desconto; nunca marcar como pago apenas porque a data passou.
7. Amortização extraordinária com duas estratégias: reduzir prazo ou valor da prestação; calcular conforme contrato e mostrar antes/depois. Nunca prometer valor exato quando regras bancárias ou indexadores não foram configurados.
8. Não consultar CDI, IPCA, TR ou outra taxa automaticamente sem origem, série, data e regra de aplicação explicitadas; diferenciar índice oficial de condição contratual.
9. Alterações de conta, categoria, cancelamento e restauração devem preservar referências e consistência transacional.

### Telas
- **Listagem:** cards compactos com credor, próxima parcela, vencimento, total mensal previsto, saldo devedor quando conhecido, progresso de parcelas; filtros ativos/quitados e busca.
- **Detalhes com abas:** Resumo, Parcelas, Evolução do saldo, Simulação de amortização, Histórico e Contrato.
- **Fluxo de caixa:** combinar parcelas futuras previstas e transações efetivamente pagas, sem duplicar valor; distinguir previsão e realizado.
- **Dashboard:** total de compromissos do próximo mês, vencimentos próximos, alteração em relação ao mês anterior e passivo conhecido, quando disponível.
- **Alertas:** parcela vence em X dias, valor real acima do previsto, reajuste confirmado, atraso e financiamento quitado; notificações são a entrega dos eventos, não regras separadas.
- **Mobile MVP:** visualizar contratos e próximas parcelas, confirmar/registrar pagamento, alterar valor efetivo e consultar histórico; simulação contratual avançada permanece no desktop.

### Critérios de aceite [obrigatórios]
- SAC/Price conferidos com planilhas de referência e casos de arredondamento e última parcela; resultado depende da política contratual escolhida.
- Variação de parcela não modifica meses pagos nem gera lançamento retroativo.
- Importar contrato no meio do prazo não cria despesa passada indevida.
- Pagamento parcial e estorno afetam corretamente conta, parcela e saldo.
- Amortização extraordinária mostra evolução anterior e posterior e não duplica transações.
- Repetir operação com mesmo `idempotencyKey` não duplica pagamento.
- Backup/restauração preserva contratos, revisões, parcelas e vínculos.
- Alterar índice, data-base, fuso e dia 29/30/31 não desloca vencimentos incorretamente.
- A consulta com centenas de contratos/parcelas continua paginada e não carrega todo o histórico no renderer.

## 2. Auditoria de UX — mudanças priorizadas

| ID | Área | Diagnóstico baseado na estrutura/documentação | Mudança requerida | Prioridade |
|---|---|---|---|---|
| UX01 | Cadastro global | Cadastros rápidos existem em contextos específicos, sem prova de ação global em toda rota | Botão `+ Novo` persistente na barra principal para Receita, Despesa, Transferência e Financiamento; atalhos de teclado, confirmação e estado preservado | P1 |
| UX02 | Investimentos | Histórico e simulação concentrados no modal do investimento | Abas Resumo, Rendimentos reais, Simulação, Movimentações; rendimento acumulado em coluna; total investido separado de lucro | P1 |
| UX03 | Alertas e notificações | Backend possui entidades e serviços separados; os nomes podem confundir | **Alerta** = condição/regra; **Notificação** = ocorrência exibida. Distinção de leitura, silenciamento, resolução e reavaliação; evitar eventos repetidos | P1 |
| UX04 | Formulários | Vários tipos de campo e diálogos | Scrollbars padronizadas com contrastes/teclado, Select/Autocomplete com scroll correto, foco e mensagens próximas aos campos | P1 |
| UX05 | Dashboard | Resumo mensal e saldos atuais têm referências diferentes | Datas de referência visíveis, drill-down para lançamentos que compõem indicador, empty states e ação clara para criar registro | P1 |
| UX06 | Transações | Há filtros e paginação, mas a navegação pode ser pesada | Filtros lembrados, chips removíveis, estados loading/empty/error, ações na linha, edição sem perder posição | P2 |
| UX07 | Contas e cartões | Várias relações financeiras | Diferenciar saldo disponível, saldo contábil, limite, fatura aberta/paga e vencimento; confirmar exclusão de conta com vínculos | P1 |
| UX08 | Planejamento | Projeções podem omitir vencidos e compromissos | Exibir vencido, previsto, comprometido e realizado; rótulos de estimativa; integrar financiamentos | P1 |
| UX09 | Relatórios/IR | Exportação PDF e semântica tributária historicamente limitadas | PDF verdadeiro ou nomenclatura correta; explicitar ano-base, origem dos dados e valores não classificados | P1 |
| UX10 | Navegação | Há 19 telas e menu agrupado | Simplificar rotas de rotina diária; recursos avançados por revelação progressiva, navegação consistente e breadcrumbs quando aplicável | P2 |
| UX11 | Acessibilidade | Teste automatizado de contraste não prova acessibilidade plena | Tab/Shift+Tab/Esc/Enter, labels, foco, leitor de tela, contraste e zoom 125–200% | P1 |
| UX12 | Segurança dos dados | Backup criptografado existe, mas confiança depende de recuperação | Indicador de último backup, teste de restauração em base temporária, avisos não intrusivos sem envio automático à nuvem | P1 |

### Regras transversais de experiência
- Feedback imediato de ação concluída, falha, processamento e desfazer quando tecnicamente seguro.
- Nunca fechar formulário e apagar campos após erro; valores iniciados persistem ao criar uma categoria/conta auxiliar.
- Tabelas com valores alinhados e formatação pt-BR, números monetários com 2 casas; datas locais sem mudanças inesperadas por UTC.
- Evitar modal dentro de modal: preferir drawer/etapas ou gerenciador de diálogo coordenado quando houver criação auxiliar.
- Auto preenchimento coerente com conta/categoria usada recentemente, sem salvar dados financeiros por acidente.
- Tela de primeiro uso curta, ajuda contextual, atalhos documentados e resumo de tarefas pendentes.

## 3. Matriz de validação por módulo

**Legenda:** `documentado` = código/função descrita nas fontes; `regressão` = comportamento reportado como corrigido em 2.1.0 que deve ser retestado; `pendente` = não há evidência suficiente para garantir comportamento integral.

| Módulo | Evidência disponível | Testes de homologação necessários |
|---|---|---|
| Autenticação/perfis | documentado; correção de autorização reportada | isolamento entre dois perfis, sessão expirada, redefinição de senha e IPC inválido |
| Dashboard | documentado | limites de período, competência versus liquidação, valores e drill-down |
| Transações/parcelas | documentado, testes de regra | criar/editar/excluir/cancelar, período, centavos, parcelamento, pagamento parcial, atualização das listas |
| Contas/saldos | regressão do ajuste de saldo | saldos após lançamento, exclusão, estorno, reinício e restauração |
| Cartões/faturas | regressão de vínculo e vencimento | compras, troca indevida, fechamento, parcelamento, pagamento parcial, devolução, reconciliação |
| Transferências | documentado | duas pontas atômicas; nenhuma receita/despesa artificial; reversão |
| Recorrências | lacuna histórica R09 | atrasos anteriores ao intervalo, geração idempotente, dia 31, término e edição |
| Metas | regressão de concorrência | contribuições concorrentes, exclusão, progresso e sem debitar conta por reserva virtual |
| Orçamentos | documentado | realizado/comprometido/vencido, várias categorias e cópia mensal |
| Investimentos | documentado e testes | aporte, resgate, rendimento real, simulação hipotética, taxa, lucro acumulado e impostos não presumidos |
| Fluxo de caixa | lacuna histórica R09 | vencidos, faturas sem pagador, financiamentos, dupla contagem, saldo inicial |
| Relatórios/exportações | histórico R08 | exportar CSV seguro e PDF real, agregações, datas, caracteres especiais |
| Imposto de renda | simulação manual 2026/2027 documentada | limites da simulação, fontes, ano-calendário, deduções, IRRF, arredondamentos |
| Dados externos | documentado 2.2.0 | falha offline, cache, unidade de taxa, dados desatualizados, timeout |
| Importação bancária | documentado | prévia, deduplicação, arquivo inválido, sucesso parcial, conciliação |
| Alertas/notificações | documentado | distinção regra/evento, deduplicação, lido/não lido, preferências, horários e reinício |
| Categorias/tags | documentado | restrições de uso, arquivamento, troca de categoria e isolamento por perfil |
| Anexos/arquivos | documentado | perda parcial do arquivo, arquivos órfãos, limite de tamanho, restauração |
| Configurações/manual | documentado | preferências, textos condizentes com recursos reais, navegação |
| Backup/restore | testes documentados | backup alterado, senha incorreta, restauração em máquina nova, rollback seguro |
| Atualizador/instalador | documentado; ciclo total não homologado | assinatura, atualização 2.2.x→seguinte, rollback, instalador limpo, sem perda de banco |
| Financiamentos | **novo, não implementado** | matriz de testes da seção 1 |
| Mobile/sincronização | **planejado, não implementado** | dispositivo real, offline, APK assinado, backup e futuro conflito de registros |

**Não declarar 'sem nenhum problema' sem executar testes automatizados e manuais em uma versão identificada e com banco fictício.** O README diz que a suíte de UI cobre 19 telas usando IPC fictício, e o teste de ORM usa SQLite real; isso não equivale a homologação de todos os formulários ponta a ponta.

## 4. Memória, velocidade e tamanho do instalador

Pontos de investigação (hipóteses, não defeitos comprovados):
1. Medir processo main, renderer e GPU no início, após navegar 20 vezes, abrir/fechar modais 100 vezes, consultar 10 mil transações e ficar 60 minutos aberto. Registrar P50/P95 e crescimento do heap.
2. Usar React Profiler em dashboard, gráficos e formulários; procurar renderizações desnecessárias e handlers/intervalos não desmontados.
3. Auditar listeners `ipcRenderer.on`, subscriptions Redux, timers de notificações e objetos Blob/URLs temporárias quanto a vazamentos.
4. Garantir SELECT paginado e colunas necessárias; índices SQLite para `user_id`, `account_id`, `date`, `status`, `due_date` e campos de busca efetivamente usados, confirmando `EXPLAIN QUERY PLAN` antes de adicionar índices.
5. Verificar consultas repetidas por componente, caches sem limite, N+1 do TypeORM e dados derivados duplicados.
6. Avaliar dependências de UI concorrentes (MUI, styled-components e Emotion) e imports de ícones; executar análise de bundle antes de remover qualquer pacote.
7. Verificar `electron-builder.yml` e conteúdo real do `.asar`/artefato, binários nativos, sourcemaps e arquivos desnecessários; não eliminar DLLs/dependências necessárias a builds.
8. Implementar comparativo de desempenho anterior/depois: tempo até tela de login, até dashboard utilizável, abertura de modal, troca de mês, exportação e consumo estável de memória. Não afirmar ganhos percentuais sem medição.
9. Backup em escrita e checkpoint WAL com segurança; evitar VACUUM a cada operação. Medir crescimento de SQLite e anexos ao longo dos meses.

Metas **propostas para benchmark em máquina de referência**, revisáveis após baseline: ações simples P95 < 200 ms de UI percebida, navegação comum P95 < 500 ms, consulta paginada P95 < 700 ms em base sintética de 10 mil registros, ausência de crescimento persistente não explicado do heap após repetição de cenários. O tamanho do instalador deve ser comparado com baseline antes de fixar orçamento de MB.

## 5. Plano de execução e portas de qualidade

### Fase A — Estabilizar núcleo [bloqueadora]
- Identificar SHA do commit auditado, criar base sintética e executar `npm ci`, `npm run typecheck`, `npm test`, `npm run test:sqlite`, `npm run test:orm`, `npm run lint`, `npm run build`, `npm run test:ui`.
- Fazer teste manual dos fluxos críticos em Electron real + banco temporário (não o banco pessoal).
- Revisar R08 (PDF) e R09 (fluxo/recorrências) como pendências explicitamente não resolvidas na entrega 2.1.0.
- Registrar matriz de testes com: cenário, pré-condições, resultado esperado, resultado observado, log, severidade, commit de correção e reteste.

### Fase B — Usabilidade diária
- Cadastro global, abas do investimento, scroll/foco, alertas versus notificações, mensagens de erro e acessibilidade.
- Padronizar ações Salvar/Cancelar/Excluir, confirmação e preservação de estado.

### Fase C — Financiamentos
- Validar regras de produto e exemplos contratuais; implementar entidades, migração não destrutiva, serviço e API IPC; tela desktop, integração ao fluxo de caixa e testes.
- Não liberar amortização automatizada para todos os tipos contratuais até homologar as fórmulas por modalidade.

### Fase D — Otimização
- Rodar benchmark, identificar gargalos concretos, priorizar correções e medir regressão.
- Homologar instalador e atualização em Windows limpo com banco migrado.

### Fase E — Mobile
- MVP React Native offline com dashboard, transações, contas, próximas parcelas, financiamentos essenciais e alertas locais.
- Não presumir sync operacional. Compartilhar regras puras em pacote versionado; não replicar lógica financeira divergente no celular.

### Definição de pronto
Uma funcionalidade só é `validada` com **regras do domínio testadas**, integração em SQLite real, verificação UI em Electron real, tratamento de erros/estados vazios, acessibilidade básica, backup/restore e documentação atualizada. Problemas severos de duplicação financeira, perda de dados ou isolamento entre usuários bloqueiam release.

## 6. Resumo de decisão

- **Adicionar:** financiamentos com parcelas variáveis e saldos devidos verificáveis, começando pelo modo manual e depois SAC/Price.
- **Melhorar antes de expandir:** lançamento global, gestão de estado de formulários, distinção alerta/notificação, investimentos, fluxo de caixa e exportação.
- **Manter:** arquitetura offline/SQLite e regras financeiras compartilhadas.
- **Não afirmar:** que todos os recursos foram testados sem falhas ou que mobile/APK/sincronização já existem.
- **Próximo passo técnico:** gerar o relatório de execução dos testes no SHA atual e corrigir divergências observadas antes de publicar nova release.

---

# 7. Auditoria específica — Relatórios Avançados (leitura do código atual)

**Arquivos consultados:**
- [`src/main/application/services/advanced-report-service.ts`](https://github.com/fabrisiofilho/contabily/blob/main/src/main/application/services/advanced-report-service.ts)
- [`src/main/application/controllers/advanced-report-controller.ts`](https://github.com/fabrisiofilho/contabily/blob/main/src/main/application/controllers/advanced-report-controller.ts)
- [`src/renderer/src/pages/AdvancedReports/index.tsx`](https://github.com/fabrisiofilho/contabily/blob/main/src/renderer/src/pages/AdvancedReports/index.tsx)
- `src/main/application/services/cash-flow-service.ts` e documentação de releases, testes e entrega 2.1.0.

**Escopo e honestidade técnica:** nesta revisão os três arquivos centrais foram lidos diretamente no GitHub. Os achados abaixo são inferências verificáveis do código, **não execução da suíte ou afirmação de que todos os caminhos falham em produção**. O comportamento de todos os dados depende também das entidades, serialização de datas, SQL/TypeORM e dos adaptadores IPC. Fixar SHA de referência na implementação e revalidar diffs antes de editar.

## 7.1 Inventário: backend versus interface

| Recurso | Método do serviço/IPC | Aparece na página AdvancedReports? | Decisão |
|---|---|---|---|
| Saúde financeira | `getFinancialHealth` / `financialHealth` | Sim | Reformular indicadores, metodologia e dados insuficientes |
| Comparação anual por categoria | `getYearComparison` / `yearComparison` | Sim | Seletor de anos/período, tratamento de base zero |
| Tendência de gastos | `getTrendAnalysis` / `trendAnalysis` | Sim | Preencher meses zero, estimativa não negativa, filtros |
| Padrões por dia da semana | `getSpendingPatterns` / `spendingPatterns` | Não nesta página | Criar aba **Hábitos** ou consolidar com análises, após corrigir unidade e escopo |
| Distribuição por categoria | `getCategoryBreakdown` / `categoryBreakdown` | Não nesta página | Criar aba **Categorias**, ou vincular tela comum de relatórios sem duplicar |
| Histórico receita vs despesa | `getIncomeVsExpenseHistory` / `incomeVsExpenseHistory` | Não nesta página | Aba **Evolução** com série completa e eixo temporal |

**Decisão UX:** a página deve ter abas `Visão financeira`, `Evolução`, `Categorias`, `Comparações` e `Tendências`, com **Hábitos** como subseção opcional de Categorias. Evitar abas sem conteúdo, gráficos redundantes ou cópia de relatórios convencionais. Em tela estreita, Tabs roláveis e persistência da aba ativa. Mostrar intervalo e metodologia acima dos gráficos, com clique para os lançamentos subjacentes. Permitir exportação dos mesmos filtros.

## 7.2 Achados concretos e correções propostas

### AR-01 [P1] — Métricas não distinguem ausência de orçamento de aderência perfeita

`calculateBudgetAdherence()` retorna `100` quando não existem orçamentos (`budgets.length === 0`) ou quando o total planejado é zero. O score de saúde soma `budgetAdherence * 0.15`, portanto um usuário sem orçamentos pode receber até 15 pontos como se os cumprisse. **Corrigir:** indicador `null`/`not_configured`, não computar esse componente; score com pesos normalizados apenas sobre dimensões válidas ou indicar `insuficiente para score`. Exibir CTA “Criar orçamento”. Testes: zero orçamentos; orçamento zero; sem gasto; orçamento excedido; divisão por zero.

### AR-02 [P1] — Reserva de emergência calculada a partir de todas as contas

`getFinancialHealth()` utiliza `SUM(a.balance)` de **todas** as contas do usuário e divide pelas despesas de três meses / 3. Mistura saldo de contas correntes, possíveis contas de cartão e dinheiro não reservado, e não considera investimentos destinados à reserva. **Corrigir:** criar marcação `isEmergencyFund` por conta/posição ou saldo declarado dedicado; excluir cartões/passivos e patrimônio ilíquido; impedir soma duplicada de dinheiro investido e caixa; mostrar numerador, denominador, referência temporal e seleção de fontes. Sem fonte configurada, `reserva não configurada`, não `0 meses`. Só usar meses de despesas representativos ou média de meses completos e claramente indicada.

### AR-03 [P1] — Saúde calculada com lançamentos que podem ainda não ter sido liquidados

`getFinancialHealth()`, tendências, comparações e histórico filtram `t.origin='entry' AND t.status<>'cancelled'`, mas **não** exigem `status='settled'` nem usam explicitamente `settlement_date`. Isso agrupa pendências com pagamentos e cria diferença entre “realizado” do dashboard e relatórios avançados. **Corrigir:** oferecer modo `Realizado (por liquidação)` e `Competência (obrigações do período)`, com contrato compartilhado e filtros consistentes. Não misturar ambos no mesmo score. Para cartão, testar compra, fatura e pagamento para evitar dupla contagem; para investimento, não tratar aporte como despesa.

### AR-04 [P1] — Série de tendência omite meses sem lançamentos

`getTrendAnalysis()` usa apenas meses retornados pelo `GROUP BY`. A regressão utiliza `x = índice do elemento` em vez de tempo calendário; quando há lacunas, o intervalo real entre observações é ignorado, alterando inclinação/média/previsão. A previsão `último valor + slope` também pode ser negativa. **Corrigir:** gerar calendário completo de N meses, preencher zeros para categorias existentes, definir comportamento para categoria criada no meio do período, calcular regressão sobre meses reais, usar `max(0, previsão)` e exibir faixa/nota de incerteza. Com poucos pontos mostrar `dados insuficientes` em vez de tendência precisa. Teste: janeiro e dezembro apenas, categoria nova, zero contínuo, outliers, previsão negativa.

### AR-05 [P1] — Comparativo anual usa 0% quando base anterior é zero

`getYearComparison()` calcula `variationPercent = 0` quando `previousAmount === 0`, inclusive quando a categoria passa de R$0 para qualquer valor positivo. Na interface isso aparece como `+0%`, com cor vermelha, enganando o usuário. **Corrigir:** `variationPercent: null` e badge “Novo gasto”/“Sem base comparativa”; valor absoluto sempre presente; para ambos zero, 0% e estado neutro. Distinção semântica de aumento/redução/igual; não mostrar seta de queda quando variação é zero. Testar negativos/estornos e ano parcial contra período equivalente do ano anterior (YTD).

### AR-06 [P1] — Padrões semanais expõem escala monetária inconsistente

`getSpendingPatterns()` usa `AVG(t.amount)` sem `/100.0`, enquanto outros métodos fazem `SUM(t.amount)/100.0`. Se `amount` é centavo inteiro, `averageSpending` sai 100 vezes maior que valores convertidos em reais. Além disso a consulta não aplica `filters.accountId` nem `filters.categoryIds`, embora o contrato os declare. **Corrigir:** agregação em centavos consistente e conversão na fronteira; contabilizar `totalSpending`, `averagePerTransaction`, `averagePerDayObserved` como conceitos diferentes; considerar dias sem despesas no denominador somente para média diária; aplicar filtros comuns.

### AR-07 [P1] — Filtros declarados não são aplicados consistentemente

`AdvancedReportFilters` inclui `accountId`, `categoryIds` e `compareWithPreviousPeriod`, mas `getSpendingPatterns()` só usa datas e `getCategoryBreakdown()` aplica datas, não account/category IDs. Comparativo, tendências, saúde e histórico usam parâmetros diferentes sem filtro de conta e período comum. Na interface não há seletor de período, conta ou categoria, usando sempre ano atual/12 meses. **Corrigir:** um `ReportQuery` validado: `startDate`, `endDate`, `periodBasis`, `accountIds`, `categoryIds`, `includePending`, `comparisonMode`; implementar via construtor de query compartilhado e testes de isolamento. Não manter flags aceitas e silenciosamente ignoradas.

### AR-08 [P1] — Métrica de saúde pode atribuir score a uma amostra insuficiente

O retorno `hasData: false` existe quando `summary.length === 0`, melhoria em relação à auditoria 2.0.1. Porém **uma única transação** já produz score; o `hasData` não é definido explicitamente no retorno normal. `income=0` leva a `expenseToIncomeRatio=100`, valor que parece uma razão calculada, embora não haja denominador. **Corrigir:** regra documentada de cobertura (ex.: três meses completos ou qualidade indicativa), `dataCoverage`, `missingDimensions`, `score: number | null`, razões nulas sem receita, exibir intervalo e contagem. Não rotular score heurístico como diagnóstico ou aconselhamento profissional.

### AR-09 [P2] — Aderência ao orçamento tem peso de orçamento, não magnitude de desvio

`calculateBudgetAdherence()` conta valor integral do orçamento apenas quando a categoria fica dentro do teto. Gastar R$1 acima do teto elimina integralmente o peso da categoria; gastar R$1.000 acima tem o mesmo efeito. **Corrigir:** exibir `% do limite consumido`, `excedente em R$` e taxa de categorias dentro do limite separadamente; escolher fórmula contínua e documentada para o score; calcular por mês de referência correto, não misturar orçamento do mês atual com receitas/despesas de três meses.

### AR-10 [P2] — Datas, períodos e seletores merecem testes de borda

Uso de `new Date()` e `setMonth()` para 12/3 meses pode sofrer deslocamento em finais de mês; comparativo anual `new Date(year,11,31)` com `<= endDate` depende do tipo da coluna e da serialização do ORM. **Corrigir:** representar períodos por datas civis `YYYY-MM-DD`, usar intervalo semiaberto `[início, primeiro dia após fim)`, calendário local compartilhado, seletor de anos e meses completos. Testes em 28/29/30/31, mudança de ano e fuso -03:00.

### AR-11 [P2] — UX de carregamento e erro não diferencia resultados parciais

A página carrega saúde, comparação e tendências em `Promise.all`, mesmo quando apenas uma aba está ativa. Se uma promise rejeita, `finally` retira o loading mas não apresenta erro explícito; respostas `success=false` permanecem em estado anterior após refresh, potencialmente exibindo dados desatualizados. **Corrigir:** carregar aba sob demanda, cache por filtro, estados loading/error/empty/success por painel, botão tentar novamente, resultados fora de ordem ignorados, refresh invalida cache e mostra última atualização. `Promise.allSettled` quando buscar painéis independentes; não ocultar falhas.

### AR-12 [P2] — N+1 consultas e custos evitáveis

`calculateBudgetAdherence()` faz uma query de gastos para cada orçamento. `getYearComparison()` consulta separadamente dois anos; `getIncomeVsExpenseHistory()` pode omitir meses vazios. **Corrigir:** agregação SQL em lote para categorias/meses, índices conforme `EXPLAIN QUERY PLAN` e parâmetros de período; geração de meses vazios no domínio; virtualizar listas extensas; medir p50/p95 e heap antes/depois. Evitar otimização sem profiling.

### AR-13 [P2] — Recomendações são genéricas e podem parecer conclusões

Se nenhuma regra dispara, o renderer apresenta “Parabéns! Suas finanças estão em ótimo estado”, mesmo que o score e dimensões não sustentem tal afirmação. **Corrigir:** recomendações com evidência concreta, indicador e período, linguagem não categórica, ação/atalho no produto, e estado “Sem recomendações automáticas” caso não haja recomendações. A classificação positiva exige cobertura mínima de dados.

### AR-14 [P2] — A soma de saldo de todas as contas precisa separar ativos/passivos

Além da reserva (AR-02), a consulta não explicita `a.type <> 'credit_card'`, enquanto o fluxo de caixa exclui crédito por tipo. **Corrigir:** componentes de patrimônio (caixa, investimento, dívida) separados, saldos testados contra transferências, faturas e financiamentos. Nunca transformar limite de cartão em patrimônio.

## 7.3 Modelo proposto para os Relatórios Avançados

- **Filtros globais:** período com presets 3/6/12 meses, customizado, conta(s), categoria(s), base realizado/competência; escolha persiste na sessão, badge do período em cada painel.
- **Visão financeira:** resultado mensal, taxa de poupança, evolução de gastos, aderência se orçamentos configurados, meses de reserva somente quando fontes definidas; score opcional com explicação de pesos e completude.
- **Evolução:** linha receita/despesa/resultado, separação realizado vs projetado, meses com zeros; ações para abrir lançamentos.
- **Categorias:** tabela ranqueada com total, participação, variação, quantidade e ticket médio; drill-down, exportação CSV/PDF e estado sem dados.
- **Comparações:** ano anterior no mesmo intervalo, seleção manual dos anos; diferenças absolutas e relativas, rótulo “base inexistente”, visualização de gastos emergentes.
- **Tendências:** evolução mensal por categoria com histórico completo, linha prevista pontilhada, nunca prometer previsão certa; mensagens sobre pouca amostra e outliers.
- **Hábitos (opcional):** gastos por dia da semana, separando total, valor médio por transação e por dia observado, com metodologia legível; não fazer gráfico só pela estética.

## 7.4 Esquema de contratos sugerido

```ts
type CalendarDate = `${number}-${number}-${number}`;
type ReportBasis = 'settlement' | 'competence';
type MoneyCents = number; // inteiro validado, sem float como valor de domínio
interface AdvancedReportQuery {
  startDate: CalendarDate;
  endDateExclusive: CalendarDate;
  basis: ReportBasis;
  accountIds?: number[];
  categoryIds?: number[];
  includePending?: boolean;
}
interface Metric<T> {
  value: T | null;
  status: 'ok' | 'insufficient_data' | 'not_configured';
  methodology: string;
  startDate: CalendarDate;
  endDateExclusive: CalendarDate;
  sampleSize: number;
}
interface TrendPoint { month: string; actualCents: MoneyCents; predictedCents?: MoneyCents | null; }
```

Não mudar interfaces públicas de uma só vez: introduzir contratos V2, adaptadores temporários, migração gradual de consumidores e testes de compatibilidade. Valores de exibição convertidos só na borda; usar SQL em centavos e arredondamento determinístico.

## 7.5 Checklist de testes automatizados (obrigatórios para Codex)

- [ ] Comparativo: anterior R$0, atual R$100 -> `null`/“Novo gasto”, jamais `+0%`.
- [ ] Uma categoria com gastos janeiro/dezembro, meses intermediários zero -> 12 pontos e regressão sobre tempo real.
- [ ] Projeção decrescente forte -> valor previsto não negativo; poucos pontos -> aviso de amostra.
- [ ] `AVG(amount)` com 10.000 centavos -> R$100, não R$10.000.
- [ ] Filtro por conta A não traz conta B; filtro por categoria não traz outra categoria; usuário A não vê usuário B.
- [ ] `status=pending` não integra realizado; competência pode integrar pendente com rótulo adequado.
- [ ] Aporte em CDB não vira despesa; resgate não vira receita; rendimento conforme modelo escolhido.
- [ ] Compra de cartão e quitação de fatura não contam como duas despesas.
- [ ] Sem orçamento: indicador `not_configured`, score não bonificado automaticamente.
- [ ] Orçamento extrapolado por R$1 versus R$1.000 produz gravidades distinguíveis.
- [ ] Sem reserva marcada: indicador `not_configured`; cartão/limite não integra reserva.
- [ ] Uma transação isolada não dispara “Excelente!” sem cobertura suficiente.
- [ ] Sem renda, razão despesa/receita é `null`, não 100% fictício.
- [ ] Períodos 28/29/30/31, dezembro-janeiro e mudança de timezone funcionam sem perder o último dia.
- [ ] Erro em uma aba não paralisa todas; atualização tardia não sobrescreve filtros novos.
- [ ] Meses sem movimentação aparecem explicitamente na evolução.
- [ ] Paginação/exportação usam exatamente os mesmos filtros e valores exibidos.
- [ ] Desempenho com 10 mil e 100 mil transações sintéticas: documentar latência, heap e plano de consulta.
- [ ] Instalar/testar app real com dados fictícios, não apenas mock do IPC; restaurar snapshot e comparar somas.

# 8. Instrução operacional para o Codex — plano unificado de implementação

**Objetivo:** transformar este arquivo inteiro em backlog rastreável, sem perder nenhuma funcionalidade já disponível e sem introduzir divergência financeira.

1. Ler `AGENTS.md`, este documento, as auditorias históricas e a documentação da release atual. Fixar SHA antes do trabalho e mapear todos os consumidores dos contratos; inventariar rotas, serviços, IPC, testes, migrations e dependências.
2. Rodar e anexar resultados de `npm ci`, `npm run typecheck`, `npm test`, `npm run test:sqlite`, `npm run test:orm`, `npm run lint`, `npm run build`, `npm run test:ui`, build Windows quando ambiente permitir; relatar avisos, falhas e ambiente. Não declarar sucesso sem log.
3. Prioridade **P0**: backup restaurável, autorização por usuário, integridade em centavos, ausência de double counting, segurança de arquivos, controles de migração e atualização. Corrigir regressões com testes reproduzíveis antes de mexer em UX.
4. Prioridade **P1**: AR-01 até AR-08, filtros/estados da página Relatórios Avançados, lançamento global receita/despesa, alertas/notificações separados, scroll de selects unificado, CDB por abas e acumulados, financiamentos/parcelas variáveis inicialmente no modo manual.
5. Prioridade **P2**: AR-09 até AR-14, exportação verdadeira PDF, histórico e reconciliação, SAC/Price com contratos testados, benchmark SQLite/React/Electron, reduzir peso do instalador com medidas, acessibilidade e navegação por teclado.
6. **Mobile**: repositório `contabily-mobile`, React Native + Expo + SQLite offline, compartilhar regras puras, MVP transações/contas/resumo/parcelas, gerar APK assinado de teste e verificar em Android real. Sem prometer sincronização até definir identidade, conflitos, criptografia e recuperação.
7. Para cada item, registrar **arquivo modificado, problema, teste anterior falhando, alteração, novo teste passando, screenshots relevantes, métricas e risco de migração**. Não apagar banco pessoal. Releases somente após critérios de aceite.

**Conceitos financeiros inegociáveis:** evento ≠ saldo derivado; receita/despesa ≠ transferência; simulação ≠ registro real; quitação de fatura não duplica consumo; amortização de principal não é integralmente despesa de juros; saldo devedor de financiamento é passivo, não gasto projetado sem calendário; orçamento não existente não equivale a orçamento perfeitamente cumprido.

**Status final desta revisão:** revisão estática focalizada em Relatórios Avançados e consolidação do planejamento; **nenhuma mudança de código de produção, repositório mobile, APK ou execução de testes foi efetuada nesta atividade**. O objetivo do MD é orientar uma implementação posterior verificável.
