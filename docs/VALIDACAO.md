# Histórico de validação do Contabily

## Alinhamento do tour e valores nos gráficos — 2.2.1, 2026-11-02

Typecheck, build e 36 testes unitários aprovados. Lint sem erros, com 16 avisos anteriores. Ensaio Electron com IPC fictício das 19 telas verifica centro horizontal do chip, larguras iguais dos botões Voltar/Avançar, seta contínua, seleção de ponto por foco, consulta por setas e exibição dos valores sobre a linha. Capturas locais do tour e do gráfico ficam em `.qa/tour-guided-account.png` e `.qa/external-chart-values.png`. Em janela oculta, o teste despacha eventos de foco e teclado para exercitar os handlers React. Não houve alteração de regras financeiras ou banco.

## Dados externos e tour guiado — 2.2.0, 2026-11-02

Passaram 36 testes unitários, typecheck, build, SQLite e ORM. Lint: zero erros e 16 avisos preexistentes. Testes novos cobrem parsing das séries, datas futuras/inválidas, publicações conflitantes, composição do IPCA, cache, indisponibilidade, concorrência de consultas, intervalo mínimo de atualização, falha de disco e posicionamento do tour no viewport.

Consulta real em Electron isolado retornou as cinco séries: dólar/euro/CDI com referência 30/10/2026, Selic 02/11/2026 e IPCA 09/2026. O teste online depende da disponibilidade do Banco Central; a aplicação mantém dados salvos em falhas posteriores.

O ensaio Electron com preload real e IPC fictício cobre 19 telas, acesso pelo menu, conversor, unidade diária do CDI, identificação do cache, destaque do alvo, abertura/fechamento de modal durante o tour, revisão após conclusão e navegação anterior sem regravar o progresso concluído. Capturas locais `.qa/external-data.png` e `.qa/tour-guided-account.png` foram inspecionadas. Não acessa o banco pessoal. Não equivale a homologação integral de todo formulário ou ciclo de atualização em outro computador.

## Usabilidade e fundação financeira — 2.1.0, 2026-11-02

Passaram `npm run typecheck`, os 31 testes unitários, `npm run test:sqlite`, `npm run test:orm`, build e o ensaio Electron das 18 telas. Lint: zero erros e os 16 avisos preexistentes.

Regressões adicionais cobrem proprietário de anexos/etiquetas/importações e cadastros vinculados, rejeição de sessão/frame inválido no IPC, contribuições simultâneas em metas, vínculo de fatura e recálculo das duas faturas, vencimento em fevereiro, ajuste persistente de saldo, prefixos de fórmulas no CSV, categorias idempotentes, filtro múltiplo, páginas e consulta de investimentos. A migração 011 preservou saldo e IDs de uma base já preenchida do esquema 3. Snapshot real preservou logo, ajuste e etapa do guia depois de aguardar uma operação financeira.

O ensaio de interface usa sandbox e dados fictícios. Confere guia entre telas, cadastro em modal com seleção e preservação dos campos, primeira/segunda página do board, busca no endpoint, imagem da conta, expansão opcional, filtros múltiplos e respostas fora de ordem, além das verificações anteriores. Capturas locais ficam em `.qa`; não são dados pessoais.

Escopo, decisões por tela e limitações estão em [ENTREGA-2.1.0.md](ENTREGA-2.1.0.md). As seções anteriores abaixo são registros históricos; não devem ser interpretadas como o inventário atual. Ainda não se afirma homologação integral de todo formulário, sincronização ou ciclo de atualização em outro computador.

## Cores e logo — 2.0.1, 2026-11-02

Corrigido recorte do nome Contabily: a fonte de 32px na abertura herdava linha de 24px com overflow hidden; agora usa linha proporcional e overflow visível. Símbolo recebe crescimento de 900ms e brilho de 1800ms, sem repetição; movimento reduzido continua ignorando a abertura.

Paleta semântica unificada: receitas verdes, despesas/erros em coral, aviso âmbar e informação azul. Seletores deixam de usar tokens inexistentes success.lighter/error.lighter. Estados selecionados têm borda e fundo explícitos; chips e AlertBox preservam texto legível. Botões semânticos preenchidos usam texto escuro, inclusive no hover.

Typecheck e build aprovados; lint com zero erros e 16 avisos existentes. Ensaio visual Electron das 18 telas aprovou logo animada, nome sem recorte e contraste real dos seletores selecionados >= 4,5:1 (despesa 7,42:1; receita 8,88:1). Capturas .qa/neutral-opening.png e .qa/contrast-expense.png inspecionadas. Conferência dos tokens de hover com texto preenchido: receita 7,28:1, despesa 6,42:1, aviso 8,54:1, informação 6,17:1. Não houve alteração de esquema ou regras financeiras nesta revisão; os testes visuais não equivalem à homologação integral das funcionalidades.

## Revisão 2.0.0 — 2026-11-02

26 testes unitários aprovados, incluindo IR anual e estados do updater; typecheck aprovado; lint com zero erros e 17 avisos existentes. Build aprovado para main, preload e renderer, com as dez migrações. Inventário atualizado: 18 rotas, 21 entidades e 133 canais IPC.

Teste adicional de valores fracionados detectou e corrigiu a dupla hidratação de defaults monetários no retorno de INSERT do TypeORM/SQLite. Defaults foram movidos para inicializadores das entidades, preservando os defaults físicos das migrações. Regressão confere retorno e persistência de saldo inicial R$ 123,45, fatura R$ 77,23, preferência R$ 123,45 e meta R$ 987,65.

Importação manual de linhas e confirmação de extrato passaram pelo TransactionService: gravam liquidação na data do extrato, validam conta/categoria e não atualizam saldo fora da operação financeira. A confirmação de cada linha bancária grava também seu estado na mesma transação e ignora linha já processada. Teste real importa R$ 12,34 e R$ 56,78, repete a confirmação e reconcilia saldo de R$ 69,12. A importação manual ainda permite sucesso parcial por linha, explicitado no resultado; não representa restauração integral de backup.

`npm run test:sqlite` passou: migrações, centavos, persistência, idempotência, isolamento, investimentos, liquidação e backup criptografado (senha incorreta, adulteração e restauração em arquivo temporário).

`npm run test:orm` passou com SQLite/TypeORM reais em base temporária: confere cada coluna mapeada contra PRAGMA table_info e consulta todas as entidades. Exercita pendência/liquidação/cancelamento, transferência, ajuste de conta/tipo/valor, saldo inicial, investimento, pagamento integral e único de fatura, geração concorrente de recorrências, dashboard, orçamento e relatórios. Fluxo de caixa cobre receita/despesa por vencimento, filtro de contas, isolamento, fim de recorrência e janeiro/fevereiro no dia 31. Banco anterior é recusado e permanece intacto.

`npm run test:ui` passou em Electron oculto com perfil e IPC isolados nas 18 telas, incluindo IR (simulação sem renda), formulário de liquidação, novos atalhos, loading, respostas fora de ordem e animação. Capturas `.qa/v2-dashboard.png` e `.qa/v2-income-tax.png` inspecionadas: barras consistentes, pontilhado ampliado, formulário e navegação legíveis. O teste não usa banco pessoal.

A versão 2 exige banco novo em instalações antigas: esquema 3, sem conversão silenciosa nem exclusão automática. Manual, README e notas de release comunicam essa exigência.

Limites: ensaios de UI usam dados fictícios; não equivalem à homologação integral de todos os formulários com banco real. Instalação, desinstalação, assinatura comercial e ciclo completo de atualização em uma instalação antiga não foram homologados. Simulação fiscal cobre o ajuste ordinário de 2026, não todos os regimes; avaliação de usabilidade é heurística, sem entrevistas. Pesquisa e prioridades em AVALIACAO-PRODUTO.md.

### Pacote Windows 2.0.0

Electron Builder gerou NSIS x64, blockmap e latest.yml. Instalador: 121.510.006 bytes; SHA-256 `b65883d67a8ba74c8ea4c126c14491a0f376bea3a180d98e56491a62df311ee5`. Conferência do app.asar confirmou versão 2.0.0 e igualdade byte a byte de main, preload, HTML e assets com o build validado. Dez migrações e ícone externo conferidos; nenhuma pasta de banco pessoal, .qa ou arquivo .env no arquivo empacotado. app-update.yml aponta para fabrisiofilho/contabily e o SHA-512 de latest.yml corresponde ao instalador.

SQLite nativo carregado diretamente do pacote e exercitado em memória. O ensaio visual das 18 telas, IR, atalhos e loading passou novamente usando renderer e preload de app.asar (`CONTABILY_QA_APP_ROOT`), com dados fictícios. Executável identifica Contabily 2.0.0.0. Assinatura comercial ausente; não foi executada instalação/desinstalação no computador pessoal. O primeiro empacotamento foi descartado após atualização concorrente do build; o pacote final foi criado com arquivos estáveis e aprovado nas conferências acima.

## Base de lançamentos — 2026-11-01

18 testes passaram, incluindo conservação de centavos em milhares de divisões, datas bissextas, âncora mensal, recorrência semanal e datas inválidas. Serviço testado com falha simulada na segunda parcela e reversão do grupo/saldo em driver fictício. Typecheck e build passaram; lint com zero erros e 17 avisos existentes. Integração SQLite existente e teste Electron das 16 telas com IPC fictício passaram. Nenhuma alteração no esquema ou no banco pessoal. Pendências de liquidação, armazenamento monetário e integração real ORM continuam no plano V2.

## Fundação V2 e navegação — 2026-11-01

Inventário gerado: 16 rotas, 21 entidades, 129 canais IPC e 6 migrações. Branch refactor/contabily-v2-foundation. Baseline: 10 testes e integração SQLite passaram. Após a reestruturação, typecheck e build passaram; lint sem erros e com 17 avisos existentes. Teste Electron com IPC fictício percorreu as 16 telas, confirmou a área Análises ativa na URL antiga de Relatórios e repetiu verificações de loading, filtros e animação. Captura stable-reports.png inspecionada: navegação contextual e pontilhado somente no canto inferior direito.

Escopo: fundação documental e reorganização da navegação, sem migração financeira. Backup/restauração integral e homologação real dos fluxos permanecem pendentes; consultar REESTRUTURACAO-V2.md. Nenhum teste utilizou o banco pessoal.

## Loading estável e cabeçalhos unificados — 2026-11-01

Typecheck e build passaram. Lint global: zero erros e 17 avisos preexistentes. Os 10 testes unitários e a integração SQLite passaram.

Após o build, npm run test:ui passou em Electron oculto com preload real e IPC fictício: cabeçalhos dos 16 módulos, ausência de alertas vazios, preservação dos elementos e dimensões dos cards durante/após troca de filtro, ausência de skeleton em consultas rápidas e descarte de resposta antiga. Conferidos ponto na ponta do rastro e cores legíveis do botão do login, inclusive no hover. Capturas em .qa/stable-loading-reports.png, .qa/stable-reports.png e .qa/stable-login.png. O ensaio usa dados isolados e não acessa o banco pessoal.

Não equivale a homologação completa de formulários, exportações, notificações nativas ou instalador. As seções seguintes registram etapas anteriores.

## Dark neutro e investimentos — 2026-11-01

Validação atual: 10 testes unitários passaram; typecheck e build passaram; lint global sem erros (17 avisos remanescentes). npm run test:sqlite executa seis migrações em banco em memória e verifica persistência, upsert mensal, isolamento por usuário, exclusão do histórico e deduplicação. Não modifica o banco pessoal.

Conferência visual em Electron compilado com preload real e respostas IPC fictícias: abertura com ponto/rastro, dashboard neutro, carteira, detalhes de investimento, relatórios avançados, manual, ampliação de card e login. Login em 1200×800 apresentou altura de documento e corpo iguais a 800, sem rolagem da página. Nenhum encerramento inesperado do renderer no ensaio.

O teste de avaliação de notificações cobre fontes habilitadas, preferências desativadas e chaves estáveis de deduplicação. A restrição única foi conferida no SQLite. Testes com respostas fictícias não homologam notificações nativas do Windows nem todos os módulos legados. As contagens e referências a tema claro nas seções abaixo são históricas.

## Datas, filtros, notificações e feedback — 2026-11-01

Estado mais recente: seis testes passaram; typecheck e build passaram; lint global sem erros. Calendários nativos date/month removidos das telas. Componentes de campo, mês, intervalo, mensagem e filtros centralizados. Corrigido o padding global que comprimia cards.

Conferidas capturas do Electron compilado com preload real e respostas IPC fictícias: Dashboard, Manual, Transações, Relatórios e Relatórios Avançados; central de notificações clara, manual escuro e calendário mensal escuro. Não houve encerramento inesperado do renderer no ensaio. Os dados de demonstração não foram gravados no banco pessoal. Essas capturas não homologam todos os formulários, exportações ou a geração automática de notificações.

Correção funcional: Relatórios usa report:generateReport, a mesma consulta filtrada usada nas exportações. Resumos, categorias e série mensal agora consideram todo o intervalo e os filtros de conta/categoria/tipo. Corrigidos os valores de tipo para income/expense. Teste com repositório injetado verifica encaminhamento de filtros, soma em dois meses e agregação por categoria; não substitui integração com banco real.

Os testes adicionais de intervalo verificam inversão dos extremos, virada de ano, valores inválidos e ausência de mutação do estado original. Os avisos remanescentes de lint são registrados no relatório local .lint-report.json e não foram ocultados desativando regras.

## Janela integrada, manual e revisão do backend — 2026-11-01

Estado mais recente: npm test passou (3 testes); npm run typecheck e npm run build passaram; npm run lint passou com zero erros e 47 avisos. As contagens de 27 erros registradas nas seções anteriores são históricas e foram resolvidas nesta revisão.

Renderer compilado inspecionado em Electron isolado, com preload real e respostas IPC fictícias, sem banco pessoal. Capturas conferidas de dashboard, manual e transações. Ajustados acesso fixo à ajuda, elevação das superfícies e cabeçalho interno. Sem encerramento inesperado do renderer no teste. O ensaio não verifica integrações reais, todos os formulários, restauração de banco ou instalador.

Correções financeiras: transações rejeitam valores não finitos; transferências rejeitam valores e taxas inválidas e datas não reconhecidas. Categorias de transferências são resolvidas por usuário/tipo dentro da transação existente. Essas alterações não corrigem retroativamente registros existentes. Recomenda-se cobertura de integração adicional para pagamentos, recorrências e concorrência de saldos; não há garantia de ausência de outros defeitos legados.

## Revisão visual — 2026-11-01

Padronizados os contêineres de todos os módulos do painel, cabeçalhos, superfícies Paper, tema grafite/menta, carregamentos iniciais e transições entre rotas. Login/cadastro usam fundo suave compartilhado. Ver docs/DESIGN-SYSTEM.md para cobertura e regras.

Typecheck e build passaram após a refatoração. ESLint das páginas, estilos e PageLayout terminou sem erros; o lint global permanece com 27 erros herdados em outros módulos. Não foi executada homologação visual interativa de cada tela, formulário ou tema; a revisão estrutural não equivale a cobertura funcional de 100%.

Data: 2026-11-01. Plataforma: Windows x64, Node 20.19.4, Electron 38.7.1 instalado pelo lockfile.

- Instalação: dependências instaladas; o postinstall inicialmente falhou porque a base forçava compilação nativa sem Visual Studio. Após desativar buildDependenciesFromSource, npm run rebuild:native concluiu usando o binário compatível.
- npm run typecheck: passou após corrigir quatro propriedades de limites de data que recebiam null em vez de undefined.
- npm run build: passou para main, preload e renderer; três migrações copiadas para out/main/migrations.
- SQLite: Electron executado em modo Node carregou better-sqlite3 e aplicou as três migrações em banco em memória sem erro. Não utilizou dados financeiros reais.
- ESLint dos arquivos TypeScript alterados: passou sem erros ou avisos.
- ESLint do projeto completo: 27 erros e 162 avisos preexistentes em outros módulos, incluindo any explícito, construtores vazios e tipos vazios. Não foram desativadas regras para esconder falhas.

Limites: interface desktop, cadastro completo, isolamento entre usuários, persistência após reinicialização e instalador Windows ainda não foram homologados manualmente. Não há suíte automatizada de testes configurada na base. Build e typecheck não substituem testes de uso.

Evoluções planejadas, ainda não entregues: separação entre competência e liquidação, valores em centavos inteiros e backup/restauração integral com validação transacional. O relatório de planejamento não deve ser interpretado como uma lista de funcionalidades já implementadas.
