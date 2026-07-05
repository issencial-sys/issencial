import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Badge from "@/components/ui/Badge";
import Link from "next/link";

const sections = [
  {
    id: "termos",
    badge: "Termos de Uso",
    title: "Termos e Condições de Utilização",
    content: [
      {
        heading: "1. Aceitação dos Termos",
        text: "Ao aceder e utilizar o website da Issencial, o utilizador confirma que leu, entendeu e concorda em ficar vinculado pelos presentes Termos e Condições de Utilização. Caso não concorde com qualquer parte destes termos, recomendamos que não utilize os nossos serviços.",
      },
      {
        heading: "2. Definições",
        text: "Para efeitos destes Termos, entende-se por: «Issencial» a sociedade responsável pelos serviços descritos no website; «Utilizador» qualquer pessoa singular ou coletiva que aceda ao website; «Serviços» o conjunto de prestações oferecidas pela Issencial, incluindo mas não limitado a viagens e turismo, educação na Europa, transferências internacionais e serviços administrativos.",
      },
      {
        heading: "3. Utilização do Website",
        text: "O utilizador compromete-se a utilizar o website de forma diligente, correta e lícita, respeitando a legislação em vigor e os presentes Termos. É expressamente proibida a utilização do website para fins ilegais ou não autorizados, incluindo mas não limitado à violação de direitos de propriedade intelectual, disseminação de malware ou falsificação de identidade.",
      },
      {
        heading: "4. Propriedade Intelectual",
        text: "Todo o conteúdo presente no website, incluindo textos, imagens, logótipos, gráficos e elementos de design, é propriedade exclusiva da Issencial ou dos seus licenciadores, estando protegido pelas leis de propriedade intelectual em vigor. É proibida a reprodução, distribuição, modificação ou utilização não autorizada de qualquer conteúdo sem o consentimento prévio por escrito da Issencial.",
      },
      {
        heading: "5. Limitação de Responsabilidade",
        text: "A Issencial esforça-se por manter a informação no website atualizada e precisa, mas não garante a sua completude ou inexistência de erros. Em nenhuma circunstância a Issencial será responsável por danos diretos, indiretos, incidentais ou consequenciais resultantes da utilização ou impossibilidade de utilização do website ou dos serviços nele descritos.",
      },
      {
        heading: "6. Alterações aos Termos",
        text: "A Issencial reserva-se o direito de modificar estes Termos e Condições a qualquer momento, sendo as alterações publicadas nesta página. Recomendamos a consulta periódica desta página para se manter informado sobre as condições aplicáveis. A utilização continuada do website após a publicação de alterações constitui aceitação das mesmas.",
      },
      {
        heading: "7. Lei Aplicável",
        text: "Estes Termos são regidos pela lei portuguesa. Qualquer litígio decorrente da interpretação ou execução dos presentes Termos será submetido à jurisdição exclusiva dos tribunais da comarca de Lisboa, com renúncia expressa a qualquer outro foro.",
      },
    ],
  },
  {
    id: "privacidade",
    badge: "Política de Privacidade",
    title: "Política de Privacidade e Proteção de Dados",
    content: [
      {
        heading: "1. Responsável pelo Tratamento",
        text: "A Issencial é a entidade responsável pelo tratamento dos dados pessoais recolhidos através do website. O tratamento dos seus dados é realizado em conformidade com o Regulamento Geral sobre a Proteção de Dados (RGPD — Regulamento UE 2016/679) e a Lei de Execução nacional aplicável.",
      },
      {
        heading: "2. Dados Recolhidos",
        text: "Podemos recolher os seguintes dados pessoais quando o utilizador preenche o formulário de contacto, solicita um orçamento ou subscreve a nossa newsletter: nome completo, endereço de email, número de telefone e mensagem ou descrição do pedido. Adicionalmente, podem ser recolhidos dados de navegação como endereço IP, tipo de browser e páginas visitadas, através de cookies.",
      },
      {
        heading: "3. Finalidades do Tratamento",
        text: "Os dados pessoais recolhidos destinam-se às seguintes finalidades: responder a pedidos de informação e orçamento; prestar os serviços contratados; cumprir obrigações legais e regulatórias; melhorar a experiência do utilizador no website; e, mediante consentimento, enviar comunicações de marketing e newsletters.",
      },
      {
        heading: "4. Base Legal",
        text: "O tratamento dos seus dados baseia-se nas seguintes bases legais: consentimento do titular (artigo 6.º, n.º 1, alínea a) do RGPD); execução de um contrato ou diligências pré-contratuais (artigo 6.º, n.º 1, alínea b)); cumprimento de obrigações legais (artigo 6.º, n.º 1, alínea c)); e interesse legítimo (artigo 6.º, n.º 1, alínea f)).",
      },
      {
        heading: "5. Partilha de Dados",
        text: "A Issencial não partilha os dados pessoais dos utilizadores com terceiros, exceto quando necessário para a prestação dos serviços (por exemplo, parceiros de viagem ou instituições de ensino), por obrigação legal, ou com prestadores de serviços que atuam como subcontratantes (alojamento web, plataformas de email, etc.), estando estes vinculados a cláusulas contratuais de proteção de dados.",
      },
      {
        heading: "6. Direitos do Titular",
        text: "Ao abrigo do RGPD, o titular dos dados tem direito a: aceder aos seus dados pessoais; solicitar a retificação ou eliminação dos mesmos; solicitar a limitação do tratamento; opor-se ao tratamento; solicitar a portabilidade dos dados; e retirar o consentimento a qualquer momento, sem comprometer a licitude do tratamento efetuado até essa data. Estes direitos podem ser exercidos através do email: privacidade@issencial.pt.",
      },
      {
        heading: "7. Conservação dos Dados",
        text: "Os dados pessoais são conservados pelo período necessário para as finalidades para as quais foram recolhidos, respeitando os prazos legais de conservação aplicáveis. Após esse período, os dados serão eliminados ou anonimizados de forma segura.",
      },
      {
        heading: "8. Segurança",
        text: "A Issencial implementa medidas técnicas e organizativas adequadas para proteger os dados pessoais contra acesso não autorizado, alteração, divulgação ou destruição, incluindo encriptação SSL, firewalls e controlo de acessos restrito.",
      },
    ],
  },
  {
    id: "cookies",
    badge: "Cookies",
    title: "Política de Cookies",
    content: [
      {
        heading: "1. O que são Cookies?",
        text: "Cookies são pequenos ficheiros de texto armazenados no seu dispositivo (computador, tablet ou smartphone) quando visita um website. Permitem que o website reconheça o seu dispositivo e armazene informações sobre as suas preferências ou ações passadas.",
      },
      {
        heading: "2. Tipos de Cookies Utilizados",
        text: "Utilizamos cookies essenciais para o funcionamento do website (cookies de sessão e autenticação); cookies analíticos para compreender como os visitantes interagem com o website (Google Analytics); e cookies funcionais para recordar as suas preferências. Não utilizamos cookies publicitários ou de rastreamento de terceiros.",
      },
      {
        heading: "3. Gestão de Cookies",
        text: "O utilizador pode gerir ou desativar os cookies através das definições do seu browser. Note que a desativação de cookies essenciais pode afetar o funcionamento correto do website. Para mais informações sobre como gerir cookies, consulte a página de ajuda do seu browser.",
      },
      {
        heading: "4. Contacto do Encarregado de Proteção de Dados",
        text: "Para qualquer questão relacionada com a proteção de dados pessoais ou para exercer os seus direitos, pode contactar o nosso Encarregado de Proteção de Dados (DPO) através do email: dpo@issencial.pt ou através do endereço postal: Rua Example, 123, 1200-100 Lisboa, Portugal.",
      },
    ],
  },
];

export default function TermosPrivacidadePage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="relative bg-primary pt-24 pb-16 md:pb-20 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_25%_25%,#d7de6a_1px,transparent_1px),radial-gradient(circle_at_75%_75%,#d7de6a_1px,transparent_1px)] bg-[length:60px_60px]" />
          <div className="relative z-10 mx-auto max-w-2xl px-4 sm:px-6 lg:px-10 text-center">
            <Badge variant="accent">Legal</Badge>
            <h1 className="mt-4 text-3xl md:text-4xl font-bold text-white">Termos, Privacidade e Cookies</h1>
            <p className="mt-4 text-lg text-white/70">
              Conheça os termos que regem a utilização dos nossos serviços e como protegemos os seus dados.
            </p>
          </div>
        </section>

        {/* Navigation tabs */}
        <section className="sticky top-[72px] z-30 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-10 flex gap-8 overflow-x-auto">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="shrink-0 py-4 text-sm font-medium text-gray-500 transition-colors hover:text-primary border-b-2 border-transparent hover:border-primary"
              >
                {s.badge}
              </a>
            ))}
          </div>
        </section>

        {/* Content sections */}
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-10 py-16 md:py-20">
          {sections.map((section, idx) => (
            <section key={section.id} id={section.id} className="mb-16 last:mb-0 scroll-mt-28">
              <Badge className="mb-4">{section.badge}</Badge>
              <h2 className="text-2xl md:text-3xl font-bold text-dark mb-8">
                {section.title}
              </h2>
              <div className="flex flex-col gap-8">
                {section.content.map((block) => (
                  <div key={block.heading}>
                    <h3 className="text-base font-semibold text-dark mb-2">
                      {block.heading}
                    </h3>
                    <p className="text-[15px] leading-relaxed text-gray-500">
                      {block.text}
                    </p>
                  </div>
                ))}
              </div>

              {/* Separator between major sections */}
              {idx < sections.length - 1 && (
                <div className="mt-16 border-t border-gray-100" />
              )}
            </section>
          ))}

          {/* Contact CTA */}
          <div className="rounded-2xl bg-light p-8 md:p-10 text-center mt-12">
            <h3 className="text-lg font-semibold text-dark mb-2">
              Ainda tem dúvidas?
            </h3>
            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
              Se tiver alguma questão sobre os nossos Termos ou Política de Privacidade, estamos aqui para ajudar.
            </p>
            <Link
              href="/contacto"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-light hover:-translate-y-0.5"
            >
              Fale Connosco
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
