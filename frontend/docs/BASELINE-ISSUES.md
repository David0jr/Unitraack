# Baseline Issues

**Escopo:** exclusivamente `frontend/`, usando `frontend/docs/BASELINE-INVENTORY.md` e inspeção estática em 03 de setembro de 2026.  
**Fora de escopo:** backend, banco, RLS, Storage e autorização efetiva.  
**Status:** diagnóstico não modificante; nenhum arquivo de código foi alterado.

## 1. Resumo executivo

Os riscos do frontend concentram-se na distribuição de responsabilidades e no custo do estado global. O cliente mistura `fetch`, Axios direto e a instância `api`; envia token pelo interceptor e manualmente; e concentra regra de fluxo, integração e interface em páginas extensas.

O tenant é recarregado a cada rota interna. O dashboard recarrega todos os dados para cada evento Realtime e é montado também para papéis que não consomem o contexto. Há uso amplo de `any`, nenhuma suíte de testes no frontend e componentes aparentemente sem consumidor. Assuntos que dependem da configuração do Supabase são registrados somente como investigação.

## 2. Issues críticas

Nenhuma issue crítica foi registrada somente a partir do frontend. Autorização, isolamento de tenant e persistência dependem do backend e das políticas Supabase, que não integram este recorte.

## 3. Issues de alta prioridade

### [ISSUE-001] Dados do tenant são buscados novamente a cada navegação interna

**Categoria:** Contextos e gerenciamento de estado; Performance  
**Prioridade:** Alta

**Problema:** `TenantContext` chama `tenantService.getTenantInfo(slug)` sempre que `location.pathname` muda, mesmo que o slug continue o mesmo.

**Evidência:** `frontend/src/contexts/TenantContext.tsx`, efeito com dependências `[slug, location.pathname]`; `frontend/src/routes/MainRoutes.tsx`; `frontend/src/features/auth/components/RoleDispatcher.tsx`.

**Impacto:** Navegar pela mesma unidade produz requisições e atualizações de estado/cores redundantes, podendo causar efeitos transitórios e custo de rede adicional.

**Confiança:** Alta

---

### [ISSUE-002] Realtime recarrega o conjunto inteiro de dados a cada evento operacional

**Categoria:** Contextos e gerenciamento de estado; Performance  
**Prioridade:** Alta

**Problema:** `DashboardContext` escuta três tabelas e, para cada evento, chama `fetchData`, que inicia duas requisições para reconstruir requests, setores, materiais, movimentos e estatísticas. Não há debounce, coalescência ou cancelamento de requisições anteriores.

**Evidência:** `frontend/src/contexts/DashboardContext.tsx`, `fetchData` e canal `gestor_dashboard_changes`.

**Impacto:** Uma sequência de atualizações de materiais pode gerar várias cargas completas e renderizações consecutivas, reduzindo responsividade em operações intensas.

**Confiança:** Alta

---

### [ISSUE-003] DashboardProvider executa consultas e Realtime para Líder e Portaria sem consumidores

**Categoria:** Contextos e gerenciamento de estado; Performance  
**Prioridade:** Alta

**Problema:** `RoleDispatcher` monta `DashboardProvider` para `LiderDashboard` e `PortariaDashboard`. A busca estática de `useDashboard` não encontra consumidores nessas páginas; ambas fazem suas próprias consultas. Ainda assim, o provider executa `fetchData` e abre a assinatura Realtime.

**Evidência:** `frontend/src/features/auth/components/RoleDispatcher.tsx`; `frontend/src/contexts/DashboardContext.tsx`; consumidores de `useDashboard` estão no painel de Gestor, monitoramento e equipe.

**Impacto:** Esses perfis mantêm tráfego, estado e listeners que não alimentam sua UI, tornando o fluxo de dados mais caro e difícil de acompanhar.

**Confiança:** Alta

---

### [ISSUE-004] Sessão e token possuem fontes concorrentes no cliente

**Categoria:** API e comunicação com backend; Contextos e gerenciamento de estado  
**Prioridade:** Alta

**Problema:** O token é mantido pelo Supabase, copiado por `AuthContext` para `sessionStorage`, obtido novamente pelo interceptor Axios e enviado manualmente por componentes via `getAuthToken()`. No logout, o contexto executa `sessionStorage.clear()`, removendo também dados não relacionados à sessão, como cache de tenant.

**Evidência:** `frontend/src/lib/{supabase,axios}.ts`; `frontend/src/contexts/AuthContext.tsx`; `frontend/src/utils/subdomain.ts`; dashboards, `NovaSolicitacao`, SuperAdmin e componentes de equipe.

**Impacto:** Fontes locais podem divergir em renovação/expiração de sessão, o que dificulta diagnóstico de falhas autenticadas. A limpeza global também força recarga de informações de tenant.

**Confiança:** Alta

---

### [ISSUE-005] NovaSolicitacao executa consulta direta de perfil cujo resultado é descartado

**Categoria:** Performance; Código aparentemente não utilizado  
**Prioridade:** Alta

**Problema:** Ao montar ou trocar `user`, a página consulta `profiles` pelo usuário atual. A resposta não altera estado nem participa de decisões; somente erros são registrados. A página já recebe `profile` de `AuthContext`.

**Evidência:** `frontend/src/features/requests/pages/Terceirizada/NovaSolicitacao.tsx`, linhas 79–82 e função `fetchProfile`, linhas 118–129.

**Impacto:** Cada abertura acrescenta uma consulta sem efeito observável e introduz duas fontes conceituais para o perfil.

**Confiança:** Alta

---

## 4. Issues de média prioridade

### [ISSUE-006] Comunicação HTTP, cabeçalhos e tratamento de erro são distribuídos e inconsistentes

**Categoria:** API e comunicação com backend; Arquitetura e responsabilidades  
**Prioridade:** Média

**Problema:** O frontend combina `fetch`, Axios direto e a instância `api`. Parte das chamadas constrói URL, cabeçalho e token na tela; outra usa interceptor. O tratamento alterna entre `response.ok`, exceções Axios, `console.error`, alertas e mensagens locais.

**Evidência:** `frontend/src/lib/axios.ts`; `frontend/src/features/admin/pages/SuperAdminDashboard.tsx`; dashboards de requests; `NovaSolicitacao.tsx`; `features/admin/components/dashboard/team/`.

**Impacto:** Alterações de URL, autenticação ou formato de erro precisam ser rastreadas em muitos locais, e fluxos similares podem ter comportamento de erro diferente.

**Confiança:** Alta

---

### [ISSUE-007] Telas centrais acumulam interface, integração, estado e regra de fluxo

**Categoria:** Arquitetura e responsabilidades; Complexidade e manutenibilidade; Testabilidade  
**Prioridade:** Média

**Problema:** Páginas extensas combinam modais, estado operacional, montagem de payload, integração HTTP/Supabase, navegação e JSX. O problema não é tamanho isolado, mas responsabilidades que evoluem independentemente no mesmo módulo.

**Evidência:** `frontend/src/features/admin/pages/SuperAdminDashboard.tsx` (1.374 linhas), `features/requests/pages/PortariaDashboard.tsx` (1.294), `LiderDashboard.tsx` (1.041), `TerceirizadaDashboard.tsx` (645) e `Terceirizada/NovaSolicitacao.tsx` (649).

**Impacto:** Fluxos ficam acoplados ao DOM e aos efeitos da página, dificultando teste isolado, revisão e mudança localizada.

**Confiança:** Alta

---

### [ISSUE-008] Tipagem permissiva reduz garantias sobre dados de sessão e operação

**Categoria:** Tipagem e TypeScript  
**Prioridade:** Média

**Problema:** Há 161 ocorrências de `any` em `frontend/src`, incluindo perfil autenticado, estado do dashboard, payloads e erros. `noUnusedLocals` e `noUnusedParameters` também estão desabilitados.

**Evidência:** `frontend/src/contexts/{AuthContext,DashboardContext}.tsx`; `frontend/src/features/requests/pages/Terceirizada/NovaSolicitacao.tsx`; `frontend/tsconfig.app.json`.

**Impacto:** Formatos incorretos de tenant, role, status e respostas podem chegar a runtime sem alerta estático. Código e imports não utilizados não são apontados pela compilação.

**Confiança:** Alta

---

### [ISSUE-009] Regras de rota e composição de caminhos por role/tenant estão repetidas

**Categoria:** Acoplamento e dependências; Rotas, autenticação e multi-tenancy  
**Prioridade:** Média

**Problema:** O destino do usuário é decidido em `MainRoutes`, guards, `RoleDispatcher`, Login e páginas de solicitação. A transformação de role em caminho e a escolha de slug do perfil ou URL aparecem em vários lugares.

**Evidência:** `frontend/src/routes/MainRoutes.tsx`; `frontend/src/guards/{ProtectedRoute,HomeRedirect,SubdomainOrNotFound}.tsx`; `RoleDispatcher.tsx`; `Login.tsx`; `TerceirizadaDashboard.tsx`; `NovaSolicitacao.tsx`.

**Impacto:** Mudanças de rota, role ou slug podem ser aplicadas parcialmente, levando a redirecionamentos divergentes ou loops difíceis de reproduzir.

**Confiança:** Alta

---

### [ISSUE-010] Não há testes automatizados configurados para o frontend

**Categoria:** Testabilidade  
**Prioridade:** Média

**Problema:** Não foram encontrados arquivos `*.test.*` ou `*.spec.*` em `frontend/`, e `frontend/package.json` não contém script de teste.

**Evidência:** `frontend/package.json`; busca de arquivos de teste no diretório `frontend/`.

**Impacto:** Tenant, sessão, navegação, estados de dashboard e formulários dependem de validação manual, elevando risco de regressão.

**Confiança:** Alta

---

### [ISSUE-011] Upload e URL pública de imagens estão acoplados à página de solicitação

**Categoria:** Arquitetura e responsabilidades; Testabilidade  
**Prioridade:** Média

**Problema:** `NovaSolicitacao` controla preview local, upload direto ao Supabase Storage, geração de URL pública, estado de upload, montagem de materiais e submissão da solicitação no mesmo componente.

**Evidência:** `frontend/src/features/requests/pages/Terceirizada/NovaSolicitacao.tsx`, funções `handleFileUpload` e `handleSubmit`.

**Impacto:** Falhas de upload, submissão e interface compartilham o mesmo ciclo de estado, dificultando teste e manutenção do fluxo de entrada.

**Confiança:** Alta

---

## 5. Issues de baixa prioridade

### [ISSUE-012] Referências específicas à Lins permanecem em código multi-tenant

**Categoria:** Duplicação; Rotas, autenticação e multi-tenancy  
**Prioridade:** Baixa

**Problema:** Há chaves de armazenamento, textos e imagem remota associados a “Lins”/“usinalins” fora dos dados dinâmicos do tenant.

**Evidência:** `frontend/src/lib/supabase.ts` (`usinalins-auth-global`); `frontend/src/utils/subdomain.ts` (`usinalins-auth-token-v1`); `NovaSolicitacao.tsx` (logo e textos Lins).

**Impacto:** Novos tenants podem receber identidade ou terminologia da instalação original. Não há evidência de falha funcional atual para o tenant configurado.

**Confiança:** Alta

---

### [ISSUE-013] Timers de feedback não possuem limpeza no desmontar de páginas

**Categoria:** Complexidade e manutenibilidade  
**Prioridade:** Baixa

**Problema:** Páginas de cadastro e solicitação usam `setTimeout` para navegar após sucesso, sem manter/limpar o identificador quando o componente desmonta.

**Evidência:** `frontend/src/features/auth/pages/{RegisterGestor,RegisterInternal,RegisterTerceirizada}.tsx`; `frontend/src/features/requests/pages/Terceirizada/NovaSolicitacao.tsx`.

**Impacto:** Caso o usuário navegue antes do prazo, um callback pendente pode alterar a sequência de telas posteriormente.

**Confiança:** Média

---

## 6. Duplicações

| Duplicação | Onde aparece | Tipo e impacto |
|---|---|---|
| `Authorization: Bearer` com `getAuthToken()` | Dashboards, SuperAdmin, NovaSolicitacao, auditoria e equipe | Regra repetida apesar do interceptor Axios. |
| Chamadas HTTP e parse de resposta em componentes | SuperAdmin, Portaria, cadastros, NovaSolicitacao e equipe | Integração de API dispersa pela apresentação. |
| Composição de rota por `slug` + `rolePath` | Login, RoleDispatcher, HomeRedirect, ProtectedRoute e páginas de terceirizada | Regra de navegação multi-tenant repetida. |
| Feedback de formulário | RegisterGestor, RegisterInternal, RegisterTerceirizada e NovaSolicitacao | Loading, erro, sucesso e redirecionamento semelhantes, com implementações próprias. |
| Exportação PDF | `ThirdPartiesReport.tsx` e `AuditTimeline.tsx` | Implementações imperativas independentes de relatório. |

## 7. Código aparentemente não utilizado

| Item | Evidência | Confiança |
|---|---|---|
| `frontend/src/components/SignaturePad.tsx` | Fora do arquivo, a busca retorna apenas comentário de remoção em `NovaSolicitacao.tsx`. | Alta |
| `frontend/src/features/requests/components/dashboard/AdminSidebar.tsx` | A busca fora da definição não retorna consumidores. | Alta |
| `fetchProfile` em `NovaSolicitacao` | A consulta é executada, mas o resultado é descartado. | Alta |

## 8. Pontos que precisam de investigação

1. **Isolamento de Realtime:** o cliente não inclui filtro de tenant nas assinaturas. Deve-se verificar políticas Supabase Realtime/RLS para confirmar se eventos de outros tenants chegam ao navegador.
2. **Supabase Storage:** a tela gera URLs públicas para `material-images`, e o caminho não inclui tenant. É preciso validar políticas, visibilidade do bucket e possibilidade de colisão/acesso entre tenants.
3. **Validade de endpoints:** caminhos de API são definidos diretamente em componentes e em `dashboardService`; a compatibilidade efetiva depende do backend, fora deste escopo.
4. **Mapa e relatórios:** `InteractiveMap`, `AuditTimeline` e `ThirdPartiesReport` manipulam SVG, dados e PDF no cliente. É necessário medir com volume real para confirmar gargalos.

## 9. Mapa de riscos

| ID | Área | Problema | Impacto | Prioridade | Confiança |
|---|---|---|---|---|---|
| ISSUE-001 | TenantContext | Busca por navegação interna | Chamadas redundantes | Alta | Alta |
| ISSUE-002 | DashboardContext | Recarga integral por evento | Carga e renderização excessivas | Alta | Alta |
| ISSUE-003 | Contexto | Provider sem consumo em dois papéis | Tráfego/listeners desnecessários | Alta | Alta |
| ISSUE-004 | Sessão/API | Fontes concorrentes de token | Falhas difíceis de manter | Alta | Alta |
| ISSUE-005 | NovaSolicitacao | Consulta de perfil descartada | Requisição sem efeito | Alta | Alta |
| ISSUE-006 | HTTP | Clientes/cabeçalhos/erros inconsistentes | Manutenção e UX divergentes | Média | Alta |
| ISSUE-007 | Páginas | Responsabilidades concentradas | Teste e evolução difíceis | Média | Alta |
| ISSUE-008 | TypeScript | `any` extensivo | Menor segurança estática | Média | Alta |
| ISSUE-009 | Rotas | Regras repetidas | Redirecionamentos inconsistentes | Média | Alta |
| ISSUE-010 | Testes | Sem suíte automatizada | Regressões | Média | Alta |
| ISSUE-011 | Solicitações | Upload e submit acoplados | Fluxo difícil de testar | Média | Alta |
| ISSUE-012 | Multi-tenancy | Referências fixas à Lins | Identidade inconsistente | Baixa | Alta |
| ISSUE-013 | Feedback | Timers sem cleanup | Navegação inesperada | Baixa | Média |

## 10. Conclusão

No frontend, os principais riscos são trabalho redundante de rede/estado, integração HTTP dispersa, páginas com responsabilidades misturadas e ausência de testes automatizados. Esta análise não atribui ao cliente problemas de autorização ou isolamento de dados sem validar backend e políticas Supabase; esses pontos ficam explicitamente como investigação.
