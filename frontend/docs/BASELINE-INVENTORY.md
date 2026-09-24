# BASELINE-INVENTORY.md — Inventário do Estado Atual do Frontend (Unitraack)

**Data do Levantamento**: 02 de Setembro de 2026  
**Tipo de Documento**: Inventário Técnico e Mapeamento de Linha de Base (Fase 1 — Baseline)  
**Status**: Factual / Não Modificante (Nenhum arquivo foi alterado)

---

## 1. Estrutura de Diretórios

O diretório `frontend/src` contém **52 arquivos** distribuídos em 7 diretórios principais e 4 subdiretórios em `features`:

```text
src/
├── App.tsx                                 # Ponto de entrada React com provedores globais
├── main.tsx                                # Bootstrap do React 19 no DOM
├── index.css                               # Estilos globais e tokens Tailwind CSS v4
│
├── components/                             # Componentes visuais utilitários globais
│   ├── SignaturePad.tsx                    # Canvas de assinatura (aparentemente não utilizado)
│   └── WebcamModal.tsx                     # Modal com acesso a navigator.mediaDevices
│
├── contexts/                               # Gerenciamento de estado global via React Context
│   ├── AuthContext.tsx                     # Sessão Supabase, perfil, token e locks
│   ├── DashboardContext.tsx                # Dados operacionais do gestor e Supabase Realtime
│   └── TenantContext.tsx                   # Identificação de usina, subdomínio e cores dinâmicas
│
├── guards/                                 # Componentes de controle de acesso e redirecionamento
│   ├── HomeRedirect.tsx                    # Redirecionamento da rota raiz '/'
│   ├── ProtectedRoute.tsx                  # Proteção de rotas, validação de role e usina
│   └── SubdomainOrNotFound.tsx             # Validação de presença de subdomínio
│
├── lib/                                    # Clientes de infraestrutura externa
│   ├── axios.ts                            # Instância Axios com baseURL e interceptor de token
│   └── supabase.ts                         # Cliente @supabase/supabase-js com sessionStorage
│
├── routes/                                 # Definição e mapeamento de rotas
│   └── MainRoutes.tsx                      # Rotas declarativas do React Router v7
│
├── utils/                                  # Utilitários puros
│   ├── masks.ts                            # Máscaras de CNPJ, telefone e regex de e-mail
│   └── subdomain.ts                        # Parser de hostname/path para extração de tenant
│
└── features/                               # Módulos por área de funcionalidade
    ├── admin/                              # Módulo administrativo (SuperAdmin + Gestão de Equipe)
    │   ├── pages/
    │   │   └── SuperAdminDashboard.tsx     # Dashboard do SuperAdmin (Monolítico)
    │   └── components/
    │       ├── TeamManagement.tsx          # Gestão de equipe e setores (Usado pelo Gestor)
    │       └── dashboard/team/             # Subcomponentes de equipe e setores
    │           ├── InviteGenerator.tsx
    │           ├── ManualRegisterForm.tsx
    │           ├── MemberList.tsx
    │           ├── SectorManagement.tsx
    │           └── TeamCommon.tsx
    │
    ├── auth/                               # Módulo de autenticação e registro
    │   ├── api/
    │   │   ├── authService.ts              # Chamadas Supabase Auth
    │   │   └── tenantService.ts            # Chamada Axios para tenant-info
    │   ├── components/
    │   │   ├── ParticleBackground.tsx      # Efeito visual de partículas em canvas
    │   │   └── RoleDispatcher.tsx          # Roteador interno de dashboards por role
    │   └── pages/
    │       ├── AdminLogin.tsx              # Login exclusivo do SuperAdmin
    │       ├── Login.tsx                   # Login de usinas/tenants
    │       ├── RegisterGestor.tsx          # Cadastro de Gestor via token
    │       ├── RegisterInternal.tsx        # Cadastro de Líder/Portaria via convite
    │       └── RegisterTerceirizada.tsx    # Auto-cadastro de empresas parceiras
    │
    ├── monitoring/                         # Módulo de monitoramento e supervisão
    │   ├── pages/
    │   │   └── GestorDashboard.tsx         # Dashboard central do Gestor de Segurança
    │   └── components/
    │       ├── InteractiveMap.tsx          # Mapa interativo 2D SVG (Digital Twin)
    │       ├── MonitoringDashboard.tsx     # Visão de setores e ativos em accordions
    │       └── ThirdPartiesReport.tsx      # Relatórios gráficos Recharts e exportação PDF
    │
    └── requests/                           # Módulo operacional e solicitações
        ├── api/
        │   └── dashboardService.ts         # Endpoints da API para gestor
        ├── pages/
        │   ├── LiderDashboard.tsx          # Painel do Líder de Setor
        │   ├── PortariaDashboard.tsx       # Painel da Portaria
        │   ├── TerceirizadaDashboard.tsx   # Painel da Terceirizada
        │   └── Terceirizada/
        │       └── NovaSolicitacao.tsx     # Formulário de entrada de materiais
        └── components/
            ├── AuditSection.tsx            # Seletor e coordenador de auditoria
            └── dashboard/
                ├── AcceptModal.tsx         # Confirmação de recebimento de material
                ├── AdminSidebar.tsx        # Sidebar de diretores (aparentemente não utilizada)
                ├── DashboardHeader.tsx     # Cabeçalho padrão do painel
                ├── DashboardSidebar.tsx    # Sidebar de navegação do Gestor
                ├── DashboardStats.tsx      # Cards de estatísticas rápidas
                ├── LiderSidebar.tsx        # Sidebar de navegação do Líder
                ├── MobileNav.tsx           # Barra de navegação inferior mobile
                ├── PendingApprovals.tsx    # Lista de autorizações pendentes
                ├── TransferModal.tsx       # Modal de transferência interna de materiais
                └── audit/
                    ├── AuditThirdPartyList.tsx # Lista de terceirizadas para auditoria
                    └── AuditTimeline.tsx       # Linha do tempo e gerador de PDF
```

---

## 2. Mapeamento dos Domínios

### 2.1. Domínio: Autenticação & Onboarding
* **Localização**: `src/features/auth/`
* **Principais Páginas**: `Login.tsx`, `AdminLogin.tsx`, `RegisterTerceirizada.tsx`, `RegisterInternal.tsx`, `RegisterGestor.tsx`
* **Principais Componentes**: `ParticleBackground.tsx`, `RoleDispatcher.tsx`
* **Services Utilizados**: `authService.ts`, `tenantService.ts`
* **Contexts Utilizados**: `AuthContext`, `TenantContext`
* **Hooks Utilizados**: `useAuth`, `useTenant`, `useNavigate`, `useLocation`, `useSearchParams`, `useParams`, `useState`, `useEffect`, `useRef`
* **Integrações Externas**: Supabase Auth, API Express (`/auth/register`, `/auth/register-gestor`, `/auth/invitation/:token`, `/auth/tenant-info`)

### 2.2. Domínio: SuperAdmin (Plataforma Global)
* **Localização**: `src/features/admin/pages/SuperAdminDashboard.tsx`
* **Principais Páginas**: `SuperAdminDashboard.tsx`
* **Principais Componentes**: Modais e abas inlined no arquivo principal
* **Services Utilizados**: Nenhum service formal (utiliza `fetch()` direto com `getAuthToken()`)
* **Contexts Utilizados**: `AuthContext`
* **Hooks Utilizados**: `useAuth`, `useState`, `useEffect`, `useRef`
* **Integrações Externas**: API Express (`/admin/tenants`, `/admin/stats`, `/admin/users`, `/admin/extract-branding`, `/admin/audit/:tenantId`)

### 2.3. Domínio: Gestor de Segurança & Monitoramento
* **Localização**: `src/features/monitoring/` + `src/features/admin/components/` + `src/features/requests/components/`
* **Principais Páginas**: `GestorDashboard.tsx`
* **Principais Componentes**: `DashboardSidebar.tsx`, `DashboardHeader.tsx`, `DashboardStats.tsx`, `PendingApprovals.tsx`, `InteractiveMap.tsx`, `MonitoringDashboard.tsx`, `ThirdPartiesReport.tsx`, `AuditSection.tsx`, `AuditTimeline.tsx`, `TeamManagement.tsx`, `SectorManagement.tsx`, `MemberList.tsx`, `InviteGenerator.tsx`, `ManualRegisterForm.tsx`
* **Services Utilizados**: `dashboardService.ts`
* **Contexts Utilizados**: `AuthContext`, `TenantContext`, `DashboardContext`
* **Hooks Utilizados**: `useAuth`, `useTenant`, `useDashboard`, `useState`, `useEffect`, `useRef`, `useMemo`, `useCallback`
* **Integrações Externas**: API Express (`/gestor/*`, `/sectors`), Supabase Realtime (`materials`, `material_movements`, `entry_requests`), `recharts`, `jspdf`, `jspdf-autotable`, `html-to-image`

### 2.4. Domínio: Líder de Setor
* **Localização**: `src/features/requests/pages/LiderDashboard.tsx`
* **Principais Páginas**: `LiderDashboard.tsx`
* **Principais Componentes**: `LiderSidebar.tsx`, `DashboardHeader.tsx`, `AcceptModal.tsx`, `TransferModal.tsx`, `MobileNav.tsx`, `WebcamModal.tsx`
* **Services Utilizados**: Nenhum formal (utiliza instância `api` com chamadas inline)
* **Contexts Utilizados**: `AuthContext` *(Envolvido por DashboardProvider no RoleDispatcher, mas não consome useDashboard)*
* **Hooks Utilizados**: `useAuth`, `useState`, `useEffect`, `useRef`
* **Integrações Externas**: API Express (`/lider/pendencias`, `/lider/meu-setor`, `/lider/autorizar/:id`, `/lider/recusar/:id`, `/lider/transferir`, `/lider/aceitar-transferencia`, `/portaria/audit/:tenantId`), `sweetalert2`

### 2.5. Domínio: Portaria (Controle de Acesso)
* **Localização**: `src/features/requests/pages/PortariaDashboard.tsx`
* **Principais Páginas**: `PortariaDashboard.tsx`
* **Principais Componentes**: `MobileNav.tsx`, `WebcamModal.tsx`, Modais inlined (Discrepância, Inspeção, Sucesso)
* **Services Utilizados**: Nenhum formal (utiliza `fetch()` nativo inline)
* **Contexts Utilizados**: `AuthContext` *(Envolvido por DashboardProvider no RoleDispatcher, mas não consome useDashboard)*
* **Hooks Utilizados**: `useAuth`, `useState`, `useEffect`, `useRef`
* **Integrações Externas**: API Express (`/portaria/approved`, `/portaria/check-in`, `/portaria/check-out`, `/portaria/discrepancy`, `/portaria/audit/:id`), Supabase Realtime, Hardware Câmera (`getUserMedia`), `sweetalert2`

### 2.6. Domínio: Terceirizada (Fornecedor Parceiro)
* **Localização**: `src/features/requests/pages/TerceirizadaDashboard.tsx` e `NovaSolicitacao.tsx`
* **Principais Páginas**: `TerceirizadaDashboard.tsx`, `NovaSolicitacao.tsx`
* **Principais Componentes**: Modais de visualização de requisição e equipamentos inlined
* **Services Utilizados**: Nenhum formal (utiliza instância `api` e `axios` cru com chamadas inline)
* **Contexts Utilizados**: `AuthContext`, `TenantContext`
* **Hooks Utilizados**: `useAuth`, `useTenant`, `useNavigate`, `useLocation`, `useState`, `useEffect`, `useRef`
* **Integrações Externas**: API Express (`/terceirizada/profile`, `/terceirizada/requisicoes`, `/terceirizada/requisicao`, `/sectors`), Supabase Storage (Bucket `material-images`), Supabase DB (tabela `profiles`), `sweetalert2`

---

## 3. Inventário das Pages

| Página | Localização | Linhas | Responsabilidade Atual | Dependências Principais |
| :--- | :--- | :---: | :--- | :--- |
| **SuperAdminDashboard** | `features/admin/pages/SuperAdminDashboard.tsx` | 1.291 | Gestão global da plataforma SaaS: CRUD de usinas (tenants), geração de links de convite para gestores, extração automática de cores e branding de websites externos, listagem e auditoria de usuários globais, e logs de auditoria por usina. | `useAuth`, `getAuthToken`, `fetch`, `MobileNav`, Lucide Icons |
| **PortariaDashboard** | `features/requests/pages/PortariaDashboard.tsx` | 1.218 | Operação física da portaria: visualização de filas (Entrada, Saída, Em Planta), conferência item a item de materiais, registro de divergências/discrepâncias, captura fotográfica com webcam, coleta de assinatura, e confirmação de Check-in/Check-out. | `useAuth`, `getAuthToken`, `fetch`, `WebcamModal`, `MobileNav`, `Swal`, `supabase` |
| **LiderDashboard** | `features/requests/pages/LiderDashboard.tsx` | 988 | Aprovação operacional de líderes: autorização/recusa de solicitações de entrada para seu setor, inventário de materiais atualmente no setor, transferência entre setores, aceite de transferências recebidas e histórico de movimentações. | `useAuth`, `getAuthToken`, `api` (Axios), `LiderSidebar`, `DashboardHeader`, `AcceptModal`, `TransferModal`, `MobileNav`, `Swal` |
| **TerceirizadaDashboard** | `features/requests/pages/TerceirizadaDashboard.tsx` | 614 | Portal da empresa contratada: listagem de solicitações criadas, acompanhamento de status de aprovação (Líder/Gestor/Portaria), cancelamento e exclusão de solicitações, e visualização detalhada de equipamentos. | `useAuth`, `useTenant`, `api` (Axios), `getAuthToken`, `Swal`, `useNavigate` |
| **NovaSolicitacao** | `features/requests/pages/Terceirizada/NovaSolicitacao.tsx` | 595 | Criação e edição de ordens de entrada: seleção hierárquica de setores (Pai > Filho), cadastro dinâmico de lista de equipamentos/materiais, upload direto de imagens para Supabase Storage, e dados do motorista/veículo. | `useAuth`, `useTenant`, `supabase` (Storage e DB), `axios`, `getAuthToken`, `useNavigate`, `useLocation` |
| **RegisterGestor** | `features/auth/pages/RegisterGestor.tsx` | 331 | Validação de token de convite administrativo e cadastro de credenciais do primeiro Gestor de Segurança da usina. | `useSearchParams`, `useParams`, `fetch`, `getSubdomain`, `ParticleBackground` |
| **RegisterInternal** | `features/auth/pages/RegisterInternal.tsx` | 331 | Cadastro de colaboradores internos (Líder de Setor e Agente de Portaria) a partir de parâmetros de convite via URL. | `useSearchParams`, `useParams`, `useTenant`, `fetch`, `maskCNPJ`, `validateEmail`, `ParticleBackground` |
| **Login** | `features/auth/pages/Login.tsx` | 302 | Autenticação para usinas/tenants, isolamento de acessos (bloqueio de SuperAdmin no portal e de usuário comum sem usina), verificação de usina desativada e redirecionamento. | `useAuth`, `useTenant`, `useNavigate`, `useLocation`, `ParticleBackground` |
| **RegisterTerceirizada** | `features/auth/pages/RegisterTerceirizada.tsx` | 295 | Auto-credenciamento de empresas prestadoras de serviço no portal público da usina contratante. | `useTenant`, `fetch`, `maskCNPJ`, `maskPhone`, `validateEmail`, `ParticleBackground`, `useNavigate` |
| **AdminLogin** | `features/auth/pages/AdminLogin.tsx` | 141 | Autenticação exclusiva para a administração global (SuperAdmin). | `useAuth`, `useNavigate`, `ParticleBackground` |
| **GestorDashboard** | `features/monitoring/pages/GestorDashboard.tsx` | 112 | Página coordenadora do painel do Gestor de Segurança: roteia internamente entre abas (Painel, Equipe, Rastro, Mapa, Auditoria, Relatórios) montando os respectivos componentes. | `useAuth`, `DashboardSidebar`, `DashboardHeader`, `DashboardStats`, `PendingApprovals`, `AuditSection`, `MonitoringDashboard`, `TeamManagement`, `InteractiveMap`, `ThirdPartiesReport`, `MobileNav` |

---

## 4. Inventário dos Components

### 4.1. Componentes Globais (`src/components/`)
* [WebcamModal.tsx](file:/Unitraack/frontend/src/components/WebcamModal.tsx) (123 linhas): Modal com controle direto da API `navigator.mediaDevices.getUserMedia`, permitindo alternar câmeras e capturar frames para canvas em formato JPEG Base64.
* [SignaturePad.tsx](file:/Unitraack/frontend/src/components/SignaturePad.tsx) (60 linhas): Componente baseado em `react-signature-canvas` com ações de limpar e salvar. *(Aparentemente não utilizado no momento)*.

### 4.2. Componentes de Autenticação (`src/features/auth/components/`)
* [ParticleBackground.tsx](file:/Unitraack/frontend/src/features/auth/components/ParticleBackground.tsx) (131 linhas): Efeito visual de partículas interativas desenhadas em elemento HTML `<canvas>` com cálculo de distâncias e física vetorial.
* [RoleDispatcher.tsx](file:/Unitraack/frontend/src/features/auth/components/RoleDispatcher.tsx) (84 linhas): Switch de roteamento que avalia `profile.role` e renderiza o dashboard correspondente (`SuperAdminDashboard`, `GestorDashboard`, `LiderDashboard`, `PortariaDashboard`, `TerceirizadaDashboard`), aplicando também regras de redirecionamento de URL.

### 4.3. Componentes de Monitoramento e Gestão (`src/features/monitoring/components/`)
* [InteractiveMap.tsx](file:/Unitraack/frontend/src/features/monitoring/components/InteractiveMap.tsx) (750 linhas): Componente interativo que renderiza a planta industrial em SVG, permitindo arrastar setores, redimensionar, controlar zoom/pan, exibir tooltips e salvar layouts via API.
* [MonitoringDashboard.tsx](file:/Unitraack/frontend/src/features/monitoring/components/MonitoringDashboard.tsx) (418 linhas): Visualização em gavetas (accordions) da hierarquia de setores e subsetores com a listagem de materiais ativos em cada área.
* [ThirdPartiesReport.tsx](file:/Unitraack/frontend/src/features/monitoring/components/ThirdPartiesReport.tsx) (247 linhas): Exibição de gráficos de barras e pizza via `recharts` sobre o volume de terceirizadas e materiais, com exportação para PDF via captura de imagem (`html-to-image` + `jspdf`).

### 4.4. Componentes Operacionais e de Auditoria (`src/features/requests/components/`)
* [AuditTimeline.tsx](file:/Unitraack/frontend/src/features/requests/components/dashboard/audit/AuditTimeline.tsx) (685 linhas): Linha do tempo de movimentações de uma empresa parceira com filtros avançados e geração imperativa de relatório PDF via `jspdf` e `jspdf-autotable`.
* [PendingApprovals.tsx](file:/Unitraack/frontend/src/features/requests/components/dashboard/PendingApprovals.tsx) (330 linhas): Lista de requisições autorizadas pelos líderes que aguardam validação de portaria, com modais inlined de visualização de dados da empresa e de materiais.
* [TransferModal.tsx](file:/Unitraack/frontend/src/features/requests/components/dashboard/TransferModal.tsx) (304 linhas): Modal para transferência de equipamentos entre setores, permitindo anexar fotos e matrícula do responsável.
* [DashboardSidebar.tsx](file:/Unitraack/frontend/src/features/requests/components/dashboard/DashboardSidebar.tsx) (169 linhas): Barra lateral do Gestor de Segurança com submenu expansível de setores pais.
* [LiderSidebar.tsx](file:/Unitraack/frontend/src/features/requests/components/dashboard/LiderSidebar.tsx) (113 linhas): Barra lateral de navegação exclusiva para Líderes de Setor.
* [AcceptModal.tsx](file:/Unitraack/frontend/src/features/requests/components/dashboard/AcceptModal.tsx) (114 linhas): Modal para o líder confirmar o recebimento de material transferido para o seu setor.
* [AuditSection.tsx](file:/Unitraack/frontend/src/features/requests/components/AuditSection.tsx) (111 linhas): Componente coordenador que alterna entre a lista de empresas e a timeline de auditoria.
* [AuditThirdPartyList.tsx](file:/Unitraack/frontend/src/features/requests/components/dashboard/audit/AuditThirdPartyList.tsx) (104 linhas): Listagem com busca das empresas terceirizadas cadastradas para auditoria.
* [AdminSidebar.tsx](file:/Unitraack/frontend/src/features/requests/components/dashboard/AdminSidebar.tsx) (76 linhas): Componente com lista de diretores e status online. *(Aparentemente não utilizado)*.
* [MobileNav.tsx](file:/Unitraack/frontend/src/features/requests/components/dashboard/MobileNav.tsx) (62 linhas): Barra de navegação inferior flutuante para dispositivos móveis.
* [DashboardStats.tsx](file:/Unitraack/frontend/src/features/requests/components/dashboard/DashboardStats.tsx) (41 linhas): Três cards de métricas (Pendentes, Ativos na Planta, Finalizados).
* [DashboardHeader.tsx](file:/Unitraack/frontend/src/features/requests/components/dashboard/DashboardHeader.tsx) (32 linhas): Cabeçalho superior com título dinâmico por seção e botão de perfil/sair.

### 4.5. Componentes de Equipe e Setores (`src/features/admin/components/`)
* [MemberList.tsx](file:/Unitraack/frontend/src/features/admin/components/dashboard/team/MemberList.tsx) (309 linhas): Listagem da equipe da usina (Líderes e Portaria) com modais para edição, alteração de status ativo/inativo e exclusão.
* [ManualRegisterForm.tsx](file:/Unitraack/frontend/src/features/admin/components/dashboard/team/ManualRegisterForm.tsx) (236 linhas): Formulário de cadastro direto de colaboradores internos sem uso de convite.
* [SectorManagement.tsx](file:/Unitraack/frontend/src/features/admin/components/dashboard/team/SectorManagement.tsx) (204 linhas): Cadastro e exclusão de Setores Principais e Subsetores da usina.
* [InviteGenerator.tsx](file:/Unitraack/frontend/src/features/admin/components/dashboard/team/InviteGenerator.tsx) (158 linhas): Gerador de links de convite parametrizados por setor e role.
* [TeamCommon.tsx](file:/Unitraack/frontend/src/features/admin/components/dashboard/team/TeamCommon.tsx) (121 linhas): Componentes utilitários de formulário (`TabButton`, `InputGroup`, `CustomSelect`, `Modal`).
* [TeamManagement.tsx](file:/Unitraack/frontend/src/features/admin/components/TeamManagement.tsx) (76 linhas): Tab container que agrupa `ManualRegisterForm`, `InviteGenerator`, `MemberList` e `SectorManagement`.

---

## 5. Inventário dos Contexts

| Context | Localização | Estado Gerenciado | Quem Utiliza | Responsabilidades Observadas |
| :--- | :--- | :--- | :--- | :--- |
| **AuthContext** | `src/contexts/AuthContext.tsx` | `user`, `profile`, `token`, `loading` | Quase toda a aplicação (`ProtectedRoute`, `RoleDispatcher`, `Login`, `AdminLogin`, Dashboards) | 1. Inicializa e sincroniza sessão do Supabase Auth.<br>2. Escuta eventos `onAuthStateChange`.<br>3. Consulta tabela `profiles` e tabela `tenants` com timeout de 15s via `Promise.race`.<br>4. Lida com retries de lock contention.<br>5. Realiza validação de conta desativada.<br>6. Expõe métodos `login`, `signInWithPassword`, `signInWithOtp`, `signOut`, `refreshProfile`. |
| **TenantContext** | `src/contexts/TenantContext.tsx` | `tenant`, `loading`, `isSubdomain`, `slug`, `isAdmin` | `App.tsx`, `Login`, `RegisterTerceirizada`, `RegisterInternal`, `ProtectedRoute`, `RoleDispatcher` | 1. Extrai slug da usina do hostname ou do pathname.<br>2. Consulta `/auth/tenant-info` via `tenantService`.<br>3. Aplica cores dinâmicas via `setProperty` no `:root` CSS.<br>4. Gerencia cache em `sessionStorage` (`tenant_cache_${slug}`). |
| **DashboardContext** | `src/contexts/DashboardContext.tsx` | `requests`, `sectors`, `materials`, `movements`, `stats`, `loading`, `error` | `RoleDispatcher`, `GestorDashboard`, `PendingApprovals`, `DashboardStats`, `DashboardSidebar`, `InteractiveMap`, `MonitoringDashboard`, `SectorManagement`, `MemberList`, `InviteGenerator`, `ManualRegisterForm`, `TransferModal` | 1. Busca `/gestor/monitoring` e `/gestor/dashboard` em paralelo via `Promise.allSettled`.<br>2. Conecta canais Supabase Realtime nas tabelas `materials`, `material_movements` e `entry_requests`.<br>3. Expõe mutações: `approveRequest`, `rejectRequest`, `updateMaterialPosition`, `updateMapLayout`. |

### Acúmulo de Responsabilidades Observado nos Contexts:
* **DashboardContext**: É instanciado no `RoleDispatcher` ao redor de `LiderDashboard` e `PortariaDashboard`, porém seus métodos de busca (`/gestor/monitoring` e `/gestor/dashboard`) pertencem estritamente ao papel de Gestor.
* **AuthContext**: Além de gerenciar autenticação pura (JWT/Sessão), executa queries de banco de dados diretamente em `profiles` e `tenants`, faz retries com timeouts manuais, e gerencia flags de bloqueio de concorrência (`fetchingProfile.current`).

---

## 6. Inventário dos Services / API

### 6.1. Services Formais
* [authService.ts](file:/Unitraack/frontend/src/features/auth/api/authService.ts) (`features/auth/api/`): Encapsula métodos do Supabase Auth (`getSession`, `onAuthStateChange`, `signInWithOtp`, `signInWithPassword`, `signOut`).
* [tenantService.ts](file:/Unitraack/frontend/src/features/auth/api/tenantService.ts) (`features/auth/api/`): Executa `api.get('/auth/tenant-info?slug=...')` com header `X-Tenant-Slug`.
* [dashboardService.ts](file:/Unitraack/frontend/src/features/requests/api/dashboardService.ts) (`features/requests/api/`): Métodos para endpoints `/gestor/monitoring`, `/gestor/dashboard`, `/gestor/approve/:id`, `/gestor/reject/:id`, `/gestor/material-position`, `/gestor/map-layout`, `/gestor/third-parties`.

### 6.2. Mapeamento de Chamadas por Mecanismo

```text
1. VIA INSTÂNCIA AXIOS CONFIGURADA (`lib/axios.ts` com interceptor de token):
   ├── tenantService.ts         ──► GET  /auth/tenant-info
   ├── dashboardService.ts      ──► GET  /gestor/monitoring, /gestor/dashboard, /gestor/third-parties
   │                            ──► POST /gestor/approve/:id, /gestor/reject/:id, /gestor/material-position, /gestor/map-layout
   ├── LiderDashboard.tsx       ──► GET  /lider/pendencias, /lider/meu-setor, /portaria/audit/:tenantId
   │                            ──► POST /lider/autorizar/:id, /lider/recusar/:id, /lider/transferir, /lider/aceitar-transferencia
   ├── SectorManagement.tsx     ──► POST /sectors, DELETE /sectors/:id
   ├── InteractiveMap.tsx       ──► POST /gestor/material-position, /gestor/map-layout
   └── TerceirizadaDashboard.tsx──► GET  /terceirizada/profile, /terceirizada/requisicoes
                                ──► PATCH /terceirizada/requisicao/:id/cancelar
                                ──► DELETE /terceirizada/requisicao/:id

2. VIA AXIOS CRU (Import direto de 'axios' com headers manuais):
   ├── NovaSolicitacao.tsx      ──► GET  /sectors
   │                            ──► POST/PUT /terceirizada/requisicao
   ├── AuditSection.tsx         ──► GET  /gestor/third-parties, /gestor/audit-report
   ├── InviteGenerator.tsx      ──► GET  /gestor/team
   ├── MemberList.tsx           ──► GET  /gestor/team, PUT /gestor/team/:id, DELETE /gestor/team/:id
   └── ManualRegisterForm.tsx   ──► POST /gestor/register-internal

3. VIA FETCH NATIVO (com injeção manual de getAuthToken()):
   ├── SuperAdminDashboard.tsx  ──► GET  /admin/tenants, /admin/stats, /admin/users, /admin/audit/:tenantId
   │                            ──► POST /admin/tenants, /admin/extract-branding
   │                            ──► PUT  /admin/tenants/:id
   ├── PortariaDashboard.tsx    ──► GET  /portaria/approved, /portaria/audit/:id
   │                            ──► POST /portaria/check-in, /portaria/check-out, /portaria/discrepancy
   ├── RegisterTerceirizada.tsx ──► POST /auth/register
   ├── RegisterInternal.tsx     ──► POST /auth/register
   └── RegisterGestor.tsx       ──► GET  /auth/invitation/:token
                                ──► POST /auth/register-gestor

4. VIA CLIENTE SUPABASE (@supabase/supabase-js):
   ├── AuthContext.tsx          ──► Supabase Auth (.getSession, .signInWithPassword, .signOut, etc.)
   │                            ──► Supabase DB (.from('profiles'), .from('tenants'))
   ├── DashboardContext.tsx     ──► Supabase Realtime (.channel.on('postgres_changes', ...))
   ├── PortariaDashboard.tsx    ──► Supabase Realtime (.channel.on('postgres_changes', ...))
   ├── NovaSolicitacao.tsx      ──► Supabase Storage (.storage.from('material-images').upload / getPublicUrl)
   │                            ──► Supabase DB (.from('profiles').select)
   └── AdminSidebar.tsx         ──► Supabase DB (.from('profiles').select)
```

---

## 7. Inventário dos Hooks

### 7.1. Custom Hooks Identificados no Projeto
Existem apenas **3 Custom Hooks** em todo o código-fonte:
1. `useAuth()` (em `src/contexts/AuthContext.tsx`): Expõe sessão, perfil, token e ações de login/logout.
2. `useTenant()` (em `src/contexts/TenantContext.tsx`): Expõe dados da usina, cores e status de subdomínio.
3. `useDashboard()` (em `src/contexts/DashboardContext.tsx`): Expõe requisições, setores, materiais e mutações operacionais do gestor.

### 7.2. Lógicas Complexas Inlined em Componentes (Sem Hooks Dedicados)
* **SuperAdminDashboard.tsx**: 22 estados (`useState`), 3 efeitos (`useEffect`), controle manual de abas, paginação, scraper de branding por URL externa, e controle de cópia para clipboard.
* **PortariaDashboard.tsx**: 20 estados (`useState`), 4 efeitos (`useEffect`), relógio de 1s (`setInterval`), controle de streaming de câmera/webcam, checklist de múltiplos materiais e upload de imagens.
* **LiderDashboard.tsx**: 14 estados (`useState`), 4 efeitos (`useEffect`), gestão de abas e modais múltiplos com SweetAlerts.
* **InteractiveMap.tsx**: 18 estados (`useState`), 4 efeitos (`useEffect`), cálculos matemáticos para SVG drag-and-drop, resize por handles ('se' / 'sw'), cálculo de zoom com tecla Ctrl + roda do mouse (`wheel`), e expansão dinâmica das dimensões do mapa.
* **NovaSolicitacao.tsx**: 11 estados (`useState`), 5 efeitos (`useEffect`), manipulação dinâmica de array de materiais, upload assíncrono individual de fotos com preview em `URL.createObjectURL`, e detecção de hierarquia de setores pai/filho.
* **AuditTimeline.tsx**: 4 estados (`useState`), cálculo de filtros e paginação, e função de montagem imperativa de PDF em tabelas com formatação customizada.

---

## 8. Inventário de Utils / Lib / Configuração

| Item | Localização | Finalidade Atual |
| :--- | :--- | :--- |
| **masks.ts** | `src/utils/masks.ts` | 1. `maskCNPJ`: Formata string para `00.000.000/0000-00`.<br>2. `maskPhone`: Formata para fixo `(00) 0000-0000` ou celular `(00) 00000-0000`.<br>3. `validateEmail`: Valida formato de e-mail via expressão regular. |
| **subdomain.ts** | `src/utils/subdomain.ts` | 1. `getSubdomain`: Extrai o slug da usina do hostname (`*.localhost` ou domínio de prod) ou do primeiro path da URL.<br>2. `isAdminPath`: Verifica se o path inicia com `/admin`.<br>3. `getTokenKey` e `getAuthToken`: Lê o token da sessão em `sessionStorage` sob a chave `usinalins-auth-token-v1`. |
| **axios.ts** | `src/lib/axios.ts` | Instância do Axios com `baseURL` apontando para `VITE_API_URL` (padrão `http://localhost:3333/api`) e interceptor que verifica expiração do token Supabase e anexa `Authorization: Bearer <token>`. |
| **supabase.ts** | `src/lib/supabase.ts` | Instancia o `createClient` do Supabase com `sessionStorage` e chave de armazenamento global `usinalins-auth-global`. |
| **index.css** | `src/index.css` | Importa `@import "tailwindcss";`, define fontes Inter/Roboto/Outfit, classes utilitárias para scrollbars (`custom-scrollbar`, `scrollbar-hide`), e variáveis CSS padrão (`--primary-color: #00B5AD`, `--secondary-color: #1996DC`, `--navy-color: #001D4A`). |
| **vite.config.ts** | `vite.config.ts` | Configurações do Vite com plugins `@vitejs/plugin-react` e `@tailwindcss/vite`. |

---

## 9. Inventário de Rotas e Guards

### 9.1. Arquivo de Rotas
* **Responsável**: [MainRoutes.tsx](file:/Unitraack/frontend/src/routes/MainRoutes.tsx)

### 9.2. Mapeamento de Rotas

| Rota | Tipo | Elemento Renderizado | Guards / Wrappers |
| :--- | :--- | :--- | :--- |
| `/admin/login` | Pública | `<AdminLogin />` | Nenhum |
| `/login` | Pública / Subdomínio | `<Login />` | `<SubdomainOrNotFound>` |
| `/:tenantSlug/login` | Pública / Slug | `<Login />` | Nenhum |
| `/register-gestor` | Pública | `<RegisterGestor />` | Nenhum |
| `/:tenantSlug/register-gestor` | Pública | `<RegisterGestor />` | Nenhum |
| `/:tenantSlug/cadastro` | Pública | `<RegisterTerceirizada />` | Nenhum |
| `/:tenantSlug/registro-interno` | Pública | `<RegisterInternal />` | Nenhum |
| `/admin/painel` | Protegida | `<RoleDispatcher />` | `<ProtectedRoute>` |
| `/:tenantSlug/:role/painel` | Protegida | `<RoleDispatcher />` | `<ProtectedRoute>` |
| `/:tenantSlug/painel` | Protegida | `<RoleDispatcher />` | `<ProtectedRoute>` |
| `/painel` | Protegida | `<RoleDispatcher />` | `<SubdomainOrNotFound>`, `<ProtectedRoute>` |
| `/:tenantSlug/:role/painel/nova-solicitacao` | Protegida | `<NovaSolicitacao />` | `<ProtectedRoute>` |
| `/:tenantSlug/painel/nova-solicitacao` | Protegida | `<NovaSolicitacao />` | `<ProtectedRoute>` |
| `/painel/nova-solicitacao` | Protegida | `<NovaSolicitacao />` | `<SubdomainOrNotFound>`, `<ProtectedRoute>` |
| `/` | Redirecionamento | `<HomeRedirect />` | Nenhum |
| `*` | Fallback / 404 | `<HomeRedirect />` | Nenhum |

### 9.3. Guards e Redirecionamentos
1. **ProtectedRoute.tsx**:
   - Se `loading === true`: renderiza spinner.
   - Se `!user`: redireciona para `/admin/login` (se path for `/admin`) ou para `/:slug/login`.
   - Se `profile.role !== 'SUPER_ADMIN'` e tentar acessar `/admin`: redireciona para o painel da sua usina.
   - Se tentar acessar painel de outra usina (cross-tenant): redireciona para a usina do seu próprio perfil.
2. **SubdomainOrNotFound.tsx**: Bloqueia rotas sem subdomínio identificado, redirecionando para `/admin/login`.
3. **HomeRedirect.tsx**: Avalia se o usuário já possui sessão ativa e o encaminha para seu respectivo painel (`/:slug/:role/painel` ou `/admin/painel`), ou para `/admin/login` caso não autenticado.
4. **RoleDispatcher.tsx**: Avalia `profile.role` e despacha para:
   - `SUPER_ADMIN` ➔ `<SuperAdminDashboard />`
   - `GESTOR_SEGURANCA` ➔ `<DashboardProvider><GestorDashboard /></DashboardProvider>`
   - `LIDER_SETOR` ➔ `<DashboardProvider><LiderDashboard /></DashboardProvider>`
   - `PORTARIA` ➔ `<DashboardProvider><PortariaDashboard /></DashboardProvider>`
   - `TERCEIRIZADA` ➔ `<TerceirizadaDashboard />`

### 9.4. Fluxo de Navegação Observado

```text
                      Entrada de URL no Navegador
                                  │
                                  ▼
                   TenantContext (Extrai Slug / Cores)
                                  │
                                  ▼
                    AuthContext (Sessão & Perfil)
                                  │
                                  ▼
                              MainRoutes
                                  │
         ┌────────────────────────┴────────────────────────┐
         ▼                                                 ▼
   Rota Pública                                      Rota Protegida
   (Login / Cadastro)                                      │
                                                           ▼
                                                     ProtectedRoute
                                             (Checa Auth, Role e Tenant)
                                                           │
                                                           ▼
                                                    RoleDispatcher
                                             (Switch por Perfil de Usuário)
                                                           │
       ┌──────────────────┬────────────────┬───────────────┴───────────────┐
       ▼                  ▼                ▼                               ▼
  SuperAdmin           Gestor            Líder / Portaria            Terceirizada
  Dashboard          Dashboard         DashboardProvider              Dashboard
                 (DashboardProvider)           │
                                       ┌───────┴───────┐
                                       ▼               ▼
                                 LíderDashboard   PortariaDashboard
```

---

## 10. Integrações Externas

| Integração / Dependência | Versão (package.json) | Onde é Utilizada no Código | Impacto Arquitetural |
| :--- | :--- | :--- | :--- |
| **@supabase/supabase-js** | `^2.101.1` | `lib/supabase.ts`, `contexts/AuthContext.tsx`, `contexts/DashboardContext.tsx`, `features/auth/api/authService.ts`, `PortariaDashboard.tsx`, `NovaSolicitacao.tsx`, `AdminSidebar.tsx` | Gerencia autenticação central, escuta de canais Realtime e upload de imagens no Storage. |
| **axios** | `^1.14.0` | `lib/axios.ts`, `features/auth/api/tenantService.ts`, `features/requests/api/dashboardService.ts`, `LiderDashboard.tsx`, `TerceirizadaDashboard.tsx`, `SectorManagement.tsx`, `InteractiveMap.tsx`, `NovaSolicitacao.tsx`, `AuditSection.tsx`, `InviteGenerator.tsx`, `MemberList.tsx`, `ManualRegisterForm.tsx` | Cliente HTTP principal para comunicação com a API REST Express. |
| **react-router-dom** | `^7.14.0` | `App.tsx`, `routes/MainRoutes.tsx`, `guards/*`, `features/auth/components/RoleDispatcher.tsx`, páginas e componentes diversos | Gerenciamento de rotas SPA, parâmetros de URL, navegação imperativa (`useNavigate`) e localização (`useLocation`). |
| **sweetalert2** | `^11.26.24` | `LiderDashboard.tsx`, `PortariaDashboard.tsx`, `TerceirizadaDashboard.tsx` | Exibição de diálogos modais de confirmação, exclusão e alertas de erro/sucesso. |
| **recharts** | `^2.15.4` | `features/monitoring/components/ThirdPartiesReport.tsx` | Renderização de gráficos de barras (`BarChart`) e pizza (`PieChart`) com responsividade. |
| **jspdf** & **jspdf-autotable** | `^4.2.1` / `^5.0.7` | `features/requests/components/dashboard/audit/AuditTimeline.tsx`, `features/monitoring/components/ThirdPartiesReport.tsx` | Geração imperativa de relatórios de auditoria e métricas em arquivos PDF para download. |
| **html-to-image** | `^1.11.13` | `features/monitoring/components/ThirdPartiesReport.tsx` | Conversão de elementos DOM e gráficos em imagens PNG para inserção nos documentos PDF. |
| **lucide-react** | `^1.7.0` | Presente em praticamente todos os componentes e páginas | Biblioteca de ícones vetoriais. |
| **react-signature-canvas** | `^1.1.0-alpha.2` | `src/components/SignaturePad.tsx` | Canvas para captura de assinatura manuscrita *(atualmente sem uso ativo)*. |
| **API de Mídia (Navegador)** | Nativa (`getUserMedia`) | `src/components/WebcamModal.tsx`, `PortariaDashboard.tsx` | Acesso ao hardware de câmera para registro fotográfico de cargas e motoristas na portaria. |

---

## 11. Arquivos Críticos

A criticidade foi avaliada considerando volume de linhas, multiplicidade de estados/efeitos, chamadas de API inlined e impacto direto nos fluxos de negócio:

### Criticidade Alta:
1. [SuperAdminDashboard.tsx](file:/Unitraack/frontend/src/features/admin/pages/SuperAdminDashboard.tsx) (1.291 linhas): Ponto único de falha para a gestão de toda a plataforma SaaS e criação de usinas.
2. [PortariaDashboard.tsx](file:/Unitraack/frontend/src/features/requests/pages/PortariaDashboard.tsx) (1.218 linhas): Fluxo central da segurança operacional física (conferência de cargas, fotos e entrada).
3. [LiderDashboard.tsx](file:/Unitraack/frontend/src/features/requests/pages/LiderDashboard.tsx) (988 linhas): Fluxo de autorização de entrada e controle de inventário interno de setores.
4. [InteractiveMap.tsx](file:/Unitraack/frontend/src/features/monitoring/components/InteractiveMap.tsx) (750 linhas): Componente mais complexo matematicamente e visualmente na aplicação (Digital Twin).
5. [AuditTimeline.tsx](file:/Unitraack/frontend/src/features/requests/components/dashboard/audit/AuditTimeline.tsx) (685 linhas): Relatórios regulatórios e de conformidade de terceirizados.
6. [AuthContext.tsx](file:/Unitraack/frontend/src/contexts/AuthContext.tsx) (272 linhas): Base de segurança e persistência de sessão de todos os perfis.

### Criticidade Média:
1. [TerceirizadaDashboard.tsx](file:/Unitraack/frontend/src/features/requests/pages/TerceirizadaDashboard.tsx) (614 linhas): Acompanhamento e gestão de pedidos do parceiro externo.
2. [NovaSolicitacao.tsx](file:/Unitraack/frontend/src/features/requests/pages/Terceirizada/NovaSolicitacao.tsx) (595 linhas): Ponto de entrada de todas as solicitações no sistema.
3. [MonitoringDashboard.tsx](file:/Unitraack/frontend/src/features/monitoring/components/MonitoringDashboard.tsx) (418 linhas): Mapeamento de materiais por setor.
4. [PendingApprovals.tsx](file:/Unitraack/frontend/src/features/requests/components/dashboard/PendingApprovals.tsx) (330 linhas): Fila de autorizações operacionais.
5. [TransferModal.tsx](file:/Unitraack/frontend/src/features/requests/components/dashboard/TransferModal.tsx) (304 linhas): Movimentação entre setores.
6. [MemberList.tsx](file:/Unitraack/frontend/src/features/admin/components/dashboard/team/MemberList.tsx) (309 linhas): Gestão de acessos internos da usina.
7. [DashboardContext.tsx](file:/Unitraack/frontend/src/contexts/DashboardContext.tsx) (145 linhas): Orquestração de dados em tempo real.
8. [TenantContext.tsx](file:/Unitraack/frontend/src/contexts/TenantContext.tsx) (121 linhas): Identidade visual e multi-tenant.

### Criticidade Baixa:
1. [ThirdPartiesReport.tsx](file:/Unitraack/frontend/src/features/monitoring/components/ThirdPartiesReport.tsx) (247 linhas): Relatórios gerenciais de leitura.
2. [SectorManagement.tsx](file:/Unitraack/frontend/src/features/admin/components/dashboard/team/SectorManagement.tsx) (204 linhas): Cadastro de áreas físicas.
3. [InviteGenerator.tsx](file:/Unitraack/frontend/src/features/admin/components/dashboard/team/InviteGenerator.tsx) (158 linhas): Formatação de links de convite.
4. [ManualRegisterForm.tsx](file:/Unitraack/frontend/src/features/admin/components/dashboard/team/ManualRegisterForm.tsx) (236 linhas): Cadastro manual de colaboradores.
5. [RoleDispatcher.tsx](file:/Unitraack/frontend/src/features/auth/components/RoleDispatcher.tsx) (84 linhas): Despacho de rotas.
6. [Guards e Utils](file:/Unitraack/frontend/src/guards/) (`ProtectedRoute`, `masks`, `subdomain`): Estruturas compactas e com escopo delimitado.

---

## 12. Duplicações Aparentes

### 12.1. Função de Formatação de Data e Hora (`formatDateTime`)
* **Arquivos Envolvidos**:
  - `src/features/requests/pages/PortariaDashboard.tsx` (linhas 89-103)
  - `src/features/requests/pages/LiderDashboard.tsx` (linhas 152-166)
  - `src/features/requests/pages/TerceirizadaDashboard.tsx` (linhas 77-91)
  - `src/features/requests/components/dashboard/PendingApprovals.tsx` (linhas 34-47)
* **Evidência**: O bloco com tratamento de string ISO, injeção de `Z` para UTC e formatação com `toLocaleDateString('pt-BR')` e `toLocaleTimeString('pt-BR')` é idêntico nos 4 arquivos.

### 12.2. Componentes de Sidebar de Navegação
* **Arquivos Envolvidos**:
  - `src/features/requests/components/dashboard/DashboardSidebar.tsx`
  - `src/features/requests/components/dashboard/LiderSidebar.tsx`
* **Evidência**: Mesma largura (`w-72`), mesma cor de fundo (`bg-navy`), mesmo cabeçalho de usina, mesmo bloco de usuário/avatar, mesmo botão de logout e mesma função interna `NavButton`.

### 12.3. Telas de Cadastro e Autenticação com Split Screen
* **Arquivos Envolvidos**:
  - `src/features/auth/pages/RegisterTerceirizada.tsx`
  - `src/features/auth/pages/RegisterInternal.tsx`
  - `src/features/auth/pages/RegisterGestor.tsx`
  - `src/features/auth/pages/Login.tsx`
  - `src/features/auth/pages/AdminLogin.tsx`
* **Evidência**: Todos utilizam layout dividido (coluna esquerda com `ParticleBackground` e branding; coluna direita com card branco e formulário), além de implementarem internamente subcomponentes `InputGroup` e lógica de toggle de senha (`Eye`/`EyeOff`).

### 12.4. Resolução de Rota por Role
* **Arquivos Envolvidos**: `RoleDispatcher.tsx`, `HomeRedirect.tsx`, `ProtectedRoute.tsx`, `Login.tsx`, `TerceirizadaDashboard.tsx`, `NovaSolicitacao.tsx`
* **Evidência**: A conversão `profile.role?.toLowerCase().replace('_', '-')` e a montagem de caminhos `/${slug}/${rolePath}/painel` é repetida manualmente em cada um desses arquivos.

### 12.5. Geração de PDF via jsPDF
* **Arquivos Envolvidos**: `AuditTimeline.tsx` e `ThirdPartiesReport.tsx`
* **Evidência**: Ambos configuram instâncias manuais de `new jsPDF()`, definindo cabeçalhos com retângulos preenchidos (`setFillColor(0, 21, 64)`), fontes e coordenadas manuais.

---

## 13. Código Aparentemente Não Utilizado

| Item Identificado | Localização | Evidência Observada no Código |
| :--- | :--- | :--- |
| **AdminSidebar.tsx** | `src/features/requests/components/dashboard/AdminSidebar.tsx` | Não é importado nem renderizado em nenhum outro arquivo do projeto (busca global não retornou nenhuma referência). |
| **SignaturePad.tsx** | `src/components/SignaturePad.tsx` | A única importação existente estava em `NovaSolicitacao.tsx` (linha 22) e foi explicitamente comentada (`// Removida importação do SignaturePad`). |
| **Import de Axios não utilizado** | `src/features/monitoring/components/MonitoringDashboard.tsx` (linha 2) | O arquivo importa `axios from 'axios'`, mas consome exclusivamente o hook `useDashboard()`. |
| **Import de AuthContext vazio** | `src/features/monitoring/components/InteractiveMap.tsx` (linha 42) | Contém a desestruturação vazia `const { } = useAuth();`. |
| **Rota Redundante** | `src/routes/MainRoutes.tsx` (linhas 54-69) | A rota `/:tenantSlug/:role/painel` e a rota `/:tenantSlug/painel` apontam exatamente para o mesmo componente (`<ProtectedRoute><RoleDispatcher /></ProtectedRoute>`), e o próprio `RoleDispatcher` faz o redirecionamento interno. |

---

## 14. Dependências Entre Módulos

```text
                                  ┌───────────────────────────┐
                                  │      src/contexts/        │
                                  │(Auth, Tenant, Dashboard)  │
                                  └─────────────┬─────────────┘
                                                │
                       ┌────────────────────────┼────────────────────────┐
                       ▼                        ▼                        ▼
           ┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
           │   features/auth      │ │    features/admin    │ │ features/monitoring  │
           │  (Login, Registers,  │ │ (SuperAdminDashboard,│ │  (GestorDashboard,   │
           │   RoleDispatcher)    │ │   TeamManagement)    │ │ InteractiveMap, Rep) │
           └──────────┬───────────┘ └──────────┬───────────┘ └──────────┬───────────┘
                      │                        │                        │
                      │                        ▼                        │
                      │             Usado em GestorDashboard            │
                      │                        ▲                        │
                      └────────────────────────┼────────────────────────┘
                                               │
                                               ▼
                                  ┌───────────────────────────┐
                                  │    features/requests/     │
                                  │ (Líder, Portaria, Terc.,  │
                                  │  AuditSection, Sidebars)  │
                                  └───────────────────────────┘
```

### Relações Cruzadas Observadas no Código:
1. **`features/monitoring/pages/GestorDashboard.tsx` importa componentes de 3 features diferentes**:
   - De `features/admin`: `TeamManagement`
   - De `features/requests`: `DashboardSidebar`, `DashboardHeader`, `DashboardStats`, `PendingApprovals`, `AuditSection`, `MobileNav`
   - De `features/monitoring`: `MonitoringDashboard`, `InteractiveMap`, `ThirdPartiesReport`
2. **`features/admin/components/TeamManagement.tsx` depende de `DashboardContext`**:
   - Seus subcomponentes (`SectorManagement`, `MemberList`, `InviteGenerator`, `ManualRegisterForm`) consomem `useDashboard()` para obter a lista de setores da usina.
3. **`features/requests/` atua como agregador genérico**:
   - Contém arquivos específicos da Portaria (`PortariaDashboard`), do Líder (`LiderDashboard`, `LiderSidebar`), da Terceirizada (`TerceirizadaDashboard`, `NovaSolicitacao`) e do Gestor (`AuditSection`, `DashboardSidebar`, `PendingApprovals`).

---

## 15. Resumo Executivo do Inventário

1. **O que existe no projeto?**  
   Uma aplicação React 19/TypeScript com 52 arquivos, estruturada para atender 5 papéis de usuário distintos (SuperAdmin, Gestor, Líder, Portaria, Terceirizada) em arquitetura multi-tenant.
2. **Onde está cada coisa?**  
   - Infraestrutura e Contextos: `contexts/`, `guards/`, `lib/`, `routes/`, `utils/`
   - Painel Global: `features/admin/pages/SuperAdminDashboard.tsx`
   - Autenticação e Onboarding: `features/auth/`
   - Gestão da Usina e Digital Twin: `features/monitoring/` e `features/admin/components/`
   - Operações, Portaria e Solicitações: `features/requests/`
3. **Qual é a responsabilidade de cada parte?**  
   Conforme detalhado nas seções 1 a 5 deste documento.
4. **Como as partes dependem umas das outras?**  
   Existe forte acoplamento através do `RoleDispatcher` (que importa todos os 5 dashboards) e do `GestorDashboard` (que importa componentes espalhados entre `admin`, `monitoring` e `requests`).
5. **Quais são os arquivos mais críticos?**  
   `SuperAdminDashboard.tsx` (1.291 lns), `PortariaDashboard.tsx` (1.218 lns), `LiderDashboard.tsx` (988 lns), `InteractiveMap.tsx` (750 lns), `AuditTimeline.tsx` (685 lns) e `AuthContext.tsx` (272 lns).
6. **Onde existem duplicações?**  
   Formatação de datas (`formatDateTime`), estruturas de Sidebars (`DashboardSidebar` vs `LiderSidebar`), layouts visuais de cadastro e login, e montagem de rotas por role.
7. **Onde existem sinais de código morto?**  
   `AdminSidebar.tsx` e `SignaturePad.tsx`.
8. **Onde estão as integrações externas?**  
   Supabase (Auth, DB, Storage, Realtime), API Express REST, SweetAlert2, Recharts, jsPDF, html-to-image e API nativa de mídia/câmera.
