import { ContentsRoute } from "@/components/edition-pages";
import { inventedEdition } from "@/lib/babel-book/sources";

const load = async ({ seed }) => inventedEdition(seed);

export default function InventedBookPage({ params }) {
  return <ContentsRoute params={params} load={load} />;
}
