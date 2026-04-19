export const dynamic = "force-static";

export function GET() {
  const body = [
    "User-agent: *",
    "Content-Signal: ai-train=no, search=no, ai-input=no",
    "Disallow: /",
    "",
  ].join("\n");
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
