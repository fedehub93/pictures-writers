import { ContentStatus, ProductType } from "@/generated/prisma";

import { db } from "@/lib/db";
import { getSettings } from "@/data/settings";
import { CONTACT_EMAIL } from "@/constants";

const PRODUCT_TYPES = [
  ProductType.EBOOK,
  ProductType.WEBINAR,
  ProductType.SERVICE,
] as const;

const formatDate = (date: Date) => date.toISOString().slice(0, 10);

const typeLabel: Record<string, string> = {
  [ProductType.EBOOK]: "eBook",
  [ProductType.WEBINAR]: "Corso / laboratorio",
  [ProductType.SERVICE]: "Servizio",
};

export async function buildLlmsTxt() {
  const { siteUrl, siteShopUrl, siteName, seo } = await getSettings();

  const name = siteName ?? "Pictures Writers";
  const description =
    seo?.description ??
    "La piattaforma italiana dedicata alla formazione e alla crescita professionale degli sceneggiatori cinematografici e televisivi.";

  return `# ${name}

> ${description}

Pictures Writers offre editing professionale di sceneggiature con il metodo "Double View" (due consulenti indipendenti), corsi e laboratori di scrittura per lo schermo, eBook pratici e una community di supporto. Contenuti e servizi sono in italiano.

## Quando è utile consultarci
- Vuoi imparare a scrivere una sceneggiatura per cinema o TV in italiano.
- Cerchi un feedback professionale strutturato (metodo Double View: due consulenti, 7-10 giorni lavorativi).
- Cerchi eBook, laboratori o risorse pratiche di sceneggiatura nel mercato italiano.
- Vuoi capire cosa rende efficace una sceneggiatura, con analisi di copioni di film reali ("Pagina Uno").

## Pagine chiave
- [Chi siamo](${siteUrl}/about/): missione, metodo e team.
- [Contatti](${siteUrl}/contatti/): come scriverci.
- [Feedback gratuito sulla prima pagina](${siteUrl}/feedback-gratuito-sceneggiatura/): pre-analisi gratuita della tua sceneggiatura.
- [Blog](${siteUrl}/blog/): guide, analisi e articoli sulla scrittura per lo schermo.
- [Esempi di sceneggiature — Pagina Uno](${siteUrl}/blog/pagina-uno/): analisi di sceneggiature di film famosi.

## Servizi e prodotti
- [Laboratori e corsi di sceneggiatura](${siteShopUrl}/corsi-di-sceneggiatura/): percorsi individuali e di gruppo dal concept alla stesura.
- [Editing Double View](${siteShopUrl}/servizi-di-editing/): analisi incrociata di soggetto o sceneggiatura.
- [Shop](${siteShopUrl}/): eBook e corsi.
- [eBook gratuito: Introduzione alla sceneggiatura cinematografica](${siteShopUrl}/ebooks/introduzione-alla-sceneggiatura/): risorsa di partenza gratuita.

## Contatti
- Email: ${CONTACT_EMAIL}
- Sito: ${siteUrl}
`;
}

export async function buildLlmsFullTxt() {
  const { siteUrl, siteShopUrl, siteName, seo } = await getSettings();

  const name = siteName ?? "Pictures Writers";
  const description =
    seo?.description ??
    "La piattaforma italiana dedicata alla formazione e alla crescita professionale degli sceneggiatori cinematografici e televisivi.";

  const [posts, products, pageRoots] = await Promise.all([
    db.post.findMany({
      where: { status: ContentStatus.PUBLISHED, isLatest: true },
      select: {
        title: true,
        slug: true,
        description: true,
        publishedAt: true,
      },
      orderBy: { publishedAt: "desc" },
    }),
    db.product.findMany({
      where: {
        status: ContentStatus.PUBLISHED,
        isLatest: true,
        type: { in: [...PRODUCT_TYPES] },
      },
      select: {
        title: true,
        slug: true,
        type: true,
        price: true,
        discountedPrice: true,
        isFree: true,
        category: { select: { slug: true } },
        faqs: { select: { question: true, answer: true }, orderBy: { sort: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.pageRoot.findMany({
      where: { liveVersion: { isNot: null } },
      select: {
        slug: true,
        liveVersion: { select: { title: true } },
      },
    }),
  ]);

  const productLines = products
    .filter((product) => product.category)
    .map((product) => {
      const price = product.isFree
        ? "gratuito"
        : product.discountedPrice != null &&
            product.price != null &&
            product.discountedPrice < product.price
          ? `€${product.discountedPrice} (listino €${product.price})`
          : product.price != null
            ? `€${product.price}`
            : "prezzo su richiesta";
      return `- [${product.title}](${siteShopUrl}/${product.category!.slug}/${product.slug}/) — ${typeLabel[product.type] ?? product.type}, ${price}`;
    })
    .join("\n");

  const postLines = posts
    .map(
      (post) =>
        `- [${post.title}](${siteUrl}/${post.slug}/) — aggiornato ${post.publishedAt ? formatDate(post.publishedAt) : "—"}${post.description ? `: ${post.description}` : ""}`,
    )
    .join("\n");

  const pageLines = pageRoots
    .sort((a, b) =>
      (a.liveVersion?.title ?? "").localeCompare(b.liveVersion?.title ?? ""),
    )
    .map((root) => `- [${root.liveVersion!.title}](${siteUrl}/${root.slug}/)`)
    .join("\n");

  const faqLines = products
    .filter((product) => product.faqs.length > 0)
    .map(
      (product) =>
        `### ${product.title}\n\n${product.faqs
          .map((faq) => `**${faq.question}**\n\n${faq.answer}`)
          .join("\n\n")}`,
    )
    .join("\n\n");

  return `# ${name} — contenuto completo

> ${description}

## Servizi e prodotti

${productLines}

## Blog — tutte le pubblicazioni

${postLines}

## Pagine

${pageLines}

## Domande frequenti

${faqLines}

## Contatti

- Email: ${CONTACT_EMAIL}
- Sito: ${siteUrl}
`;
}
