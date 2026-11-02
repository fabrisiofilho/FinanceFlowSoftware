# Contabily 2.1.0

- Cadastro de conta e categoria dentro do lançamento, por modal, com seleção automática e preservação dos campos preenchidos. Atalhos contextuais também em recorrências, transferências, orçamento, alertas, cartões, investimentos e importação.
- Expansão opcional: o histórico de lançamentos do painel tem busca no backend e paginação. Cards de saldo, indicadores, contas e formulários não oferecem expansão desnecessária.
- Busca paginada e rolagem contínua em contas, categorias, metas, recorrências, transferências, transações e investimentos, com alternativa “Carregar mais”. Totais da carteira não dependem dos cards carregados.
- Filtros com várias contas, categorias, tipos e situações em transações; relatórios e exportações compartilham os filtros múltiplos.
- Categorias iniciais com ícones compatíveis e carga sem duplicação. Logo/imagem local e cor de identificação para todos os tipos de conta.
- Guia de primeiros passos por perfil, com etapas verificadas no banco, navegação entre telas e retomada na visão geral. Instruções fixas para importação de transações e manual atualizado.
- Correções de autorização de anexos, etiquetas, importações e cadastros vinculados. IPC privado exige sessão e frame principal; navegação externa bloqueada, links limitados a HTTP/HTTPS e preload em sandbox sem API IPC genérica.
- Contribuições em metas, transferências, vínculos de faturas e ajustes de saldo protegidos por operações atômicas. Ajustes persistem no recálculo e no backup; textos de CSV são neutralizados contra fórmulas.
- Núcleo financeiro compartilhado em TypeScript, sem Electron, Node, TypeORM ou React, consumido pelo desktop. Mobile e Google Sheets continuam no planejamento.

Migração 011 compatível com o esquema 3 das versões 2.0.x: preserva os registros existentes e não exige limpar o banco. Para bancos anteriores ao esquema 3, permanece a restrição histórica documentada. Faça backup antes de atualizar.

Validações e limites estão em [ENTREGA-2.1.0.md](ENTREGA-2.1.0.md). Testes aprovados não significam homologação de todos os cenários possíveis nem sincronização pronta.
