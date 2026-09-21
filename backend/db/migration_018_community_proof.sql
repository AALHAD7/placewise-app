-- Run in the Supabase SQL editor. Backs the Community page's "Add yours"
-- proof requirement - a screenshot (email thread, calendar invite, offer
-- letter, etc.) the contributor attaches to back up their interview claim.
-- Gemini does a soft plausibility read on it (checkInterviewProof() in
-- gemini.js) and the result is stored for a human reviewer, but never
-- blocks the submission outright - every contribution still lands as
-- 'pending' either way, same as before this feature existed.

alter table community_contributions
  add column if not exists proof_storage_path text,
  add column if not exists proof_ai_plausible boolean,
  add column if not exists proof_ai_note text;

-- Private bucket (not the public casebook-images one) - these images likely
-- contain a real email address or name, so they're never publicly served.
-- The backend's service-role key bypasses bucket ACLs anyway; this just
-- keeps anonymous/anon-key access out. Created here if the bucket doesn't
-- already exist from the backend's own lazy ensureProofBucket() - either
-- path is fine, this is just belt-and-suspenders since bucket creation via
-- SQL needs the storage extension's functions, which not all projects have
-- exposed the same way, so the backend creating it at runtime is the
-- primary path and this is a no-op if that already ran.
insert into storage.buckets (id, name, public)
values ('community-proofs', 'community-proofs', false)
on conflict (id) do nothing;
