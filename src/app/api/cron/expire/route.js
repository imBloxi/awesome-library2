import { expireStaleHolds } from "@/lib/queries/reservations";

// Called daily by Vercel Cron (see vercel.json). Vercel sends CRON_SECRET as a bearer token.
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  return Response.json(await expireStaleHolds());
}
