# Contabily 2.3.0

- Seleções múltiplas permanecem em uma linha, com rolagem lateral e espaço para continuar a busca.
- Recorrências mensais: mesmo dia, primeiro dia útil ou último dia útil do mês. Calendário de segunda a sexta, excluindo feriados nacionais brasileiros; formulário mostra prévia e explica os limites do calendário.
- Descrição obrigatória nas recorrências, com mensagens por campo. Transferências e orçamento deixam de ignorar o clique em Salvar quando há dados faltantes.
- Revisão de campos obrigatórios, espaços em nomes/descrições, valores monetários, identificadores e datas. Liquidação exige data no formulário; datas inválidas não viram automaticamente hoje ou ausência de prazo.
- Corrigida a preservação do dia 31 após fevereiro. Edição de descrição não reagenda a recorrência. Atualização de regras aceita somente campos permitidos.
- Manual e [revisão dos formulários](REVISAO-FORMULARIOS-2.3.0.md) atualizados.

Migração 012 compatível com o esquema 3, preservando registros. Não exige limpar o banco. Feriados locais e pontos facultativos não integram as regras de dia útil.

Validação: 40 testes unitários, SQLite/backup, ORM real, typecheck, build e ensaio Electron das 19 telas. Lint sem erros, com 13 avisos anteriores remanescentes. Os testes usam bases e dados isolados e não significam homologação integral de todos os cenários.
