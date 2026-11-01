# Dark neutro, cards ampliáveis e investimentos

## Visual e navegação

O aplicativo utiliza somente dark: fundos #101216, superfícies #191C22, bordas #30353F e texto cinza claro. Verde é destaque, não o fundo do sistema. Fonte única Segoe UI com fallback do sistema, sem carregamento remoto. Navegação separada por movimentos, patrimônio, planejamento, análises e ajuda. Tabs usam ícone ao lado do texto. Campos têm altura de 44px e cantos de 8px; calendário mensal mais compacto.

Cards compartilham ExpandableCard, com efeitos de borda/luminosidade sem deslocamento e ação de ampliar. O modal apresenta o conteúdo do card, busca e rolagem. Busca filtra linhas/listas; em conteúdo textual, realça correspondências. Modais de cadastro continuam sendo formulários, pois não há conteúdo a filtrar. Cards em grids são esticados na mesma linha. O canvas principal usa pontilhado discreto.

Abertura com ponto luminoso e três segmentos curtos de opacidades diferentes, que desaparecem atrás do ponto. Não deixa uma linha crescente permanente. Login e abertura não rolam a página; cadastro pode rolar internamente se necessário. Movimento reduzido e pular abertura continuam disponíveis.

## Investimentos

Nova carteira local com nome, tipo, aporte inicial, competência inicial e taxa mensal estimada definida pelo usuário. Não usa CDI/Selic ou taxa de produto obtida da internet. Taxa inicial da interface é zero até ser informada.

Rendimentos reais são registros em centavos inteiros, únicos por investimento/competência. Salvar o mesmo mês substitui o valor, não acumula um segundo rendimento. Aceita perdas sem permitir saldo final negativo. Só registra competências do início até o mês atual e valida propriedade pelo usuário autenticado. Exclusão confirmada remove também o histórico.

Projeção de 1–360 meses parte do saldo registrado, aplica taxa fixa com juros compostos e arredonda centavos a cada mês. É hipotética, sem impostos, novos aportes ou resgates. Não promete rentabilidade de CDB e não altera contas ou receitas automaticamente. Painel exibe a carteira separada dos saldos das contas, para não somar um mesmo capital duas vezes.

Estrutura: contratos e cálculo puro em shared; serviço de validação e caso de uso; repositório com SQL parametrizado; controlador autenticado; bridge tipada. Migrações 004–006 preservam os dados existentes.

## Alertas e notificações

A avaliação com o aplicativo aberto cobre regras ativas por categoria, vencimentos cadastrados, orçamento, saldo baixo (excluindo cartão de crédito), metas alcançadas, fechamento de faturas e rendimentos do mês anterior pendentes. Recorrências geradas criam aviso após a geração real. Agendamentos são processados separadamente e respeitam som; avisos futuros ou descartados não entram no histórico visível antes da hora.

Preferências editáveis no sininho, com validação de limites no main e lista permitida de campos. A atualização ocorre na entrada, foco e a cada 60 segundos. Avaliações concorrentes do mesmo usuário compartilham a operação. Chave única no SQLite impede duplicar avisos automáticos, inclusive quando um aviso foi lido/descartado. Ao abrir um aviso, há link para a tela de origem.

Vencimento cadastrado não equivale a conta ainda não paga: o modelo legado não tem quitação separada. O texto pede conferência e não afirma inadimplência. Notificações nativas dependem do suporte/configuração do sistema operacional. A aplicação precisa estar aberta para avaliar condições e não executa pagamentos.

## Limites da entrega

Carteira não possui resgates, múltiplos aportes datados, tributação, cotações ou sincronização bancária. Não foi reescrito integralmente o backend legado. Testes e inspeção visual não constituem garantia de ausência de defeitos em todos os fluxos.
