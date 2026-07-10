export interface BlogArticle {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: "passaporte" | "educacao" | "financas" | "viver-portugal" | "historias";
  categoryLabel: string;
  author: string;
  authorRole: string;
  date: string;
  readingTime: string;
  image?: string;
  relatedSlugs?: string[];
}

export const blogArticles: BlogArticle[] = [
  {
    slug: "novo-passaporte-portugues-2026",
    title: "Novo Passaporte Português 2026: Tudo o que precisa de saber",
    excerpt: "O novo modelo do passaporte português chegou com mais segurança e um design renovado. Guia completo sobre prazos, documentos necessários e como acelerar o processo.",
    content: `O novo passaporte português já está em circulação desde o início de 2026, trazendo consigo um design renovado e funcionalidades de segurança avançadas. Se está a planear renovar ou emitir o seu passaporte pela primeira vez, este guia vai ajudá-lo a navegar todo o processo.

## O que mudou no novo passaporte?

O Instituto dos Registos e do Notariado (IRN) introduziu várias novidades no novo modelo:

- **Design atualizado**: O novo passaporte apresenta um design mais moderno, com elementos da cultura portuguesa incorporados nas páginas internas.
- **Segurança reforçada**: Novos elementos de segurança, incluindo hologramas mais complexos e chips eletrónicos de última geração.
- **Página de dados redesenhada**: A página com os dados do titular foi redesenhada para ser mais legível e segura.

## Documentos necessários

Para emitir ou renovar o passaporte, precisa dos seguintes documentos:

1. **Cartão de Cidadão** válido (ou documento de identificação equivalente)
2. **Fotografia** atual (tipo passe, fundo branco)
3. **Passaporte anterior** (se for renovação)
4. **Comprovativo de residência** (se aplicável)
5. **Formulário de requerimento** preenchido

> **Dica Issencial**: Verifique se o seu Cartão de Cidadão está válido antes de iniciar o processo. Renovar o CC primeiro pode poupar-lhe uma viagem ao balcão.

## Quanto custa?

| Tipo de passaporte | Preço |
|-------------------|-------|
| Passaporte normal (válido 5 anos) | €65,00 |
| Passaporte especial (válido 5 anos) | €85,00 |
| Passaporte de urgência | €100,00 |
| Passaporte de emergência (24h) | €150,00 |

## Prazos de emissão

- **Normal**: 15 a 20 dias úteis
- **Urgente**: 5 a 7 dias úteis
- **Emergência**: 24 a 48 horas

## Como acelerar o processo?

A Issencial pode ajudá-lo a acelerar todo o processo de emissão ou renovação do passaporte. Desde a verificação da documentação até ao acompanhamento do pedido, tratamos de tudo para que não perca tempo com burocracias.

### Vantagens de usar a Issencial:

- Verificação prévia de toda a documentação
- Acompanhamento do estado do pedido em tempo real
- Redução significativa de erros e rejeições
- Atendimento personalizado e confidencial

## Perguntas frequentes

**Preciso de marcar atendimento presencial?**
Sim, é necessário agendar atendimento no balcão de atendimento do IRN ou Loja de Cidadão para a entrega dos dados biométricos.

**O passaporte pode ser entregue em casa?**
Sim, pode optar pela entrega por correio registado, com um custo adicional de €5,00.

**Quanto tempo antes da validade expirar devo renovar?**
Recomendamos iniciar o processo de renovação com pelo menos 6 meses de antecedência para evitar situações de última hora.

---

Precisa de ajuda com o seu processo de passaporte? A equipa Issencial está pronta para o acompanhar em cada etapa.`,
    category: "passaporte",
    categoryLabel: "Passaporte & Vistos",
    author: "Equipa Issencial",
    authorRole: "Especialista em Processos Documentais",
    date: "12 Jun 2026",
    readingTime: "8 min de leitura",
    relatedSlugs: ["renovacao-passaporte-passo-a-passo", "passaporte-para-menores"],
  },
  {
    slug: "renovacao-passaporte-passo-a-passo",
    title: "Renovação de Passaporte: Passo a Passo",
    excerpt: "Tudo o que precisa para renovar o seu passaporte sem dores de cabeça. Prazos, custos e documentos atualizados.",
    content: `Renovar o passaporte parece uma tarefa simples, mas os detalhes podem fazer toda a diferença entre um processo tranquilo e uma dor de cabeça desnecessária. Neste guia, explicamos cada etapa do processo de renovação.

## Passo 1: Verifique a sua documentação

Antes de mais nada, confirme que tem os seguintes documentos em mãos:

- Cartão de Cidadão válido (se estiver expirado, renove-o primeiro)
- Passaporte anterior (mesmo que expirado)
- Fotografia atual (menos de 6 meses)

## Passo 2: Agende o atendimento

O agendamento pode ser feito online através do portal do IRN ou presencialmente numa Loja de Cidadão.

**Documentos a levar no dia do atendimento:**

- Original e cópia do Cartão de Cidadão
- Passaporte anterior
- Duas fotografias tipo passe
- Comprovativo de pagamento da taxa

## Passo 3: Pagamento das taxas

O pagamento pode ser feito por:

- Multibanco (no local)
- Referência multibanco (gerada no momento do agendamento)
- Dinheiro (em alguns balcões)

## Passo 4: Acompanhamento do processo

Após a submissão, pode acompanhar o estado do seu pedido online através do portal do IRN.

## Passo 5: Levantamento ou entrega

Pode optar por:

- Levantar no balcão onde fez o pedido
- Receber por correio registado em casa (custo adicional)

---

**Precisa de ajuda com a renovação?** A Issencial trata de todo o processo por si.`,
    category: "passaporte",
    categoryLabel: "Passaporte & Vistos",
    author: "Equipa Issencial",
    authorRole: "Especialista em Processos Documentais",
    date: "5 Jun 2026",
    readingTime: "6 min de leitura",
    relatedSlugs: ["novo-passaporte-portugues-2026", "passaporte-para-menores"],
  },
  {
    slug: "universidades-europeias-sem-propinas",
    title: "Universidades Europeias sem Propinas? É Possível",
    excerpt: "Alemanha, Noruega, Áustria — conheça os países onde pode estudar sem pagar propinas e como candidatar-se.",
    content: `Estudar na Europa sem pagar propinas não é um mito — é uma realidade em vários países que apostam no ensino superior gratuito ou com custos mínimos. Neste artigo, exploramos as melhores opções para estudar de forma acessível na Europa.

## Países com ensino superior gratuito (ou quase)

### Alemanha

Desde 2014, a maioria das universidades públicas alemãs aboliu as propinas para todos os estudantes, independentemente da nacionalidade.

**O que precisa:**
- Proficiência em alemão (nível B2/C1) para a maioria dos cursos
- Visto de estudante
- Comprovativo de meios financeiros (cerca de €11.200/ano para custos de vida)

### Noruega

As universidades públicas norueguesas não cobram propinas para nenhum estudante, independentemente da nacionalidade.

**O que precisa:**
- Proficiência em inglês (IELTS 6.5+) ou norueguês
- Visto de estudante
- Comprovativo de meios financeiros (cerca de €14.000/ano)

### Áustria

As propinas nas universidades austríacas são mínimas para estudantes internacionais (cerca de €750 por semestre).

## Como candidatar-se?

O processo de candidatura varia de país para país, mas geralmente inclui:

1. Escolha do curso e universidade
2. Verificação dos requisitos de acesso
3. Tradução e autenticação de documentos
4. Submissão da candidatura
5. Candidatura ao visto de estudante

## Como a Issencial pode ajudar?

A Issencial oferece acompanhamento completo no processo de candidatura a universidades europeias, incluindo:

- Orientação na escolha do curso e instituição
- Preparação de toda a documentação
- Tradução certificada de documentos
- Apoio na candidatura ao visto de estudante

---

Está a pensar estudar na Europa sem gastar uma fortuna em propinas? Fale connosco e descubra como podemos ajudá-lo.`,
    category: "educacao",
    categoryLabel: "Educação",
    author: "Equipa Issencial",
    authorRole: "Conselheira Educacional",
    date: "2 Jun 2026",
    readingTime: "7 min de leitura",
    relatedSlugs: ["bolsas-de-estudo-na-europa"],
  },
  {
    slug: "transferencias-internacionais-guia-completo",
    title: "Transferências Internacionais: O Guia Completo",
    excerpt: "Taxas de câmbio, SWIFT vs SEPA, prazos e custos. Tudo o que precisa para enviar dinheiro para o estrangeiro.",
    content: `Enviar dinheiro para o estrangeiro pode parecer complicado, mas com o conhecimento certo, pode poupar tempo e dinheiro. Neste guia, explicamos tudo o que precisa de saber sobre transferências internacionais.

## SEPA vs SWIFT: Qual a diferença?

### Transferências SEPA

A SEPA (Single Euro Payments Area) permite transferências em euros entre países da zona SEPA de forma rápida e económica.

**Características:**
- Processamento no próprio dia útil
- Sem custos adicionais (ou muito reduzidos)
- Montante máximo: geralmente sem limite
- Apenas para transferências em euros

### Transferências SWIFT

A SWIFT é utilizada para transferências internacionais fora da zona SEPA ou em moedas diferentes do euro.

**Características:**
- Processamento em 1 a 5 dias úteis
- Custos mais elevados
- Rastreamento em tempo real
- Suporta múltiplas moedas

## Como escolher a melhor opção?

A escolha entre SEPA e SWIFT depende de vários fatores:

| Fator | SEPA | SWIFT |
|-------|------|-------|
| Destino | Zona SEPA | Qualquer país |
| Moeda | Euros | Todas as moedas |
| Custo | €0-€3 | €10-€50 |
| Prazo | Mesmo dia | 1-5 dias |

## Dicas para poupar nas transferências

1. **Compare as taxas de câmbio** — Nem todas as entidades oferecem o mesmo câmbio
2. **Evite transferências de urgência** — São sempre mais caras
3. **Consolide transferências** — Várias transferências pequenas custam mais do que uma grande
4. **Verifique as taxas escondidas** — Algumas entidades têm comissões ocultas

## Como a Issencial pode ajudar?

A Issencial oferece serviços de transferência internacional com as melhores taxas do mercado e total transparência em todo o processo.`,
    category: "financas",
    categoryLabel: "Finanças",
    author: "Equipa Issencial",
    authorRole: "Especialista Financeiro",
    date: "28 Mai 2026",
    readingTime: "10 min de leitura",
    relatedSlugs: ["como-evitar-comissoes-transferencias"],
  },
  {
    slug: "nif-niss-sns-guia-imigrante-portugal",
    title: "NIF, NISS, SNS: O Guia do Imigrante em Portugal",
    excerpt: "Os primeiros passos burocráticos para quem chega a Portugal. Números, documentos e processos explicados.",
    content: `Chegar a Portugal é entusiasmante, mas a burocracia inicial pode ser esmagadora. Neste guia, explicamos os três números mais importantes que precisa de obter para viver legalmente em Portugal.

## NIF — Número de Identificação Fiscal

O NIF é obrigatório para qualquer pessoa que viva ou faça negócios em Portugal.

**Como obter:**
1. Dirija-se a um balcão das Finanças (AT)
2. Apresente o seu passaporte ou documento de identificação
3. Indique a sua morada fiscal em Portugal
4. O NIF é emitido no momento

**Documentos necessários:**
- Passaporte válido
- Número de contribuinte do país de origem (se aplicável)
- Comprovativo de morada em Portugal

## NISS — Número de Identificação da Segurança Social

O NISS é necessário para trabalhar e ter acesso à segurança social em Portugal.

**Como obter:**
1. Agende atendimento na Segurança Social
2. Apresente o seu NIF e documento de identificação
3. Apresente o contrato de trabalho (se aplicável)

## SNS — Serviço Nacional de Saúde

Para aceder ao SNS, precisa de:

1. Estar registado na Segurança Social
2. Dirigir-se ao centro de saúde da sua área de residência
3. Apresentar NIF, NISS e documento de identificação
4. Solicitar a atribuição de um médico de família

---

**Precisa de ajuda com a sua documentação em Portugal?** A Issencial trata de todo o processo, desde a obtenção do NIF até ao registo no SNS.`,
    category: "viver-portugal",
    categoryLabel: "Viver em Portugal",
    author: "Equipa Issencial",
    authorRole: "Consultora de Relocação",
    date: "25 Mai 2026",
    readingTime: "8 min de leitura",
    relatedSlugs: ["arrendar-casa-portugal-guia-estrangeiros"],
  },
  {
    slug: "consegui-visto-numa-semana-historia-ana",
    title: "\"Consegui o Visto numa Semana\" — A História da Ana",
    excerpt: "A Ana precisava do visto de residência em 10 dias para não perder a oportunidade de trabalho. Como a Issencial a ajudou.",
    content: `Quando a Ana recebeu a oferta de trabalho em Lisboa, o entusiasmo foi imediato. Mas a realidade bateu à porta quando percebeu que precisava do visto de residência em 10 dias — um processo que normalmente leva meses.

## O Desafio

A Ana, brasileira, tinha sido selecionada para uma posição numa empresa de tecnologia em Lisboa. O contrato começava dentro de três semanas e ela precisava de:

- Visto de residência para trabalho
- NIF português
- Número de Segurança Social
- Conta bancária em Portugal

## Como a Issencial entrou em ação

A nossa equipa mobilizou-se imediatamente:

**Dia 1:** Análise completa da documentação da Ana e identificação dos requisitos específicos para o seu caso.

**Dia 2:** Preparação e submissão de toda a documentação necessária para o visto de trabalho.

**Dia 4:** Acompanhamento do processo junto das autoridades competentes.

**Dia 6:** Visto aprovado! A Ana podia viajar para Portugal.

**Dia 8:** Chegada a Portugal com tudo preparado — NIF, NISS e conta bancária já em processo de emissão.

## O Resultado

A Ana chegou a Portugal uma semana antes do início do contrato, com toda a documentação em ordem e pronta para começar a nova vida.

> "Sem a Issencial, teria perdido esta oportunidade incrível. Eles trataram de tudo enquanto eu me preparava para a mudança." — Ana S.

## Como podemos ajudar?

Cada caso é único, mas a nossa abordagem é sempre a mesma: rapidez, eficiência e acompanhamento personalizado. Se precisa de um visto de residência, contacto-nos para uma consulta inicial gratuita.`,
    category: "historias",
    categoryLabel: "Histórias de Clientes",
    author: "Equipa Issencial",
    authorRole: "Gestora de Clientes",
    date: "20 Mai 2026",
    readingTime: "5 min de leitura",
    relatedSlugs: ["nif-niss-sns-guia-imigrante-portugal"],
  },
  {
    slug: "bolsas-de-estudo-na-europa",
    title: "Bolsas de Estudo na Europa: Onde e Como Candidatar-se",
    excerpt: "Erasmus+, bolsas nacionais e fundações privadas. Um roteiro completo para financiar os seus estudos na Europa.",
    content: `Estudar na Europa pode ser mais acessível do que pensa, graças a uma vasta oferta de bolsas de estudo. Neste guia, exploramos as principais opções de financiamento para estudantes internacionais.

## Principais programas de bolsas

### Erasmus+

O programa Erasmus+ é o mais conhecido e abrange não só mobilidade entre universidades, mas também bolsas para estudos completos.

**O que oferece:**
- Bolsas para estudos de 3 a 12 meses
- Apoio para estágios profissionais
- Cobertura de propinas em alguns casos
- Subsídio mensal para custos de vida

### Bolsas nacionais

Muitos países europeus oferecem bolsas específicas para estudantes internacionais:

| País | Programa | Cobertura |
|------|----------|-----------|
| Alemanha | DAAD | Propinas + custos de vida |
| França | Campus France | Propinas + alojamento |
| Suécia | Swedish Institute | Propinas + €10.000/ano |
| Itália | DSU | Propinas + alojamento + refeições |

### Fundações privadas

Diversas fundações privadas oferecem bolsas para estudantes internacionais:

- **Fundação Gulbenkian**: Bolsas para estudantes de países lusófonos
- **Fundação Calouste Gulbenkian**: Bolsas para estudos em Portugal
- **Rotary Foundation**: Bolsas para estudos em qualquer país

## Como maximizar as suas hipóteses?

1. **Candidate-se a múltiplas bolsas** — Não se limite a uma
2. **Prepare uma candidatura forte** — Cartas de motivação bem escritas fazem a diferença
3. **Cumpra todos os prazos** — As candidaturas são rigorosas
4. **Peça ajuda profissional** — A Issencial pode orientá-lo em todo o processo

---

Quer estudar na Europa mas precisa de orientação? A Issencial ajuda-o a encontrar e candidatar-se às melhores bolsas de estudo.`,
    category: "educacao",
    categoryLabel: "Educação",
    author: "Equipa Issencial",
    authorRole: "Conselheira Educacional",
    date: "18 Mai 2026",
    readingTime: "7 min de leitura",
    relatedSlugs: ["universidades-europeias-sem-propinas"],
  },
  {
    slug: "como-evitar-comissoes-transferencias",
    title: "Como Evitar Comissões em Transferências Internacionais",
    excerpt: "Descubra as melhores formas de enviar dinheiro para o estrangeiro sem pagar taxas escondidas.",
    content: `As comissões em transferências internacionais podem representar uma fatia significativa do valor enviado. Neste artigo, mostramos como minimizar ou evitar esses custos.

## Os custos escondidos das transferências

Muitas pessoas olham apenas para a comissão fixa anunciada, mas há outros custos que podem passar despercebidos:

1. **Spread cambial** — A diferença entre a taxa de câmbio real e a taxa aplicada
2. **Comissão de receção** — Taxa cobrada pelo banco do destinatário
3. **Comissão de intermediação** — Taxa de bancos intermediários na transferência SWIFT
4. **Taxa de urgência** — Custo adicional para processamento rápido

## Como poupar

**Compare as taxas de câmbio:**
A diferença entre a taxa de câmbio real e a aplicada pode representar 2-5% do valor total.

**Escolha o método certo:**
- SEPA para transferências em euros dentro da zona SEPA
- Serviços especializados para transferências internacionais

**Evite transferências pequenas:**
O custo fixo é o mesmo para qualquer valor, por isso, consolide as transferências.

## Como a Issencial pode ajudar?

Na Issencial, garantimos total transparência em todas as transferências. O que vê é o que paga — sem comissões ocultas, sem spreads abusivos.`,
    category: "financas",
    categoryLabel: "Finanças",
    author: "Equipa Issencial",
    authorRole: "Especialista Financeiro",
    date: "12 Mai 2026",
    readingTime: "5 min de leitura",
    relatedSlugs: ["transferencias-internacionais-guia-completo"],
  },
  {
    slug: "passaporte-para-menores",
    title: "Passaporte para Menores: Documentos Necessários",
    excerpt: "O processo de emissão de passaporte para crianças e jovens tem regras específicas. Saiba quais.",
    content: `Emitir um passaporte para menores de idade requer documentação adicional e a presença dos pais ou tutores legais. Neste guia, explicamos tudo o que precisa de saber.

## Documentos necessários

Para emitir o passaporte de um menor (idade < 18 anos), são necessários:

1. **Cartão de Cidadão** do menor (válido)
2. **Autorização** de ambos os pais ou tutores legais
3. **Documento de identificação** dos pais/tutores
4. **Fotografia** atual do menor (tipo passe)
5. **Registo Civil** (certidão de nascimento, se aplicável)

## Regras especiais

**Menores de 4 anos:**
- O passaporte tem validade reduzida (2 anos)
- Necessário levar uma fotografia atual (pode ser tirada no momento)

**Menores entre 4 e 18 anos:**
- Passaporte válido por 5 anos
- Presença obrigatória do menor no momento do atendimento

## Ausência de um dos pais

Se um dos pais não puder estar presente, é necessária:

- **Autorização escrita** com reconhecimento notarial da assinatura
- **Documento que comprove a regulação do exercício das responsabilidades parentais** (se aplicável)

---

Precisa de tratar do passaporte do seu filho? A Issencial trata de todo o processo para si.`,
    category: "passaporte",
    categoryLabel: "Passaporte & Vistos",
    author: "Equipa Issencial",
    authorRole: "Especialista em Processos Documentais",
    date: "15 Mai 2026",
    readingTime: "4 min de leitura",
    relatedSlugs: ["novo-passaporte-portugues-2026", "renovacao-passaporte-passo-a-passo"],
  },
  {
    slug: "arrendar-casa-portugal-guia-estrangeiros",
    title: "Arrendar Casa em Portugal: Guia para Estrangeiros",
    excerpt: "Contratos, cauções, fiadores e documentação. Tudo o que precisa para alugar casa em Portugal.",
    content: `Arrendar casa em Portugal sendo estrangeiro pode parecer complicado, mas com a preparação certa, o processo é mais simples do que parece. Neste guia, explicamos cada etapa.

## Documentos necessários

Para arrendar casa em Portugal, geralmente precisa de:

1. **NIF** (Número de Identificação Fiscal) — obrigatório
2. **Visto de residência** ou passaporte válido
3. **Comprovativo de rendimentos** (contrato de trabalho, extratos bancários)
4. **Fiador português** (em alguns casos)
5. **Caução** (geralmente 2 a 3 rendas)

## O contrato de arrendamento

O contrato deve incluir:

- Identificação das partes (senhorio e inquilino)
- Descrição do imóvel
- Valor da renda e condições de pagamento
- Prazo do contrato
- Direitos e obrigações de cada parte

## Dicas importantes

1. **Peça sempre recibo** — As rendas devem ser pagas com recibo emitido pelo senhorio
2. **Verifique as condições do imóvel** — Faça um inventário detalhado na entrada
3. **Conheça os seus direitos** — Em Portugal, o inquilino tem direitos protegidos por lei

---

Precisa de ajuda para encontrar e arrendar casa em Portugal? A Issencial pode ajudá-lo em todo o processo.`,
    category: "viver-portugal",
    categoryLabel: "Viver em Portugal",
    author: "Equipa Issencial",
    authorRole: "Consultora de Relocação",
    date: "9 Mai 2026",
    readingTime: "6 min de leitura",
    relatedSlugs: ["nif-niss-sns-guia-imigrante-portugal"],
  },
];

export function getArticleBySlug(slug: string): BlogArticle | undefined {
  return blogArticles.find((a) => a.slug === slug);
}

export function getRelatedArticles(article: BlogArticle): BlogArticle[] {
  if (!article.relatedSlugs || article.relatedSlugs.length === 0) return [];
  return article.relatedSlugs
    .map((slug) => blogArticles.find((a) => a.slug === slug))
    .filter((a): a is BlogArticle => a !== undefined);
}

export function getArticlesByCategory(category: BlogArticle["category"]): BlogArticle[] {
  return blogArticles.filter((a) => a.category === category);
}
