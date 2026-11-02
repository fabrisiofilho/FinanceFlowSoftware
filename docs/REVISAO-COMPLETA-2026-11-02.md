# Revisão do Contabily e prontidão para mobile

Data: 02/11/2026. Base: versão 2.0.1, commit `ad1becec274ac805c3c600ef40e0e980b54471d2`.

## Parecer

O produto faz sentido como gerenciador financeiro pessoal local: reúne registro, caixa, cartões, orçamento, investimentos e recuperação de dados. Ainda não está pronto para sincronização financeira entre dispositivos nem para colaboração familiar. Há defeitos confirmados de integridade, lacunas de autorização por perfil e indicadores que podem induzir interpretações erradas. Colocar o banco atual em uma planilha não corrige esses problemas e amplia a concorrência.

Recomendação: corrigir a fundação primeiro; desenvolver mobile em React Native com Expo para Android e iPhone; entregar o primeiro APK offline; adicionar Google Sheets de forma optativa e progressiva, começando por publicação/consulta. Não criar servidor próprio nesta etapa. Plano em [PLANO-MOBILE-GOOGLE-SHEETS.md](PLANO-MOBILE-GOOGLE-SHEETS.md).

Este documento preserva os achados da versão 2.0.1. A evolução e os limites das correções estão na [entrega 2.1.0](ENTREGA-2.1.0.md); a lista histórica abaixo não representa o estado de todos os achados após essa entrega.

## Método e limites

- Revisão das 18 telas e dos serviços, contratos IPC, entidades, persistência, backup, notificações e atualização. Inclui recursos de backend sem tela própria: tags, anexos, moedas e autenticação.
- Reexecutados: 26 testes unitários, integração SQLite, integração ORM, typecheck, lint, build e ensaio Electron das 18 telas. Todos passaram; lint tem 16 avisos existentes e zero erros.
- Experimentos adicionais em banco temporário com dados fictícios confirmaram falhas não cobertas pela suíte. Resultados reproduzidos abaixo, sem tocar no banco pessoal.
- Navegação com IPC fictício não é teste integral de cada formulário. Não foram executados testes em Android/iPhone, contas Google, notificações nativas, instalação/atualização ponta a ponta, testes de invasão ou observação com usuários.
- Evidência estática significa leitura do caminho de código. Evidência reproduzida significa execução dirigida em SQLite/TypeORM reais. Não presumir que todo risco identificado é uma falha explorada remotamente: hoje o aplicativo é local.

## Achados priorizados

### R01 — P1: autorização incompleta por perfil

Evidência estática: `src/main/application/controllers/attachment-controller.ts:23`, `bank-import-controller.ts:66`, `tag-controller.ts:66` e `:75`. Há métodos sem obter o usuário da sessão. Os serviços correspondentes consultam por ID, sem validar o proprietário. `BaseHandler` registra IPC sem acrescentar autorização automaticamente. Sugestões de conciliação recebem userId, mas buscam as linhas da importação apenas por importId antes de construir sugestões.

Experimento: `getImportTransactions(importId)` retornou uma linha de outro contexto sem receber qualquer ator. O contrato exposto confirma que a chamada não exige perfil. Anexos e tags foram inspecionados estaticamente, sem ensaio de exploração.

Impacto: um perfil local não deve ler/apagar anexos ou alterar tags de outro perfil. Sincronizar esses contratos seria inseguro.

Correção: exigir ator em todos os casos de uso; validar a cadeia anexo → transação → conta → perfil, importação → perfil e tag/transação → mesmo perfil. Separar recursos globais intencionais, como catálogo de moedas, de recursos privados. Testar usuário A/B e sessão encerrada em cada canal. Não basta esconder botões no renderer.

### R02 — P1: contribuições simultâneas perdem atualização da meta

Fonte: `src/main/application/services/goal-service.ts:188`. A contribuição é inserida separadamente; o novo total usa um valor lido antes da gravação, sem transação conjunta.

Reproduzido: meta zerada; contribuições concorrentes de R$ 10 e R$ 20. Histórico soma R$ 30; `currentAmount` terminou em R$ 10. O resultado exato pode variar com a ordem de execução.

Correção: contribuição, total derivado e notificação em operação transacional; calcular o total a partir do histórico ou aplicar incremento atômico. Operação com UUID/idempotência para futura repetição de sincronização. Contribuir para meta precisa ser definido como reserva gerencial ou movimentação real; hoje não transfere dinheiro automaticamente.

### R03 — P1: vínculo incorreto de compra e fatura

Fonte: `src/main/application/services/credit-card-service.ts:143`. Valida se transação e fatura pertencem ao usuário e se a fatura de destino está aberta, mas não exige mesmo cartão nem recalcula a antiga fatura ao trocar o vínculo.

Reproduzido: compra de R$ 12,34 no cartão A foi vinculada à fatura do cartão B. A fatura antiga continuou totalizando R$ 12,34 e a nova também totalizou R$ 12,34.

Correção: validar conta, tipo de lançamento e estado da fatura de origem; atualizar vínculo e totais afetados na mesma transação, ou impedir troca indevida. Testar cartão A/B, receita em fatura, compra cancelada e faturas fechadas/pagas.

### R04 — P1: ajuste manual de saldo não sobrevive ao recálculo

Fonte: `src/main/application/services/account-service.ts:212`. `updateBalance` grava o saldo, mas não cria ajuste nem altera o histórico que sustenta o recálculo.

Reproduzido: conta zerada ajustada para R$ 500; leitura mostra R$ 500; recálculo retorna R$ 0.

Correção: representar ajuste como evento identificado, com data e justificativa, sem classificá-lo automaticamente como renda ou despesa. Reconciliar saldo inicial + eventos reais. Repetir o teste após reinício, edição, backup e sincronização.

### R05 — P1: CSV interpreta texto como fórmula

Fonte: `src/main/application/services/report-service.ts:46`. O escape trata delimitadores e aspas, mas não neutraliza fórmulas em campos textuais.

Reproduzido: descrição `=1+1` sai do escape como `=1+1`. Abrir o CSV em uma planilha pode interpretá-la como fórmula, dependendo do programa.

Correção: separar serialização de número/data da serialização de texto, neutralizar prefixos perigosos inclusive com espaços/tabulações iniciais e testar importação em Excel/Sheets. No futuro adaptador Sheets, enviar textos com `RAW`, não `USER_ENTERED`.

### R06 — P2: saúde financeira indica pontuação sem dados

Fonte: `src/main/application/services/advanced-report-service.ts:295` e `:342`.

Reproduzido: usuário sem lançamentos recebeu score 70 e recomendações de poupança, reserva e despesas próximas da renda. Não há amostra que sustente essas conclusões.

Correção: estado “dados insuficientes”, período/amostra explícitos e composição auditável. Diferenciar competência, liquidação e patrimônio disponível; definir quais contas/investimentos representam reserva. O score não deve parecer análise financeira profissional nem resultado observado quando é heurística.

### R07 — P2: vencimento de cartão presumido

Fonte: `src/main/application/services/credit-card-service.ts:49`. O vencimento é calculado como fechamento + 10 dias, sem configuração própria de vencimento.

Evidência: estática. O comportamento não representa todos os cartões e pode projetar pagamentos em dia errado.

Correção: cadastrar fechamento e vencimento independentemente, com regra clara para fevereiro e datas no mesmo mês/próximo mês. Não mudar faturas históricas ao editar a configuração do cartão.

### R08 — P2: relatórios e datas exigem alinhamento

Fonte: `report-service.ts:278` e `:221`. A ação chamada exportToPDF salva arquivo `.html`; não produz PDF. Datas de calendário passam por `new Date(string)` na exportação, caminho distinto do parser local adotado no domínio.

Evidência: estática. Há diferença entre promessa e formato entregue; conversões UTC/local merecem ensaio específico nas fronteiras de data.

Correção: produzir PDF real ou renomear a ação para HTML/impressão; usar parser de calendário e a mesma consulta para tela/exportação. Testar acentos, textos longos, quebras de página e datas em fusos diferentes. HTML exportado também precisa escape de conteúdo.

### R09 — P2: planejamento omite compromissos em situações relevantes

Fontes: `cash-flow-service.ts`, `budget-service.ts:283`, `recurring-transaction-service.ts:238`.

Evidência estática: fluxo usa saldo atual e movimentos dentro do intervalo; pendência vencida antes do início não aparece ali. Faturas entram no consolidado, mas não na visão de uma conta sem pagador definido. Compras recorrentes futuras de cartão dependem de gerar a fatura. A “confiança” da projeção decresce por uma fórmula fixa, sem avaliação estatística. Orçamento usa transações liquidadas pela competência; não evidencia todo o compromisso pendente.

Recorrências: a seleção exige end_date >= hoje; uma regra encerrada pode ter ocorrências atrasadas nunca geradas. Cada chamada gera uma ocorrência por regra, não necessariamente todo o atraso. São hipóteses funcionais a homologar com calendário controlado.

Correção: separar gasto realizado, comprometido, vencido e disponível; explicar o ponto de partida. Trocar “confiança” por horizonte/qualidade dos dados ou documentar claramente a heurística. Definir política explícita de recuperar ocorrências em atraso, com deduplicação.

### R10 — P2 antes de conectar Google: endurecer fronteiras do desktop

Fontes: `src/preload/index.ts:213`, `src/main/infrastructure/boot/window.ts:58`, `controllers/config/base-handler.ts`. Há abertura externa de URL recebida do renderer, sandbox desativado e ausência de verificação do remetente no handler compartilhado. Nesta revisão não foram encontrados handlers de bloqueio de navegação/criação de janela no main. A CSP também admite unsafe-eval e conexões HTTPS amplas.

Evidência: estática, sem demonstrar execução remota. Context isolation e nodeIntegration desativado são pontos positivos, mas não substituem validação de IPC, protocolos e origem. Aplicar o [guia de segurança do Electron](https://www.electronjs.org/docs/latest/tutorial/security) antes de adicionar OAuth ou conteúdo externo. Navegador de autorização deve ser externo ao WebView controlado pelo app.

## Matriz de recursos e adequação

“Manter” significa que o recurso faz sentido, não que todos os caminhos foram homologados.

| Recurso                    | Avaliação atual                                                                               | Ação antes/mobile                                                                                                                                              |
| -------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Visão geral                | Manter realizado e competência separados; saldo atual tem período diferente do seletor.       | Explicar períodos e permitir abrir lançamentos que compõem cada indicador. Corrigir R06.                                                                       |
| Receitas/despesas          | Núcleo adequado; liquidação, cancelamento e edição têm cobertura dirigida.                    | Dinheiro em centavos no contrato compartilhado; cadastro rápido e acessível no mobile.                                                                         |
| Parcelamento               | Divisão preserva centavos e calendário ancorado.                                              | ID global de grupo, editar só esta/futuras/todas e proteger parcelas já pagas.                                                                                 |
| Contas/saldos              | Saldo inicial e contas de caixa fazem sentido.                                                | R04; arquivamento; impedir exclusão de vínculos indiretos e conferir dívida do cartão.                                                                         |
| Cartões/faturas            | Compra e pagamento são conceitos separados; pagamento integral tem testes.                    | R03/R07; estorno, crédito, pagamento parcial/rotativo só após modelagem própria. Não prometer suporte atual.                                                   |
| Transferências             | Transação local e exclusão preservam pontas; excluir dos totais de renda/consumo faz sentido. | IDs globais e operação indivisível. BRL inicialmente; não oferecer falsa contabilidade multimoeda.                                                             |
| Recorrentes                | Úteis para renda e despesas fixas; geração tem deduplicação local.                            | R09; escolher gerador/identidade de ocorrência entre dispositivos; não gerar por dois calendários independentes.                                               |
| Orçamento                  | Categorias, limites e alertas são adequados.                                                  | Exibir comprometido e realizado, permitir revisão mensal; testar última data do mês e ausência de histórico.                                                   |
| Fluxo de caixa             | Útil para evitar saldo negativo; consultas básicas testadas.                                  | R09; previsões não são garantias. Conta pagadora de fatura e vencidos precisam tratamento explícito.                                                           |
| Metas/contribuições        | Bom mecanismo de planejamento.                                                                | R02; definir reserva virtual versus transferência real; esforço mensal para atingir objetivo.                                                                  |
| Investimentos              | Eventos, rendimento por competência e projeções separados são adequados.                      | Conservar idempotência e isolamento; sincronizar eventos, não copiar saldo calculado. Tributos/rendimentos não presumidos.                                     |
| Categorias                 | Separação receita/despesa faz sentido.                                                        | Padrões não editáveis e falta de arquivamento limitam personalização. Substituição deve abranger orçamento/recorrência, não só transações.                     |
| Relatórios                 | Filtros unificados em parte e agregação com testes.                                           | R05/R08; definir visão de caixa/competência e qualidade da amostra.                                                                                            |
| Análises avançadas         | Tendências podem ajudar.                                                                      | R06/R09; não apresentar score vazio ou percentuais de confiança artificiais como diagnóstico.                                                                  |
| Importação manual/bancária | Reduz digitação; liquidação e repetição de linha têm testes.                                  | R01/R05; parse OFX limitado, CSV por banco; datas inválidas, transferências/cartão e duplicidade exigem ensaios adicionais. Sucesso parcial deve ser visível.  |
| Alertas/notificações       | Preferências e deduplicação local úteis.                                                      | Mobile: avisos locais agendados e permissões. Sem servidor não prometer push nem execução contínua em background.                                              |
| Tags                       | Recurso auxiliar útil, sem fluxo central no menu.                                             | R01; não usar como substituto permanente de membro da família.                                                                                                 |
| Anexos                     | Úteis para recibos, com backup local.                                                         | R01; falha entre arquivo e banco pode deixar órfãos. No mobile, picker/câmera e armazenamento de arquivo separado do Sheets.                                   |
| Moedas/câmbio              | Catálogo e conversão isolados existem.                                                        | Dados e telas continuam centrados em BRL; não anunciar carteira multimoeda completa. Validar taxas e definir escopo global/por livro.                          |
| Perfis/login               | Hash de senha local e sessão em memória.                                                      | Não equivale a conta online ou criptografia do SQLite. Separar login Google de acesso ao livro; permitir mobile local sem Google.                              |
| Família                    | Uma pessoa consegue centralizar a casa em um perfil.                                          | Livro familiar, membro e responsável estruturados; regras de compartilhamento não existem hoje. Não sincronizar todos os perfis por padrão.                    |
| Backup/restauração         | Criptografia do arquivo e validação isolada são pontos fortes.                                | Exportação atual inclui todos os perfis; não enviar esse arquivo automaticamente para a nuvem. Backup portátil por livro e restauração com UUID/época de sync. |
| Preferências/manual        | Tema consistente, busca e orientações disponíveis.                                            | Revisar promessas de PDF, categorias, vencimento e sync; separar “já disponível” de “planejado”.                                                               |
| IR                         | Simulação limitada ao ajuste ordinário de 2026/2027 com cenários manuais.                     | Manter rótulos/limites; cenário persistido por contribuinte apenas em fase posterior. Não classificar automaticamente toda renda como tributável.              |
| Instalador/updater         | Canal próprio e pacote 2.0.1 conferidos anteriormente.                                        | Homologar ciclo completo de atualização. Atualizador Electron não serve ao APK nem ao iPhone.                                                                  |

## Barreiras arquiteturais ao mobile

1. A interface web chama `window.electronAPI` diretamente em 27 arquivos. Trocar o tamanho da janela não cria app nativo.
2. Serviços em main misturam regras com TypeORM, Electron, logger, arquivos e relógio. Extrair casos de uso sem plataforma antes de compartilhar com React Native.
3. MUI, DOM, styled-components web, tabelas e modais desktop não são componentes nativos. Reutilizar contratos, cálculos, validações e tokens; reconstruir a apresentação.
4. Identificadores inteiros locais podem colidir em dois bancos. Não usar `id=1` como identidade remota. Adicionar UUID por entidade e mapa de migração sem apagar a base.
5. O esquema tem centavos físicos, mas entidades/API ainda trafegam reais em vários caminhos. Normalizar o novo núcleo e o protocolo em centavos inteiros e datas YYYY-MM-DD.
6. Ainda faltam livro/workspace, fila persistida, revisão, exclusão lógica, conflitos, migração de protocolo e separação entre dado de origem e total calculado.

## Ordem de correção recomendada

| Bloco                  | Inclui                                  | Aceite mínimo                                                                                        |
| ---------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Fundação segura        | R01 e R10                               | Todos os canais privados rejeitam sessão ausente e perfil errado; URLs/origem validadas.             |
| Integridade financeira | R02/R03/R04                             | Concorrência e rollback cobertos; fatura correta; ajuste conserva saldo após recálculo/restauração.  |
| Importação/exportação  | R05/R08 e datas                         | Texto seguro para planilha/HTML, formatos honestos, tratamento explícito de erros e duplicidades.    |
| Planejamento confiável | R06/R07/R09                             | Sem score fictício; vencimento configurável; realizado e comprometido distintos.                     |
| Extração do núcleo     | Contratos, UUID, relógio e repositórios | Mesmos cenários de domínio passam no desktop e ambiente mobile, sem imports Electron/Node no núcleo. |

Não há base para declarar o projeto “100% validado”. A suíte aprovada demonstra cenários cobertos; esta revisão demonstra por que a próxima etapa precisa de testes negativos e de concorrência antes de escalar.
