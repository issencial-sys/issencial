# Issencial - Serviços Integrados Globais

Issencial is a comprehensive service portal for "Issencial - Serviços Integrados Globais", offering travel, education, international transfers, and administrative services. The platform provides a public-facing website, a secure client portal, and a robust administration dashboard.

## 🛠️ Technology Stack

- **Framework**: [Next.js 13+](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with a custom design system
- **Backend/Auth**: [Supabase](https://supabase.com/) (PostgreSQL + Auth)
- **Fonts**: Overused Grotesk (Custom) & Geist
- **Deployment**: [Vercel](https://vercel.com/)

## 📁 Project Structure

```text
issencial/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/              # Admin dashboard (Protected)
│   │   │   ├── clientes/       # Client management
│   │   │   ├── config/         # Settings management
│   │   │   ├── contactos/      # Contact management
│   │   │   ├── faturas/        # Invoice management
│   │   │   ├── mensagens/      # Messaging system
│   │   │   ├── pedidos/        # Order management
│   │   │   └── processos/      # Process management
│   │   ├── portal/             # Client portal (Authenticated)
│   │   │   ├── faturas/        # Client invoices
│   │   │   ├── mensagens/      # Client messages
│   │   │   ├── perfil/         # Profile management
│   │   │   └── processos/      # Client processes
│   │   ├── (public)/           # Public accessible pages
│   │   │   ├── sobre/          # About page
│   │   │   ├── serviços/       # Services with dynamic [slug]
│   │   │   ├── contacto/       # Contact form
│   │   │   ├── faq/            # Frequently asked questions
│   │   │   └── termos-privacidade/ # Terms & Privacy
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Homepage
│   ├── components/             # Reusable UI components
│   │   ├── ui/                 # Base components (buttons, inputs, cards)
│   │   └── layout/             # Layout components (header, footer)
│   └── lib/
│       └── supabase/           # Supabase client utilities (browser, server, middleware)
├── public/                     # Static assets (fonts, images, icons)
├── supabase/                   # Database migration files
└── mockups/                    # HTML design references
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project

### Installation

1. **Clone the repository**
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Environment Variables**:
   Create a `.env.local` file in the root directory and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🎨 Design System

The project uses a custom Tailwind configuration with the following primary colors:
- **Primary**: `#002e35` (Dark Cyan)
- **Accent**: `#d7de6a` (Lime Yellow)
- **Neutral**: `#d9dad3` (Light Gray)
- **Dark**: `#151e28` (Very Dark Blue)
- **Light**: `#f1f1f1` (Off-white)
