-- Run in the Supabase SQL editor. Adds the company's resolved full name
-- (e.g. "JPMC" -> "JPMorgan Chase & Co.", "ABFRL" -> "Aditya Birla Fashion
-- and Retail Limited") to the overview cache, extracted by the same Gemini
-- research call companyOverview.js already makes for every company - see
-- FORMAT_SYSTEM_PROMPT's new "canonicalName" field. Shown on the Company
-- page next to the logo and in the search box instead of whatever
-- abbreviation/short form the student typed, once resolved.

alter table company_overview_cache add column if not exists canonical_name text;
