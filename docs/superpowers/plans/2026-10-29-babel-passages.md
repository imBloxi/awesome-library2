# Babel passages implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Give each book a repeatable, surreal passage inspired by its title.

**Architecture:** A small pure seeded generator returns three paragraphs. A native details/summary section in the server-rendered book page displays them; no client component or service is needed.

**Tech Stack:** JavaScript, Node test runner, React server components, native HTML.

**Spec:** ../specs/2026-10-29-babel-design.md (approved in chat).

## Global Constraints

- No AI calls, extra dependencies, database writes or additional client JavaScript.
- Existing description and reservation controls stay intact.
- Clearly label the text as invented, not an excerpt.
- Use existing isolated checkout; no additional worktree.

## Review Focus

- Empty titles still produce bounded prose without undefined words.
- Unicode titles produce repeatable output with their words preserved.
- Very long titles do not make long passages or unbounded computation.
- Whitespace/case variants use the same normalized seed.
- Title text remains text; React must escape markup in output.

---

### Task 1: Generate and display Babel passages

**Files:** new `src/lib/babel.mjs`, new `scripts/test-babel.mjs`, `src/app/books/[id]/page.js`, `package.json`, `README.md`.

**Interfaces:** `babelPassage(title: string): string[]` returns exactly three short paragraphs, using a normalized, bounded title as its only seed.

- [x] Write tests for deterministic output, different titles, normalized seed, Unicode title words, blank fallback and bounded long input. Confirm missing implementation fails.
- [x] Implement a small seeded PRNG with sentence templates and a fixed surreal vocabulary. Include sampled title words, with no global state or I/O.
- [x] Add a collapsed “Open a Babel page” details/summary section to book details, with plain explanatory copy and paragraph text children. Verify generator output rendered through React escapes HTML.
- [x] Add tests to `test:env` and document the feature. Run tests and lint; include the feature in final code review with the database changes.
- [x] Commit the implementation and record validation.
