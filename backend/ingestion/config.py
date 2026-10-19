"""Shared config for the C0.95 high-fidelity PDF re-ingestion pipeline."""
import os
from pathlib import Path
from dotenv import load_dotenv

INGESTION_DIR = Path(__file__).parent
BACKEND_DIR = INGESTION_DIR.parent
load_dotenv(BACKEND_DIR / ".env")

# Secrets are read lazily (PEP 562 module __getattr__), so modules and unit
# tests that never talk to Supabase/Gemini import cleanly without backend/.env.
# `from config import GEMINI_API_KEY` still works when the variable is set and
# raises a clear error when it isn't.
_SECRET_NAMES = ("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "GEMINI_API_KEY")


def __getattr__(name):
    if name in _SECRET_NAMES:
        val = os.environ.get(name)
        if not val:
            raise RuntimeError(f"{name} is not set (expected in backend/.env)")
        return val
    raise AttributeError(f"module 'config' has no attribute {name!r}")

# Same cascade order as backend/src/lib/gemini.js's GENERATION_MODELS,
# capped to the flash-lite tier (MAX_CASCADE_TIER=3) - MODEL_LIGHT for this
# pipeline's vision calls, matching the ground rule.
GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta"
VISION_MODELS = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-2.5-flash-lite"]
EMBEDDING_MODEL = "gemini-embedding-001"
EMBEDDING_DIM = 768  # must match document_chunks.embedding's dimension exactly

STORAGE_BUCKET = "casebook-source"
RENDER_DPI = 150  # ground rule: pages/<file_id>/<page_no>.png at 150 dpi

TEXT_MIN_CHARS = 200
VISUAL_COVERAGE_THRESHOLD = 0.30

PILOT_CALL_CAP = 300

# Fidelity thresholds (fidelity.check_page). Number/word values are the v1
# inline values, kept so v1 vs v2 coverage stays comparable; tuning is R2's job.
NUMBER_COVERAGE_MIN = 1.0
WORD_COVERAGE_MIN = 0.98
# diagram-transcription skill: every diagram label must appear on the page.
DIAGRAM_LABEL_COVERAGE_MIN = 1.0

# Vision prompt v2 (R1.03): placewise-diagram blocks + one validation-driven retry.
# r1-diagrams-v2 (R1.08): exact quotes, no links, chevron edges, convergence -> flow,
# circled letters in labels, no blocks in tables, literal summaries.
PROMPT_VERSION = "r1-diagrams-v2"
VISION_MAX_TOKENS = 8192  # diagram JSON is verbose; 3000 risked truncation
VISION_RETRY_ON_DIAGRAM_FAIL = True
# Hard cap on vision HTTP requests per page (all models, all attempts).
VISION_MAX_CALLS_PER_PAGE = 2
# A 429 is retried on the same model only if Gemini asks for a short wait.
VISION_429_MAX_WAIT_S = 10.0
