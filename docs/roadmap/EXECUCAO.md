# Execução do roadmap — 02/11/2026

Referência inicial: 7e0746d620607daa41882d6de0b984af70d563f5 (main).
O checkout já continha a implementação 2.3.0 e sua documentação, preservadas no primeiro commit desta execução. Os resultados de validação descritos nessa documentação são anteriores; não foram repetidos nesta etapa.

## Ordem autorizada

Implementar em blocos, registrar versão e commit a cada melhoria; executar a rodada integrada de validação após os blocos. Falhas encontradas nessa rodada serão corrigidas antes da publicação. Não publicar artefatos não validados.

1. Contratos e relatórios avançados: AR-01 a AR-14, filtros comuns, calendário, cobertura e estados por aba.
2. Uso diário: ação global, diálogos, investimentos, alertas e notificações.
3. Financiamentos: contratos, parcelas, pagamentos e integração financeira.
4. Diagnóstico e desempenho medido; backup, autorização e regressões.
5. Mobile offline em repositório próprio; somente APK, sem loja ou sincronização implícita.
6. Validação integrada, correções, instalador e publicação desktop no canal próprio.

A especificação integral está em ESPECIFICACAO-2026-11-02.md. Itens experimentais e integração opcional permanecem explicitamente separados de funcionalidades entregues. Não apagar bancos pessoais.

## Situação após os blocos 2.4–2.8.1

Implementados e versionados: consulta financeira V2 e correções AR centrais; ação global; investimentos em abas e acumulados; contratos manuais/SAC/Price com pagamentos parciais e estornos; diagnóstico; ocorrências de regras de categoria; PDF convencional real; redução comprovada de dependência sem uso e catálogo de ícones. A validação posterior encontrou e corrigiu regressões; ver VALIDACAO-2.8.1.md.

O documento integral não está 100% encerrado. Permanecem abertos: renegociação/carência e amortização extraordinária com redução automática de prazo/prestação; indexação contratual; unificação das ocorrências de orçamento/saldo/financiamento; PDF e drill-down dos relatórios avançados; filtros multisseleção na UI avançada; backup em etapas com prévia detalhada; ensaio prolongado de heap e instalação/atualização em Windows limpo. Mobile é MVP independente, ainda sem cartões/faturas e sem paridade integral com desktop. Portabilidade entre plataformas e sincronização permanecem fases posteriores explícitas, sem promessa de funcionamento atual.

Não confundir publicação desta evolução com conclusão integral de toda a especificação.
