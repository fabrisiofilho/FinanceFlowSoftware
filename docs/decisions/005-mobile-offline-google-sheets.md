# 005 — Mobile nativo e nuvem optativa sem servidor próprio

Data: 02/11/2026. Status: proposta para implementação; preferência de plataforma registrada pelo proprietário.

## Contexto

O Contabily 2.0.1 é Electron/React web com SQLite local e não possui sincronização. O proprietário deseja Android e iPhone, prefere React Native e começará usando APK. Prefere Google Sheets como centralizador para evitar administrar um servidor nesta etapa. A revisão identificou bloqueadores financeiros e de autorização que devem preceder a sincronização.

## Decisão proposta

- Manter o desktop e o modo local sem dependência de conta Google.
- Mobile em React Native + Expo, com SQLite local e adaptadores de plataforma; não portar a bridge Electron ou MUI para o nativo.
- Compartilhar domínio, contratos validados, centavos, calendário e casos de uso; separar persistência/arquivos/credenciais/UI.
- Entregar primeiro APK offline. Preparar e testar iOS com caminho de assinatura próprio; APK não instala em iPhone.
- Sheets optativo: cópia/consulta primeiro, sincronização bidirecional somente após spike e testes de conflitos. Planilha pertence ao cliente e não é publicada por link automaticamente.
- Não criar backend/Apps Script nesta fase. Preservar uma porta de sincronização para eventual provedor transacional futuro, caso necessário.

## Alternativas consideradas

| Alternativa                           | Avaliação                                                                                                                    |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| React Native/Expo                     | Escolhida conforme preferência; UI nativa e compartilhamento do núcleo, com apresentação nova.                               |
| Capacitor/PWA                         | Poderia reaproveitar mais UI web; não atende à preferência atual e também exigiria repensar persistência/OAuth/distribuição. |
| Somente planilha, sem banco local     | Rejeitada: perde offline e leva integridade, quota e conflito para cada gravação.                                            |
| Arquivo SQLite em pasta compartilhada | Rejeitada: cópia de banco não é sincronização de registros; conflitos podem substituir a base inteira.                       |
| API com banco transacional            | Adiada: oferece garantias centrais, mas exige backend e operação que o proprietário quer evitar agora.                       |
| Apps Script                           | Adiado: é backend hospedado, com autenticação, quotas e manutenção, mesmo sem VM própria.                                    |

## Consequências

Não há mensalidade de servidor própria no piloto; ainda há esforço de implementação, contas e limites externos. A distribuição convencional no iPhone tem custo Apple. Sheets legível implica confiar nas pessoas com permissão do arquivo e não fornece controle forte por registro. Não prometer prevenção central de decisões financeiras concorrentes sem autoridade transacional. O plano exige UUID, outbox, exclusão lógica, revisões e recuperação; não é apenas exportar CSV.

Implementação futura deve preservar dados existentes e resolver os achados P1 antes de usar dados reais em múltiplos aparelhos. O escopo e os aceites completos estão no [plano](../PLANO-MOBILE-GOOGLE-SHEETS.md), com evidências na [revisão](../REVISAO-COMPLETA-2026-11-02.md).
