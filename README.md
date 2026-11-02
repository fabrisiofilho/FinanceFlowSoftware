# Contabily

Aplicativo desktop para gerenciar ganhos e gastos mensais, derivado do FinanceFlowSoftware de fabrisiofilho.

Interface somente dark neutro, com expansão opcional de histórico, consultas paginadas e menu agrupado. Em **Investimentos**, cadastre o valor aplicado, registre ou corrija rendimentos mensais e simule uma taxa mensal definida por você por até 360 meses. A simulação é separada dos registros reais; permite aportes hipotéticos no início ou fim do mês e não calcula automaticamente CDI ou impostos.

O sininho oferece preferências, avisos por categoria, orçamento, saldo, vencimento, metas, recorrências, fechamento de fatura e lembretes de rendimento pendente. A avaliação ocorre com o aplicativo aberto e evita avisos automáticos duplicados.

## Executar

Use Node.js 22.12 ou superior e npm. Na pasta do projeto:

```powershell
npm ci
npm run dev
```

No primeiro acesso, crie um usuário local. O guia de primeiros passos orienta o cadastro da conta; as categorias comuns já vêm com ícones. Use Transações para registrar receitas e despesas. O painel permite selecionar o mês de referência. Os dados são locais, sem integração bancária.

Consulte as [novidades da versão 2.8.1](docs/RELEASE-2.3.0.md): seleções múltiplas em uma linha, validações revisadas e recorrências no primeiro/último dia útil com feriados nacionais. A migração 012 preserva os registros do esquema 3, sem limpar o banco. Dados externos, conversor e tour guiado continuam disponíveis. Veja a [revisão dos formulários](docs/REVISAO-FORMULARIOS-2.3.0.md).

## Funcionalidades disponíveis no código

- Cadastro e edição de receitas e despesas, com conta, categoria e data.
- Filtros de transações por período, tipo, categoria e conta.
- Painel com ganhos, gastos e resultado do mês selecionado, além do saldo atual das contas.
- Módulos herdados para relatórios, contas, cartões, metas, orçamentos e recorrências. Sua presença não significa que todos os fluxos tenham sido homologados.

O resultado realizado usa a data de liquidação; a previsão por competência considera pendências separadamente. Dinheiro é armazenado em centavos inteiros. Transferências internas não são renda nem consumo. O saldo das contas e as transações recentes são informações atuais; o gráfico de evolução mostra os últimos seis meses.

Na versão 2.0.0 há backup/restauração integral criptografada em Configurações, movimentos de investimentos e simulação do IR ordinário do ano-calendário 2026 (declaração de 2027), com comparação de deduções e estimativa de imposto/restituição. A simulação não envia declaração nem substitui a classificação fiscal. Consulte a [avaliação de produto e pesquisa de mercado](docs/AVALIACAO-PRODUTO.md).

## Desenvolvimento

Revisão de 02/11/2026: consulte a [auditoria funcional e arquitetural](docs/REVISAO-COMPLETA-2026-11-02.md) e o [plano Android/iPhone com React Native e Google Sheets optativo](docs/PLANO-MOBILE-GOOGLE-SHEETS.md). A revisão registra defeitos, custos, etapas e critérios de aceite. As correções e limites da evolução atual estão na [entrega 2.1.0](docs/ENTREGA-2.1.0.md). Mobile e sincronização ainda não estão implementados. A [decisão proposta](docs/decisions/005-mobile-offline-google-sheets.md) prioriza uso offline e primeiro APK sem servidor próprio.

A reestruturação incremental segue [o plano V2](docs/REESTRUTURACAO-V2.md), com [inventário verificável](docs/INVENTARIO-V2.json). O menu agrupa as telas em Visão geral, Movimentações, Contas e cartões, Investimentos, Planejamento, Análises, Configurações e Ajuda. As rotas especializadas permanecem disponíveis.

Electron + React + TypeScript, electron-vite, Material UI, Redux Toolkit, TypeORM e better-sqlite3. Consulte [diretrizes](docs/DIRETRIZES.md), [plano](docs/PLANO.md) e [decisão inicial](docs/decisions/001-base.md). Instruções para agentes em AGENTS.md.

```powershell
npm run typecheck
npm test
npm run test:sqlite
npm run test:orm
npm run lint
npm run build
npm run test:ui
npm run build:win
```

O último comando gera o instalador em dist. Dependências nativas podem exigir ferramentas de compilação C++ para Windows quando não houver binário compatível. O canal próprio é [fabrisiofilho/contabily/releases](https://github.com/fabrisiofilho/contabily/releases). O updater consulta esse destino, solicita o download e permite instalar após concluir. Releases incluem instalador, blockmap e latest.yml. Versões que tinham o updater desativado precisam da primeira instalação manual.

Após o build, `npm run test:ui` verifica as 19 telas, tour guiado, conversor, simulação de IR, carregamento ao trocar filtros, respostas fora de ordem e animação do login em Electron oculto. Usa IPC fictício e dados isolados em `.qa`, sem acessar o banco pessoal. `test:orm` verifica colunas e consultas contra SQLite real, saldos, pagamentos, recorrência e isolamento. `test:external:live` consulta as cinco séries reais do Banco Central em perfil isolado; requer internet e disponibilidade da fonte.

O menu **Ajuda → Manual do sistema** explica as funções e permite buscar assuntos. A barra superior integrada controla a janela. Após mudanças no processo main ou preload, encerre e reinicie o aplicativo para carregar os novos controles.

## Dados locais

Em desenvolvimento: database/finance.db dentro do projeto. No aplicativo instalado: database/finance.db no diretório userData do Electron correspondente ao Contabily. **A versão 2 usa esquema 3 em centavos e exige banco novo para instalações anteriores**, conforme autorização do proprietário de 01/11/2026. Não há conversão automática dos valores antigos. O aplicativo bloqueia bancos incompatíveis e não os apaga. O proprietário deve fechar o aplicativo, guardar cópia integral do banco e auxiliares e mover a base antiga para um local seguro antes de criar a nova. Backups antigos não convertem o esquema. Atualizações posteriores compatíveis usam migrações. Nunca remova dados para contornar erro sem cópia recuperável.

## Origem

Base: https://github.com/fabrisiofilho/FinanceFlowSoftware

Commit inicial: 40921deead2e3dd6b8a6a337505e9ac1e51006fc. Histórico Git e autoria original preservados. O proprietário renomeou o repositório para [contabily](https://github.com/fabrisiofilho/contabily) em 02/11/2026 e autorizou commits, push e releases neste destino. A base não contém um arquivo de licença identificado; não foi adicionada uma licença nova.

## Evolução de 02/11/2026

As versões 2.4–2.8.1 acrescentam relatórios avançados com filtros e cobertura explícita, lançamento global, investimentos por abas, financiamentos manuais/SAC/Price, diagnóstico local, ocorrências de alertas e PDF verdadeiro. Consulte [execução do roadmap](docs/roadmap/EXECUCAO.md) e [validação integrada](docs/VALIDACAO-2.8.1.md). O mobile fica em projeto separado e entrega apenas APK, sem sincronização implícita.
