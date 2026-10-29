# Babel back-cover implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Replace the separate library-adventure stories with imagined back-cover blurbs based on the actual title and description.

**Architecture:** Retain deterministic local generation and the existing id parameter; add description as the third input. Extract a short premise from the description, choose related thematic imagery from metadata keywords, and finish with unresolved stakes/a question. Remove obsolete library-quest data.

**Tech Stack:** Existing server-side JavaScript and Node tests, no external service or dependency changes.

**Spec:** User's correction: mimic a book blurb rather than tell a separate story; use title and description. The user clarified that “extra high” means higher writing quality. Keep the prose controlled and grounded in the source, rather than adding forced surrealism.

## Global Constraints

- Preserve repeatability per title/description/id, edition variety, Unicode and bounded output.
- Preserve source character names and premise; do not invent a separate named reader.
- No resolved ending, arbitrary library errand or claims that this is an official synopsis/excerpt.
- Descriptions can be missing, generic placeholders or long; avoid fabricated factual summaries in fallback copy.

## Review Focus

- Source description materially influences both premise and thematic teaser.
- Proper names, abbreviations and sentence boundaries survive extraction.
- The ending invites reading and leaves the central question open.
- Long/Unicode/markup-bearing metadata stays safe, bounded and readable.
- Different books and duplicate-title editions retain meaningful variety.

### Task 1: Replace story generation with back-cover copy

- [x] Reproduce ignored descriptions and resolved-story format with failing tests.
- [x] Replace library-quest parts with thematic blurb motifs and metadata-aware generation; pass book.description from the page and update the label.
- [x] Replace obsolete story-specific tests with blurb, metadata, variety and safety regressions; inspect representative examples.
- [x] Run tests/lint/build, review the result, and publish through the authorized production path.

Validation: the old generator ignored description and returned unrelated, resolved library stories. New metadata/teaser regressions failed first and pass with the back-cover implementation. Independent source review found initials/dotted-abbreviation splitting, quoted concluding-sentence leakage and instructional tone mismatches; each received a failing regression and a verified fix. Final whole-change review approved the result. All 36 unit tests, lint and production build pass. The copy was separately edited for stronger atmosphere and stakes, and the source premise/people remain intact. The 500-book check now verifies distinct supplied premises rather than manufacturing unrelated plots. Spoiler markers and theme matching remain intentionally heuristic.
