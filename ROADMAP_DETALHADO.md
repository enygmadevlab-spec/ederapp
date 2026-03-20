# 📊 ROADMAP DETALHADO DE MIGRAÇÃO
## Eder Martins - Vite React → Next.js 16

---

## 🗂️ ESTRUTURA COMPLETA DE ARQUIVOS

### PROJETO ANTIGO (Vite React)
```
eder-martins-assessoria-náutica (2)/
├── src/
│   ├── components/
│   │   └── Toast.tsx                  ← Componente toast de notificações
│   └── ConfirmModal.tsx               ← Modal de confirmação
├── components/
│   ├── ErrorBoundary.tsx              ✅ Component base
│   ├── Layout.tsx                     ✅ Header + Navegação
│   └── PaymentWidget.tsx              ✅ Widget Pix + WhatsApp
├── context/
│   ├── AuthContext.tsx                ✅ Autenticação Firebase
│   └── CartContext.tsx                ✅ Gerenciamento de carrinho
├── pages/
│   ├── Home.tsx                       ✅ Landing page
│   ├── Login.tsx                      ✅ Auth
│   ├── ServiceCatalog.tsx             ✅ Catálogo de serviços
│   ├── Checkout.tsx                   ✅ Checkout básico
│   ├── Payment.tsx                    ❌ Página de pagamento
│   ├── Profile.tsx                    ❌ Perfil do usuário
│   ├── OrderDetail.tsx                ❌ Detalhe do pedido
│   ├── AdminNotifications.tsx         ❌ Admin: Notificações
│   ├── AdminSettings.tsx              ❌ Admin: Configurações
│   └── dashboards/
│       ├── ClientDashboard.tsx        ❌ Dashboard do cliente
│       ├── AdminDashboard.tsx         ❌ Dashboard do admin
│       └── EmployeeDashboard.tsx      ❌ Dashboard do colaborador
├── utils/
│   ├── pix.ts                         ❌ Gerador BR Code Pix
│   ├── csv.ts                         ❌ Export CSV
│   ├── log.ts                         ❌ Logging
│   └── firebase.ts                    ✅ Config Firebase
├── types.ts                           ✅ Tipos (incompletos)
└── firebase.ts                        ✅ Config Firebase
```

### PROJETO NOVO (Next.js)
```
src/
├── app/
│   ├── layout.tsx                     ⚠️ Precisa providers
│   ├── globals.css                    ✅ Tailwind CSS
│   ├── page.tsx                       ✅ Home (95%)
│   ├── login/
│   │   └── page.tsx                   ✅ Login (95%)
│   ├── services/
│   │   └── page.tsx                   ✅ Serviços (95%)
│   ├── checkout/
│   │   └── page.tsx                   ⚠️ Incompleto (sem upload)
│   ├── payment/
│   │   └── [id]/
│   │       └── page.tsx               ❌ CRIAR
│   ├── profile/
│   │   └── page.tsx                   ❌ CRIAR
│   ├── order/
│   │   └── [id]/
│   │       └── page.tsx               ❌ CRIAR
│   └── dashboard/
│       ├── client/
│       │   └── page.tsx               ❌ CRIAR
│       ├── admin/
│       │   ├── page.tsx               ❌ CRIAR
│       │   ├── settings/
│       │   │   └── page.tsx           ❌ CRIAR
│       │   └── notifications/
│       │       └── page.tsx           ❌ CRIAR
│       └── employee/
│           └── page.tsx               ❌ CRIAR
├── components/
│   ├── Layout.tsx                     ⚠️ Incompleto
│   ├── PaymentWidget.tsx              ❌ CRIAR
│   ├── ErrorBoundary.tsx              ❌ CRIAR
│   ├── ConfirmModal.tsx               ❌ CRIAR
│   └── Toast.tsx                      ❌ CRIAR
├── context/
│   ├── AuthContext.tsx                ⚠️ Incompleto
│   └── CartContext.tsx                ⚠️ Incompleto
├── lib/
│   ├── firebase.ts                    ✅ OK
│   ├── pix.ts                         ❌ CRIAR
│   ├── csv.ts                         ❌ CRIAR
│   └── log.ts                         ❌ CRIAR
├── types.ts                           ⚠️ Incompleto
└── styles/                            ❌ (se necessário)
```

---

## 📋 TABELA DE FUNCIONALIDADES

### Página: HOME
| Componente | Vite | Next | Migração |
|-----------|------|------|----------|
| Hero section | ✅ | ✅ | Feito |
| Carousel 3D | ✅ | ✅ | Feito |
| CTA buttons | ✅ | ✅ | Feito |
| Features section | ✅ | ⚠️ | Parcial |
| Pricing cards | ✅ | ✅ | Feito |
| **Status** | **COMPLETO** | **95%** | **Revisar features** |

### Página: SERVICES
| Componente | Vite | Next | Migração |
|-----------|------|------|----------|
| Service grid | ✅ | ✅ | Feito |
| Add to cart | ✅ | ✅ | Feito |
| Price display | ✅ | ✅ | Feito |
| Docs badge | ✅ | ✅ | Feito |
| **Status** | **COMPLETO** | **95%** | **Revisar styling** |

### Página: LOGIN
| Componente | Vite | Next | Migração |
|-----------|------|------|----------|
| Form login | ✅ | ✅ | Feito |
| Form signup | ✅ | ✅ | Feito |
| Email validation | ✅ | ✅ | Feito |
| Error messages | ✅ | ✅ | Feito |
| Firebase auth | ✅ | ✅ | Feito |
| **Status** | **COMPLETO** | **95%** | **Revisar tokens** |

### Página: CHECKOUT
| Componente | Vite | Next | Migração |
|-----------|------|------|----------|
| Cart review | ✅ | ✅ | Feito |
| Item removal | ✅ | ✅ | Feito |
| Total calc | ✅ | ✅ | Feito |
| **Document upload** | ✅ | ❌ | **CRÍTICO** |
| Upload progress | ✅ | ❌ | **CRÍTICO** |
| Validation | ✅ | ❌ | **CRÍTICO** |
| Payment method select | ✅ | ❌ | **CRÍTICO** |
| Place order | ✅ | ⚠️ | Incompleto |
| **Status** | **COMPLETO** | **50%** | **CRIAR upload logic** |

### Página: PAYMENT
| Componente | Vite | Next | Migração |
|-----------|------|------|----------|
| **PaymentWidget (Pix)** | ✅ | ❌ | **CRIAR** |
| QR Code generation | ✅ | ❌ | **CRIAR** |
| BR Code EMV | ✅ | ❌ | **CRIAR** |
| WhatsApp button | ✅ | ❌ | **CRIAR** |
| Card payment button | ✅ | ❌ | **CRIAR** |
| Order tracking | ✅ | ❌ | **CRIAR** |
| **Status** | **COMPLETO** | **0%** | **PÁGINA NOVA** |

### Página: PROFILE
| Componente | Vite | Next | Migração |
|-----------|------|------|----------|
| **Editar dados** | ✅ | ❌ | **CRIAR** |
| **Endereço** | ✅ | ❌ | **CRIAR** |
| **Telefone** | ✅ | ❌ | **CRIAR** |
| **Idioma** | ✅ | ❌ | **CRIAR** |
| **Status** | **COMPLETO** | **0%** | **PÁGINA NOVA** |

### Página: ORDER DETAIL
| Componente | Vite | Next | Migração |
|-----------|------|------|----------|
| **Order header** | ✅ | ❌ | **CRIAR** |
| **Items list** | ✅ | ❌ | **CRIAR** |
| **Docs links** | ✅ | ❌ | **CRIAR** |
| **Status timeline** | ✅ | ❌ | **CRIAR** |
| **Back button** | ✅ | ❌ | **CRIAR** |
| **Status** | **COMPLETO** | **0%** | **PÁGINA NOVA** |

### Dashboard: CLIENT
| Componente | Vite | Next | Migração |
|-----------|------|------|----------|
| **Orders list** | ✅ | ❌ | **CRIAR** |
| **Status filter** | ✅ | ❌ | **CRIAR** |
| **Search** | ✅ | ❌ | **CRIAR** |
| **Sort** | ✅ | ❌ | **CRIAR** |
| **Pagination** | ✅ | ❌ | **CRIAR** |
| **Status badges** | ✅ | ❌ | **CRIAR** |
| **Timeline** | ✅ | ❌ | **CRIAR** |
| **Tabs** | ✅ | ❌ | **CRIAR** |
| **Status** | **COMPLETO** | **0%** | **PÁGINA NOVA** |

### Dashboard: ADMIN
| Componente | Vite | Next | Migração |
|-----------|------|------|----------|
| **All orders** | ✅ | ❌ | **CRIAR** |
| **Advanced filters** | ✅ | ❌ | **CRIAR** |
| **Date range** | ✅ | ❌ | **CRIAR** |
| **CSV export** | ✅ | ❌ | **CRIAR** |
| **User management** | ✅ | ❌ | **CRIAR** |
| **Bulk promote** | ✅ | ❌ | **CRIAR** |
| **Confirm modal** | ✅ | ❌ | **CRIAR** |
| **Status** | **COMPLETO** | **0%** | **PÁGINA NOVA** |

### Admin: SETTINGS
| Componente | Vite | Next | Migração |
|-----------|------|------|----------|
| **PIX Key** | ✅ | ❌ | **CRIAR** |
| **WhatsApp** | ✅ | ❌ | **CRIAR** |
| **Store Name** | ✅ | ❌ | **CRIAR** |
| **Email templates** | ✅ | ❌ | **CRIAR** |
| **WhatsApp templates** | ✅ | ❌ | **CRIAR** |
| **Preview** | ✅ | ❌ | **CRIAR** |
| **History** | ✅ | ❌ | **CRIAR** |
| **Status** | **COMPLETO** | **0%** | **PÁGINA NOVA** |

### Admin: NOTIFICATIONS
| Componente | Vite | Next | Migração |
|-----------|------|------|----------|
| **Notifications list** | ✅ | ❌ | **CRIAR** |
| **Retry button** | ✅ | ❌ | **CRIAR** |
| **Process due** | ✅ | ❌ | **CRIAR** |
| **Status** | **COMPLETO** | **0%** | **PÁGINA NOVA** |

### Dashboard: EMPLOYEE
| Componente | Vite | Next | Migração |
|-----------|------|------|----------|
| **Order queue** | ✅ | ❌ | **CRIAR** |
| **Docs viewer** | ✅ | ❌ | **CRIAR** |
| **Approve/Reject** | ✅ | ❌ | **CRIAR** |
| **Download docs** | ✅ | ❌ | **CRIAR** |
| **Status** | **COMPLETO** | **0%** | **PÁGINA NOVA** |

---

## 🧩 COMPONENTES DETALHADOS

### Layout Component
```tsx
✅ Header (logo, nav)
✅ Desktop menu
✅ Mobile menu (hamburger)
✅ User menu (hello, logout)
✅ Cart widget (badge count)
✅ Role-based nav (client/admin/employee)
```
**Status**: ❌ CRIAR em Next.js  
**Dependências**: AuthContext, CartContext

---

### PaymentWidget Component
```tsx
✅ PIX Section:
   - Pix Key display
   - Copy key button
   - Copy instructions button
   - QR Code (generated from BR Code)
   
✅ WhatsApp Section:
   - WhatsApp link builder
   - Pre-filled message
   
✅ Card Section:
   - Stripe redirect
   
✅ Manual Section:
   - Info message
```
**Status**: ❌ CRIAR em Next.js  
**Dependências**: pix.ts, qrcode.react, Firebase config

---

### ConfirmModal Component
```tsx
✅ Title
✅ Message
✅ Confirm button
✅ Cancel button
✅ Callbacks (onConfirm, onCancel)
✅ Styling (glassmorphism)
```
**Status**: ❌ CRIAR em Next.js  
**Dependências**: None (pure component)

---

### Toast Component
```tsx
✅ Types: success, error, info, warning
✅ Auto-dismiss (3s)
✅ Stacking support
✅ Close button
```
**Status**: ❌ CRIAR em Next.js  
**Dependências**: None (pure component)

---

### ErrorBoundary Component
```tsx
✅ Error state capture
✅ Error display
✅ Error message stack
✅ Styling
```
**Status**: ❌ CRIAR em Next.js  
**Dependências**: React Error Boundary pattern

---

## 🔌 CONTEXTOS DETALHADOS

### AuthContext
```tsx
ATUAL (Vite):
✅ user: User | null
✅ loading: boolean
✅ logout(): Promise<void>
✅ updateProfile(patch: Partial<User>): Promise<void>
✅ E2E_BYPASS_AUTH support
✅ fetchUserProfile from Firestore
✅ createUserIfNotExists

NECESSÁRIO (Next.js):
❌ user: User | null
❌ loading: boolean
❌ logout(): Promise<void>
⚠️ updateProfile() ← FALTA IMPLEMENTAR
❌ E2E_BYPASS_AUTH support
```

**Status**: ⚠️ ATUALIZAR (falta updateProfile)

---

### CartContext
```tsx
ATUAL (Vite):
✅ cart: CartItem[]
✅ addToCart()
✅ removeFromCart()
✅ updateItemDocument()
✅ clearCart()
✅ placeOrder(userId, userName, paymentMethod?)
✅ updateOrderStatus()
✅ isUploading: boolean
✅ E2E_SKIP_UPLOADS support
✅ E2E_orders localStorage

NECESSÁRIO (Next.js):
❌ cart: CartItem[]
❌ addToCart()
❌ removeFromCart()
❌ updateItemDocument()
❌ clearCart()
⚠️ placeOrder() ← paymentMethod FALTA
⚠️ updateOrderStatus() ← Incompleto
❌ isUploading: boolean
❌ E2E_SKIP_UPLOADS support
❌ E2E_orders localStorage
```

**Status**: ⚠️ ATUALIZAR (adicionar payment methods e E2E support)

---

## 🛠️ UTILITÁRIOS DETALHADOS

### pix.ts (Gerador BR Code)
```typescript
✅ field(id, value) - EMV field formatter
✅ crc16(payload) - CRC16-CCITT checksum
✅ buildBRCode({pixKey, amount, txid, merchantName, merchantCity}) - QR Code builder

EXPORT:
- buildBRCode()
- crc16()
```
**Status**: ❌ CRIAR em lib/pix.ts  
**Dependências**: None

---

### csv.ts (Export CSV)
```typescript
✅ escapeCsv(value) - CSV escaping
✅ ordersToCSV(orders[]) - Orders array to CSV string

HEADERS:
- orderId
- date
- userId
- userName
- total
- status
- paymentMethod
- paymentStatus
- paidAt
- items (JSON)
- itemTitles (concatenated)
```
**Status**: ❌ CRIAR em lib/csv.ts  
**Dependências**: None

---

### log.ts (Logging)
```typescript
✅ logEvent(action, userId, details)

EVENTOS RASTREADOS:
- User created
- User promoted
- Order placed
- Order status changed
- Payment processed
- Document uploaded
- Settings changed
```
**Status**: ❌ CRIAR em lib/log.ts  
**Dependências**: Firebase Firestore

---

## 📝 TIPOS DETALHADOS

### User Type (ATUALIZAR)
```typescript
ATUAL:
interface User {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt?: any
  locale?: string         ⚠️ INCOMPLETO
  phone?: string          ⚠️ INCOMPLETO
  address?: {...}         ⚠️ INCOMPLETO
}

NECESSÁRIO:
interface User {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt?: string
  locale?: 'pt-BR' | 'en'
  phone?: string
  address?: {
    street?: string
    number?: string
    city?: string
    state?: string
    zip?: string
  }
}
```
**Status**: ⚠️ COMPLETAR em types.ts

---

### Order Type (ATUALIZAR)
```typescript
ATUAL:
interface Order {
  id: string
  userId: string
  userName?: string
  items: OrderItem[]
  total: number
  status: 'pending_docs' | 'processing' | 'completed' | 'rejected'
  date: string
  payment?: {...}  ⚠️ INCOMPLETO
}

NECESSÁRIO:
interface Order {
  id: string
  userId: string
  userName?: string
  items: OrderItem[]
  total: number
  status: 'pending_docs' | 'pending_payment' | 'processing' | 'paid' | 'completed' | 'rejected' | 'failed'
  date: string
  payment?: {
    method?: 'pix' | 'whatsapp' | 'card' | 'manual'
    status?: 'pending_payment' | 'paid' | 'failed' | 'refunded'
    pixKey?: string
    pixPayload?: string
    whatsappMessage?: string
    createdAt?: string
    paidAt?: string
    transactionId?: string
  }
}
```
**Status**: ⚠️ COMPLETAR em types.ts

---

## 🔄 FLUXOS DE DADOS

### Fluxo: Home → Services → Checkout → Payment
```
1. User visits /
   └─ Home component renders
      └─ MOCK_SERVICES displayed
      └─ useCart hook available

2. User clicks "Adicionar" on service
   └─ addToCart() called
   └─ CartContext state updated
   └─ Toast "Adicionado" shows

3. User clicks cart icon or "Finalizar Solicitação"
   └─ Navigate to /checkout
   └─ CheckoutPage renders
   └─ Cart items displayed
   └─ updateItemDocument() for file uploads

4. User uploads all required docs
   └─ placeOrder() called
   └─ Files uploaded to Firebase Storage
   └─ Order created in Firestore
   └─ Navigate to /payment/[orderId]

5. User pays via Pix/WhatsApp/Card
   └─ PaymentPage renders with PaymentWidget
   └─ QR Code displayed (if Pix)
   └─ Order.payment.status updated in Firestore
   └─ Redirect to /dashboard/client

6. User views order details
   └─ Navigate to /order/[orderId]
   └─ OrderDetail page shows items + docs
   └─ Status timeline displayed
```

---

## 📊 MATRIZ DE DEPENDÊNCIAS

```
AuthContext
├─ Firebase Auth
├─ Firebase Firestore
└─ types.ts (User)

CartContext
├─ Firebase Firestore
├─ Firebase Storage
├─ types.ts (Order, CartItem)
└─ AuthContext (via useAuth)

PaymentWidget
├─ pix.ts (buildBRCode)
├─ qrcode.react (QRCodeCanvas)
├─ CartContext (via useCart)
└─ types.ts (Order)

ClientDashboard
├─ AuthContext
├─ CartContext
├─ Firebase Firestore (onSnapshot)
├─ ConfirmModal
├─ Toast
└─ types.ts (Order)

AdminDashboard
├─ AuthContext
├─ CartContext
├─ Firebase Firestore (onSnapshot)
├─ Firebase Functions (httpsCallable)
├─ csv.ts (ordersToCSV)
├─ ConfirmModal
├─ Toast
├─ log.ts (logEvent)
└─ types.ts (Order, User)

EmployeeDashboard
├─ CartContext (updateOrderStatus)
├─ Firebase Firestore (onSnapshot)
├─ Toast
└─ types.ts (Order)
```

---

## 🚀 ORDEM RECOMENDADA DE IMPLEMENTAÇÃO

### Semana 1: Fundação
1. **types.ts** - Completar tipos (User, Order)
2. **lib/pix.ts** - Gerador BR Code
3. **lib/csv.ts** - Export CSV
4. **lib/log.ts** - Logging
5. **Toast.tsx** - Sistema notificações
6. **ErrorBoundary.tsx** - Error handling
7. **ConfirmModal.tsx** - Modal confirmação
8. **AuthContext** - Add updateProfile()
9. **CartContext** - Add payment methods
10. **Layout.tsx** - Navigation completa
11. **app/layout.tsx** - Add providers

### Semana 2-3: Páginas Core
1. **PaymentWidget.tsx** - Widget Pix
2. **app/payment/[id]/page.tsx** - Payment page
3. **app/checkout/page.tsx** - Complete upload
4. **app/profile/page.tsx** - Profile edit
5. **app/order/[id]/page.tsx** - Order detail
6. **app/dashboard/client/page.tsx** - Client dashboard

### Semana 4: Admin & Employee
1. **app/dashboard/admin/page.tsx** - Admin dashboard
2. **app/dashboard/admin/settings/page.tsx** - Admin settings
3. **app/dashboard/admin/notifications/page.tsx** - Notifications
4. **app/dashboard/employee/page.tsx** - Employee dashboard

### Semana 5: Polimento
1. E2E tests
2. Multi-language
3. Performance optimization
4. Documentation
5. Deploy validation

---

## ✅ CHECKLIST FINAL

### Pré-desenvolvimento
- [ ] Clonar/validar novo projeto Next.js
- [ ] Instalar todas as dependências
- [ ] Configurar Firebase
- [ ] Revisar este documento
- [ ] Setup CI/CD

### Desenvolvimento Fase 1
- [ ] Completar types.ts
- [ ] Criar lib/pix.ts
- [ ] Criar lib/csv.ts
- [ ] Criar lib/log.ts
- [ ] Criar Toast.tsx
- [ ] Criar ErrorBoundary.tsx
- [ ] Criar ConfirmModal.tsx
- [ ] Atualizar AuthContext
- [ ] Atualizar CartContext
- [ ] Completar Layout.tsx

### Desenvolvimento Fase 2
- [ ] Criar PaymentWidget.tsx
- [ ] Criar /app/payment/[id]/page.tsx
- [ ] Atualizar /app/checkout/page.tsx
- [ ] Criar /app/profile/page.tsx
- [ ] Criar /app/order/[id]/page.tsx
- [ ] Criar /app/dashboard/client/page.tsx

### Desenvolvimento Fase 3
- [ ] Criar /app/dashboard/admin/page.tsx
- [ ] Criar /app/dashboard/admin/settings/page.tsx
- [ ] Criar /app/dashboard/admin/notifications/page.tsx
- [ ] Criar /app/dashboard/employee/page.tsx
- [ ] Implementar user management

### Testes & Deploy
- [ ] E2E tests (Playwright)
- [ ] Unit tests
- [ ] Manual testing
- [ ] Performance audit
- [ ] Security audit
- [ ] Deploy staging
- [ ] Deploy production

---

**Documento versão:** 1.0  
**Última atualização:** 30 de dezembro de 2025  
**Status:** ✅ Pronto para Desenvolvimento
