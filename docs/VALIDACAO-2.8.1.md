# Validação integrada — Contabily 2.8.1

Data: 02/11/2026. Windows x64. Logs locais: .qa/roadmap-2026-11-02 (não versionados por conter dados e caminhos de teste).

## Evidência executada

- npm ci: concluído (885 pacotes antes da remoção posterior de dependência sem uso); postinstall recompilou better-sqlite3 para Electron.
- npm test: 41 testes passaram.
- npm run test:sqlite: migrações, centavos, isolamento, backup criptografado, adulteração e restauração passaram.
- npm run test:orm: ORM/SQLite reais, autorização, liquidação, transferências, cartões, metas, investimentos e novas regras de relatórios/financiamentos passaram.
- Backup/restauração com as tabelas novas de contratos, pagamentos, revisões e ocorrências: passou; a reabertura do banco foi executada explicitamente, reproduzindo a reinicialização após restore.
- npm run test:ui: passou em Electron oculto, com dados fictícios e IPC controlado; valida cabeçalhos, tour, formulários, contraste, seleções, respostas fora de ordem e estabilidade dos cards.
- scripts/check-app-real.mjs: passou com IPC autenticado e SQLite reais. Receita R$5.000 e despesa R$1.200 produziram R$3.800; exportação iniciou com assinatura %PDF-; lançamento global preservou a rota; diagnóstico respondeu.
- Typecheck e build passaram após as correções. Lint sem erros; avisos legados documentados no log.

## Medições

Workload ORM de 10 mil e 100 mil transações sintéticas, 10 consultas por tamanho, no hardware desta execução (não equivale a máquina limpa): último p50/p95 de aproximadamente 6,7/8,3 ms e 83,7/95,3 ms. Heap JS do processo de ensaio aproximadamente 46,2 MB. EXPLAIN utilizou idx_transactions_settlement e idx_accounts_user_id; não foram adicionados índices sem necessidade demonstrada.

Maior chunk do renderer: 7.088,93 kB antes do catálogo finito de ícones; 2.489,57 kB depois, sem compressão. Não confundir isso com tamanho do instalador.

## Limites

Não equivale a teste em outra máquina, instalação/atualização completa em Windows limpo, 30 minutos ocioso, 50 ciclos com heap snapshots ou homologação de todo cenário contratual. O script do app real cria um perfil isolado e não usa banco pessoal. Android será validado por emulador, conforme preferência do proprietário; não reivindicar aparelho físico.

Empacotamento, hashes e publicação serão acrescentados após sua execução.

## Empacotamento e ensaio de produção

- Instalador Windows x64 2.8.1 gerado: 112.793.619 bytes (redução de 7,20% frente ao 2.2.2 de 121.541.124 bytes).
- ASAR: 143.633.526 bytes, frente a 188.051.622 bytes da distribuição anterior.
- SHA-256 do instalador: 984da20144e2e744625a66f37168cca1eba572ddf2954bd20263b0525603250f. latest.yml conferido contra SHA-512 do mesmo arquivo.
- tests/packaged-real.mjs passou executando o binário empacotado, com banco isolado: migrações, SQLite nativo, IPC, categorias padrão, pagamento idempotente e versão 2.8.1.
- O instalador não possui certificado de assinatura de código Windows configurado. Isso não é uma assinatura criptográfica de editor certificada.

Publicação concluída: https://github.com/fabrisiofilho/contabily/releases/tag/v2.8.1. Foram enviados instalador x64, blockmap, latest.yml e SHA256SUMS; tamanhos de upload verificados antes de retirar o estado de rascunho. A tag v2.8.1 aponta para o commit 9fe2168. O roteiro tests/packaged-real.mjs não altera banco pessoal.
