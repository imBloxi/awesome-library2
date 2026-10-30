# ctOS account and reading authorization

The user authorizes creative design and requests reading only after reservation and pickup, an advanced account suite, dystopian ctOS Surveillance branding, and strong security using only Vercel and Neon. No email integration.

Use existing Next server components/actions and Neon Auth. A current picked-up reservation for the exact member and catalogue book is required for contents and every chapter. Check fresh session and uncached SQL; no admin bypass. Returned/cancelled/expired/uncollected loans fail closed, overdue picked-up loans retain access. Retire catalogue offline export (old exported files cannot be withdrawn). Per explicit user choice, standalone Babel requires any active picked-up loan. Retire its downloads too. The discovery shelf remains browsable; story contents are protected.

Account: edit display name, show immutable email, change password with current password and confirmation (12–128 characters for new passwords), revoke other sessions on password change, list authenticated member sessions with no tokens passed to clients, revoke selected other sessions by server-resolved ID or all other sessions. Sanitize display metadata and present provider failures honestly. Fresh upstream session reads prevent signed-cookie cache from authorizing revoked sessions. No account deletion/email changes/recovery flows without appropriate identity verification.

Visual: graphite ctOS masthead, lime accents, technical labels, readable pale content and existing reader themes. Account console uses precise security descriptions, never fake risk scores or surveillance telemetry. Controls stay keyboard-accessible and responsive. Browser-local reading data can be cleared separately from server loans.

Approach chosen autonomously: extend current SDK and SQL with no dependencies/schema changes. A new auth system or client-only route gating would add risk and cannot enforce the loan rule. Add anti-framing, MIME-sniffing, referrer and unused-permission restrictions without breaking Next streaming.

Tests: real disposable Postgres loan-state/ownership transitions; service behavior for forged session IDs, passwords and provider errors; route checks for signed-out/denied/allowed content and no export; browser fixture for responsive account forms. No real Neon tenant available locally; record that verification limit.
