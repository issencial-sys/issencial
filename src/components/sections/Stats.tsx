const stats = [
  { value: "15+", label: "Anos de Experiência" },
  { value: "5.000+", label: "Clientes Satisfeitos" },
  { value: "30+", label: "Países Alcançados" },
  { value: "98%", label: "Taxa de Satisfação" },
];

export default function Stats() {
  return (
    <section className="bg-primary py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-accent mb-2">{stat.value}</div>
              <div className="text-sm text-white/70">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
