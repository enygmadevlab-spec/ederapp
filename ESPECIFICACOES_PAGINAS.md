# 📄 ESPECIFICAÇÃO DAS PÁGINAS FALTANTES

## Documento Técnico Detalhado para Desenvolvimento

---

## 1️⃣ PAYMENT PAGE
### `/app/payment/[id]/page.tsx`

**Finalidade:** Exibir opções de pagamento e processar transação

**Props/Params:**
```tsx
- params: { id: string }  // Order ID
```

**Estados:**
```tsx
- order: Order | null
- loading: boolean
- paymentMethod: 'pix' | 'whatsapp' | 'card' | 'manual'
```

**Componentes Usados:**
- PaymentWidget (Pix QR Code)
- Lucide Icons (CheckCircle, Clock, AlertCircle)

**Fluxo:**
```
1. useParams() para obter order ID
2. Firestore onSnapshot para fetch order
3. Se order.payment.status === 'paid'
   → Redirect para /dashboard/client
4. Exibir PaymentWidget baseado em payment.method
5. Se Pix: Mostrar QR Code + instruções
6. Se WhatsApp: Link com mensagem pré-preenchida
7. Se Card: Botão Stripe redirect
8. Se Manual: Informação de contato
```

**Validações:**
- Order deve existir
- User deve ser dono da order

**Responsividades:**
```
Mobile (< 768px):
- PaymentWidget em coluna
- QR Code menor
- Botões full-width

Desktop (≥ 768px):
- PaymentWidget em 2 colunas (QR + Info)
- Botões inline
```

**Styling:**
```tsx
- glass-panel para cards
- gradient para CTAs
- animate-fade-in para entrada
- Blue/Cyan theme
```

---

## 2️⃣ PROFILE PAGE
### `/app/profile/page.tsx`

**Finalidade:** Editar perfil, endereço, preferências do usuário

**Estados:**
```tsx
- form: {
    name: string
    phone: string
    street: string
    number: string
    city: string
    state: string
    zip: string
  }
- locale: 'pt-BR' | 'en'
- saving: boolean
- message: string | null
```

**Estrutura do Formulário:**

**Seção 1: Informações Pessoais**
```
┌─────────────────────┬─────────────────────┐
│      Nome           │     Telefone        │
└─────────────────────┴─────────────────────┘
```

**Seção 2: Preferências**
```
┌─────────────────────┐
│  Idioma: pt-BR / en │
└─────────────────────┘
```

**Seção 3: Endereço**
```
┌──────────────┬──────────────┬──────────────┐
│     Rua      │   Número     │      CEP     │
└──────────────┴──────────────┴──────────────┘

┌──────────────────────┬──────────────────────┐
│      Cidade          │       Estado         │
└──────────────────────┴──────────────────────┘
```

**Lógica:**
```tsx
1. useAuth() para obter user
2. useEffect(() => {
     setForm({ 
       name, phone, 
       street, number, city, state, zip 
     })
   }, [user])
3. handleSave → updateProfile(patch)
4. Toast com sucesso/erro
```

**Validações:**
- Nome obrigatório
- Telefone formato (optional)
- CEP formato (optional)
- Locale válido

**Permissions:**
- Apenas usuário pode editar seu próprio perfil

---

## 3️⃣ ORDER DETAIL PAGE
### `/app/order/[id]/page.tsx`

**Finalidade:** Visualizar detalhes completos de um pedido

**Seções:**

### Header
```
Pedido #ABC12345 | 30/12/2025 10:30 | R$ 500.00
Status: [Pago] [Em Processamento] [Concluído]
```

### Timeline de Status
```
pending_docs  → Documentação
     ↓
pending_payment → Aguardando Pagamento
     ↓
processing → Em Processamento
     ↓
paid → Pago
     ↓
completed → Concluído
```

### Itens
```
┌────────────────────────────────────────────┐
│  Seguro DPEM                 R$ 150.00    │
│  3 documentos                              │
└────────────────────────────────────────────┘
```

### Documentos
```
┌──────────────────────┬──────┐
│  RG e CPF            │ Abrir│
│  Comprovante Endereço│ Abrir│
│  Doc Embarcação      │ Abrir│
└──────────────────────┴──────┘
```

### Ações
```
Se status === 'pending_payment':
  [Ir para Pagamento] [Voltar]
Senão:
  [Voltar ao Dashboard]
```

**Lógica:**
```tsx
1. useParams() para order ID
2. onSnapshot(doc) para realtime updates
3. statusLabel() helper para badges
4. Link para documentos (Firebase Storage URLs)
5. Botão dinâmico baseado em status
```

---

## 4️⃣ PROFILE PAGE
### `/app/profile/page.tsx`

*[Veja especificação acima - Seção 2️⃣]*

---

## 5️⃣ CLIENT DASHBOARD
### `/app/dashboard/client/page.tsx`

**Finalidade:** Histórico de pedidos, filtros, busca

**Layout:**

### Seção Superior
```
┌─────────────────────────────────────┐
│  Meus Pedidos                       │
│  Total: X pedidos | R$ X.XX total   │
└─────────────────────────────────────┘
```

### Filtros & Busca
```
┌──────────────┬──────────────┬──────────────┐
│  Status      │  Ordenar por │  Buscar      │
│ [Dropdown]   │ [Dropdown]   │ [Input]      │
└──────────────┴──────────────┴──────────────┘
```

**Filtro Status:**
- Todos
- Pendente Pagamento
- Em Processamento
- Concluído
- Pendência

**Ordenar por:**
- Mais recentes
- Mais antigos
- Maior valor
- Menor valor

### Tabela de Pedidos
```
┌────────┬────────────┬─────────┬──────────┬────────┐
│ Pedido │ Data       │ Itens   │ Total    │ Status │
├────────┼────────────┼─────────┼──────────┼────────┤
│ ABC123 │ 30/12/2025 │ 2 itens │ R$ 500  │ Pago   │
│ DEF456 │ 29/12/2025 │ 1 item  │ R$ 150  │ Pend.  │
└────────┴────────────┴─────────┴──────────┴────────┘
```

**Paginação:**
```
Página 1 de 5 | [< Anterior] [Próximo >]
Itens por página: 6
```

### Card de Pedido (Mobile)
```
┌─────────────────────────────────┐
│ #ABC123                  Pago   │
│ 30/12/2025 10:30                │
│ 2 itens | R$ 500.00             │
│ [Ver Detalhes]                  │
└─────────────────────────────────┘
```

**Lógica:**
```tsx
1. useAuth() para user
2. query(collection, where("userId"), orderBy("date", "desc"))
3. onSnapshot para realtime
4. filteredOrders = useMemo(
     () => filter + sort + search,
     [orders, statusFilter, sortBy, search]
   )
5. Paginação: pageOrders = filteredOrders.slice()
6. onClick → navigate(`/order/${id}`)
```

**Validações:**
- Apenas ver seus próprios pedidos
- Ao clicar em pedido, validar ownership

---

## 6️⃣ ADMIN DASHBOARD
### `/app/dashboard/admin/page.tsx`

**Finalidade:** Gestão total de pedidos e usuários

### Seção Superior
```
┌─────────────────────────────────────────────┐
│  Dashboard Admin                            │
│                                             │
│  Total Pedidos: 45   |  R$ 15.432,50        │
│  Pendentes: 8        |  Processando: 12     │
└─────────────────────────────────────────────┘
```

### Filtros
```
Status: [Dropdown]    De: [Date]  Até: [Date]
Buscar: [Input - Cliente/ID/Serviço]  [Search]
```

### Ações em Lote
```
┌──────────────────────┐
│ [ ] Marcar como... ▼ │
│ [ ] Export CSV       │
└──────────────────────┘
```

### Tabela de Pedidos
```
┌──┬────────┬────────────┬──────────┬──────────┬────────┬────────┐
│✓ │ Pedido │ Cliente    │ Data     │ Total    │ Status │ Ações  │
├──┼────────┼────────────┼──────────┼──────────┼────────┼────────┤
│ │ ABC123 │ João Silva │ 30/12    │ R$ 500  │ Pago   │ [...]  │
│ │ DEF456 │ Maria Ofc  │ 29/12    │ R$ 150  │ Pend.  │ [...]  │
└──┴────────┴────────────┴──────────┴──────────┴────────┴────────┘
```

### Menu de Ações (... por pedido)
```
- Ver Detalhes
- Marcar como Concluído
- Marcar como Rejeitado
- Reenviar Notificação
```

### Seção: Gestão de Usuários
```
┌─────────────────────────────────────┐
│  Usuários (Promoção para Admin)      │
│                                     │
│ [x] João Silva (client)  [Promover] │
│ [ ] Maria Ofc (client)   [Promover] │
│ [ ] Pedro Emp (employee) [Rebaixar] │
│                                     │
│ [Promover em lote] [Rebaixar]       │
└─────────────────────────────────────┘
```

**Lógica:**
```tsx
1. useAuth() para validar isAdmin
2. query(collection("orders"), orderBy("date", "desc"))
3. onSnapshot para realtime
4. Filtros: statusFilter, fromDate, toDate, clientQuery
5. Tabela com selection checkboxes
6. Bulk actions: updateRole() para cada user selecionado
7. CSV export: ordersToCSV(filteredOrders)
```

**Confirmações:**
- Promover usuário: ConfirmModal
- Rejeitar pedido: ConfirmModal
- Marcar concluído: ConfirmModal

---

## 7️⃣ ADMIN SETTINGS
### `/app/dashboard/admin/settings/page.tsx`

**Finalidade:** Configurar loja, templates, integração

### Seção 1: Dados da Loja
```
┌──────────────────────────────────┐
│ Nome da Loja:                    │
│ [________________________________]│
│                                  │
│ WhatsApp (5511999999999):        │
│ [________________________________]│
│                                  │
│ Chave PIX:                       │
│ [________________________________]│
│ Tipo: [Email/Phone/CPF] ▼        │
└──────────────────────────────────┘
```

### Seção 2: Templates de Notificação
```
Idioma: [pt-BR / en] ▼

┌──────────────────────────────────┐
│ Email                            │
│                                  │
│ Assunto:                         │
│ [________________________________]│
│                                  │
│ Conteúdo (Plain Text):           │
│ [                                ]│
│ [         LONG TEXTAREA          ]│
│ [                                ]│
│                                  │
│ Conteúdo (HTML):                 │
│ [                                ]│
│ [         LONG TEXTAREA          ]│
│ [                                ]│
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ WhatsApp                         │
│                                  │
│ Mensagem:                        │
│ [                                ]│
│ [         LONG TEXTAREA          ]│
│ [                                ]│
│                                  │
│ Placeholders disponíveis:        │
│ {{orderId}} {{userName}}         │
│ {{status}} {{total}} {{orderUrl}}│
└──────────────────────────────────┘
```

### Preview
```
┌──────────────────────────────────────┐
│ Preview do Template                  │
│                                      │
│ Assunto: Seu pedido #ABC12345        │
│                                      │
│ Olá João Silva,                      │
│ Seu pedido foi processado com sucesso│
│ Status: Pago                         │
│ Total: R$ 500.00                     │
│                                      │
│ Acesse: https://...                  │
└──────────────────────────────────────┘
```

### Histórico
```
┌────────────────┬──────────┬────────────┐
│ Data           │ Autor    │ Ação       │
├────────────────┼──────────┼────────────┤
│ 30/12 10:30    │ Admin    │ [Restaurar]│
│ 29/12 14:45    │ Admin    │ [Restaurar]│
└────────────────┴──────────┴────────────┘
```

**Botões:**
```
[Salvar Alterações] [Cancelar]
```

**Lógica:**
```tsx
1. useAuth() para validar isAdmin
2. getDoc(doc(db, 'settings', 'store'))
3. getDoc(doc(db, 'settings', 'notifications'))
4. getDocs(collection(db, 'settings/notifications/history'))
5. handleSave:
   - setDoc(store) com merge
   - Snapshot anterior para history
   - addDoc(history) com templates anteriores
6. renderPreview: replace {{placeholders}} com samples
```

---

## 8️⃣ ADMIN NOTIFICATIONS
### `/app/dashboard/admin/notifications/page.tsx`

**Finalidade:** Gerenciar notificações, retry, histórico

### Lista de Notificações
```
┌──────────────────────────────────────────────┐
│ Notificações                                 │
│                                              │
│ ┌────────────────────────────────────────┐  │
│ │ Pedido #ABC123 - Retry falhou          │  │
│ │ 30/12 10:30 | Email para João Silva    │  │
│ │ Erro: Timeout                          │  │
│ │ [Retry] [Descartar] [Ver log]          │  │
│ └────────────────────────────────────────┘  │
│                                              │
│ ┌────────────────────────────────────────┐  │
│ │ Pedido #DEF456 - Enviado com sucesso   │  │
│ │ 29/12 14:45 | WhatsApp para Maria      │  │
│ │ ✓ Entregue                             │  │
│ │ [Detalhes]                             │  │
│ └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

### Ações em Lote
```
┌─────────────────────────────────┐
│ Processar Pendentes              │
│ [Executar agora] [Agendar]       │
└─────────────────────────────────┘
```

**Lógica:**
```tsx
1. query(collection(db, 'notifications'), orderBy('createdAt', 'desc'))
2. onSnapshot para realtime
3. retry(notificationId):
   - POST /api/retry-notification
4. processDue():
   - POST /api/process-due-notifications
5. Toast com resultado
```

---

## 9️⃣ EMPLOYEE DASHBOARD
### `/app/dashboard/employee/page.tsx`

**Finalidade:** Fila de análise de documentos

### Título
```
┌──────────────────────────┐
│ Fila de Análise           │
│ Gerencie documentações    │
│ X pedidos pendentes       │
└──────────────────────────┘
```

### Card de Pedido
```
┌────────────────────────────────────────┐
│  Pedido #ABC123         [Análise Docs] │
│  João Silva             30/12 10:30    │
│                                        │
│  Documentos (Seguro DPEM):             │
│  ├─ RG e CPF          [Visualizar]     │
│  ├─ Comprovante Endereço [Visualizar] │
│  └─ Doc Embarcação    [Visualizar]    │
│                                        │
│  [Rejeitar]  [Aprovar para Processam.]│
└────────────────────────────────────────┘
```

### Documento Viewer
```
Modal/Sidebar:
┌────────────────────────────┐
│ X                           │
│ RG e CPF                    │
│ (Imagem/PDF em iframe)      │
│                             │
│ [Baixar] [Abrir em nova aba]│
└────────────────────────────┘
```

**Grid Layout:**
- 1 coluna em mobile
- 2 colunas em tablet
- 2-3 colunas em desktop

**Lógica:**
```tsx
1. query(collection(db, 'orders'), 
         where("status", "in", ["pending_docs", "processing"]),
         orderBy("date", "asc"))
2. onSnapshot para realtime
3. updateOrderStatus(orderId, 'processing') ao aprovar
4. updateOrderStatus(orderId, 'rejected') ao rejeitar
5. Abrir docs em nova aba (Firebase Storage URLs)
```

**Status Badges:**
```
pending_docs  → [Análise Docs] (amarelo)
processing    → [Processamento] (azul)
```

---

## 📋 COMPONENTES REUTILIZÁVEIS NECESSÁRIOS

### PaymentWidget.tsx
```tsx
Props:
- orderId: string
- total: number
- userName?: string
- paymentMethod?: 'pix' | 'whatsapp' | 'card' | 'manual'

Exports:
- QR Code Pix
- Cópia de chave
- Link WhatsApp
- Botão Stripe
```

### ConfirmModal.tsx
```tsx
Props:
- open: boolean
- title?: string
- message: string
- onConfirm: () => void
- onCancel: () => void

Features:
- Glassmorphism
- Animação de entrada
- Overlay com blur
```

### Toast.tsx
```tsx
Props (via context):
- type: 'success' | 'error' | 'info' | 'warning'
- message: string
- duration?: number (default 3000)

Features:
- Auto-dismiss
- Stacking
- Icons
```

### ErrorBoundary.tsx
```tsx
Props:
- children: ReactNode

Features:
- Error state capture
- Error display
- Reset button
```

---

## 🔌 CONTEXTOS NECESSÁRIOS

### AuthContext (ATUALIZAR)
```tsx
Adicionar:
+ updateProfile(patch: Partial<User>): Promise<void>
```

### CartContext (ATUALIZAR)
```tsx
Adicionar:
+ paymentMethod: 'pix' | 'whatsapp' | 'card' | 'manual'
+ E2E_SKIP_UPLOADS support
+ localStorage para E2E tests
```

---

## 📊 BANCO DE DADOS (Firestore)

### Collections Necessárias

**orders/**
```
- id (auto)
- userId
- userName
- items[]
  - cartId
  - id
  - title
  - price
  - uploadedDocs (URLs)
  - requiredDocuments[]
- total
- status
- date (ISO)
- payment
  - method
  - status
  - pixKey
  - createdAt
  - paidAt
  - transactionId
```

**users/**
```
- id (Firebase UID)
- name
- email
- role
- phone
- address
  - street
  - number
  - city
  - state
  - zip
- locale
- createdAt
```

**settings/**
```
settings/store:
- whatsapp
- pixKey
- storeName
- city (para Pix)

settings/notifications:
- pt-BR:
  - emailSubject
  - emailPlain
  - emailHtml
  - whatsappText
- en:
  - emailSubject
  - emailPlain
  - emailHtml
  - whatsappText

settings/notifications/history:
- templates (snapshot anterior)
- createdAt
- author
  - id
  - name
```

**notifications/**
```
- id (auto)
- orderId
- type (email/whatsapp)
- status (pending/sent/failed)
- createdAt
- retries
- lastError
- sentAt
```

---

## 🔐 FIREBASE RULES

### Firestore Rules
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId;
      allow read: if request.auth.uid == userId && request.auth.token.admin == true;
    }
    
    // Orders
    match /orders/{orderId} {
      allow create: if request.auth != null;
      allow read: if request.auth.uid == resource.data.userId || 
                     request.auth.token.admin == true ||
                     request.auth.token.employee == true;
      allow update: if request.auth.token.admin == true ||
                       request.auth.token.employee == true;
    }
    
    // Settings (admin only)
    match /settings/{document=**} {
      allow read: if request.auth.token.admin == true;
      allow write: if request.auth.token.admin == true;
    }
    
    // Notifications (admin only)
    match /notifications/{document=**} {
      allow read, write: if request.auth.token.admin == true;
    }
  }
}
```

### Storage Rules
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/orders/{allPaths=**} {
      allow read, write: if request.auth.uid == userId ||
                            request.auth.token.admin == true;
    }
  }
}
```

---

## 🧪 TESTES E2E

### Casos de Uso
```
1. User can register and login
2. User can add services to cart
3. User can upload documents
4. User can place order
5. User can pay via Pix
6. User can view order history
7. Admin can manage orders
8. Admin can update settings
9. Employee can approve docs
10. Payment updates order status in realtime
```

---

**Documento versão:** 1.0  
**Gerado:** 30 de dezembro de 2025  
**Status:** ✅ Pronto para Desenvolvimento
