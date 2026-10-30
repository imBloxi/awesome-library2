import { ContentsRoute } from "@/components/edition-pages";
import { catalogEdition } from "@/lib/babel-book/sources";

const load = ({ id, edition }) => catalogEdition(id, edition);

export default function EditionPage({ params }) {
  return <ContentsRoute params={params} load={load} />;
}
