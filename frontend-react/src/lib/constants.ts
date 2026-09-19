// Ported verbatim from frontend/index.html lines 1742-1808.

// Mirrors backend/src/lib/roles.js's CANONICAL_ROLES exactly - kept as a
// separate copy (not fetched over the network) so the Role tab's picker can
// filter in real time on every keystroke with zero latency. Any role typed
// that isn't in this list still works: the backend classifies it to the
// nearest entry here and returns that role's content, displayed under the
// typed title.
export const CANONICAL_ROLES = [
  "Associate Product Manager", "Product Manager", "Senior Product Manager", "Product Analyst",
  "Product Owner", "Technical Product Manager", "Growth Product Manager", "Program Manager",
  "Strategy Associate", "Consultant", "Management Consultant", "Business Analyst (Consulting)",
  "Corporate Strategy Associate", "Strategy & Operations Analyst", "Transformation Associate",
  "Business Analyst", "Data Analyst", "Business Intelligence Analyst",
  "Insights & Analytics Associate", "Decision Science Analyst",
  "Investment Banking Analyst", "Equity Research Analyst", "Corporate Finance Analyst",
  "FP&A Analyst", "Private Equity/VC Analyst", "Credit & Risk Analyst", "Treasury Analyst",
  "Brand Manager", "Marketing Manager", "Category Manager", "Digital Marketing Manager",
  "Product Marketing Manager", "Growth Marketing Manager",
  "Growth Manager", "Operations Manager", "Supply Chain Manager",
  "Business Operations Associate", "City/Cluster Manager", "Customer Success Manager",
  "Business Development Manager", "Key Account Manager", "Sales Strategy Associate",
  "Partnerships Manager",
  "HR Business Partner", "General Management Trainee", "Chief of Staff",
  "Corporate Development Associate",
  "Risk & Fraud Analyst", "Merchant/Partner Success Manager", "Payments Product Manager",
  "Compliance Analyst"
] as const;

// Default quick-picks shown before the user types anything - one or two per
// domain across the CANONICAL_ROLES list above.
export const POPULAR_ROLES = [
  "Product Manager", "Business Analyst", "Management Consultant", "Data Analyst",
  "Investment Banking Analyst", "Brand Manager", "Business Development Manager",
  "Operations Manager", "Growth Manager", "Chief of Staff"
] as const;

// Default quick-picks for the Company tab's picker. Unlike CANONICAL_ROLES,
// this isn't an exhaustive list the backend matches against - the company
// overview endpoint works for any company name, so typing anything not here
// just goes straight to a free-text search.
export const POPULAR_COMPANIES = [
  "Razorpay", "PhonePe", "Flipkart", "Swiggy", "Zomato",
  "Zerodha", "McKinsey & Company", "HUL", "Amazon India"
] as const;

// Maps the domain selector's display label to the `domain` tag actually
// stored on document_chunks (see backend/db/schema.sql), which comes from
// the ingested source folder name ("Prodman Files" -> "Prodman"). Most
// domains are ingested under their selector label as-is - only Product
// Management predates this convention and needs the explicit remap. Domains
// with no ingested data yet (Finance, Marketing, Operations) intentionally
// pass through unmapped: retrieval then finds zero matching chunks and falls
// back to ungrounded generation, same as leaving domain unset.
const DOMAIN_TO_DB: Record<string, string> = { "Product Management": "Prodman" };
export function mapDomainForRetrieval(label?: string): string | undefined {
  return label ? DOMAIN_TO_DB[label] || label : undefined;
}

// Prep-track filter for RAG retrieval (resume questions, story generation,
// mock interview) - restricts casebook search to one ingested domain instead
// of searching across all of them unfiltered. Only domains with real
// ingested data are listed (see Data/<Domain> Files/ and Step 21a in
// DOCUMENT.md) - "" (General) preserves the original unfiltered behavior.
export const RAG_DOMAIN_OPTIONS = [
  { label: "General (all domains)", value: "" },
  { label: "Product Management", value: "Product Management" },
  { label: "Consulting", value: "Consulting" }
] as const;

// Lucide icon path data - pulled verbatim from lucide-static so paths are
// exact, not hand-traced. CHEVRON_DOWN/CHEVRON_UP drive Frameworks'
// expand/collapse chevron.
export const ICON_D = {
  CHECK: "M20 6 9 17l-5-5",
  X: "M18 6 6 18M6 6l12 12",
  ARROW_LEFT: "m12 19-7-7 7-7M19 12H5",
  ARROW_RIGHT: "M5 12h14M12 5l7 7-7 7",
  EXTERNAL_LINK: "M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",
  SPARKLES:
    "M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594zM20 2v4M22 4h-4M4 18m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0",
  CHEVRON_DOWN: "m6 9 6 6 6-6",
  CHEVRON_UP: "m18 15-6-6-6 6"
} as const;
