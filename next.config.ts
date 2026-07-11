import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    // Allow Next.js image optimization for Supabase storage buckets
    // (avatars, uploads, etc.). CSP already allows *.supabase.co.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "*.supabase.in",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },

  // Pin the workspace root to this project directory so Next.js doesn't infer
  // a wrong parent root (e.g. a stray lockfile in the home dir) that makes it
  // resolve middleware/proxy paths as "./src/src/...". Without this, the build
  // can report a false "Both middleware and proxy files detected" conflict.
  turbopack: {
    root: import.meta.dirname,
  },

  // Security HTTP headers
  async headers() {
    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Scripts: allow own + next.js inline scripts (unsafe-inline needed for Next.js)
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              // Styles: allow own + inline styles + Google Fonts
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Fonts: allow Google Fonts
              "font-src 'self' https://fonts.gstatic.com",
              // Images: allow own + data: + Supabase storage + uploaded assets
              `img-src 'self' data: blob: https://*.supabase.co`,
              // Connections: allow Supabase API + WebSockets + own API
              `connect-src 'self' https://*.supabase.co wss://*.supabase.co`,
              // Base URI
              "base-uri 'self'",
              // Form actions: allow same-origin
              "form-action 'self'",
              // Frames: deny
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
