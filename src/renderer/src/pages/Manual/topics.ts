export const manualTopics = [
  {
    title: 'Investimentos e rendimentos',
    route: '/panel/investments',
    description:
      'Acompanhe aportes iniciais, rendimentos realizados e uma simulação de taxa mensal fixa.',
    steps: [
      'Cadastre nome, tipo, valor aplicado e competência inicial.',
      'Em Rendimentos e simulação, escolha o mês e informe ganho ou perda. Salvar novamente no mesmo mês corrige o registro existente.',
      'A simulação usa o saldo registrado e juros compostos pela taxa mensal informada, sem impostos, aportes ou resgates. Não é promessa de rentabilidade.',
      'A carteira não movimenta contas automaticamente. Isso evita duplicar o aporte ou registrar estimativas como receitas realizadas.',
    ],
  },

  {
    title: 'Primeiros passos',
    route: '/panel/accounts',
    description:
      'Crie seu usuário local, cadastre uma conta financeira e revise suas categorias. Depois registre receitas e despesas em Transações.',
    steps: [
      'Use o saldo inicial da conta para representar o dinheiro que já existia antes dos lançamentos.',
      'Não registre o mesmo saldo inicial como receita, para evitar duplicação.',
      'Os dados ficam neste computador; sua conta local não sincroniza dados pela internet.',
    ],
  },
  {
    title: 'Visão geral',
    route: '/panel/dashboard',
    description: 'Acompanhe ganhos, gastos e resultado do mês selecionado.',
    steps: [
      'Escolha o mês de referência no painel.',
      'Resultado mensal é receitas menos despesas pela data da transação.',
      'Saldo das contas, lançamentos recentes e evolução dos últimos seis meses têm períodos próprios e não mudam todos com o seletor.',
    ],
  },
  {
    title: 'Transações',
    route: '/panel/transactions',
    description: 'Cadastre, edite, consulte e exclua receitas e despesas.',
    steps: [
      'Escolha tipo, descrição, valor positivo, conta, categoria e data.',
      'Use os filtros de período, conta, categoria e tipo; ordene pelas colunas da tabela.',
      'Revise parcelamentos e recorrências antes de salvar para evitar lançamentos repetidos.',
      'A exclusão remove o registro e pode alterar saldos e relatórios.',
    ],
  },
  {
    title: 'Contas',
    route: '/panel/accounts',
    description:
      'Organize os lugares onde seu dinheiro está: conta corrente, poupança, carteira e cartão.',
    steps: [
      'Cadastre nome, tipo e saldo inicial.',
      'Associe cada transação à conta correta.',
      'Use o recálculo de saldo quando necessário e confira os lançamentos que originaram o total.',
    ],
  },
  {
    title: 'Categorias',
    route: '/panel/categories',
    description: 'Classifique entradas e saídas para entender sua composição.',
    steps: [
      'Crie categorias compatíveis com receita ou despesa.',
      'Use nomes claros, como salário, alimentação e moradia.',
      'Alterações em categorias utilizadas devem preservar a classificação do histórico. Confira a mensagem exibida antes de excluir.',
    ],
  },
  {
    title: 'Cartões de crédito',
    route: '/panel/credit-cards',
    description: 'Consulte cartões, limites e faturas.',
    steps: [
      'Cadastre os dados do cartão e as datas de fechamento e vencimento.',
      'Confira as compras e parcelas na fatura correspondente.',
      'Revise o efeito de pagamentos no saldo; não registre a mesma compra novamente como gasto à vista.',
    ],
  },
  {
    title: 'Metas',
    route: '/panel/goals',
    description: 'Acompanhe o progresso para objetivos financeiros.',
    steps: [
      'Defina nome, valor desejado e prazo.',
      'Registre contribuições e consulte o progresso.',
      'Uma contribuição de meta não substitui a conferência dos saldos das suas contas.',
    ],
  },
  {
    title: 'Alertas',
    route: '/panel/alerts',
    description: 'Configure avisos para acompanhar condições financeiras.',
    steps: [
      'Escolha o tipo de alerta e os valores ou condições disponíveis no formulário.',
      'Ative apenas os avisos que deseja acompanhar.',
      'Confira a situação apresentada; os alertas não executam pagamentos ou movimentações bancárias.',
    ],
  },
  {
    title: 'Relatórios',
    route: '/panel/reports',
    description: 'Analise resultados por período, conta e categoria.',
    steps: [
      'Selecione os filtros e consulte o relatório.',
      'Compare receitas, despesas e distribuição por categoria.',
      'Use as opções de exportação CSV ou PDF disponíveis. Guarde arquivos financeiros em local privado.',
    ],
  },
  {
    title: 'Orçamento',
    route: '/panel/budget',
    description: 'Planeje limites de gastos e acompanhe sua utilização.',
    steps: [
      'Defina período, categoria e valor do orçamento.',
      'Compare o limite com os gastos registrados.',
      'O limite é uma referência de planejamento; não impede novos gastos.',
    ],
  },
  {
    title: 'Transferências',
    route: '/panel/transfers',
    description: 'Registre movimentações entre duas contas próprias.',
    steps: [
      'Escolha contas diferentes para origem e destino e um valor positivo.',
      'Confira data, descrição e taxa de conversão quando aplicável.',
      'A transferência cria lançamentos vinculados. Prefira removê-la por esta tela para manter a consistência.',
      'Os relatórios herdados podem incluir as duas pontas como entrada e saída; confira esse efeito ao analisar ganhos.',
    ],
  },
  {
    title: 'Recorrentes',
    route: '/panel/recurring',
    description: 'Organize movimentações que se repetem.',
    steps: [
      'Informe descrição, tipo, valor, conta, categoria e frequência.',
      'Confira datas e regras antes de gerar ou ativar lançamentos.',
      'Não duplique manualmente lançamentos já gerados por recorrência.',
    ],
  },
  {
    title: 'Fluxo de caixa',
    route: '/panel/cash-flow',
    description: 'Observe entradas, saídas e evolução do saldo no período.',
    steps: [
      'Escolha o período de análise.',
      'Compare os movimentos apresentados com seus registros.',
      'Projeções são estimativas baseadas nos dados cadastrados, não garantias de saldo futuro.',
    ],
  },
  {
    title: 'Relatórios avançados',
    route: '/panel/advanced-reports',
    description: 'Consulte indicadores e análises agregadas das finanças.',
    steps: [
      'Selecione os filtros disponíveis.',
      'Confira os períodos e a composição de cada indicador.',
      'Use os resultados como apoio para revisar gastos e planejamento.',
    ],
  },
  {
    title: 'Importar transações',
    route: '/panel/bank-import',
    description:
      'Importe arquivos de movimentações e revise os dados antes da confirmação.',
    steps: [
      'Selecione um arquivo no formato aceito pela tela (CSV ou TXT).',
      'Confira conta de destino, mapeamento de colunas, datas, valores e tipos.',
      'Revise a prévia e possíveis duplicações antes de concluir.',
      'Importar transações não equivale a restaurar um backup completo do aplicativo.',
    ],
  },
  {
    title: 'Janela, tema e dados',
    route: '/panel/dashboard',
    description: 'Use a barra integrada e as preferências da aplicação.',
    steps: [
      'Arraste a barra superior para mover a janela; use os botões para minimizar, maximizar/restaurar e fechar.',
      'O sistema utiliza tema escuro neutro. Recolha o menu pelo botão lateral.',
      'Sair encerra a sessão local. Fechar a janela não apaga dados.',
      'Não há backup completo integrado nesta versão. Antes de copiar o banco manualmente, feche o aplicativo e consulte a localização dos dados no README.',
    ],
  },
];
