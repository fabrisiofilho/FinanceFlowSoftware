# Validação do Contabily Desktop 2.8.3

- Checagem de tipos e build aprovados. Lint com 13 avisos anteriores e nenhum erro.
- Roteiro de interface em Electron com dados fictícios aprovado. Inclui tour com formulário aberto, seleção múltipla em campo de 240 px, filtros que preservam cards e edição após cancelar descarte.
- CSV validado com o parser real de importação. São 120 registros, 12 receitas e 108 despesas.
- Alterações de interface e arquivo fictício versionados junto da versão.

## Validação final em 04/11/2026

- `npm run typecheck`, `npm run lint`, `npm test` e `npm run build` aprovados; 41 testes passaram e o lint manteve 13 avisos, sem erros.
- `npm run test:ui` aprovado com o build final, incluindo rolagem até o último chip, tour e fluxos de cadastro.
- `npm run build:win` gerou instalador Windows x64, blockmap e latest.yml. Sem certificado de assinatura de código.
- `node --experimental-websocket tests/packaged-real.mjs` aprovado em Node 20: versão 2.8.3, migrações, SQLite nativo, IPC, categorias e pagamento idempotente com banco fictício isolado.
- Sem mudança de esquema ou necessidade de limpeza do banco nesta versão.
