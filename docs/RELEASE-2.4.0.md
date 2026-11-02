# Contabily 2.4.0 — relatórios avançados

Implementação, aguardando rodada integrada de validação.

- Consulta V2 única com datas civis, intervalo semiaberto, autorização por perfil e filtros de conta/categoria em todos os painéis.
- Realizado usa liquidação; competência inclui pendências. Valores agregados em centavos.
- Evolução e tendências completam meses vazios. Projeção não negativa e amostra mínima explícita.
- Comparação com o mesmo período do ano anterior; base inexistente gera percentual nulo.
- Hábitos usa média por transação na escala correta. Categorias, evolução e hábitos agora acessíveis.
- Score exige três meses completos com movimentos e renda; orçamento ausente não concede pontos. Excesso contínuo distingue desvios.
- Reserva permanece não configurada até existir seleção de fontes; nenhum saldo ou limite de cartão vira reserva.
- Abas sob demanda, erros com repetição, descarte de respostas antigas, filtros em sessão e CSV da mesma resposta.

Sem migração de banco. Fontes de reserva e drill-down ainda pendentes. Não há benchmark comprovado nesta etapa. Métodos antigos permanecem como adaptadores para V2.
