# Diretrizes de desenvolvimento

Para mudanças de interface, consultar docs/DESIGN-SYSTEM.md. Usar PageContainer, PageHeader, ContentSurface/ExpandableCard e ContentLoading em vez de duplicar estruturas locais. Respeitar prefers-reduced-motion, usar apenas dark neutro e manter indicadores operacionais em ações assíncronas.

Campos novos devem usar Input, SelectInput, DatePicker/DateStringField ou MonthField conforme o dado; não usar input date/month nativo. Usar FilterPanel e MonthRangeFields para filtros de competência e AppAlert para mensagens. Conferir cores e contraste no dark. Relatórios em tela devem consumir a mesma consulta filtrada das exportações, evitando uma segunda lógica de agregação no renderer.

Aplicar estas diretrizes ao Contabily após incorporar a base. Elas não substituem instruções existentes no repositório: conflitos devem ser avaliados no contexto do projeto.

- Priorizar clareza, funções pequenas com responsabilidade definida e nomes relacionados ao domínio. Comentar decisões e restrições, evitando narrar código óbvio.
- Manter cálculos e validações financeiras em funções independentes da UI e do Electron. Componentes não devem conter consultas ao banco.
- Organizar por funcionalidades quando fizer sentido na base; compartilhar componentes, formatação e validações apenas quando houver reutilização real.
- Usar TypeScript estrito se a base permitir; evitar any e validar dados recebidos de arquivos e IPC em tempo de execução.
- Aplicar padrões Repository para persistência e casos de uso para operações financeiras. Não introduzir contêiner de injeção, event bus ou camadas adicionais sem necessidade.
- Centralizar formatação de BRL e datas. Não reutilizar strings formatadas em cálculos.
- Manter migrações versionadas; não apagar dados para atualizar o esquema. Fazer backup antes de migrações destrutivas.
- Tratar erros na fronteira apropriada, com mensagens úteis ao usuário e logs técnicos sem dados financeiros sensíveis.
- Usar tokens visuais, controles acessíveis e componentes consistentes. Preservar foco, rótulos e contraste adequado.
- Testar regras de dinheiro, datas, agregações e validações. Cobrir integração do armazenamento e atomicidade da importação. Evitar testes que apenas reproduzam a implementação.
- Executar lint, verificação de tipos, testes e build disponíveis antes de entregar; registrar verificações que não puderam ser executadas.
- Não versionar credenciais, banco pessoal, backups ou dados reais. Exemplos devem ser claramente fictícios.
- Alterações de arquitetura devem registrar contexto, decisão e consequências em docs/decisions. Atualizar README com instalação, execução, testes, build e localização dos dados.
