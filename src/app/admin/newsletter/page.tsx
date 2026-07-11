"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Loader2,
  Send,
  Search,
  Users,
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Eye,
  BarChart3,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ─── Types ───
interface Subscriber {
  id: string;
  email: string;
  name: string;
  status: "active" | "unsubscribed" | "bounced";
  subscribed_at: string;
  unsubscribed_at: string | null;
}

interface BlogArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  category_label: string;
  date: string;
  reading_time: string;
}

interface Campaign {
  id: string;
  subject: string;
  article_title: string;
  issue: number | null;
  recipient_count: number;
  recipient_type: string;
  status: string;
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string;
}

// ─── Constants ───
const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  unsubscribed: "bg-gray-100 text-gray-500",
  bounced: "bg-red-100 text-red-600",
};

const statusLabels: Record<string, string> = {
  active: "Ativo",
  unsubscribed: "Cancelou",
  bounced: "Rejeitado",
};

const campaignStatusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-500",
  queued: "bg-blue-100 text-blue-700",
  sending: "bg-yellow-100 text-yellow-700",
  sent: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
};

const campaignStatusLabels: Record<string, string> = {
  draft: "Rascunho",
  queued: "Agendada",
  sending: "A enviar",
  sent: "Enviada",
  cancelled: "Cancelada",
};

const categoryLabels: Record<string, string> = {
  passaporte: "Passaporte & Vistos",
  educacao: "Educação",
  financas: "Finanças",
  "viver-portugal": "Viver em Portugal",
  historias: "Histórias de Clientes",
};

// ─── Page ───
export default function AdminNewsletterPage() {
  const supabase = createClient();

  // Subscribers
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [subscribersLoading, setSubscribersLoading] = useState(true);
  const [subscriberSearch, setSubscriberSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Articles
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [articleSearch, setArticleSearch] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<BlogArticle | null>(null);
  const [showArticleDropdown, setShowArticleDropdown] = useState(false);

  // Send form
  const [subject, setSubject] = useState("");
  const [intro, setIntro] = useState("");
  const [issue, setIssue] = useState<number>(1);
  const [recipientType, setRecipientType] = useState<"all" | "random" | "manual">("all");
  const [randomCount, setRandomCount] = useState(10);
  const [manualEmails, setManualEmails] = useState<string[]>([]);
  const [manualEmailInput, setManualEmailInput] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

  // Campaigns
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [showCampaigns, setShowCampaigns] = useState(false);

  // Load data
  useEffect(() => {
    loadSubscribers();
    loadArticles();
    loadCampaigns();
  }, []);

  const loadSubscribers = async () => {
    setSubscribersLoading(true);
    const { data } = await supabase
      .from("newsletter_subscribers")
      .select("*")
      .order("subscribed_at", { ascending: false });
    setSubscribers(data ?? []);
    setSubscribersLoading(false);
  };

  const loadArticles = async () => {
    setArticlesLoading(true);
    const { data } = await supabase
      .from("blog_articles")
      .select("id, slug, title, excerpt, category, category_label, date, reading_time")
      .eq("status", "published")
      .order("created_at", { ascending: false });
    setArticles(data ?? []);
    setArticlesLoading(false);
  };

  const loadCampaigns = async () => {
    setCampaignsLoading(true);
    const { data } = await supabase
      .from("newsletter_campaigns")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);
    setCampaigns(data ?? []);
    setCampaignsLoading(false);
  };

  // ─── Filters ───
  const filteredSubscribers = useMemo(() => {
    return subscribers.filter((s) => {
      const matchesSearch =
        !subscriberSearch ||
        s.email.toLowerCase().includes(subscriberSearch.toLowerCase()) ||
        s.name.toLowerCase().includes(subscriberSearch.toLowerCase());
      const matchesStatus = statusFilter === "all" || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [subscribers, subscriberSearch, statusFilter]);

  const filteredArticles = useMemo(() => {
    if (!articleSearch) return articles;
    const q = articleSearch.toLowerCase();
    return articles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        (a.category_label || "").toLowerCase().includes(q)
    );
  }, [articles, articleSearch]);

  const activeSubscribersCount = subscribers.filter((s) => s.status === "active").length;

  // ─── Select article ───
  const selectArticle = (article: BlogArticle) => {
    setSelectedArticle(article);
    setSubject(article.title);
    setShowArticleDropdown(false);
    setArticleSearch("");
  };

  // ─── Add manual email ───
  const addManualEmail = (email: string) => {
    const e = email.toLowerCase().trim();
    if (e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && !manualEmails.includes(e)) {
      setManualEmails([...manualEmails, e]);
    }
    setManualEmailInput("");
  };

  const removeManualEmail = (email: string) => {
    setManualEmails(manualEmails.filter((e) => e !== email));
  };

  // ─── Send newsletter ───
  const handleSend = async () => {
    if (!selectedArticle || !subject.trim()) return;

    setSending(true);
    setSendResult(null);

    const scheduledAt =
      scheduleDate && scheduleTime
        ? new Date(`${scheduleDate}T${scheduleTime}`).toISOString()
        : null;

    const payload: any = {
      subject: subject.trim(),
      article_slug: selectedArticle.slug,
      article_title: selectedArticle.title,
      article_excerpt: selectedArticle.excerpt,
      article_category_label: selectedArticle.category_label,
      issue: issue || null,
      intro: intro.trim(),
      recipient_type: recipientType,
      scheduled_at: scheduledAt,
    };

    if (recipientType === "random") {
      payload.recipient_count = randomCount;
    } else if (recipientType === "manual") {
      payload.recipient_emails = manualEmails;
    }

    try {
      const res = await fetch("/api/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setSendResult({ success: true, message: data.message });
        loadCampaigns();
        // Reset form
        setSelectedArticle(null);
        setSubject("");
        setIntro("");
        setManualEmails([]);
      } else {
        setSendResult({ success: false, message: data.error || "Erro ao enviar." });
      }
    } catch {
      setSendResult({ success: false, message: "Erro de conexão ao servidor." });
    }

    setSending(false);
  };

  // ─── Stats ───
  const StatsRow = () => (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
            <Users size={20} className="text-green-600" />
          </div>
        </div>
        <div className="text-2xl font-bold text-gray-900">{activeSubscribersCount}</div>
        <div className="text-xs text-gray-400 mt-1">Subscritores ativos</div>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
            <BarChart3 size={20} className="text-blue-600" />
          </div>
        </div>
        <div className="text-2xl font-bold text-gray-900">{campaigns.filter(c => c.status === "sent").length}</div>
        <div className="text-xs text-gray-400 mt-1">Campanhas enviadas</div>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
            <Mail size={20} className="text-purple-600" />
          </div>
        </div>
        <div className="text-2xl font-bold text-gray-900">{articles.length}</div>
        <div className="text-xs text-gray-400 mt-1">Artigos publicados</div>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
            <XCircle size={20} className="text-amber-600" />
          </div>
        </div>
        <div className="text-2xl font-bold text-gray-900">
          {subscribers.filter((s) => s.status !== "active").length}
        </div>
        <div className="text-xs text-gray-400 mt-1">Cancelaram / Rejeitados</div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Newsletter</h1>
        <p className="text-sm text-gray-500 mt-1">
          Crie e envie newsletters para os seus subscritores.
        </p>
      </div>

      {/* Stats */}
      <StatsRow />

      {/* ════════════════════════════════════════ */}
      {/* ENVIO — secção principal (em cima) */}
      {/* ════════════════════════════════════════ */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20">
            <Send size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Enviar Newsletter</h2>
            <p className="text-xs text-gray-400">Selecione o artigo e os destinatários</p>
          </div>
        </div>

        {/* Article selector */}
        <div className="mb-5">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">
            Artigo para enviar
          </label>
          {selectedArticle ? (
            <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/5 p-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {selectedArticle.title}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {selectedArticle.category_label || categoryLabels[selectedArticle.category]} · {selectedArticle.date}
                </p>
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="shrink-0 rounded-lg px-3 py-1.5 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all"
              >
                Alterar
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={articleSearch}
                onChange={(e) => {
                  setArticleSearch(e.target.value);
                  setShowArticleDropdown(true);
                }}
                onFocus={() => setShowArticleDropdown(true)}
                placeholder="Pesquisar artigos publicados..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-3 text-sm text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 placeholder:text-gray-400 transition-all"
              />
              {showArticleDropdown && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                  {articlesLoading ? (
                    <div className="flex items-center justify-center gap-2 p-4 text-sm text-gray-400">
                      <Loader2 size={14} className="animate-spin" />
                      A carregar artigos...
                    </div>
                  ) : filteredArticles.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-400">
                      Nenhum artigo encontrado
                    </div>
                  ) : (
                    filteredArticles.map((article) => (
                      <button
                        key={article.id}
                        type="button"
                        onClick={() => selectArticle(article)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold">
                          {article.title.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {article.title}
                          </p>
                          <p className="text-xs text-gray-400 truncate mt-0.25">
                            {article.category_label || categoryLabels[article.category]} · {article.date} · {article.reading_time}
                          </p>
                        </div>
                        <Eye size={14} className="text-gray-300 shrink-0" />
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Subject & Intro */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Assunto do email
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Assunto do email"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 placeholder:text-gray-400 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Número da edição
            </label>
            <input
              type="number"
              min={1}
              value={issue}
              onChange={(e) => setIssue(parseInt(e.target.value) || 1)}
              placeholder="Ex: 12"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 placeholder:text-gray-400 transition-all"
            />
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">
            Introdução (opcional)
          </label>
          <textarea
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
            placeholder="Uma breve introdução para a newsletter..."
            rows={2}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 placeholder:text-gray-400 transition-all resize-none"
          />
        </div>

        {/* Recipient type */}
        <div className="mb-5">
          <label className="block text-xs font-medium text-gray-500 mb-2">
            Destinatários
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "all" as const, label: "Todos os ativos", desc: `${activeSubscribersCount} subscritores` },
              { value: "random" as const, label: "Aleatório", desc: "Número específico" },
              { value: "manual" as const, label: "Manual", desc: "Escolher emails" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setRecipientType(option.value)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all border ${
                  recipientType === option.value
                    ? "border-accent bg-accent/10 text-primary"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    recipientType === option.value
                      ? "border-primary"
                      : "border-gray-300"
                  }`}
                >
                  {recipientType === option.value && (
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </div>
                <span>{option.label}</span>
                <span className="text-xs text-gray-400">({option.desc})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Random count */}
        {recipientType === "random" && (
          <div className="mb-5 p-4 rounded-xl bg-gray-50 border border-gray-200">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Número de envios aleatórios
            </label>
            <input
              type="number"
              min={1}
              max={activeSubscribersCount}
              value={randomCount}
              onChange={(e) => setRandomCount(parseInt(e.target.value) || 1)}
              className="w-full max-w-xs rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
            <p className="text-xs text-gray-400 mt-1.5">
              De {activeSubscribersCount} subscritores ativos, {Math.min(randomCount, activeSubscribersCount)} serão selecionados aleatoriamente.
            </p>
          </div>
        )}

        {/* Manual emails */}
        {recipientType === "manual" && (
          <div className="mb-5 p-4 rounded-xl bg-gray-50 border border-gray-200">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Emails dos destinatários
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="email"
                value={manualEmailInput}
                onChange={(e) => setManualEmailInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addManualEmail(manualEmailInput);
                  }
                }}
                placeholder="email@exemplo.pt"
                className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-gray-400 transition-all"
              />
              <button
                onClick={() => addManualEmail(manualEmailInput)}
                disabled={!manualEmailInput.trim()}
                className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-light transition-all disabled:opacity-40"
              >
                Adicionar
              </button>
            </div>
            {manualEmails.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {manualEmails.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary/5 border border-primary/10 px-3 py-1.5 text-xs text-primary"
                  >
                    {email}
                    <button
                      onClick={() => removeManualEmail(email)}
                      className="text-primary/50 hover:text-red-500 transition-colors"
                    >
                      <XCircle size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-2">
              {manualEmails.length} email(s) selecionado(s). Prima Enter ou vírgula para adicionar.
            </p>
          </div>
        )}

        {/* Schedule */}
        <div className="mb-6">
          <label className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-2">
            <Clock size={14} />
            Agendar envio (opcional)
          </label>
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
            <div className="flex-1">
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Send button + Result */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSend}
            disabled={sending || !selectedArticle || !subject.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-light transition-all disabled:opacity-40 shadow-sm"
          >
            {sending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                A enviar...
              </>
            ) : scheduleDate && scheduleTime ? (
              <>
                <Clock size={16} />
                Agendar Envio
              </>
            ) : (
              <>
                <Send size={16} />
                Enviar Newsletter
              </>
            )}
          </button>

          {sendResult && (
            <div
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm ${
                sendResult.success
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-600 border border-red-200"
              }`}
            >
              {sendResult.success ? (
                <CheckCircle2 size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
              {sendResult.message}
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════ */}
      {/* SUBSCRITORES — secção inferior */}
      {/* ════════════════════════════════════════ */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
              <Users size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Subscritores</h2>
              <p className="text-xs text-gray-400">
                {subscribers.length} total · {activeSubscribersCount} ativos
              </p>
            </div>
          </div>
          <button
            onClick={loadSubscribers}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            title="Atualizar"
          >
            <Loader2 size={14} className={subscribersLoading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={subscriberSearch}
              onChange={(e) => setSubscriberSearch(e.target.value)}
              placeholder="Pesquisar por email ou nome..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 placeholder:text-gray-400 transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
          >
            <option value="all">Todos os estados</option>
            <option value="active">Ativos</option>
            <option value="unsubscribed">Cancelaram</option>
            <option value="bounced">Rejeitados</option>
          </select>
        </div>

        {/* Subscribers list */}
        {subscribersLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-primary" />
          </div>
        ) : filteredSubscribers.length === 0 ? (
          <div className="py-12 text-center">
            <Users size={32} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm text-gray-400 font-medium">
              {subscriberSearch || statusFilter !== "all"
                ? "Nenhum subscritor encontrado com estes filtros."
                : "Ainda não há subscritores."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredSubscribers.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3 transition-all hover:bg-white hover:border-gray-200 hover:shadow-sm"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                  {(sub.name || sub.email).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {sub.name || "Sem nome"}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{sub.email}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                      statusColors[sub.status] || "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {statusLabels[sub.status] || sub.status}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(sub.subscribed_at).toLocaleDateString("pt-PT")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════ */}
      {/* CAMPANHAS — histórico */}
      {/* ════════════════════════════════════════ */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <button
          onClick={() => setShowCampaigns(!showCampaigns)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
              <BarChart3 size={20} className="text-purple-600" />
            </div>
            <div className="text-left">
              <h2 className="text-lg font-semibold text-gray-900">Campanhas Enviadas</h2>
              <p className="text-xs text-gray-400">
                {campaigns.filter(c => c.status === "sent").length} campanhas enviadas
              </p>
            </div>
          </div>
          {showCampaigns ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
        </button>

        {showCampaigns && (
          <div className="border-t border-gray-100 px-6 pb-5">
            {campaignsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={18} className="animate-spin text-primary" />
              </div>
            ) : campaigns.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-400">Nenhuma campanha enviada ainda.</p>
              </div>
            ) : (
              <div className="space-y-2 mt-4">
                {campaigns.map((camp) => (
                  <div
                    key={camp.id}
                    className="flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary text-[10px] font-bold">
                      #{camp.issue || "-"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {camp.subject}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {camp.article_title} · {camp.recipient_count} destinatário(s)
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          campaignStatusColors[camp.status] || "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {campaignStatusLabels[camp.status] || camp.status}
                      </span>
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Calendar size={10} />
                        {new Date(camp.sent_at || camp.created_at).toLocaleDateString("pt-PT")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
