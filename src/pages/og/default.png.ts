import type { APIContext } from "astro";
import { generateOgImage } from "../../lib/og";

export async function GET(_context: APIContext) {
  const png = await generateOgImage({
    title: "G400 技术笔记",
    description: "记录技术探索、工具折腾和生活思考",
  });
  return new Response(png, {
    headers: { "Content-Type": "image/png" },
  });
}
