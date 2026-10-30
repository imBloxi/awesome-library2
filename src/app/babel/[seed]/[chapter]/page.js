import { ChapterRoute } from "@/components/edition-pages";
import { inventedEdition } from "@/lib/babel-book/sources";

const load = async ({ seed }) => inventedEdition(seed);

export default function InventedChapterPage({ params }) {
  return <ChapterRoute params={params} load={load} />;
}
