import { apiFetch } from "./apiClient";
import { CANONICAL_ROLES, POPULAR_COMPANIES } from "./constants";
import type { FrameworksTaxonomyResponse, CommunityListResponse } from "../types/api";

// Keyword search only - no LLM call anywhere in this file (the Header
// acceptance criterion: "returns results with no network call to any LLM").
// The two apiFetch calls below hit plain read endpoints already used
// elsewhere (/api/frameworks/taxonomy, /api/community) that return stored/
// static data, not a generation call.

export interface SearchEntry {
  title: string;
  section: string; // group label shown in the dropdown
  to: string;
}

const PAGE_ENTRIES: SearchEntry[] = [
  { title: "Home", section: "Pages", to: "/" },
  { title: "Role", section: "Pages", to: "/role" },
  { title: "Company", section: "Pages", to: "/company" },
  { title: "Frameworks", section: "Pages", to: "/frameworks" },
  { title: "Resume Drill", section: "Pages", to: "/resume" },
  { title: "Story Builder", section: "Pages", to: "/resume?mode=story" },
  { title: "Tone Shifter", section: "Pages", to: "/tone-shifter" },
  { title: "Mock Interview", section: "Pages", to: "/mock-interview" },
  { title: "Community", section: "Pages", to: "/community" }
];

let cached: SearchEntry[] | null = null;
let inflight: Promise<SearchEntry[]> | null = null;

// Built once per page session (module-level cache) - every keystroke
// filters the already-fetched index in memory, never re-fetches.
export async function buildSearchIndex(): Promise<SearchEntry[]> {
  if (cached) return cached;
  if (inflight) return inflight;

  inflight = (async () => {
    const entries: SearchEntry[] = [...PAGE_ENTRIES];

    for (const role of CANONICAL_ROLES) {
      entries.push({ title: role, section: "Role", to: `/role?role=${encodeURIComponent(role)}` });
    }
    for (const company of POPULAR_COMPANIES) {
      entries.push({ title: company, section: "Company", to: "/company" });
    }

    try {
      const taxonomy = await apiFetch<FrameworksTaxonomyResponse>("/api/frameworks/taxonomy", {}, "");
      for (const d of taxonomy.domains || []) {
        entries.push({ title: d.domain, section: "Frameworks", to: "/frameworks" });
        for (const sub of d.subdomains || []) {
          entries.push({ title: sub, section: "Frameworks", to: "/frameworks" });
        }
      }
    } catch {
      // Frameworks taxonomy unavailable - search still works for every
      // other section, just without that one's content indexed.
    }

    try {
      const community = await apiFetch<CommunityListResponse>("/api/community", {}, "");
      for (const c of community.contributions || []) {
        const title = c.company || c.role || c.content.slice(0, 60);
        entries.push({ title, section: "Community", to: "/community" });
      }
    } catch {
      // Same - community index just comes up empty, not broken.
    }

    cached = entries;
    return entries;
  })();

  return inflight;
}

export interface SearchResultGroup {
  section: string;
  items: SearchEntry[];
}

const MAX_RESULTS = 8;

export function searchEntries(query: string, index: SearchEntry[]): SearchResultGroup[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const matches = index.filter(e => e.title.toLowerCase().includes(q)).slice(0, MAX_RESULTS * 2);
  const groups: SearchResultGroup[] = [];
  let count = 0;
  for (const m of matches) {
    if (count >= MAX_RESULTS) break;
    let group = groups.find(g => g.section === m.section);
    if (!group) {
      group = { section: m.section, items: [] };
      groups.push(group);
    }
    group.items.push(m);
    count++;
  }
  return groups;
}
