# 002 — Janela integrada e validações financeiras

Data: 2026-11-01

## Decisão

Usar janela Electron sem moldura nativa e TitleBar compartilhada em todas as rotas, inclusive autenticação. A área de arraste exclui botões. O preload expõe apenas minimizar, alternar maximização e fechar; o main aceita comandos da janela e frame remetentes, removendo listeners ao fechar. O espaço disponível desconta os 40px da barra. DevTools deixa de abrir automaticamente.

Manual acessível pela área fixa de ajuda no menu, com busca, orientações por módulo e links para as telas. Evitar descrever funcionalidades planejadas como disponíveis.

Centralizar tamanho compacto e variante outlined de TextField/FormControl no tema. Cartões Material UI usam conteúdo com padding próprio, evitando duplicação Card + CardContent. ContentSurface recebe elevation 0 explicitamente. O cabeçalho interno foi reduzido a 64px.

## Backend

Regras numéricas puras ficam em main/domain/financial-validation.ts. TransactionService e TransferService as consomem antes da persistência. TransferCategoryService tem responsabilidade única: localizar/criar categoria do usuário e tipo corretos usando o EntityManager da transação existente. Isso elimina o ID de categoria fixo 1 nas transferências.

Removidos construtores vazios; dados brutos de importação passam a unknown; relações de categoria no fluxo de caixa usam tipo explícito. Carregamento dinâmico de módulos usa createRequire, necessário à infraestrutura compartilhada com processos Electron/Node. Falhas na recuperação/fechamento de conexão são registradas.

Não houve reescrita integral dos serviços legados. A separação domínio/aplicação/infraestrutura foi aplicada aos pontos alterados; serviços maiores ainda podem ser divididos por casos de uso em mudanças futuras, com cobertura funcional própria. Não afirmar conformidade total com Clean Architecture ou SOLID apenas por passar lint.

## Verificação

Três testes automatizados cobrem valores inválidos, conversão e autorização/limpeza dos controles de janela. npm test, typecheck e lint executados. Capturas do renderer compilado foram conferidas em execução isolada do Electron, com dados fictícios e sem acesso ao banco pessoal: dashboard, manual e transações. Essa inspeção não substitui homologação funcional de todos os módulos, testes de redimensionamento do SO ou instalador.
