export const manualTopics = [
  {
    title: 'Lançamento em qualquer tela',
    route: '/panel/transactions',
    description: 'Registre uma receita ou despesa preservando a tela atual.',
    steps: [
      'Use + Novo na barra principal, ou Ctrl+Shift+R para receita e Ctrl+Shift+D para despesa.',
      'Preencha os dados essenciais; Mais opções contém recorrência, parcelamento e detalhes. Ao fechar um formulário alterado, confirme o descarte.',
      'Falhas preservam os campos. O lançamento só é confirmado após persistência e as consultas afetadas são atualizadas.',
    ],
  },
  {
    title: 'Financiamentos e parcelas',
    route: '/panel/financing',
    description:
      'Controle previsões e pagamentos sem confundir principal com consumo.',
    steps: [
      'Cadastre contrato manual ou projeção SAC/Price com taxa efetiva mensal, saldo de corte e parcelas remanescentes. O cadastro não movimenta contas.',
      'Informe o valor pago e a parcela efetiva de principal no comprovante. O total sai da conta; juros/encargos são despesa e o principal reduz o passivo.',
      'Pagamento parcial mantém o saldo restante em aberto. Ajustes exigem justificativa e somente parcelas sem pagamento podem ser reprojetadas.',
      'Estorne na área Financiamentos para devolver o valor à conta. Os lançamentos vinculados não podem ser editados isoladamente.',
      'Indexadores, renegociação e amortização extraordinária com redução automática de prazo/prestação ainda não estão disponíveis.',
    ],
  },
  {
    title: 'Relatórios avançados e diagnóstico',
    route: '/panel/advanced-reports',
    description: 'Analise períodos comparáveis e consulte métricas locais.',
    steps: [
      'Selecione início e fim exclusivo, base realizado por liquidação ou competência, conta e categoria. As abas e o CSV usam a mesma resposta.',
      'Meses sem movimento são zero. Percentual sem base anterior é indisponível. Score exige três meses completos com movimentos e renda; ele é heurístico.',
      'Selecione somente contas líquidas dedicadas à reserva; cartões são rejeitados. Não conte novamente valores investidos. Sem fontes ou despesas representativas, a reserva fica indisponível.',
      'Configurações → Diagnóstico mede processos, SQLite e arquivos a cada cinco segundos enquanto aberta. Copiar relatório remove o caminho pessoal.',
    ],
  },

  {
    title: 'Recorrências e dias úteis',
    route: '/panel/recurring',
    description:
      'Programe receitas e despesas, com regras mensais por dia do mês ou dia útil.',
    steps: [
      'Informe descrição, valor positivo, frequência, conta ou cartão, categoria e data inicial. Campos obrigatórios têm asterisco e mensagens de validação.',
      'Na frequência Mensal, escolha Mesmo dia do mês, Primeiro dia útil do mês ou Último dia útil do mês. A prévia mostra a primeira data a partir do início informado; se ela já passou naquele mês, a regra começa no mês seguinte.',
      'O calendário considera segunda a sexta e exclui feriados nacionais brasileiros, incluindo Sexta-feira da Paixão. Não exclui feriados estaduais, municipais, Carnaval, Corpus Christi ou pontos facultativos.',
      'No modo Mesmo dia do mês, meses curtos usam o último dia disponível e o mês seguinte volta ao dia original. Uma regra do dia 31 usa 28 ou 29 em fevereiro e volta a 31 em março.',
      'Gerar Pendentes processa uma ocorrência vencida por regra em cada execução, sem duplicar o mesmo dia. Por padrão o lançamento fica pendente; confirmar automaticamente afeta o saldo e deve ser escolhido conscientemente.',
      'Nos filtros múltiplos, as opções ficam em uma linha. Use a rolagem lateral ou navegue pelos itens para consultar as seleções restantes.',
    ],
  },
  {
    title: 'Primeiros passos e cadastros rápidos',
    route: '/panel/dashboard',
    description:
      'Um guia que acompanha o cadastro inicial e permite retomar de onde parou.',
    steps: [
      'Na visão geral, clique em Retomar guia. O tour destaca os botões e formulários de cada etapa, com dicas, progresso e verificação do cadastro. A etapa fica salva no seu perfil mesmo ao fechar o programa.',
      'Use Abrir cadastro para preencher o formulário durante o tour. Voltar revisita uma etapa; Continuar depois pausa o guia. Em Configurações, Fazer tour guiado permite revê-lo mesmo depois da conclusão, sem apagar o progresso.',
      'Depois de cadastrar, conclua a etapa para avançar. A verificação exige os registros necessários; orçamento é uma etapa opcional.',
      'Ao criar uma transação, abra a seleção de categoria ou conta e escolha Cadastrar agora. O cadastro abre em outro modal e o novo item é selecionado sem apagar os valores já preenchidos.',
      'Recorrências, transferências, orçamento, alertas, cartões, investimentos e importação também permitem criar os cadastros necessários dentro do formulário.',
      'As categorias iniciais já incluem ícones. Em Contas, escolha uma cor de identificação ou envie uma imagem PNG, JPEG ou WebP de até 500 KB. As imagens são guardadas localmente e incluídas no backup.',
    ],
  },
  {
    title: 'Dados externos: câmbio, juros e inflação',
    route: '/panel/external-data',
    description:
      'Consulte dólar, euro, meta Selic, CDI diário e IPCA mensal publicados pelo Banco Central.',
    steps: [
      'Abra Dados externos na barra lateral. Cada indicador mostra sua unidade e a data de referência; a data da consulta não representa uma cotação em tempo real.',
      'Selecione um indicador para ver o histórico disponível, a explicação e o link da fonte oficial. Passe o mouse, toque ou use Tab e as setas nos pontos para consultar data e valor. Mostrar valores exibe os números sobre a linha. O CDI é diário, a meta Selic é anual e o IPCA é mensal; as taxas não são diretamente equivalentes.',
      'No dólar ou euro, informe um valor para estimar a conversão em reais. A referência não inclui spread, tarifas ou impostos e não altera suas contas.',
      'O IPCA acumulado em 12 meses é calculado por composição de 12 observações mensais consecutivas. Se não houver dados suficientes, a estimativa fica indisponível.',
      'Os dados ficam em cache local por 30 minutos. Atualizar consulta novamente, com intervalo mínimo de um minuto. Sem conexão, o último dado disponível permanece identificado como salvo; sem histórico, o aplicativo mostra indisponível em vez de zero.',
      'A consulta envia somente as séries públicas e o período ao Banco Central. Seus registros financeiros não são enviados.',
    ],
  },
  {
    title: 'Busca, filtros e listagens',
    route: '/panel/transactions',
    description:
      'Encontre registros usando filtros combinados e carregamento por páginas.',
    steps: [
      'Os filtros de contas, categorias, tipos e situações aceitam várias opções. Dentro de um filtro, qualquer uma das opções é aceita; entre filtros diferentes, todos os critérios precisam ser atendidos.',
      'Contas, categorias, metas, recorrências, transferências, transações e investimentos consultam o banco ao buscar e carregam mais registros conforme a rolagem. Carregar mais e Tentar novamente também estão disponíveis.',
      'Os totais de listagem informam quantos registros atendem à busca, mesmo quando nem todos foram carregados.',
      'A expansão é restrita a listagens úteis. No painel, amplie Transações Recentes para consultar o histórico com busca e paginação no banco. Indicadores e cadastros individuais não têm botão de expansão.',
      'Relatórios e suas exportações utilizam os mesmos filtros múltiplos.',
    ],
  },
  {
    title: 'Simulação de IR',
    route: '/panel/income-tax',
    description:
      'Estime o ajuste anual de 2026, declarado em 2027, para cada contribuinte.',
    steps: [
      'Some a renda bruta tributável recebida e a previsão restante do ano. Não use toda entrada bancária como rendimento tributável.',
      'Inclua rendimentos dos dependentes e apenas deduções elegíveis. Informe educação separadamente por pessoa; o limite é individual.',
      'Compare desconto simplificado e deduções legais, imposto anual e saldo após retenções. Ao editar um valor, calcule novamente.',
      'A estimativa não grava transações nem envia declaração. Não abrange 13º, PLR, bolsa, ganhos de capital, exterior ou altas rendas. Dados da simulação são descartados ao sair da tela.',
    ],
  },
  {
    title: 'Rotina individual e familiar',
    route: '/panel/dashboard',
    description:
      'Um roteiro para identificar excessos e acompanhar o que está funcionando.',
    steps: [
      'Cadastre contas com saldo inicial, depois receitas e despesas. Use recorrentes para salário, aluguel e contas fixas; revise antes de gerar.',
      'Defina limites por categoria no Orçamento. Toda semana confira pendências, faturas, previsão de caixa e categorias sem orçamento.',
      'No fim do mês compare recebido, pago, resultado por competência e evolução por categoria. Separe redução real de gastos de contas ainda não pagas.',
      'Para a família, uma pessoa pode centralizar os registros no mesmo perfil e identificar o responsável na descrição. Perfis separados não consolidam o orçamento; não há compartilhamento entre dispositivos nem permissões familiares.',
      'Crie backup criptografado regularmente e guarde a senha fora do aplicativo.',
    ],
  },
  {
    title: 'Situação e liquidação',
    route: '/panel/transactions',
    description:
      'Separe a competência da data em que o dinheiro entrou ou saiu.',
    steps: [
      'Escolha Pendente, Liquidado ou Cancelado no lançamento. Pendente não movimenta saldo.',
      'Ao liquidar, informe a data em que pagou ou recebeu. A competência permanece independente.',
      'Cancelar reverte o efeito no saldo. Compras de fatura fechada ou paga não podem ser alteradas ou excluídas.',
      'Use o filtro Situação para conferir pendências; parcelas futuras e recorrências não confirmadas ficam pendentes.',
    ],
  },
  {
    title: 'Backup e restauração',
    route: '/panel/settings',
    description:
      'Proteja todos os dados locais com um arquivo criptografado por senha.',
    steps: [
      'Abra Configurações e informe uma senha de no mínimo 10 caracteres. Guarde-a fora do aplicativo.',
      'Criar backup abre o diálogo para salvar o arquivo .ctbackup. O arquivo inclui todos os perfis locais.',
      'Para restaurar, informe a mesma senha, escolha o arquivo e confirme a substituição. Arquivos inválidos são recusados antes de alterar o banco.',
      'Após restaurar, o aplicativo reinicia. A cópia do banco anterior fica no mesmo diretório e não é criptografada; proteja-a como o próprio banco.',
    ],
  },
  {
    title: 'Investimentos e rendimentos',
    route: '/panel/investments',
    description:
      'Acompanhe aportes iniciais, rendimentos realizados e uma simulação de taxa mensal fixa.',
    steps: [
      'Cadastre nome, tipo, valor aplicado e competência inicial.',
      'Em Rendimentos e simulação, escolha o mês e informe ganho ou perda. Salvar novamente no mesmo mês corrige o registro existente.',
      'A simulação usa o saldo registrado e juros compostos pela taxa mensal informada, sem impostos, aportes ou resgates. Não é promessa de rentabilidade.',
      'No cadastro, escolha uma conta para debitar o aporte inicial ou registre uma posição preexistente sem movimentar caixa. Nos detalhes, registre aporte, resgate, taxa ou imposto manual. Movimentos não são receitas/despesas; aplicações com histórico não podem ser excluídas.',
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
      'Os cards principais mostram recebido, pago e resultado pela data de liquidação. O resumo por competência e as pendências aparecem separadamente.',
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
      'Transferências internas não representam renda nem consumo e ficam fora dos totais de receitas e despesas dos relatórios.',
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
      'A visão mostra o saldo atual mais pendências e recorrências previstas para os próximos três meses; a tabela mensal cobre seis meses a partir de hoje.',
      'Receitas e despesas usam o vencimento quando informado. Lançamentos já liquidados não são somados novamente ao saldo atual.',
      'Faturas não pagas entram na previsão consolidada; o valor futuro de compras recorrentes no cartão ainda depende da geração da fatura.',
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
      'Em Configurações, crie e restaure backups criptografados de todos os perfis. A senha é indispensável; restaurar substitui o banco e reinicia a aplicação.',
      'Atualizações são consultadas nas releases de fabrisiofilho/contabily. A versão 2 usa esquema financeiro 3; bancos antigos são preservados e exigem recriação manual pelo proprietário.',
    ],
  },
];
