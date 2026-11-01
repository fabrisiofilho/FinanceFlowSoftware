# Validação do incremento inicial

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
