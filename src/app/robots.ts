import { getSettings } from "@/data/settings";
import { MetadataRoute } from "next";

const DISALLOW = [
  "/admin/",
  "/confirm-subscription",
  "/cancel-subscription",
  "/conferma-sottoscrizione",
  "/rimuovi-sottoscrizione",
  "/download-ebooks",
  "/shop/ebooks/download",
  "/cos-e-il-linguaggio-cinematografico-scrivere-per-il cinema",
  "/ebooks/",
  "/ebooks/introduzione-alla-sceneggiatura/",
  "/concorso-tre-colori-2025/",
];

/**
 * AI crawlers we explicitly allow. Being cited by AI answers requires these
 * bots to have access: blocking any of them means that engine cannot cite us.
 * `CCBot` (Common Crawl, training-only) is intentionally left to the default
 * `*` rule rather than blocked, so it is allowed unless decided otherwise.
 */
const AI_CRAWLERS = [
  "GPTBot", // OpenAI — ChatGPT search
  "ChatGPT-User", // ChatGPT browsing mode
  "OAI-SearchBot", // OpenAI search index
  "PerplexityBot", // Perplexity
  "ClaudeBot", // Anthropic — Claude
  "anthropic-ai", // Anthropic (legacy)
  "Claude-User", // Claude browsing mode
  "Google-Extended", // Google Gemini / AI Overviews
  "Applebot-Extended", // Apple Intelligence
  "Bingbot", // Microsoft Copilot (via Bing)
];

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { siteUrl } = await getSettings();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: DISALLOW,
        other: {
          "Content-Usage": "search=yes, ai-input=yes, ai-train=yes",
        },
      },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: ["/"],
        disallow: DISALLOW,
      })),
    ],
    sitemap: [`${siteUrl}/sitemap.xml`],
  };
}
