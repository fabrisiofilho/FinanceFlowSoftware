# Avaliação de produto — 02/11/2026

## Parecer e método

O Contabily atende ao registro e planejamento financeiro individual local. Uma pessoa consegue centralizar o orçamento da casa; ainda não é um produto colaborativo familiar. Recomenda-se tratar a 2.0.0 como primeira versão de validação, com esquema novo e sem migração dos bancos anteriores. A revisão combina leitura dos fluxos, testes financeiros, consultas reais em SQLite e inspeção visual. Não houve entrevistas ou testes cronometrados com usuários; facilidade de uso é uma avaliação heurística, não uma medição comprovada.

## Referências consultadas

Pesquisa em fontes dos próprios produtos, sem comparar preços ou presumir equivalência de implementação:

| Referência                                                                                                                                  | Evidência observada                                                                                         | Aplicação no Contabily                                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| [Organizze](https://www.organizze.com.br/) e [visão geral](https://ajuda.organizze.com.br/hc/pt-br/sections/6106034604947-Vis%C3%A3o-geral) | Contas, cartões, limites, maiores gastos, previsão e acesso rápido; conexão bancária reduz digitação.       | Atalhos de receita/despesa, pendências claras e revisão de categorias; importação manual exige conferência.      |
| [Mobills: funcionalidades](https://mobills.zendesk.com/hc/pt-br/categories/360004156193-Todas-as-funcionalidades)                           | Documenta criação/edição, ajuste de saldo, parcelas, planejamento, objetivos, importação/exportação e tags. | Dar caminhos curtos para registro, correção e investigação de diferenças; não confundir transferência com renda. |
| [YNAB: metas](https://www.ynab.com/features/goal-tracking)                                                                                  | Metas por prazo e indicação do valor a separar para alcançá-las.                                            | Metas precisam indicar esforço mensal e progresso, não apenas o total final.                                     |
| [YNAB: compartilhamento](https://www.ynab.com/features/subscription-sharing)                                                                | Convites, planos compartilhados, responsabilidades e histórico de alterações entre dispositivos.            | Perfis locais separados não substituem uma família com membros e permissões.                                     |
| [Receita Federal: 2026](https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2026)                                 | Tabela anual, deduções e redução de 2026, exercício 2027.                                                   | Simulação do ajuste ordinário por contribuinte com ano e limites explícitos.                                     |

As prioridades abaixo são conclusões desta revisão, não recomendações dos fornecedores citados.

## Jornadas e avaliação

| Necessidade           | Situação                                                                                    | Avaliação                                                                                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primeiro acesso       | Perfil local → conta e saldo inicial → categorias → lançamentos.                            | Funcional, mas exige conhecer os módulos. Manual traz roteiro; falta checklist guiado e preenchimento inicial orientado.                                                      |
| Registrar renda       | Formulário compartilhado, tipo receita, categoria, competência, recebimento, valor e conta. | Atalho Nova receita no cabeçalho agora abre o formulário com tipo correto; categorias devem ser filtradas pelo tipo.                                                          |
| Corrigir valor        | Edição da transação com reversão/reaplicação do saldo realizado.                            | Cobertura ORM verifica troca de conta/tipo/valor. Compras em faturas fechadas/pagas preservam integridade e têm restrições.                                                   |
| Gastos futuros        | Pendências, recorrentes, parcelas e fluxo de caixa.                                         | Corrigidos alias SQL, receitas com vencimento, fim das regras, datas mensais e faturas na visão consolidada. Compras futuras recorrentes de cartão dependem de gerar faturas. |
| Identificar problemas | Orçamento, categorias sem limite, alertas, tendências e saldo previsto.                     | Recursos úteis; usuário ainda precisa relacionar módulos. Previsão não inclui contas vencidas antes do início do período nem eventos ainda não cadastrados.                   |
| Identificar acertos   | Realizado, resultado por competência, evolução, metas e histórico.                          | Não confundir sobra temporária de caixa com economia: uma despesa pendente continua sendo compromisso. Indicadores de saúde são heurísticos.                                  |
| Orçamento familiar    | Pode centralizar receitas/despesas da casa em um único perfil.                              | Sem membro/responsável estruturado, rateio, permissões ou sincronização. Descrição identifica membros apenas de forma informal.                                               |
| Recuperação           | Backup integral criptografado por senha, incluindo perfis e anexos.                         | Testes de senha, adulteração e restauração isolada. Ainda precisa política de lembrete e ensaio periódico de recuperação.                                                     |
| Prever IR             | Simulador independente, recebido + previsto, deduções e antecipações.                       | Ano-calendário 2026 / exercício 2027. Não classifica automaticamente entradas como tributáveis; não contempla todos os regimes e eventos fiscais.                             |

## Entregue nesta revisão

- Ícones do aplicativo/instalador/janela iguais ao símbolo vegetal do layout, incluindo arquivos PNG, ICO e ICNS.
- Pontilhado ampliado; barras superior, interna e lateral compartilham superfície e bordas.
- Fluxo de caixa corrigido e erros visíveis com possibilidade de atualizar; ordenação ORM corrigida no dashboard e notificações.
- Conferência de todas as colunas mapeadas contra o esquema ao iniciar e em testes. Migração de `payment_date` incluída no pacote; bancos antigos bloqueados antes de abrir telas.
- Atalhos Nova receita/Nova despesa, simulação de IR, revisão do manual e documentação do canal próprio de releases.
- Retorno monetário do ORM preserva centavos. Importações usam as regras de liquidação dos lançamentos; confirmação repetida de uma linha de extrato não duplica saldo.
- Integração das alterações locais de liquidação, dinheiro em centavos, investimentos, recorrências e backup, validadas junto à revisão.

## Próximas melhorias priorizadas

| Prioridade | Melhoria                    | Critério de aceite sugerido                                                                                                                                                            |
| ---------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1         | Família e responsável       | Membros estruturados, filtro por pessoa e consolidado sem duplicar despesas compartilhadas; definir permissões antes de sincronizar.                                                   |
| P1         | Onboarding e rotina semanal | Usuário novo cadastra conta, salário e conta fixa sem consultar documentação; checklist leva às pendências. Validar em teste observado.                                                |
| P1         | Diagnóstico acionável       | Mostrar compromisso vencido, excesso por categoria, variação de gasto e caminho para os lançamentos que explicam cada alerta. Diferenciar ausência de dados de bom resultado.          |
| P1         | Conciliação de saldo        | Comparar extrato e saldo calculado, localizar diferença e registrar ajuste rastreável sem inventar receita de salário.                                                                 |
| P1         | Projeção completa do cartão | Incluir parcelas/recorrências ainda não faturadas sem contar compra e pagamento duas vezes.                                                                                            |
| P2         | Planejamento por objetivo   | Valor mensal necessário, reserva de emergência em meses e despesas anuais provisionadas.                                                                                               |
| P2         | Reduzir digitação           | Favoritos/modelos, preenchimento da última conta, importação OFX com deduplicação e categorias sugeridas revisáveis. Open Finance exige projeto próprio de integração e consentimento. |
| P2         | Histórico e reversibilidade | Trilhas de alterações, desfazer quando seguro e confirmação contextual para operações em grupo.                                                                                        |
| P2         | Evolução do IR              | Salvar cenários por contribuinte e ano, importação fiscal explicitamente classificada, outros regimes apenas com regras/testes específicos.                                            |

## Validação antes de ampliar o público

Convidar pessoas sem familiaridade com o código para cadastrar salário, dividir uma compra, corrigir o valor, liquidar em outro mês, conferir um alerta e restaurar backup. Medir conclusão sem ajuda, erros, tempo e compreensão de saldo versus resultado. Para famílias, testar dois responsáveis, conta conjunta e despesa compartilhada. Não declarar o produto livre de erros com base apenas em build ou navegação de telas.
