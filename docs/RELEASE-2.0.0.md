# Contabily 2.0.0

Controle financeiro local com correções de caixa, revisão de interface e simulação de IR.

## Compatibilidade dos dados

**Esta versão exige banco novo para instalações anteriores (esquema financeiro 3, valores em centavos).** Não há conversão automática do banco antigo. O aplicativo bloqueia bases incompatíveis sem apagar os dados. Feche o aplicativo, guarde cópia integral do banco e auxiliares e mova a base antiga para um local seguro antes de criar a nova. O proprietário é responsável pela recriação. Backups de versões antigas não convertem o esquema.

## Alterações

- Corrigido erro de alias `t.status` no fluxo de caixa; `payment_date` entregue nas migrações e colunas conferidas antes de abrir as telas.
- Pendências não movimentam saldo; liquidação tem data própria. Transferências, investimentos e pagamento de fatura não duplicam renda/consumo.
- Corrigidos vencimentos de receitas, fim de recorrências, avanço mensal e ordenação de lançamentos recentes.
- Corrigidos retornos monetários fracionados do ORM e liquidação de linhas importadas; repetir confirmação de extrato não duplica a entrada.
- Ícone do layout aplicado ao programa e instalador. Barras harmonizadas e pontilhado ampliado.
- Atalhos Nova receita e Nova despesa no cabeçalho.
- Simulação do IR ordinário: ano-calendário 2026 / declaração 2027, comparação simplificado/legal, deduções, previsão e saldo após antecipações. Não contempla todos os regimes fiscais, não envia declaração e descarta o cenário ao sair.
- Backup integral criptografado, movimentos de investimentos e manual atualizado.
- Avaliação individual/familiar e prioridades documentadas em docs/AVALIACAO-PRODUTO.md. Uso familiar segue centralizado, sem compartilhamento entre dispositivos.
- Canal próprio de atualização: fabrisiofilho/contabily. Instale manualmente esta versão se sua versão anterior tinha updater desativado. Atualizações seguintes usam este canal.

## Instalação

Baixe `Contabily-setup-2.0.0.exe`. O instalador Windows não possui assinatura digital de certificado comercial. `latest.yml` e `.blockmap` são usados pelo updater.

## Validação

Typecheck, testes financeiros/IR, integração SQLite/ORM e navegação em 18 telas com IPC isolado. Consulte docs/VALIDACAO.md para resultados e limites. Testes automáticos não equivalem à homologação de todos os fluxos reais ou à instalação de atualizações em todos os ambientes Windows.
