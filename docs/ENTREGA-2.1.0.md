# Entrega de usabilidade e fundação financeira

Data: 02/11/2026. Evolução da revisão da versão 2.0.1.

## Comportamento entregue

Cadastros rápidos são modais adicionais. Criar ou cancelar não fecha o formulário original. O item criado entra nas opções e é selecionado imediatamente. Erros de gravação mantêm o formulário e mostram a mensagem. O tipo da categoria acompanha receita/despesa; seleção de contas respeita o contexto quando ele é restrito.

O guia fica fora da transição que remonta as páginas. Mantém a orientação aberta durante a navegação e grava a etapa por usuário em `onboarding_progress`. Conta, categoria, receita e despesa exigem registros reais antes de avançar; orçamento pode ser adiado. A última etapa é uma orientação de acompanhamento e backup, confirmada pelo usuário. Não se declara que um backup foi exportado apenas por concluir o guia.

Contas aceitam imagens PNG/JPEG/WebP de até 500 KB, armazenadas na própria base, com validação no main. A cor é um acento de identificação, mantendo superfícies neutras. Fechamento e vencimento podem ser configurados separadamente; faturas já existentes preservam suas datas. Cartões antigos sem vencimento configurado conservam a regra legada até sua revisão em Contas.

## Decisão por tela

| Tela                                                     | Expansão e listagem                                                                                                                                                              |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Visão geral                                              | Somente Transações Recentes amplia para uma consulta própria do histórico, com busca e páginas no backend. Indicadores e gráficos não ampliam.                                   |
| Transações                                               | Filtros múltiplos, busca por descrição e rolagem contínua; seleção e ações pertencem à listagem principal.                                                                       |
| Contas, categorias, metas, recorrências e transferências | Consulta paginada, busca no backend e rolagem contínua. Cards individuais não ampliam.                                                                                           |
| Investimentos                                            | Consulta paginada com busca e tipos múltiplos; resumo global calculado no backend. Histórico e simulação permanecem no modal específico do investimento.                         |
| Cartões                                                  | A fatura conserva seu detalhe específico. Cards de limite não recebem expansão genérica. Cadastro de cartão e conta de pagamento no contexto.                                    |
| Orçamento e alertas                                      | Escopo mensal/categoria e ações próprias; sem expansão genérica. Cadastro de categoria no formulário.                                                                            |
| Relatórios, relatórios avançados e fluxo de caixa        | Sem expansão genérica em indicadores/gráficos. Relatório e exportação recebem os mesmos filtros múltiplos.                                                                       |
| Importação                                               | Instruções fixas acima das etapas. Arquivo carregado é uma prévia local, não uma consulta remota; sua paginação de revisão é própria. Conta de destino pode ser criada em modal. |
| IR, configurações e manual                               | Formulários e conteúdo específico, sem expansão genérica. A busca editorial do manual é local e não consulta registros financeiros.                                              |

O preload expõe endpoints IPC; não foi criado servidor HTTP. `listing:query`, `transaction:findAll` e `investment:query` aplicam filtros e limites no main/SQLite. Filtros combinam OR dentro de cada seleção e AND entre campos diferentes. Páginas têm tamanho limitado e ordem estável. Respostas antigas não substituem resultados mais recentes. Não há varredura de textos do DOM para pesquisar dados.

## Integridade e autorização

- Anexo → lançamento → conta → usuário; etiqueta e lançamento do mesmo usuário; importação e sugestões verificam seu proprietário. Cadastros de meta, recorrência, orçamento e alerta validam os vínculos.
- O handler compartilhado rejeita canais privados sem sessão, remetentes sem janela e subframes. A janela bloqueia navegação, novas janelas e webviews. URLs externas são validadas no main; o preload só requer Electron e funciona com sandbox. Removidos o IPC genérico e `unsafe-eval` da CSP.
- Operações financeiras compostas compartilham uma fila para a única conexão SQLite. A unidade de trabalho garante rollback. Snapshot/restauração aguardam essa fila sem executar VACUUM dentro de uma transação.
- Metas recalculam o total a partir do histórico na mesma transação. Contribuição é uma reserva gerencial e não debita conta automaticamente.
- Vínculo de fatura exige despesa válida do mesmo cartão, valida a origem e recalcula as duas faturas ao mover uma compra.
- Ajuste manual registra delta em centavos; o recálculo considera saldo inicial, lançamentos, investimentos, pagamentos de fatura e ajustes.
- Campos textuais exportados para CSV são neutralizados contra prefixos de fórmulas. Relatório avançado sem lançamentos exibe dados insuficientes.

## Núcleo compartilhado

`src/shared/finance` expõe dinheiro/parcelas, calendário, estado de lançamento, validação de comandos, impacto de saldo, regra de vínculo de fatura, caso de contribuição com porta de persistência, investimentos e cálculos fiscais. O desktop já consome essas funções. A aplicação main implementa a persistência e a unidade de trabalho; renderer não acessa banco ou Node.

Isso não é um aplicativo mobile nem um protocolo de sincronização. UUIDs, livro familiar, relógio injetável em todos os cenários, fila remota, conflitos e adaptadores React Native/Sheets continuam no plano mobile. APIs antigas ainda recebem reais em alguns caminhos; a conversão para centavos é validada na fronteira.

## Evidência e limites

- Testes unitários incluem regras portáteis e rejeição de sessão/frame inválido no IPC.
- SQLite/TypeORM reais, em bases temporárias: todas as colunas mapeadas, concorrência em metas, faturas, ajuste/recálculo, propriedade dos vínculos, pesquisa literal com `%`, filtros múltiplos, páginas sem repetição, carga de categorias idempotente e progresso do guia por perfil.
- Migração 011 executada sobre esquema 3 com registros existentes, preservando saldo e IDs. Snapshot criptografado confere logo da conta, ajuste e etapa do guia, além dos testes de senha/adulteração/restauração/anexos.
- Electron oculto com sandbox e IPC fictício: navegação das 18 telas, contraste, cadastros rápidos com seleção e preservação dos campos, guia entre telas, expansão consultando endpoint, filtros múltiplos e proteção contra respostas fora de ordem.

Os ensaios de interface não substituem homologação de todos os formulários com banco real. A revisão histórica R08 (PDF entregue como HTML) e aspectos de R09 (atrasos de recorrências, comprometido e vencido na projeção) não são declarados resolvidos nesta entrega. Mobile, Google Sheets, uso familiar simultâneo e ciclo completo de atualização em outra máquina não foram homologados. Não há base para afirmar “100% validado”.
