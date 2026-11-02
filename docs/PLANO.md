# Contabily

Aplicativo desktop Electron para acompanhar receitas, despesas e saldo mensal em reais. Este documento define a proposta inicial; a proposta de evolução deve respeitar a base FinanceFlowSoftware já inspecionada.

## Versão alvo (inclui evoluções ainda não implementadas)

- Painel com seletor de mês, receitas recebidas, despesas pagas, resultado realizado e previsão do mês.
- Cadastro, edição e exclusão de receitas e despesas com descrição, valor, categoria, data de competência, vencimento e situação (pendente ou liquidado). A liquidação registra uma data própria.
- Listagem com filtros por mês de competência, tipo, categoria e situação; busca por descrição.
- Categorias iniciais editáveis: salário, serviços, outros ganhos, moradia, alimentação, transporte, saúde, lazer e outros gastos. Categorias utilizadas podem ser arquivadas, preservando o histórico.
- Resumo dos gastos por categoria e evolução mensal de receitas e despesas.
- Persistência local e exportação/importação de backup versionado. Exportação CSV para análise externa.
- Interface em português brasileiro, moeda BRL, navegação por teclado, estados vazios e mensagens claras de validação.

## Regras financeiras

- Armazenar valores em centavos inteiros positivos. O tipo do lançamento determina receita ou despesa; nunca usar ponto flutuante para cálculos monetários.
- Resultado realizado do mês: receitas liquidadas menos despesas liquidadas, agrupadas pela data de liquidação.
- Previsão por competência: total das receitas menos total das despesas atribuídas ao mês, incluindo pendências. Exibir separadamente do realizado, com rótulos explícitos.
- Datas financeiras são datas de calendário no formato YYYY-MM-DD; não converter vencimentos para UTC. Timestamps técnicos podem usar UTC.
- Não interpretar campo vazio como zero. Validar valor positivo, descrição, datas existentes e categoria compatível com o tipo.
- Exclusão exige confirmação; falhas de gravação preservam o formulário. Importação valida o arquivo inteiro antes de alterar dados e oferece restauração integral explícita, sem mesclar registros silenciosamente.
- A primeira versão não oferece conexão bancária, investimentos ou contabilidade fiscal. Parcelamentos, recorrências, contas e metas ficam para etapas posteriores.

## Arquitetura proposta

Preservar e adaptar os padrões úteis da base após examiná-la. Separar domínio financeiro, casos de uso, persistência e apresentação. Evitar criar abstrações sem necessidade concreta.

O processo main do Electron controla banco, arquivos e operações privilegiadas. O preload expõe operações específicas por contextBridge. O renderer apresenta a interface, sem acesso direto ao Node ou ao sistema de arquivos. Ativar isolamento de contexto, desativar nodeIntegration e validar entradas de IPC no processo main. Restringir navegação e criação de janelas; avaliar sandbox e CSP conforme a base.

Usar repositórios para isolar persistência dos casos de uso. Preferir SQLite se compatível com a base e com o empacotamento; confirmar dependências e migrações antes de decidir. Gravações compostas e importações devem ser transacionais. Não adicionar servidor, autenticação ou sincronização para a primeira versão local.

## Sequência de entrega

1. Inspecionar README, instruções locais, dependências, licença, estrutura Electron, armazenamento e comandos da base. Registrar o commit de origem e manter seus créditos.
2. Definir identidade Contabily, documentar decisões e estabelecer validação, modelos e migrações.
3. Implementar lançamentos e persistência, depois painel, filtros e resumos.
4. Implementar backup e CSV; testar recuperação e manutenção dos dados após reiniciar.
5. Executar verificações da base, testes das regras financeiras e teste manual do aplicativo empacotado no Windows.

## Critérios de aceite

- Criar uma receita de R$ 5.000,00 e uma despesa de R$ 1.200,00 liquidadas no mesmo mês produz resultado realizado de R$ 3.800,00.
- Uma despesa pendente altera a previsão da sua competência e não o resultado realizado.
- Competência e liquidação em meses diferentes aparecem nos respectivos indicadores, sem duplicação.
- Editar e excluir recalcula os totais; reiniciar mantém os dados.
- Meses vazios exibem zero e orientação para o primeiro cadastro; valores inválidos não são gravados.
- Backup restaurado reproduz lançamentos e categorias; arquivo inválido não modifica a base.
- CSV preserva acentos e inclui cabeçalhos; neutraliza textos que planilhas possam interpretar como fórmulas.
- Interface funciona sem internet, não expõe APIs genéricas de execução e trata erros de armazenamento sem perda silenciosa.

## Situação atual

Planejamento adicional de 02/11/2026: Android e iPhone com preferência por React Native, primeiro uso por APK, SQLite local e integração Google Sheets optativa, sem servidor próprio na primeira fase. Consulte [PLANO-MOBILE-GOOGLE-SHEETS.md](PLANO-MOBILE-GOOGLE-SHEETS.md). A [revisão completa](REVISAO-COMPLETA-2026-11-02.md) encontrou falhas adicionais de autorização, concorrência de metas, vínculo de fatura e ajuste de saldo; devem ser corrigidas antes de sincronizar. A aprovação das suítes existentes não representa ausência desses defeitos. Este planejamento não implementa mobile/nuvem.

Em 02/11/2026, a versão 2.0.0 implementa centavos inteiros (esquema 3), competência e liquidação, backup integral criptografado, investimentos e simulação de IR de 2026. Bancos anteriores exigem recriação manual autorizada; não há limpeza automática. O proprietário renomeou o repositório para fabrisiofilho/contabily e autorizou publicação e atualização nesse canal próprio. Consulte README.md, docs/VALIDACAO.md e docs/AVALIACAO-PRODUTO.md para resultados, pesquisa de mercado e prioridades individuais/familiares. As seções iniciais deste plano registram a proposta original, não o inventário atual.
