# Contabily 2.8.1 — correções da validação integrada

- Corrigido filtro de categorias padrão compartilhadas nos relatórios e no cadastro de financiamento, detectado no app com IPC real.
- Executor de migrações preserva corpos de triggers e executa cada migração em transação, com restauração de foreign_keys.
- Projeção acumula juros e aportes em centavos; adicionados casos de 0/360 meses e momento do aporte.
- Transações vinculadas a financiamentos permanecem protegidas também após estorno.
- Select aplica limite de altura ao papel do menu no portal, preservando sua posição.
- Relatório e sininho atualizam após lançamento global. Transferência mostra validação inline ao confirmar formulário vazio.
- Páginas sob demanda e catálogo finito de ícones; maior chunk do renderer caiu de 7,09 MB para 2,49 MB, antes de compressão.
- Removido electron-toolkit antigo sem consumidores; 78 dependências transitivas removidas, incluindo Vue/Bootstrap.
- Logs de produção passam a WARN por padrão, evitando registrar rotinas com valores/saldos em INFO.
- Manual atualizado e ensaio Electron real incluído em scripts/check-app-real.mjs.

Evidências e limites em VALIDACAO-2.8.1.md. Migrações aditivas 013–015 sobre esquema 3; não limpar banco.
