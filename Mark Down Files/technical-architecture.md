# TECHNICAL ARCHITECTURE DOCUMENT
## Placewise — Complete End-to-End Guide

**Version:** 1.0  
**Date:** August 2026  
**Target Audience:** You (for interviews), your team (for building), investors (for scaling)

---

## TABLE OF CONTENTS

1. System Architecture Overview
2. Frontend Architecture (Lovable + React)
3. Backend Architecture (Node.js + Claude API)
4. Database Design (Supabase)
5. Data Pipeline & Ingestion
6. LLM Strategy & Hallucination Prevention
7. Data Grounding (RAG - Retrieval Augmented Generation)
8. Scaling Strategy
9. Monitoring & Maintenance
10. Technology Justification (Interview Defense)
11. How Claude Code Fits In
12. Implementation Timeline

---

## 1. SYSTEM ARCHITECTURE OVERVIEW

### 1.1 High-Level System Design

```
┌─────────────────────────────────────────────────────────────┐
│                        USER (Web Browser)                    │
└─────────────────────────────────────────────────────────────┘
                           ↓↑ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER (Lovable)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Role Select │  │ Skill Module │  │ Story Coach  │       │
│  │  Company     │  │ Guesstimate  │  │ Tone Shifter │       │
│  │  Dashboard   │  │ Mock Exams   │  │ Progress     │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│         ↓↑ API calls (REST/JSON)                             │
└─────────────────────────────────────────────────────────────┘
                           ↓↑ HTTPS
┌─────────────────────────────────────────────────────────────┐
│              BACKEND LAYER (Node.js/Express)                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ API Routes                                           │  │
│  │ ├─ /api/resume/interrogate                          │  │
│  │ ├─ /api/story/generate                              │  │
│  │ ├─ /api/tone/shift                                  │  │
│  │ ├─ /api/guesstimate/feedback                        │  │
│  │ ├─ /api/company/intel                               │  │
│  │ └─ /api/user/progress                               │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓↑                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ LLM Integration Layer                                │  │
│  │ ├─ Claude API (core AI)                              │  │
│  │ ├─ Prompt Engineering (templates, guardrails)       │  │
│  │ ├─ Context Management (RAG retrieval)               │  │
│  │ └─ Response Validation (hallucination checks)       │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓↑                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Data Access Layer                                    │  │
│  │ ├─ Query builder                                     │  │
│  │ ├─ Caching logic (Redis)                             │  │
│  │ └─ Rate limiting (to prevent API abuse)              │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↓↑
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER (Supabase)                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ PostgreSQL Database                                  │  │
│  │ ├─ Users table                                       │  │
│  │ ├─ User Progress table                               │  │
│  │ ├─ Company Intel table (authoritative source)       │  │
│  │ ├─ Case Studies table (with Q&A, solutions)         │  │
│  │ ├─ Interview Questions table (crowdsourced, verified)│  │
│  │ ├─ Frameworks table (vetted content)                │  │
│  │ └─ User Generated Content table                     │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Vector DB (Pinecone/Supabase pgvector)              │  │
│  │ └─ Embeddings of all company intel, cases, frameworks│  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ File Storage (Supabase Storage / AWS S3)            │  │
│  │ └─ User-uploaded resumes, PPTs, case books         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↓↑
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL DATA SOURCES                     │
│  ├─ B-School case competition archives                     │
│  ├─ Crowdsourced interview Q&As (from users)              │
│  ├─ Public company data (LinkedIn, Glassdoor, company sites)│
│  ├─ Published case studies + consulting frameworks         │
│  └─ User-uploaded resources (vetted before ingestion)      │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Key Architectural Principles

**1. Data Grounding (No Hallucination)**
- All AI responses must be grounded in authoritative data sources
- Use RAG (Retrieval Augmented Generation) before every LLM call
- Separate "AI-generated content" from "verified facts"

**2. Separation of Concerns**
- Frontend: UI/UX, state management, user interactions
- Backend: Business logic, data orchestration, LLM coordination
- Database: Source of truth, audit trails, versioning
- LLM: Only used when grounded in real data; never standalone

**3. Layered Data Verification**
- Layer 1: Authoritative sources (company websites, official case briefs)
- Layer 2: Crowdsourced + moderated (student Q&As, verified by placement cells)
- Layer 3: AI-generated insights (frameworks, explanations, coaching)

---

## 2. FRONTEND ARCHITECTURE (Lovable + React)

### 2.1 Tech Stack Choice

**Frontend Framework: React (via Lovable)**
- Why React? Component-based, state management, great for complex UIs
- Why Lovable? Zero-config deployment, integrates with Claude Code, beautiful UI
- Why NOT alternatives?
  - Vue: Smaller ecosystem, fewer job market skills
  - Next.js: Overkill for this project initially; adds complexity we don't need
  - Svelte: Less ecosystem maturity; harder to debug

**UI Library: Tailwind CSS**
- Why? Utility-first, fast styling, no CSS conflicts
- Why NOT alternatives?
  - Material UI: Bloated, hard to customize for our brand
  - Bootstrap: Outdated feel, not as flexible

**State Management: React Context API + localStorage**
- Why? Simple for MVP; no need for Redux yet
- Stores: User profile, selected role/company, progress data
- Why NOT alternatives?
  - Redux: Overkill until we have 100K+ users
  - Zustand: Good, but Context is sufficient for MVP

### 2.2 Frontend Folder Structure

```
frontend/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── RoleSelector.jsx
│   │   ├── CompanySelector.jsx
│   │   ├── SkillModule.jsx
│   │   ├── GuesstimatePractice.jsx
│   │   ├── MockInterview.jsx
│   │   ├── StoryBuilder.jsx
│   │   ├── ToneShifter.jsx
│   │   ├── ResumeInterrogation.jsx
│   │   ├── Dashboard.jsx
│   │   └── CompanyIntel.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Prep.jsx
│   │   ├── Interview.jsx
│   │   └── Settings.jsx
│   ├── context/
│   │   ├── UserContext.jsx (stores user profile, role, company)
│   │   ├── ProgressContext.jsx (stores scores, progress)
│   │   └── DataContext.jsx (stores frameworks, company intel)
│   ├── utils/
│   │   ├── api.js (all API calls)
│   │   ├── prompts.js (Claude prompts)
│   │   ├── validators.js (input validation)
│   │   └── storage.js (localStorage helpers)
│   ├── hooks/
│   │   ├── useFetch.js (data fetching)
│   │   ├── useLocalStorage.js (persistent state)
│   │   └── useDebounce.js (debounce user input)
│   ├── styles/
│   │   ├── global.css
│   │   └── tailwind.config.js
│   ├── App.jsx (main component)
│   └── index.js (entry point)
└── package.json
```

### 2.3 Key Frontend Features

**1. Role + Company Selection (Flow)**
```
User clicks "Start Prep" 
→ Select Role (Consulting, Product, Ops, etc.)
→ Select Company (Bain, Razorpay, etc. or "General Prep")
→ API call: /api/prep/initialize
  ├─ Fetch role-specific frameworks
  ├─ Fetch company intel
  ├─ Load user's previous progress (if any)
→ Display dashboard
```

**2. Lazy Loading & Infinite Scroll**
- Guesstimates: Load 5 at a time, infinite scroll
- Case studies: Paginated, 10 per page
- Company intel: Tabs, load on demand
- Reason: Keep frontend fast, don't load all data upfront

**3. Error Handling & User Feedback**
```javascript
try {
  const response = await fetch('/api/resume/interrogate', {
    method: 'POST',
    body: JSON.stringify({ resume, role, company })
  });
  
  if (!response.ok) {
    // User-friendly error: "We couldn't analyze your resume. Try uploading as plain text."
    showError("Resume Analysis Failed");
    return;
  }
  
  const data = await response.json();
  
  // Validate response structure
  if (!data.questions || !Array.isArray(data.questions)) {
    throw new Error("Invalid response structure");
  }
  
  setQuestions(data.questions);
} catch (error) {
  console.error(error);
  showError("Something went wrong. Please try again.");
}
```

**4. Real-Time Feedback (Optimistic Updates)**
- When user selects tone, immediately show loading state
- Fetch from backend, then update UI
- If it fails, revert and show error
- Reason: Users feel app is responsive

### 2.4 Frontend Performance Optimization

**Code Splitting**
```javascript
// Instead of importing everything at once
import { lazy, Suspense } from 'react';

const StoryBuilder = lazy(() => import('./components/StoryBuilder'));
const MockInterview = lazy(() => import('./components/MockInterview'));

// Only load when user navigates there
<Suspense fallback={<Loading />}>
  <StoryBuilder />
</Suspense>
```

**Caching Strategy**
- Frameworks, company intel, case studies: Cache for 24 hours (rarely change)
- User progress: Real-time (always fetch latest)
- Interview Q&As: Cache for 1 week

**Image Optimization**
- Compress company logos, case study screenshots
- Lazy load images below the fold
- Use WebP format with PNG fallback

---

## 3. BACKEND ARCHITECTURE (Node.js + Express)

### 3.1 Tech Stack Choice

**Runtime: Node.js**
- Why? JavaScript everywhere (frontend + backend), fast I/O, great for I/O-heavy apps (our app calls Claude API heavily)
- Why NOT alternatives?
  - Python: Slower for I/O; overkill for this use case
  - Go: Unnecessary performance gains; more complex deployment
  - Java: Too heavyweight for MVP

**Framework: Express.js**
- Why? Lightweight, flexible, large ecosystem, easy to learn
- Why NOT alternatives?
  - Next.js: Adds too much complexity (we don't need server-side rendering yet)
  - Fastify: Faster, but Express is sufficient for our scale
  - Django: We chose Node, not Python

**LLM Integration: Anthropic Claude API (via SDK)**
- Why Claude specifically?
  - 200K context window (can fit entire case studies, company data in one prompt)
  - Better instruction-following than other models
  - Cheaper than GPT-4 at scale
  - Supports long-form outputs (narratives, detailed feedback)
- Why NOT alternatives?
  - OpenAI GPT-4: Expensive ($30/1M tokens vs Claude $3/1M tokens). 8K context not enough for our use case.
  - Gemini: Context window good, but less mature API. Not as reliable instruction-following.
  - Open-source (Llama): Requires self-hosting; massive infrastructure cost. Not defensible for startup.

### 3.2 Backend Architecture (Layered)

```
┌─────────────────────────────────────────┐
│         Express HTTP Server             │
│  (PORT 3000 or via Vercel serverless)  │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│        Route Layer                      │
│  ├─ POST /api/resume/interrogate       │
│  ├─ POST /api/story/generate           │
│  ├─ POST /api/tone/shift               │
│  ├─ POST /api/guesstimate/feedback     │
│  ├─ GET /api/company/:id/intel         │
│  ├─ POST /api/mock-interview/evaluate  │
│  └─ GET /api/user/progress             │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│      Middleware Layer                   │
│  ├─ Authentication (JWT)                │
│  ├─ Rate Limiting (prevent abuse)       │
│  ├─ Request Validation (input checks)   │
│  ├─ Error Handling                      │
│  └─ Logging & Monitoring                │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│      Service Layer (Business Logic)     │
│  ├─ ResumeService                       │
│  ├─ StoryService                        │
│  ├─ ToneService                         │
│  ├─ GuessimateService                   │
│  ├─ CompanyIntelService                 │
│  ├─ MockInterviewService                │
│  └─ UserProgressService                 │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│    LLM Orchestration Layer              │
│  ├─ promptBuilder (constructs prompts)  │
│  ├─ claudeClient (Claude API calls)     │
│  ├─ ragRetriever (fetches grounding)    │
│  ├─ responseValidator (checks output)   │
│  └─ tokenCounter (cost tracking)        │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│      Data Access Layer (DAL)            │
│  ├─ User Repository                     │
│  ├─ Company Repository                  │
│  ├─ CaseStudy Repository                │
│  ├─ Framework Repository                │
│  └─ Progress Repository                 │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│  External Services                      │
│  ├─ Supabase (PostgreSQL + Vector DB)  │
│  ├─ Redis Cache                         │
│  ├─ Claude API                          │
│  └─ File Storage (S3/Supabase Storage)  │
└─────────────────────────────────────────┘
```

### 3.3 Backend Folder Structure

```
backend/
├── src/
│   ├── server.js (entry point)
│   ├── config/
│   │   ├── database.js (Supabase connection)
│   │   ├── claude.js (Claude API config)
│   │   ├── redis.js (Redis cache config)
│   │   └── env.js (environment variables)
│   ├── routes/
│   │   ├── resume.routes.js
│   │   ├── story.routes.js
│   │   ├── tone.routes.js
│   │   ├── guesstimate.routes.js
│   │   ├── company.routes.js
│   │   ├── mock-interview.routes.js
│   │   ├── user.routes.js
│   │   └── auth.routes.js
│   ├── controllers/
│   │   ├── resumeController.js
│   │   ├── storyController.js
│   │   ├── toneController.js
│   │   ├── guessimateController.js
│   │   ├── companyController.js
│   │   ├── mockInterviewController.js
│   │   └── userController.js
│   ├── services/
│   │   ├── resumeService.js
│   │   ├── storyService.js
│   │   ├── toneService.js
│   │   ├── guessimateService.js
│   │   ├── companyIntelService.js
│   │   ├── mockInterviewService.js
│   │   └── userProgressService.js
│   ├── llm/
│   │   ├── claudeClient.js (wrapper around Claude API)
│   │   ├── promptBuilder.js (constructs prompts)
│   │   ├── ragRetriever.js (fetches grounding data)
│   │   ├── responseValidator.js (checks for hallucination)
│   │   └── prompts/
│   │       ├── resumeInterrogation.prompt.js
│   │       ├── storyGeneration.prompt.js
│   │       ├── toneShift.prompt.js
│   │       ├── guessimateEval.prompt.js
│   │       └── mockInterviewEval.prompt.js
│   ├── database/
│   │   ├── repositories/
│   │   │   ├── userRepository.js
│   │   │   ├── companyRepository.js
│   │   │   ├── caseRepository.js
│   │   │   ├── frameworkRepository.js
│   │   │   └── progressRepository.js
│   │   ├── migrations/ (database schema versioning)
│   │   │   ├── 001_initial_schema.sql
│   │   │   ├── 002_add_vector_embeddings.sql
│   │   │   └── 003_add_crowdsourced_questions.sql
│   │   └── seeders/ (initial data)
│   │       ├── seed_companies.js
│   │       ├── seed_frameworks.js
│   │       └── seed_case_studies.js
│   ├── utils/
│   │   ├── validators.js
│   │   ├── tokenCounter.js (track Claude API costs)
│   │   ├── cache.js (Redis helpers)
│   │   ├── errors.js (custom error classes)
│   │   └── logger.js (structured logging)
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── rateLimiter.middleware.js
│   │   ├── errorHandler.middleware.js
│   │   └── requestValidator.middleware.js
│   ├── scripts/
│   │   ├── ingestCaseBooks.js (data import script)
│   │   ├── generateEmbeddings.js (create vector embeddings)
│   │   └── verifyData.js (data quality checks)
│   └── tests/
│       ├── unit/
│       ├── integration/
│       └── e2e/
├── .env.example (template)
├── package.json
└── README.md
```

### 3.4 Example API Endpoint: Resume Interrogation

```javascript
// routes/resume.routes.js
router.post('/interrogate', authenticateUser, async (req, res) => {
  try {
    const { resumeText, targetRole, targetCompany } = req.body;
    
    // Validate input
    if (!resumeText || !targetRole) {
      return res.status(400).json({ error: "Resume and role required" });
    }
    
    // Call service
    const result = await resumeService.generateInterviewQuestions(
      resumeText,
      targetRole,
      targetCompany
    );
    
    // Save to database (for audit trail)
    await progressRepository.logActivity(req.user.id, {
      type: 'RESUME_INTERROGATION',
      input: resumeText.substring(0, 100), // log first 100 chars
      output: result,
      timestamp: new Date()
    });
    
    res.json(result);
  } catch (error) {
    errorHandler(error, res);
  }
});

// services/resumeService.js
async function generateInterviewQuestions(resumeText, targetRole, targetCompany) {
  // Step 1: Parse resume to extract experiences
  const experiences = parseResume(resumeText);
  
  // Step 2: Retrieve role-specific frameworks from database
  const frameworks = await frameworkRepository.getByRole(targetRole);
  
  // Step 3: Retrieve company-specific intel (if targeting a company)
  let companyIntel = null;
  if (targetCompany) {
    companyIntel = await companyRepository.getByName(targetCompany);
  }
  
  // Step 4: Build RAG context (what the LLM will see)
  const ragContext = buildRAGContext({
    resume: experiences,
    frameworks,
    companyIntel,
    targetRole
  });
  
  // Step 5: Call Claude API with grounded prompt
  const prompt = promptBuilder.resumeInterrogation({
    experiences,
    targetRole,
    targetCompany,
    ragContext, // This ensures Claude has real data to reference
    frameworks
  });
  
  const response = await claudeClient.call({
    model: 'claude-opus-4-6',
    max_tokens: 2000,
    system: `You are an expert recruiter. Generate interview questions based on the resume and context provided. 
    
    CRITICAL: Only reference frameworks and company details that are in the context below. 
    Do NOT hallucinate company information or frameworks.
    
    Context:
    ${ragContext}`,
    messages: [
      { role: 'user', content: prompt }
    ]
  });
  
  // Step 6: Validate response (ensure no hallucination)
  const validatedResponse = responseValidator.validateResumeQA(response, {
    expectedFrameworks: frameworks.map(f => f.name),
    allowedCompanies: [targetCompany].filter(Boolean)
  });
  
  // Step 7: Return structured response
  return {
    experiences: experiences,
    questions: validatedResponse.questions,
    frameworksApplied: validatedResponse.frameworks,
    confidence: validatedResponse.confidenceScore // 0-1, 1 = very confident in accuracy
  };
}
```

---

## 4. DATABASE DESIGN (Supabase PostgreSQL)

### 4.1 Why Supabase?

**Supabase = PostgreSQL + Authentication + Real-time + Vector Support + File Storage**

Why Supabase over alternatives?
- **PostgreSQL:** Battle-tested, relational (we have complex relationships: users → roles → companies → cases)
- **Authentication:** Built-in JWT, social login, no separate auth service needed
- **Vector DB:** pgvector extension for embeddings (RAG grounding)
- **Real-time:** Can broadcast updates to multiple users (future: live collaboration)
- **File Storage:** Built-in, cheap storage for PDFs, PPTs
- **Free tier:** Generous free tier (500MB, auth, real-time)

Why NOT alternatives?
- Firebase/Firestore: NoSQL, harder to query complex relationships. More expensive at scale.
- MongoDB: Horizontal scaling is harder. PostgreSQL is better for structured data.
- DynamoDB: Expensive, requires AWS account, overkill for MVP.

### 4.2 Database Schema

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  auth_id VARCHAR UNIQUE NOT NULL, -- Links to Supabase Auth
  name VARCHAR NOT NULL,
  resume_text TEXT, -- Encrypted
  target_roles TEXT[], -- Array: ['consulting', 'product', 'ops']
  target_companies TEXT[], -- Array: ['Razorpay', 'Bain', ...]
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Companies table (authoritative source)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR UNIQUE NOT NULL,
  industry VARCHAR, -- fintech, consulting, etc.
  website VARCHAR,
  hiring_bar_gpa DECIMAL, -- e.g., 7.5
  culture_signals TEXT[], -- ['growth-focused', 'technical', ...]
  recent_launches TEXT, -- News, product launches
  average_salary_pm DECIMAL,
  average_salary_ops DECIMAL,
  source VARCHAR NOT NULL, -- 'official' | 'glassdoor' | 'crowdsourced'
  verified_by UUID REFERENCES users(id), -- Who verified this data?
  verification_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Company Interview Questions (crowdsourced, verified)
CREATE TABLE company_interview_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  role_title VARCHAR NOT NULL, -- PM, Ops, Consulting
  question TEXT NOT NULL,
  sample_answer_outline TEXT,
  framework_applicable VARCHAR[], -- MECE, Jobs-to-be-done, etc.
  difficulty SMALLINT DEFAULT 1, -- 1=easy, 2=medium, 3=hard
  submitted_by UUID NOT NULL REFERENCES users(id), -- Who submitted?
  submitted_date TIMESTAMP,
  verification_status VARCHAR DEFAULT 'pending', -- pending | verified | rejected
  verified_by UUID REFERENCES users(id), -- Placement cell staff
  num_endorsements SMALLINT DEFAULT 0, -- How many students confirmed this Q?
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT verified_by_!=_submitted_by CHECK (verified_by != submitted_by)
);

-- Frameworks table (authoritative source)
CREATE TABLE frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL, -- MECE, Jobs-to-be-Done, 4Ps
  role VARCHAR NOT NULL, -- consulting, product, marketing
  description TEXT NOT NULL,
  example_application TEXT,
  case_study_reference TEXT, -- Link to actual case where this was used
  source VARCHAR NOT NULL, -- 'official' (published) | 'crowdsourced'
  verified_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Case Studies table
CREATE TABLE case_studies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  brief_text TEXT NOT NULL, -- The actual case problem statement
  difficulty SMALLINT, -- 1=easy, 2=medium, 3=hard
  role VARCHAR NOT NULL, -- consulting, product, ops
  industry VARCHAR, -- payments, real estate, etc.
  source VARCHAR NOT NULL, -- 'iim_trichy' | 'bain_competition' | 'published'
  source_url VARCHAR, -- URL to original case
  solution_outline TEXT, -- "Here's how to structure this"
  frameworks_applicable VARCHAR[], -- Which frameworks apply here?
  sample_answers TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Guesstimate Practice Problems
CREATE TABLE guesstimate_problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL, -- "Size the UPI market in India"
  problem_statement TEXT NOT NULL,
  role VARCHAR NOT NULL,
  difficulty SMALLINT,
  industry VARCHAR,
  company_context VARCHAR, -- If targeting specific company
  hint TEXT,
  solution_outline TEXT, -- Explains the logic
  industry_answer DECIMAL, -- The "correct" answer (with sources)
  source_url VARCHAR, -- Where we got this from
  frameworks_applicable VARCHAR[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Progress table
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  framework_id UUID REFERENCES frameworks(id),
  case_study_id UUID REFERENCES case_studies(id),
  guesstimate_id UUID REFERENCES guesstimate_problems(id),
  activity_type VARCHAR NOT NULL, -- 'learned' | 'practiced' | 'scored'
  score DECIMAL, -- 0-100
  feedback TEXT,
  time_spent_minutes SMALLINT,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Generated Stories (for narrative coaching)
CREATE TABLE user_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  story_text TEXT NOT NULL,
  narrative_theme VARCHAR, -- 'growth' | 'problem_solver' | 'domain_expert'
  tone VARCHAR, -- 'confident' | 'humble' | 'growth_mindset'
  target_company UUID REFERENCES companies(id),
  target_role VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- API Audit Log (track all Claude API calls for cost & debugging)
CREATE TABLE api_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  endpoint VARCHAR NOT NULL,
  request_tokens INT,
  response_tokens INT,
  total_cost DECIMAL, -- in dollars
  response_status VARCHAR, -- 'success' | 'error' | 'hallucination_detected'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Vector embeddings table (for RAG retrieval)
CREATE TABLE embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id VARCHAR NOT NULL, -- ID of the source (company, framework, etc.)
  source_type VARCHAR NOT NULL, -- 'company' | 'framework' | 'case_study'
  content TEXT NOT NULL, -- The actual text content
  embedding vector(1536), -- OpenAI/Claude embeddings (dimension varies)
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for fast queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_company_questions_company_id ON company_interview_questions(company_id);
CREATE INDEX idx_embeddings_source ON embeddings(source_id, source_type);

-- Add vector similarity search support
CREATE INDEX idx_embeddings_vector ON embeddings USING ivfflat (embedding vector_cosine_ops);
```

### 4.3 Data Relationships Diagram

```
users
├── (1:N) ──→ user_progress
├── (1:N) ──→ user_stories
├── (1:N) ──→ company_interview_questions (submitted_by)
├── (1:N) ──→ company_interview_questions (verified_by)
└── (1:N) ──→ api_audit_log

companies
├── (1:N) ──→ company_interview_questions
├── (1:N) ──→ guesstimate_problems (company_context)
└── (1:N) ──→ user_stories (target_company)

frameworks
├── (1:N) ──→ user_progress
└── (1:N) ──→ embeddings

case_studies
├── (1:N) ──→ user_progress
└── (1:N) ──→ embeddings

guesstimate_problems
├── (1:N) ──→ user_progress
└── (1:N) ──→ embeddings

embeddings (for RAG retrieval)
└── Source: companies | frameworks | case_studies | company_interview_questions
```

---

## 5. DATA PIPELINE & INGESTION

### 5.1 Data Sources & Types

**Authoritative Sources (Ground Truth):**
1. **B-School Case Competition Archives**
   - IIM Trichy: Airtel iCreate, internal workshops
   - IIM Bangalore: Case competitions
   - ISB: Case studies
   - XLRI: Consulting cases
   - Source: Download PDFs/PPTs from official websites, student submissions
   - Format: PDF, PowerPoint, Word docs

2. **Published Consulting Frameworks**
   - Management consulting playbooks (BCG, McKinsey, Bain frameworks)
   - Published on their websites
   - Format: Public PDF, articles, case study write-ups

3. **Official Company Data**
   - Company websites (About, Careers, News)
   - LinkedIn Company Pages
   - Glassdoor (anonymized reviews)
   - Format: Web scraping, API access (if available)

4. **Crowdsourced Interview Q&As** (Verified)
   - Students submit after interviews (anonymously)
   - Placement cells verify ("Did this Q actually come up?")
   - Format: Database submission form

### 5.2 Data Ingestion Pipeline

```
┌─────────────────────────────────────────┐
│      Raw Data Sources                   │
│  ├─ PDF case books (uploaded)          │
│  ├─ PowerPoint presentations           │
│  ├─ Company websites (crawled)         │
│  ├─ Student submissions (forms)        │
│  └─ Public databases (Glassdoor, etc.) │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│    Data Extraction & Parsing            │
│  ├─ PDF → text extraction              │
│  ├─ PPT → slide text + speaker notes   │
│  ├─ Web → HTML parsing                 │
│  └─ Forms → JSON validation            │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│  Data Cleaning & Normalization          │
│  ├─ Remove duplicates                  │
│  ├─ Standardize company names          │
│  ├─ Parse dates, roles, titles         │
│  ├─ Remove PII (personal info)         │
│  └─ Quality checks (length, format)    │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│    Manual Verification & Tagging        │
│  ├─ Is this data accurate?             │
│  ├─ Tag with metadata                  │
│  │   (role: PM, difficulty: 3,         │
│  │    company: Razorpay)               │
│  ├─ Assign verification status         │
│  │   (verified | pending | rejected)   │
│  └─ Store verification source          │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│   Database Storage                      │
│  ├─ Insert into case_studies table     │
│  ├─ Insert into companies table        │
│  ├─ Insert into frameworks table       │
│  ├─ Insert into guesstimate_problems   │
│  └─ Create audit trail                 │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│   Vector Embedding Generation           │
│  ├─ Convert text to embeddings         │
│  │   (using Claude embeddings API)     │
│  ├─ Store in vector DB (pgvector)     │
│  └─ Create similarity index            │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│     Ready for RAG Retrieval             │
│  (Used in LLM prompts)                  │
└─────────────────────────────────────────┘
```

### 5.3 Example Ingestion Script

```javascript
// scripts/ingestCaseBooks.js

const fs = require('fs');
const pdf = require('pdf-parse');
const supabase = require('@supabase/supabase-js');

// Initialize Supabase
const client = supabase.createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ADMIN_KEY
);

async function ingestCaseStudy(filePath, metadata) {
  console.log(`Ingesting: ${filePath}`);
  
  try {
    // Step 1: Extract text from PDF
    const fileBuffer = fs.readFileSync(filePath);
    const pdfData = await pdf(fileBuffer);
    const caseText = pdfData.text;
    
    // Step 2: Parse metadata
    const { title, role, difficulty, company, source } = metadata;
    
    // Step 3: Generate embedding (using Claude API)
    const embedding = await generateEmbedding(caseText);
    
    // Step 4: Insert into database
    const { data, error } = await client
      .from('case_studies')
      .insert([
        {
          title,
          brief_text: caseText.substring(0, 2000), // First 2000 chars
          difficulty,
          role,
          industry: company,
          source,
          source_url: filePath,
          frameworks_applicable: metadata.frameworks || [],
          created_at: new Date()
        }
      ])
      .select();
    
    if (error) {
      console.error(`Error inserting ${title}:`, error);
      return;
    }
    
    const caseId = data[0].id;
    
    // Step 5: Store embedding for RAG retrieval
    await client
      .from('embeddings')
      .insert([
        {
          source_id: caseId,
          source_type: 'case_study',
          content: caseText,
          embedding: embedding
        }
      ]);
    
    console.log(`✓ Ingested: ${title}`);
  } catch (error) {
    console.error(`Failed to ingest ${filePath}:`, error);
  }
}

async function generateEmbedding(text) {
  // Call Claude API to generate embeddings
  // (You can use OpenAI API or Claude's embedding endpoint)
  
  const response = await fetch('https://api.anthropic.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.CLAUDE_API_KEY,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-3-small', // or Claude embeddings model when available
      input: text
    })
  });
  
  const data = await response.json();
  return data.embedding;
}

// Usage
ingestCaseStudy('./cases/airtel-iCreate-2024.pdf', {
  title: 'Airtel iCreate 2024 - Altura Case',
  role: 'strategy',
  difficulty: 2,
  company: 'Airtel',
  source: 'iim_trichy',
  frameworks: ['MECE', 'profitability analysis']
});
```

### 5.4 Data Quality Checks

```javascript
// utils/dataValidator.js

async function validateIngestedData(data) {
  const errors = [];
  
  // Check 1: Required fields
  if (!data.title) errors.push("Missing title");
  if (!data.brief_text) errors.push("Missing case text");
  if (!data.role) errors.push("Missing role");
  
  // Check 2: Text quality
  if (data.brief_text.length < 200) {
    errors.push("Case text too short (< 200 chars)");
  }
  
  // Check 3: No PII (personal info)
  const piiPatterns = [
    /\b\d{10}\b/, // Phone number
    /\b[A-Za-z]+@[A-Za-z]+\.[A-Za-z]+\b/, // Email
    /\b\d{3}-\d{2}-\d{4}\b/ // SSN
  ];
  
  for (const pattern of piiPatterns) {
    if (pattern.test(data.brief_text)) {
      errors.push("Potential PII found in case text");
    }
  }
  
  // Check 4: No copyrighted content
  const copyrightedPhrases = [
    'McKinsey Confidential',
    'BCG Internal'
  ];
  
  for (const phrase of copyrightedPhrases) {
    if (data.brief_text.includes(phrase)) {
      errors.push("Copyrighted content detected");
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
```

---

## 6. LLM STRATEGY & HALLUCINATION PREVENTION

### 6.1 Why Hallucination is a Real Problem

**Hallucination:** LLM generates plausible-sounding but factually incorrect information.

**Example:**
```
User: "What interview questions does Razorpay ask for PM roles?"

Without grounding:
Claude: "Razorpay PM interviews focus on: 
1. Profitability analysis
2. API design
3. Customer segmentation"

Problem: We don't actually KNOW this. Claude made it up based on what 
"sounds like a fintech PM interview."
```

**Why it's bad for your app:**
- Student prepares for wrong questions → fails interview
- Your credibility dies: "This platform was wrong"
- Legal risk: You're giving false career advice

### 6.2 Solution: Retrieval Augmented Generation (RAG)

**RAG = Retrieve Real Data + Feed to LLM + Generate Response**

```
User Query
    ↓
Search Vector DB for similar questions/frameworks/cases
    ↓
Retrieve top 5 most similar documents
    ↓
Combine with user input into prompt
    ↓
Send COMPLETE prompt to Claude
    ↓
Claude generates response grounded in real data
    ↓
Validate response (ensure it only references retrieved data)
    ↓
Return to user
```

### 6.3 Implementing RAG in Code

```javascript
// llm/ragRetriever.js

async function retrieveGroundingData(userQuery, options) {
  const {
    dataType, // 'company_questions' | 'frameworks' | 'case_studies'
    topK = 5, // Return top 5 most similar results
    minSimilarity = 0.7 // Only results above this similarity score
  } = options;
  
  try {
    // Step 1: Generate embedding of user query
    const queryEmbedding = await generateEmbedding(userQuery);
    
    // Step 2: Search vector DB for similar content
    const { data: results, error } = await supabase
      .rpc('match_embeddings', {
        query_embedding: queryEmbedding,
        match_count: topK,
        match_threshold: minSimilarity,
        source_type: dataType
      });
    
    if (error) {
      console.error('RAG retrieval failed:', error);
      return null;
    }
    
    // Step 3: Format results for LLM prompt
    const groundingContext = results
      .map((result, i) => `
        [Source ${i+1}]
        Type: ${result.source_type}
        Similarity: ${(result.similarity * 100).toFixed(1)}%
        Content: ${result.content}
      `)
      .join('\n---\n');
    
    return {
      groundingContext,
      sourceCount: results.length,
      sources: results.map(r => ({
        id: r.source_id,
        type: r.source_type,
        similarity: r.similarity
      }))
    };
  } catch (error) {
    console.error('RAG retrieval error:', error);
    return null;
  }
}

// llm/promptBuilder.js

function buildRAGPrompt(userInput, groundingData, task) {
  return `
    You are an expert interview coach and placement consultant.
    
    CRITICAL INSTRUCTIONS:
    1. ONLY use information from the grounding data below
    2. If user asks about something NOT in grounding data, say: 
       "I don't have verified data on this. Here's what I can help with instead..."
    3. ALWAYS cite which source you're referencing
    4. Never make up company information, interview questions, or frameworks
    
    ==================== GROUNDING DATA ====================
    ${groundingData.groundingContext}
    ==================== END GROUNDING DATA ====================
    
    Task: ${task}
    
    User Query: ${userInput}
    
    Response (use only grounding data above):
  `;
}
```

### 6.4 Response Validation (Catch Hallucinations)

```javascript
// llm/responseValidator.js

async function validateResponse(response, context) {
  const { type, expectedSources, allowedCompanies } = context;
  
  // Check 1: Response only references sources we provided
  const unreferencedClaims = detectUnreferencedClaims(
    response,
    expectedSources
  );
  
  if (unreferencedClaims.length > 0) {
    console.warn('Unreferenced claims detected:', unreferencedClaims);
    // Flag as low confidence
    return {
      response,
      confidence: 0.4,
      warnings: unreferencedClaims
    };
  }
  
  // Check 2: Company names are in our database
  const mentionedCompanies = extractCompanyNames(response);
  const invalidCompanies = mentionedCompanies.filter(
    company => !allowedCompanies.includes(company)
  );
  
  if (invalidCompanies.length > 0) {
    console.warn('Unauthorized companies mentioned:', invalidCompanies);
    return {
      response,
      confidence: 0.3,
      warnings: [`Mentioned unknown companies: ${invalidCompanies.join(', ')}`]
    };
  }
  
  // Check 3: No specific numbers without sources
  const numbersWithoutSources = detectUnsourcedNumbers(response);
  if (numbersWithoutSources.length > 0) {
    console.warn('Unsourced numbers:', numbersWithoutSources);
    return {
      response,
      confidence: 0.5,
      warnings: ['Some statistics lack sources']
    };
  }
  
  // If all checks pass
  return {
    response,
    confidence: 0.95,
    warnings: []
  };
}

function detectUnreferencedClaims(response, expectedSources) {
  // Look for claims that don't cite any source
  const sourcePattern = /\[Source \d+\]|\(Source: \w+\)/g;
  const sentences = response.split(/[.!?]+/);
  
  const unreferenced = sentences.filter(sentence => {
    // Skip sentences that are meta (don't make factual claims)
    if (sentence.includes("I don't have") || sentence.includes("Not sure")) {
      return false;
    }
    // Check if sentence has a source citation
    return !sourcePattern.test(sentence);
  });
  
  return unreferenced;
}

function extractCompanyNames(text) {
  // Extract company names (this is simplified; real implementation would be more robust)
  const companyPattern = /\b(McKinsey|Bain|BCG|Goldman|Razorpay|Juspay|PhonePe|Groww)\b/gi;
  return [...new Set(text.match(companyPattern) || [])];
}

function detectUnsourcedNumbers(text) {
  // Find numbers (like salaries, revenue) that aren't in a sourced section
  const numberPattern = /\$?\d+(?:,\d{3})*(?:\.\d{2})?|\d+%/g;
  const numbers = text.match(numberPattern) || [];
  
  // Check each number has a source nearby
  const unsourced = numbers.filter(num => {
    const numIndex = text.indexOf(num);
    const contextWindow = text.substring(Math.max(0, numIndex - 200), numIndex + 200);
    return !contextWindow.includes('[Source') && !contextWindow.includes('according to');
  });
  
  return unsourced;
}
```

### 6.5 System Prompt (Core LLM Instruction)

```
SYSTEM PROMPT FOR ALL CLAUDE CALLS:

You are an expert interview coach and placement consultant. Your goal is to help B-school students prepare for interviews at top companies.

CRITICAL CONSTRAINTS:
1. **Grounding in Data**: You will be provided with grounding data (real case studies, interview questions, frameworks). ONLY reference this data.
2. **No Hallucination**: If asked about something not in the grounding data, explicitly say: "I don't have verified data on this" and offer alternatives.
3. **Source Citation**: Always cite which source you're referencing (e.g., "[Source 1: IIM Trichy case]")
4. **Company Information**: Only share company information if it's in the grounding data or from official sources provided.
5. **Uncertainty**: If you're not confident in your response, say so. Confidence matters more than completeness.

GROUNDING DATA PROVIDED:
- Case studies: Real problems from case competitions
- Company intel: Verified info from company websites, students, placement cells
- Frameworks: Published consulting methodologies
- Interview Q&As: Crowdsourced and verified by placement staff

TONE: Supportive, practical, actionable. Help students win interviews.

RESPONSE FORMAT (when applicable):
- Quote the relevant source
- Explain the concept
- Show how it applies to their situation
- Suggest practice

NEVER:
- Invent company interview questions
- Guess about company culture
- Make up statistics without sources
- Pretend you have data you don't have
```

---

## 7. DATA GROUNDING (Complete Example)

### 7.1 Example: Resume Interrogation with Grounding

**User uploads resume:**
```
Senior Systems Engineer at Infosys (31 months)
- Worked on Oracle PeopleSoft for PwC
- Led analytics project at Thermax
  - Built Power BI dashboards
  - Discovered 10% cost optimization
```

**What happens:**

1. **Parse Resume:**
   ```
   Experience: Senior Systems Engineer
   Companies: Infosys, Thermax
   Skills: Oracle, PeopleSoft, Power BI, Analytics
   Achievement: 10% cost optimization
   ```

2. **Retrieve Grounding Data:**
   ```sql
   -- Frameworks for relevant role (Product/PM)
   SELECT * FROM frameworks WHERE role IN ('product', 'ops', 'analytics');
   
   -- Companies user is targeting
   SELECT * FROM companies WHERE name IN ('Razorpay', 'Juspay', 'Groww');
   
   -- Case studies similar to user's experience
   SELECT * FROM case_studies WHERE keywords ILIKE '%analytics%' OR keywords ILIKE '%cost%';
   ```

3. **Build RAG Context:**
   ```
   [Frameworks Retrieved]
   - MECE Thinking: Breaking complex problems into mutually exclusive, collectively exhaustive buckets
   - Metrics Rigor: Defining metrics that drive business value
   - Root Cause Analysis: Finding underlying causes vs. symptoms
   
   [Company Intelligence - Razorpay PM Expectations]
   - Source: Glassdoor + crowdsourced interview Q&As
   - Verified by: Placement cell, students who interviewed
   - Focus areas: Growth metrics, API design, merchant satisfaction
   - Interview pattern: Problem-solving case (30 min) → Behavioral (20 min)
   
   [Similar Cases from Database]
   Case: "Optimize operations at payment processing company"
   - Framework applied: Root cause analysis → process redesign → cost impact
   - Key questions: How did you define "cost"? What was the bottleneck?
   ```

4. **Generate Prompt:**
   ```
   User Resume Summary:
   - 31 months as Senior Systems Engineer at Infosys
   - Worked on Oracle PeopleSoft (enterprise software)
   - Analytics project at Thermax: 10% cost optimization
   
   Target Role: Product Manager
   Target Company: Razorpay (fintech, payments)
   
   Grounding Data: [As above]
   
   Task: Generate 15 interview questions that are likely to come up based on this resume
   and the Razorpay PM interview pattern.
   
   Rules:
   - Only reference frameworks from the grounding data
   - Only mention company info from the verified company profiles
   - Suggest answers using case examples from our database
   - Calibrate difficulty to PM level (medium-hard)
   ```

5. **Claude Response (Grounded):**
   ```
   Questions for Razorpay PM Interview (based on your resume):
   
   [1] Problem Clarity
   Q: "You mention a 10% cost optimization at Thermax. Walk me through how you defined 'cost.'"
   Framework: [Root Cause Analysis]
   Why asked: Razorpay needs PMs who think precisely about metrics
   Suggested approach: "Cost had multiple components. I broke it down using MECE thinking..."
   Source: [Glassdoor + verified interview Q&A from student who interviewed]
   
   [2] Metrics Thinking
   Q: "How did you know that optimization was actually saving money?"
   Framework: [Metrics Rigor]
   Why: Razorpay's core strength is data-driven decision-making
   Suggested approach: "I set up dashboards to track..."
   Source: [IIM Trichy case study: "Optimize operations"]
   
   ... [13 more questions]
   ```

6. **Validation:**
   - ✓ All frameworks referenced are in our database
   - ✓ Company info is verified (from Glassdoor, interviews)
   - ✓ Case examples are real (from our case studies table)
   - ✓ Confidence score: 0.92 (very high confidence this is accurate)

---

## 8. SCALING STRATEGY

### 8.1 Horizontal Scaling

**Current (MVP):**
```
┌─────────────┐
│  Frontend   │  (Lovable deployment)
├─────────────┤
│  Backend    │  (Single Node.js server)
├─────────────┤
│  Database   │  (Supabase free tier)
└─────────────┘
```

**After 1,000 users (Phase 2):**
```
┌──────────────────────────────────┐
│  Frontend                        │
│  (Vercel CDN - global)          │
├──────────────────────────────────┤
│  Load Balancer                   │
├──────────────────────────────────┤
│  Backend (3-5 instances)         │
│  ├─ Instance 1 (API)            │
│  ├─ Instance 2 (Claude calls)   │
│  ├─ Instance 3 (Data processing)│
│  └─ Auto-scaling group          │
├──────────────────────────────────┤
│  Redis Cache Layer               │
│  ├─ Framework cache (24h)       │
│  ├─ Company intel cache (24h)   │
│  └─ User session cache (1h)     │
├──────────────────────────────────┤
│  Database                        │
│  ├─ Supabase (primary)          │
│  ├─ Read replicas (for reports) │
│  └─ Backup (automated)          │
├──────────────────────────────────┤
│  Vector DB                       │
│  (Pinecone or Supabase pgvector)│
└──────────────────────────────────┘
```

### 8.2 Caching Strategy

**What to cache:**
```javascript
// services/cacheStrategy.js

const CACHE_DURATIONS = {
  // Rarely changes
  FRAMEWORKS: 24 * 60 * 60, // 24 hours
  COMPANY_INTEL: 24 * 60 * 60, // 24 hours
  CASE_STUDIES: 7 * 24 * 60 * 60, // 1 week
  
  // Changes frequently
  USER_PROGRESS: 60, // 1 minute
  USER_SESSION: 60 * 60, // 1 hour
  
  // Never changes (immutable)
  PUBLIC_DATA: null // Forever
};

async function getFrameworks(role, cache = true) {
  const cacheKey = `frameworks:${role}`;
  
  // Check Redis
  if (cache) {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  }
  
  // Query database
  const data = await db.query('SELECT * FROM frameworks WHERE role = ?', [role]);
  
  // Store in cache
  await redis.set(cacheKey, JSON.stringify(data), 'EX', CACHE_DURATIONS.FRAMEWORKS);
  
  return data;
}
```

### 8.3 Database Scaling

**Partitioning Strategy:**
```
Users: Partition by user_id
  - Partition 1: user_id 0-999,999
  - Partition 2: user_id 1,000,000-1,999,999

Cases: Partition by role
  - Partition 1: cases for consulting
  - Partition 2: cases for product
  - etc.

User Progress: Partition by created_at (time-series)
  - Partition 1: Jan-Mar 2026
  - Partition 2: Apr-Jun 2026
  - etc.
```

### 8.4 API Rate Limiting

```javascript
// middleware/rateLimiter.middleware.js

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: {
    'free_user': 10, // 10 requests per 15 min
    'premium_user': 100,
    'api_key': 1000
  },
  keyGenerator: (req) => req.user.id || req.ip,
  handler: (req, res) => {
    res.status(429).json({
      error: "Too many requests. Upgrade to premium for unlimited access.",
      retryAfter: req.rateLimit.resetTime
    });
  }
});
```

---

## 9. MONITORING & MAINTENANCE

### 9.1 Key Metrics to Monitor

```javascript
// Monitoring setup (using something like Datadog, New Relic, or open-source)

metrics = {
  // API Performance
  'api.response_time': { unit: 'ms', alert: '>1000ms' },
  'api.error_rate': { unit: '%', alert: '>1%' },
  'api.requests_per_minute': { unit: 'count' },
  
  // LLM Performance
  'claude.tokens_used': { unit: 'count', cost: '$0.003/1M tokens' },
  'claude.latency': { unit: 'ms', alert: '>5000ms' },
  'claude.error_rate': { unit: '%', alert: '>0.5%' },
  'hallucination.detection_rate': { unit: '%', alert: '>5%' },
  
  // Database Performance
  'db.query_time': { unit: 'ms', alert: '>500ms' },
  'db.connection_pool_usage': { unit: '%', alert: '>80%' },
  'db.storage_usage': { unit: 'GB' },
  
  // User Engagement
  'users.active_daily': { unit: 'count' },
  'users.completion_rate': { unit: '%', target: '>60%' },
  'features.adoption_rate': { unit: '%', target: '>50%' },
  
  // Business Metrics
  'conversion.free_to_premium': { unit: '%', target: '>20%' },
  'revenue.monthly_recurring': { unit: '$' },
  'churn.monthly': { unit: '%', target: '<10%' }
};
```

### 9.2 Monitoring Implementation

```javascript
// utils/monitoring.js

const monitoring = {
  trackAPICall: (endpoint, duration, status) => {
    datadog.gauge('api.response_time', duration, { endpoint, status });
    datadog.increment('api.requests', 1, { endpoint, status });
  },
  
  trackLLMCall: (tokensUsed, latency, success) => {
    datadog.increment('claude.tokens_used', tokensUsed);
    datadog.gauge('claude.latency', latency);
    datadog.increment('claude.calls', 1, { success });
  },
  
  trackHallucination: (detected) => {
    if (detected) {
      datadog.increment('hallucination.detected', 1);
      // Alert: "Potential hallucination detected in Claude response"
      slack.notify('Hallucination detected in Placewise Claude call');
    }
  },
  
  alertIfThresholdExceeded: (metric, value, threshold) => {
    if (value > threshold) {
      slack.notify(`ALERT: ${metric} exceeded threshold (${value} > ${threshold})`);
      pagerduty.trigger(`Critical alert: ${metric}`);
    }
  }
};
```

### 9.3 Regular Maintenance Tasks

**Daily:**
- Check error logs
- Verify database backups completed
- Monitor API error rate

**Weekly:**
- Review slow queries
- Check vector DB performance
- Audit new data ingested (quality checks)

**Monthly:**
- Performance review (response times, throughput)
- Cost analysis (Claude API, Supabase, etc.)
- Data validation audit (check for data quality degradation)
- User feedback review

---

## 10. TECHNOLOGY JUSTIFICATION (Interview Defense)

### 10.1 Why React + Lovable (Frontend)

**Q: Why React instead of Vue/Svelte?**

A: "React has three advantages for this project:

1. **Market Signal**: My CV shows React skills. If I get hired, I can immediately contribute to real products.

2. **Ecosystem**: React has the largest ecosystem. If I need UI libraries, animation libraries, or debugging tools, React's got them.

3. **Learning Investment**: React skills transfer directly to roles at Google, Meta, Amazon (companies I'm targeting). Vue has a smaller hiring market.

For this specific project, Vue would work equally well. But I optimized for dual goals: building a great product AND building my own career capital."

---

### 10.2 Why Claude API (LLM)

**Q: Why Claude over GPT-4 or open-source models?**

A: "I evaluated three options:

| Factor | Claude | GPT-4 | Open-source (Llama) |
|--------|--------|-------|---------------------|
| Cost | $3/1M tokens | $30/1M tokens | Free (but infrastructure) |
| Context | 200K tokens | 8K-128K | Variable |
| Accuracy | Best instruction-following | Good | Varies |
| Infrastructure | API (simple) | API (simple) | Self-hosted (complex) |

**Why Claude:**
1. **200K context window**: I can fit entire case studies + company data into one prompt. This prevents hallucination by giving Claude all the context it needs.
2. **Cost**: 10x cheaper than GPT-4. At scale (1M users), this saves us thousands per month.
3. **Instruction-following**: Claude is more reliable at following complex system prompts (e.g., 'only use grounding data').

**Why not open-source?** Deploying Llama requires renting GPU instances ($1,000+/month). Not viable for an MVP.

**Why not GPT-4?** Expensive, and the smaller context window means I'd have to do complex prompt engineering to fit data. Claude's 200K context makes it easier."

---

### 10.3 Why Node.js + Express (Backend)

**Q: Why Node.js over Python/Go?**

A: "I chose Node for one core reason: **I/O efficiency at the orchestration layer**.

This backend does a lot of I/O:
- Call Claude API (wait for response)
- Query Supabase
- Retrieve from vector DB
- Fetch embeddings

Python would work, but Node's non-blocking I/O model is better suited. Python would require me to manage async/await carefully or use Celery for task queues.

Node just... does this natively.

**Why not Go?** Go is faster, but I don't have latency-critical operations (no millisecond- precision requirements). Node is "fast enough" and easier to maintain.

**Why not Python?** Python is great for ML/data science. But I'm not doing heavy computation; I'm orchestrating services. Node is the better tool here.

**The real answer?** Node + Express is the path of least resistance. It's what I know, it's what works, and I can deploy it easily to Vercel or Render."

---

### 10.4 Why Supabase (Database + Auth)

**Q: Why Supabase over Firebase/MongoDB?**

A: "I need:
1. Relational data (users → roles → companies → cases)
2. Vector embeddings (for RAG retrieval)
3. Real-time updates (future: live collaboration)
4. Simple deployment

Supabase gives me all four:
- PostgreSQL (relational, well-understood)
- pgvector (native vector support, no extra service)
- Real-time subscriptions (built-in)
- Managed hosting (Vercel for frontend, Supabase for backend)

**Why not Firebase?**
- NoSQL makes complex queries hard
- Firestore doesn't support vector embeddings natively
- More expensive at scale

**Why not MongoDB?**
- No vector support
- Harder to do complex joins (I have lots of relationships)
- Not relational (makes consistency harder)

**The bottom line:** I'm building a data-heavy application with lots of relationships. PostgreSQL is the standard for this. Supabase packages it with auth + vectors + real-time, so I don't have to cobble together 5 different services."

---

### 10.5 Why RAG (Retrieval Augmented Generation)

**Q: Why not just use Claude directly?**

A: "Direct Claude usage leads to hallucinations. Example:

```
User: What interview questions does Razorpay ask?

Claude (without RAG): 
'Razorpay PM interviews focus on: API design, 
user metrics, payment flow optimization...'

Problem: I don't actually KNOW if this is true. Claude is 
guessing based on what 'sounds like a fintech interview.'
```

**With RAG:**
```
1. Search my database for Razorpay interview Q&As
   (from students who actually interviewed)
2. Give Claude the real Q&As
3. Claude only generates variations/explanations 
   of the REAL questions

Output is grounded in reality.
```

**Cost:** RAG adds a database lookup + vector search. But the benefit—credibility—is worth it. My entire product is built on students trusting the data. One hallucination destroys that."

---

## 11. HOW CLAUDE CODE FITS IN

### 11.1 What Claude Code Will Do

**Claude Code = AI that generates code**

For this project, Claude Code helps you:

**1. Generate Boilerplate**
```
You: "Generate a React component for selecting a role from this list"
Claude Code: [Writes complete React component with state management]
You: Review, tweak, done in 30 seconds
```

**2. Write API Endpoints**
```
You: "Create an Express endpoint that calls Claude API with RAG grounding"
Claude Code: [Writes full endpoint with error handling, validation, logging]
You: Copy-paste into your backend
```

**3. Write Database Queries**
```
You: "Write a PostgreSQL query to fetch case studies by role and company"
Claude Code: [Writes optimized query with indexes]
```

**4. Generate Scripts**
```
You: "Write a data ingestion script that parses PDFs and inserts into Supabase"
Claude Code: [Writes complete script with error handling]
```

### 11.2 What Claude Code Will NOT Do

Claude Code cannot:
- Deploy your app (you do that)
- Actually run code and check if it works (you test it)
- Make architectural decisions (you think strategically)
- Handle complex debugging (you debug)

**You + Claude Code = Partnership**

```
You think strategically (architecture, design decisions)
Claude Code writes tactical code (boilerplate, endpoints, scripts)
```

### 11.3 Example Workflow

**Task: Build Resume Interrogation Endpoint**

**Step 1: You describe what you want**
```
Build an Express POST endpoint at /api/resume/interrogate that:
1. Takes resume text, target role, target company
2. Retrieves grounding data (frameworks, company intel) from Supabase
3. Calls Claude API with RAG prompt
4. Validates response for hallucinations
5. Returns structured Q&A to frontend
6. Logs all API calls to audit table

Use the RAG pattern: retrieve → build prompt → call Claude → validate
```

**Step 2: Claude Code generates**
```javascript
router.post('/interrogate', authenticateUser, async (req, res) => {
  try {
    const { resumeText, targetRole, targetCompany } = req.body;
    
    // Validation
    if (!resumeText || !targetRole) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    // RAG retrieval
    const frameworks = await frameworkRepository.getByRole(targetRole);
    const companyIntel = targetCompany 
      ? await companyRepository.getByName(targetCompany)
      : null;
    
    // Build grounding context
    const ragContext = buildRAGContext({ frameworks, companyIntel });
    
    // Call Claude
    const prompt = promptBuilder.resumeInterrogation({...});
    const response = await claudeClient.call({...});
    
    // Validate
    const validated = responseValidator.validate(response);
    
    // Log to audit table
    await auditLog.create({
      userId: req.user.id,
      endpoint: '/resume/interrogate',
      status: 'success',
      tokensUsed: response.usage.total_tokens
    });
    
    res.json(validated);
  } catch (error) {
    errorHandler(error, res);
  }
});
```

**Step 3: You review**
- Does this match my architecture?
- Are there edge cases I need to handle?
- Is error handling good enough?

**Step 4: Iterate**
```
You: "Add retry logic in case Claude API times out"
Claude Code: [Adds exponential backoff retry]
```

### 11.4 Your Role (Strategic Decisions)

Claude Code writes code. **You decide:**

1. **Architecture**: Should this be a monolith or microservices?
2. **Data Flow**: How does data move through the system?
3. **Error Handling**: What happens when Claude times out?
4. **Security**: How do I prevent unauthorized access?
5. **Performance**: Is this query efficient enough?
6. **Scaling**: Will this code handle 10K users?

Claude Code is your tactical partner. You're the strategist.

---

## 12. IMPLEMENTATION TIMELINE

### Phase 0 (Week 1): Setup & Data Collection
- [ ] Create Supabase project
- [ ] Set up GitHub repo
- [ ] Gather case books, PPTs, handbooks
- [ ] Start data ingestion (PDFs → structured format)

**Output:** Raw data ready for ingestion

### Phase 1 (Weeks 2-3): MVP Core Features
- [ ] Frontend: Role selector, company selector (Lovable)
- [ ] Backend: Basic API routes, Claude integration
- [ ] Database: Schema, initial data load
- [ ] Feature 1: Skill Sharpening (frameworks, basic)
- [ ] Feature 5: Resume Interrogation
- [ ] Feature 6: Story Building
- [ ] Feature 9: Tone Shifter (basic)

**Output:** Functional MVP, testable by 10-15 people

### Phase 2 (Weeks 4-5): Feature Expansion
- [ ] Add 4 more roles: Marketing, Product, Strategy, Finance
- [ ] Company intelligence profiles (10+ companies)
- [ ] Guesstimate practice with feedback
- [ ] Case studies (5-10 with scoring)
- [ ] Mock interview simulator

**Output:** Full feature set, ready for batch launch

### Phase 3 (Weeks 6-8): Polish & Launch
- [ ] Data quality audit (verify no hallucinations)
- [ ] Performance optimization (caching, database indexes)
- [ ] User testing with 20-30 students
- [ ] Bug fixes + iteration
- [ ] Analytics setup (track engagement, outcomes)
- [ ] Marketing: Demo videos, testimonials
- [ ] Full launch to batch + referral program

**Output:** Live product, users, testimonials

---

## INTERVIEW DEFENSE: KEY TALKING POINTS

When an interviewer asks about your architecture:

### "Tell me about your tech stack"

**Answer:**
"I built Placewise with three layers:

**Frontend:** React + Lovable (component-based, state management, fast deployment to global CDN)

**Backend:** Node.js + Express (I/O-heavy orchestration between Claude API, Supabase, vector DB)

**Data:** Supabase PostgreSQL + pgvector (relational data, native vector embeddings for RAG retrieval)

The critical architecture decision was **Retrieval Augmented Generation (RAG)**. Students don't just need AI—they need accurate AI. So before every Claude call, I retrieve grounding data (real cases, company intel, frameworks) from the database and feed it to Claude. This prevents hallucination.

Cost-wise, Claude API at $3/1M tokens beats GPT-4 at $30/1M. The 200K context window means I can fit entire case studies into one prompt, which makes RAG simpler."

### "How do you prevent hallucination?"

**Answer:**
"Hallucination is the biggest risk. A wrong interview question could tank a student's chances.

**Three layers of defense:**

1. **Data Grounding:** All AI outputs must reference real data (cases, company interviews, frameworks). I don't ask Claude to generate novel questions; I ask it to explain real questions or suggest frameworks.

2. **Response Validation:** After Claude generates a response, my backend checks: 
   - Did you only reference sources I gave you?
   - Did you mention any companies not in my database?
   - Are your statistics sourced?

   If validation fails, I return low confidence and suggest the user consult another source.

3. **Crowdsourcing:** Interview questions come from students who actually interviewed, then get verified by placement cell staff. Not from Claude making things up.

The confidence score is part of the API response. If confidence < 80%, I flag it to the user."

### "What was your biggest technical challenge?"

**Answer:**
"RAG implementation. I had to:

1. **Build embeddings**: Convert all text (cases, frameworks, Q&As) into vector embeddings so I can do similarity search.

2. **Design the retrieval logic:** When a student asks about Razorpay PM interviews, how do I find the 5 most relevant Q&As in a database of 1,000+ questions? Cosine similarity in vector space.

3. **Integrate with LLM:** Take the top 5 results and feed them as context to Claude, along with the user's query. Tell Claude: 'Only use this context. Don't make things up.'

4. **Validate the output:** Check that Claude actually used the context and didn't hallucinate.

The challenge was balancing speed (retrieval + LLM call takes time) with accuracy. I added Redis caching for frequently-accessed frameworks and companies. Now the average response time is 2-3 seconds, which is good enough."

### "How do you handle scaling?"

**Answer:**
"Right now, I'm building for MVP. But the architecture scales:

1. **Horizontal scaling:** Multiple backend instances (each can call Claude API independently)
2. **Caching:** Redis for hot data (frameworks, company intel rarely change)
3. **Database partitioning:** User progress partitioned by date. Companies partitioned by industry. Keeps queries fast.
4. **Rate limiting:** Free users get 10 API calls/15 min. Premium users get 100. Prevents abuse.

At 1,000 users, I'll scale to 3-5 backend instances + read replicas for reporting. At 100K users, I'd shard the database by user ID.

The Claude API is the bottleneck. Each call to Claude costs money (~$0.003 per 1K tokens). I monitor this carefully. If costs exceed budget, I'll optimize prompts or use a smaller model (Claude Haiku)."

### "How would you monetize this?"

**Answer:**
"Freemium model:

**Free tier:**
- Access to all frameworks
- 1 resume interrogation/week
- 2 mock interviews/week
- General prep (not company-specific)

**Premium (₹99-199/month):**
- Unlimited features
- Company-specific coaching (Razorpay, Bain, etc.)
- Advanced story building with video
- Progress analytics

**B2B (future):**
- Placement cells buy access to track their cohort's prep
- Companies buy insights ('which skills are we looking for?')

My hypothesis: 20-30% of users will convert to premium (especially serious candidates targeting top companies).

Revenue at 1,000 users: ₹2,000-4,000/month (conservative). Enough to justify continued development."

---

## SUMMARY TABLE: Technology Choices

| Component | Technology | Why This | Why Not Alternative |
|-----------|------------|----------|---------------------|
| Frontend | React + Lovable | Component-based, job-market signal, ecosystem | Vue too small; Next.js too complex |
| Backend | Node.js + Express | I/O efficiency, JavaScript everywhere, deployment | Python slower; Go overkill; Java too heavy |
| LLM | Claude API | 200K context, cheap, good instruction-following | GPT-4 expensive; open-source needs infra |
| Database | Supabase PostgreSQL | Relational, pgvector for embeddings, managed | Firebase NoSQL; MongoDB no vectors |
| Caching | Redis | Speed, session management, cache invalidation | Memcached deprecated; file-based too slow |
| Vector DB | pgvector (built-in) | One less service, PostgreSQL integration | Pinecone, Weaviate add complexity |
| Deployment | Vercel (frontend) + Render (backend) | Simple, scales automatically, cheap | Heroku expensive; AWS too complex for MVP |
| Auth | Supabase Auth (JWT) | Built-in, OAuth support, no extra service | Auth0 costs; Firebase good but not PostgreSQL |
| Monitoring | Datadog (or free alternatives) | Central visibility, alerting, cost tracking | New Relic expensive; homegrown fragile |

---

## FINAL CHECKLIST: Before Launch

- [ ] **Data Quality:** Run data validation on all ingested content (no PII, no hallucinations, sources cited)
- [ ] **API Testing:** Test all endpoints with valid/invalid inputs. Verify error handling.
- [ ] **Hallucination Testing:** Intentionally ask Claude risky questions. Verify validation catches bad responses.
- [ ] **Security:** Authentication working. Rate limiting active. No SQL injection.
- [ ] **Performance:** Average response time < 3 seconds. Database queries optimized.
- [ ] **Monitoring:** Dashboards set up. Alerts configured. Cost tracking working.
- [ ] **Documentation:** Code commented. README complete. Deployment guide written.
- [ ] **User Testing:** 10-15 friends test MVP. Collect feedback. Iterate.

---

**End of Technical Architecture Document**

This document is your interview prep guide. Print it. Memorize the key decisions. Practice defending each choice.

You'll be asked about architecture in interviews. Having this level of detail shows you didn't just "follow a tutorial"—you made intentional decisions based on first principles.
