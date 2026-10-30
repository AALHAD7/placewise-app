import { Router } from "express";
import multer from "multer";
import { supabase } from "../lib/supabase.js";
import { checkInterviewProof } from "../lib/gemini.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import { errorDetail } from "../lib/errors.js";

const router = Router();
const ALLOWED_TYPES = ["interview_qa", "case_study", "framework"];

const PROOF_BUCKET = "community-proofs";
const ALLOWED_PROOF_MIMETYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_PROOF_MIMETYPES.includes((file.mimetype || "").split(";")[0].trim())) {
      return cb(new Error("Unsupported file type"));
    }
    cb(null, true);
  }
});

let proofBucketEnsured = false;
async function ensureProofBucket() {
  if (proofBucketEnsured) return;
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) throw error;
  if (!buckets.some(b => b.name === PROOF_BUCKET)) {
    // Private - these screenshots likely contain a real email address or
    // name, unlike the public casebook-images bucket.
    const { error: createError } = await supabase.storage.createBucket(PROOF_BUCKET, { public: false });
    if (createError) throw createError;
  }
  proofBucketEnsured = true;
}

// No list endpoint existed before — /contribute could store a submission but
// nothing could ever read it back, so the Community page had nothing real to
// show. Public/optionalAuth since browsing shared prep notes shouldn't
// require being logged in, only submitting one should. Deliberately never
// selects proof_storage_path/proof_ai_* - that's reviewer-only context, not
// something every visitor to this public list should see.
router.get("/", optionalAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("community_contributions")
      .select("id, type, company, role, content, sources, status, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;

    res.json({ success: true, contributions: data || [] });
  } catch (err) {
    console.error("[community/list]", err);
    res.status(500).json({ success: false, error: "Failed to fetch contributions.", detail: errorDetail(err) });
  }
});

// "Members" for the Home page's community card = distinct REAL (non-guest)
// users with at least one real logged activity - not total signups (an
// account that never did anything isn't a meaningful "member"), and not
// anonymous guest sessions (most user_activity rows in practice: a guest
// session is a throwaway 3-hour identity, never a returning "member" in any
// sense this card means). Avatars are real too: each one is a genuine
// signed-up user's initials, the same derivation the frontend already uses
// for its own session name (apiClient.ts's decodeSessionDisplayName), just
// computed here from auth.users via the admin API since the backend has no
// profiles table to read a display name from.
router.get("/summary", async (req, res) => {
  try {
    const { data: rows, error } = await supabase
      .from("user_activity")
      .select("user_id")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;

    const distinctIds = [...new Set((rows || []).map(r => r.user_id))];

    const avatars = [];
    let memberCount = 0;
    for (const id of distinctIds) {
      const { data, error: userErr } = await supabase.auth.admin.getUserById(id);
      if (userErr || !data?.user || data.user.is_anonymous || !data.user.email) continue;
      memberCount++;
      if (avatars.length >= 4) continue;
      const local = data.user.email.split("@")[0] || "";
      const initials = local
        .split(/[._-]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(w => w[0].toUpperCase())
        .join("") || "?";
      avatars.push({ initials });
    }

    res.json({
      success: true,
      memberCount,
      showCount: memberCount >= 25,
      avatars
    });
  } catch (err) {
    console.error("[community/summary]", err);
    res.status(500).json({ success: false, error: "Failed to load community summary.", detail: errorDetail(err) });
  }
});

// A proof screenshot (email thread, calendar invite, offer letter, etc.) is
// required for every submission - Gemini does a soft plausibility read on it
// (checkInterviewProof, see gemini.js for exactly what that can and can't
// tell you) and the result is stored for a human reviewer, but it never
// blocks the submission outright: every contribution still lands as
// 'pending' either way, same status this table already had before this
// feature existed. The point is a real human eventually looks at real proof,
// not that an AI call gatekeeps it.
router.post("/contribute", requireAuth, upload.single("proof"), async (req, res) => {
  const { type, company, role, content, sources } = req.body || {};

  if (!ALLOWED_TYPES.includes(type)) {
    return res.status(400).json({ error: `type must be one of: ${ALLOWED_TYPES.join(", ")}.` });
  }
  if (!content || typeof content !== "string" || content.trim().length < 10) {
    return res.status(400).json({ error: "content (string, min 10 characters) is required." });
  }
  if (content.length > 5000) {
    return res.status(400).json({ error: "content: too long (max 5000 characters)." });
  }
  if (company !== undefined && company !== null && (typeof company !== "string" || company.length > 200)) {
    return res.status(400).json({ error: "company must be a string (max 200 characters)." });
  }
  if (role !== undefined && role !== null && (typeof role !== "string" || role.length > 200)) {
    return res.status(400).json({ error: "role must be a string (max 200 characters)." });
  }
  let sourcesArr;
  try {
    sourcesArr = typeof sources === "string" && sources ? JSON.parse(sources) : sources;
  } catch {
    return res.status(400).json({ error: "sources must be a JSON array of strings." });
  }
  if (sourcesArr !== undefined && sourcesArr !== null && (!Array.isArray(sourcesArr) || sourcesArr.length > 10 || sourcesArr.some(s => typeof s !== "string" || s.length > 500))) {
    return res.status(400).json({ error: "sources must be an array of strings (max 10 items, 500 chars each)." });
  }
  if (!req.file) {
    return res.status(400).json({ error: "proof (an image - screenshot of an interview confirmation email, calendar invite, etc.) is required." });
  }

  try {
    await ensureProofBucket();

    const ext = (req.file.mimetype.split("/")[1] || "jpg").replace("jpeg", "jpg");
    const storagePath = `${req.user.id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from(PROOF_BUCKET).upload(storagePath, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: false
    });
    if (uploadError) throw uploadError;

    const proofCheck = await checkInterviewProof({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      company: company || null,
      role: role || null
    });

    const { data, error } = await supabase
      .from("community_contributions")
      .insert({
        contributor_id: req.user.id,
        type,
        company: company || null,
        role: role || null,
        content,
        sources: Array.isArray(sourcesArr) ? sourcesArr : null,
        proof_storage_path: storagePath,
        proof_ai_plausible: proofCheck.plausible,
        proof_ai_note: proofCheck.note
      })
      .select("id")
      .single();
    if (error) throw error;

    res.json({
      success: true,
      contributionId: data.id,
      status: "pending",
      message: "Thanks! Your contribution and proof are being reviewed by our community."
    });
  } catch (err) {
    console.error("[community/contribute]", err);
    res.status(500).json({ success: false, error: "Failed to submit contribution.", detail: errorDetail(err) });
  }
});

export default router;
