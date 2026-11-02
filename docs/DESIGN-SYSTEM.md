# Padrões de interface do Contabily

## Identidade

Revisão 2.0.1: receitas usam verde #89E5B1, despesas/erros coral #FF9CAA, avisos âmbar e informação azul. Estados selecionados combinam texto, borda visível e fundo semântico; preservar contraste mínimo de 4,5:1 para texto normal. Não usar tokens inexistentes como error.lighter. Em botões semânticos preenchidos, texto escuro e hover claro preservam leitura. Chips e avisos usam tom translúcido com texto na cor principal do estado.

A aplicação utiliza somente dark neutro: fundo #101216, superfície #191C22, borda #30353F e texto secundário #AEB6C3. Verde menta #9BD9B5 destaca ações, foco e navegação; não aplicar grandes superfícies verdes. Botões primários e secundários preenchidos usam menta com texto #102219; hover #B5E7CA. Estados desabilitados preservam leitura. Cores de erro, atenção e informação mantêm seus significados. Tokens ficam em styledTheme/muiTheme; fonte única Segoe UI local.

## Estrutura das telas

- PageContainer: largura máxima de 1600px e espaçamento fluido de 20–40px.
- PageHeader: título h1, descrição e ações com a mesma hierarquia, tamanhos e quebra responsiva em todos os 16 módulos do painel, incluindo Dashboard e Manual. Cabeçalhos e filtros permanecem montados durante consultas.
- ContentSurface/ExpandableCard: superfície neutra com borda. A ação de ampliar é opcional e restrita a históricos relevantes, com busca e paginação no backend; indicadores e cadastros individuais não ampliam. Formulários preservam controles próprios. Cards da mesma linha esticam juntos; resumos financeiros usam metricCardStyles, altura mínima de 112px e padding de 24px.
- TitleBar: barra integrada de 40px e controles da janela fora da área de arraste. Cabeçalho interno e menu persistem entre rotas.
- Tabs: ícone e nome na horizontal; nome sozinho quando não existe ícone.
- Manual: índice com ícones, busca e orientação por função em pages/Manual/topics.ts; usa o mesmo PageHeader das páginas financeiras.

## Carregamento

ContentLoading envolve apenas o conteúdo consultado, depois do cabeçalho e dos filtros. Não retornar uma página alternativa durante loading. Consultas de atualização preservam os cards e dados anteriores; ExpandableCard exibe CardSkeleton sobre a mesma moldura, sem alterar suas dimensões. Skeletons de listas no primeiro acesso são placeholders compartilhados; não representam quantidade conhecida de registros.

Atualizações aguardam 140ms antes de mostrar skeleton, evitando flashes nas consultas rápidas. Uma vez visível, o skeleton permanece por pelo menos 220ms e desaparece com transição de opacidade. Isso não atrasa a consulta ao banco. Indicadores de salvar, importar, exportar e recalcular permanecem nos respectivos controles. Filtros não ficam bloqueados pela atualização dos resultados. FilterPanel declara loading=false.

Dashboard, Relatórios, Transações e Orçamento usam useRequestSequence para descartar respostas de filtros anteriores e invalidar requisições ao desmontar. Falhas preservam dados anteriores, encerram a espera e apresentam mensagem contextual. Carregamento não deve esconder erros nem substituir o cabeçalho por skeleton.

## Animações e acessibilidade

FinancialTrace calcula ponto e rastro pela mesma posição normalizada sobre um único caminho SVG. O ponto permanece na ponta do rastro; camadas de menor opacidade formam a cauda. Abertura executa uma passagem e login repete lentamente. Respeitar prefers-reduced-motion.

Logo da abertura: crescimento do símbolo em 900ms e brilho radial em 1800ms, sem repetição. Nome de 32px usa line-height 1.3 e overflow visível para preservar descendentes como o y. Movimento reduzido ignora a abertura; nenhum card recebe essa animação.

RouteTransition usa entrada por opacidade de 220ms e um brilho verde discreto de 700ms no topo do conteúdo. Só a mudança de rota dispara o efeito; filtros não reiniciam a animação. Cards não animam posição nem escala; borda e luminosidade oferecem feedback. Restaurar a rolagem ao mudar a rota.

Carregamento oferece status acessível; conteúdo coberto fica inert e aria-hidden. Movimento reduzido desativa animações e transições. Formulários mantêm rótulos, contraste e foco visível.

## Campos, filtros e mensagens

Input centraliza texto, senha, número e busca; FormTextField, SelectInput e adaptadores reutilizam essa base. Altura mínima de 44px, raio de 8px e linha de texto de 20px. Placeholders e rótulos usam texto secundário legível; não reduzir sua opacidade adicionalmente.

DatePicker concentra calendário em português; MonthField atende competências e DateStringField adapta YYYY-MM-DD sem conversão para UTC. Não usar date/month nativos. Calendários de mês/ano não reservam a área vazia de uma grade diária.

FilterPanel oferece limpar e recolher/expandir; MonthRangeFields padroniza De/Até em Transações e Relatórios. Orçamento usa o mesmo painel para competência. AppAlert, AlertBox, chips e toasts compartilham tokens semânticos. NotificationBell fica no cabeçalho desktop/mobile, consulta avisos ao entrar/focar e periodicamente e permite leitura e configuração.

## Validação

Executar typecheck, lint, testes e build. Após build, npm run test:ui verifica os cabeçalhos dos 16 módulos, loading com consultas atrasadas, identidade/dimensões dos cards, respostas fora de ordem, consultas rápidas e geometria do ponto/rastro em Electron oculto com IPC fictício e sem banco pessoal. Capturas ficam em .qa. Esse ensaio não homologa todos os formulários ou o instalador.
