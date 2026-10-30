import { inventedEdition } from "@/lib/babel-book/sources";
import { downloadResponse } from "@/lib/babel-book/download";

export async function GET(_request, { params }) {
  const { seed } = await params;
  return downloadResponse(inventedEdition(seed));
}
