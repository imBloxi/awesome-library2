# My library and admin priorities

Use the existing Next server components, queries, actions, and routes. Make the member page a useful home by separating ready holds, loans, waitlists, saved books, and collapsed history. Add linked counts and calm paper surfaces that echo the book covers. Put urgent admin work ahead of collection statistics, with a direct circulation-desk action.

The user delegated design choices. This focused presentation pass was chosen over new dashboard queries or bulk mutations to improve daily navigation without changing circulation rules. No database schema, dependencies, authentication, or action behavior changes.

Validation: 81 unit tests, ESLint and production build passed. Chromium presentation fixture rendered the member server component with sample data at 320, 390 and 1280 pixels; checked overflow, section links and history disclosure. This fixture replaces auth, data and action controls, so it does not verify authenticated production flows or mutations. Production deployment status must be checked separately.
