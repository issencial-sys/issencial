# Issencial - Serviços Integrados Globais
## Quick Reference Guide for Development Sessions

### 📋 Project Overview
A Next.js 16 App Router application built with TypeScript, Tailwind CSS v4, and Supabase. The platform serves as a service portal for "Issencial - Serviços Integrados Globais" offering travel, education, international transfers, and administrative services. It provides a public website, a secure client portal, and an admin dashboard.

### 🛠️ Technology Stack
- **Framework**: Next.js 16 (App Router) — `16.2.10`
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS v4 (via `@tailwindcss/postcss`) with custom design system
- **Font**: Overused Grotesk (custom, em `public/fonts/`) + Geist
- **Backend/Auth**: Supabase (PostgreSQL + Auth + Edge Functions + Storage)
- **Rate limiting**: Upstash Redis (`@upstash/ratelimit` + `@upstash/redis`)
- **Content/Markdown**: `react-markdown` + `remark-gfm` (com `dompurify` para sanitização)
- **Animation**: `framer-motion`
- **Validation**: `zod`
- **Icons**: `lucide-react`
- **Deployment**: Vercel (veja `vercel.json`)

### 📁 Project Structure
```
issencial/
├── src/
│   ├── app/                         # Next.js App Router (todas as rotas)
│   │   ├── layout.tsx               # Root layout (fonts, metadata)
│   │   ├── page.tsx                 # Homepage (landing)
│   │   ├── globals.css              # Estilos globais
│   │   ├── error.tsx / not-found.tsx
│   │   ├── robots.ts / sitemap.ts
│   │   ├── login/                   # Login público (com /login/mfa para 2FA)
│   │   ├── sobre/                   # About page
│   │   ├── servicos/                # Serviços (lista)
│   │   │   └── [slug]/              # Página de serviço dinâmica
│   │   ├── blog/                    # Blog (lista)
│   │   │   └── [slug]/              # Artigo dinâmico
│   │   ├── contacto/                # Formulário de contacto
│   │   ├── faq/                     # Perguntas frequentes
│   │   ├── termos-privacidade/      # Termos & Privacidade
│   │   ├── portal/                  # Portal do cliente (autenticado)
│   │   │   ├── faturas/             # Faturas do cliente
│   │   │   ├── mensagens/           # Mensagens do cliente
│   │   │   ├── perfil/              # Gestão de perfil
│   │   │   └── processos/           # Processos do cliente
│   │   ├── admin/                   # Dashboard admin (protegido)
│   │   │   ├── login/               # Login dedicado admin
│   │   │   ├── clientes/            # Gestão de clientes
│   │   │   ├── config/              # Definições
│   │   │   ├── contactos/           # Gestão de contactos
│   │   │   ├── faturas/             # Gestão de faturas
│   │   │   ├── mensagens/           # Sistema de mensagens
│   │   │   ├── pedidos/             # Gestão de pedidos
│   │   │   ├── processos/           # Gestão de processos
│   │   │   └── newsletter/          # Gestão de newsletter
│   │   └── api/                     # Route handlers (API)
│   │       ├── admin/               # set-role, users
│   │       ├── auth/                # log, mfa
│   │       ├── contact/             # Submissão de contacto
│   │       ├── email/               # queue, send-email
│   │       ├── messages/            # send (mensagens cliente↔admin)
│   │       ├── newsletter/          # send, subscribe, unsubscribe
│   │       └── quote/               # Pedido de orçamento
│   │   └── proxy.ts                 # Proxy de imagens/asset
│   ├── components/
│   │   ├── ui/                      # Componentes base (Button, Badge, FileUpload, Pagination, CookieConsent, FadeIn, etc.)
│   │   ├── layout/                  # Header, Footer
│   │   ├── sections/                # Secções da landing (Hero, CTA, Stats, Testimonials, QuoteForm, etc.)
│   │   ├── auth/                    # MfaSettings e componentes de auth
│   │   └── blog/                    # BlogArticleView, BlogEditor
│   ├── data/
│   │   ├── blog.ts                  # Dados/seed de artigos do blog
│   │   └── services.ts              # Dados de serviços
│   └── lib/
│       ├── supabase/               # Clientes Supabase
│       │   ├── client.ts           # Browser client (@supabase/ssr)
│       │   ├── server.ts           # Server client
│       │   ├── admin.ts            # Admin client (service role)
│       │   └── requireAdmin.ts     # Guard de admin (server)
│       ├── auth/                   # recovery-hash, auth-log
│       ├── email/                  # Templates e fila de emails (contact-confirmation, new-message, newsletter, etc.)
│       ├── activity-log.ts         # Log de atividade
│       ├── rate-limiter.ts         # Rate limiting (Upstash)
│       └── validate-file-type.ts   # Validação de uploads
├── public/                          # Assets estáticos
│   ├── assets/                      # cards, icons, padroes, imagens
│   ├── fonts/                       # Overused Grotesk, etc.
│   ├── logo/                        # Variações do logo (azul/branco/verde)
│   ├── favicon.ico
│   └── *.svg
├── supabase/
│   ├── functions/                   # Edge Functions (send-email, process-newsletter)
│   ├── migrations/                  # 001_initial_schema → 017_fix_auth_logs_rls
│   ├── seed.sql                     # Seed de dados
│   └── README-SETUP.md              # Guia de setup
├── docs/                            # Documentação (auth-session-investigation, etc.)
├── mockups/                         # Referencias HTML de design
├── huashu-design/                   # Assets de design (huashu)
├── o-sentinela/                     # Auditoria de segurança
└── ux/                              # Materiais de UX
```

### 🎨 Design System (Tailwind)
- **Colors**:
  - Primary: `#002e35` (dark cyan) with light/dark variants
  - Accent: `#d7de6a` (lime yellow) with light/dark variants
  - Neutral: `#d9dad3` (light gray) with variants
  - Dark: `#151e28` (very dark blue)
  - Light: `#f1f1f1` (off-white)
- **Typography**:
  - Sans: `--font-overused-grotesk` (custom), Inter, system-ui
  - Mono: JetBrains Mono, Consolas, monospace
- **Custom Radius**: `xl` (1rem), `2xl` (1.5rem)
- **Custom Shadows**: accent, card, card-hover
- **Custom Animations**: fade-in, fade-in-up, slide-in-left/right, float, pulse-soft

### 🔐 Supabase Integration
- **Client**: `@supabase/ssr` com `createBrowserClient` / `createServerClient`
- **Environment**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (+ chaves de service role só no server)
- **Sessions**: geridas via `@supabase/ssr` (cookies em Server Components e Route Handlers); `src/lib/supabase/requireAdmin.ts` protege rotas admin
- **Usage**: `createClient()` de `src/lib/supabase/client.ts` (browser) / `server.ts` (server)

### 🔑 Authentication & Roles
- **Admin Panel** (`/admin`): rota protegida para administradores (guard `requireAdmin`)
- **Client Portal** (`/portal`): área autenticada do cliente
- **Login**: `/login` (público) e `/admin/login` (admin); suporte a MFA (2FA) com códigos de recuperação (`/login/mfa`)
- **Public Pages**: acessíveis sem autenticação
- **Auth**: Supabase Auth (sessões com SSR)

### 🧩 Key Features
1. **Admin Dashboard**:
   - Gestão de clientes (CRUD) e assignments
   - Configuração
   - Gestão de contactos
   - Gestão de faturas
   - Sistema de mensagens (chat cliente↔admin)
   - Processamento de pedidos
   - Gestão de processos/workflows
   - Gestão de newsletter

2. **Client Portal**:
   - Ver e descarregar faturas
   - Ver e enviar mensagens
   - Gerir perfil
   - Acompanhar processos

3. **Public Website**:
   - Homepage informativa (secções: Hero, CTA, Stats, Testimonials, QuoteForm, etc.)
   - Página Sobre
   - Catálogo de serviços com páginas detalhadas (`[slug]`)
   - Blog com artigos dinâmicos (`[slug]`)
   - Formulário de contacto
   - Secção FAQ
   - Páginas legais (Termos & Privacidade)

4. **Newsletter**: subscrição pública (com rate-limit + validação Zod), envio via Edge Function (`process-newsletter`) e fila de emails
5. **Emails transacionais**: fila com templates (confirmação de contacto, novo pedido, atualização de processo, fatura, newsletter, etc.)

### 🧱 Components & Patterns
- Componentes UI reutilizáveis em `src/components/ui/` (buttons, inputs, cards, etc.)
- Componentes de layout em `src/components/layout/` (Header, Footer)
- Secções da landing em `src/components/sections/`
- Uso consistente de Tailwind utility classes
- Animações custom definidas em `tailwind.config.ts`
- Font optimization via Next.js font API

### 🚀 Getting Started
```bash
# Install dependencies
npm install

# Start development server
npm run dev
# Then visit http://localhost:3000
```

### 🚢 Deployment
- Configurado para Vercel (veja `vercel.json`)
- Edge Functions Supabase deployadas via `supabase/functions/`
- Environment variables necessárias:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Chaves Upstash (Redis) para rate-limit
  - Credenciais de email/SMTP

### 📝 Notes
- Next.js 16 App Router architecture
- Tailwind CSS v4 configurado com custom design tokens
- Supabase gere backend, auth, storage e edge functions
- Rate limiting via Upstash Redis em endpoints públicos
- Estrutura de componentes modular promove reusabilidade
- Diretório `mockups/` contém referências HTML de design
- Fonte custom (Overused Grotesk) carregada de `public/fonts`
- Auditoria de segurança via `o-sentinela` (CRITICAL/HIGH/MEDIUM/LOW)

---
*Last updated: 2026-07-14*
*Generated for quick project onboarding*
