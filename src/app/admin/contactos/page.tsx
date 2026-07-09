"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, Mail, Trash2, AlertCircle, Send, RotateCcw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Contact {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  created_at: string;
}

export default function AdminContactosPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    const { data } = await supabase
      .from("contact_submissions")
      .select("*")
      .order("created_at", { ascending: false });
    setContacts(data ?? []);
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    await supabase.from("contact_submissions").update({ read: true }).eq("id", id);
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, read: true } : c)),
    );
  };

  const markAsUnread = async (id: string) => {
    await supabase.from("contact_submissions").update({ read: false }).eq("id", id);
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, read: false } : c)),
    );
  };

  const deleteContact = async (id: string) => {
    await supabase.from("contact_submissions").delete().eq("id", id);
    setContacts((prev) => prev.filter((c) => c.id !== id));
    if (selected === id) setSelected(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  const selectedContact = contacts.find((c) => c.id === selected);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Contactos Recebidos</h1>
        <p className="text-gray-500 mt-1">
          Gerir submissões do formulário de contacto.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="lg:col-span-1 rounded-2xl border border-gray-200 bg-white overflow-hidden max-h-[600px] overflow-y-auto">
          {contacts.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">
              Nenhum contacto recebido.
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {contacts.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelected(c.id);
                    if (!c.read) markAsRead(c.id);
                  }}
                  className={`w-full text-left px-5 py-4 transition-colors hover:bg-gray-50 ${
                    selected === c.id ? "bg-primary/5" : ""
                  } ${!c.read ? "border-l-2 border-accent" : ""}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-900">
                      {c.name}
                    </span>
                    {!c.read && (
                      <span className="w-2 h-2 rounded-full bg-accent" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mb-0.5">{c.subject}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(c.created_at).toLocaleDateString("pt-PT")}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detail */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-6">
          {selectedContact ? (
            <div>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedContact.name}
                  </h2>
                  <p className="text-sm text-gray-400">
                    {selectedContact.email}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(selectedContact.created_at).toLocaleString(
                      "pt-PT",
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => markAsUnread(selectedContact.id)}
                    className="p-2 rounded-lg text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 transition-all"
                    title="Marcar como não lido"
                  >
                    <RotateCcw size={17} />
                  </button>
                  <button
                    onClick={() => deleteContact(selectedContact.id)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Assunto
                </span>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {selectedContact.subject}
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Mensagem
                </span>
                <p className="text-sm text-gray-700 mt-1 leading-relaxed whitespace-pre-wrap">
                  {selectedContact.message}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
                  Responder
                </h3>
                {/* Inline reply form */}
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-gray-400">
                    A responder a{" "}
                    <a href={`mailto:${selectedContact.email}`} className="text-primary font-medium hover:underline">
                      {selectedContact.email}
                    </a>
                    {selectedContact.subject && ` — ${selectedContact.subject}`}
                  </p>
                  <a
                    href={`mailto:${selectedContact.email}?subject=Resposta: ${selectedContact.subject}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-light transition-all self-start"
                  >
                    <Mail size={16} />
                    Abrir no Email
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Mail size={40} className="mb-4 text-gray-200" />
              <p>Selecione um contacto para ver os detalhes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
