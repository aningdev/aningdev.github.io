import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) => {
  const lines = ["User-agent: *", "Allow: /"];
  if (site) {
    const root = new URL(import.meta.env.BASE_URL, site);
    const href = root.href.endsWith("/") ? root.href : `${root.href}/`;
    lines.push(`Sitemap: ${new URL("sitemap-index.xml", href).href}`);
  }
  return new Response(`${lines.join("\n")}\n`);
};
