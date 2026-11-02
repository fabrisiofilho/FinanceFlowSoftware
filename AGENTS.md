# Contabily — instruções para desenvolvimento

- O produto utiliza somente dark neutro. Não reintroduzir modo claro, seletor de tema ou superfícies verdes extensas. Verde é destaque; fontes usam Segoe UI do sistema.
- Cards novos devem reutilizar ExpandableCard/ContentSurface. Expansão é opcional e restrita a listagens relevantes; busca e paginação devem consultar o backend. Não animar posição/escala dos cards. Formularios em modal não precisam de busca.
- Investimentos: valores em centavos, um rendimento por competência, projeções separadas de realizados e contas. Não assumir taxas de mercado, impostos ou rentabilidade garantida.

Leia docs/DIRETRIZES.md e docs/PLANO.md antes de alterar funcionalidades.

- Preserve a arquitetura existente: main/application para regras, serviços e repositórios; main/infrastructure para Electron e SQLite; preload para bridge; renderer para React; shared para contratos.
- Não acesse banco, Node ou arquivos pelo renderer. Exponha operações específicas no preload e valide no main.
- Reutilize formulários, componentes e formatadores existentes antes de criar novos.
- Use nomenclatura de domínio e mudanças pequenas. Não adicione padrões ou dependências sem necessidade concreta.
- Autorização do proprietário em 2026-11-01: a aplicação ainda não tem usuários; mudanças incompatíveis no esquema, dinheiro e datas podem exigir banco limpo, sem migração dos dados antigos. Avisar explicitamente quando a limpeza for necessária. O proprietário fará a limpeza; não apagar o banco automaticamente. Manter testes financeiros e registrar a versão do novo esquema.
- Trabalhar na branch principal existente main, chamada de master pelo proprietário. Não criar branches de tarefa sem solicitação.
- Canal próprio autorizado em 2026-11-02: fabrisiofilho/contabily (repositório renomeado). Publicar releases e updater somente neste destino. Autoria local: Fabrisio Filho <fabrisiopbf@gmail.com>.
- Não versionar credenciais, dados financeiros reais, bancos ou backups.
- Execute npm run typecheck, npm run lint e npm run build; relate falhas herdadas e limitações de validação.
