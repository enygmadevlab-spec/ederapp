# 🚤 Eder Martins Assessoria Náutica

Sistema completo de assessoria náutica para regularização e documentação de embarcações.

## 📋 Sobre o Projeto

Plataforma web desenvolvida em Next.js para prestação de serviços de assessoria náutica, incluindo:

- ✅ **Documentação e Licenciamento** de embarcações
- ✅ **Regularização Náutica** completa
- ✅ **Sistema de Pedidos** online
- ✅ **Dashboard Administrativo** para gestão
- ✅ **Upload de Documentos** seguro
- ✅ **Integração com Firebase** (Auth, Firestore, Storage)

## 🛠️ Tecnologias Utilizadas

- **Framework:** Next.js 16.1.1
- **Linguagem:** TypeScript
- **Styling:** Tailwind CSS 3.4.0
- **Backend:** Firebase (Auth, Firestore, Storage)
- **UI Components:** Lucide React
- **Deploy:** Vercel

## 🚀 Como Executar

### Pré-requisitos
- Node.js (versão 18+)
- Conta Firebase configurada

### Instalação e Execução

1. **Clone o repositório:**
```bash
git clone https://github.com/enygnadev/ederassapp.git
cd ederassapp
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure as variáveis de ambiente:**
   - Copie `.env.local.example` para `.env.local`
   - Configure as chaves do Firebase

4. **Execute o projeto:**
```bash
npm run dev
```

5. **Acesse:** `http://localhost:3000`

## 📁 Estrutura do Projeto

```
src/
├── app/                    # Páginas Next.js App Router
│   ├── dashboard/         # Dashboards (admin, client, employee)
│   ├── checkout/          # Sistema de checkout
│   ├── login/             # Autenticação
│   └── services/          # Página de serviços
├── components/            # Componentes reutilizáveis
├── context/               # Context API (Auth, Cart)
├── lib/                   # Utilitários e configurações
└── types.ts              # Definições TypeScript
```

## 🔧 Configuração Firebase

### 1. Crie um projeto no Firebase Console
### 2. Habilite Authentication, Firestore e Storage
### 3. Configure as variáveis em `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 📦 Deploy

### Vercel (Recomendado)
1. Conecte o repositório GitHub
2. Configure as variáveis de ambiente no Vercel
3. Deploy automático

### Build Manual
```bash
npm run build
npm run start
```

## 👨‍💼 Autor

**Eder Martins**
- Assessoria Náutica Especializada
- Contato: (48) 99624-1068

## 📄 Licença

Este projeto é privado e confidencial.
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` (optional)
- `NEXT_PUBLIC_GEMINI_API_KEY` (optional)

3. Run the Next dev server:
   `npm run dev`

Notes:
- Tailwind is installed and configured for production (no CDN usage).
- The Next app lives in the repo root (`src/app`).
