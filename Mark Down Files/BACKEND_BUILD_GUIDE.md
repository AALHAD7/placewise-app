# BACKEND BUILD GUIDE
## Complete Step-by-Step Backend Development

**Status:** Pre-build (Week 1)  
**Approach:** Vibe coding with Claude Code  
**Timeline:** 40-50 hours over Weeks 1-4  
**Outcome:** Production-ready Express API

---

## TABLE OF CONTENTS

1. Backend Setup (Week 1)
2. Core Architecture Setup
3. Building API Endpoints (Week 2-3)
4. Testing Strategy
5. Debugging Common Issues
6. Database Integration
7. Claude API Integration
8. Deployment Ready Checklist

---

## PART 1: BACKEND SETUP (Week 1)

### Step 1.1: Create Backend Folder & Initialize

```bash
# In your project root
mkdir backend
cd backend

# Initialize Node.js project
npm init -y

# This creates package.json (empty Node.js project)
```

### Step 1.2: Install Core Dependencies

```bash
npm install express cors dotenv @supabase/supabase-js axios

# What each does:
# - express: Web framework (handles routes)
# - cors: Allow frontend to call backend
# - dotenv: Read .env file (secrets)
# - @supabase/supabase-js: Database client
# - axios: HTTP requests to Claude API
```

**Verify installation:**
```bash
# Should show version numbers (not errors)
npm list express
npm list axios
```

### Step 1.3: Create .env File

Create `backend/.env`:
```
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key-here

# Claude API
CLAUDE_API_KEY=your-claude-api-key-here

# Server config
PORT=3001
NODE_ENV=development

# Example with real values (don't commit this):
# SUPABASE_URL=https://abcdef123.supabase.co
# SUPABASE_KEY=eyJhbGciOiJIUzI1NiIs...
```

**IMPORTANT:** Add to `.gitignore`:
```
.env
.env.local
node_modules/
*.log
```

### Step 1.4: Create Basic Server File

Create `backend/src/server.js`:

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ 
    error: err.message,
    errorId: Date.now()
  });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV}`);
});
```

### Step 1.5: Test Your Server

```bash
# Start server
npm start

# Expected output:
# ✓ Server running on port 3001
# ✓ Environment: development

# In another terminal, test health endpoint
curl http://localhost:3001/health

# Expected response:
# {"status":"OK","timestamp":"2025-08-12T...","environment":"development"}
```

**If it works:**
- ✅ Server is running
- ✅ Port 3001 is open
- ✅ Express is working

**If "port already in use":**
```bash
# Kill process on port 3001
# Mac/Linux:
lsof -i :3001
kill -9 <PID>

# Windows:
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

---

## PART 2: CORE ARCHITECTURE SETUP

### Step 2.1: Create Folder Structure

```bash
cd backend
mkdir -p src/routes src/controllers src/services src/config src/middleware src/utils

# Result:
backend/
├── src/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── config/
│   ├── middleware/
│   ├── utils/
│   └── server.js
├── .env
├── package.json
└── .gitignore
```

### Step 2.2: Create Supabase Client

Create `backend/src/config/database.js`:

```javascript
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials in .env');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
```

**Test Supabase connection:**
```javascript
// Add to server.js to test
const supabase = require('./src/config/database');

app.get('/test-db', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (error) throw error;
    res.json({ success: true, message: 'DB connected' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Test: curl http://localhost:3001/test-db
```

### Step 2.3: Create Claude Client

Create `backend/src/config/claude.js`:

```javascript
const axios = require('axios');
require('dotenv').config();

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-3-5-sonnet-20241022';

if (!CLAUDE_API_KEY) {
  throw new Error('Missing CLAUDE_API_KEY in .env');
}

async function callClaude(systemPrompt, userMessage, maxTokens = 1000) {
  try {
    const response = await axios.post(
      CLAUDE_API_URL,
      {
        model: MODEL,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userMessage }
        ]
      },
      {
        headers: {
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        }
      }
    );

    return response.data.content[0].text;
  } catch (error) {
    console.error('Claude API Error:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = { callClaude };
```

**Test Claude connection:**
```javascript
// Add to server.js to test
const { callClaude } = require('./src/config/claude');

app.get('/test-claude', async (req, res) => {
  try {
    const response = await callClaude(
      'You are helpful assistant',
      'Say hello briefly'
    );
    res.json({ success: true, response });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Test: curl http://localhost:3001/test-claude
```

---

## PART 3: BUILDING API ENDPOINTS

### Step 3.1: Build First Endpoint: Resume Interrogation

**Ask Claude Code:**

```
"Create a complete Node.js/Express setup for resume interrogation endpoint.

Create two files:

1. backend/src/routes/resume.routes.js:
   - POST /interrogate endpoint
   - Import controller
   - Export router

2. backend/src/controllers/resumeController.js:
   - Function: interrogateResume(req, res)
   - Input: { resumeText, role, company }
   - Validation: Check required fields, return 400 if missing
   - Call claudeService.generateQuestions()
   - Return: { success: true, questions: [...], confidence: 0.95 }
   - Error handling: Catch errors, return 500 with message

Create proper error handling and console logging."
```

**Claude Code will generate something like:**

```javascript
// routes/resume.routes.js
const express = require('express');
const { interrogateResume } = require('../controllers/resumeController');

const router = express.Router();

router.post('/interrogate', interrogateResume);

module.exports = router;
```

```javascript
// controllers/resumeController.js
const resumeService = require('../services/resumeService');

const interrogateResume = async (req, res) => {
  try {
    const { resumeText, role, company } = req.body;

    // Validation
    if (!resumeText || !role) {
      return res.status(400).json({ 
        error: 'resumeText and role are required' 
      });
    }

    // Call service
    const result = await resumeService.generateQuestions({
      resumeText,
      role,
      company
    });

    res.json({
      success: true,
      questions: result.questions,
      confidence: result.confidence
    });
  } catch (error) {
    console.error('Resume interrogation error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

module.exports = { interrogateResume };
```

### Step 3.2: Create Service Layer

**Ask Claude Code:**

```
"Create backend/src/services/resumeService.js that:

Export function: generateQuestions({ resumeText, role, company })

Logic:
1. Build system prompt for Claude (expert recruiter)
2. Build user message with resume + role + company
3. Call claudeService.callClaude() with prompts
4. Parse Claude response into questions array
5. Each question has: id, text, framework, difficulty, sampleAnswer
6. Return: { questions: [...], confidence: 0.95 }
7. Add error handling

Require:
- const { callClaude } = require('../config/claude');
- const ragService = require('./ragService');"
```

Claude will generate something like:

```javascript
// services/resumeService.js
const { callClaude } = require('../config/claude');
const ragService = require('./ragService');

const generateQuestions = async ({ resumeText, role, company }) => {
  try {
    // Get context from RAG
    const context = await ragService.retrieveContext({
      query: resumeText,
      role,
      company,
      topK: 5
    });

    // Build prompt
    const systemPrompt = `You are an expert recruiter specializing in ${role} interviews.
    Generate realistic interview questions based on the candidate's resume and context.
    Return as JSON array with: id, question, framework, difficulty (1-3), sampleAnswer`;

    const userMessage = `
      Resume: ${resumeText}
      Role: ${role}
      Company: ${company}
      
      Context from similar interviews:
      ${context.cases.map(c => c.text).join('\n')}
      
      Generate 15 interview questions.`;

    // Call Claude
    const response = await callClaude(systemPrompt, userMessage, 2000);
    const questions = JSON.parse(response);

    return {
      questions,
      confidence: 0.95,
      sourceCount: context.cases.length
    };
  } catch (error) {
    console.error('Resume service error:', error);
    throw error;
  }
};

module.exports = { generateQuestions };
```

### Step 3.3: Connect Route to Server

Update `backend/src/server.js`:

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const resumeRoutes = require('./src/routes/resume.routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/resume', resumeRoutes);

// Health
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✓ Server on port ${PORT}`);
});
```

### Step 3.4: Test Endpoint with curl

```bash
# Start server first
npm start

# In another terminal, test endpoint
curl -X POST http://localhost:3001/api/resume/interrogate \
  -H "Content-Type: application/json" \
  -d '{
    "resumeText": "Senior engineer at Google for 5 years. Led ML team.",
    "role": "Product",
    "company": "Razorpay"
  }'

# Expected response:
# {"success":true,"questions":[{"id":"q-1","question":"...","difficulty":2},...]}
```

**If successful:**
- ✅ Endpoint is working
- ✅ Claude API is connected
- ✅ Response is formatted correctly

**If error:**
- Check `.env` file has correct API keys
- Check Claude API key is valid
- Look at console for error message
- Show error to Claude Code, it will fix

---

## PART 4: BUILD REMAINING ENDPOINTS

### Step 4.1: Story Generation Endpoint

**Week 2, Day 15-16**

```
Ask Claude Code:
"Create complete story generation endpoint:

Files:
1. backend/src/routes/story.routes.js
2. backend/src/controllers/storyController.js
3. backend/src/services/storyService.js

Endpoint: POST /api/story/generate
Input: { resume, role, company, focusAreas }
Output: { success, narratives: [{id, title, story, strength}] }

Logic:
- Parse resume into experiences
- Call Claude to build 3-4 narrative options
- Each narrative tells a cohesive story
- Include strength score (0-1)
- Return array of narratives"
```

### Step 4.2: Tone Shifter Endpoint

**Week 2, Day 19-20**

```
Ask Claude Code:
"Create tone shifter endpoint:

Endpoint: POST /api/tone/shift
Input: { text, tones: ['professional', 'story-driven', ...] }
Output: { success, variations: [{tone, text}] }

Logic:
- For each tone, call Claude
- Rewrite text in that tone
- Keep meaning, change style
- Return all variations"
```

### Step 4.3: Mock Interview Endpoints

**Week 3, Day 22-23**

```
Ask Claude Code:
"Create mock interview endpoints:

1. POST /api/mock-interview/start
   Input: { company, role, difficulty }
   Output: { sessionId, question, difficulty, timeLimit }
   Logic: Generate first interview question

2. POST /api/mock-interview/answer
   Input: { sessionId, userAnswer, timeSpent }
   Output: { feedback: {score, strengths, improvements, followUp} }
   Logic: 
   - Evaluate answer with Claude
   - Provide feedback
   - Generate follow-up question
   - Return everything"
```

### Step 4.4: Company Intel Endpoint

**Week 3, Day 24-25**

```
Ask Claude Code:
"Create company intel endpoint:

Endpoint: GET /api/companies/:companyName
Output: {
  company: {
    name, industry, culture, hiringBar,
    commonQuestions: [{role, question}],
    avgSalary, benefitsHighlight
  }
}

Logic:
- Query Supabase for company data
- Query for common interview questions
- Return formatted company intel"
```

---

## PART 5: TESTING STRATEGY

### 5.1: Manual Testing (Using curl)

**Test Resume Interrogation:**
```bash
curl -X POST http://localhost:3001/api/resume/interrogate \
  -H "Content-Type: application/json" \
  -d '{
    "resumeText": "Worked on product strategy at Amazon",
    "role": "Product",
    "company": "Razorpay"
  }'
```

**Test Story Generation:**
```bash
curl -X POST http://localhost:3001/api/story/generate \
  -H "Content-Type: application/json" \
  -d '{
    "resume": "Worked on analytics at Google...",
    "role": "Product",
    "company": "Razorpay"
  }'
```

**Test Health Check:**
```bash
curl http://localhost:3001/health
```

### 5.2: Using Postman (Optional)

```
1. Download Postman (free)
2. Create new request
3. Method: POST
4. URL: http://localhost:3001/api/resume/interrogate
5. Headers: Content-Type: application/json
6. Body (raw): Copy-paste JSON from above
7. Send
8. See response
```

### 5.3: What to Test

**For each endpoint, verify:**

```
✓ 200 OK response (endpoint works)
✓ Response has "success": true
✓ Response data is correct format
✓ Missing required fields → 400 error
✓ Invalid input → 400 error
✓ Claude API down → 500 error (handled gracefully)
✓ Response time < 3 seconds
```

**Test checklist:**
```bash
# Resume endpoint
[ ] Valid input → 200 OK
[ ] Missing resumeText → 400 error
[ ] Missing role → 400 error
[ ] Response has questions array
[ ] Each question has id, text, difficulty

# Story endpoint
[ ] Valid input → 200 OK
[ ] Response has narratives array
[ ] Each narrative has id, title, story, strength

# Tone shifter
[ ] Valid input → 200 OK
[ ] Response has variations array
[ ] Each variation has tone, text

# Mock interview
[ ] Start → 200 OK with sessionId + question
[ ] Answer with valid sessionId → 200 OK
[ ] Answer with invalid sessionId → 400 error

# Company intel
[ ] Valid company → 200 OK with data
[ ] Invalid company → 404 or empty
```

---

## PART 6: DEBUGGING COMMON ISSUES

### Issue 1: "CLAUDE_API_KEY undefined"

**Problem:** API key not loaded

**Solution:**
```bash
# Check .env file exists
ls -la backend/.env

# Check it has the key
cat backend/.env | grep CLAUDE_API_KEY

# If empty, add it:
echo "CLAUDE_API_KEY=your-key-here" >> backend/.env

# Restart server
npm start
```

### Issue 2: "Cannot POST /api/resume/interrogate"

**Problem:** Route not connected

**Solution:**
```javascript
// Check in server.js you have:
const resumeRoutes = require('./src/routes/resume.routes');
app.use('/api/resume', resumeRoutes);

// Without this, route doesn't exist
// Make sure it's BEFORE error handler
```

### Issue 3: "ReferenceError: supabase is not defined"

**Problem:** Database not imported

**Solution:**
```javascript
// Add to top of file:
const supabase = require('../config/database');

// Then use:
const { data, error } = await supabase.from('users').select('*');
```

### Issue 4: "Request timeout (>3 seconds)"

**Problem:** Claude API is slow

**Solution:**
```javascript
// Increase timeout in axios call
const response = await axios.post(url, data, {
  timeout: 30000, // 30 seconds instead of default 10
  headers: { ... }
});

// Or make async call in background
// Return response immediately, process in background
```

### Issue 5: "CORS error from frontend"

**Problem:** Frontend can't call backend

**Solution:**
```javascript
// In server.js:
app.use(cors({
  origin: ['http://localhost:3000', 'https://your-domain.com'],
  credentials: true
}));

// Or allow all (only for development):
app.use(cors());
```

### Issue 6: "JSON.parse error"

**Problem:** Claude response isn't valid JSON

**Solution:**
```javascript
try {
  const parsed = JSON.parse(claudeResponse);
  // Use parsed
} catch (e) {
  console.error('Claude returned invalid JSON:', claudeResponse);
  // Handle gracefully - return error or empty array
  return { questions: [], confidence: 0 };
}
```

### Debugging Command

```bash
# See full error with stack trace
NODE_ENV=development npm start

# Add logging to see what's happening
# In your code:
console.log('Request received:', req.body);
console.log('Claude response:', response);
console.log('Error:', error);

# Check these logs in terminal where server is running
```

---

## PART 7: DATABASE INTEGRATION

### 7.1: Create Database Tables (Supabase)

Go to Supabase Dashboard → SQL Editor → New Query → Paste:

```sql
-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  type VARCHAR,
  category VARCHAR,
  file_url VARCHAR,
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Document chunks (for RAG)
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  chunk_index INT,
  page_number INT
);

-- Embeddings (vectors for RAG)
CREATE TABLE IF NOT EXISTS chunk_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chunk_id UUID REFERENCES document_chunks(id) ON DELETE CASCADE,
  embedding vector(1536)
);

-- Companies
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR UNIQUE NOT NULL,
  industry VARCHAR,
  website VARCHAR
);

-- Interview Q&As
CREATE TABLE IF NOT EXISTS company_interview_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  role_title VARCHAR,
  question TEXT NOT NULL,
  difficulty SMALLINT
);

-- Create indexes
CREATE INDEX idx_chunk_embeddings ON chunk_embeddings USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_companies_name ON companies(name);
```

### 7.2: Query Database in Backend

```javascript
// Get company data
async function getCompanyIntel(companyName) {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('name', companyName)
    .single();  // Get one result
  
  if (error) throw error;
  return data;
}

// Get company questions
async function getCompanyQuestions(companyId) {
  const { data, error } = await supabase
    .from('company_interview_questions')
    .select('*')
    .eq('company_id', companyId);
  
  if (error) throw error;
  return data;
}
```

### 7.3: Seed Initial Data

```javascript
// Create seed script: backend/scripts/seed.js

const supabase = require('../src/config/database');

async function seed() {
  // Add companies
  const { error: companyError } = await supabase
    .from('companies')
    .insert([
      { name: 'Razorpay', industry: 'fintech' },
      { name: 'Juspay', industry: 'fintech' },
      { name: 'PhonePe', industry: 'fintech' }
    ]);

  if (companyError) console.error('Company seed error:', companyError);
  else console.log('✓ Companies seeded');
}

seed().then(() => process.exit(0));
```

Run:
```bash
node backend/scripts/seed.js
# ✓ Companies seeded
```

---

## PART 8: DEPLOYMENT READY CHECKLIST

### 8.1 Before Deploying to Production

**Code Quality:**
```
[ ] No console.error() calls for normal operations
[ ] All API responses are JSON (no HTML errors)
[ ] Error handling on every endpoint
[ ] Environment variables used (no hardcoded values)
[ ] No API keys in GitHub
```

**Testing:**
```
[ ] All endpoints tested with curl
[ ] Each endpoint returns 200 on valid input
[ ] Each endpoint returns 400 on invalid input
[ ] Each endpoint returns 500 on server error
[ ] Response times < 3 seconds
[ ] No infinite loops or memory leaks
```

**Security:**
```
[ ] CORS configured correctly
[ ] Input validation on all endpoints
[ ] No SQL injection possible (using Supabase)
[ ] API keys not exposed
[ ] Environment variables set in Render
```

**Database:**
```
[ ] All tables created in Supabase
[ ] Indexes created for performance
[ ] Initial data seeded
[ ] Backups enabled
```

**Deployment Setup:**
```
[ ] Render account created
[ ] GitHub repo connected
[ ] Environment variables set in Render
[ ] Package.json has "start" script: "node src/server.js"
```

### 8.2 Deploy to Render

```
Step 1: Push to GitHub
  cd backend
  git add .
  git commit -m "Backend ready for deployment"
  git push origin main

Step 2: Create Render Service
  Go to Render.com
  Click "New +" → "Web Service"
  Connect GitHub → Select your repo
  Select branch: main

Step 3: Configure
  Settings → Environment
  Add:
    SUPABASE_URL = https://...
    SUPABASE_KEY = sk-...
    CLAUDE_API_KEY = sk-ant-...
    NODE_ENV = production

Step 4: Deploy
  Click "Deploy"
  Wait ~2-3 minutes
  Should see "Your service is live!"

Step 5: Test
  curl https://your-app.onrender.com/health
  Should return: {"status":"OK"}
```

### 8.3 After Deployment

```bash
# Test production endpoint
curl -X POST https://your-app.onrender.com/api/resume/interrogate \
  -H "Content-Type: application/json" \
  -d '{"resumeText": "...", "role": "Product"}'

# Monitor logs
# In Render dashboard → Logs tab
# Watch for errors in real-time
```

---

## TIMELINE: BUILD BACKEND IN 40-50 HOURS

```
WEEK 1 (10 hours):
  Day 1-2: Setup (folder, npm, .env)
  Day 3-4: Supabase client + Claude client
  Day 5-6: First endpoint (resume interrogation)
  Day 7: Test everything locally
  Deliverable: Resume endpoint works

WEEK 2 (12 hours):
  Day 8-9: Story generation endpoint
  Day 10-11: Tone shifter endpoint
  Day 12-13: Integration testing
  Day 14: Fix bugs from testing
  Deliverable: 3 endpoints working

WEEK 3 (12 hours):
  Day 15-16: Mock interview start/answer
  Day 17-18: Company intel endpoint
  Day 19-20: Frameworks endpoint
  Day 21: All endpoints tested
  Deliverable: All core endpoints working

WEEK 4 (6 hours):
  Day 22-25: Polish + optimization
  Day 26-27: Set up Render deployment
  Day 28: Deploy to production
  Deliverable: Live backend on Render
```

---

## SUCCESS CRITERIA

Your backend is successfully built when:

```
✓ All 8+ endpoints built and tested
✓ Each endpoint returns proper JSON
✓ Error handling on all endpoints
✓ Supabase connected and queryable
✓ Claude API integrated and working
✓ No console errors on normal operation
✓ Response times < 3 seconds
✓ Deployed to Render and accessible
✓ Production environment variables set
✓ Can handle 10 concurrent requests
✓ Clear error messages for failures
```

---

## SUMMARY: YOUR EXACT PATH TO BACKEND SUCCESS

### Week 1: Foundation
```
1. Setup folder + npm install
2. Create .env with API keys
3. Create basic Express server
4. Create Supabase client
5. Create Claude client
6. Build 1st endpoint (resume)
7. Test with curl
8. Deploy to staging
```

### Week 2-3: Core Features
```
1. Build story endpoint
2. Build tone endpoint
3. Build mock interview endpoints
4. Build company intel endpoint
5. Build frameworks endpoint
6. Test each thoroughly
7. Fix bugs from testing
```

### Week 4: Polish + Deploy
```
1. Final testing
2. Performance optimization
3. Set up Render
4. Deploy to production
5. Monitor in real-time
6. Fix any production issues
```

---

## WHAT'S NEXT

1. **This Week:** Follow Step 1.1-1.5 (setup)
2. **If stuck:** Reference debugging section
3. **Ask Claude Code:** "Based on the context, build [endpoint]"
4. **Test with curl:** Verify each endpoint works
5. **Deploy:** Follow deployment checklist

**You now have a complete backend build plan.**

**Ready to start? Begin with Step 1.1: Create Backend Folder** 🚀
