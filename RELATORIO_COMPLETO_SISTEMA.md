# 📋 Diagnóstico e Visão Geral Completa do Sistema — Unitraack

---

## 1. O que é o Projeto?
O **Unitraack** (também referenciado no código como **SaaS Portaria / UsinaLins**) é uma plataforma corporativa **SaaS Multi-Tenant** desenvolvida sob medida para a gestão, triagem, controle de acesso de portaria e rastreabilidade ponta a ponta de materiais, ferramentas e equipamentos em plantas industriais e agroindustriais (usinas de açúcar/álcool, energia e indústrias de grande porte).

O sistema resolve um dos principais gargalos de segurança patrimonial e logística interna de grandes complexos: **o descontrole na entrada, trânsito interno e saída de ferramentas e bens de terceiros (prestadores de serviços)**, prevenindo extravios, furtos e inconsistências na desmobilização.

---

## 2. O que o Sistema Faz? (Visão Geral de Fluxo)
O sistema digitaliza e audita o ciclo de vida completo de ferramentas e materiais que adentram a usina:

```
[ TERCEIRIZADA ] ➔ Cria Solicitação Prévia de Entrada (materiais, fotos, motorista, placa)
       │
       ▼
[ LÍDER DO SETOR ] ➔ Analisa e Aprova/Rejeita a Entrada para seu Setor
       │
       ▼
[ PORTARIA / GUARITA ] ➔ Realiza Check-in Físico (conferência, fotos, assinatura digital)
       │
       ▼
[ OPERAÇÃO / PÁTIO ] ➔ Movimentações, Transferências entre Setores e Mapa em Tempo Real
       │
       ▼
[ LÍDER DO SETOR ] ➔ Marca Itens Prontos para Desmobilização/Saída
       │
       ▼
[ PORTARIA / GUARITA ] ➔ Check-out Final (conferência de saída, assinatura e baixa definitiva)
       │
       ▼
[ GESTOR DE SEGURANÇA ] ➔ Monitoramento Global, Mapa 2D, Relatórios e Auditoria Total
```

---

## 3. Múltiplos Usuários e Níveis de Acesso (RBAC)
O sistema é **totalmente multi-usuário e multi-tenant** (isolando dados de diferentes usinas por subdomínio/slug e `tenant_id`). Conta com **5 perfis (Roles)** de acesso estritamente delimitados:

| Perfil | Nível de Acesso | Responsabilidades Principais |
| :--- | :--- | :--- |
| **`SUPER_ADMIN`** | Administrador Global | Gestão de usinas parceiras (tenants), criação de instâncias, envio de convites para gestores, métricas globais da plataforma SaaS. |
| **`GESTOR_SEGURANCA`** | Gestor da Usina | Visão executiva e tática da usina: mapa interativo 2D em tempo real, auditoria completa, relatórios de terceirizadas, cadastro da estrutura de setores e gestão de usuários/equipe interna. |
| **`LIDER_SETOR`** | Gestor de Área/Setor | Aprovação/recusa prévia de solicitações de entrada destinadas ao seu departamento, transferência de materiais entre setores internos, solicitação de saída de materiais. |
| **`PORTARIA`** | Operacional de Guarita | Validação física de entrada e saída, checagem item a item com fotos, coleta de assinatura eletrônica do motorista/portaria, cancelamento por inconformidade ou apontamento de divergências. |
| **`TERCEIRIZADA`** | Prestador de Serviço Externo | Cadastro prévio de solicitações de entrada de ferramentas com especificações técnicas e fotos, acompanhamento de status de aprovação e histórico de seus bens dentro da usina. |

---

## 4. Mapeamento de Funcionalidades por Módulo

O sistema é composto por **8 módulos centrais** e mais de **35 funcionalidades específicas**:

### 🏢 Módulo 1: Multi-Tenancy & Autenticação
1. Identificação dinâmica de usina via subdomínio (`usina-lins.unitraack.com`) ou rota de slug (`/:tenantSlug`).
2. Isolamento de dados no banco via Row Level Security (RLS) e middleware de Tenant.
3. Fluxo de convites com tokens únicos (`invitations`) para novos gestores.
4. Auto-cadastro de empresas terceirizadas vinculado à usina específica com geração de paleta de cores própria.
5. Cadastro de equipe interna (Portaria e Líderes de Setor) associado ao CNPJ/Unidade.
6. Redefinição de senhas e controle de ativação/desativação de contas de operadores.

### 📝 Módulo 2: Solicitações de Entrada (Terceirizadas)
7. Formulário rico de solicitação com seleção de setor de destino e data/hora prevista.
8. Inclusão dinâmica de múltiplos materiais por solicitação (nome, marca, modelo, número de série, estado de conservação, código interno).
9. Upload direto de fotos de cada item para conferência visual.
10. Dados do condutor: nome do motorista, placa do veículo e assinatura digital prévia.
11. Histórico de solicitações com filtros de status (*Pendente*, *Aprovada*, *Recusada*, *Em Trânsito*, *Concluída*).
12. Edição e cancelamento de solicitações antes da triagem da portaria.

### 🔍 Módulo 3: Triagem e Aprovação de Setor (Líderes)
13. Inbox de pendências exclusivo para o setor do líder autenticado.
14. Análise detalhada dos materiais solicitados com pré-visualização das fotos e especificações.
15. Ação de aprovação com justificativa ou rejeição justificada com registro no histórico.
16. Alerta visual de solicitações com divergências ou pendências de outros setores.

### 🚪 Módulo 4: Portaria e Guarita (Check-in & Check-out)
17. Painel de controle da portaria com visão de chegadas do dia.
18. Check-in de entrada: conferência física item a item com captura de fotos da carga/ferramentas.
19. Módulo de Assinatura Digital Touchscreen/Mouse para confirmação de entrega do motorista e conferência do porteiro.
20. Integração com câmera/webcam para captura de fotos de evidência em tempo real.
21. Apontamento de divergências (notificação automática para o Gestor de Segurança).
22. Cancelamento justificado de entrada diretamente pela portaria.
23. Check-out de saída definitivo ou parcial dos materiais autorizados com carimbo de tempo.

### 🔄 Módulo 5: Gestão Interna & Transferência Intersetorial
24. Visualização do inventário de materiais atualmente alocados em cada setor.
25. Transferência de custódia de materiais entre setores internos (com fluxo de solicitação e aceite/recusa pelo setor de destino).
26. Solicitação formal de saída/desmobilização de materiais pelo líder do setor.

### 🗺️ Módulo 6: Monitoramento em Tempo Real & Mapa Interativo 2D
27. Visualizador gráfico da planta da usina em SVG/Canvas interativo.
28. Modo Edição do Mapa: criação de setores, redimensionamento (resize handles), arrastar e soltar (drag-and-drop).
29. Alocação e movimentação espacial de materiais e equipamentos dentro dos setores do mapa.
30. Indicadores visuais de densidade de equipamentos por setor com codificação por cores da empresa proprietária.
31. Tooltips e modais detalhados com informações completas ao clicar em setores ou materiais.

### 📊 Módulo 7: Auditoria, Métricas e Relatórios (Gestão)
32. **Audit Trail Completo**: registro de todas as ações (quem aprovou, quem fez check-in, quem transferiu, data/hora e assinaturas).
33. Relatório analítico de terceirizadas: volume de equipamentos retidos vs. devolvidos por empresa parceira.
34. Exportação de relatórios em PDF com tabelas estruturadas e assinaturas (via jsPDF/AutoTable).
35. Dashboard com cards de KPIs operacionais (total no pátio, pendências de saída, transferências ativas).

### ⚙️ Módulo 8: Painel Super Admin (Global)
36. Cadastro, edição e exclusão de Usinas (Tenants).
37. Geração de tokens de convite para administradores locais.
38. Estatísticas consolidadas da plataforma (total de usinas ativas, usuários e transações).

---

## 5. Arquitetura e Tecnologias Utilizadas

```
┌────────────────────────────────────────────────────────┐
│                   FRONTEND (SPA)                       │
│  React 19 + TypeScript + Vite + Tailwind CSS v4       │
│  React Router v7 + Lucide Icons + Recharts + jsPDF    │
│  Signature Canvas + Zustand / Context API             │
└───────────────────────────┬────────────────────────────┘
                            │ REST / JSON (Axios)
┌───────────────────────────▼────────────────────────────┐
│                   BACKEND API                          │
│  Node.js + Express 5 + TypeScript                      │
│  Domain-Driven Design (DDD) / Clean Architecture       │
│  Controllers ➔ Use Cases ➔ Repositories ➔ Services     │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│             BANCO DE DADOS & STORAGE                   │
│  PostgreSQL (Supabase) + Row Level Security (RLS)      │
│  Supabase Auth & Storage (Upload de Fotos)             │
└────────────────────────────────────────────────────────┘
```

---

## 6. Dificuldades e Desafios de Implementação

1. **Gestão de Estados dos Materiais Granulares**:
   - Uma mesma solicitação pode ter 10 ferramentas, das quais 6 entram no Setor A, 2 são transferidas para o Setor B e 2 já recebem baixa de saída. Manter o estado individual de cada item com consistência e sem quebra de integridade é uma complexidade alta.
2. **Multi-Tenancy e Isolamento de Dados**:
   - A configuração de políticas de RLS (Row Level Security) no PostgreSQL precisa ser precisa para impedir vazamento de dados entre usinas ou entre empresas terceirizadas concorrentes.
3. **Assinaturas Digitais e Evidências Fotográficas**:
   - Gerenciamento de uploads de imagens de alta resolução compactadas em tempo real na portaria (guarita frequentemente opera em redes móveis/instáveis em áreas agrícolas/industriais).
4. **Mapa Interativo com SVG Dinâmico**:
   - Manuseio de coordenadas cartesianas, matrizes de zoom/pan e persistência de layout customizado por tenant.
5. **Roteamento Dinâmico de Subdomínios**:
   - Tratamento de subdomínios em ambiente de desenvolvimento local (`localhost`) vs. produção (`*.unitraack.com`), exigindo fallback inteligente no frontend e backend.

---

## 7. Necessidade de Treinamento para Implementação

O sistema possui diferentes curvas de aprendizado dependendo do perfil:

| Perfil de Usuário | Necessidade de Treinamento | Duração Estimada | Foco do Treinamento |
| :--- | :--- | :--- | :--- |
| **Portaria (Porteiros/Vigilantes)** | **Baixa a Média** | 1 a 2 horas | Operação do tablet/computador da guarita, captura de fotos pela webcam, coleta de assinatura e registro de divergências. |
| **Terceirizadas (Fornecedores)** | **Muito Baixa** | 15 a 30 minutos (ou vídeo instrucional de 3 min) | Como criar a solicitação prévia de entrada antes de enviar o caminhão/equipe para a usina. |
| **Líderes de Setor** | **Baixa** | 30 a 45 minutos | Notificações de pendências, fluxo de aprovação rápida e solicitação de transferências/saídas. |
| **Gestores de Segurança** | **Média** | 2 a 3 horas | Desenho e configuração do layout dos setores no Mapa 2D, extração de relatórios de auditoria e gestão da equipe. |
| **Equipe de TI / DevOps** | **Média** | 2 a 4 horas | Provisionamento de banco no Supabase, configuração de DNS coringa (`*.dominio.com`), variáveis de ambiente e deploy dos containers Docker. |

---

## 8. Conclusão Executiva
O **Unitraack** é uma solução robusta, moderna e de alto valor agregado para o setor industrial. O código-fonte está estruturado seguindo boas práticas de arquitetura de software (DDD no backend e componentização modular no frontend), pronto para escalar no modelo SaaS com isolamento rigoroso por usina, auditoria jurídica por assinatura digital e controle patrimonial visual em tempo real.
