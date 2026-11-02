# Núcleo portátil e consultas de listagem

Status: implementado no desktop em 2.1.0.

A preparação para React Native exige regras sem dependências de Electron/Node/TypeORM e sem consultas no renderer. O núcleo público fica em `src/shared/finance/index.ts`; os módulos possuem testes de cenários financeiros e uma verificação de imports de plataforma. O caso `contributeToGoal` recebe uma porta de persistência; o adaptador main executa o caso dentro da unidade de trabalho serializada do SQLite. Comandos de lançamentos, parcelas, liquidação, impacto de saldo e vínculo de fatura também são usados pelo desktop.

Serviços main continuam orquestrando autorização, repositórios e efeitos locais. Não se copiam entidades TypeORM ou componentes MUI para o futuro app. A integração mobile será outro adaptador, com as mesmas regras e cenários, após definir identidades, livro e protocolo de sincronização.

Listagens recebem pesquisa, seleções e paginação em endpoints específicos do preload. O backend aplica propriedade, parâmetros e limites; a interface apenas compõe páginas recebidas e descarta respostas antigas. Expansão é optativa e contém uma consulta própria quando há histórico grande. Removida a busca genérica que inspecionava o DOM dos cards.

A migração 011 é aditiva para o esquema 3: imagens de contas, vencimento configurável, ajustes de saldo, progresso do guia e categorias iniciais. Não apaga registros. Backup usa o snapshot integral e aguarda a fila financeira.

Detalhes de telas, testes e limitações: [entrega 2.1.0](../ENTREGA-2.1.0.md).
