# Contabily 2.2.0

- Nova seção **Dados externos**: dólar, euro, meta Selic, CDI diário e IPCA mensal, com unidade, data de referência, histórico e link da fonte oficial do Banco Central.
- Conversor de referência para dólar/euro e IPCA acumulado em 12 meses calculado pela composição de observações consecutivas. Simulações não alteram saldos ou investimentos.
- Cache local de 30 minutos, atualização manual com intervalo mínimo de um minuto e recuperação da última consulta quando a fonte estiver indisponível. Ausência de dados nunca aparece como cotação zero. As consultas não enviam registros financeiros.
- Primeiros passos virou um **tour guiado**: destaque do controle na tela, setas, progresso, dicas e acompanhamento dos formulários em modal. Permite voltar, pausar, retomar e rever após a conclusão em Configurações, preservando o progresso do perfil.
- Manual atualizado para os dois recursos.

Sem alterações de esquema ou limpeza do banco. Dados externos são referências publicadas, não cotações em tempo real nem preços finais de compra/venda. As unidades de CDI diário, Selic anual e IPCA mensal são distintas.

Validação: 36 testes unitários, verificações SQLite/ORM, typecheck, build, ensaio Electron das 19 telas e consulta real das cinco séries. Lint sem erros, com 16 avisos preexistentes. O ensaio de interface utiliza dados fictícios e não significa homologação integral de todos os cenários do aplicativo. Mobile e sincronização seguem no planejamento.

Fonte: [Dados abertos do Banco Central](https://www.bcb.gov.br/acessoinformacao/dadosabertos), séries SGS 1, 21619, 432, 12 e 433.
