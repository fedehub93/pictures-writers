import { buildLlmsTxt } from "@/lib/llms";

export const revalidate = 3600;

export async function GET() {
  const body = await buildLlmsTxt();

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
