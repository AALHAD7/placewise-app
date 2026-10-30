# Model Usage

All models below are **verified live** from your API key via `GET /v1/models` on `https://integrate.api.nvidia.com/v1`.
**Total: 85 models** as of October 2026.

- **Base URL:** `https://integrate.api.nvidia.com/v1`
- **Compatible with:** OpenAI SDK — just swap `base_url` and `api_key`

```python
from openai import OpenAI
client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key="nvapi-..."
)
# List all live models at any time:
models = client.models.list()
for m in models: print(m.id)
```

---

## ⚡ Rate Limits — Overview

| Tier | Rate Limit | Notes |
|---|---|---|
| **Free / Eval** | ~40 RPM per model | Shared infra; dynamic — heavy models throttle earlier |
| **Paid / Partner** | Custom (200+ RPM) | Contact NVIDIA for production SLAs |
| **Self-Hosted NIM** | Unlimited | Deploy NIM Docker containers on your own GPU infra |

> **Key rules:**
> - ~40 RPM is the community-confirmed baseline per model endpoint (not total account).
> - Exceeding limits → `HTTP 429`. Implement exponential backoff.
> - No free-tier RPM increases. To scale → self-hosted NIM or paid partner endpoint.
> - Free tier = **prototyping only**, not for production.

---

## 🧠 Large Language Models

| API Model String | Parameters | Context | Max Output | RPM (Free) | Best Suited For |
|---|---|---|---|---|---|
| `01-ai/yi-large` | ~34B | 32K | 4,096 | ~40 | Long-context reasoning, multilingual tasks |
| `ai21labs/jamba-1.5-large-instruct` | 398B (MoE) | 256K | 4,096 | ~40 ⚠️ | Very long document understanding; hybrid SSM+Transformer |
| `aisingapore/sea-lion-7b-instruct` | 7B | 8K | 4,096 | ~40 | Southeast Asian languages (Thai, Malay, Vietnamese, etc.) |
| `databricks/dbrx-instruct` | 132B (MoE) | 32K | 4,096 | ~40 | Enterprise-grade general chat; Databricks ecosystem |
| `google/gemma-2b` | 2B | 8K | 4,096 | ~40 | Ultra-lightweight tasks; simple completions |
| `google/gemma-3-4b-it` | 4B | 128K | 4,096 | ~40 | Fast, capable; long-context at minimal compute |
| `google/gemma-3-12b-it` | 12B | 128K | 4,096 | ~40 | Balanced Google model; reasoning + long context |
| `google/gemma-4-31b-it` | 31B | 128K | 4,096 | ~40 | Google's latest Gemma; strong instruction following |
| `google/recurrentgemma-2b` | 2B | 8K | 4,096 | ~40 | Recurrent architecture; memory-efficient inference |
| `ibm/granite-3.0-3b-a800m-instruct` | 3B (sparse) | 4K | 4,096 | ~40 | Ultra-fast IBM model; quick enterprise completions |
| `ibm/granite-3.0-8b-instruct` | 8B | 4K | 4,096 | ~40 | IBM enterprise; instruction following, tool use |
| `ibm/granite-34b-code-instruct` | 34B | 8K | 4,096 | ~40 | Enterprise code generation, explanation, review |
| `ibm/granite-8b-code-instruct` | 8B | 4K | 4,096 | ~40 | Fast IBM code model; quick completions |
| `meta/llama2-70b` | 70B | 4K | 4,096 | ~40 | Legacy Llama 2; avoid for new projects (use Llama 3.x) |
| `meta/muse-glimmer-30b` | 30B | 32K | 4,096 | ~40 | Creative writing, storytelling, narrative generation |
| `minimaxai/minimax-m3.1-flash` | ~40B (MoE) | 1M | 4,096 | ~40 ⚠️ | Ultra-long context (1M tokens); document-heavy workflows |
| `mistralai/mistral-7b-instruct-v0.3` | 7B | 32K | 4,096 | ~40 | Efficient general-purpose chat and instruction following |
| `mistralai/mistral-large` | 123B | 128K | 4,096 | ~40 | Mistral's large model; complex reasoning |
| `mistralai/mistral-large-2-instruct` | 123B | 128K | 4,096 | ~40 | Mistral flagship; multi-step tasks, agentic workflows |
| `mistralai/mixtral-8x22b-v0.1` | 141B (MoE) | 64K | 4,096 | ~40 | Large mixture-of-experts; multilingual generation |
| `moonshotai/kimi-k2.6` | ~72B | 128K | 4,096 | ~40 | Strong at long-context reasoning and multilingual tasks |
| `nv-mistralai/mistral-nemo-12b-instruct` | 12B | 128K | 4,096 | ~40 | NVIDIA × Mistral co-developed; efficient 12B model |
| `openai/gpt-oss-20b` | 20B | 128K | 4,096 | ~40 | OpenAI open-weight model via NVIDIA; general purpose |
| `poolside/laguna-xs-2.1` | ~7B | 32K | 4,096 | ~40 | Code-focused small model; agentic coding tasks |
| `stepfun-ai/step-5-preview` | ~200B+ | 256K | 4,096 | ~40 ⚠️ | StepFun frontier model; complex reasoning, multimodal |
| `writer/palmyra-creative-122b` | 122B | 32K | 4,096 | ~40 | Creative writing, marketing copy, long-form content |
| `writer/palmyra-fin-70b-32k` | 70B | 32K | 4,096 | ~40 | Finance-specific; earnings analysis, financial Q&A |
| `writer/palmyra-med-70b` | 70B | 8K | 4,096 | ~40 | Medical domain; clinical notes, health Q&A |
| `writer/palmyra-med-70b-32k` | 70B | 32K | 4,096 | ~40 | Medical domain with long context; full document analysis |
| `z-ai/glm-5.3` | ~72B | 128K | 4,096 | ~40 | Zhipu GLM; strong Chinese + English bilingual reasoning |
| `z-ai/glm-5.3-flash` | ~10B | 128K | 4,096 | ~40 | Faster GLM; lightweight bilingual tasks |
| `zyphra/zamba2-7b-instruct` | 7B | 16K | 4,096 | ~40 | Hybrid SSM-Transformer; memory-efficient long-context |

---

## 🔬 Nemotron Family — NVIDIA's Flagship Models

The **Nemotron** series is NVIDIA's post-trained family built using Neural Architecture Search (NAS) + distillation on Meta's Llama. Specialised for **reasoning, tool-calling, RAG, and agentic workflows**.

### Quick Comparison

| API Model String | Parameters | Context | RPM (Free) | Reasoning Toggle | Tool Calling | Best For |
|---|---|---|---|---|---|---|
| `nvidia/llama-3.1-nemotron-ultra-253b-v1` | 253B | 128K | ~40 ⚠️ | ✅ `detailed thinking on/off` | ✅ Native | Frontier reasoning, math, science, deep agentic orchestration |
| `nvidia/nemotron-3-ultra-550b-a55b` | 550B (MoE) | 128K | ~40 ⚠️ | ✅ | ✅ | Absolute maximum capability; massive enterprise tasks |
| `nvidia/nemotron-3-super-120b-a12b` | 120B (MoE) | 128K | ~40 ⚠️ | ✅ | ✅ | High-capability mid-tier; complex reasoning at reasonable cost |
| `nvidia/llama-3.1-nemotron-70b-instruct` | 70B | 128K | ~40 | ✅ | ✅ | Strong general reasoning; balanced speed/quality |
| `nvidia/llama-3.1-nemotron-51b-instruct` | 51B | 128K | ~40 | ✅ | ✅ | Efficient; high throughput agentic tasks |
| `nvidia/nemotron-3.5-super-vl-120b-a12b` | 120B (MoE) | 128K | ~40 ⚠️ | ✅ | ✅ | Vision+Language; multimodal reasoning at scale |
| `nvidia/nemotron-3.5-lightning-30b-a3b` | 30B (MoE) | 128K | ~40 | ✅ | ✅ | Fast mid-tier; RAG and tool-calling with low latency |
| `nvidia/nemotron-nano-3-30b-a3b` | 30B (MoE) | 128K | ~40 | ✅ | ✅ | Nano efficiency with good reasoning; on-prem friendly |
| `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning` | 30B (MoE) | 128K | ~40 | ✅ | ✅ | Nano with enhanced reasoning; omni-task capable |
| `nvidia/nemotron-3.5-bolt-e4b` | 4B | 8K | ~40 | ❌ | ⚠️ | Ultra-fast Bolt model; sub-second latency for simple tasks |
| `nvidia/nemotron-4-340b-instruct` | 340B | 4K | ~40 ⚠️ | ❌ | ⚠️ | Legacy Nemotron 4; prefer Ultra/Super for new projects |
| `nvidia/nemotron-4-340b-reward` | 340B | 4K | ~40 ⚠️ | ❌ | ❌ | Reward/scoring model; RLHF pipelines, response ranking |
| `nvidia/llama3-chatqa-1.5-70b` | 70B | 128K | ~40 | ❌ | ❌ | Specialised for conversational Q&A over documents (RAG) |
| `nvidia/mistral-nemo-minitron-8b-8k-instruct` | 8B | 8K | ~40 | ❌ | ⚠️ | Pruned Mistral Nemo; efficient 8B for enterprise use |
| `nvidia/nemotron-parse` | ~7B | 8K | ~40 | ❌ | ❌ | Document parsing and structured extraction |
| `nvidia/nemotron-parse-2.0` | ~7B | 32K | ~40 | ❌ | ❌ | Improved parsing with longer context; PDF/HTML extraction |

> **Reasoning Toggle** — unique to Nemotron: pass `"detailed thinking on"` or `"detailed thinking off"` as the system message to switch between deep CoT reasoning and fast conversational mode.

---

## 👁️ Vision / Multimodal Models

| API Model String | Parameters | Context | Image Input | RPM (Free) | Best Suited For |
|---|---|---|---|---|---|
| `meta/llama-3.2-90b-vision-instruct` | 90B | 128K | Base64/URL | ~40 ⚠️ | Best open vision LLM; image Q&A, document reading, OCR-style extraction |
| `meta/llama-3.2-11b-vision-instruct` | 11B | 128K | Base64/URL | ~40 | Lighter vision; faster image understanding at lower cost |
| `nvidia/nemotron-3.5-super-vl-120b-a12b` | 120B (MoE) | 128K | Base64/URL | ~40 ⚠️ | Nemotron vision flagship; complex multimodal reasoning |
| `nvidia/llama-3.2-nemoretriever-1b-vlm-embed-v1` | 1B | 8K | Base64/URL | ~40 | Vision-language embeddings for multimodal RAG |
| `nvidia/llama-nemotron-embed-vl-1b-v2` | 1B | 8K | Base64/URL | ~40 | Improved VL embeddings; image+text retrieval |
| `nvidia/vila` | ~7B | 4K | Base64/URL | ~40 | NVIDIA VILA; video and image understanding |
| `nvidia/neva-22b` | 22B | 4K | Base64/URL | ~40 | Dense image captioning and visual scene description |
| `microsoft/phi-3-vision-128k-instruct` | 4.2B | 128K | Base64/URL | ~40 | Long-context vision; multi-page documents, slides |
| `microsoft/phi-3.5-moe-instruct` | 42B (MoE) | 128K | Base64/URL | ~40 | Phi MoE; efficient high-quality reasoning + vision |
| `microsoft/kosmos-2` | ~1.6B | 2K | Base64/URL | ~40 | Grounding model; object detection + description in images |
| `google/deplot` | ~300M | 512 | Base64/URL | ~40 | Chart/plot to data table conversion |
| `google/diffusiongemma-26b-a4b-it` | 26B | 8K | Base64/URL | ~40 | Diffusion-based Gemma; text+image generation |
| `adept/fuyu-8b` | 8B | 16K | Base64/URL | ~40 | Screen/UI understanding, digital document parsing |
| `nvidia/cosmos-reason2-8b` | 8B | 32K | Base64/URL | ~40 | Physical world reasoning; video/spatial understanding |
| `nvidia/ai-synthetic-video-detector` | — | — | Video | ~40 | Detect AI-generated / synthetic video content |

---

## 💻 Code Models

| API Model String | Parameters | Context | RPM (Free) | Best Suited For |
|---|---|---|---|---|
| `bigcode/starcoder2-15b` | 15B | 16K | ~40 | Open code model; 600+ languages, fill-in-the-middle |
| `deepseek-ai/deepseek-coder-6.7b-instruct` | 6.7B | 16K | ~40 | Code generation and completion; Python, JS, Go, Rust |
| `deepseek-ai/deepseek-v4.1-flash` | ~21B (MoE) | 128K | ~40 | DeepSeek's fast inference model; reasoning + coding |
| `google/codegemma-1.1-7b` | 7B | 8K | ~40 | Google code model v1.1; code gen, bug fix, explanation |
| `google/codegemma-7b` | 7B | 8K | ~40 | Google code model; code completion and generation |
| `meta/codellama-70b` | 70B | 100K | ~40 | Large code model; complex algorithms, refactoring |
| `mistralai/codestral-22b-instruct-v0.1` | 22B | 32K | ~40 | Mistral code; fill-in-the-middle, fast completions |
| `poolside/laguna-xs-2.1` | ~7B | 32K | ~40 | Agentic code model; multi-step coding tasks |

---

## 📐 Embedding Models

| API Model String | Dimensions | Max Input | RPM (Free) | Best Suited For |
|---|---|---|---|---|
| `nvidia/nv-embedqa-mistral-7b-v2` | 4096 | 512 | ~40 | Highest quality retrieval embeddings; best RAG accuracy |
| `nvidia/embed-qa-4` | 1024 | 512 | ~40 | Lightweight QA embeddings; fast indexing |
| `nvidia/llama-3.2-nv-embedqa-1b-v1` | 2048 | 512 | ~40 | Llama-based embeddings; multilingual retrieval |
| `nvidia/nemotron-3-embed-1b` | 2048 | 512 | ~40 | Nemotron 1B embeddings; efficient semantic search |
| `nvidia/nemotron-3.5-embed-1b` | 2048 | 512 | ~40 | Improved Nemotron embeddings; **recommended default** |
| `nvidia/nemotron-3.5-embed-8b` | 4096 | 512 | ~40 | High-quality 8B embeddings; maximum retrieval precision |
| `nvidia/llama-nemotron-embed-vl-1b-v2` | 1024 | 8K | ~40 | Vision-language embeddings for multimodal RAG |
| `nvidia/llama-3.2-nemoretriever-1b-vlm-embed-v1` | 1024 | 8K | ~40 | VLM retrieval embeddings; image+text search |
| `nvidia/nvclip` | 1024 | — | ~40 | NVIDIA CLIP; combined image + text vector embeddings |
| `snowflake/arctic-embed-l` | 1024 | 512 | ~40 | Long-document embeddings; enterprise search |

---

## 🔀 Reranking / Reward Models

| API Model String | RPM (Free) | Best Suited For |
|---|---|---|
| `nvidia/nemotron-4-340b-reward` | ~40 ⚠️ | Reward scoring for RLHF; rank model responses by quality |
| `nvidia/ising-calibration-1.5-31b` | ~40 | Calibration/scoring model; confidence estimation |

---

## 🛡️ Safety & Guardrail Models

| API Model String | RPM (Free) | Best Suited For |
|---|---|---|
| `meta/llama-guard-4-12b` | ~40 | Latest Meta safety classifier; detects harmful/unsafe content in I/O |
| `nvidia/llama-3.1-nemoguard-8b-content-safety` | ~40 | Content safety classification; enterprise policy enforcement |
| `nvidia/llama-3.1-nemoguard-8b-topic-control` | ~40 | Topic guardrail; restrict model to allowed conversation topics |
| `nvidia/llama-3.1-nemotron-safety-guard-8b-v3` | ~40 | Nemotron safety guard v3; improved harmful content detection |
| `nvidia/nemotron-3.5-content-safety` | ~40 | Nemotron content safety; multimodal policy enforcement |

---

## 🌐 Translation Models

| API Model String | RPM (Free) | Best Suited For |
|---|---|---|
| `nvidia/riva-translate-4b-instruct` | ~40 | Neural machine translation; 32+ language pairs |
| `nvidia/riva-translate-4b-instruct-v2` | ~40 | Improved translation v2; higher accuracy, domain adaptation |

---

## 🎙️ Audio / Speech Models

| API Model String | RPM (Free) | Best Suited For |
|---|---|---|
| `nvidia/nemotron-3.5-bolt-e4b` | ~40 | Also available as audio-optimised; ultra-fast voice tasks |

---

## 📋 Rate Limit Quick Reference

| Scenario | What Happens |
|---|---|
| Exceed ~40 RPM on a model | `HTTP 429 Too Many Requests` |
| Repeated 429s | Temporary throttle on that model for your account |
| Peak hours, heavy models (253B+) | Effective limit drops well below 40 RPM |
| Check current limit | Login to `build.nvidia.com` → dashboard (no API endpoint) |
| Increase free limit | **Not possible** — upgrade to paid or self-host |

### Backoff Strategy (Python)
```python
import time

def call_with_backoff(fn, retries=5):
    for attempt in range(retries):
        try:
            return fn()
        except Exception as e:
            if "429" in str(e):
                wait = 2 ** attempt  # 1s → 2s → 4s → 8s → 16s
                time.sleep(wait)
            else:
                raise
    raise RuntimeError("Max retries exceeded")
```

### Batch Job Throttle (safe for free tier)
```python
import time

for item in large_batch:
    process(item)
    time.sleep(1.5)  # 40 req/min = 1 req per 1.5s
```

---

## 🗺️ Recommended Stack for Your Placement Website

### RAG Pipeline
```
PDF / Image / Web content
    ↓  [Vision] meta/llama-3.2-11b-vision-instruct      → Extract text & structure
    ↓  [Embed]  nvidia/nemotron-3.5-embed-8b             → Generate vectors
    ↓  [Store]  Supabase pgvector                        → Store & retrieve
    ↓  [LLM]   nvidia/llama-3.3-nemotron-super-49b-v1   → Generate answer
```

### Cascade Architecture (save rate limit budget)
```
User request
    ↓
[Tier 1] nvidia/nemotron-3.5-bolt-e4b     → Fast routing, simple answers (~80% of traffic)
    ↓ (complex)
[Tier 2] nvidia/llama-3.1-nemotron-70b    → RAG gen, JD parsing, tool calls (~15%)
    ↓ (very complex)
[Tier 3] nvidia/llama-3.1-nemotron-ultra-253b-v1  → Deep inference, edge cases (~5%)
```

### Safety Layer
```
Any user input/output
    ↓  nvidia/llama-3.1-nemoguard-8b-content-safety  → Block harmful content
    ↓  nvidia/llama-3.1-nemoguard-8b-topic-control   → Keep on-topic (placements only)
```
