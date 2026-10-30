import { db } from "@/lib/db";
import {
  settingQuery, setEnabledQuery, listTermsQuery, addTermQuery, toggleTermQuery, deleteTermQuery,
  personsOfInterestQuery, watchedBookSql,
} from "./watch-sql.mjs";

export async function watchlistEnabled() {
  const [row] = await db().query(settingQuery.text);
  return row?.enabled === true;
}

export async function setWatchlistEnabled(enabled, actor) {
  await db().query(setEnabledQuery.text, [Boolean(enabled), String(actor.email ?? actor.id)]);
}

export const listWatchTerms = () => db().query(listTermsQuery.text);

export async function addWatchTerm(term, reason, actor) {
  const [row] = await db().query(addTermQuery.text, [term, reason, String(actor.email ?? actor.id)]);
  return row?.id ?? null;
}

export async function toggleWatchTerm(id) {
  const [row] = await db().query(toggleTermQuery.text, [id]);
  return row ?? null;
}

export async function deleteWatchTerm(id) {
  const [row] = await db().query(deleteTermQuery.text, [id]);
  return row ?? null;
}

export const listPersonsOfInterest = () => db().query(personsOfInterestQuery.text);

export async function isBookWatched(bookId) {
  const [row] = await db().query(`select ${watchedBookSql("b")} as watched from books b where b.id = $1`, [bookId]);
  return row?.watched === true;
}
