# Contabily — instruções para desenvolvimento

- O produto utiliza somente dark neutro. Não reintroduzir modo claro, seletor de tema ou superfícies verdes extensas. Verde é destaque; fontes usam Segoe UI do sistema.
- Cards novos devem reutilizar ExpandableCard/ContentSurface e o modal compartilhado com busca e rolagem. Não animar posição/escala dos cards. Formularios em modal não precisam de busca.
- Investimentos: valores em centavos, um rendimento por competência, projeções separadas de realizados e contas. Não assumir taxas de mercado, impostos ou rentabilidade garantida.

Leia docs/DIRETRIZES.md e docs/PLANO.md antes de alterar funcionalidades.

- Preserve a arquitetura existente: main/application para regras, serviços e repositórios; main/infrastructure para Electron e SQLite; preload para bridge; renderer para React; shared para contratos.
- Não acesse banco, Node ou arquivos pelo renderer. Exponha operações específicas no preload e valide no main.
- Reutilize formulários, componentes e formatadores existentes antes de criar novos.
- Use nomenclatura de domínio e mudanças pequenas. Não adicione padrões ou dependências sem necessidade concreta.
- Não altere a representação monetária ou semântica de datas sem migração explícita e testes. A base usa valores decimais em reais; centavos inteiros são uma evolução planejada.
- Não publique releases nem reative o updater do projeto de origem. O Contabily ainda não tem canal próprio.
- Não versionar credenciais, dados financeiros reais, bancos ou backups.
- Execute npm run typecheck, npm run lint e npm run build; relate falhas herdadas e limitações de validação.
