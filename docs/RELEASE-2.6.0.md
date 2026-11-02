# Contabily 2.6.0 — financiamentos

Implementação aguardando validação integrada. Migração aditiva 013, sem limpeza de banco.

- Contratos manuais, SAC e Price; juros com taxa mensal efetiva em precisão declarada, operações racionais BigInt e ajuste final do principal.
- Parcelas futuras não movimentam conta. Cadastro de saldo na data de corte permite contratos já iniciados.
- Pagamentos parciais atômicos e idempotentes. Principal classificado como redução de passivo, juros/encargos como consumo.
- Estorno devolve saldo e cancela os lançamentos preservando vínculos. Triggers impedem edição/exclusão avulsa de pagamentos ativos.
- Ajuste manual com motivo e revisão; parcelas com pagamento não podem ser reprojetadas.
- Listagem, parcelas e pagamentos paginados. Fluxo de caixa inclui apenas saldo ainda não pago das parcelas.
- Backup integral SQLite inclui as novas tabelas.

Ainda pendentes: renegociação de contrato, carência, amortização extraordinária com redução de prazo/prestação, separação detalhada de seguro/tarifa no pagamento e indexação contratual. Não representam funcionalidades entregues.
