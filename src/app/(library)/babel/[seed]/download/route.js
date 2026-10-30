// Previously exported files cannot be recalled. New loan-restricted reading is online only.
export async function GET() {
  return new Response("Offline export is unavailable. Read online while your loan is checked out.", {
    status: 410,
    headers: { "Cache-Control": "private, no-store", "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" },
  });
}
