// Ported verbatim from frontend/index.html lines 1742-1808.

// Mirrors backend/src/lib/roles.js's ROLE_CATALOG exactly (id/name/domain) -
// kept as a separate copy (not fetched over the network) so the Role tab's
// picker can filter in real time on every keystroke with zero latency. Any
// role typed that isn't in this list still works: the backend classifies it
// to the nearest entry here and returns that role's content, displayed
// under the typed title.
//
// `id` is the stable slug - per the Phase 1.6 role-keying rule, any NEW
// per-user/per-role state must key on `id`, never on `name`. Existing
// content caches stay name-keyed (see backend/src/lib/roles.js's header
// comment for why). `domain` is the 10-domain role-classification taxonomy
// - NOT the same as RAG_DOMAIN_OPTIONS below, which is a coarser 6-bucket
// ingestion-content tag.
//
// Phase 1.6 item 2: renamed/merged/removed/added roles - see
// backend/src/lib/roles.js's header comment for the full reasoning (MBA-
// campus-hiring title corrections from the Phase 1.5 role audit, plus 4 new
// IT and Technology roles - that domain previously had zero).
export const ROLE_CATALOG = [
  { id: "associate-product-manager", name: "Associate Product Manager", domain: "Product Management" },
  { id: "product-manager", name: "Product Manager", domain: "Product Management" },
  { id: "product-analyst", name: "Product Analyst", domain: "Product Management" },
  { id: "product-owner", name: "Product Owner", domain: "Product Management" },
  { id: "technical-product-manager", name: "Technical Product Manager", domain: "Product Management" },
  { id: "growth-product-manager", name: "Growth Product Manager", domain: "Product Management" },
  { id: "program-manager", name: "Program Manager", domain: "Product Management" },

  { id: "strategy-associate", name: "Strategy Associate", domain: "Consulting" },
  { id: "consultant", name: "Consultant", domain: "Consulting" },
  { id: "consultant-associate", name: "Consultant (Associate)", domain: "Consulting" },
  { id: "corporate-strategy-associate", name: "Corporate Strategy Associate", domain: "Consulting" },
  { id: "strategy-and-operations-analyst", name: "Strategy & Operations Analyst", domain: "Consulting" },
  { id: "transformation-associate", name: "Transformation Associate", domain: "Consulting" },

  { id: "business-analyst", name: "Business Analyst", domain: "Data and Analytics" },
  { id: "data-analyst", name: "Data Analyst", domain: "Data and Analytics" },
  { id: "business-intelligence-analyst", name: "Business Intelligence Analyst", domain: "Data and Analytics" },
  { id: "insights-and-analytics-associate", name: "Insights & Analytics Associate", domain: "Data and Analytics" },
  { id: "decision-science-analyst", name: "Decision Science Analyst", domain: "Data and Analytics" },

  { id: "investment-banking-associate", name: "Investment Banking Associate", domain: "Finance and Banking" },
  { id: "equity-research-analyst", name: "Equity Research Analyst", domain: "Finance and Banking" },
  { id: "corporate-finance-analyst", name: "Corporate Finance Analyst", domain: "Finance and Banking" },
  { id: "fpa-analyst", name: "FP&A Analyst", domain: "Finance and Banking" },
  { id: "private-equity-vc-associate", name: "Private Equity / VC Associate", domain: "Finance and Banking" },
  { id: "credit-and-risk-analyst", name: "Credit & Risk Analyst", domain: "Finance and Banking" },
  { id: "treasury-analyst", name: "Treasury Analyst", domain: "Finance and Banking" },

  { id: "assistant-brand-manager", name: "Assistant Brand Manager", domain: "Marketing and Brand" },
  { id: "marketing-manager", name: "Marketing Manager", domain: "Marketing and Brand" },
  { id: "category-manager", name: "Category Manager", domain: "Marketing and Brand" },
  { id: "digital-marketing-manager", name: "Digital Marketing Manager", domain: "Marketing and Brand" },
  { id: "product-marketing-manager", name: "Product Marketing Manager", domain: "Marketing and Brand" },
  { id: "growth-marketing-manager", name: "Growth Marketing Manager", domain: "Marketing and Brand" },

  { id: "growth-manager", name: "Growth Manager", domain: "Sales and Business Development" },
  { id: "city-cluster-manager", name: "City/Cluster Manager", domain: "Sales and Business Development" },
  { id: "customer-success-manager", name: "Customer Success Manager", domain: "Sales and Business Development" },
  { id: "business-development-manager", name: "Business Development Manager", domain: "Sales and Business Development" },
  { id: "key-account-manager", name: "Key Account Manager", domain: "Sales and Business Development" },
  { id: "sales-strategy-associate", name: "Sales Strategy Associate", domain: "Sales and Business Development" },
  { id: "partnerships-manager", name: "Partnerships Manager", domain: "Sales and Business Development" },
  { id: "merchant-partner-success-manager", name: "Merchant/Partner Success Manager", domain: "Sales and Business Development" },

  { id: "operations-manager", name: "Operations Manager", domain: "Operations and Supply Chain" },
  { id: "supply-chain-manager", name: "Supply Chain Manager", domain: "Operations and Supply Chain" },
  { id: "business-operations-associate", name: "Business Operations Associate", domain: "Operations and Supply Chain" },

  { id: "hr-business-partner", name: "HR Business Partner", domain: "Human Resources" },
  { id: "talent-acquisition-associate", name: "Talent Acquisition Associate", domain: "Human Resources" },
  { id: "compensation-and-benefits-analyst", name: "Compensation & Benefits Analyst", domain: "Human Resources" },
  { id: "learning-and-development-associate", name: "Learning & Development Associate", domain: "Human Resources" },

  { id: "general-management-trainee", name: "General Management Trainee", domain: "General Management" },
  { id: "chief-of-staff", name: "Chief of Staff", domain: "General Management" },
  { id: "corporate-development-associate", name: "Corporate Development Associate", domain: "General Management" },
  { id: "risk-and-fraud-analyst", name: "Risk & Fraud Analyst", domain: "General Management" },
  { id: "compliance-analyst", name: "Compliance Analyst", domain: "General Management" },

  { id: "payments-product-manager", name: "Payments Product Manager", domain: "IT and Technology" },
  { id: "technology-consultant", name: "Technology Consultant", domain: "IT and Technology" },
  { id: "digital-transformation-consultant", name: "Digital Transformation Consultant", domain: "IT and Technology" },
  { id: "solutions-presales-consultant", name: "Solutions / Pre-sales Consultant", domain: "IT and Technology" },
  { id: "technical-program-manager", name: "Technical Program Manager", domain: "IT and Technology" }
] as const;

export const CANONICAL_ROLES = ROLE_CATALOG.map((r) => r.name);

// Shown as a small "Lateral / 2+ yrs" label next to these two in the Role
// dropdown (Phase 1.6 item 2) - real roles, just not direct-from-campus
// titles at most firms.
export const LATERAL_ROLES = new Set(["Technical Product Manager", "Growth Product Manager"]);

// Default quick-picks shown before the user types anything - one or two per
// domain across the CANONICAL_ROLES list above.
export const POPULAR_ROLES = [
  "Product Manager", "Business Analyst", "Consultant (Associate)", "Data Analyst",
  "Investment Banking Associate", "Assistant Brand Manager", "Business Development Manager",
  "Operations Manager", "Growth Manager", "Chief of Staff"
] as const;

// Default quick-picks for the Company tab's picker. Unlike CANONICAL_ROLES,
// this isn't an exhaustive list the backend matches against - the company
// overview endpoint works for any company name, so typing anything not here
// just goes straight to a free-text search.
//
// Full legal/common names only, never a bare short form like "HUL" - a
// live-confirmed bug: Clearbit's logo lookup (companyLogo.js) resolved the
// query "HUL" to Hulu (the streaming service) and showed its logo on the
// Company page. The full name isn't actually indexed there either (Clearbit
// returns nothing for "Hindustan Unilever"), so this doesn't recover a
// correct logo - it just turns a wrong, misleading one into no logo at all,
// which is the safe failure mode the rest of the logo UI already expects.
export const POPULAR_COMPANIES = [
  "Razorpay", "PhonePe", "Flipkart", "Swiggy", "Zomato",
  "Zerodha", "McKinsey & Company", "Hindustan Unilever", "Amazon India"
] as const;

// Companies whose short form is genuinely useful to show (so it's still
// recognizable/searchable) but risky to use as the actual working value -
// see the POPULAR_COMPANIES comment above. Maps the full name to its
// abbreviation for DISPLAY only ("Hindustan Unilever (HUL)"); the value
// passed to pickCompany/the backend stays the clean full name. Deliberately
// NOT applied to a company whose short form IS its real name rather than an
// abbreviation of something else (e.g. "ITC Limited" - ITC doesn't expand
// to a fuller "real" name a student would search by instead).
const COMPANY_ABBREVIATIONS: Record<string, string> = {
  "Hindustan Unilever": "HUL"
};
export function companyDisplayLabel(name: string): string {
  const abbr = COMPANY_ABBREVIATIONS[name];
  return abbr ? `${name} (${abbr})` : name;
}

// A free-typed name not matched in a fixed list (see every Selector's
// free-text fallback option: company on Company/Role pages, role on
// Role/Company pages) is used as-typed everywhere - the page heading, the
// selector's own display value, the API calls - so "godrej Agrovet" stayed
// lowercase throughout instead of reading as a proper name. Only the first
// letter of each word is touched (never forced lowercase on the rest), so
// an acronym typed correctly - "HUL", "TCS" - or a name already matching a
// fixed list entry survives unchanged; this only fixes a word that was
// typed starting with a lowercase letter.
export function titleCase(name: string): string {
  return name.replace(/\S+/g, (w) => w[0].toUpperCase() + w.slice(1));
}

// Maps the domain selector's display label to the `domain` tag actually
// stored on document_chunks (see backend/db/schema.sql), which comes from
// the ingested source folder name ("Prodman Files" -> "Prodman"). Most
// domains are ingested under their selector label as-is - only Product
// Management predates this convention and needs the explicit remap.
const DOMAIN_TO_DB: Record<string, string> = { "Product Management": "Prodman" };
export function mapDomainForRetrieval(label?: string): string | undefined {
  return label ? DOMAIN_TO_DB[label] || label : undefined;
}

// Prep-track filter for RAG retrieval (resume questions, story generation,
// mock interview, frameworks) - restricts casebook search to one ingested
// domain instead of searching across all of them unfiltered. "" (General)
// preserves the original unfiltered behavior. Finance/HR/Marketing:Sales/
// General Management were added to the ingested corpus after this list was
// first written (Step 21c-e in DOCUMENT.md) and had been missing from here
// since - all 6 domains below now have real ingested chunks, confirmed live
// via Supabase counts (Consulting 9363, Finance 7779, Prodman 2550,
// HR 1517, Marketing:Sales 441, General Management 281).
export const RAG_DOMAIN_OPTIONS = [
  { label: "General (all domains)", value: "" },
  { label: "Product Management", value: "Product Management" },
  { label: "Consulting", value: "Consulting" },
  { label: "Finance", value: "Finance" },
  { label: "Marketing & Sales", value: "Marketing:Sales" },
  { label: "General Management", value: "General Management" },
  { label: "HR", value: "HR" }
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
