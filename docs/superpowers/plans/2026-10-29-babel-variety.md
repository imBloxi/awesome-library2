# Babel variety implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Replace the three repeatedly reused Babel plots with varied, coherent stories for each book, including separate editions with the same title.

**Architecture:** Retain deterministic local generation. Seed from normalized title plus optional book id. Select a connected artifact/purpose/action/result profile and a mystery with a matching discovery/resolution; combine those with compatible locations, obstacle/solution pairs and research methods. Keep one reader throughout.

**Tech Stack:** Existing server-side JavaScript and Node tests; no dependencies or external services.

**Spec:** ../specs/2026-10-29-babel-design.md plus the user's request that every book have distinct text.

## Global Constraints

- Exactly three bounded paragraphs, safe Unicode and escaped text rendering.
- Keep the prose logical, clearly invented and repeatable for the same title/book id.
- Do not mistake title/name substitutions for meaningful narrative variety.
- Use the existing isolated checkout and feature branch; preserve the current cover design.

## Review Focus

- Duplicate titles across editions must not collapse into the same story.
- Different books must vary their investigation and conclusion, not only their opening.
- Profile fields and mystery callbacks must refer to the same artifact, purpose and rule.
- Blank, long and Unicode titles must still obey text/length constraints.

### Task 1: Expand procedural stories

- [x] Reproduce repeated bodies with a 500-book test that removes title/reader substitutions, and add edition identity regressions.
- [x] Extract compatible story parts into `src/lib/babel-stories.mjs`; update `babelPassage(title, bookId)` and its book-page caller.
- [x] Inspect generated examples, run unit tests, lint and build, and review coherence and variation.
- [x] Document the seed contract, commit and push to the existing feature branch.

Validation: the old generator produced only 3 story bodies across 500 books after title/reader substitutions were removed. The new sample produced 500 bodies, 500 investigations and 499 conclusions. Duplicate-title edition tests pass. All 32 unit tests, lint and production build passed. Independent review found one shelf/desk mismatch; its seeded regression failed before a location-neutral confirmation fixed it. The reviewer also checked 50,000 long-title samples, all within paragraph limits. No database behavior changed.
