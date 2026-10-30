-- Phase C0.9: corpus cleanup schema. Three additions to document_chunks:
--
-- 1. is_active - the 81 .txt/.pdf duplicate pairs found in C0.1 are real
--    duplicates (every one of the 81 has the .pdf side with far fewer
--    chunks than the .txt side - up to 245x fewer, consistent with garbled/
--    truncated extraction). Never deleting source content per instruction -
--    is_active=false just excludes a chunk from retrieval. match_document_
--    chunks (below) is updated to filter on it.
--
-- 2. source_class / school / club / cb_year - per-file classification
--    (club_casebook / commercial / certification / external_academic /
--    unattributed), attached to every chunk of that file - the same
--    file-level-attribute-repeated-per-chunk pattern this schema already
--    uses for `domain` (there's no separate "files" table to join against).
--    `year` is avoided as a bare identifier in favor of `cb_year` purely for
--    readability in queries that also select a row's own timestamp `year`
--    extract - Postgres itself doesn't reserve the word.
--
-- Populated by a follow-up data migration after classification completes
-- (migration_038) - this file is schema-only plus the duplicate deactivation,
-- which doesn't depend on classification.

alter table document_chunks add column if not exists is_active boolean not null default true;
alter table document_chunks add column if not exists source_class text;
alter table document_chunks add column if not exists school text;
alter table document_chunks add column if not exists club text;
alter table document_chunks add column if not exists cb_year text;

create index if not exists document_chunks_is_active_idx on document_chunks(is_active);
create index if not exists document_chunks_source_class_idx on document_chunks(source_class);

-- The 81 .pdf twins identified in Phase C0.1 (every .txt/.pdf base-name pair
-- in the corpus - confirmed zero pdf-only files exist, so this list is
-- exhaustive for "pdf twin of a better txt version").
update document_chunks set is_active = false where source_file in (
  'IIMA-Consult-Prep-Book-Case-Book-2025-26.pdf',
  'IIM B Consulting Casebook 2025.pdf',
  'The Consulting Club, FMS, Casebook 2025-26.pdf',
  'IIM Calcutta Consulting CaseBook 2025-26.pdf',
  'Cracking the PM Interview - by Gayle Laakmann McDowell & Jackie Bavaro.pdf',
  'The FMS Consulting CaseBook 2024-25.pdf',
  'HR Final Compendium 2022.pdf',
  'Heard_on_The_Street_Quantitative_Questions_from_Wall_Street_Job_Interviews.pdf',
  'TRANSFORMATIVE_HR.pdf',
  'The FMS Consulting CaseBook 2023-24 (1).pdf',
  'IIM L Consulting Casebook 2025.pdf',
  'Securities Markets Advanced.pdf',
  'Capital Market (Dealers) Module .pdf',
  'IIMK Kasebook 2025.pdf',
  'ISB Consulting Casebook 2025.pdf',
  'The FMS Consulting Casebook 2021-22.pdf',
  'Inspired-Marty-Cagan.pdf',
  'Product_Management_in_Practice_-_Matt_LeMay.pdf',
  'IIMA - PM Casebook 2.pdf',
  'IIMA - PM Casebook.pdf',
  'IIML_CaseBook_Interviews 22-23.pdf',
  'FMS_Casebook_20-21.pdf',
  'NCFM Technical Analysis.pdf',
  'Marketing FMS.pdf',
  'Mergers and Acquisitions.pdf',
  'Derivative_Market_Dealers_Module.pdf',
  'Commercial Banking Beginner_s Module.pdf',
  'Financial_Markets_(Advanced)_Module.pdf',
  'Project_Finance_Module.pdf',
  'Fundamental_Analysis_Module.pdf',
  'Venture_Capital_and_Private_Equity_Module.pdf',
  'Wealth_Management_Module.pdf',
  'IIMC - MarC COMPENDUM 2022.pdf',
  'XLRI_The PM Pocketbook - 2022-23.pdf',
  'SEED Preparatory Material - HR-1.pdf',
  'NCFM Financial Markets Beginner_s module.pdf',
  'Beta - Markets Primer_2022.pdf',
  'IIMB_Sigma_PMCaseBook_2022.pdf',
  'IIM A GenMan Guide.pdf',
  '2.Derivatives_Dun_Bradstreet.pdf',
  'IIM C GenMan GD & Company Guide.pdf',
  'IIM B-PM Handbook.pdf',
  'Merger_Read.pdf',
  'Equity_Derivatives_A_Beginner’s_Module.pdf',
  'Currency_Derivatives_Beginner_s_Module.pdf',
  'DCF_Read.pdf',
  'Valuation_Read.pdf',
  'XLRI - Company Write-ups & SIP experience 2019.pdf',
  '4.Dilutive Securities _ EPS.pdf',
  '5.Option Trading Strategies.PDF',
  'Options Trading Strategies.pdf',
  'Law_IR_Compendium_2021.pdf',
  'Beta - Investment Banking Primer-2022.pdf',
  'Law_IR_Compendium made by Jr team 2022.pdf',
  'Investment Banking Primer.pdf',
  'SAPPHIRE_HR _Compendium .pdf',
  'SRCC Guesstimates-Book-Volume-1-6.pdf',
  'Markets Primer.pdf',
  'Corporate Finance Primer.pdf',
  'EV_Read.pdf',
  '4.Black Scholes _ Greeks.pdf',
  'Organization Behaviour -SIP.pdf',
  '1.Derivatives_Capsule.pdf',
  'Relative_or_Comparable_Valuation.pdf',
  '5. Relative_or_Comparable_Valuation.pdf',
  '03.Stock Basics Tutorial.pdf',
  '6.Sector specific ratios and valuation.pdf',
  'PEVC Society_Valuation 101.pdf',
  'Valuation Session DCF.pdf',
  'Beta - PE & VC Primer.pdf',
  'Valuation Session Rel Val.pdf',
  '01.Bond Basics Tutorial.pdf',
  '3.M_A+IPO.pdf',
  'PEVC Society_M_A 101.pdf',
  'PEVC Society_Venture Capital 101.pdf',
  'MEASURING-HR.pdf',
  'IIM C GenMan Personals Prep.pdf',
  '8.Valuation for Banks.pdf',
  'CRP_General HRM.pdf',
  'T_D.pdf',
  'Resource - Product Metrics.pdf'
);

-- Run this after applying, to confirm the count:
--   select is_active, count(*) from document_chunks group by is_active;

-- match_document_chunks now excludes inactive chunks from every caller
-- (roleTopics.js, skillContent.js, mockInterview.js, resume.js, story.js,
-- frameworksGrounding.js, roleCompanyTopicNotes.js) with no code changes
-- needed at any call site - the exclusion lives in the RPC itself.
--
-- Postgres refuses `create or replace` when it sees the function's OUT-
-- parameter row type as changed, even with an identical RETURNS TABLE list
-- (a known quirk, not specific to this change) - drop first, then create.
drop function if exists match_document_chunks(vector, integer, text);
create function match_document_chunks(
  query_embedding vector(768),
  match_count int default 6,
  filter_domain text default null
)
returns table (
  id bigint,
  domain text,
  source_file text,
  content text,
  similarity float
)
language sql stable
as $$
  select
    document_chunks.id,
    document_chunks.domain,
    document_chunks.source_file,
    document_chunks.content,
    1 - (document_chunks.embedding <=> query_embedding) as similarity
  from document_chunks
  where is_active = true
    and (filter_domain is null or document_chunks.domain = filter_domain)
  order by document_chunks.embedding <=> query_embedding
  limit match_count;
$$;
