// Facts the legal pages depend on. Change them here, not in the page text.
export const LEGAL_UPDATED = "30 October 2026";

// Who runs this deployment and how to reach them. Until these are set, the pages direct
// requests to the library staff, who are the only people able to act on them.
export const OPERATOR_NAME = process.env.NEXT_PUBLIC_LEGAL_OPERATOR?.trim() || null;
export const OPERATOR_CONTACT = process.env.NEXT_PUBLIC_LEGAL_CONTACT?.trim() || null;
