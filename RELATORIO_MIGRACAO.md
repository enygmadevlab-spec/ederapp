# 📋 RELATÓRIO EXECUTIVO DE MIGRAÇÃO
## Projeto Eder Martins Assessoria Náutica
### De Vite React → Next.js 16

---

## 🎯 SUMÁRIO EXECUTIVO

**Data:** 30 de dezembro de 2025  
**Status:** Análise de Arquitetura Completa  
**Escopo:** Identificação de funcionalidades, componentes e padrões para migração

---

## 1️⃣ ESTRUTURA ENCONTRADA NO PROJETO ANTIGO (Vite React)

### 📄 **PÁGINAS** (em `/pages`)

| Página | Arquivo | Finalidade | Status Atual |
|--------|---------|-----------|--------------|
| **Home** | `Home.tsx` | Landing page com slider de serviços, call-to-action | ✅ Parcialmente migrado |
| **Catálogo** | `ServiceCatalog.tsx` | Listagem de serviços com adição ao carrinho | ✅ Parcialmente migrado |
| **Login** | `Login.tsx` | Autenticação + Cadastro com Firebase | ✅ Migrado |
| **Checkout** | `Checkout.tsx` | Upload de documentos + Finalizar pedido | ⚠️ Incompleto |
| **Pagamento** | `Payment.tsx` | Pagamento Pix/WhatsApp/Cartão com QR Code | ❌ Não migrado |
| **Perfil** | `Profile.tsx` | Edição de dados do usuário | ❌ Não migrado |
| **Detalhe Pedido** | `OrderDetail.tsx` | Visualização de pedido específico | ❌ Não migrado |
| **Admin Settings** | `AdminSettings.tsx` | Configurações loja, templates de email/WhatsApp | ❌ Não migrado |
| **Admin Notificações** | `AdminNotifications.tsx` | Gerenciamento de notificações | ❌ Não migrado |
| **Dashboard Cliente** | `dashboards/ClientDashboard.tsx` | Histórico de pedidos, filtros, paginação | ❌ Não migrado |
| **Dashboard Admin** | `dashboards/AdminDashboard.tsx` | Gestão de todos os pedidos + promoção de usuários | ❌ Não migrado |
| **Dashboard Colaborador** | `dashboards/EmployeeDashboard.tsx` | Fila de análise de documentos | ❌ Não migrado |

---

### 🧩 **COMPONENTES** (em `/components`)

| Componente | Arquivo | Responsabilidade | Status |
|-----------|---------|------------------|--------|
| **Layout** | `Layout.tsx` | Header + Menu navegação + Mobile menu | ❌ Não migrado |
| **PaymentWidget** | `PaymentWidget.tsx` | Widget QR Code Pix + Links WhatsApp | ❌ Não migrado |
| **ErrorBoundary** | `ErrorBoundary.tsx` | Tratamento de erros de renderização | ❌ Não migrado |

---

### 🔌 **CONTEXTOS** (em `/context`)

| Contexto | Arquivo | Funcionalidades | Status |
|----------|---------|-----------------|--------|
| **AuthContext** | `AuthContext.tsx` | Autenticação Firebase, usuário logado, logout, atualizar perfil | ⚠️ Incompleto (falta updateProfile) |
| **CartContext** | `CartContext.tsx` | Carrinho, upload docs, criação de pedidos, atualizar status | ⚠️ Incompleto (falta payment methods) |

---

### 🛠️ **UTILITÁRIOS** (em `/utils`)

| Utilitário | Arquivo | Descrição | Status |
|-----------|---------|-----------|--------|
| **PIX** | `pix.ts` | Gerador de BR Code (EMV) para QR Code Pix | ❌ Não migrado |
| **CSV** | `csv.ts` | Export de pedidos para CSV | ❌ Não migrado |
| **Log** | `log.ts` | Sistema de logging de eventos | ❌ Não migrado |

---

### 📚 **TIPOS E DADOS** (em `/types.ts`)

| Tipo | Descrição | Completude |
|-----|-----------|-----------|
| `User` | Usuário com role (client/admin/employee), email, telefone, endereço | ⚠️ Incompleto (falta locale, phone, address) |
| `ServiceProduct` | Serviço disponível para venda | ✅ Completo |
| `CartItem` | Item no carrinho com arquivos locais | ✅ Completo |
| `OrderItem` | Item em pedido finalizado com URLs | ✅ Completo |
| `Order` | Pedido com status, pagamento, documentos | ⚠️ Incompleto (falta payment details) |
| `MOCK_SERVICES` | 5 serviços pré-definidos | ✅ Completo |

---

## 2️⃣ ESTRUTURA DO NOVO PROJETO (Next.js)

### ✅ **O QUE JÁ EXISTE**

#### Páginas App Router
- ✅ `src/app/page.tsx` - Home page (90% completa)
- ✅ `src/app/login/page.tsx` - Login/Cadastro (95% completo)
- ✅ `src/app/services/page.tsx` - Catálogo (95% completo)
- ✅ `src/app/checkout/page.tsx` - Checkout (50% completo - sem upload)
- ✅ `src/app/dashboard/` - Estrutura de pastas criada

#### Contextos
- ✅ `src/context/AuthContext.tsx` - Context com user/loading/logout
- ✅ `src/context/CartContext.tsx` - Context com cart operations

#### Componentes
- ✅ `src/components/Layout.tsx` - Header básico

#### Biblioteca
- ✅ `src/lib/firebase.ts` - Config Firebase

#### Tipos
- ✅ `src/types.ts` - Tipos base

---

## 3️⃣ ANÁLISE COMPARATIVA DETALHADA

### 🔴 **FUNCIONALIDADES QUE FALTAM NO NOVO PROJETO**

#### A. PÁGINAS FALTANTES
1. **Payment Page** - Pagamento Pix/WhatsApp/Cartão
   - Integração com QR Code Pix
   - Redirecionamento Stripe
   - Mensagem WhatsApp
   - Atualização de status de pagamento em tempo real

2. **Profile Page** - Perfil do usuário
   - Edição de dados pessoais
   - Endereço completo
   - Telefone
   - Preferência de idioma

3. **Order Detail Page** - Detalhe individual de pedido
   - Visualização de itens
   - Documentos com links
   - Timeline de status
   - Ação de retorno ao pagamento

4. **Admin Notifications Page** - Notificações para admin
   - Listagem de notificações
   - Retry de envios
   - Processamento em lote

5. **Admin Settings Page** - Configurações de loja
   - PIX Key
   - WhatsApp number
   - Nome da loja
   - Templates de email (pt-BR e en)
   - Histórico de alterações

6. **Client Dashboard** - Painel do cliente
   - Listagem de pedidos com filtros
   - Busca e paginação
   - Sorting (data, valor)
   - Status timeline
   - Abas: dashboard, pedidos, produtos, endereço, settings

7. **Admin Dashboard** - Painel do admin
   - Listagem completa de pedidos
   - Filtros avançados (status, data, cliente)
   - Export CSV
   - Gestão de usuários (promoção em lote)
   - Confirmação modal para ações

8. **Employee Dashboard** - Painel de colaborador
   - Fila de análise de documentos
   - Visualização de documentos
   - Aprovação/Rejeição em lote
   - Download de documentos

#### B. COMPONENTES FALTANTES
1. **PaymentWidget** - Widget de pagamento Pix
   - Geração de QR Code
   - Cópia de chave Pix
   - Instruções de pagamento
   - Links WhatsApp

2. **ErrorBoundary** - Tratamento de erros React

3. **ConfirmModal** - Modal de confirmação reutilizável
   - Título, mensagem
   - Callbacks de confirmação/cancelamento
   - Estilos glassmorphism

4. **Toast** - Notificações toast
   - Tipos: success, error, info, warning
   - Auto-dismiss
   - Stacked

5. **Layout** - Layout completo
   - Header com navegação
   - Menu mobile
   - Cart widget
   - Logout

#### C. CONTEXTOS INCOMPLETOS
1. **AuthContext**
   - ❌ Falta `updateProfile()` para editar dados do usuário
   - ❌ Falta `E2E_BYPASS_AUTH` para testes

2. **CartContext**
   - ❌ Falta `paymentMethod` ao criar pedido
   - ❌ Falta `payment` object completo em Order
   - ❌ Falta suporte a E2E tests (localStorage)
   - ❌ Falta `updateOrderStatus()` adequado
   - ❌ Falta persistência do carrinho (localStorage)

#### D. UTILITÁRIOS FALTANTES
1. **pix.ts** - Gerador de BR Code
   - CRC16-CCITT calculation
   - Payload EMV assembly
   - QR Code para Pix

2. **csv.ts** - Export CSV
   - ordersToCSV()
   - Escape de valores
   - Formatação

3. **log.ts** - Sistema de logging
   - logEvent()
   - Log de ações admin

4. **ConfirmModal** - Componente modal (está em `src/components/ConfirmModal.tsx` no antigo)

5. **Toast** - Sistema de notificações (está em `src/components/Toast.tsx` no antigo)

#### E. TIPOS INCOMPLETOS
1. **User**
   - ❌ Falta `locale?: string`
   - ❌ Falta `phone?: string`
   - ❌ Falta `address?: {...}`

2. **Order**
   - ❌ Falta `status: 'pending_payment' | 'paid'`
   - ❌ Falta `payment?: {...}` completo
   - ❌ Falta `createdAt` em payment

#### F. FUNCIONALIDADES AUSENTES
1. **Upload de documentos** - Incompleto no checkout
   - Validação de obrigatoriedade
   - Preview
   - Progresso de upload
   - Erro handling

2. **Pagamento**
   - Pix (QR Code + BR Code)
   - WhatsApp
   - Cartão (Stripe)
   - Manual

3. **Notificações**
   - Email com templates
   - WhatsApp com templates
   - Histórico
   - Retry automático

4. **Multi-idioma**
   - Suporte pt-BR/en
   - Templates localizados
   - Preferência do usuário

5. **E2E Testing**
   - Bypass de auth para testes
   - localStorage para dados
   - Fixtures

---

## 4️⃣ MAPEAMENTO DE MIGRAÇÕES REQUERIDAS

### 📝 **ARQUIVOS QUE PRECISAM SER CRIADOS**

```
src/
├── app/
│   ├── payment/
│   │   └── [id]/
│   │       └── page.tsx                    ← CRIAR
│   ├── profile/
│   │   └── page.tsx                         ← CRIAR
│   ├── order/
│   │   └── [id]/
│   │       └── page.tsx                    ← CRIAR
│   └── dashboard/
│       ├── client/
│       │   └── page.tsx                    ← CRIAR (refactor do antigo)
│       ├── admin/
│       │   ├── page.tsx                    ← CRIAR
│       │   ├── notifications/
│       │   │   └── page.tsx                ← CRIAR
│       │   └── settings/
│       │       └── page.tsx                ← CRIAR
│       └── employee/
│           └── page.tsx                    ← CRIAR
│
├── components/
│   ├── PaymentWidget.tsx                   ← CRIAR
│   ├── ErrorBoundary.tsx                   ← CRIAR
│   ├── ConfirmModal.tsx                    ← CRIAR
│   └── Toast.tsx                           ← CRIAR
│
├── context/
│   ├── AuthContext.tsx                     ← ATUALIZAR (add updateProfile)
│   └── CartContext.tsx                     ← ATUALIZAR (add payment method)
│
├── lib/
│   ├── firebase.ts                         ← OK
│   ├── pix.ts                              ← CRIAR
│   ├── csv.ts                              ← CRIAR
│   └── log.ts                              ← CRIAR
│
├── types.ts                                ← ATUALIZAR (add missing fields)
├── components/
│   └── Layout.tsx                          ← ATUALIZAR (completo)
└── app/
    ├── layout.tsx                          ← ATUALIZAR (add providers)
    ├── checkout/
    │   └── page.tsx                        ← ATUALIZAR (add file upload)
    └── globals.css                         ← VERIFICAR (tailwind classes)
```

---

## 5️⃣ MATRIZ DE PRIORIZAÇÃO

### 🔥 **CRÍTICO - BLOQUEIA O MVP**
- [ ] `PaymentWidget.tsx` - Widget de Pix
- [ ] `Payment Page` - Página de pagamento completa
- [ ] Atualizar `CartContext` com payment methods
- [ ] Upload de documentos no Checkout
- [ ] `ClientDashboard` - Histórico de pedidos
- [ ] Atualizar tipos `Order` e `User`
- [ ] `pix.ts` - Gerador BR Code
- [ ] `ErrorBoundary.tsx` - Tratamento de erros
- [ ] `Toast.tsx` - Sistema de notificações
- [ ] `Layout.tsx` completo

### ⚠️ **ALTA - IMPACTA EXPERIÊNCIA**
- [ ] `ConfirmModal.tsx` - Modal confirmação
- [ ] `Profile Page` - Edição de perfil
- [ ] `OrderDetail Page` - Detalhe do pedido
- [ ] `AdminDashboard` - Painel admin
- [ ] `EmployeeDashboard` - Painel colaborador
- [ ] `csv.ts` - Export de dados
- [ ] Atualizar `AuthContext` com updateProfile

### 📋 **MÉDIA - APRIMORAMENTOS**
- [ ] `AdminSettings` - Configurações
- [ ] `AdminNotifications` - Notificações admin
- [ ] `log.ts` - Sistema de logging
- [ ] Multi-idioma (pt-BR/en)
- [ ] E2E Testing support

### 🔔 **BAIXA - NICE-TO-HAVE**
- [ ] Animações avançadas
- [ ] Persistência localStorage carrinho
- [ ] Retry automático de notificações
- [ ] Analytics

---

## 6️⃣ CHECKLIST DE MIGRAÇÃO

### Fase 1: Fundação (Semana 1)
- [ ] Atualizar `types.ts` com todos os campos
- [ ] Criar `pix.ts` (gerador BR Code)
- [ ] Criar `csv.ts` (export CSV)
- [ ] Criar `log.ts` (logging)
- [ ] Criar `Toast.tsx` (notificações)
- [ ] Criar `ErrorBoundary.tsx` (error handling)
- [ ] Criar `ConfirmModal.tsx` (modal confirmação)
- [ ] Atualizar `AuthContext` com updateProfile()
- [ ] Atualizar `CartContext` com payment methods e E2E support
- [ ] Atualizar `Layout.tsx` com navegação completa

### Fase 2: Páginas Core (Semana 2-3)
- [ ] Criar `Payment Page` (/app/payment/[id]/page.tsx)
- [ ] Completar `Checkout` com upload de documentos
- [ ] Criar `Profile Page` (/app/profile/page.tsx)
- [ ] Criar `OrderDetail Page` (/app/order/[id]/page.tsx)
- [ ] Criar `ClientDashboard` (/app/dashboard/client/page.tsx)
- [ ] Integrar PaymentWidget em Payment Page

### Fase 3: Admin & Employee (Semana 4)
- [ ] Criar `AdminDashboard` (/app/dashboard/admin/page.tsx)
- [ ] Criar `AdminSettings` (/app/dashboard/admin/settings/page.tsx)
- [ ] Criar `AdminNotifications` (/app/dashboard/admin/notifications/page.tsx)
- [ ] Criar `EmployeeDashboard` (/app/dashboard/employee/page.tsx)
- [ ] Implementar gestão de usuários

### Fase 4: Polimento (Semana 5)
- [ ] Testes E2E
- [ ] Multi-idioma
- [ ] Otimizações performance
- [ ] Documentação
- [ ] Deploy e validação

---

## 7️⃣ DEPENDÊNCIAS E BIBLIOTECAS

### ✅ Já Instaladas
```json
{
  "firebase": "^12.7.0",
  "lucide-react": "^0.562.0",
  "next": "16.1.1",
  "react": "19.2.3",
  "react-dom": "19.2.3",
  "tailwindcss": "^4"
}
```

### ⚠️ Precisa Adicionar
```json
{
  "qrcode.react": "^4.2.0",     // Para QR Code Pix
  "lucide-react": "^0.562.0",   // Icons (já tem)
  "react-router-dom": "N/A",    // Não necessário (Next.js routing)
  "clsx": "^2.0.0",             // Conditional className
  "react-hot-toast": "^2.4.0"   // Toast alternativa (OPCIONAL)
}
```

---

## 8️⃣ NOTAS IMPORTANTES

### ⚡ Pontos de Atenção

1. **Rotas Dinâmicas**
   - Vite: `/payment/:id` com React Router
   - Next.js: `/payment/[id]` com App Router
   - **Ação**: Ajustar paths em navigation

2. **Contextos com "use client"**
   - AuthProvider e CartProvider precisam de `"use client"`
   - Verificar se layout.tsx é Client ou Server component

3. **Variáveis de Ambiente**
   - Vite: `import.meta.env.VITE_*`
   - Next.js: `process.env.NEXT_PUBLIC_*`
   - **Ação**: Converter todas as env vars

4. **Firebase Storage**
   - Caminho seguro: `users/{userId}/orders/{orderId}/{itemId}/{filename}`
   - Regras de segurança precisam permitir uploads de usuários autenticados

5. **E2E Testing**
   - Código antigo usa Playwright com localStorage
   - Precisa adaptar para Next.js (pode usar msw ou fixtures)

6. **Responsividade**
   - Projeto antigo usa TailwindCSS v3
   - Novo usa TailwindCSS v4
   - **Ação**: Testar breakpoints e classes

7. **Performance**
   - Next.js permite server components para data fetching
   - Considerar mover lógica de Firestore para server components

---

## 9️⃣ DIAGRAMA DE FLUXO

```
┌─────────────────────────────────────────────────────────┐
│                    HOME PAGE                             │
└─────────────┬───────────────────────────────┬────────────┘
              │                               │
              ▼                               ▼
        ┌──────────────┐            ┌──────────────┐
        │  SERVICES    │            │    LOGIN     │
        │  Catálogo    │            │  Auth/Signup │
        └──────┬───────┘            └──────┬───────┘
               │ (add to cart)             │ (authenticate)
               │                           │
        ┌──────▼───────────────────────────▼─────┐
        │         CHECKOUT                       │
        │  - Upload Documentos                   │
        │  - Revisar Pedido                      │
        │  - Finalizar                           │
        └──────┬────────────────────────────────┘
               │ (place order)
               │
        ┌──────▼──────────────────┐
        │   PAYMENT PAGE           │
        │  - Pix (QR Code)         │
        │  - WhatsApp              │
        │  - Cartão (Stripe)       │
        │  - Atualizar status      │
        └──────┬──────────────────┘
               │ (payment completed)
               │
        ┌──────▼────────────────────────────┐
        │    CLIENT DASHBOARD                │
        │  - Histórico de Pedidos            │
        │  - Filtros & Busca                 │
        │  - Detalhes do Pedido              │
        │  - Perfil                          │
        └────────────────────────────────────┘

    ADMIN:
        ├─ Dashboard (todos pedidos)
        ├─ Settings (PIX, WhatsApp, Templates)
        ├─ Notifications (retry, histórico)
        └─ Gestão de Usuários

    EMPLOYEE:
        └─ Fila de Análise (docs pendentes)
```

---

## 🔟 RESUMO EXECUTIVO FINAL

### ✅ **O QUE ESTÁ PRONTO**
- ✅ Home, Services, Login pages (95%+ completo)
- ✅ Auth context básico
- ✅ Cart context básico
- ✅ Firebase configuration
- ✅ Tipos base

### ⚠️ **O QUE PRECISA DE AJUSTES**
- ⚠️ Checkout (adicionar upload)
- ⚠️ AuthContext (adicionar updateProfile)
- ⚠️ CartContext (adicionar payment methods)
- ⚠️ Tipos (adicionar campos faltantes)
- ⚠️ Layout (completar navegação)

### ❌ **O QUE ESTÁ FALTANDO**
- ❌ 6 páginas de dashboard (client, admin, employee, payment, profile, order-detail)
- ❌ 3 páginas de admin (settings, notifications)
- ❌ 4 componentes (PaymentWidget, ConfirmModal, Toast, ErrorBoundary)
- ❌ 3 utilitários (pix.ts, csv.ts, log.ts)
- ❌ Funcionalidades: upload de docs, pagamento Pix, notificações, multi-idioma

### 📊 **ESTIMATIVA DE ESFORÇO**
- **Fase 1 (Fundação)**: 2-3 dias (componentes base + contextos)
- **Fase 2 (Pages Core)**: 5-7 dias (payment, checkout, dashboards básicos)
- **Fase 3 (Admin)**: 5-7 dias (admin dashboards + funcionalidades)
- **Fase 4 (Polish)**: 3-5 dias (testes, otimizações, docs)

**Total Estimado: 3-4 semanas para MVP completo**

---

## 📞 PRÓXIMAS AÇÕES

1. **Validação**: Confirmar prioridades e cronograma
2. **Setup**: Preparar ambiente com todas as dependências
3. **Início Fase 1**: Começar pela fundação (tipos, contextos, componentes)
4. **CI/CD**: Configurar testes e deploy
5. **Documentação**: Manter este documento atualizado

---

**Documento gerado em:** 30 de dezembro de 2025  
**Analista:** GitHub Copilot  
**Status:** ✅ Análise Concluída - Pronto para Desenvolvimento
