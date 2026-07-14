"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SectionHeader from "@/components/ui/SectionHeader";
import { blogArticles as staticArticles } from "@/data/blog";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight, Clock, Calendar, Search, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface ArticleItem {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  categoryLabel: string;
  author: string;
  date: string;
  readingTime: string;
  image?: string;
  is_featured?: boolean;
}

const categoryFilters = [
  { value: "all", label: "Todos" },
  { value: "passaporte", label: "Passaporte & Vistos" },
  { value: "educacao", label: "Educação" },
  { value: "financas", label: "Finanças" },
  { value: "viver-portugal", label: "Viver em Portugal" },
  { value: "historias", label: "Histórias" },
] as const;

const categoryBadge: Record<string, string> = {
  passaporte: "bg-[#004a54]/10 text-[#004a54]",
  educacao: "bg-[#1a4a40]/10 text-[#1a4a40]",
  financas: "bg-[#3a4a20]/10 text-[#3a4a20]",
  "viver-portugal": "bg-[#2a3a45]/10 text-[#2a3a45]",
  historias: "bg-[#4a2a35]/10 text-[#4a2a35]",
};

const categoryGradients: Record<string, string> = {
  passaporte: "from-[#002e35] to-[#004a54]",
  educacao: "from-[#002e35] to-[#1a4a40]",
  financas: "from-[#002e35] to-[#3a4a20]",
  "viver-portugal": "from-[#002e35] to-[#2a3a45]",
  historias: "from-[#002e35] to-[#4a2a35]",
};

const ARTICLES_PER_PAGE = 6;

export default function BlogPageContent() {
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeMsg, setSubscribeMsg] = useState<{ success: boolean; text: string } | null>(null);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    setLoading(true);

    // Try Supabase first
    const supabase = createClient();
    const { data: dbArticles } = await supabase
      .from("blog_articles")
      .select("slug, title, excerpt, category, category_label, author, date, reading_time, image, is_featured")
      .eq("status", "published")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });

    if (dbArticles && dbArticles.length > 0) {
      setArticles(
        dbArticles.map((a: any) => ({
          slug: a.slug,
          title: a.title,
          excerpt: a.excerpt,
          category: a.category,
          categoryLabel: a.category_label,
          author: a.author,
          date: a.date,
          readingTime: a.reading_time,
          image: a.image || undefined,
          is_featured: a.is_featured || false,
        }))
      );
    } else {
      // Fallback to static data, sorted by date
      const monthMap: Record<string, string> = {
        Jan: "01", Fev: "02", Mar: "03", Abr: "04", Mai: "05", Jun: "06",
        Jul: "07", Ago: "08", Set: "09", Out: "10", Nov: "11", Dez: "12",
      };
      const sorted = [...staticArticles].sort((a, b) => {
        const parseDate = (d: string) => {
          const parts = d.split(" ");
          if (parts.length !== 3) return 0;
          const day = parts[0].padStart(2, "0");
          const month = monthMap[parts[1]] || "01";
          return parseInt(`${parts[2]}${month}${day}`, 10);
        };
        return parseDate(b.date) - parseDate(a.date);
      });
      setArticles(
        sorted.map((a, i) => ({
          slug: a.slug,
          title: a.title,
          excerpt: a.excerpt,
          category: a.category,
          categoryLabel: a.categoryLabel,
          author: a.author,
          date: a.date,
          readingTime: a.readingTime,
          image: (a as any).image || undefined,
          is_featured: i === 0,
        }))
      );
    }

    setLoading(false);
  };

  // Filter by category + search
  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      const matchesCategory = activeCategory === "all" || article.category === activeCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [articles, activeCategory, searchQuery]);

  // Paginate
  const paginatedArticles = filteredArticles.slice(0, currentPage * ARTICLES_PER_PAGE);
  // Use the article marked as featured, otherwise the first article
  const featured = articles.find((a) => a.is_featured) || articles[0];

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center bg-white pt-24">
          <Loader2 size={28} className="animate-spin text-primary" />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main>
        {/* ─── HERO ─── */}
        <section className="relative py-24 lg:py-32 bg-white overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute w-[600px] h-[600px] rounded-full border border-[#d7de6a]/10 -top-[200px] -right-[150px]" />
            <div className="absolute w-[400px] h-[400px] rounded-full border border-[#d7de6a]/8 -bottom-[120px] -left-[100px]" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
            <SectionHeader
              badge="Issencial Blog"
              title={<>O seu guia para <span className="bg-gradient-to-r from-[#bcc44e] to-[#d7de6a] bg-clip-text text-transparent">viver sem fronteiras</span></>}
              description="Histórias, guias e conselhos práticos sobre passaportes, educação na Europa, finanças internacionais e tudo o que precisa para simplificar a sua vida."
            />

            {/* Search bar */}
            <div className="max-w-md mx-auto mt-8 relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
              <input
                type="text"
                placeholder="Pesquisar artigos..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full rounded-xl border border-[#ebeceb] bg-white py-3.5 pl-11 pr-10 text-sm text-[#151e28] outline-none transition-all placeholder:text-gray-300 focus:border-[#d7de6a]/50 focus:ring-1 focus:ring-[#d7de6a]/20"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-[#002e35] transition-colors"
                  aria-label="Limpar pesquisa"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ─── FEATURED ARTICLE ─── */}
        {activeCategory === "all" && !searchQuery && featured && (
          <section className="-mt-8 pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
              <Link
                href={`/blog/${featured.slug}`}
                className="group block rounded-2xl overflow-hidden bg-[#f1f1f1] transition-all duration-300 hover:shadow-[0_20px_60px_rgba(0,46,53,0.06)]"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                  <div className={`relative min-h-[300px] md:min-h-[400px] bg-gradient-to-br ${categoryGradients[featured.category]} flex items-center justify-center overflow-hidden`}>
                    {/* Pattern overlay — always visible behind the image or as fallback */}
                    <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle_at_50%_50%,#d7de6a_1px,transparent_1px)] bg-[length:40px_40px]" />
                    {featured.image && (
                      <img
                        src={featured.image}
                        alt={featured.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                    <div className="absolute top-4 left-4">
                      <span className="inline-block px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-white/15 text-white backdrop-blur-sm">
                        Em Destaque
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center p-8 lg:p-10">
                    <span className={`inline-block w-fit px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider mb-4 ${categoryBadge[featured.category]}`}>
                      {featured.categoryLabel}
                    </span>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#002e35] leading-tight mb-3 group-hover:text-[#004a54] transition-colors">
                      {featured.title}
                    </h2>
                    <p className="text-sm text-gray-500 leading-relaxed mb-5 line-clamp-2">
                      {featured.excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-400 mb-5">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={12} />
                        {featured.date}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={12} />
                        {featured.readingTime}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#bcc44e] transition-all duration-300 group-hover:gap-3">
                      Ler Artigo
                      <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          </section>
        )}

        {/* ─── CATEGORY FILTERS ─── */}
        <section className="pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
            <div className="flex flex-wrap gap-2.5">
              {categoryFilters.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => handleCategoryChange(cat.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    activeCategory === cat.value
                      ? "bg-[#d7de6a] text-[#002e35] font-semibold"
                      : "bg-transparent text-gray-500 border border-[#ebeceb] hover:border-[#d7de6a] hover:text-[#002e35]"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ─── ARTICLE GRID ─── */}
        <section className="pb-16 lg:pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
            {filteredArticles.length === 0 ? (
              <div className="text-center py-20">
                <h3 className="text-lg font-semibold text-[#002e35] mb-2">Nenhum artigo encontrado</h3>
                <p className="text-sm text-gray-400 mb-4">Nenhum artigo corresponde à sua pesquisa.</p>
                <button
                  onClick={() => { setSearchQuery(""); setActiveCategory("all"); }}
                  className="text-sm font-medium text-[#bcc44e] hover:text-[#d7de6a] transition-colors underline underline-offset-4"
                >
                  Limpar filtros
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                  {paginatedArticles.map((article, index) => (
                    <ArticleCard key={article.slug} article={article} index={index} />
                  ))}
                </div>

                {/* Load More */}
                {paginatedArticles.length < filteredArticles.length && (
                  <div className="text-center mt-12">
                    <button
                      onClick={() => setCurrentPage((p) => p + 1)}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-[#ebeceb] text-sm font-semibold text-[#002e35] hover:border-[#d7de6a] hover:bg-[#d7de6a]/5 transition-all"
                    >
                      Carregar mais artigos
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* ─── NEWSLETTER ─── */}
        <section className="py-16 lg:py-20 bg-[#002e35] relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute w-[300px] h-[300px] rounded-full border border-[#d7de6a]/5 -top-[100px] -right-[80px]" />
            <div className="absolute w-[200px] h-[200px] rounded-full border border-[#d7de6a]/4 bottom-[15%] left-[5%]" />
          </div>
          <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(circle_at_50%_50%,#d7de6a_1px,transparent_1px)] bg-[length:40px_40px]" />

          <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 lg:px-10 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Receba os melhores artigos
            </h2>
            <p className="text-sm text-white/55 max-w-md mx-auto mb-8 leading-relaxed">
              Subscreva a nossa newsletter e receba guias, dicas e histórias diretamente no seu email.
              Sem spam. Apenas conteúdo útil para a sua vida.
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const emailInput = form.querySelector('input[type="email"]') as HTMLInputElement;
                if (!emailInput?.value) return;

                setSubscribing(true);
                setSubscribeMsg(null);

                try {
                  const res = await fetch("/api/newsletter/subscribe", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: emailInput.value }),
                  });
                  const data = await res.json();

                  if (res.ok) {
                    setSubscribeMsg({ success: true, text: data.message });
                    emailInput.value = "";
                  } else {
                    setSubscribeMsg({ success: false, text: data.error || "Erro ao subscrever." });
                  }
                } catch {
                  setSubscribeMsg({ success: false, text: "Erro de conexão." });
                }

                setSubscribing(false);
              }}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <input
                type="email"
                placeholder="O seu email"
                required
                className="flex-1 px-4 py-3 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#d7de6a]/50 focus:bg-white/10 transition-all"
              />
              <button
                type="submit"
                disabled={subscribing}
                className="px-5 py-3 rounded-lg bg-[#d7de6a] text-[#002e35] text-sm font-semibold hover:bg-[#e3e88f] transition-all whitespace-nowrap disabled:opacity-50 flex items-center gap-2 justify-center"
              >
                {subscribing ? (
                  <><Loader2 size={14} className="animate-spin" /> A subscrever...</>
                ) : (
                  "Subscrever"
                )}
              </button>
            </form>
            {subscribeMsg && (
              <div className={`mt-4 flex items-center gap-2 justify-center text-sm ${subscribeMsg.success ? "text-white" : "text-red-300"}`}>
                {subscribeMsg.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {subscribeMsg.text}
              </div>
            )}
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 mt-12 pt-8 border-t border-white/5">
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-white/25">
              <span>Junte-se a centenas de leitores</span>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

/* ─── ARTICLE CARD ─── */
function ArticleCard({ article, index }: { article: ArticleItem; index: number }) {
  const badge = categoryBadge[article.category] || categoryBadge.passaporte;
  const gradient = categoryGradients[article.category] || categoryGradients.passaporte;

  return (
    <Link
      href={`/blog/${article.slug}`}
      className="group rounded-xl border border-[#ebeceb] bg-white overflow-hidden transition-all duration-300 hover:border-[#d7de6a]/30 hover:shadow-[0_12px_40px_rgba(0,46,53,0.06)] hover:-translate-y-1"
      style={{
        animation: `fadeInUp 0.5s ease-out both`,
        animationDelay: `${index * 0.06}s`,
      }}
    >
      <div className={`relative h-44 overflow-hidden bg-gradient-to-br ${gradient}`}>
        {/* Pattern overlay — always visible behind the image or as fallback */}
        <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(circle_at_50%_50%,#d7de6a_1px,transparent_1px)] bg-[length:30px_30px]" />
        {article.image && (
          <img
            src={article.image}
            alt={article.title}
            className="relative z-10 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        )}
      </div>

      <div className="p-5">
        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider mb-3 ${badge}`}>
          {article.categoryLabel}
        </span>

        <h3 className="text-sm font-bold text-[#002e35] leading-snug mb-2 group-hover:text-[#004a54] transition-colors line-clamp-2">
          {article.title}
        </h3>

        <p className="text-xs text-gray-400 leading-relaxed mb-4 line-clamp-2">
          {article.excerpt}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-[10px] text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar size={10} />
              {article.date}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={10} />
              {article.readingTime}
            </span>
          </div>
          <ArrowRight size={12} className="text-[#bcc44e] opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
        </div>
      </div>
    </Link>
  );
}
