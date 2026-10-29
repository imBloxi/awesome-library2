# Babel coherence implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the approved Babel feature so its prose follows a logical, connected story.

**Architecture:** Use the existing seeded PRNG to choose a complete narrative, reader and place once. Render setup, investigation and resolution paragraphs from that shared context. Keep the full title as a book reference.

**Tech Stack:** Existing JavaScript generator and Node tests; no service or dependency changes.

**Spec:** ../specs/2026-10-29-babel-design.md, updated with the user's coherence request.

## Global Constraints

- Preserve deterministic output, Unicode handling, bounded length and server rendering.
- Keep passages clearly labeled invented text; do not invent book summaries.
- Keep one consistent reader and one magical premise throughout each story.
- Use the existing isolated checkout and existing feature branch.

## Review Focus

- Title stopwords should not become disconnected quoted subjects.
- Characters and objects should not change arbitrarily between sentences.
- Every story should introduce a problem and resolve that same problem.
- Blank, long, Unicode and markup-bearing titles remain bounded and safe.

### Task 1: Replace independent random sentences with coherent narratives

- [ ] Add regressions for using the full title and retaining one reader across paragraphs; observe failure on existing generation.
- [ ] Choose one narrative frame, reader and setting per title. Retain the seed generator and return exactly three paragraphs.
- [ ] Inspect examples for each frame, run all unit tests, lint and production build, and review the change.
- [ ] Commit and push to the existing feature branch.
