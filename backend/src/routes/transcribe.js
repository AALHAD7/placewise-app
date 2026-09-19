import { Router } from "express";
import multer from "multer";
import { transcribeAudio } from "../lib/gemini.js";
import { requireAuth } from "../middleware/auth.js";
import { aiLimiter } from "../middleware/rateLimit.js";
import { errorDetail } from "../lib/errors.js";

const router = Router();
const ALLOWED_AUDIO_MIMETYPES = [
  "audio/webm", "audio/ogg", "audio/wav", "audio/x-wav", "audio/mp4", "audio/mpeg", "audio/aac"
];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    // Browsers report MediaRecorder.mimeType with codec parameters attached
    // (Chrome/Firefox default to "audio/webm;codecs=opus", confirmed by this
    // project's own earlier direct testing — see DOCUMENT.md) — match on the
    // base type only, or every real voice recording gets rejected.
    const baseType = (file.mimetype || "").split(";")[0].trim();
    if (!ALLOWED_AUDIO_MIMETYPES.includes(baseType)) {
      return cb(new Error("Unsupported file type"));
    }
    cb(null, true);
  }
});

router.post("/", aiLimiter, requireAuth, upload.single("audio"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No audio uploaded — send it as multipart/form-data under the field name \"audio\"." });
  }

  try {
    const text = await transcribeAudio({ buffer: req.file.buffer, mimeType: req.file.mimetype || "audio/webm" });
    if (!text || !text.trim()) throw new Error("Empty transcription — try recording again.");
    res.json({ success: true, text: text.trim() });
  } catch (err) {
    console.error("[transcribe]", err);
    res.status(500).json({ success: false, error: "Failed to transcribe audio.", detail: errorDetail(err) });
  }
});

export default router;
