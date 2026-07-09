# Issencial - Serviços Integrados Globais
## Quick Reference Guide for Development Sessions

### 📋 Project Overview
A Next.js 13+ App Router application built with TypeScript, Tailwind CSS, and Supabase. The platform serves as a service portal for "Issencial - Serviços Integrados Globais" offering travel, education, international transfers, and administrative services.

### 🛠️ Technology Stack
- **Framework**: Next.js 13+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Font**: Overused Grotesk (custom) + Geist (Next.js optimized)
- **Backend**: Supabase (PostgreSQL + Auth)
- **Styling**: PostCSS
- **Deployment**: Vercel (configured)

### 📁 Project Structure
```
issencial/
├── app/                    # Next.js App Router
│   ├── admin/              # Admin dashboard (protected)
│   │   ├── clientes/       # Client management
│   │   ├── config/         # Settings management
│   │   ├── contactos/      # Contact management
│   │   ├── faturas/        # Invoice management
│   │   ├── mensagens/      # Messaging system
│   │   ├── pedidos/        # Order management
│   │   └── processos/      # Process management
│   ├── portal/             # Client portal (authenticated)
│   │   ├── faturas/        # Client invoices
│   │   ├── mensagens/      # Client messages
│   │   ├── perfil/         # Profile management
│   │   └── processos/      # Client processes
│   ├── (public)/           # Public accessible pages
│   │   ├── sobre/          # About page
│   │   ├── serviços/       # Services with dynamic [slug]
│   │   ├── contacto/       # Contact form
│   │   ├── faq/            # Frequently asked questions
│   │   └── termos-privacidade/ # Terms & Privacy
│   ├── layout.tsx          # Root layout (fonts, metadata)
│   ├── page.tsx            # Homepage
│   └── layout.tsx          # Root layout
├── components/             # Reusable UI components
│   ├── ui/                 # Shadcn/ui inspired components
│   ├── layout/             # Header, footer, layout components
│   └── ui/                 # Buttons, inputs, cards, etc.
├── lib/
│   └── supabase/           # Supabase client utilities
│       ├── client.ts       # Browser client
│       ├── server.ts       # Server client
│       └── middleware.ts   # Auth middleware
├── public/                 # Static assets
│   ├── fonts/              # Overused Grotesk font family
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── mockups/                # HTML design mockups
├── public/
├── supabase/               # Supabase migration files
├── styles/                 # Global CSS (if any)
└── ...config files
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
- **Client**: `@supabase/ssr` with `createBrowserClient`
- **Environment**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Middleware**: Located in `src/lib/supabase/middleware.ts` (authentication handling)
- **Usage**: `createClient()` from `src/lib/supabase/client.ts`

### 🔑 Authentication & Roles
- **Admin Panel** (`/admin`): Protected route for administrators
- **Client Portal** (`/portal`): Authenticated client area
- **Public Pages**: Accessible without authentication
- **Auth**: Likely Supabase Auth (based on middleware presence)

### 🧩 Key Features
1. **Admin Dashboard**:
   - Client management (CRUD)
   - Configuration management
   - Contact handling
   - Invoice management
   - Message system
   - Order processing
   - Process/workflow management

2. **Client Portal**:
   - View and download invoices
   - View messages
   - Manage profile
   - Track processes

3. **Public Website**:
   - Informational homepage
   - About page
   - Service catalog with detailed pages
   - Contact form
   - FAQ section
   - Legal pages (Terms & Privacy)

### 🧱 Components & Patterns
- Reusable UI components in `src/components/ui/` (buttons, inputs, cards, etc.)
- Layout components in `src/components/layout/` (headers, footers)
- Consistent use of Tailwind utility classes
- Custom animations defined in tailwind.config.ts
- Font optimization via Next.js font API

### 🚀 Getting Started
```bash
# Install dependencies
npm install
# or
yarn
# or
pnpm install
# or
bun install

# Start development server
npm run dev
# Then visit http://localhost:3000
```

### 🚢 Deployment
- Configured for Vercel deployment
- See `vercel.json` for configuration
- Ensure environment variables are set:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 📝 Notes
- Uses Next.js 13+ App Router architecture
- Tailwind CSS configured with custom design tokens
- Supabase handles backend and authentication
- Modular component structure promotes reusability
- Mockups directory contains HTML design references
- Custom font (Overused Grotesk) loaded from public/fonts

---
*Last updated: $(date)*  
*Generated for quick project onboarding*