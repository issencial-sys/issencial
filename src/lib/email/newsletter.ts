/**
 * Newsletter templates.
 *
 * Two moments, as requested:
 *  1. `newsletterConfirmTemplate` — sent the moment a reader subscribes.
 *     Confirms the opt-in (double opt-in friendly) and sets expectations.
 *  2. `newsletterEditionTemplate` — a sent newsletter edition: a hero
 *     article + a short list of more reads + a quiet unsubscribe link.
 *
 * Editorial visual system:
 *  - accent-spine card (3px left border)
 *  - larger airy type (h2: 26px, body: 15px/1.8)
 *  - inverted accent CTA (lime bg + dark text, sharp 2px)
 *  - accent hairline under logo and footer
 *  - 40px padding throughout, 4px card radius
 */

import {
  shellVariant,
  ctaVariant,
  esc,
  PRIMARY,
  ACCENT,
  INK,
  MUTED,
  FAINT,
  BORDER,
} from "./shared";

function blogHref(path = ""): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const clean = base.replace(/\/+$/, "");
  return clean ? `${clean}/blog${path}` : `/blog${path}`;
}

/** Newsletter issue number helper, e.g. 12 -> "#12". */
function issueLabel(n?: number): string {
  return n != null ? `#${n}` : "";
}

// ============================================================
// 1. Subscribe confirmation
// ============================================================
export function newsletterConfirmTemplate(input: {
  name?: string;
  unsubscribe_url?: string;
}): string {
  const blog = blogHref();
  const preview =
    "Confirmámos a sua subscrição. Vai receber guias, dicas e histórias no seu email.";

  const content = `
    <p style="color:${MUTED};font-size:13px;margin:0 0 4px;">Newsletter · Subscrição confirmada</p>
    <h2 style="color:${INK};font-size:26px;margin:0 0 14px;font-weight:700;line-height:1.25;">
      Bem-vindo à Issencial${esc(input.name ? `, ${input.name}` : "")}
    </h2>
    <p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 20px;">
      A sua subscrição está confirmada. A partir de agora, recebe no seu email os
      melhores guias, dicas e histórias sobre passaportes, educação e viver em
      Portugal — sempre útil, sem spam.
    </p>
    <p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 4px;">
      Pode esperar:
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 0;">
      <tr>
        <td style="padding:8px 0;color:${INK};font-size:14px;line-height:1.6;border-bottom:1px solid ${BORDER};">
          <span style="display:inline-block;width:12px;text-align:center;margin-right:10px;color:${ACCENT};font-weight:700;font-size:16px;line-height:1;">•</span>Um artigo em destaque por edição
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:${INK};font-size:14px;line-height:1.6;border-bottom:1px solid ${BORDER};">
          <span style="display:inline-block;width:12px;text-align:center;margin-right:10px;color:${ACCENT};font-weight:700;font-size:16px;line-height:1;">•</span>Guias práticos de passaportes e vistos
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:${INK};font-size:14px;line-height:1.6;border-bottom:1px solid ${BORDER};">
          <span style="display:inline-block;width:12px;text-align:center;margin-right:10px;color:${ACCENT};font-weight:700;font-size:16px;line-height:1;">•</span>Dicas de educação e finanças internacionais
        </td>
      </tr>
    </table>
    ${ctaVariant("Explorar o blog", blog, "editorial")}
    ${
      input.unsubscribe_url
        ? `<p style="color:${FAINT};font-size:12px;line-height:1.6;margin:20px 0 0;">Se não foi você, <a href="${esc(input.unsubscribe_url)}" style="color:${MUTED};text-decoration:underline;">cancele a subscrição aqui</a>.</p>`
        : ""
    }
  `;

  return shellVariant({
    preheader: preview,
    content,
    accentLabel: "Newsletter",
    variant: "editorial",
    footerLines: {
      main: "Recebeu este email porque subscreveu a newsletter da Issencial.",
      brand: `© ${new Date().getFullYear()} Issencial — Serviços Integrados Globais`,
    },
  });
}

// ============================================================
// 2. Sent edition
// ============================================================
export interface NewsletterArticle {
  title: string;
  excerpt: string;
  category_label?: string;
  href?: string;
}

export function newsletterEditionTemplate(input: {
  issue?: number;
  title: string;
  intro?: string;
  hero: NewsletterArticle;
  more?: NewsletterArticle[];
  unsubscribe_url?: string;
}): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const blog = blogHref();
  const issue = issueLabel(input.issue);
  const preview = `${issue ? issue + " · " : ""}${input.title}`;

  const heroHref = input.hero.href
    ? input.hero.href.startsWith("http")
      ? input.hero.href
      : base.replace(/\/+$/, "") + input.hero.href
    : blog;

  const moreRows = (input.more ?? [])
    .map((a) => {
      const href = a.href
        ? a.href.startsWith("http")
          ? a.href
          : base.replace(/\/+$/, "") + a.href
        : blog;
      return `
      <tr>
        <td style="padding:16px 0;border-top:1px solid ${BORDER};">
          <a href="${esc(href)}" style="text-decoration:none;">
            ${
              a.category_label
                ? `<span style="display:inline-block;color:#004a54;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:4px;">${esc(a.category_label)}</span><br>`
                : ""
            }
            <span style="color:${INK};font-size:16px;font-weight:600;line-height:1.4;">${esc(a.title)}</span>
          </a>
          <p style="color:${MUTED};font-size:13px;line-height:1.6;margin:4px 0 0;">${esc(a.excerpt)}</p>
        </td>
      </tr>`;
    })
    .join("");

  const content = `
    <p style="color:${MUTED};font-size:13px;margin:0 0 8px;line-height:1.6;">${esc(issue ? `Edição ${issue}` : "Newsletter")} · ${esc(new Date().toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" }))}</p>
    <h2 style="color:${INK};font-size:26px;margin:0 0 10px;font-weight:700;line-height:1.25;">${esc(input.title)}</h2>
    ${input.intro ? `<p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 28px;">${esc(input.intro)}</p>` : ""}

    <!-- Hero article -->
    <a href="${esc(heroHref)}" style="display:block;text-decoration:none;background:${PRIMARY};border-radius:4px;padding:28px 30px;margin-bottom:8px;">
      ${
        input.hero.category_label
          ? `<span style="display:inline-block;color:${ACCENT};font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:8px;">${esc(input.hero.category_label)}</span><br>`
          : ""
      }
      <span style="color:#ffffff;font-size:21px;font-weight:700;line-height:1.3;display:block;">${esc(input.hero.title)}</span>
      <span style="color:rgba(255,255,255,0.78);font-size:14px;line-height:1.6;display:block;margin-top:8px;">${esc(input.hero.excerpt)}</span>
    </a>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 8px;">
      <tr>
        <td style="border-radius:2px;">
          <a href="${esc(heroHref)}" style="display:inline-block;padding:10px 24px;color:#002e35;background:${ACCENT};font-size:13px;font-weight:700;text-decoration:none;border-radius:2px;">
            Ler artigo
          </a>
        </td>
      </tr>
    </table>

    ${
      moreRows
        ? `<p style="color:${MUTED};font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin:28px 0 0;">Mais para ler</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:4px;">
      ${moreRows}
    </table>`
        : ""
    }

    ${ctaVariant("Ver todos os artigos", blog, "editorial")}

    ${
      input.unsubscribe_url
        ? `<p style="color:${FAINT};font-size:12px;line-height:1.6;margin:24px 0 0;border-top:1px solid ${BORDER};padding-top:16px;">
            Não quer receber mais emails? <a href="${esc(input.unsubscribe_url)}" style="color:${MUTED};text-decoration:underline;">Cancelar subscrição</a>.
          </p>`
        : ""
    }
  `;

  return shellVariant({
    preheader: preview,
    content,
    accentLabel: issue ? `Edição ${issue}` : "Newsletter",
    variant: "editorial",
    footerLines: {
      main: "Recebeu este email porque subscreveu a newsletter da Issencial.",
      brand: `© ${new Date().getFullYear()} Issencial — Serviços Integrados Globais`,
    },
  });
}
