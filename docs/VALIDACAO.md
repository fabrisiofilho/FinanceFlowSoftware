# Validação do incremento inicial

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
