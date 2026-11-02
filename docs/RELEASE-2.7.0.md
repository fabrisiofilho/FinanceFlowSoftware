# Contabily 2.7.0 — diagnóstico, ocorrências e PDF

Implementação aguardando validação integrada. Migração aditiva 014.

- Diagnóstico local com versão, processos, heap, SQLite/WAL/SHM, anexos/cache e consulta de controle; atualização encadeada a cada 5 segundos apenas enquanto aberta.
- Cópia remove caminho pessoal. Métricas distinguem working set e memória privada.
- Regras de categoria produzem ocorrências persistidas, com estados ativo/resolvido/dispensado e severidade textual.
- Leitura de notificação não resolve condição. Reavaliação arquiva mensagem da condição encerrada.
- Exportador PDF passa a usar Chromium printToPDF em janela oculta com JavaScript desabilitado.

Não houve ainda medição comparativa de cold start, ensaio prolongado de memória ou homologação do PDF. Ocorrências de orçamento, saldo e financiamentos ainda precisam unificação com o motor de regras.
