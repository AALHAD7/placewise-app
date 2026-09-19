import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { errorDetail } from "./lib/errors.js";
import { generalLimiter } from "./middleware/rateLimit.js";
import resumeRouter from "./routes/resume.js";
import storyRouter from "./routes/story.js";
import toneRouter from "./routes/tone.js";
import mockInterviewRouter from "./routes/mockInterview.js";
import frameworksRouter from "./routes/frameworks.js";
import companiesRouter from "./routes/companies.js";
import communityRouter from "./routes/community.js";
import newsRouter from "./routes/news.js";
import chatRouter from "./routes/chat.js";
import devRouter from "./routes/dev.js";
import transcribeRouter from "./routes/transcribe.js";
import rolesRouter from "./routes/roles.js";
import skillsRouter from "./routes/skills.js";
import activityRouter from "./routes/activity.js";

const REQUIRED_ENV = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "GEMINI_API_KEY", "GNEWS_API_KEY"];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length) {
  console.warn(`[server] Missing env vars: ${missing.join(", ")}. Copy backend/.env.example to backend/.env and fill these in.`);
}

const isProd = process.env.NODE_ENV === "production";

// Comma-separated list of allowed browser origins in production, e.g.
// "https://placementmasteryhub.com,https://www.placementmasteryhub.com".
// Falls back to allowing any origin in development so the design-canvas
// frontend (opened as a local file / from any dev port) keeps working
// without extra setup.
const allowedOrigins = (process.env.FRONTEND_ORIGIN || "")
  .split(",")
  .map(o => o.trim())
  .filter(Boolean);

const app = express();

// Render/Vercel/most PaaS terminate TLS at a proxy in front of this process
// and forward the original scheme via X-Forwarded-Proto — trust that so
// secure-cookie/HTTPS-redirect logic below sees the real protocol.
app.set("trust proxy", 1);

app.use(helmet());

if (isProd) {
  // Defense in depth: the host already forces HTTPS at the edge (see
  // DECISIONS LOG — Vercel/Render), but reject any request that somehow
  // reaches this process over plain HTTP rather than silently serving it.
  app.use((req, res, next) => {
    if (req.secure || req.get("x-forwarded-proto") === "https") return next();
    res.status(403).json({ error: "HTTPS required." });
  });
}

app.use(cors(
  allowedOrigins.length
    ? { origin: allowedOrigins }
    : isProd
      ? { origin: false } // no FRONTEND_ORIGIN configured in prod: fail closed, not open
      : {} // development: reflect any origin
));
app.use(generalLimiter);
app.use(express.json({ limit: "1mb" }));

app.get("/health", (req, res) => res.json({ ok: true }));
app.use("/api/resume", resumeRouter);
app.use("/api/story", storyRouter);
app.use("/api/tone", toneRouter);
app.use("/api/mock-interview", mockInterviewRouter);
app.use("/api/frameworks", frameworksRouter);
app.use("/api/companies", companiesRouter);
app.use("/api/community", communityRouter);
app.use("/api/news", newsRouter);
app.use("/api/chat", chatRouter);
app.use("/api/dev", devRouter);
app.use("/api/transcribe", transcribeRouter);
app.use("/api/roles", rolesRouter);
app.use("/api/skills", skillsRouter);
app.use("/api/activity", activityRouter);

// Without this, an error thrown/passed before a route's own try/catch runs
// (e.g. Multer rejecting an oversized upload) falls through to Express's
// default HTML error page instead of the JSON every other error path returns.
app.use((err, req, res, next) => {
  console.error("[unhandled]", err);
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "File too large." });
  }
  if (err.message === "Unsupported file type") {
    return res.status(400).json({ error: "Unsupported file type." });
  }
  res.status(500).json({ error: "Unexpected server error.", detail: errorDetail(err) });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`PMH backend listening on http://localhost:${PORT}`));
