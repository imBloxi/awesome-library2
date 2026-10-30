import { editionToHtml, editionFileName } from "./html.mjs";

// Response for a "Download for offline" link: one HTML file, saved rather than shown.
export function downloadResponse(data) {
  if (!data) return new Response("Not found", { status: 404 });
  const { edition, byline, backCover } = data;
  return new Response(editionToHtml({ edition, byline, backCover }), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${editionFileName(edition.title, edition.edition)}"`,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
      "Cache-Control": "public, max-age=300",
    },
  });
}
