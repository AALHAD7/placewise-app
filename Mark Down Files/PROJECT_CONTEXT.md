# PROJECT CONTEXT: Interview Mastery Hub
## Master Reference Document for AI Agents

**Last Updated:** August 12, 2026  
**Project Status:** Pre-launch (Week 1)  
**Owner:** Aalhad Morabkar, IIM Tiruchirappalli PGPM 2025-27  
**Goal:** Build AI-powered interview prep platform with community verification

---

## TABLE OF CONTENTS

1. Project Overview
2. Problem Statement
3. Solution Architecture
4. Tech Stack
5. Build Approach
6. Data Strategy (RAG)
7. Database Schema
8. API Specifications
9. Frontend Architecture
10. Backend Architecture
11. Deployment Strategy
12. Phases & Timeline
13. Current Status
14. Files & Folder Structure
15. Instructions for AI Agents
16. Success Criteria
17. Constraints & Limitations
18. Decision Rationale

---

## 1. PROJECT OVERVIEW

### 1.1 Project Name
**Interview Mastery Hub (IMH)**

### 1.2 What Is It?
An integrated AI-powered interview preparation platform that:
- Consolidates fragmented interview prep resources
- Provides company-specific guidance using RAG (Retrieval Augmented Generation)
- Enables students to build structured interview narratives
- Creates community-verified knowledge base of real interview Q&As
- Uses Claude AI for grounded responses (no hallucinations)

### 1.3 Why Build It?
**Problem:** B-school and UG students prep using 5+ scattered tools:
- ChatGPT (generic, can hallucinate)
- YouTube (time-consuming, unreliable)
- Senior advice (inconsistent quality)
- Case books (hard to navigate)
- Glassdoor (limited company-specific insights)

**Pain Points:**
- No integrated workflow (resume → frameworks → story → mocks)
- No company-specific guidance
- No way to practice storytelling
- No community verification (can't trust info reliability)
- Seasonal access (placements are seasonal)

### 1.4 Core Value Proposition
```
"Your integrated interview prep assistant that learns from real student experiences
and teaches you exactly what each company asks for."
```

### 1.5 Target Users (Phase 1)
- **Primary:** IIM Tiruchirappalli 2nd year (250 students)
- **Secondary:** Other IIMs + top 50 B-schools (10-50K students)
- **Expansion (Phase 2):** UG engineering students (500K+ students)

### 1.6 Key Differentiators
1. **RAG-based** (grounded responses, no hallucination)
2. **Community-verified** (3-layer verification system)
3. **Integrated workflow** (resume → frameworks → story → tone → mocks)
4. **Company-specific** (not generic)
5. **Affordable** (₹100-500/year vs ₹300-1000/month for competitors)

---

## 2. PROBLEM STATEMENT

### 2.1 Current State
Students prepare for interviews using:
- Generic AI (ChatGPT)
- Scattered resources
- Trial and error
- Unverified information

**Resulting issues:**
- Inconsistent preparation quality
- Time waste juggling tools
- Misinformation from unreliable sources
- No personalized, company-specific guidance
- Interview anxiety due to uncertainty

### 2.2 Market Size
- **Phase 1 (MBA):** 50K students/year in India
- **Phase 2 (UG):** 1.5M students/year in India
- **Long-term:** 10M+ professionals globally (corporate interview prep)

### 2.3 Why Now?
- Claude API enables affordable, accurate RAG
- Supabase has pgvector (vectors for similarity search)
- Community models proven effective (Stack Overflow, GitHub)
- Post-MBA placement prep is critical need

---

## 3. SOLUTION ARCHITECTURE

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    USER BROWSER                          │
│              (React Frontend - Lovable)                  │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS API calls
                         ↓
┌─────────────────────────────────────────────────────────┐
│                  BACKEND SERVER                          │
│           (Node.js + Express, Render)                   │
│  - Routes, Controllers, Services, LLM layer, DAL       │
└──────┬──────────────────┬──────────────────────┬────────┘
       │                  │                      │
       ↓                  ↓                      ↓
┌────────────────┐ ┌────────────────┐ ┌─────────────────┐
│   Supabase     │ │  Claude API    │ │  External Data  │
│  PostgreSQL    │ │  (Anthropic)   │ │  - Glassdoor    │
│  + pgvector    │ │                │ │  - Case books   │
│                │ │  For:          │ │  - Frameworks   │
│  Storage of:   │ │  - Resume Q&As │ │                 │
│  - Users       │ │  - Story coach │ │                 │
│  - Frameworks  │ │  - Tone shift  │ │                 │
│  - Companies   │ │  - Mock Q&As   │ │                 │
│  - Q&As        │ │  - Feedback    │ │                 │
│  - Chunks      │ │                │ │                 │
│  - Embeddings  │ │                │ │                 │
└────────────────┘ └────────────────┘ └─────────────────┘
```

### 3.2 Core Data Flow (Example: Resume Interrogation)

```
1. Student uploads resume
   ↓
2. Frontend: POST /api/resume/interrogate
   Body: { resumeText, role: "Product", company: "Razorpay" }
   ↓
3. Backend receives request
   ↓
4. Database query: Search for top 5 Razorpay PM frameworks + Q&As
   (Uses pgvector similarity search)
   ↓
5. Retrieve:
   - 5 relevant case studies
   - Razorpay company intel
   - Common PM interview patterns
   ↓
6. Build prompt for Claude:
   System: "You are expert recruiter"
   Context: [5 case studies + company intel]
   User: "Analyze resume, generate likely questions"
   ↓
7. Call Claude API
   ↓
8. Claude responds with 15 grounded questions
   (Grounded = Based on retrieved context, not hallucinated)
   ↓
9. Validate response:
   - Did Claude only reference provided sources?
   - Are company names correct?
   - Are questions realistic for Razorpay?
   ↓
10. Return to frontend
    { success: true, questions: [...], confidence: 0.95 }
    ↓
11. Student sees interview questions ✓
```

---

## 4. TECH STACK

### 4.1 Frontend
```
Framework:     React 18+ (via Lovable or Create React App)
Styling:       Tailwind CSS (utility-first, responsive)
State Mgmt:    Zustand or React Context
Router:        React Router v6 (page navigation)
HTTP Client:   Axios or Fetch API
Hosting:       Vercel (auto-deploy from GitHub)

Why Lovable?
- Cloud-based React builder
- No setup needed
- Exports standard React code
- Can code + design visually
```

### 4.2 Backend
```
Runtime:       Node.js v24 LTS (v18+)
Framework:     Express.js
Language:      JavaScript
Authentication: Supabase Auth (JWT)
Deployment:    Render.com (auto-deploy from GitHub)

Why Express?
- Lightweight, fast
- Perfect for LLM integration
- Handles async/await well
- Easy middleware
```

### 4.3 Database
```
Primary:       PostgreSQL (Supabase)
Vector DB:     pgvector (built into PostgreSQL)
Embeddings:    1536-dimensional (Claude API)
Full-text:     PostgreSQL full-text search (optional, Phase 2)
File Storage:  Supabase Storage (for PDFs)

Why Supabase?
- PostgreSQL relational database
- pgvector for similarity search (critical for RAG)
- Built-in authentication
- File storage included
- Real-time subscriptions (optional)
- Free tier: 500MB, 8MB file storage
- Paid tier: $25/month = 100GB
```

### 4.4 AI/LLM
```
Primary LLM:   Claude 3.5 Sonnet (via Anthropic API)
Model String:  claude-3-5-sonnet-20241022
Cost:          $3 per 1M input tokens, $15 per 1M output tokens
Context:       200K tokens (can fit entire case books)

Why Claude?
- 10x cheaper than GPT-4
- 200K context window (fits cases in single prompt)
- Instruction-following reduces hallucinations
- Better for RAG use cases
```

### 4.5 Version Control & Deployment
```
Version Control: Git + GitHub
Frontend Deploy: Vercel (connects to GitHub, auto-deploys)
Backend Deploy:  Render.com (connects to GitHub, auto-deploys)
Environment:     .env files (secrets not in GitHub)
```

### 4.6 Development Tools
```
Code Editor:   VS Code (optional, not required)
API Testing:   Claude Code or curl or Postman
Terminal:      Mac: Terminal, Windows: PowerShell or WSL
Package Mgr:   npm (included with Node.js)
Version Mgr:   nvm (Node Version Manager, optional)
```

---

## 5. BUILD APPROACH

### 5.1 Methodology
**Vibe Coding with Claude Code**

```
Philosophy:
1. Ask Claude Code to write complete features
2. Copy-paste code into your folders
3. Test locally (npm start)
4. Iterate based on feedback
5. Deploy to production

NOT:
- Deep understanding of every line (not needed)
- Perfect code (good enough is fine)
- Building from scratch (use Claude)
- Following tutorials (just ask Claude)
```

### 5.2 How to Ask Claude Code

**Bad question:**
```
"Help me build a resume component"
```

**Good question:**
```
"Build a React component called ResumeInterrogation that:
- Has textarea for pasting resume
- Has dropdown to select role (PM, Consulting, etc)
- Has dropdown to select company (Razorpay, Juspay, etc)
- Has button to submit
- Calls POST /api/resume/interrogate when clicked
- Shows loading spinner while waiting
- Displays returned questions as list
- Each question has copy button
- Use Tailwind CSS for styling
- Export component as default export"
```

**Why the second is better:**
- Specific requirements
- Clear expected behavior
- No ambiguity
- Claude writes complete, working code

### 5.3 Workflow Loop
```
1. Read weekly plan (Section 12)
2. Ask Claude Code: "[Detailed feature request]"
3. Claude generates code
4. Copy code to your project
5. Test: npm start → browser → interact
6. If broken: Show error to Claude Code
7. Claude fixes it
8. Repeat until working
9. Commit to GitHub: git push
10. Deploy (automatic on Vercel/Render)
```

### 5.4 No Prerequisites Knowledge Needed
```
You DON'T need to know:
- SQL syntax (Claude Code handles it)
- React hooks deep-dive (Claude explains as it codes)
- Node.js internals (Claude handles it)
- Vector database math (Claude handles RAG)
- DevOps/Kubernetes (Vercel/Render handle it)

You DO need:
- Understanding of what you want to build
- Ability to test locally
- Git push to deploy
- Asking good questions
```

---

## 6. DATA STRATEGY (RAG)

### 6.1 What is RAG?

```
RAG = Retrieval Augmented Generation

Traditional LLM (ChatGPT):
  Question → Claude thinks → Answer (might hallucinate)

RAG (Our approach):
  Question → Search database for relevant documents
         → Give Claude the documents + question
         → Claude answers based on documents
         → Much less hallucination ✓
```

### 6.2 Why RAG for Interview Prep?

**Without RAG:**
```
Student: "What does Razorpay ask in PM interviews?"
Claude: "Razorpay asks about product strategy, market sizing..."
Problem: Claude might make up answers. No ground truth.
```

**With RAG:**
```
Student: "What does Razorpay ask in PM interviews?"
System:
  1. Search for Razorpay PM interview Q&As from our database
  2. Find top 5 most similar past questions
  3. Give Claude those 5 questions
  4. Prompt: "Based on these real Razorpay questions..."
Claude: "Razorpay typically asks about..."
Result: Grounded answer based on real data ✓
```

### 6.3 RAG Components

**1. Data Source (Your PDFs + Community Q&As)**
```
Sources:
- Case books (manually extracted to text)
- Company interview Q&As (from students)
- Frameworks (you provide)
- Job descriptions (from Razorpay, Juspay, etc.)
```

**2. Chunking (Split text into pieces)**
```
Why chunks?
- PDFs are long (200+ pages)
- Embeddings work on smaller text (200-500 tokens)
- More granular similarity search

How:
- Split by topic (~200 tokens each)
- Keep page numbers
- Store in document_chunks table
```

**3. Embeddings (Convert text to vectors)**
```
What: Text → 1536-dimensional vector
Who: Claude API embedding function
Why: Enables similarity search
How: For each chunk, call Claude API
    embedding = client.embed(chunk_text)
    Returns: [0.123, -0.456, 0.789, ...]

Cost: Cheap (~$0.02 per 1M tokens)
```

**4. Vector Database (Store + Search)**
```
What: pgvector (PostgreSQL extension)
Where: Supabase (built-in)
How: 
  INSERT INTO chunk_embeddings VALUES (
    chunk_id: 123,
    embedding: [0.123, -0.456, ...]
  )

Search query:
  SELECT chunk_id, chunk_text
  FROM chunk_embeddings
  ORDER BY embedding <-> query_embedding  -- Similarity search
  LIMIT 5  -- Top 5 similar chunks
```

**5. Prompt Grounding (Give Claude context)**
```
Instead of:
  "What does Razorpay ask?"

Do:
  "Based on these real Razorpay interview questions:
   [Q1: ...]
   [Q2: ...]
   [Q3: ...]
   
   What patterns do you see? What should I prepare for?"

Result: Claude answers based on provided context
```

### 6.4 RAG vs Fine-tuning

```
RAG (What we're using):
- Cost: $0.003 per 1M tokens (cheap)
- Speed: Instant (retrieves at query time)
- Reversibility: Can update data anytime
- Scalability: Add new data without retraining
- Learning curve: Easy to understand
- Good for: Knowledge base that changes (interview Q&As grow daily)

Fine-tuning (Consider later, Year 2+):
- Cost: $3-5 per 1M tokens (100x more expensive)
- Speed: Hours to train model
- Reversibility: Hard to rollback
- Scalability: Needs 10K+ examples
- Learning curve: Complex
- Good for: Style/behavior changes ("act like McKinsey consultant")

Decision: Use RAG now, revisit fine-tuning in Year 2 if needed
```

### 6.5 Hallucination Prevention

```
Problem: Claude might say "Razorpay asks about X" when we never taught it that

Solution (3 layers):

Layer 1: RAG Context
  → Only pass real data to Claude
  → Instruction: "Answer based only on provided context"

Layer 2: Validation
  → Check if Claude's response references provided sources
  → Validate company names are in our database
  → Check if examples match what's in documents

Layer 3: Confidence Score
  → Return confidence (0-1) with each response
  → If < 0.8 → Flag as "uncertain"
  → User sees: "I'm 95% confident" or "I'm uncertain"

Example:
  Response: "Razorpay asks about payment flows"
  Confidence: 0.95 (this matches 5 real Q&As in database)
  Status: GREEN ✓

  Response: "Razorpay asks about X"
  Confidence: 0.3 (can't find this in database)
  Status: RED ⚠️ Flag for manual review
```

### 6.6 Data Ingestion Pipeline

```
Phase 1 (Week 1): Manual
  You extract text from PDFs
  Result: .txt files

Phase 2 (Week 2-3): Batch Processing
  Claude Code writes script to:
    1. Read .txt files
    2. Split into chunks (200 tokens)
    3. Create embeddings for each chunk
    4. Store in PostgreSQL + pgvector
  Result: Searchable chunks ready for RAG

Phase 3 (Week 4+): API-based
  Students submit interview Q&As
  System auto-embeds + verifies + stores
  RAG database grows daily

Phase 4 (Week 5+): Automated Upload
  Users upload PDFs via website
  Backend auto-extracts + chunks + embeds
  No manual work
```

---

## 7. DATABASE SCHEMA

### 7.1 Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR,  -- Supabase Auth handles this
  name VARCHAR NOT NULL,
  target_role VARCHAR,  -- PM, Consulting, Operations, etc
  target_companies TEXT[],  -- ['Razorpay', 'Juspay']
  resume_text TEXT,  -- User's resume
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 7.2 Documents Table (PDFs)
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,  -- "McKinsey Case Book"
  type VARCHAR,  -- 'case_book', 'framework', 'company_intel'
  category VARCHAR,  -- 'consulting', 'finance', 'tech'
  file_url VARCHAR,  -- URL to PDF in Supabase Storage
  file_size_mb DECIMAL,
  pages INT,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT NOW(),
  description TEXT
);
```

### 7.3 Document Chunks Table (Parsed Text)
```sql
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,  -- "Market sizing requires..."
  chunk_index INT,  -- Position in document
  page_number INT,
  tokens_count INT,  -- ~200 tokens per chunk
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 7.4 Chunk Embeddings Table (Vectors for RAG)
```sql
CREATE TABLE chunk_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chunk_id UUID REFERENCES document_chunks(id) ON DELETE CASCADE,
  embedding vector(1536),  -- Claude embeddings are 1536-dim
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast similarity search
CREATE INDEX idx_chunk_embeddings_similarity 
  ON chunk_embeddings USING ivfflat (embedding vector_cosine_ops);
```

### 7.5 Companies Table
```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR UNIQUE NOT NULL,  -- "Razorpay"
  industry VARCHAR,  -- "fintech"
  website VARCHAR,
  hiring_bar_gpa DECIMAL,
  culture_signals TEXT[],  -- ['fast-paced', 'impact-focused']
  ug_hiring BOOLEAN,  -- Do they hire UG students?
  ug_avg_salary DECIMAL,
  mba_avg_salary DECIMAL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 7.6 Company Interview Questions Table
```sql
CREATE TABLE company_interview_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  role_title VARCHAR,  -- "Product Manager"
  role_level VARCHAR,  -- 'mba', 'ug_sde', 'ug_finance'
  question TEXT NOT NULL,  -- "Tell me about a product you'd build"
  difficulty SMALLINT,  -- 1-3
  sample_answer_direction TEXT,  -- Hint on how to answer
  submitted_by UUID REFERENCES users(id),
  submitted_at TIMESTAMP,
  verification_status VARCHAR DEFAULT 'pending',  -- pending, approved, rejected
  community_votes INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 7.7 Frameworks Table
```sql
CREATE TABLE frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,  -- "MECE Thinking"
  role VARCHAR,  -- "consulting"
  role_level VARCHAR,  -- 'mba', 'ug_sde', 'both'
  description TEXT NOT NULL,
  example_application TEXT,
  formula_or_steps TEXT,  -- Step-by-step breakdown
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 7.8 User Progress Table
```sql
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR,  -- 'read_framework', 'completed_mock', 'studied_case'
  resource_id UUID,  -- Which framework/case/etc
  score DECIMAL,  -- Mock interview score
  time_spent_minutes INT,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 7.9 Community Contributions Table
```sql
CREATE TABLE community_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contributor_id UUID REFERENCES users(id),
  company_id UUID REFERENCES companies(id),
  contribution_type VARCHAR,  -- 'interview_qa', 'case_study', 'framework', 'company_intel'
  content TEXT,
  answer_direction TEXT,  -- For Q&As
  sources TEXT[],  -- Where did this come from?
  verification_status VARCHAR DEFAULT 'pending',  -- pending, auto_approved, approved, rejected
  votes_up INT DEFAULT 0,
  votes_down INT DEFAULT 0,
  usage_count INT DEFAULT 0,  -- How many people used this?
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast lookup
CREATE INDEX idx_community_contributions_status 
  ON community_contributions(verification_status, company_id);
```

### 7.10 Mock Interview Sessions Table
```sql
CREATE TABLE mock_interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  company_id UUID REFERENCES companies(id),
  role_title VARCHAR,
  difficulty INT,  -- 1-3
  questions_asked INT,
  questions_answered INT,
  overall_score DECIMAL,
  feedback TEXT,  -- Claude-generated feedback
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);
```

---

## 8. API SPECIFICATIONS

### 8.1 Base URL
```
Development: http://localhost:3001
Production: https://imh-backend.onrender.com
```

### 8.2 Authentication
```
Method: JWT (Supabase Auth)
Header: Authorization: Bearer <token>
Example: Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### 8.3 Core Endpoints

#### **POST /api/resume/interrogate**
```
Purpose: Analyze resume, generate interview questions
Auth: Required

Request:
{
  "resumeText": "Senior engineer at Google...",
  "role": "Product",  -- 'PM', 'Consulting', 'Ops', etc
  "company": "Razorpay",  -- Optional, null = general prep
  "numQuestions": 15
}

Response (200):
{
  "success": true,
  "questions": [
    {
      "id": "q-1",
      "question": "Tell me about a product you've built...",
      "framework": "Product thinking",
      "difficulty": 2,
      "sampleAnswer": "Start with problem statement...",
      "followUp": "Why did you choose that approach?"
    },
    ...
  ],
  "confidence": 0.92,
  "processingTimeMs": 2450,
  "sourcesUsed": 5  -- How many case studies informed this
}

Error (400):
{
  "success": false,
  "error": "Resume text required"
}
```

#### **POST /api/story/generate**
```
Purpose: Build interview narrative from resume
Auth: Required

Request:
{
  "resume": { ...full user resume object... },
  "role": "Product",
  "company": "Razorpay",
  "focusAreas": ["analytics", "product strategy"]
}

Response (200):
{
  "success": true,
  "narratives": [
    {
      "id": "n-1",
      "title": "Analytics Leader to PM",
      "story": "While leading analytics at Google...",
      "keyThemes": ["impact", "data-driven", "scalability"],
      "strength": 0.85  -- How well this narrative fits PM role
    },
    ...
  ]
}
```

#### **POST /api/tone/shift**
```
Purpose: Rewrite text in different tones
Auth: Required

Request:
{
  "text": "I built a big machine learning system",
  "tones": ["professional", "story-driven", "technical", "leader"]
}

Response (200):
{
  "success": true,
  "variations": [
    {
      "tone": "professional",
      "text": "I architected a comprehensive machine learning infrastructure..."
    },
    {
      "tone": "story-driven",
      "text": "I was tasked with solving a complex prediction challenge..."
    },
    ...
  ]
}
```

#### **POST /api/mock-interview/start**
```
Purpose: Start mock interview session
Auth: Required

Request:
{
  "company": "Razorpay",
  "role": "Product",
  "difficulty": 2  -- 1-3 scale
}

Response (200):
{
  "sessionId": "session-abc-123",
  "question": "Tell me about a product you'd build for Razorpay",
  "difficulty": 2,
  "timeLimit": 300  -- 5 minutes
}
```

#### **POST /api/mock-interview/answer**
```
Purpose: Submit answer to interview question, get feedback
Auth: Required

Request:
{
  "sessionId": "session-abc-123",
  "userAnswer": "I would build a feature that...",
  "timeSpent": 250  -- seconds
}

Response (200):
{
  "success": true,
  "feedback": {
    "score": 7.5,  -- 0-10
    "strengths": ["Clear problem statement", "Good structure"],
    "improvements": ["Add metrics", "Discuss tradeoffs"],
    "sampleBetterAnswer": "A strong answer would...",
    "followUpQuestion": "Why did you prioritize that feature?"
  }
}
```

#### **GET /api/frameworks**
```
Purpose: Get all frameworks for a role
Auth: Optional

Query params:
  ?role=Product&level=mba

Response (200):
{
  "success": true,
  "frameworks": [
    {
      "id": "f-1",
      "name": "Jobs-to-be-Done",
      "description": "Understand what job customer is doing...",
      "example": "Uber's job is not transportation, it's convenience",
      "steps": ["Identify job", "Map process", "Find pains"]
    },
    ...
  ]
}
```

#### **GET /api/companies/:companyName**
```
Purpose: Get company intel
Auth: Optional

Response (200):
{
  "success": true,
  "company": {
    "id": "c-1",
    "name": "Razorpay",
    "industry": "fintech",
    "culture": ["fast-paced", "impact-driven"],
    "hiringBar": "Strong problem-solving + communication",
    "commonQuestions": [
      { "role": "PM", "question": "..." },
      ...
    ]
  }
}
```

#### **POST /api/community/contribute**
```
Purpose: Student submits interview Q&A
Auth: Required

Request:
{
  "type": "interview_qa",  -- 'interview_qa', 'case_study', 'framework'
  "company": "Razorpay",
  "role": "PM",
  "content": "Q: Tell me about a product you'd build\nA: I would build...",
  "sources": ["Real interview on 2025-08-10"]
}

Response (200):
{
  "success": true,
  "contributionId": "contrib-123",
  "status": "pending",  -- Needs verification
  "message": "Thanks! Your contribution is being verified by our community."
}
```

#### **GET /api/health**
```
Purpose: Check if backend is running
Auth: Not required

Response (200):
{
  "status": "OK",
  "timestamp": "2025-08-12T10:30:45Z"
}
```

---

## 9. FRONTEND ARCHITECTURE

### 9.1 Folder Structure
```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── RoleSelector.jsx          (Select role: PM, Consulting, etc)
│   │   ├── CompanySelector.jsx       (Select company: Razorpay, etc)
│   │   ├── SkillModule.jsx           (Display frameworks)
│   │   ├── ResumeInterrogation.jsx   (Upload resume, get Q&As)
│   │   ├── StoryBuilder.jsx          (Build interview narrative)
│   │   ├── ToneShifter.jsx           (Rewrite in different tones)
│   │   ├── MockInterview.jsx         (Chat-like mock interview)
│   │   ├── Dashboard.jsx             (Progress, stats)
│   │   ├── Navbar.jsx                (Navigation)
│   │   └── LoadingSpinner.jsx        (Loading indicator)
│   ├── pages/
│   │   ├── Home.jsx                  (Landing page)
│   │   ├── Prep.jsx                  (Main prep page)
│   │   ├── Progress.jsx              (User progress)
│   │   └── Settings.jsx              (User settings)
│   ├── context/
│   │   └── UserContext.jsx           (Global user state)
│   ├── hooks/
│   │   ├── useApi.js                 (API call wrapper)
│   │   └── useAuth.js                (Auth state)
│   ├── utils/
│   │   ├── api.js                    (API endpoints)
│   │   ├── storage.js                (localStorage helpers)
│   │   └── validators.js             (Input validation)
│   ├── styles/
│   │   └── global.css                (Tailwind + global styles)
│   ├── App.jsx                       (Main app component)
│   ├── index.js                      (Entry point)
│   └── index.css                     (Global styles)
├── .env.local                        (Environment variables)
├── .env.production                   (Production env vars)
├── package.json
├── tailwind.config.js                (Tailwind configuration)
└── README.md
```

### 9.2 Component Tree
```
App
├── Navbar
├── Router
│   ├── Home page
│   │   └── RoleSelector
│   ├── Prep page
│   │   ├── CompanySelector
│   │   ├── SkillModule
│   │   ├── ResumeInterrogation
│   │   ├── StoryBuilder
│   │   ├── ToneShifter
│   │   └── MockInterview
│   ├── Progress page
│   │   └── Dashboard
│   └── Settings page
└── Footer
```

### 9.3 User Flow
```
1. Land on Home page
2. Click "Start Prep"
3. Select role (PM, Consulting, Ops, etc) → RoleSelector
4. Select company (Razorpay, Juspay, etc) → CompanySelector
5. Study frameworks → SkillModule
6. Upload resume → ResumeInterrogation (gets Q&As)
7. Build narrative → StoryBuilder
8. Polish writing → ToneShifter
9. Practice interviews → MockInterview (get feedback)
10. View progress → Dashboard
```

### 9.4 State Management (Context)
```javascript
UserContext:
{
  user: {
    id, email, name,
    targetRole, targetCompanies,
    resume
  },
  progress: {
    frameworksLearned,
    mocksCompleted,
    storiesBuilt
  },
  setUser, setProgress
}
```

### 9.5 Key Design Decisions
```
1. Tailwind CSS: Utility-first, responsive, fast
2. React Context: Simple, no Redux complexity
3. Lovable optional: Can use or regular React
4. Mobile-first: Design for 320px+
5. Dark mode optional: Light mode primary
```

---

## 10. BACKEND ARCHITECTURE

### 10.1 Folder Structure
```
backend/
├── src/
│   ├── routes/
│   │   ├── resume.routes.js          (POST /api/resume/interrogate)
│   │   ├── story.routes.js           (POST /api/story/generate)
│   │   ├── tone.routes.js            (POST /api/tone/shift)
│   │   ├── mock-interview.routes.js  (POST /api/mock-interview/...)
│   │   ├── frameworks.routes.js      (GET /api/frameworks)
│   │   ├── companies.routes.js       (GET /api/companies/...)
│   │   └── community.routes.js       (POST /api/community/contribute)
│   ├── controllers/
│   │   ├── resumeController.js       (Business logic for resume)
│   │   ├── storyController.js
│   │   ├── toneController.js
│   │   ├── mockInterviewController.js
│   │   └── communityController.js
│   ├── services/
│   │   ├── claudeService.js          (Claude API calls)
│   │   ├── resumeService.js          (Resume processing)
│   │   ├── ragService.js             (RAG retrieval)
│   │   ├── verificationService.js    (Hallucination checks)
│   │   └── embeddingService.js       (Vector operations)
│   ├── middleware/
│   │   ├── auth.js                   (JWT verification)
│   │   ├── errorHandler.js           (Error handling)
│   │   ├── cors.js                   (CORS config)
│   │   └── logger.js                 (Request logging)
│   ├── config/
│   │   ├── database.js               (Supabase client)
│   │   ├── claude.js                 (Claude API config)
│   │   └── env.js                    (Environment variables)
│   ├── utils/
│   │   ├── prompts.js                (Claude prompts)
│   │   ├── validators.js             (Input validation)
│   │   └── helpers.js                (Utility functions)
│   └── server.js                     (Entry point, Express app)
├── .env                              (Secrets, API keys)
├── package.json
└── README.md
```

### 10.2 Request Flow
```
Frontend API Call
     ↓
Express Route (POST /api/resume/interrogate)
     ↓
Middleware: auth.js (verify JWT token)
     ↓
Controller: resumeController.interrogate()
     ↓
Service: resumeService.processResume()
     ↓
RAG: ragService.retrieveContext()
     ├─ Query Supabase for similar chunks (pgvector)
     ├─ Get company intel
     └─ Get relevant case studies
     ↓
Claude: claudeService.callClaude()
     ├─ System prompt: "You are expert recruiter"
     ├─ Context: Retrieved chunks
     └─ User message: "Analyze resume, generate questions"
     ↓
Verification: verificationService.validate()
     ├─ Check Claude only used provided sources
     ├─ Validate company names
     └─ Calculate confidence score
     ↓
Response: { questions, confidence, sources }
     ↓
Frontend Display
```

### 10.3 Claude Integration
```javascript
// Pseudocode

async function interrogateResume(resume, role, company) {
  // 1. Retrieve context from RAG
  const context = await ragService.retrieve({
    query: resume,
    company: company,
    role: role,
    topK: 5
  });
  // Returns: { cases: [...], companyIntel: {...}, patterns: [...] }

  // 2. Build prompt
  const systemPrompt = `You are expert recruiter specializing in ${role} interviews.
    Only reference the provided context. Generate realistic interview questions.`;

  const userMessage = `
    Resume: ${resume}
    Target role: ${role}
    Target company: ${company}
    
    Context from similar interviews:
    ${context.cases.map(c => c.text).join('\n')}
    
    Company culture: ${JSON.stringify(context.companyIntel)}
    
    Generate 15 realistic interview questions this candidate should prepare for.`;

  // 3. Call Claude
  const response = await claudeService.callClaude({
    systemPrompt,
    userMessage,
    maxTokens: 2000
  });

  // 4. Validate & score confidence
  const validated = await verificationService.validate({
    response,
    context
  });

  // 5. Return
  return {
    questions: validated.questions,
    confidence: validated.confidence,
    sourceCount: context.cases.length
  };
}
```

### 10.4 Error Handling
```
500 Internal Server Error:
  - Claude API timeout
  - Supabase connection error
  - Unhandled exception

400 Bad Request:
  - Missing required fields
  - Invalid input format
  - Invalid role/company

401 Unauthorized:
  - Invalid or expired JWT token

429 Too Many Requests:
  - Rate limit exceeded
  - Claude API quota exceeded

All errors:
  - Logged to console
  - Returned as JSON: { error: "message" }
  - Include error ID for debugging
```

---

## 11. DEPLOYMENT STRATEGY

### 11.1 Frontend Deployment (Vercel)

```
Step 1: Connect GitHub
  Vercel.com → Connect GitHub → Select repo

Step 2: Environment Variables
  Settings → Environment Variables → Add:
    REACT_APP_BACKEND_URL = https://imh-backend.onrender.com

Step 3: Deploy
  Push to main branch → Vercel auto-deploys

Step 4: Custom Domain (Optional)
  Settings → Domains → Add custom domain

URL: https://your-app.vercel.app
```

### 11.2 Backend Deployment (Render)

```
Step 1: Connect GitHub
  Render.com → Create Web Service → Select GitHub repo

Step 2: Environment Variables
  Settings → Environment → Add:
    SUPABASE_URL = https://project.supabase.co
    SUPABASE_KEY = your-key-here
    CLAUDE_API_KEY = your-key-here
    NODE_ENV = production

Step 3: Deploy
  Push to main branch → Render auto-deploys

URL: https://imh-backend.onrender.com
```

### 11.3 Database Deployment (Supabase)

```
Already cloud-hosted, no deployment needed.

Backup strategy:
  Supabase → Backups → Enable daily backups
  
Migration strategy:
  Development DB → Production DB (same Supabase project)
  Use environment variables to switch
```

### 11.4 Deployment Checklist

Before deploying to production:

```
Frontend:
  [ ] All components built and tested locally
  [ ] No console errors (F12)
  [ ] Responsive design tested (mobile, tablet, desktop)
  [ ] API calls use production backend URL
  [ ] Environment variables set in Vercel

Backend:
  [ ] All endpoints tested locally with curl/Postman
  [ ] Error handling in place
  [ ] Rate limiting configured
  [ ] Environment variables set in Render
  [ ] Database migrations run
  [ ] Logging configured

Database:
  [ ] All tables created
  [ ] Indexes created
  [ ] Backups enabled
  [ ] Data seeded (frameworks, companies)

Security:
  [ ] JWT tokens working
  [ ] CORS configured correctly
  [ ] API keys not in GitHub
  [ ] HTTPS enforced
```

---

## 12. PHASES & TIMELINE

### 12.1 Phase 1: MVP - B-School Launch (Weeks 1-8)

**Goal:** Prove model works with B-school students at IIM Trichy

**Features:**
1. Role & Company Selector
2. Frameworks Library
3. Resume Interrogation
4. Story Building
5. Tone Shifter
6. Mock Interview Simulator
7. Community Contribution (basic form)
8. Dashboard + Progress tracking

**Data:**
- 5-10 case books (manually extracted)
- 30 frameworks
- 10-20 companies
- 0 community Q&As (added during beta)

**Launch:**
- Deploy to Vercel + Render
- Email to IIM Trichy 2nd year (250 students)
- Target: 50-100 users in Week 1, 500+ by Week 8

**Success Metrics:**
- 100+ active users
- 50% daily active users
- 3-5 min avg session time
- 0 critical bugs
- 90% question accuracy (verified by students)

---

### 12.2 Phase 2: UG Expansion (Months 4-6)

**Goal:** Expand to engineering colleges (10x TAM)

**New Features:**
- DSA (Data Structures) interview prep
- System Design interview prep
- Software Engineer role framework
- Finance/Analyst role prep (for finance students)
- Automated PDF upload + extraction

**Data:**
- 50+ case books
- 100+ frameworks
- 100+ companies
- 1,000+ community Q&As

**Target:** 50K-200K active users

**Timeline:**
- Month 4: Plan + build features
- Month 5: Launch to top 50 colleges
- Month 6: Expand to 500+ colleges

---

### 12.3 Phase 3: Scale & Monetization (Months 7-12)

**Goal:** Become market leader in India + SE Asia

**Features:**
- Video mock interviews
- AI coaching (real-time feedback)
- Institutional plans (colleges + corporates)
- Global expansion (SE Asia, then global)

**Business:**
- Premium subscription (₹500-2000/year)
- B2B for colleges (institutional licensing)
- B2B for corporates (employee training)

**Target:** 500K-1M active users, ₹50-200M annual revenue

---

### 12.4 Weekly Breakdown (Phase 1)

```
WEEK 1: Setup + Foundation
  Day 1-2: Install tools, create accounts
  Day 3-4: Frontend scaffold + RoleSelector
  Day 5-6: Backend scaffold + /health endpoint
  Day 7: Database setup
  Deliverable: Basic project structure

WEEK 2: Resume Interrogation Feature
  Day 8-9: Build /api/resume/interrogate endpoint
  Day 10-11: Build ResumeInterrogation.jsx component
  Day 12-13: Integration testing
  Day 14: Deploy to staging
  Deliverable: Resume interrogation works end-to-end

WEEK 3: Story + Tone Features
  Day 15-16: Build /api/story/generate endpoint
  Day 17-18: Build StoryBuilder.jsx component
  Day 19-20: Build ToneShifter feature
  Day 21: Testing + polish
  Deliverable: Story + Tone features complete

WEEK 4: Mock Interview + Dashboard
  Day 22-23: Build mock interview backend
  Day 24-25: Build MockInterview.jsx component
  Day 26-27: Build Dashboard.jsx
  Day 28: Full integration test
  Deliverable: All core features complete

WEEK 5: Community Features
  Day 29-30: Build contribution system
  Day 31-32: Build community frontend
  Day 33-34: Testing + optimization
  Day 35: Beta launch prep
  Deliverable: Full product ready

WEEKS 6-7: Testing + Iteration
  Beta testing with 10-15 friends
  Collect feedback
  Fix bugs
  Polish UI/UX

WEEK 8: Launch
  Deploy to production
  Email to all IIM Trichy 2nd years
  Monitor for issues
  Collect testimonials
```

---

## 13. CURRENT STATUS

### 13.1 What's Done
- ✅ Project ideation + validation
- ✅ Product requirements document (PRD)
- ✅ Technical architecture designed
- ✅ Database schema designed
- ✅ API specification designed
- ✅ Build plan created
- ✅ All tools installed (Node.js, Git)
- ✅ Online accounts created (Supabase, Claude API, GitHub, Vercel, Render)
- ✅ This context document

### 13.2 What's Next (This Week)
- [ ] Create Supabase project + tables
- [ ] Collect 5-10 PDFs
- [ ] Extract text from PDFs manually
- [ ] Initialize React project (frontend folder)
- [ ] Initialize Node.js project (backend folder)
- [ ] Create basic folder structure
- [ ] Build RoleSelector component
- [ ] Build basic Express server

### 13.3 No Code Written Yet
- No React components yet
- No backend endpoints yet
- No database tables yet
- All will be built using Claude Code (vibe coding)

---

## 14. FILES & FOLDER STRUCTURE

### 14.1 Project Root
```
interview-mastery-hub/
├── frontend/                    (React app)
├── backend/                     (Node.js/Express)
├── data/                        (Your PDFs + extracted text)
│   ├── raw-pdfs/               (Original PDF files)
│   └── extracted-text/         (Text extracted from PDFs)
├── docs/                        (Documentation)
│   ├── architecture.md
│   ├── database-schema.md
│   └── api-specs.md
├── .gitignore
├── README.md
└── CONTEXT.md                  (This file - for AI agents)
```

### 14.2 What Goes in `.gitignore`
```
node_modules/
.env
.env.local
.env.production
.DS_Store
*.log
dist/
build/
.vscode/
.idea/
```

### 14.3 What NEVER Goes to GitHub
```
.env files (API keys, secrets)
node_modules/ (too large)
PDFs (too large, use file storage)
User data / database backups
```

### 14.4 How to Name Files
```
Component files:      PascalCase.jsx (RoleSelector.jsx)
Route files:          kebab-case.js (resume.routes.js)
Utility files:        camelCase.js (ragService.js)
CSS files:            kebab-case.css (global-styles.css)
Database migrations:  timestamp-description.sql (202508121000-create-users-table.sql)

Example:
frontend/src/components/RoleSelector.jsx  ✓
frontend/src/utils/apiClient.js           ✓
backend/src/services/claudeService.js     ✓
```

---

## 15. INSTRUCTIONS FOR AI AGENTS

### 15.1 When Using Claude Code

```
Good prompt:
"Build a React component called ResumeInterrogation that has:
1. Textarea for resume text
2. Dropdown for role selection (PM, Consulting, Ops, Finance, etc)
3. Dropdown for company (Razorpay, Juspay, PhonePe, etc)
4. Submit button
5. Shows loading spinner while fetching
6. Displays results as array of questions
7. Each question has copy button + difficulty badge
8. Use Tailwind CSS for styling
9. Make it mobile responsive
10. Export as default export"

Claude Code will:
- Generate complete, working component
- Include comments explaining logic
- Handle loading/error states
- Export properly

You then:
- Copy code to src/components/ResumeInterrogation.jsx
- Test: npm start → browser → interact
- If error, show to Claude Code, it fixes
```

### 15.2 When Asking for Backend Code

```
Good prompt:
"Create a Node.js/Express endpoint POST /api/resume/interrogate that:
1. Takes { resumeText, role, company } as input
2. Validates inputs (error if missing)
3. Calls RAG service to get context
4. Calls Claude API with grounded prompt
5. Returns { success, questions, confidence }
6. Includes error handling
7. Logs to console
8. Works with Supabase + Claude API

Create two files:
- backend/src/routes/resume.routes.js
- backend/src/controllers/resumeController.js"

Claude Code will:
- Generate complete working files
- Include proper structure
- Handle async/await correctly
- Include error handling
```

### 15.3 When Asking for Database Help

```
Good prompt:
"Write SQL to create tables for:
1. Users (id, email, name, target_role, resume_text)
2. Documents (id, name, file_url, category)
3. Document chunks (id, document_id, chunk_text, page_number)
4. Chunk embeddings (id, chunk_id, embedding as vector(1536))
5. Companies (id, name, industry, hiring_bar)

Include:
- Primary keys
- Foreign keys with CASCADE delete
- Timestamps
- Indexes for fast queries (especially for pgvector)"
```

### 15.4 When Stuck

```
What to do:
1. Show full error message to Claude Code
2. Say exactly what you were trying to do
3. Show relevant code snippet

Example:
"I'm getting this error: 'Cannot find module axios'
I'm trying to make API calls in my backend.
My file is at backend/src/services/claudeService.js
Here's the import: const axios = require('axios')"

Claude Code will:
- Diagnose the issue
- Provide fix
- Explain why it happened
```

### 15.5 When Using Other AI Agents

```
This CONTEXT.md file has everything they need.

When asking Claude, GPT, or other AI:
"I'm building Interview Mastery Hub. Here's my project context: [paste relevant sections]

I need help with: [specific ask]"

Relevant sections to include:
- Section 1: Project Overview
- Section 3: Solution Architecture
- Section 5: Build Approach
- Section 6: Data Strategy (if about RAG)
- Section 7: Database Schema (if about data)
- Section 8: API Specs (if about endpoints)

The AI will understand your project and give better help.
```

### 15.6 Exact Questions to Ask Claude Code

#### For Frontend Components
```
"Build a React component [ComponentName].jsx that:
- [Requirement 1]
- [Requirement 2]
- Calls POST /api/[endpoint] when [action]
- Shows [loading state]
- Displays [output format]
- Use Tailwind CSS for styling
- Mobile responsive (320px+)
- Export as default export"
```

#### For Backend Endpoints
```
"Create Node.js/Express endpoint POST /api/[endpoint] that:
- Takes { [input fields] } as input
- Calls [service] to [action]
- Returns { success, [data] }
- Error handling with proper HTTP codes
- Logged to console

Create files:
- backend/src/routes/[name].routes.js
- backend/src/controllers/[name]Controller.js"
```

#### For Services
```
"Create a service [serviceName].js that:
- Function [name]([params]) that:
  - Does [action]
  - Returns [output]
  - Handles [error case]
- Exported as module.exports"
```

#### For Debugging
```
"I'm getting this error: [error message]
I was trying to: [what you did]
Here's my code: [paste code snippet]

What's the issue and how do I fix it?"
```

---

## 16. SUCCESS CRITERIA

### 16.1 MVP Success Criteria (Week 8)

```
Technical:
  ✓ Frontend deployed to Vercel
  ✓ Backend deployed to Render
  ✓ Database working (Supabase)
  ✓ All 7 core features working
  ✓ No critical bugs in production
  ✓ <2 second load time
  ✓ 99.9% uptime

User Experience:
  ✓ Intuitive UI (no tutorial needed)
  ✓ Mobile responsive
  ✓ Works on all major browsers
  ✓ Clear error messages
  ✓ Feedback within 2 seconds

Product:
  ✓ 100+ active users
  ✓ 50% daily active rate
  ✓ 3-5 min avg session
  ✓ 10+ completed mocks
  ✓ 5+ community contributions
  ✓ 90%+ accuracy on AI responses

Business:
  ✓ Positive feedback from users
  ✓ 10+ testimonials
  ✓ Ready for campus launch
  ✓ Zero hallucinations reported
```

### 16.2 Phase 1 Success Metrics (End of Month 2)

```
Users:
  ✓ 500+ active users
  ✓ 40%+ daily active rate
  ✓ 10+ students converted to premium (if monetized)

Engagement:
  ✓ 1,000+ mocks completed
  ✓ 100+ community Q&As
  ✓ 30+ verified contributions
  ✓ 4.5+ star rating

Quality:
  ✓ 95%+ accuracy on AI responses
  ✓ 0 critical bugs
  ✓ 0 hallucinations reported
  ✓ Zero security issues
```

### 16.3 Phase 2 Success Metrics (End of Month 6)

```
Users:
  ✓ 50K+ active users (from UG expansion)
  ✓ 30%+ daily active rate
  ✓ 5,000+ premium users

Revenue (if charging):
  ✓ ₹5-20M monthly recurring
  ✓ 10%+ premium conversion

Impact:
  ✓ Present at 10+ colleges
  ✓ Media coverage (college publications)
  ✓ Investor interest (if seeking funding)
```

---

## 17. CONSTRAINTS & LIMITATIONS

### 17.1 Technical Constraints

```
Frontend:
  - Must work on mobile (320px+)
  - Must be fast (<2s load)
  - Can't use heavy libraries (keeps bundle size down)
  - Authentication via Supabase only

Backend:
  - Claude API timeout = 60 seconds
  - Rate limit: 20 requests/min (can increase)
  - Context window: 200K tokens max
  - Response time: Target <3 seconds

Database:
  - Supabase free tier: 500MB storage
  - 8MB file storage limit on free tier
  - pgvector: Need to create indexes for performance
  - Data retention: Permanent (no auto-deletion)

Deployment:
  - Vercel: Cold starts possible (~2 seconds)
  - Render: Cold starts possible (~10 seconds)
  - Auto-deploy on git push (no manual builds)
```

### 17.2 Functional Constraints

```
RAG:
  - Only works with text-based data
  - Images/videos can't be embedded directly
  - PDFs must be extractable to text
  - Requires proper chunking for good results

Community:
  - Manual verification bottleneck (placement staff)
  - Moderation needed (prevent spam)
  - Trust building takes time

Scaling:
  - UG expansion requires college partnerships
  - Marketing budget needed for user acquisition
  - International expansion needs localization
```

### 17.3 Business Constraints

```
Seasonality:
  - Placement season: June-September (peak)
  - Off-season: October-May (low usage)
  - Revenue concentrated in 4 months

Market:
  - B-schools: 50K students/year (small TAM)
  - UG expansion: Larger but needs different marketing
  - Competitive: InterviewBit, TopInterview exist

Timeline:
  - Only 8 weeks for MVP (tight)
  - No team (just you)
  - Day job/MBA coursework competing for time
```

### 17.4 How We Mitigate Constraints

```
Technical:
  - Use Claude Code to write code (faster than manual)
  - Supabase free tier is enough for MVP
  - Vibe coding reduces complexity

Functional:
  - Start with manual extraction (5-10 PDFs)
  - Small community = easier moderation
  - Placement cell partnership reduces manual work

Business:
  - Build MVP in off-season (June-Aug) for Sept launch
  - Focus deeply on one market first (B-school)
  - Expand to UG later (bigger TAM)
  - Bootstrap (no funding needed for MVP)
```

---

## 18. DECISION RATIONALE

### 18.1 Why Supabase Over Firebase?

```
Decision: Supabase (PostgreSQL + pgvector)
Rejected: Firebase (NoSQL)

Reason:
✓ pgvector: Essential for RAG similarity search
✓ PostgreSQL: Relational data (documents ↔ embeddings)
✓ Cost: Cheaper than Firebase + external vector DB
✓ Simplicity: One service, not multiple

Firebase has no vector database. We'd need Pinecone ($$) + Firebase.
Total cost: More expensive + more complex.
```

### 18.2 Why Claude API Over GPT-4?

```
Decision: Claude 3.5 Sonnet (Anthropic)
Rejected: GPT-4 (OpenAI)

Reason:
✓ Cost: 10x cheaper ($3 vs $30 per 1M tokens)
✓ Context: 200K tokens (fits entire cases)
✓ Instruction: Better at following RAG instructions
✓ Quality: Comparable for our use case

GPT-4 is more powerful but too expensive.
Claude is sufficient + costs 90% less.
```

### 18.3 Why RAG Over Fine-tuning?

```
Decision: RAG (Retrieval Augmented Generation)
Rejected: Fine-tuning Claude

Reason:
✓ Cost: $0.003 per 1M tokens (vs $3-5 for fine-tuning)
✓ Speed: Instant (no training time)
✓ Reversibility: Can update data anytime
✓ Scalability: Data grows without model retraining
✓ Learning curve: Easy to understand

Fine-tuning needed for behavioral changes (not our use case).
RAG is perfect for knowledge-based systems.
```

### 18.4 Why Manual PDF Extraction (MVP)?

```
Decision: Manual extraction for Week 1
Later: Automate in Week 5+

Reason:
✓ Speed: 5 PDFs in 2 hours (vs 3 hours writing script)
✓ Understanding: See data as you extract
✓ Quality: Manually verify quality
✓ Simplicity: No code to debug

Manual doesn't scale (100+ PDFs = 50 hours).
Automation makes sense AFTER MVP.
```

### 18.5 Why React + Node.js?

```
Decision: React + Node.js
Rejected: Next.js (fullstack), Vue, Angular

Reason:
✓ Separation: Frontend ↔ Backend clear boundary
✓ Learning: Can deploy independently
✓ Scaling: Easy to scale backend separately
✓ Jobs: Most common stack (you'll learn transferable skills)
✓ Tooling: Large ecosystem

Next.js could work but adds complexity.
Vibe coding works better with clear frontend/backend split.
```

### 18.6 Why Vercel + Render (Not Self-hosted)?

```
Decision: Vercel (frontend) + Render (backend)
Rejected: Self-hosted AWS/Google Cloud

Reason:
✓ Simplicity: Deploy = git push
✓ Cost: Free/cheap tier sufficient for MVP
✓ Uptime: 99.9%+ guaranteed
✓ Scaling: Auto-scales if needed
✓ DevOps: Zero DevOps knowledge needed

Self-hosted = more control but more complexity + cost.
Easier to focus on product, not infrastructure.
```

### 18.7 Why Community Verification Model?

```
Decision: Community votes + placement staff approval
Rejected: Expert curators only, Algorithmic validation only

Reason:
✓ Scalability: Community does most work
✓ Trust: Peer validation is powerful
✓ Growth: Incentivizes contribution
✓ Quality: 3-layer system catches bad data

Expert curators only = bottleneck, doesn't scale.
Algorithm only = can miss nuance, needs refinement.
Hybrid model = best of all worlds.
```

---

## APPENDIX A: GLOSSARY

```
RAG: Retrieval Augmented Generation (search DB, then answer)
pgvector: PostgreSQL extension for vector similarity search
JWT: JSON Web Token (for authentication)
CRUD: Create, Read, Update, Delete (basic database operations)
API: Application Programming Interface (backend ↔ frontend)
Embedding: Vector representation of text (1536-dimensional)
Chunk: Small piece of text (~200 tokens)
Hallucination: AI making up information (we prevent this with RAG)
Context window: Max tokens Claude can handle (200K for us)
TAM: Total Addressable Market (market size)
MRR: Monthly Recurring Revenue
Freemium: Free tier + paid premium tier
UG: Undergraduate students
PG: Postgraduate (MBA) students
Placement: Getting hired (job)
Mock: Practice interview
```

---

## APPENDIX B: QUICK REFERENCE

### Getting Started (This Week)
```bash
# 1. Create project folder
mkdir interview-mastery-hub
cd interview-mastery-hub

# 2. Initialize git
git init
git add .
git commit -m "Initial commit"

# 3. Create frontend
mkdir frontend
cd frontend
npx create-react-app .  # Or use Lovable

# 4. Create backend
cd ../backend
npm init -y
npm install express cors dotenv @supabase/supabase-js

# 5. Test
cd ../frontend
npm start  # Opens browser, should see React logo

cd ../backend
npm start  # Should run on localhost:3001
```

### When Stuck
```
1. Read the relevant section in this CONTEXT.md
2. Ask Claude Code: [specific question]
3. Claude Code generates code
4. Copy → Test → Iterate
```

### Deployment Checklist
```
[ ] Frontend: npm build → no errors
[ ] Backend: All endpoints tested
[ ] Database: All tables created, data seeded
[ ] Env vars: Set in Vercel + Render
[ ] GitHub: All code committed
[ ] Testing: No console errors
[ ] Security: No secrets in code
[ ] Ready: Deploy!
```

---

## FINAL NOTES

### For You (The Builder)
This document is your north star. When confused:
1. Find the relevant section
2. Read it
3. Ask Claude Code for help

You have everything you need. Build with confidence.

### For Other AI Agents
You have complete context of the project. When the owner asks for help:
1. Reference this document
2. Understand their constraints
3. Provide solutions that fit the architecture

No guessing. No wrong assumptions. Full context.

---

**This document was created on August 12, 2026**  
**Last updated: August 12, 2026**  
**Status: Ready for implementation**  
**Next review date: August 19, 2026**

---

**End of Context Document**
