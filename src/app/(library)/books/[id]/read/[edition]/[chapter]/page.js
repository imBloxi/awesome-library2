import { ChapterRoute } from "@/components/edition-pages";
import { catalogEdition } from "@/lib/babel-book/sources";

const load = ({ id, edition }) => catalogEdition(id, edition);

export default function EditionChapterPage({ params }) {
  return <ChapterRoute params={params} load={load} />;
}
