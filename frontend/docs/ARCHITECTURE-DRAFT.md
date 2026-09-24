# Architecture Draft — Frontend Unitraack

**Status:** proposta arquitetural para discussão — não definitiva.  
**Escopo:** frontend. Nenhuma alteração, movimentação ou criação de código faz parte deste documento.  
**Base:** `BASELINE-INVENTORY.md` e `BASELINE-ISSUES.md` (Fase 1), além da estrutura atual do frontend.

## 1. Objetivo e princípios orientadores

Esta proposta responde a problemas observados no Unitraack, e não a uma adoção genérica de padrões. Ela busca reduzir o trabalho redundante de estado e rede (`ISSUE-001` a `ISSUE-005`), concentrar comunicação HTTP (`ISSUE-006`), tornar as telas extensas testáveis e evolutivas (`ISSUE-007` e `ISSUE-010`) e concentrar a navegação multi-tenant (`ISSUE-009`).

Os princípios resultantes são:

- O domínio de negócio, e não a role ou a tecnologia, determina a fronteira principal de uma feature.
- Páginas orquestram experiência de tela; regras, acesso a dados e efeitos não ficam embutidos nelas por padrão.
- O estado é local primeiro; passa a ser compartilhado por feature apenas quando mais de uma parte daquela feature o necessita; é global apenas quando representa runtime da aplicação.
- Há uma única política de cliente HTTP, token e erro para APIs do backend.
- Tenant é contexto de runtime e autenticação é contexto de sessão; nenhum dos dois é um contêiner de estado operacional.
- A composição entre domínios ocorre em pontos explícitos, sem criar dependências bidirecionais.

## 2. Domínios reais

As pastas atuais não representam, sozinhas, domínios. Em especial, `requests/` contém interfaces de Terceirizada, Líder e Portaria para o mesmo fluxo operacional, e `admin/` abriga tanto administração global quanto gestão de equipe de uma unidade. A proposta reconhece os seguintes domínios.

### 2.1. Acesso e identidade

**Responsabilidade:** estabelecer sessão, carregar o perfil derivado dela e conduzir login, logout e cadastros/onboarding.

**Funcionalidades:** login de tenant, login administrativo, cadastro de terceirizada, cadastro por convite e fluxo inicial de gestor.

**Arquivos atuais relacionados:** `features/auth/pages/*`, `features/auth/api/authService.ts`, `contexts/AuthContext.tsx`, `lib/supabase.ts` e partes de `guards/`.

**Fronteiras:** fornece estado de identidade para o restante da aplicação. Não decide dados do tenant além do que venha no perfil, não carrega dados de dashboard e não contém regras de rota específicas de cada operação.

### 2.2. Runtime de tenant e experiência de marca

**Responsabilidade:** resolver o slug da URL/host, obter a identidade pública do tenant, expor seu estado de carregamento e aplicar a identidade visual correspondente.

**Funcionalidades:** leitura de slug, informação pública do tenant, tema/branding e distinção entre rota administrativa e rota de tenant.

**Arquivos atuais relacionados:** `contexts/TenantContext.tsx`, `utils/subdomain.ts`, `features/auth/api/tenantService.ts` e `guards/SubdomainOrNotFound.tsx`.

**Fronteiras:** é infraestrutura de runtime do frontend, consumida por rotas e telas. Não deve carregar perfil autenticado, token ou dados operacionais. A autorização efetiva continua fora do escopo do cliente.

### 2.3. Operação de entrada e materiais

**Responsabilidade:** representar o ciclo Terceirizada → solicitação → análise do Líder → controle da Portaria, além de movimentação e transferência de materiais.

**Funcionalidades:** criação, edição, cancelamento e acompanhamento de solicitações; pendências do líder; check-in/check-out; divergências; transferência/aceite/recusa de materiais.

**Arquivos atuais relacionados:** `features/requests/pages/{TerceirizadaDashboard,LiderDashboard,PortariaDashboard}.tsx`, `features/requests/pages/Terceirizada/NovaSolicitacao.tsx`, `features/requests/components/dashboard/{AcceptModal,TransferModal,LiderSidebar,MobileNav}.tsx` e parte de `dashboardService.ts`.

**Fronteiras:** o domínio possui interfaces diferentes por role, mas a linguagem, os contratos e os tipos de solicitação/material pertencem ao mesmo fluxo. Ele fornece fatos operacionais a monitoramento e auditoria; não deve depender de componentes de monitoramento ou administração global.

### 2.4. Supervisão operacional

**Responsabilidade:** dar ao Gestor visão consolidada dos setores, materiais e pendências operacionais e da planta/mapa.

**Funcionalidades:** cards, pendências, monitoramento por setor, mapa interativo e layout de planta.

**Arquivos atuais relacionados:** `features/monitoring/pages/GestorDashboard.tsx`, `features/monitoring/components/{MonitoringDashboard,InteractiveMap}.tsx`, `features/requests/components/dashboard/{DashboardHeader,DashboardSidebar,DashboardStats,PendingApprovals}.tsx`, `contexts/DashboardContext.tsx` e `features/requests/api/dashboardService.ts`.

**Fronteiras:** é uma visão composta para gestão e não a fonte universal de estado de todos os papéis. Pode consumir leitura do domínio de operação, mas não deve controlar páginas de Líder ou Portaria. Seu estado compartilhado deve existir apenas enquanto o workspace do Gestor estiver montado.

### 2.5. Organização da unidade: equipe e setores

**Responsabilidade:** manter os setores da unidade e as pessoas internas que os utilizam.

**Funcionalidades:** convite, cadastro manual, listagem/edição de membros, reset de senha e gestão de setores.

**Arquivos atuais relacionados:** `features/admin/components/TeamManagement.tsx` e `features/admin/components/dashboard/team/*`.

**Fronteiras:** é gestão da unidade, não administração global. Pode ser composta no workspace de Gestor e fornecer dados de setor a interfaces que precisem escolhê-los. Não deve depender de uma página de monitoramento para obter estado compartilhado.

### 2.6. Auditoria e relatórios

**Responsabilidade:** consultar, filtrar, apresentar e exportar evidências de movimentação e indicadores consolidados.

**Funcionalidades:** seleção de terceirizadas, timeline/auditoria, relatório gráfico e exportação PDF.

**Arquivos atuais relacionados:** `features/requests/components/AuditSection.tsx`, `features/requests/components/dashboard/audit/*` e `features/monitoring/components/ThirdPartiesReport.tsx`.

**Fronteiras:** consome fatos históricos dos domínios de operação e supervisão, sem mutá-los. A geração de PDF pertence a este domínio enquanto seu conteúdo for de auditoria/relatório, não a `shared`.

### 2.7. Administração da plataforma

**Responsabilidade:** administrar o produto como plataforma, incluindo tenants e dados globais, distinta da gestão de uma unidade.

**Funcionalidades:** tenants, branding, métricas globais, usuários e auditoria entre tenants apresentada ao superadministrador.

**Arquivos atuais relacionados:** `features/admin/pages/SuperAdminDashboard.tsx`.

**Fronteiras:** não deve reutilizar componentes de gestão de equipe de unidade apenas por ambos serem chamados “admin”. Pode consumir primitives compartilhadas e serviços próprios, mas não estado operacional de tenant.

## 3. Camadas e responsabilidades

| Camada | Pode fazer | Não deve fazer | Pode depender de |
|---|---|---|---|
| **Page** | Compor a experiência de uma rota, escolher subviews, conectar hooks e interpretar parâmetros de rota. | Fazer chamadas HTTP diretamente, guardar regra de negócio reutilizável, implementar cliente de API. | Componentes, hooks e tipos da própria feature; `shared`; `core`. |
| **Component** | Renderizar UI e receber props; manter estado visual local; emitir eventos semânticos. | Conhecer URL de backend, buscar token, decidir tenant/role global ou concentrar fluxo de negócio. | Componentes/tipos locais; `shared`; `core` estritamente necessário. |
| **Hook** | Encapsular comportamento React, estado de tela, efeitos e coordenação entre page, service e component. | Renderizar markup estrutural ou ser um cliente HTTP genérico. | API, tipos e componentes auxiliares da própria feature; `shared`; `core`. |
| **Service/API** | Declarar operações remotas por domínio, serializar/deserializar contratos e traduzir falhas para erro conhecido. | Usar hooks, importar páginas/componentes ou decidir navegação. | Cliente HTTP e contratos de `core`; tipos da própria feature. |
| **Context** | Expor estado realmente compartilhado e ciclo de vida claro: runtime global ou subtree de uma feature. | Virar cache universal, concentrar páginas/rotas ou servir papéis sem consumidores. | Hooks/services da sua camada; `core`; tipos locais. |
| **Shared** | Oferecer UI genérica, utilitários puros, tipos verdadeiramente transversais e helpers sem semântica de domínio. | Conhecer endpoint, role, tenant, solicitação, material ou importar feature. | `core` e outros módulos `shared` acíclicos. |
| **Core** | Oferecer infraestrutura estável: HTTP, Supabase, resolução de tenant, normalização de erro, modelos de sessão e helpers de rota. | Conter JSX de negócio, páginas ou detalhes de uma feature. | Dependências externas e código interno de `core`. |

`app/` não é uma camada de negócio: é o ponto de composição. Pode registrar providers, rotas e associações entre rota/role e páginas públicas das features, sem implementar as funcionalidades dessas páginas.

## 4. Regra explícita de dependências

```text
app (composição de providers e rotas)
  └── features (domínios e jornadas)
        ├── shared (UI/utilitários genéricos)
        └── core (infraestrutura e runtime)
              └── dependências externas
```

Regras:

1. `core` não importa `shared`, `features` ou `app`.
2. `shared` pode importar apenas `core` e outros módulos `shared` que não formem ciclo.
3. Uma feature pode importar `shared` e `core`; não importa internamente arquivos privados de outra feature.
4. Dependência feature → feature é proibida por padrão. A exceção é uma composição explicitamente declarada no ponto público da feature consumida, por exemplo o workspace de Gestor compondo uma view pública de Auditoria. A direção é única e a feature consumida nunca importa a compositora.
5. Contratos de integração entre dois domínios devem ficar no domínio dono ou em um módulo de contratos estreito; não em componentes compartilhados.
6. Nunca há importação de `app` por `feature`, `shared` ou `core`.

Essa regra substitui a dependência atual implícita: `RoleDispatcher` importa páginas de várias áreas e também decide provider, rota e role. A composição futura fica em `app/routing`, enquanto cada feature expõe apenas entradas públicas necessárias.

## 5. Organização interna de uma feature

Uma feature não precisa conter todas as pastas abaixo. A estrutura existe para separar motivos de mudança, não para criar diretórios vazios.

```text
features/<dominio>/
├── pages/          # entradas usadas por rotas
├── components/     # UI específica do domínio
├── hooks/          # comportamento React e estado de tela
├── api/            # operações remotas desse domínio
├── types/          # contratos e tipos próprios
├── context/        # somente estado compartilhado pelo subtree da feature
├── utils/          # funções puras específicas do domínio
└── public.ts       # única superfície permitida para composição externa, se necessária
```

- `pages/` existe quando o domínio possui rota própria.
- `components/` existe quando a UI contém partes reutilizadas dentro do domínio; componentes de uma única página podem começar co-localizados.
- `hooks/` existe quando existe comportamento reutilizável ou quando uma página perderia coesão ao manter efeitos e estado.
- `api/` existe quando o domínio acessa API/Supabase. Não é necessário criar um arquivo por endpoint se o contrato ainda for pequeno e coeso.
- `types/` existe quando os contratos aparecem em mais de um arquivo. Tipos exclusivos podem ficar próximos ao consumidor.
- `context/` só existe para estado consumido por múltiplos ramos da mesma feature; não substitui estado local.
- `public.ts` é opcional e deve exportar apenas páginas, contratos ou componentes de composição autorizados; não deve reexportar toda a árvore.

## 6. Contexts e escopo de estado

### AuthContext

**Permanece global.** É a representação React da sessão e deve expor somente: estado de inicialização, sessão/usuário autenticado, perfil derivado, ações de autenticar/sair e atualização explícita do perfil quando necessária.

Não deve ser dono de cópia independente do token em `sessionStorage`, dados de tenant, dados operacionais, lógica de redirecionamento de role ou chamadas de dashboard. O token é uma propriedade da sessão; componentes não devem recebê-lo como dependência para montar cabeçalhos. Essa decisão responde à `ISSUE-004`.

### TenantContext

**Permanece global.** É o runtime de tenant, com `slug`, dados públicos do tenant, estado de carregamento/ausência e aplicação de tema. Sua entrada deve ser a resolução canônica de host/URL, e seu ciclo de busca deve reagir a mudança de tenant — não a toda mudança de pathname. Isso responde à `ISSUE-001`.

Não deve conter usuário, perfil, token, guard de role ou dados de dashboard. Cache de identidade pública, se existir, é detalhe interno do runtime e não contrato consumido por páginas.

### DashboardContext

**Deixa de ser global conceitualmente e passa a ser contexto da feature de Supervisão Operacional.** Ele deve ser montado apenas na árvore do workspace de Gestor e apenas se suas subviews compartilharem realmente requests, setores, materiais, movimentos e refresh.

Sua responsabilidade é coordenar a leitura compartilhada daquele workspace e suas assinaturas Realtime. A assinatura deve ter ciclo de vida da feature, escopo de dados conhecido e política explícita para consolidação/atualização; não deve disparar recarga integral indiscriminada por definição. Líder e Portaria não recebem esse provider enquanto não houver consumidores reais, resolvendo `ISSUE-002` e `ISSUE-003`.

### Matriz de decisão de estado

| Tipo de estado | Escopo alvo | Exemplos atuais |
|---|---|---|
| Sessão e perfil | Global (`AuthContext`) | usuário, perfil, carregamento de sessão |
| Tenant e tema | Global (`TenantContext`) | slug, branding, cores |
| Leitura consolidada do Gestor | Feature (`supervision/context`) | setores, materiais, pendências, mapa |
| Dados de uma jornada | Hook/página da feature | lista da Terceirizada, pendências do Líder, fila da Portaria |
| Estado visual efêmero | Componente local | modal aberto, item selecionado, busca, tab, formulário |

## 7. API e services

### Estratégia proposta

O frontend adota uma única porta HTTP para endpoints do backend: o cliente configurado `api` (Axios). `fetch` e Axios direto deixam de ser escolhas de páginas/componentes. O uso direto de Supabase fica restrito a integrações explicitamente necessárias, como sessão em `core/auth` e upload de Storage no serviço da feature de operação.

```text
component/page → hook → feature/api → core/http/apiClient
                                     → core/auth/session client (quando necessário)
```

### Regras

- Cada feature possui API coesa por domínio: `entryRequestsApi`, `gateOperationsApi`, `supervisionApi`, `teamApi`, `auditApi`, `platformAdminApi` e `tenantApi`, conforme o contrato realmente disponível.
- Services não usam hooks e não importam React; recebem argumentos explícitos e retornam dados tipados ou um erro normalizado.
- O cliente HTTP é o único ponto que adiciona a credencial de sessão às requisições de backend. Nenhuma página ou componente chama `getAuthToken()` nem monta `Authorization` manualmente.
- O cliente HTTP normaliza erros de rede, resposta não esperada e falha autenticada para uma estrutura conhecida. A feature traduz essa estrutura para mensagens de UX sem repetir parse de resposta em cada tela.
- URLs, método HTTP e payload pertencem ao service/API de domínio, não à página.
- Uma operação com Supabase Storage segue a mesma regra: a página chama um hook ou service da feature; não chama o cliente diretamente.

Essa decisão ataca a dispersão registrada na `ISSUE-006` sem obrigar uma camada artificial para cada componente pequeno.

## 8. Rotas, guards e redirects

Responsabilidades separadas:

| Elemento | Responsabilidade proposta | Não deve decidir |
|---|---|---|
| **Router** | Declarar padrões de URL, associar páginas de entrada e montar composições de feature. | Fazer consulta, carregar perfil ou interpretar regras de autorização de backend. |
| **Tenant resolver/guard** | Resolver slug e exigir contexto de tenant em rotas que o pedem. | Escolher dashboard pelo role. |
| **Auth guard** | Esperar inicialização de sessão/perfil e permitir ou redirecionar acesso autenticado. | Formar caminhos de cada role em duplicidade. |
| **Role route gate** | Comparar o role de perfil com os roles esperados pela rota e delegar para um único destino canônico. | Fazer lookup de tenant ou renderizar dashboards de todos os domínios. |
| **Redirect policy** | Converter estado conhecido (sem sessão, perfil, tenant, role) em URL canônica. | Viver distribuída entre páginas e guards. |

O caminho canônico de cada role deve existir em um único catálogo de rotas/paths em `app/routing`. Login, `HomeRedirect`, guards e ações de navegação consultam esse catálogo ou helpers puros dele; não aplicam `.toLowerCase().replace('_', '-')` localmente. Isso elimina a duplicação observada na `ISSUE-009`.

`RoleDispatcher`, como existe hoje, mistura dispatch de tela, redirect, role e montagem de provider. Na arquitetura alvo, esses papéis se separam entre configuração do Router, gates pequenos e providers da feature na própria entrada da feature.

## 9. Autenticação: fonte de verdade

| Informação | Fonte de verdade | Acesso no frontend |
|---|---|---|
| Sessão e token de acesso | Cliente Supabase em `core/auth` | Cliente HTTP/interceptor; nunca páginas ou componentes. |
| Usuário autenticado | Sessão Supabase | `AuthContext` expõe estado derivado. |
| Perfil Unitraack | Consulta gerenciada por `AuthContext`/serviço de identidade | `useAuth()` para UI e guards; APIs recebem apenas dados de operação. |
| Estado de carregamento/erro de identidade | `AuthContext` | Guards e páginas de acesso. |

O frontend mantém uma única cópia observável da sessão, sem espelhar token em chave própria de `sessionStorage`. Serviços não importam `AuthContext`: o cliente HTTP lê a sessão pelo cliente de autenticação de infraestrutura. Componentes usam `useAuth()` somente para estado de UI/navegação e dados de perfil que precisam exibir.

Esta proposta não faz afirmações sobre autorização efetiva no backend ou RLS. Ela apenas reduz fontes concorrentes de token no cliente, como indicado na `ISSUE-004`.

## 10. Shared e Core

### Critério para `core`

Algo pertence a `core` quando é infraestrutura estável, sem semântica de um domínio do Unitraack e usada em mais de uma área: cliente Supabase, cliente HTTP, erro normalizado, resolução de slug, catálogo de paths e modelos mínimos de sessão/tenant runtime.

### Critério para `shared`

Algo pertence a `shared` quando é reutilizado por domínios diferentes e continua genérico ao remover os nomes “solicitação”, “material”, “tenant”, “líder” e “portaria”. Exemplos plausíveis: primitives de modal/formulário, feedback visual, layouts responsivos, `WebcamModal` se não tiver regra de portaria, máscaras e funções puras de formatação.

### Critério para permanecer na feature

Um item permanece na feature quando incorpora vocabulário, regra, contrato ou fluxo de um domínio: `TransferModal`, timeline de auditoria, mapa de setores, seleção de materiais, formulário de solicitação e exportação de relatório de auditoria. Reuso prematuro desses itens em `shared` ocultaria as fronteiras de negócio.

`shared` não é um depósito: todo item precisa ter pelo menos dois consumidores de domínios diferentes ou uma justificativa clara de primitive transversal. Caso contrário, permanece co-localizado.

## 11. Convenções propostas

### Nomes e arquivos

- Componentes React: `PascalCase.tsx`; nome exportado igual ao arquivo.
- Páginas: sufixo `Page`, por exemplo `PartnerRequestsPage.tsx` e `GateQueuePage.tsx`.
- Hooks: `use` + verbo/contexto, por exemplo `usePartnerRequests.ts`; um hook não representa um componente visual.
- APIs: `<dominio>Api.ts`, com funções nomeadas por ação e recurso, por exemplo `listRequests`, `createRequest`, `uploadMaterialImage`.
- Tipos: `types.ts` para contratos pequenos; arquivos por entidade quando o conjunto crescer. Preferir `RequestStatus`, `EntryRequest`, `Material`, `TenantProfile` a `any`.
- Funções puras: verbo + objeto, por exemplo `buildRolePath`, `formatCnpj`, `resolveTenantSlug`.

### Imports

Ordem: bibliotecas externas; `core`; `shared`; imports da própria feature; tipos (`import type`) por último dentro de cada grupo. Usar aliases de projeto quando configurados para reduzir caminhos relativos excessivos; não usar aliases para cruzar fronteiras privadas de feature.

### API e erros

- Toda chamada de backend sai de `feature/api` pelo cliente HTTP único.
- Toda função de API tem entrada e saída tipadas; componentes não inspecionam formatos brutos de resposta.
- Erros técnicos são normalizados antes da UI; a UI escolhe apenas mensagem, retry ou estado de feedback.
- `console` não substitui estado de erro observável para o usuário nem contrato de erro para teste.

### Estado e efeitos

- Efeito deve declarar o recurso que observa e ter cleanup quando usar timer, listener, câmera ou canal Realtime.
- Estado de modal, filtro e formulário é local salvo consumo comprovado por múltiplos ramos.
- Não introduzir `Context` para substituir props simples entre poucos níveis.
- Assinaturas Realtime devem ter escopo, lifecycle e política de atualização documentados no hook/contexto proprietário.

## 12. Estrutura final proposta

```text
src/
├── app/
│   ├── App.tsx
│   ├── providers/
│   │   └── AppProviders.tsx
│   └── routing/
│       ├── AppRouter.tsx
│       ├── guards/
│       ├── paths.ts
│       └── redirects.ts
├── core/
│   ├── auth/
│   │   ├── supabaseClient.ts
│   │   ├── session.ts
│   │   └── auth.types.ts
│   ├── http/
│   │   ├── apiClient.ts
│   │   └── apiError.ts
│   ├── tenant/
│   │   ├── tenantRuntime.ts
│   │   └── tenant.types.ts
│   └── routing/
│       └── rolePaths.ts
├── shared/
│   ├── ui/
│   ├── feedback/
│   ├── forms/
│   ├── media/
│   └── utils/
├── features/
│   ├── access/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   └── types/
│   ├── entry-operations/
│   │   ├── pages/
│   │   │   ├── partner/
│   │   │   ├── leader/
│   │   │   └── gatekeeper/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   ├── types/
│   │   └── utils/
│   ├── supervision/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── api/
│   │   └── types/
│   ├── organization/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   └── types/
│   ├── audit-reporting/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   └── types/
│   ├── platform-admin/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   └── types/
│   └── manager-workspace/
│       ├── pages/
│       └── components/
├── contexts/
│   ├── AuthContext.tsx
│   └── TenantContext.tsx
└── styles/
    └── index.css
```

`manager-workspace` é deliberadamente uma feature de composição estreita: oferece a página do Gestor e pode consumir entradas públicas de `supervision`, `organization` e `audit-reporting`. Essas features não dependem dela. Se a composição permanecer pequena, ela pode ser uma página em `app/`; a decisão depende da evolução real das abas.

Os dois contexts globais são mostrados separados para evidenciar seu papel de runtime. Se no futuro houver conveniência organizacional, podem residir em `core`, mas não devem se tornar um terceiro domínio de negócio.

## 13. Mapeamento conceitual do estado atual

| Módulo atual | Destino conceitual | Observação |
|---|---|---|
| `features/auth/pages/Login.tsx` e `AdminLogin.tsx` | `features/access/pages/` | Entradas de sessão com regras de UX distintas. |
| `RegisterGestor`, `RegisterInternal`, `RegisterTerceirizada` | `features/access/pages/` | Onboarding é parte de acesso/identidade, não de administração ou operação. |
| `contexts/AuthContext.tsx` | `contexts/AuthContext.tsx` com contratos de `core/auth` | Permanece global, com escopo reduzido a sessão/perfil. |
| `contexts/TenantContext.tsx` e `utils/subdomain.ts` | `contexts/TenantContext.tsx` + `core/tenant/` | Runtime de tenant separado de navegação específica. |
| `RoleDispatcher.tsx`, `MainRoutes.tsx`, guards | `app/routing/` | Separar catálogo de paths, guards e política de redirect. |
| `TerceirizadaDashboard.tsx` e `NovaSolicitacao.tsx` | `features/entry-operations/pages/partner/` | Jornada da terceirizada no domínio operacional. |
| `LiderDashboard.tsx` | `features/entry-operations/pages/leader/` | Jornada do líder; não recebe contexto do Gestor. |
| `PortariaDashboard.tsx` | `features/entry-operations/pages/gatekeeper/` | Jornada de portaria; câmera/modal podem ser locais ou shared conforme reuso real. |
| `TransferModal`, `AcceptModal`, `LiderSidebar` | `features/entry-operations/components/` | Contêm semântica de materiais/operação. |
| `DashboardContext.tsx` e `dashboardService.ts` | `features/supervision/context/` e `features/supervision/api/` | Contexto limitado ao workspace Gestor; separar contratos que pertençam à operação. |
| `GestorDashboard.tsx`, `DashboardHeader`, `DashboardSidebar`, `DashboardStats`, `PendingApprovals` | `features/manager-workspace/` e `features/supervision/` | Workspace compõe; leitura operacional e mapa ficam em supervisão. |
| `InteractiveMap`, `MonitoringDashboard` | `features/supervision/components/` | Visão de planta e estado operacional. |
| `TeamManagement` e `dashboard/team/*` | `features/organization/` | Gestão de unidade, separada de plataforma global. |
| `AuditSection`, `AuditTimeline`, `AuditThirdPartyList`, `ThirdPartiesReport` | `features/audit-reporting/` | Domínio proprietário de consultas históricas e exportação PDF. |
| `SuperAdminDashboard.tsx` | `features/platform-admin/pages/` | Administração da plataforma; não é a mesma feature de organização da unidade. |
| `lib/axios.ts` e chamadas `fetch`/Axios diretas | `core/http/apiClient.ts` + `features/*/api/` | Um cliente de transporte e APIs por domínio. |
| `WebcamModal.tsx` | `shared/media/` ou `entry-operations/components/` | Só é shared se também não carregar semântica de portaria. |
| `SignaturePad.tsx`, `AdminSidebar.tsx` | Necessita decisão após confirmação de uso | A Fase 1 registra indícios de não uso; não mover/remover nesta fase. |

## 14. Decisões arquiteturais

| Decisão | Motivo | Problema da baseline relacionado |
|---|---|---|
| Manter apenas AuthContext e TenantContext como contexts globais de runtime | Sessão e tenant são necessários transversalmente; estado operacional não é. | ISSUE-001, ISSUE-003, ISSUE-004 |
| Tornar DashboardContext contexto da feature de Supervisão e montá-lo somente no Gestor | Líder e Portaria não têm consumidores identificados e o provider abre consultas/listeners. | ISSUE-002, ISSUE-003 |
| Adotar cliente HTTP único e APIs por domínio | O frontend mistura `fetch`, Axios direto, interceptor e token manual. | ISSUE-004, ISSUE-006 |
| Fazer sessão Supabase ser a única fonte do token | Evita cópias concorrentes e acesso manual de token por UI. | ISSUE-004 |
| Centralizar paths/redirects e separar Router, guards e role gates | A formação de URL por role/tenant ocorre em vários módulos. | ISSUE-009 |
| Agrupar Terceirizada, Líder e Portaria no domínio de operação, com páginas por jornada | Eles participam do mesmo ciclo de entrada e materiais; as roles não são domínios independentes. | Inventário do fluxo operacional; ISSUE-007 |
| Separar organização da unidade de administração da plataforma | Os componentes de equipe do Gestor e dashboard SuperAdmin possuem escopos e dados distintos. | Inventário: `admin/` reúne responsabilidades diferentes; ISSUE-007 |
| Restringir `shared` a itens realmente genéricos e manter semântica no domínio | Evita um depósito genérico e dependências implícitas. | ISSUE-007, ISSUE-009 |
| Definir tipos por domínio e remover expansão de `any` gradualmente | Dados operacionais e de sessão atravessam muitos componentes sem garantias estáticas. | ISSUE-008 |
| Direcionar estado visual para componentes e efeitos para hooks com cleanup | Modais/timers/integrações em páginas grandes dificultam testes e manutenção. | ISSUE-007, ISSUE-013 |
| Iniciar testes pelas regras de runtime e jornadas críticas | Não há suíte automatizada e a maior parte das regressões depende de validação manual. | ISSUE-010 |

## 15. Pontos que permanecem em aberto

| Tipo | Ponto aberto | O que é necessário para decidir |
|---|---|---|
| Decisão arquitetural | `manager-workspace` deve ser feature própria ou composição em `app`? | Confirmar se as abas do Gestor terão evolução independente, permissões e layout próprios. |
| Decisão arquitetural | Quais contratos de `entry-operations` são compartilhados com supervisão/auditoria? | Mapear endpoints, payloads e tipos usados por cada jornada. |
| Hipótese | `WebcamModal` pode ser shared. | Confirmar se a câmera será usada fora da portaria sem regra operacional específica. |
| Hipótese | `SignaturePad` e `AdminSidebar` são código órfão. | Confirmar com produto/uso real antes de remover, mover ou reincorporar. |
| Ponto que precisa de teste | Política de atualização do dashboard deve ser recarga, atualização incremental ou invalidação por evento. | Medir volume real de eventos, dados e renderização do mapa/painel. |
| Ponto que precisa de teste | Cache de tenant melhora navegação sem exibir branding desatualizado. | Definir expectativa de atualização do branding e medir troca de tenant/navegação. |
| Ponto dependente do backend | Contratos finais, paginação, filtros e formato único de erro HTTP. | Inventário/contrato de API mantido pelo backend. |
| Ponto dependente do backend | Escopo efetivo de eventos Realtime e permissões Storage. | Políticas Supabase, configuração de canais e buckets. |
| Ponto dependente do backend | Regra autorizativa por role e isolamento entre tenants. | Validação de middleware, endpoints e RLS; este documento não presume garantia no cliente. |

## 16. Caminho de adoção incremental (conceitual)

Esta arquitetura não exige uma troca total. A ordem sugerida para discussão futura é: primeiro definir contratos de `core/http`, sessão e paths; depois estabilizar `AuthContext`/`TenantContext`; em seguida limitar o contexto de supervisão ao Gestor; e por fim migrar uma jornada operacional por vez, começando pela que tiver testes de caracterização disponíveis.

Essa ordem é apenas orientação de redução de risco. Qualquer implementação posterior deve ser aprovada separadamente e validada contra os fluxos de Terceirizada, Líder, Portaria, Gestor e SuperAdmin.
