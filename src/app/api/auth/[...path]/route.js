import { getAuth } from "@/lib/auth/server";

let handlers;
const h = () => (handlers ??= getAuth().handler());

export const GET = (request, ctx) => h().GET(request, ctx);
export const POST = (request, ctx) => h().POST(request, ctx);
