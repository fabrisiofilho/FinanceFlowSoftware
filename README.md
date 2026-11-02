# Contabily

Aplicativo desktop para gerenciar ganhos e gastos mensais, derivado do FinanceFlowSoftware de fabrisiofilho.

Interface somente dark neutro, com cards ampliáveis, busca nos detalhes e menu agrupado. Em **Investimentos**, cadastre o valor aplicado, registre ou corrija rendimentos mensais e simule uma taxa mensal definida por você por até 360 meses. A simulação é separada dos registros reais; não calcula automaticamente CDI, impostos, resgates ou novos aportes.

O sininho oferece preferências, avisos por categoria, orçamento, saldo, vencimento, metas, recorrências, fechamento de fatura e lembretes de rendimento pendente. A avaliação ocorre com o aplicativo aberto e evita avisos automáticos duplicados.

## Executar

Use Node.js 22.12 ou superior e npm. Na pasta do projeto:

```powershell
npm ci
npm run dev
```

No primeiro acesso, crie um usuário local. Depois, cadastre uma conta financeira e categorias; use Transações para registrar receitas e despesas. O painel permite selecionar o mês de referência. Os dados são locais, sem integração bancária.

## Funcionalidades disponíveis no código

- Cadastro e edição de receitas e despesas, com conta, categoria e data.
- Filtros de transações por período, tipo, categoria e conta.
- Painel com ganhos, gastos e resultado do mês selecionado, além do saldo atual das contas.
- Módulos herdados para relatórios, contas, cartões, metas, orçamentos e recorrências. Sua presença não significa que todos os fluxos tenham sido homologados.

O resultado mensal usa a data da transação e equivale a receitas menos despesas. Não representa previsão nem distingue pagamentos pendentes e realizados. O saldo das contas e as transações recentes são informações atuais; o gráfico de evolução continua mostrando os últimos seis meses.

## Desenvolvimento

A reestruturação incremental segue [o plano V2](docs/REESTRUTURACAO-V2.md), com [inventário verificável](docs/INVENTARIO-V2.json). O menu agrupa as telas em Visão geral, Movimentações, Contas e cartões, Investimentos, Planejamento, Análises, Configurações e Ajuda. As rotas especializadas permanecem disponíveis.

Electron + React + TypeScript, electron-vite, Material UI, Redux Toolkit, TypeORM e better-sqlite3. Consulte [diretrizes](docs/DIRETRIZES.md), [plano](docs/PLANO.md) e [decisão inicial](docs/decisions/001-base.md). Instruções para agentes em AGENTS.md.

```powershell
npm run typecheck
npm test
npm run test:sqlite
npm run lint
npm run build
npm run test:ui
npm run build:win
```

O último comando gera o instalador em dist. Dependências nativas podem exigir ferramentas de compilação C++ para Windows quando não houver binário compatível. Não existe canal de publicação ou atualização configurado para o Contabily.

Após o build, `npm run test:ui` verifica os cabeçalhos dos 16 módulos, carregamento ao trocar filtros, respostas fora de ordem e animação do login em Electron oculto. Usa IPC fictício e dados isolados em `.qa`, sem acessar o banco pessoal.

O menu **Ajuda → Manual do sistema** explica as funções e permite buscar assuntos. A barra superior integrada controla a janela. Após mudanças no processo main ou preload, encerre e reinicie o aplicativo para carregar os novos controles.

## Dados locais

Em desenvolvimento: database/finance.db dentro do projeto. No aplicativo instalado: database/finance.db no diretório userData do Electron correspondente ao Contabily. Bancos anteriores do FinanceFlow não são importados automaticamente. Não apague o banco para atualizar o esquema; use migrações. Para copiar o banco manualmente, encerre o aplicativo antes e mantenha juntos eventuais arquivos auxiliares do SQLite.

## Origem

Base: https://github.com/fabrisiofilho/FinanceFlowSoftware

Commit inicial: 40921deead2e3dd6b8a6a337505e9ac1e51006fc. Histórico Git e autoria original preservados. O remoto origin ainda aponta para a base; esta entrega não publica alterações nem cria repositório remoto. A base não contém um arquivo de licença identificado; não foi adicionada uma licença nova.

---

<!-- github-standardizer:start -->
## Overview

Desktop personal finance application for expenses, income, and investment tracking.

## Technology indicators

- Node.js ecosystem

## Getting started

Check the project manifests and existing documentation for supported setup commands. No installation instructions were inferred.

<!-- github-standardizer:end -->
