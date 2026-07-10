"use client";

import Link from "next/link";
import { Clock, Calendar, Share2 } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export interface BlogArticleData {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  categoryLabel: string;
  author: string;
  authorRole: string;
  date: string;
  readingTime: string;
  image?: string;
  relatedSlugs?: string[];
}

const categoryColors: Record<string, { bg: string; text: string; badge: string }> = {
  passaporte: { bg: "bg-[#e8f4f5]", text: "text-[#004a54]", badge: "bg-[#004a54]/10 text-[#004a54]" },
  educacao: { bg: "bg-[#e8f4ec]", text: "text-[#1a4a40]", badge: "bg-[#1a4a40]/10 text-[#1a4a40]" },
  financas: { bg: "bg-[#f0f4e8]", text: "text-[#3a4a20]", badge: "bg-[#3a4a20]/10 text-[#3a4a20]" },
  "viver-portugal": { bg: "bg-[#e8eef4]", text: "text-[#2a3a45]", badge: "bg-[#2a3a45]/10 text-[#2a3a45]" },
  historias: { bg: "bg-[#f4e8f0]", text: "text-[#4a2a35]", badge: "bg-[#4a2a35]/10 text-[#4a2a35]" },
};

interface Props {
  article: BlogArticleData;
  isPreview?: boolean;
}

export default function BlogArticleView({ article, isPreview }: Props) {
  const [shareOpen, setShareOpen] = useState(false);
  const colors = categoryColors[article.category] || categoryColors.passaporte;

  return (
    <>
      {/* ─── ARTICLE HERO ─── */}
      <section className="relative min-h-[50vh] flex items-center bg-[#002e35] overflow-hidden pt-24">
        {!isPreview && (
          <>
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute w-[500px] h-[500px] rounded-full border border-[#d7de6a]/8 -top-[150px] -right-[80px]" />
              <div className="absolute w-[350px] h-[350px] rounded-full border border-[#d7de6a]/8 -bottom-[100px] -left-[60px]" />
              <div className="absolute w-[180px] h-[180px] rounded-full border border-[#d7de6a]/4 bg-[#d7de6a]/[0.02] top-[25%] right-[12%]" />
            </div>
            <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_50%_50%,#d7de6a_1px,transparent_1px)] bg-[length:40px_40px]" />
          </>
        )}

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 py-20 lg:py-28">
          {!isPreview && (
            <nav className="flex items-center gap-2 text-sm text-white/40 mb-8">
              <Link href="/" className="hover:text-[#d7de6a] transition-colors">Início</Link>
              <span>/</span>
              <Link href="/blog" className="hover:text-[#d7de6a] transition-colors">Blog</Link>
              <span>/</span>
              <span className="text-white/60 truncate max-w-[200px]">{article.title}</span>
            </nav>
          )}

          <span className={`inline-block px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider mb-5 ${colors.badge}`}>
            {article.categoryLabel}
          </span>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.08] text-white mb-5 tracking-tight">
            {article.title}
          </h1>

          <p className="text-lg text-white/55 max-w-[600px] mb-8 leading-relaxed">
            {article.excerpt}
          </p>

          <div className="flex flex-wrap items-center gap-5 text-sm text-white/50">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-[#d7de6a]/15 flex items-center justify-center text-[#d7de6a] text-xs font-bold">
                {article.author.charAt(0)}
              </div>
              <div>
                <div className="text-white/80 text-[13px] font-medium">{article.author}</div>
                <div className="text-white/35 text-[11px]">{article.authorRole}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 ml-auto">
              <span className="flex items-center gap-1.5">
                <Calendar size={13} className="text-white/30" />
                {article.date}
              </span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span className="flex items-center gap-1.5">
                <Clock size={13} className="text-white/30" />
                {article.readingTime}
              </span>
            </div>
          </div>
        </div>

        {!isPreview && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/25 text-[10px] tracking-[0.12em] uppercase">
            <span>Ler artigo</span>
            <div className="w-px h-8 bg-gradient-to-b from-white/25 to-transparent animate-pulse" />
          </div>
        )}
      </section>

      {/* ─── ARTICLE CONTENT ─── */}
      <section className="py-16 lg:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-10">
          <article>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h2: ({ children }) => (
                  <h2 className="text-2xl font-bold text-[#002e35] mt-10 mb-4 leading-tight">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-xl font-bold text-[#002e35] mt-8 mb-3 leading-tight">{children}</h3>
                ),
                p: ({ children }) => (
                  <p className="text-base leading-[1.8] text-gray-600 mb-4">{children}</p>
                ),
                strong: ({ children }) => (
                  <strong className="font-bold text-[#002e35]">{children}</strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-[#002e35]">{children}</em>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-[#d7de6a] bg-[#d7de6a]/5 pl-5 py-3 pr-4 my-6 rounded-r-lg text-[#004a54] italic">
                    {children}
                  </blockquote>
                ),
                hr: () => <hr className="my-10 border-[#ebeceb]" />,
                ul: ({ children }) => (
                  <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1.5">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside text-gray-600 mb-4 space-y-1.5">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="text-base leading-[1.8]">{children}</li>
                ),
                a: ({ href, children }) => (
                  <a href={href} className="text-[#004a54] underline hover:text-[#d7de6a] transition-colors">{children}</a>
                ),
                table: ({ children }) => (
                  <div className="my-8 overflow-x-auto">
                    <table className="w-full text-sm border-collapse">{children}</table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-[#f1f1f1]">{children}</thead>
                ),
                th: ({ children }) => (
                  <th className="text-left p-3 font-semibold text-[#002e35]">{children}</th>
                ),
                td: ({ children }) => (
                  <td className="p-3 text-gray-600 border-b border-[#ebeceb]">{children}</td>
                ),
                code: ({ children }) => (
                  <code className="bg-[#f1f1f1] text-[#004a54] px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
                ),
              }}
            >
              {article.content}
            </ReactMarkdown>
          </article>

          {/* Share */}
          <div className="flex items-center justify-between mt-12 pt-8 border-t border-[#ebeceb]">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">Partilhar:</span>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  setShareOpen(true);
                  setTimeout(() => setShareOpen(false), 2000);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#ebeceb] text-sm text-gray-500 hover:border-[#d7de6a] hover:text-[#002e35] transition-all"
              >
                <Share2 size={14} />
                {shareOpen ? "Link copiado!" : "Copiar link"}
              </button>
            </div>
            <span className={`inline-block px-3 py-1.5 rounded-full text-[11px] font-semibold ${colors.badge}`}>
              {article.categoryLabel}
            </span>
          </div>
        </div>
      </section>

      {/* ─── AUTHOR CARD ─── */}
      {!isPreview && (
        <section className="py-12 bg-[#f1f1f1]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-10">
            <div className="flex items-center gap-5 p-6 rounded-2xl bg-white border border-[#ebeceb]">
              <div className="w-14 h-14 rounded-full bg-[#d7de6a]/15 flex items-center justify-center text-[#d7de6a] text-xl font-bold flex-shrink-0">
                {article.author.charAt(0)}
              </div>
              <div>
                <div className="text-base font-semibold text-[#002e35]">{article.author}</div>
                <div className="text-sm text-gray-400 mb-2">{article.authorRole}</div>
                <p className="text-sm text-gray-500 leading-relaxed">
                  A Issencial é especialista em processos de emigração, educação na Europa e serviços administrativos.
                  Este artigo foi escrito pela nossa equipa para o ajudar a navegar processos burocráticos com confiança.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
