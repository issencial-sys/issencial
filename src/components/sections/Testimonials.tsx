import SectionHeader from "@/components/ui/SectionHeader";

const testimonials = [
  {
    text: "A Issencial transformou a nossa experiência de mudança para a Europa. Profissionalismo e dedicação do início ao fim.",
    name: "Maria Fernandes",
    initials: "MF",
    since: "Cliente desde 2019",
  },
  {
    text: "Excelente serviço de transferências internacionais. Rápido, seguro e com atendimento personalizado. Recomendo!",
    name: "João Silva",
    initials: "JS",
    since: "Cliente desde 2020",
  },
  {
    text: "A inscrição da minha filha numa escola em Lisboa foi impecável. Cuidaram de cada detalhe com muito carinho.",
    name: "Ana Costa",
    initials: "AC",
    since: "Cliente desde 2021",
  },
];

export default function Testimonials() {
  return (
    <section className="py-20 md:py-28 bg-light">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <SectionHeader
          badge="Depoimentos"
          title={<>O que dizem os nossos clientes</>}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <div key={t.name} className="relative rounded-2xl border border-gray-100 bg-white p-8">
              <div className="absolute top-4 right-6 text-6xl font-serif text-accent/30 leading-none">&ldquo;</div>
              <p className="text-gray-500 italic leading-relaxed mb-6 relative z-10">{t.text}</p>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-primary font-bold text-lg">
                  {t.initials}
                </div>
                <div>
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-xs text-gray-400">{t.since}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
