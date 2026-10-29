import { STORY_PARTS } from "./babel-stories.mjs";

const clipTitle = (text) => text.slice(0, 300).replace(/[\uD800-\uDBFF]$/u, "");

// Local state keeps each title/edition repeatable, independently of other calls.
export function babelPassage(title = "", bookId = "") {
  const seed = clipTitle(clipTitle(title).normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase()) || "untitled";
  const bookTitle = /[\p{L}\p{N}]/u.test(seed) ? seed : "untitled";
  let state = 2166136261;
  for (const char of `${seed}\0${String(bookId ?? "").slice(0, 64)}`) {
    state = Math.imul(state ^ char.codePointAt(0), 16777619) >>> 0;
  }
  const pick = (items) => {
    state = (state + 0x6d2b79f5) >>> 0;
    let n = Math.imul(state ^ (state >>> 15), state | 1);
    n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
    return items[((n ^ (n >>> 14)) >>> 0) % items.length];
  };
  const reader = pick(STORY_PARTS.readers);
  const library = pick(STORY_PARTS.libraries);
  const source = pick(STORY_PARTS.sources);
  const artifact = pick(STORY_PARTS.artifacts);
  const item = artifact.item.replace(/^(?:a|an) /, "the ");
  const obstacle = pick(STORY_PARTS.obstacles);
  const mystery = pick(STORY_PARTS.mysteries);
  const opening = pick(STORY_PARTS.openings)(bookTitle, library);
  const investigation = pick(STORY_PARTS.investigations);
  const closing = pick(STORY_PARTS.closings);
  const development = pick([
    `${reader} went to ${source}, where ${obstacle.problem}. ${reader} ${obstacle.action}, then ${investigation} to locate ${item}.`,
    `At ${source}, ${reader} discovered that ${obstacle.problem}. ${reader} ${obstacle.action}. They then ${investigation}, which led to ${item}.`,
    `The search for ${item} took ${reader} to ${source}. There, ${obstacle.problem}. To continue, ${reader} ${obstacle.action}, then ${investigation} until the item was found.`,
    `${reader} reached ${source}, only to learn that ${obstacle.problem}. After that setback, ${reader} ${obstacle.action} and ${investigation}. The search finally yielded ${item}.`,
  ]);
  const resolution = pick([
    `${reader} took ${item} from ${source} to ${artifact.owner}. Together they ${artifact.work}; ${artifact.result}.`,
    `For ${artifact.owner}, ${reader}'s discovery meant a chance to ${artifact.purpose}. With ${item} recovered from ${source}, they ${artifact.work}; ${artifact.result}.`,
    `${reader} arranged to meet ${artifact.owner} after leaving ${source}. With ${item} at hand, they ${artifact.work}; ${artifact.result}.`,
    `At last ${reader} could put ${item} into ${artifact.owner}'s hands. It had come from ${source}; now they ${artifact.work}, and ${artifact.result}.`,
  ]);
  return [
    `${reader} ${opening}. ${mystery.discovery(artifact.item, source)} A margin note said ${artifact.owner} needed it to ${artifact.purpose}.`,
    `${development} ${mystery.confirmation}`,
    `${resolution} ${mystery.ending} ${closing}`,
  ];
}
