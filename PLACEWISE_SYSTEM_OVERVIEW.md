# PlaceWise: Architectural & Operational Overview
*An AI-Augmented, Casebook-Grounded Placement Preparation Platform for MBA Candidates*

**Author:** Aalhad (MBA Candidate, IIM Trichy)  
**Document Purpose:** Academic & Technical Briefing for Faculty Review  
**Date:** November 2026  

---

## 1. Executive Summary

Every year, MBA students across premier Indian business schools prepare for competitive placement drives (Consulting, Product Management, Investment Banking, General Management) using "casebooks" — 300+ page compendia compiled by student consulting clubs (e.g., IIM Ahmedabad, IIM Bangalore, IIM Calcutta, IIM Kozhikode). 

While rich in institutional knowledge, these casebooks suffer from major usability challenges:
1. **Unstructured Knowledge**: Students spend hours flipping through static PDFs searching for relevant frameworks or guesstimate approaches.
2. **Generic LLM Hallucinations**: Standard AI assistants (such as ChatGPT or Claude) provide generic, theoretical business answers rather than the specific frameworks, numbering styles, and rigorous interview conventions expected in Indian B-school placement interviews.
3. **Static & Blurry Visuals**: Complex issue trees and 2×2 matrices in scanned PDFs cannot be searched, customized, or viewed cleanly on modern screens.

**PlaceWise** is a specialized, web-based placement prep platform built to solve these challenges. Instead of reading a 350-page PDF to learn one framework, a student asks for what they need and receives a verified, plain-language explanation strictly grounded in authentic college casebooks, accompanied by dynamically reconstructed vector diagrams, real-time guesstimate evaluation, and resume-tailored interview drillers.

---

## 2. System Architecture

PlaceWise is architected as a high-performance, decoupled three-tier application designed to operate with high reliability and near-zero infrastructure cost.

```
+--------------------------------------------------------------------------------+
|                                CLIENT TIER                                     |
|  React 18 + TypeScript + Vite SPA (Deployed on Vercel Global Edge Network)     |
|  - Obsidian Dark UI (Glassmorphic components, responsive mobile & desktop)     |
|  - Dynamic SVG / Mermaid / ASCII Diagram Renderers                             |
|  - Client-side Route Tracking & Single Page Application State Management       |
+---------------------------------------+----------------------------------------+
                                        | HTTPS / REST
                                        v
+--------------------------------------------------------------------------------+
|                              APPLICATION TIER                                  |
|  Node.js 22 + Express REST API (Deployed on Render Cloud Infrastructure)       |
|  - In-flight Request Deduplication (`singleFlight` pattern)                    |
|  - Campus Wi-Fi NAT-aware Rate Limiting (3,000 req/15min per IP)               |
|  - 2-Stage Grounding & Dual-Judge Faithfulness Verification Engine             |
|  - Multi-tier LLM Cascade Controller                                           |
+-------------------+------------------------------------+-----------------------+
                    |                                    |
                    v                                    v
+-------------------------------------+  +---------------------------------------+
|             DATA TIER               |  |           INTELLIGENCE TIER           |
|  Supabase (PostgreSQL 15 + pgvector)|  |  Google Gemini API Model Cascade      |
|  - 768-dim Casebook Chunks Table    |  |  - gemini-3.5-flash-lite (Primary)   |
|  - match_document_chunks RPC        |  |  - gemini-3.1-flash-lite (Fallback)  |
|  - PostgREST HTTPS Connection Pool  |  |  - gemini-2.5-flash-lite (Fallback)  |
|  - Anonymous Guest & User Auth      |  |  - gemini-3.5-flash (Escalation)     |
+-------------------------------------+  +---------------------------------------+
```

### Technology Stack Summary
* **Frontend**: React 18, Vite, TypeScript, Lucide Icons, Custom CSS Design Tokens.
* **Backend**: Node.js 22, Express.js (ES Modules), Helmet security headers, CORS protection.
* **Database & Vector Store**: Supabase (PostgreSQL with `pgvector` extension, PostgREST API).
* **Embeddings**: `gemini-embedding-001` (768-dimensional Matryoshka embeddings).
* **LLM Engine**: Google Gemini API cascade (Flash-Lite / Flash models).

---

## 3. Core Technical Innovation: The Grounded RAG Pipeline

The defining feature of PlaceWise is its **strict grounding policy**. General-purpose AI models tend to hallucinate or summarize information superficially. PlaceWise implements an offline ingestion and online retrieval pipeline that enforces casebook fidelity.

```
[Offline Ingestion Pipeline]
 PDF Casebook ──> Page Classification ──> Layout / Vision Extraction ──> Diagram Transcription (JSON) ──> 768-dim Embeddings ──> Supabase pgvector

[Online Student Query Pipeline]
 Student Query ──> 768-dim Embedding ──> Cosine Vector Search ──> Threshold Gate
                                                                         │
                                                ┌────────────────────────┴────────────────────────┐
                                                │ (Below Similarity Threshold)                     │ (Above Threshold)
                                                v                                                 v
                                   Labelled General AI Guidance                      Gemini Paraphrase Generator
                                                                                                  │
                                                                                                  v
                                                                                     Dual-Judge Faithfulness Check
                                                                                                  │
                                                                       ┌──────────────────────────┴──────────────────────────┐
                                                                       │ (Passes Check)                                      │ (Fails Check)
                                                                       v                                                     v
                                                          Plain-Language Grounded Answer                      Verbatim Casebook Excerpt
```

### Step 1: Offline Ingestion & Page Classification
1. Source casebooks (from IIMA, IIMB, IIMC, IIMK) are processed using layout-aware computer vision models (Docling + Gemini Vision).
2. Each page is classified: Cover, Index, Framework, Guesstimate, Interview Transcript, or Other.
3. Only official student club casebooks (`source_class = club_casebook`) are ingested. Third-party commercial prep material is rejected to maintain pedigree and legal compliance.

### Step 2: Structured Diagram Transcription
Instead of storing scanned PDF images that look blurry on mobile screens, diagrams (issue trees, 2×2 matrices, value-chain flows) are transcribed into structured JSON specifications. When a student opens a framework, the React frontend renders a crisp, vector-based interactive diagram.

### Step 3: Semantic Vector Retrieval
1. When a student searches for a concept (e.g., *"How do I structure market entry for an EV charging network?"*), the query is converted into a 768-dimensional embedding using `gemini-embedding-001`.
2. Supabase runs an optimized cosine-similarity search (`match_document_chunks` RPC) across thousands of pre-embedded casebook chunks.

### Step 4: The 2-Stage Anti-Hallucination Guardrails
To prevent AI hallucination, PlaceWise applies a two-stage filter:
* **Threshold Gate**: If the similarity score is below a strict threshold (0.65 for text, 0.72 for diagrams), the system explicitly informs the student that the casebooks do not cover the topic, and provides a clearly-labelled general AI fallback. Casebook knowledge and general AI advice are never silently mixed.
* **Dual-Judge Faithfulness Check**: If the casebook covers the topic, Gemini paraphrases the raw text into a natural, conversational explanation. Before displaying it to the student, a **second independent LLM judge call** compares the paraphrase against the raw casebook text. If the paraphrase added, omitted, or altered any fact, number, or logic, the paraphrase is discarded and the student receives the exact verbatim casebook excerpt.

---

## 4. End-to-End Feature Workflows

### 1. Frameworks & Consulting Engine
* **Purpose**: Teaches consulting frameworks (Profitability, Market Entry, M&A, Value Chain, Pricing) contextualized for Indian cases.
* **Workflow**: The student chooses a domain and topic. PlaceWise retrieves the top-ranked casebook chunk, renders the reconstituted vector diagram (e.g., tree or matrix), and provides an interactive ask box allowing follow-up questions grounded strictly in that framework's source pages.

### 2. Guesstimates Practice Module
* **Purpose**: Trains students on numerical market-sizing and estimation questions common in consulting and product management interviews.
* **Workflow**: 
  1. Real guesstimate problems sourced from casebooks are presented with interactive 5, 10, or 15-minute countdown timers.
  2. The student types their structured approach (Clarifying Questions, Segmentation Formula, Assumptions, Calculation, Gut-Check).
  3. Upon submission, the AI evaluator grades the answer against authentic casebook benchmarks, scoring structure, math sanity, and identifying missing edge cases.

### 3. Dynamic Resume Drill
* **Purpose**: Generates hyper-specific interview questions based on the candidate's actual background.
* **Workflow**:
  1. The student uploads their PDF or DOCX CV.
  2. PlaceWise parses the resume text and extracts company names, metrics, and functional responsibilities.
  3. The system synthesizes tailored behavioral questions (using the STAR format) and role-specific technical questions (e.g., *"At Infosys, you reduced batch latency by 30% using Redis — how did you handle cache invalidation?"*).

### 4. Company & Role Intelligence
* **Purpose**: One-stop briefing dossier for company-specific interview prep.
* **Workflow**: Aggregates structured intelligence for top recruiters (McKinsey, BCG, Bain, HUL, Amazon, Tata). Displays business models, leadership, recent strategic moves, value chains, and past interview ratings.

### 5. Mock Interview & Voice Practice
* **Purpose**: Simulates conversational interview pressure.
* **Workflow**: Students can speak their responses using browser-based voice recording (Web Audio API), receive instant speech-to-text transcription, and receive actionable rubrics on tone, conciseness, and structured thinking.

---

## 5. Engineering Reliability & Efficiency

A common challenge for student projects is running out of cloud credits or crashing during peak usage. PlaceWise incorporates several enterprise-grade engineering practices:

### A. In-Flight Request Deduplication (`singleFlight`)
When 30 students concurrently open the same framework or company page, a standard server would fire 30 separate API calls to Google Gemini, exhausting quotas. PlaceWise implements the `singleFlight` pattern: the first request initiates the call, and all concurrent requests hook into that exact same in-flight Promise. Once resolved, the result is saved to the database. The subsequent 29 students receive the response in 0ms with zero extra API cost.

### B. Campus Wi-Fi NAT Optimization
On an MBA campus, all 150+ students in hostels and classrooms connect through an institutional Wi-Fi gateway sharing a single public IP address. Standard IP-based rate limiters (typically 60–100 requests per IP) falsely block entire batches within minutes. PlaceWise sizes its global ingress limiter to **3,000 requests per 15 minutes** while tracking sensitive AI actions on authenticated user IDs, guaranteeing smooth concurrent usage during placement week.

### C. Multi-Tier Model Cascade
To guarantee 99.9% uptime on a modest budget (~$20/month), PlaceWise implements a four-tier model cascade. If Google rate-limits `gemini-3.5-flash-lite`, the engine instantly degrades to `gemini-3.1-flash-lite`, `gemini-2.5-flash-lite`, and full `gemini-3.5-flash` before raising an error.

---

## 6. Future Expansion & Academic Implications

PlaceWise demonstrates how specialized RAG architectures can democratize institutional knowledge in higher education:
* **Pedagogical Impact**: Replaces passive reading of 400-page PDFs with active, verified, question-driven learning.
* **Institutional Memory**: Enables college clubs to preserve placement prep knowledge across graduating batches without data degradation.
* **Multi-Domain Expansion**: The underlying RAG architecture is currently being expanded from Consulting into Corporate Finance, Brand Management, and HR domains.

---
*For a live demonstration or code walkthrough, visit [placewise-io.vercel.app](https://placewise-io.vercel.app).*
