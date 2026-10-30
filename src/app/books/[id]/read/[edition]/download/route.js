import { catalogEdition } from "@/lib/babel-book/sources";
import { downloadResponse } from "@/lib/babel-book/download";

export async function GET(_request, { params }) {
  const { id, edition } = await params;
  return downloadResponse(await catalogEdition(id, edition));
}
