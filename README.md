# PlaceWise

> **The casebook-grounded interview preparation platform for MBA students in India.**

🌐 **Live Demo:** [placewise-io.vercel.app](https://placewise-io.vercel.app)  
📂 **Repository:** [github.com/AALHAD7/placewise-app](https://github.com/AALHAD7/placewise-app)

---

## What is PlaceWise?

Every year, thousands of students at top Indian business schools (IIMs, FMS, XLRI, ISB, etc.) prepare for high-stakes campus placements in **Management Consulting, Product Management, Investment Banking, Marketing, Operations, and General Management**.

Traditionally, students spend hundreds of hours manually sifting through dense 300+ page college casebooks or relying on generic AI tools that hallucinate fictional business frameworks and non-Indian market data.

**PlaceWise solves this problem.** It ingests real, verified MBA placement casebooks and study guides into a vector database, giving students structured, verifiable interview preparation. Instead of reading an entire casebook to learn a single concept, students get exact answers, worked examples, and reconstructed diagrams with direct citations to the source casebook and page numbers.

---

## Key Features

### 1. Casebook-Grounded Frameworks & Interactive Diagrams
- Explore essential business frameworks (Issue Trees, Value Chains, 3Cs, 4Ps, Kano, Porter's Five Forces, DCF Valuation, etc.).
- See real examples from campus placement cases with source attribution (school, casebook edition, and page).
- Interactive, responsive diagram visualizations reconstructed from casebook illustrations.

### 2. Role & Topic Preparation Hubs
- Tailored prep tracks for top campus roles (e.g., *Management Consultant, Product Manager, Investment Banking Associate, Brand Manager, Operations Lead*).
- Breakdowns for tested topics featuring:
  - **What this means:** Clear definitions under 120 words.
  - **Why this matters:** Practical corporate context and concrete examples.
  - **How to apply:** Step-by-step interview talk-tracks and worked mini-examples.
  - **Pushback Tutor:** Interactive AI interviewer that challenges candidate reasoning, tests edge cases, and simulates senior interviewer pushback.

### 3. AI Mock Interview Simulator
- Upload your **Resume (CV)** and an optional **Job Description (JD)**.
- Choose your difficulty level and target role.
- Practice live voice/text interview rounds with an AI interviewer that asks contextual opening questions, grades your answers with honest feedback (strengths and specific fixes), and probes with natural follow-ups.

### 4. Resume Interrogation & Drill
- Upload a CV to generate 30 targeted interview questions categorized into **Behavioral, Technical, and Situational**.
- Each question is directly tied to the candidate's actual projects, tools, and background rather than generic templates.
- Includes a situational dilemma mode where candidates can ask clarifying questions before committing to an answer.

### 5. Tone Shifter (Resume Bullet Rewriter)
- Tailors resume bullet points to specific target domain lexicons (Consulting, Finance, PM, Marketing, Sales, Ops, Analytics, Tech, HR, General Management).
- Formats bullets using standard recruitment structures: **STAR, RAC, CAR, PAR, SOAR, or Impact-first**.
- Enforces strict character and word budgets to fill line length cleanly, fact-locking every number, metric, and stakeholder without hallucination.

### 6. Company Intelligence & Real Value Chains
- Deep dives into hiring companies: entry-level campus roles, verified recruitment rounds, business models, and industry value chains.
- Uses real Indian market context (e.g., ₹ Cr/Lakhs, RBI/SEBI regulations, Indian benchmarks).

### 7. Solved Guesstimates & Market Sizing
- Step-by-step solved guesstimates using demand-side, supply-side, and value-chain approaches straight from placement committee casebooks.

---

## How It Works (Architecture)

PlaceWise follows a **Casebook-First Grounding Policy**:

```
[ MBA Placement Casebooks ] ──► [ High-Fidelity PDF Ingestion ]
  (IIM-A, IIM-B, IIM-C,          (Text extraction, layout detection,
   FMS, ISB, XLRI, etc.)          diagram schema transcription)
                                                │
                                                ▼
[ User Query / Practice Topic ] ◄──► [ Supabase (pgvector) ]
                                      (768-dim Gemini Embeddings)
                                                │
                                                ▼
                                    [ Grounded Retrieval (RAG) ]
                                      (Cosine similarity thresholding)
                                                │
                                                ▼
                                    [ PlaceWise AI Tutor ]
                                      (Strict casebook citation &
                                       structured response formatting)
```

1. **Ingestion & Digitization:** PDF casebooks are parsed, chunked with layout awareness, and embedded using Google's `gemini-embedding-001`.
2. **Vector Retrieval:** PostgreSQL with `pgvector` inside Supabase performs similarity matching scoped to the relevant domain.
3. **Strict Grounding Guardrails:** If a question is covered by the casebooks, the response strictly uses casebook excerpts and cites the source. If not covered, it explicitly informs the student with a general guidance label.

---

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, custom responsive CSS design system (Apple-inspired light palette).
- **Backend:** Node.js, Express.js.
- **Database & Auth:** Supabase (PostgreSQL, `pgvector`, Supabase Auth).
- **AI & LLM Services:** Google Gemini API (Flash tier with fallback cascades for high reliability and speed).
- **Hosting:** Vercel (Frontend SPA) and Render (Backend API).

---

## Getting Started Locally

### Prerequisites
- Node.js (v18+ recommended)
- npm or pnpm

### 1. Clone the repository
```bash
git clone https://github.com/AALHAD7/placewise-app.git
cd placewise-app
```

### 2. Run the Frontend
```bash
cd frontend-react
npm install
npm run dev
```
The frontend will start at `http://localhost:5173`.

### 3. Run the Backend (Optional for local development)
```bash
cd ../backend
npm install
npm run dev
```
Copy `.env.example` to `.env` and configure your `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `GEMINI_API_KEY`.

---

## License

This project is developed for MBA placement preparation. All rights reserved.
