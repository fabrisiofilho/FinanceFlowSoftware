# 004 — Navegação por áreas de produto

Contexto: a auditoria V2 aponta excesso de destinos primários e diferenças entre o planejamento financeiro e a implementação. Não autoriza interpretar módulos legados como homologados.

Decisão: separar navigation.ts do registro de rotas. Oito áreas primárias reutilizam os componentes existentes do menu e revelam subitens conforme a área ativa. As 16 URLs continuam válidas. Categorias e Alertas ficam em Configurações; importação em Contas e cartões; projeções e metas em Planejamento. Manter identidade de página, filtros e serviços especializados.

Consequências: menor fragmentação do menu sem migração de dados. Filtros comuns, lançamento único, eventos patrimoniais e recuperação integral ainda exigem entregas próprias. Não há mudanças de saldos, datas, tabelas ou contratos IPC nesta etapa. O inventário estático registra evidência, não qualidade funcional.
