"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  FileText,
  Eye,
  Edit3,
  Archive,
  Trash2,
  Loader2,
  Calendar,
  ChevronDown,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface BlogArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  category_label: string;
  author: string;
  date: string;
  reading_time: string;
  status: string;
  created_at: string;
}

const categoryColors: Record<string, string> = {
  passaporte: "bg-[#004a54]/10 text-[#004a54]",
  educacao: "bg-[#1a4a40]/10 text-[#1a4a40]",
  financas: "bg-[#3a4a20]/10 text-[#3a4a20]",
  "viver-portugal": "bg-[#2a3a45]/10 text-[#2a3a45]",
  historias: "bg-[#4a2a35]/10 text-[#4a2a35]",
};

const categoryLabels: Record<string, string> = {
  passaporte: "Passaporte & Vistos",
  educacao: "Educação",
  financas: "Finanças",
  "viver-portugal": "Viver em Portugal",
  historias: "Histórias de Clientes",
};

const statusStyles: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-700",
  published: "bg-green-100 text-green-700",
  archived: "bg-gray-100 text-gray-500",
};

export default function AdminBlogPage() {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("blog_articles")
      .select("id, slug, title, excerpt, category, category_label, author, date, reading_time, status, created_at")
      .order("created_at", { ascending: false });

    if (data) setArticles(data as BlogArticle[]);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      const matchesSearch =
        !search ||
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.excerpt.toLowerCase().includes(search.toLowerCase()) ||
        a.author.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = filterCategory === "all" || a.category === filterCategory;
      const matchesStatus = filterStatus === "all" || a.status === filterStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [articles, search, filterCategory, filterStatus]);

  const handleArchive = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "archived" ? "draft" : "archived";
    await supabase.from("blog_articles").update({ status: newStatus }).eq("id", id);
    setArticles((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    );
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem a certeza que deseja eliminar este artigo?")) return;
    setDeleting(id);
    await supabase.from("blog_articles").delete().eq("id", id);
    setArticles((prev) => prev.filter((a) => a.id !== id));
    setDeleting(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog</h1>
          <p className="text-sm text-gray-500 mt-1">
            {articles.length} artigos no total
          </p>
        </div>
        <Link
          href="/admin/blog/novo"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-light transition-all"
        >
          <Plus size={16} />
          Novo Artigo
        </Link>
      </div>

      {/* Search + Filters */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar artigos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-2.5 text-sm text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 placeholder:text-gray-400"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-all"
          >
            <ChevronDown size={14} className={`transition-transform ${showFilters ? "rotate-180" : ""}`} />
            Filtros
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Categoria</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              >
                <option value="all">Todas as categorias</option>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Estado</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              >
                <option value="all">Todos os estados</option>
                <option value="draft">Rascunho</option>
                <option value="published">Publicado</option>
                <option value="archived">Arquivado</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Articles list */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
          <FileText size={40} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-500 font-medium">Nenhum artigo encontrado</p>
          <p className="text-gray-400 text-sm mt-1">
            {search || filterCategory !== "all" || filterStatus !== "all"
              ? "Tente ajustar os filtros ou a pesquisa."
              : "Crie o primeiro artigo para começar."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((article) => (
            <div
              key={article.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:shadow-sm hover:border-gray-300"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${categoryColors[article.category] || categoryColors.passaporte}`}>
                      {article.category_label || categoryLabels[article.category]}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusStyles[article.status] || "bg-gray-100 text-gray-500"}`}>
                      {article.status === "draft" ? "Rascunho" : article.status === "published" ? "Publicado" : "Arquivado"}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 leading-snug mb-1 line-clamp-1">
                    {article.title}
                  </h3>
                  <p className="text-xs text-gray-400 line-clamp-1 mb-2">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-gray-400">
                    <span>{article.author}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span className="flex items-center gap-1">
                      <Calendar size={10} />
                      {article.date}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span>{article.reading_time}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Link
                    href={`/blog/${article.slug}`}
                    target="_blank"
                    className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                    title="Ver no site"
                  >
                    <Eye size={16} />
                  </Link>
                  <Link
                    href={`/admin/blog/${article.id}`}
                    className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                    title="Editar"
                  >
                    <Edit3 size={16} />
                  </Link>
                  <button
                    onClick={() => handleArchive(article.id, article.status)}
                    className={`p-2 rounded-lg transition-all ${
                      article.status === "archived"
                        ? "text-green-500 hover:text-green-600 hover:bg-green-50"
                        : "text-gray-400 hover:text-amber-600 hover:bg-amber-50"
                    }`}
                    title={article.status === "archived" ? "Desarquivar" : "Arquivar"}
                  >
                    <Archive size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(article.id)}
                    disabled={deleting === article.id}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-40"
                    title="Eliminar"
                  >
                    {deleting === article.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
