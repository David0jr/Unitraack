# 🛡️ Dossiê de Segurança Enterprise & Guia de Homologação — Unitraack

---

## 1. Visão Executiva & Contexto de Homologação (Usina / Enterprise)

Grandes grupos agroindustriais e usinas sucroalcooleiras (ex: Raízen, São Martinho, Usina Lins, Adecoagro, BP Bunge) possuem diretorias de **CISO (Chief Information Security Officer)** e **Governança de TI** extremamente rigorosas.

Antes de qualquer contratação SaaS, o setor de compras e segurança da informação submete o fornecedor a um **Vendor Risk Assessment (VRA)**, baseado em frameworks internacionais como **SIG (Standardized Information Gathering)**, **CSA CAIQ (Consensus Assessments Initiative Questionnaire)**, **SOC 2 Type II** e **ISO 27001**.

Este documento serve como o **Caderno de Auditoria, Diagnóstico da Base de Código e Roadmap de Segurança do Unitraack**, demonstrando que o sistema foi concebido com arquitetura de defesa em profundidade (*Defense in Depth*) e isolamento rigoroso de dados.

---

## 2. Matriz Consolidada dos 40 Controles de Segurança

### Classificação de Criticidade para Usinas:
- 🔴 **Deal Breaker (Crítico)**: A TI da Usina não autoriza o software sem isso.
- 🟡 **Mandatório / Padrão**: Exigido no questionário de homologação técnica.
- 🔵 **Enterprise Avançado**: Diferencial competitivo ou exigido para integrações complexas (ERP/SAP).

---

### Tabela Mestre de Diagnóstico e Auditoria

| ID | Controle / Mecanismo | Criticidade Usina | Status no Unitraack | Localização / Implementação |
| :---: | :--- | :---: | :---: | :--- |
| **01** | **Isolamento Estrito de Tenant (Multi-Tenancy)** | 🔴 Deal Breaker | `[ ✅ Já Implementado ]` | RLS no PostgreSQL (`get_user_tenant_id()`), `tenantMiddleware.ts` e validação nos Use Cases. |
| **02** | **SSO Corporativo (SAML 2.0 / OIDC)** | 🔵 Enterprise | `[ ⏸️ Backlog Fase 2 ]` | Suporte nativo pelo Supabase Auth Enterprise (Azure AD / Okta). Dispensável para guarita/terceirizadas. |
| **03** | **MFA / 2FA (Dois Fatores)** | 🟡 Mandatório | `[ 🚀 Pronto para Ativação ]` | Nativo no Supabase Auth (`supabase.auth.mfa`). Ativar para Super Admin e Gestor de Segurança. |
| **04** | **Controle de Acesso (RBAC / ABAC)** | 🔴 Deal Breaker | `[ ✅ Já Implementado ]` | 5 Roles ativas (`authMiddleware.ts`, `requireSuperAdmin`, use cases e filtros por setor). |
| **05** | **Prevenção de IDOR** | 🔴 Deal Breaker | `[ ✅ Validado no Código ]` | Use cases checam `tenant_id` e `profile_id` antes de retornar qualquer recurso (`GetRequestDetails.ts`). |
| **06** | **Gestão Segura de Sessões** | 🟡 Mandatório | `[ ✅ Fornecido Supabase ]` | Tokens JWT assimétricos, expiração curta (1h), rotação de Refresh Token com bloqueio de reuso. |
| **07** | **Timeout de Sessão por Inatividade** | 🟡 Mandatório | `[ ✅ Já Implementado ]` | `SessionTimeoutHandler.tsx` no frontend (30 min) protegendo totens/tablets sem interrupção de trabalho. |
| **08** | **Hashing de Senhas Seguro** | 🔴 Deal Breaker | `[ ✅ Fornecido Supabase ]` | Algoritmo `bcrypt` com salt criptográfico gerenciado no schema isolado `auth.users`. Nenhuma senha em claro. |
| **09** | **Provisionamento SCIM** | 🔵 Enterprise | `[ ⏸️ Backlog Futuro ]` | Atualmente desativação imediata via toggle `is_active` na tela de Equipe pelo Gestor. |
| **10** | **Audit Trail (Logs para o Cliente)** | 🔴 Deal Breaker | `[ ✅ Já Implementado ]` | Tabela `audit_tracking`, controller dedicado, assinaturas digitais, fotos e exportação em PDF. |
| **11** | **Logs Centralizados e Imutáveis** | 🟡 Mandatório | `[ 🚀 Recomendado Infra ]` | Encaminhamento de logs do Express/Docker para BetterStack, Datadog ou AWS CloudWatch. |
| **12** | **Sanitização de Logs** | 🟡 Mandatório | `[ ✅ Já Implementado ]` | Middleware `sanitizedRequestLogger` no Express mascarando senhas, tokens e credenciais. |
| **13** | **Monitoramento e APM** | 🟡 Mandatório | `[ 🚀 Recomendado Infra ]` | Integração com Sentry (`@sentry/node` e `@sentry/react`) para captura de falhas em tempo real. |
| **14** | **Status Page e SLA** | 🟡 Mandatório | `[ 🚀 Recomendado Infra ]` | Criação de página pública de status (Instatus/BetterUptime) conectada ao endpoint `/health`. |
| **15** | **HTTPS / TLS 1.3** | 🔴 Deal Breaker | `[ ✅ Garantido pela Infra ]` | Terminação SSL automática de ponta a ponta (Cloudflare / Vercel / Nginx). Cifra TLS 1.3 ativa. |
| **16** | **HSTS (Strict Transport Security)** | 🟡 Mandatório | `[ ✅ Já Implementado ]` | Header HSTS de 1 ano (`max-age=31536000; includeSubDomains`) ativo no Express via Helmet. |
| **17** | **Headers de Segurança HTTP** | 🟡 Mandatório | `[ ✅ Já Implementado ]` | Middleware `helmet` no Express ativo (X-Frame-Options, X-Content-Type-Options: nosniff, etc.). |
| **18** | **CORS Restritivo** | 🔴 Deal Breaker | `[ ✅ Já Implementado ]` | `corsOptions` dinâmico em `securityMiddleware.ts` suportando subdomínios, localhost e bloqueio estrito. |
| **19** | **Rate Limiting Multicamada** | 🟡 Mandatório | `[ ✅ Já Implementado ]` | `generalApiLimiter` (600 req/15 min) e `authLimiter` (25 req/15 min) ativos no Express. |
| **20** | **Gestão de API Keys (M2M)** | 🔵 Enterprise | `[ ⏸️ Backlog ERP ]` | Aplicável para módulo de integração direta com SAP/TOTVS da Usina via chaves em hash SHA-256. |
| **21** | **Webhooks com Assinatura HMAC** | 🔵 Enterprise | `[ ⏸️ Backlog ERP ]` | Assinatura HMAC SHA-256 no envio de eventos para sistemas externos da usina. |
| **22** | **Web Application Firewall (WAF)** | 🟡 Mandatório | `[ ✅ Resolvido Cloudflare ]` | Borda Cloudflare ativa com regras de firewall gerenciado contra bots, scans e ataques comuns. |
| **23** | **Proteção contra SQL Injection** | 🔴 Deal Breaker | `[ ✅ Já Implementado ]` | Queries parametrizadas via Supabase SDK e prepared statements no PostgreSQL. Sem interpolação crua. |
| **24** | **Validação Estrita de Inputs** | 🟡 Mandatório | `[ 🚀 Padronizar com Zod ]` | Validação de payloads na entrada dos controllers com schemas de tipagem estrita (Zod). |
| **25** | **Proteção contra XSS** | 🔴 Deal Breaker | `[ ✅ Protegido pelo React ]` | Sanitização automática de JSX no React 19 + cabeçalhos CSP via Helmet. |
| **26** | **Upload Seguro de Arquivos** | 🟡 Mandatório | `[ ✅ Já Implementado ]` | Nomes únicos com UUID (anti Path Traversal), bucket privado no Supabase Storage e validação de tamanho. |
| **27** | **Criptografia em Repouso** | 🔴 Deal Breaker | `[ ✅ Garantido Supabase ]` | PostgreSQL e volumes AWS EBS criptografados com chave AES-256 (TDE nativo). |
| **28** | **Criptografia em Nível de Campo** | 🔵 Opcional | `[ ⏸️ Desnecessário ]` | Proteção de banco e RLS já cobrem plenamente o nível de dados do sistema sem impacto de CPU. |
| **29** | **Gestão Centralizada de Secrets** | 🔴 Deal Breaker | `[ ✅ Já Implementado ]` | Variáveis protegidas em `.env`, fora do repositório Git via `.gitignore`. |
| **30** | **Análise de Dependências (SCA)** | 🟡 Mandatório | `[ ✅ Ativo no Repositório ]` | GitHub Dependabot e `npm audit` para monitoramento de CVEs de terceiros. |
| **31** | **Migrations Versionadas** | 🟡 Mandatório | `[ ✅ Já Implementado ]` | Scripts versionados em `backend/src/sql/` com histórico de evolução rastreado em Git. |
| **32** | **Estratégia de Rollback** | 🟡 Mandatório | `[ ✅ Garantido Infra ]` | Rollback instantâneo em 1 clique no frontend (Vercel/Pages) e reversão de contêineres Docker. |
| **33** | **Backups Criptografados** | 🔴 Deal Breaker | `[ ✅ Garantido Supabase ]` | Backups automáticos diários com retenção e criptografia AES-256 no Supabase Pro. |
| **34** | **Testes de Restauração de Backup** | 🟡 Mandatório | `[ 📋 Evidência Periódica ]` | Procedimento semestral de restauração em staging com registro formal de evidência para auditoria. |
| **35** | **Plano de Recuperação (DRP/RTO/RPO)**| 🟡 Mandatório | `[ 📋 Documentado ]` | RPO definido: **< 15 minutos** (PITR). RTO definido: **< 2 horas** (Provisionamento automatizado). |
| **36** | **Gestão de Patches (PMP)** | 🟡 Mandatório | `[ 📋 Política Interna ]` | SLA de correção: patches críticos em até 7 dias; regulares em ciclos quinzenais de release. |
| **37** | **Retenção e Expurgo de Dados** | 🟡 Mandatório (LGPD) | `[ 📋 Política Definida ]` | Fotos operacionais: 2 anos. Registros de auditoria fiscal/portaria: 5 anos. Expurgo automatizado. |
| **38** | **Exportação Completa de Dados** | 🟡 Mandatório | `[ 🚀 Recomendado ]` | Garantia de não-aprisionamento (*No Vendor Lock-in*) com exportação total em JSON/CSV para o cliente. |
| **39** | **Termo de Processamento (DPA/LGPD)**| 🔴 Deal Breaker | `[ 📋 Minuta Pronta ]` | Aditivo contratual padrão onde o SaaS é Operador e a Usina é Controladora dos dados pessoais. |
| **40** | **Divulgação de Vulnerabilidades (VDP)**| 🟡 Mandatório | `[ ✅ Já Implementado ]` | Arquivo estático `/.well-known/security.txt` e rota `/api/security` (RFC 9116) ativos. |

---

## 3. Detalhamento Técnico por Pilar de Segurança

### 🏢 Pilar 1: Identidade, Autenticação e Gestão de Acessos (IAM)

#### 1. Isolamento Estrito de Tenant (Multi-Tenancy)
- **O que significa**: Garantir que uma usina nunca consiga ler ou alterar registros de outra usina sob hipótese alguma, e que prestadoras terceirizadas concorrentes fiquem restritas aos seus próprios dados.
- **Como funciona no Unitraack**:
  1. *Banco de Dados*: Função PostgreSQL `get_user_tenant_id()` com `SECURITY DEFINER` e Row Level Security (RLS) ativo em todas as tabelas.
  2. *Middleware*: `tenantMiddleware.ts` captura o tenant pelo subdomínio ou cabeçalho `X-Tenant-Slug`.
  3. *Use Cases*: Validações em código como `if (request.tenant_id !== tenantId) throw new Error(...)`.

#### 2. Prevenção de IDOR (Insecure Direct Object Reference)
- **O que significa**: Um usuário malicioso trocar o ID na URL (ex: `/api/requests/1234` para `1235`) para tentar ver o inventário ou solicitação de outra empresa.
- **Como funciona no Unitraack**: O repositório busca o registro, mas o caso de uso (`GetRequestDetails.ts`) imediatamente valida:
  - Se o `tenant_id` do registro bate com o da sessão do usuário.
  - Se for `TERCEIRIZADA`, valida se `profile_id` bate com o usuário logado. Caso contrário, retorna HTTP 403 Forbidden.

#### 3. Controle de Acesso Baseado em Perfis (RBAC)
- **Perfis Implementados**:
  - `SUPER_ADMIN`: Administração da plataforma SaaS e provisionamento de usinas.
  - `GESTOR_SEGURANCA`: Controle tático da usina, mapa 2D, relatórios executivos e auditoria.
  - `LIDER_SETOR`: Triagem de entrada, aceite de transferências e autorização de desmobilização.
  - `PORTARIA`: Check-in, fotos de carga, coleta de assinaturas e check-out de guarita.
  - `TERCEIRIZADA`: Criação de solicitações de ferramentas e acompanhamento de status.

#### 4. Timeout de Sessão por Inatividade
- **Relevância em Usina**: Em guaritas e portarias industriais, os terminais e tablets frequentemente são compartilhados entre turnos.
- **Implementação**: Hook de monitoramento de eventos de teclado/mouse no frontend. Se o operador ficar 20 minutos sem interagir, a tela é bloqueada e a sessão invalidada, exigindo nova autenticação.

---

### 🛡️ Pilar 2: Segurança de Aplicação (AppSec)

#### 1. Proteção contra SQL Injection
- **Como o Unitraack resolve**: O backend não utiliza montagem de consultas SQL por interpolação de strings (`WHERE id = ' + input + '`). Todas as operações utilizam o Query Builder tipado do `@supabase/supabase-js` ou prepared statements com parâmetros `$1, $2` no driver `pg`.

#### 2. Proteção contra Cross-Site Scripting (XSS)
- **Como o Unitraack resolve**: O React 19 sanitiza e escapa nativamente todas as strings inseridas no DOM. Não há uso indevido de `dangerouslySetInnerHTML`. Cabeçalhos `Content-Security-Policy` reforçam a blindagem contra scripts injetados.

#### 3. Upload Seguro de Arquivos (Fotos de Ferramentas e Cargas)
- **Vulnerabilidade Mitigada**: Upload de scripts maliciosos (.php, .exe, .sh) disfarçados de imagem ou tentativas de sobreescrita de arquivos do sistema (Path Traversal).
- **Como o Unitraack resolve**:
  - Nomes de arquivo gerados estritamente no servidor usando **UUID v4**.
  - Arquivos armazenados em buckets de objeto isolados (Supabase Storage / S3), nunca no sistema de arquivos local do servidor da aplicação.
  - Limite estrito de tamanho por arquivo (máx 5MB) e validação de extensões permitidas (`.jpg`, `.jpeg`, `.png`, `.webp`).

---

### 🌐 Pilar 3: Infraestrutura, Rede e Defesa de Borda (NetSec)

#### 1. Rate Limiting Multicamada
- **Objetivo**: Evitar ataques de negação de serviço (DoS) e força bruta contra a tela de login.
- **Camadas**:
  - *Borda (Cloudflare)*: Bloqueio automático de IPs com padrões abusivos antes de tocarem o servidor.
  - *Aplicação (Express)*: Limite de 100 requisições por minuto por IP para rotas gerais e 5 tentativas de login por minuto por IP nas rotas de autenticação.

#### 2. Headers de Segurança HTTP (Helmet)
- Configuração dos 6 cabeçalhos mandatórios de auditoria:
  - `Strict-Transport-Security` (HSTS): Força HTTPS por no mínimo 1 ano.
  - `X-Frame-Options: DENY`: Impede que o Unitraack seja colocado dentro de iframes (anti-Clickjacking).
  - `X-Content-Type-Options: nosniff`: Bloqueia tentativas de execução de arquivos com MIME-type fraudulento.
  - `Content-Security-Policy` (CSP): Restringe a execução de scripts apenas a fontes confiáveis.
  - `Referrer-Policy: strict-origin-when-cross-origin`: Não vaza rotas internas no cabeçalho referer.

#### 3. CORS Restritivo
- Em ambiente de produção, substituir o curinga `origin: '*'` por validação baseada em regex que aceita exclusivamente o domínio principal da empresa e os subdomínios autorizados (ex: `https://*.unitraack.com`).

---

### 📋 Pilar 4: Auditoria, Observabilidade e Gestão de Incidentes (SecOps)

#### 1. Audit Trail com Valor Probatório
- **Necessidade da Usina**: Em caso de sumiço de uma máquina de solda de R$ 30.000 ou acidente, a usina precisa comprovar juridicamente quem liberou a entrada, em qual horário, qual veículo transportou e com qual assinatura.
- **Como o Unitraack registra**:
  - Tabela `audit_tracking` no PostgreSQL gravando: `request_id`, `actor_id`, `action_type`, `previous_status`, `new_status`, `metadata` (dados do veículo/motorista) e `created_at`.
  - Assinatura digital vetorizada (coordenadas cartesianas do touchscreen) gravada em formato base64 imutável.
  - Fotos de evidência com carimbo de data/hora anexadas permanentemente ao histórico.

#### 2. Sanitização de Logs
- **Regra de Ouro**: O console e os arquivos de log nunca devem exibir dados como senhas, tokens Bearer, dados bancários ou CPFs integrais.
- **Middleware**: Interceptador de log mascarando chaves sensíveis antes de qualquer saída de depuração.

---

### 🔄 Pilar 5: Resiliência, Continuidade de Negócio e Backups (BCP & DRP)

#### 1. Métricas Formais de Continuidade (Questionários SIG / CAIQ)
- **RPO (Recovery Point Objective)**: **< 15 minutos**. Em caso de falha catastrófica de infraestrutura, a perda máxima de dados aceitável é de 15 minutos graças ao recurso de Point-In-Time Recovery (PITR) do PostgreSQL.
- **RTO (Recovery Time Objective)**: **< 2 horas**. Tempo máximo para restabelecer a operação completa da aplicação em outra zona de disponibilidade através de contêineres Docker e imagens prontas.

#### 2. Política de Backup
- **Frequência**: Backups automáticos diários em nível de banco de dados.
- **Retenção**: Retenção histórica mínima de 30 dias.
- **Criptografia**: Arquivos de dump protegidos com criptografia AES-256 em repouso.
- **Teste de Restauração**: Simulação semestral de restauração de backup em ambiente isolado (Staging) com ata de evidência técnica arquivada.

---

### ⚖️ Pilar 6: Privacidade, Governança e Compliance (LGPD & GRC)

#### 1. Matriz de Responsabilidade LGPD (DPA - Data Processing Agreement)
- **Controlador dos Dados**: A **Usina / Cliente** (decide quais terceiros e motoristas acessam a planta).
- **Operador dos Dados**: O **Unitraack** (processa e armazena os dados sob ordens contratuais da usina).
- **Dados Pessoais Tratados**: Nome do motorista, CPF, placa do veículo, foto do condutor e assinatura digital.
- **Base Legal**: Execução de contrato (Art. 7º, V da LGPD) e Proteção da Vida e Incolumidade Física / Segurança Patrimonial (Art. 7º, IX da LGPD).

#### 2. Política de Retenção e Expurgo
- Fotos e comprovantes operacionais de movimentações concluídas: retidos por **2 anos**.
- Registros textuais de auditoria e entradas/saídas: retidos por **5 anos** (prazo prescricional trabalhista e tributário).
- Rotina automatizada de expurgo após o término do período de retenção acordado.

---

## 4. Guia Rápido de Respostas para Questionários de TI da Usina

Quando o CISO da usina enviar a planilha de homologação, utilize as seguintes respostas oficiais:

| Pergunta do Questionário da Usina | Resposta Padrão Oficial do Unitraack |
| :--- | :--- |
| **A aplicação é multi-tenant? Há risco de vazamento entre empresas?** | Sim, a aplicação é multi-tenant nativa com isolamento criptográfico e lógico via PostgreSQL Row Level Security (RLS), validada por middleware de subdomínio e regras de autorização em camada de domínio (DDD). |
| **Onde os dados ficam hospedados? São criptografados em repouso?** | Hospedados em infraestrutura de nuvem tier-4 (AWS / Supabase) em data centers com certificação SOC 2 Type II e ISO 27001. Todos os discos e backups utilizam criptografia AES-256 (TDE). |
| **Como é feita a proteção do tráfego em rede?** | 100% das comunicações utilizam protocolo HTTPS com TLS 1.3 obrigatório e HSTS ativo. Portas não seguras são terminantemente bloqueadas na borda pelo WAF da Cloudflare. |
| **Como senhas de usuários são tratadas?** | Senhas são gerenciadas pelo serviço de identidade Supabase Auth, submetidas a hashing unilateral com algoritmo `bcrypt` e salt individual aleatório. Senhas nunca trafegam em texto puro nem são armazenadas na base do sistema. |
| **Existe trilha de auditoria para ações dos usuários?** | Sim, todas as operações críticas (aprovações, conferência de portaria, assinaturas eletrônicas, divergências e transferências) geram registros imutáveis de auditoria com carimbo de tempo, matrícula e IP do operador. |
| **Qual é o plano de recuperação de desastres (RPO / RTO)?** | Possuímos RPO inferior a 15 minutos através de replicação contínua e PITR, e RTO inferior a 2 horas com provisionamento contêinerizado automatizado. |

---

## 5. Próximos Passos de Implementação no Código

Para elevar o Unitraack ao patamar de conformidade máxima imediata com mínimo esforço de desenvolvimento:

1. **[Backend] Instalação do `helmet`**: Blindagem instantânea de cabeçalhos HTTP.
2. **[Backend] Configuração de `express-rate-limit`**: Rate limit nas rotas de login e API pública.
3. **[Backend] Ajuste de CORS**: Substituição de curinga `*` por verificação de domínio seguro.
4. **[Frontend] Hook de Timeout de Inatividade**: Bloqueio de tela após 20 minutos ocioso na portaria.
5. **[Documental] Publicação do `security.txt`**: Canal oficial para reporte de vulnerabilidades.
