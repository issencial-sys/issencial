export interface Service {
  slug: string;
  icon: string;
  title: string;
  description: string;
  longDescription: string;
  features: string[];
  stats: { value: string; label: string }[];
  highlights: { title: string; description: string }[];
  faq: { q: string; a: string }[];
}

export const services: Service[] = [
  {
    slug: "viagens-turismo",
    icon: "/assets/icons/viagem-aviao.webp",
    title: "Viagens & Turismo",
    description: "Parceria com agências de viagens para oferecer soluções completas de planeamento, reservas de voos, alojamento e experiências turísticas. Cuidamos de cada detalhe da sua viagem.",
    longDescription: "A Issencial estabeleceu parcerias com as melhores agências de viagens para oferecer soluções completas de planeamento, reservas de voos, alojamento e experiências turísticas personalizadas. Desde viagens de negócios a férias em família, cuidamos de cada detalhe — voos, hotéis, transfers, seguros e experiências — para que possa focar-se no que realmente importa: aproveitar cada momento.",
    features: [
      "Reservas de voos nacionais e internacionais com as melhores companhias aéreas",
      "Alojamento premium em hotéis, resorts e alojamento local selecionado",
      "Pacotes turísticos exclusivos com experiências locais autênticas",
      "Assistência permanente 24 horas por dia, 7 dias por semana",
    ],
    stats: [
      { value: "50+", label: "Destinos disponíveis em todo o mundo" },
      { value: "98%", label: "Clientes satisfeitos com os serviços" },
      { value: "24/7", label: "Suporte permanente em qualquer fuso horário" },
    ],
    highlights: [
      { title: "Parcerias Exclusivas", description: "Aceda a tarifas e experiências privilegiadas através das nossas parcerias com companhias aéreas, redes hoteleiras e operadores turísticos em mais de 50 destinos." },
      { title: "Itinerários Personalizados", description: "Cada viagem é desenhada à medida, com recomendações baseadas nas suas preferências e necessidades específicas." },
      { title: "Melhores Preços Garantidos", description: "Acesso a tarifas exclusivas através das nossas parcerias, garantindo o melhor valor para cada destino." },
    ],
    faq: [
      { q: "Quanto tempo demora a preparar uma viagem?", a: "Para viagens simples, podemos ter tudo pronto em 24 a 48 horas. Para roteiros mais complexos, recomendamos um planeamento com 1 a 2 semanas de antecedência para garantir as melhores opções." },
      { q: "Posso cancelar ou alterar a reserva?", a: "Sim, mas as condições de cancelamento variam conforme os fornecedores. Apresentamos sempre as políticas detalhadas antes de confirmar qualquer reserva, para que possa decidir com total conhecimento." },
      { q: "Oferecem seguro de viagem?", a: "Sim, temos parceria com as principais seguradoras e podemos incluir seguro de viagem completo no seu pacote, com cobertura médica, bagagem e cancelamento." },
    ],
  },
  {
    slug: "educacao-europa",
    icon: "/assets/icons/licenciatura.webp",
    title: "Educação na Europa",
    description: "Inscrições em escolas e universidades europeias com acompanhamento completo. Do ensino básico ao pós-graduado, orientamos cada etapa do processo educativo.",
    longDescription: "Realizar o sonho de estudar na Europa está ao seu alcance. A Issencial oferece um serviço completo de orientação educacional, desde a escolha da instituição até à integração no novo país. Acompanhamos cada etapa do processo para garantir uma transição tranquila e bem-sucedida.",
    features: [
      "Orientação na escolha de escolas e universidades europeias",
      "Apoio completo no processo de inscrição e matrícula",
      "Assessoria na documentação necessária e vistos de estudante",
      "Acompanhamento contínuo durante todo o percurso académico",
    ],
    stats: [
      { value: "30+", label: "Instituições de ensino parceiras na Europa" },
      { value: "95%", label: "Taxa de sucesso nas candidaturas" },
      { value: "12", label: "Países europeus com opções de estudo" },
    ],
    highlights: [
      { title: "Orientação Personalizada", description: "Analisamos o perfil e objetivos de cada estudante para recomendar as melhores instituições e cursos, alinhados com as suas aspirações académicas e profissionais." },
      { title: "Processo Simplificado", description: "Cuidamos de toda a burocracia: inscrições, documentação, equivalências e vistos, para que o estudante se possa focar no que realmente importa." },
    ],
    faq: [
      { q: "Quais os requisitos para estudar na Europa?", a: "Os requisitos variam conforme o país e a instituição. Em geral, são necessários certificados de habilitações, proficiência no idioma e documentação pessoal. A nossa equipa orienta em cada etapa." },
      { q: "Quanto tempo demora o processo de inscrição?", a: "O processo pode demorar entre 2 a 6 meses, dependendo da instituição e do país. Recomendamos iniciar o planeamento com pelo menos 6 meses de antecedência." },
      { q: "Ajudam com o visto de estudante?", a: "Sim, prestamos assessoria completa para a obtenção do visto de estudante, incluindo orientação sobre a documentação necessária e preparação para a entrevista consular." },
    ],
  },
  {
    slug: "transferencias",
    icon: "/assets/icons/dinheiro-dolar.webp",
    title: "Transferências Internacionais",
    description: "Serviços de transferência financeira internacionais seguros e rápidos. Melhores taxas do mercado com total transparência e segurança bancária.",
    longDescription: "A Issencial facilita as suas transferências financeiras internacionais com rapidez, segurança e as melhores taxas do mercado. Seja para envio de remessas, pagamento de serviços ou câmbio de moeda, oferecemos soluções transparentes e eficientes para cada necessidade.",
    features: [
      "Transferências SEPA para toda a zona euro com processamento no próprio dia",
      "Transferências SWIFT internacionais com rastreamento em tempo real",
      "Taxas de câmbio competitivas com total transparência",
      "Segurança bancária garantida com conformidade regulatória",
    ],
    stats: [
      { value: "100+", label: "Países com capacidade de transferência" },
      { value: "24h", label: "Processamento médio para transferências SEPA" },
      { value: "0", label: "Comissões ocultas — total transparência" },
    ],
    highlights: [
      { title: "Transparência Total", description: "Todas as taxas e câmbios são apresentados claramente antes da confirmação. Sem surpresas, sem comissões escondidas." },
      { title: "Rastreamento em Tempo Real", description: "Acompanhe cada etapa da sua transferência com notificações e rastreamento atualizado, desde o envio até à receção." },
    ],
    faq: [
      { q: "Quanto tempo demora uma transferência internacional?", a: "Transferências SEPA (zona euro) são processadas no próprio dia útil. Transferências SWIFT para outros países podem demorar entre 1 a 5 dias úteis, dependendo do destino." },
      { q: "Quais as taxas aplicadas?", a: "As taxas variam conforme o montante, moeda e destino. Apresentamos sempre o custo total antes da confirmação, sem comissões ocultas." },
      { q: "Qual o montante máximo que posso transferir?", a: "Os limites dependem do país de origem e destino, bem como da regulamentação local. Consulte-nos para transferências de montantes elevados." },
    ],
  },
  {
    slug: "servicos-administrativos",
    icon: "/assets/icons/www.webp",
    title: "Serviços Administrativos",
    description: "Gestão completa de processos burocráticos e documentais. Poupamos-lhe tempo e garantimos conformidade com todas as regulamentações.",
    longDescription: "A burocracia não tem de ser complicada. A Issencial cuida de toda a gestão documental e processual, desde traduções certificadas até processos legais complexos. A nossa equipa especializada garante que cada documento seja tratado com o máximo rigor e eficiência.",
    features: [
      "Tradução e certificação de documentos oficiais em vários idiomas",
      "Gestão de documentação para processos de imigração e residência",
      "Assessoria em processos legais e notariais",
      "Acompanhamento de processos burocráticos junto de entidades oficiais",
    ],
    stats: [
      { value: "500+", label: "Processos concluídos com sucesso" },
      { value: "15+", label: "Anos de experiência em gestão documental" },
      { value: "98%", label: "Taxa de conformidade e aprovação" },
    ],
    highlights: [
      { title: "Eficiência Garantida", description: "Processos complexos geridos com rapidez e precisão, poupando-lhe tempo e evitando erros que podem atrasar todo o processo." },
      { title: "Acompanhamento Personalizado", description: "Cada processo é acompanhado por um gestor dedicado que o mantém informado de cada etapa e progresso." },
    ],
    faq: [
      { q: "Quanto tempo demora a tradução certificada de documentos?", a: "Traduções simples ficam prontas em 2 a 3 dias úteis. Documentos mais complexos ou certificados podem demorar até 5 dias úteis." },
      { q: "Aceitam documentos de qualquer país?", a: "Sim, trabalhamos com documentos de todos os países. Cada documento é analisado individualmente para garantir conformidade com os requisitos legais." },
      { q: "Fazem reconhecimento notarial de documentos?", a: "Sim, prestamos serviços de reconhecimento notarial e apostilamento de documentos, com validação internacional conforme a Convenção de Haia." },
    ],
  },
];

export function getServiceBySlug(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}
