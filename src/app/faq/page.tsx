"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useState } from "react";
import { ChevronDown, Search } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  category: string;
  items: FAQItem[];
}

const faqData: FAQCategory[] = [
  {
    category: "Serviços",
    items: [
      {
        question: "Que tipos de serviços a Issencial oferece?",
        answer: "A Issencial oferece uma gama integrada de serviços incluindo viagens e turismo, educação na Europa (inscrições em escolas e universidades), transferências financeiras internacionais, serviços administrativos e burocráticos, e consultoria personalizada. Trabalhamos com uma rede global de parceiros para oferecer soluções completas aos nossos clientes.",
      },
      {
        question: "Como posso solicitar um orçamento?",
        answer: "Pode solicitar um orçamento através do formulário de contacto no nosso website, enviando um email para info@issencial.pt ou ligando para +351 210 000 000. Analisaremos o seu caso e apresentaremos uma proposta personalizada num prazo máximo de 48 horas úteis.",
      },
      {
        question: "A Issencial atende clientes fora de Portugal?",
        answer: "Sim! A Issencial tem alcance global e atende clientes em mais de 30 países. Trabalhamos com uma rede de parceiros internacionais para prestar serviços em qualquer parte do mundo, independentemente da localização do cliente.",
      },
      {
        question: "Qual o prazo médio de resposta para um pedido de informação?",
        answer: "O nosso compromisso é responder a todos os pedidos de informação num prazo máximo de 24 horas úteis. Para pedidos de orçamento mais complexos, o prazo pode estender-se até 48 horas úteis, dependendo da complexidade do caso.",
      },
    ],
  },
  {
    category: "Viagens & Turismo",
    items: [
      {
        question: "A Issencial trata de vistos e documentação de viagem?",
        answer: "Sim, auxiliamos os nossos clientes com informação e orientação sobre requisitos de vistos, documentação necessária e procedimentos consulares para diversos destinos. No entanto, a emissão de vistos é da responsabilidade exclusiva das autoridades consulares de cada país.",
      },
      {
        question: "Que tipo de assistência está disponível durante a viagem?",
        answer: "Oferecemos assistência 24/7 durante a sua viagem, incluindo apoio em caso de imprevistos, reagendamento de voos, assistência médica de emergência e apoio consular. O nível de assistência varia conforme o pacote contratado.",
      },
      {
        question: "Trabalham com companhias aéreas específicas?",
        answer: "Trabalhamos com todas as principais companhias aéreas e fornecemos opções que melhor se adequam ao seu orçamento e preferências, sejam voos comerciais, low-cost ou charters. A nossa equipa de viagens encontra as melhores opções disponíveis para cada destino.",
      },
    ],
  },
  {
    category: "Educação",
    items: [
      {
        question: "Como funciona o processo de inscrição em universidades europeias?",
        answer: "O processo começa com uma consulta inicial para entender os seus objetivos académicos. A nossa equipa orienta-o na escolha da instituição e curso, prepara e submete a documentação necessária (certificados, traduções, cartas de motivação), acompanha o processo de candidatura e auxilia na obtenção de visto de estudante e alojamento.",
      },
      {
        question: "A Issencial ajuda com bolsas de estudo?",
        answer: "Sim, fornecemos informação sobre bolsas de estudo disponíveis em diversas instituições europeias e auxiliamos na preparação das candidaturas. No entanto, a atribuição de bolsas é da responsabilidade das instituições de ensino ou entidades financiadoras.",
      },
      {
        question: "A Issencial oferece serviços para estudantes do ensino básico e secundário?",
        answer: "Sim, além do ensino superior, auxiliamos também na inscrição em escolas do ensino básico e secundário em vários países europeus, incluindo escolas públicas, privadas e internacionais. Acompanhamos todo o processo, desde a escolha da escola até à integração do estudante.",
      },
    ],
  },
  {
    category: "Transferências & Pagamentos",
    items: [
      {
        question: "Quanto tempo demora uma transferência internacional?",
        answer: "As transferências SEPA (zona euro) são geralmente processadas no próprio dia útil. Transferências SWIFT para países fora da Europa podem demorar entre 1 a 5 dias úteis, dependendo do país de destino e dos bancos intermediários envolvidos.",
      },
      {
        question: "Quais as taxas aplicadas às transferências?",
        answer: "As taxas variam conforme o montante, moeda e destino da transferência. Trabalhamos com taxas competitivas e total transparência — todas as comissões e taxas de câmbio são comunicadas antes da realização da transferência. Solicite um orçamento para obter uma simulação personalizada.",
      },
      {
        question: "Qual o montante máximo que posso transferir?",
        answer: "Não existe um limite máximo fixo, mas transferências de montante elevado podem estar sujeitas a requisitos adicionais de devido diligence e conformidade regulatória. A nossa equipa orienta-o em todo o processo para garantir a conformidade com a legislação aplicável.",
      },
    ],
  },
  {
    category: "Conta & Segurança",
    items: [
      {
        question: "Os meus dados estão seguros?",
        answer: "Sim, a segurança dos seus dados é a nossa prioridade. Implementamos medidas técnicas e organizativas robustas, incluindo encriptação SSL, firewalls, controlo de acessos restrito e processos rigorosos de proteção de dados em conformidade com o RGPD. Consulte a nossa Política de Privacidade para mais informações.",
      },
      {
        question: "Como posso cancelar um pedido ou serviço?",
        answer: "Para cancelar um pedido ou serviço, entre em contacto connosco através do email info@issencial.pt ou do telefone +351 210 000 000. As condições de cancelamento variam conforme o serviço contratado e serão comunicadas no momento da contratação.",
      },
      {
        question: "A Issencial emite fatura?",
        answer: "Sim, emitimos fatura para todos os serviços prestados, conforme a legislação fiscal portuguesa em vigor. A fatura é enviada por email após a conclusão do serviço ou conforme acordado contratualmente.",
      },
    ],
  },
];

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const toggleItem = (key: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const filteredData = searchQuery.trim()
    ? faqData
        .map((cat) => ({
          ...cat,
          items: cat.items.filter(
            (item) =>
              item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.answer.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        }))
        .filter((cat) => cat.items.length > 0)
    : faqData;

  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="relative bg-primary pt-24 pb-16 md:pb-20 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_25%_25%,#d7de6a_1px,transparent_1px),radial-gradient(circle_at_75%_75%,#d7de6a_1px,transparent_1px)] bg-[length:60px_60px]" />
          <div className="relative z-10 mx-auto max-w-2xl px-4 sm:px-6 lg:px-10 text-center">
            <Badge variant="accent">FAQ</Badge>
            <h1 className="mt-4 text-3xl md:text-4xl font-bold text-white">Perguntas Frequentes</h1>
            <p className="mt-4 text-lg text-white/70">
              Encontre respostas rápidas para as perguntas mais comuns sobre os nossos serviços.
            </p>
          </div>
        </section>

        {/* Search */}
        <section className="border-b border-gray-100 bg-white">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-10 py-6">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Pesquisar perguntas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-light py-3.5 pl-11 pr-4 text-sm outline-none transition-colors focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </section>

        {/* FAQ Content */}
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-10 py-16 md:py-20">
          {filteredData.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Nenhuma pergunta encontrada para &quot;{searchQuery}&quot;.</p>
              <button
                onClick={() => setSearchQuery("")}
                className="mt-4 text-sm font-medium text-primary underline underline-offset-4 hover:text-primary-light"
              >
                Limpar pesquisa
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-12">
              {filteredData.map((category, catIdx) => (
                <section key={category.category}>
                  <h2 className="text-2xl font-bold text-dark mb-6 flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-primary text-sm font-bold">
                      {catIdx + 1}
                    </span>
                    {category.category}
                  </h2>
                  <div className="flex flex-col gap-2">
                    {category.items.map((item, idx) => {
                      const key = `${category.category}-${idx}`;
                      const isOpen = openItems.has(key);
                      return (
                        <div
                          key={key}
                          className="rounded-xl border border-gray-100 bg-white transition-all duration-200 hover:border-gray-200 hover:shadow-sm overflow-hidden"
                        >
                          <button
                            onClick={() => toggleItem(key)}
                            className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition-colors hover:bg-gray-50/50"
                            aria-expanded={isOpen}
                          >
                            <span className="text-sm font-medium text-dark leading-relaxed pr-2">
                              {item.question}
                            </span>
                            <ChevronDown
                              size={18}
                              className={`shrink-0 text-gray-400 transition-transform duration-300 ${
                                isOpen ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                          <div
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${
                              isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                            }`}
                          >
                            <div className="px-6 pb-4 pt-0">
                              <p className="text-sm leading-relaxed text-gray-500 border-t border-gray-100 pt-4">
                                {item.answer}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}

          {/* Still have questions CTA */}
          <div className="rounded-2xl bg-primary p-8 md:p-10 text-center mt-16">
            <h3 className="text-xl font-semibold text-white mb-2">
              Não encontrou o que procura?
            </h3>
            <p className="text-sm text-white/70 mb-6 max-w-md mx-auto">
              A nossa equipa está disponível para responder a qualquer questão. Entre em contacto connosco.
            </p>
            <Button href="/contacto" variant="primary" size="lg">
              Fale Connosco
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
