# COMMUNITY DATA CONTRIBUTION STRATEGY
## How to Build a Self-Improving Knowledge Base Without Fine-Tuning

**Version:** 1.0  
**Context:** IMH (Interview Mastery Hub) — placement prep platform  
**Goal:** Grow knowledge base from 500 initial resources (case books, handbooks) to 10,000+ Q&As via community contribution

---

## TABLE OF CONTENTS

1. Why Community Data Matters
2. Three-Layer Verification System
3. Community Contribution Types
4. Incentive Structure
5. From Contribution to RAG Knowledge Base
6. Fine-Tuning: When, Why, How
7. Scaling the Community
8. Technical Implementation
9. Monitoring & Iteration

---

## 1. WHY COMMUNITY DATA MATTERS

### The Knowledge Problem

**Your initial data:**
- Case books from B-schools: 50-100 real cases
- Interview handbooks: Basic frameworks
- Published consulting frameworks: Generic knowledge
- **Total:** ~300-500 resources

**What's missing:**
- Company-specific interview Q&As (Razorpay asks X, Juspay asks Y)
- Recent questions (last year's interviews)
- Verified accuracy (is this information true?)
- Diverse perspectives (multiple ways to solve the same problem)

**How community solves this:**
```
Your initial 500 resources
        ↓
Students contribute 2,000 Q&As (1st semester)
        ↓
Students contribute 3,000 more cases/frameworks (2nd semester)
        ↓
By year 2: 10,000+ verified, community-curated resources
        ↓
Every Claude API call has access to massively more data
        ↓
Better, more accurate responses
```

### Exponential Growth Model

```
Semester 1: 500 initial + 2,000 community = 2,500 total
Semester 2: 2,500 + 3,000 new = 5,500 total
Semester 3: 5,500 + 4,000 new = 9,500 total
Semester 4: 9,500 + 5,000 new = 14,500 total

Growth rate: Each semester, new contributions exceed existing base
Why? Incentives kick in. Users see value. Network effects.
```

### Why This Matters for Your Interview Story

**In 6 months, you can say:**
> "Started with 500 resources. Through community contribution + verification system, grew to 5,000+. Every contribution is verified by placement staff. No hallucination. Students used this to prep for real interviews."

**That's a powerful narrative.**

---

## 2. THREE-LAYER VERIFICATION SYSTEM

### Layer 1: Automated Pre-validation (Instant)

**What it does:** Catches obvious problems before community sees the submission

**Checks:**
```
✓ No PII (Personal Identifiable Information)
  ├─ Phone numbers (10 digits)
  ├─ Email addresses
  ├─ SSNs, IDs
  └─ Names (if company name, allowed; if person name, flag)

✓ No copyrighted content
  ├─ Check against known case book titles
  ├─ Flag if 80%+ match with published content
  └─ Reason: Protect IP; cite original sources instead

✓ Valid structure
  ├─ For interview Q&A: needs question + (optional) answer angle
  ├─ For case study: needs brief + (optional) solution
  ├─ For framework: needs name + description
  └─ Minimum 50 characters (prevent spam)

✓ Valid metadata
  ├─ Role: must be in your system (PM, Ops, Consulting, etc.)
  ├─ Company: must exist in your database (or allow new entries)
  └─ Difficulty: 1-3 scale

✓ Appropriate content
  ├─ No hate speech, profanity, harassment
  ├─ No sexual content
  ├─ No misinformation / conspiracy theories
  └─ (Use simple keyword filter + manual review flag)

✓ Rate limiting
  ├─ Max 5 submissions per day per user (prevent spam)
  ├─ Cooldown: Can't submit identical Q&A twice
  └─ Reason: Prevent abuse, ensure quality
```

**If validation fails:**
- User gets clear feedback: "Your Q&A needs a valid company. Did you mean Razorpay?"
- Submit form with prefilled fields (easier to fix)

**If validation passes:**
- → Auto-move to Layer 2 (Community Voting)

---

### Layer 2: Community Voting (7 Days)

**What it does:** Other students verify accuracy of submissions

**How it works:**

```
Contribution sits in "pending" status for 7 days
Community members can:

1. Endorse: "I interviewed here too, this is accurate!"
   ├─ Message: "Why are you endorsing?"
   │   └─ Options: "I interviewed here" | "I know this is accurate" | "General agreement"
   ├─ Shows endorser name (builds reputation)
   └─ Creates accountability (can't fake votes easily)

2. Flag: "This doesn't seem right"
   ├─ Message: "Why are you flagging?"
   │   └─ Options: "This question is inaccurate" | "Wrong company" | "Spam" | "Other"
   ├─ Detailed comment (what's wrong?)
   └─ Flagged content goes to Layer 3 (human review)

Voting rules:
- Each user can vote once per contribution (can't spam votes)
- Voting requires account age > 1 week (prevent throwaway accounts)
- Endorsements weighted by user reputation (if user has 10 verified contributions, vote = more weight)
```

**Auto-approval threshold:**
```
IF votes >= 5 AND flags == 0 
  THEN auto_approve()
ELSE IF votes >= 3 AND flags <= 1
  THEN send_for_human_review()
ELSE IF flags >= 3
  THEN automatic_rejection()
ELSE
  THEN expiration_after_7_days()
```

**Example timelines:**

```
Scenario 1: "How would you measure retention at Razorpay?"
Day 1: Submitted by Aarav
Day 2: 3 endorsements ("I interviewed here!")
Day 5: 8 endorsements, 0 flags
→ Auto-approved. Added to knowledge base.

Scenario 2: "Why is payment flow important?"
Day 1: Submitted by Priya (weak question)
Day 3: 1 endorsement, 2 flags ("Not specific enough", "Too generic")
→ Sent for human review. Placement staff evaluates.

Scenario 3: "What's the answer to this random question?"
Day 1: Submitted by random account
Day 7: 0 endorsements, 0 flags
→ Auto-rejected. Reason: "Insufficient community validation"
```

**Benefits of this layer:**
- Real students verify accuracy (not just automation)
- Creates network effects (students want to contribute to get reputation)
- Transparent process (users see exactly why something was approved/rejected)

---

### Layer 3: Human Verification (By Placement Staff)

**What it does:** Final quality gate. Placement cell staff review flagged or borderline content.

**Who does this:**
- Placement cell director (1-2 hours/week)
- Or senior students with placement cell role

**Dashboard:**
```
Pending Review Queue
├─ 12 flagged contributions
│  ├─ "How to optimize costs" - 2 endorsements, 3 flags
│  ├─ "What's your favorite product?" - 1 endorsement, 2 flags (spam)
│  └─ [10 more...]
└─ 3 borderline (3 endorsements, 1 flag)

One-click actions:
├─ Approve ✓
├─ Reject ✗
├─ Request revision ("Please make this more specific")
└─ Add notes ("Confirmed by 3 students in 2024 interviews")
```

**Approval criteria:**
```
✓ Accurate (fact-checked against Glassdoor, public sources)
✓ Useful (applicable to real interview prep)
✓ Original (not copied from case books)
✓ Appropriate (no PII, no inappropriate content)
✗ Vague (too generic to be useful)
✗ Duplicate (already have similar Q&A)
✗ Controversial (disputed accuracy, contradicting sources)
```

**Approval types:**
```
1. Auto-approve (5+ votes, 0 flags)
   └─ Straight into knowledge base
   
2. Placement staff approve (borderline)
   ├─ Check accuracy
   ├─ Add verification note: "Confirmed by X source"
   └─ Straight into knowledge base
   
3. Placement staff reject (flagged)
   ├─ Send rejection reason to contributor
   ├─ Offer chance to revise
   └─ Keep in "rejected" status (don't delete)
```

---

## 3. COMMUNITY CONTRIBUTION TYPES

### Type 1: Interview Q&As (MOST VALUABLE)

**Form fields:**
```
Company: [Dropdown: Razorpay, Juspay, PhonePe, ...]
Role: [Dropdown: PM, Ops, Consulting, Marketing, ...]
Difficulty: [1-3 scale]
Question: [Text field - the actual question asked]
Framework applicable: [Multi-select: MECE, Jobs-to-be-Done, ...]
Sample answer direction: [Optional - how to approach it, not full answer]
Any follow-ups?: [Optional - what did they ask next?]
```

**Why valuable:**
- Direct from real interviews
- Highly specific (company + role)
- Verifiable by peers ("I interviewed there too")
- Immediately useful for prep

**Example:**
```
Company: Razorpay
Role: PM
Difficulty: 2 (Medium)
Question: "How would you reduce payment failure rates? Walk me through your approach."
Framework: Root Cause Analysis, Metrics Rigor
Sample answer: "I'd start by defining what 'failure' means. Is it a decline, timeout, or API error? Then segment by merchant, geography, payment method to see patterns."
Follow-ups: "What would you measure?" "What's your hypothesis for the root cause?"
```

**Verification:**
- Other students who interviewed: "I got this exact question!"
- Placement staff: Cross-check against Glassdoor + 2-3 interview reports

---

### Type 2: Case Studies

**Form fields:**
```
Case title: [Free text]
Brief: [The problem statement]
Your solution approach: [How you tackled it]
Frameworks you used: [Multi-select]
Key insights: [What's the learning?]
Difficulty: [1-3]
Industry: [Fintech, Consulting, Retail, ...]
Source: [Did this come from a competition? Which one?]
```

**Why valuable:**
- Real examples of structured thinking
- Shows multiple ways to solve same problem
- Community can improve ("Here's another approach")
- High effort to submit (quality signal)

**Example:**
```
Title: "Optimize operations at a payment processing company"
Brief: "A fintech has declining unit economics. Transaction volume is 10K/day, margins are 2%. Operational costs are 30% of revenue. Where would you focus?"
My solution: "I broke down costs (MECE): infrastructure, customer support, regulatory compliance. Found that support was 40% of costs. Dug into why, found lots of declined transactions that required manual review. Recommended automated review logic. Projected 15% cost reduction."
Frameworks: MECE thinking, cost structure analysis, root cause analysis
Key insight: "Sometimes the problem is hidden in one cost category. Worth drilling deep."
```

**Verification:**
- Did this case actually exist? (from case competition, interview, coursework)
- Is the solution reasonable? (can placement staff / senior faculty evaluate)

---

### Type 3: Custom Frameworks & Methodologies

**Form fields:**
```
Framework name: [E.g., "RAZR framework for growth at payments startups"]
Description: [What is it and when to use it]
Steps/components: [How to apply it]
Example application: [Show it working on a real case]
When to use: [When is this useful?]
```

**Why valuable:**
- Diverse thinking styles
- Frameworks tailored to specific companies/industries
- Shows pattern recognition

**Example:**
```
Framework: "MARGINS approach for fintech profitability"
Description: "Specific framework for analyzing fintech business models"
Components:
  M - Merchants (who are the customers?)
  A - Acquisition (how do we get them?)
  R - Retention (how do we keep them?)
  G - Growth (expansion opportunities?)
  I - Infrastructure (tech, compliance, operations)
  N - Network (effects, two-sided dynamics)
  S - Sustainability (unit economics, competitive moat)
Example: Applied to Razorpay - "M: MSMEs, A: partnerships + direct sales, R: feature set + customer support, G: UPI expansion + APIs, I: payment processing + settlement, N: strong merchant-payment gateway network, S: transaction fee model"
When to use: Analyzing any fintech payment company
```

**Verification:**
- Is the framework logical and useful?
- Can others apply it to different companies?
- Placement staff + community review

---

### Type 4: Company Insights & Research

**Form fields:**
```
Company: [Dropdown]
Category: [Culture | Hiring signals | Compensation | Growth | Other]
Insight: [What did you learn?]
Source: [LinkedIn, Glassdoor, Interview, Public news, Personal experience]
Evidence: [Link or quote supporting the claim]
```

**Why valuable:**
- Patterns that students notice
- Real interview experiences aggregated
- Helps with company targeting

**Example:**
```
Company: Razorpay
Category: Hiring signals
Insight: "Razorpay values people who've worked at scale (Series B+ startups). They emphasize growth-focused thinking, not just technical depth."
Source: Multiple interviews + LinkedIn alumni data
Evidence: "Out of recent hires for PM, 80% came from fintech/payments + growth roles"
```

**Verification:**
- Is this verifiable? (check LinkedIn, Glassdoor)
- Is it free from bias? (not just based on one person's experience)
- Does placement staff confirm?

---

## 4. INCENTIVE STRUCTURE

### Why Incentivize?

Without incentives:
- First month: 10-20 contributions
- Second month: 2-5 contributions (novelty wore off)
- Third month: 0 contributions

With incentives:
- First month: 20-50 contributions
- Second month: 50-150 (network effect kicks in)
- Third month: 100-300 (leaderboard drives competition)

### The Reward Ladder

| Achievement | Reward | Why |
|---|---|---|
| 1st verified interview Q&A | 3 months free premium (₹300 value) | "Thank you" reward |
| 2nd verified Q&A | 2 months free | Compound reward |
| 3rd+ verified Q&A (each) | 1 month free | Diminishing returns, but still motivating |
| 1st verified case study | 2 months free | Higher effort |
| 1st featured framework | 1 month free + "Framework Creator" badge | Rare achievement |
| Top contributor (month) | 2 months free + featured on homepage | Public recognition |
| Top contributor (semester) | Lifetime free access + job board priority | Major achievement |

### How It Works Technically

```javascript
// When contribution is verified by placement staff
const rewardContribution = async (contributionId) => {
  const contribution = await getContribution(contributionId);
  const user = await getUser(contribution.userId);
  
  // Determine reward based on type + user's contribution count
  const rewards = {
    interview_qa: getRewardMonths(user.qaCount), // 3, 2, 1 months
    case_study: getRewardMonths(user.caseCount) + 1, // 2, 1.5, 1 months
    framework: 1 + getBadge('framework_creator')
  };
  
  // Credit user's account
  user.premiumExpiry = addMonths(user.premiumExpiry, rewards.months);
  
  // Update leaderboard
  incrementLeaderboardScore(user.id, contribution.type);
  
  // Send notification
  notifyUser(user.email, `Your contribution was verified! You've earned ${rewards.months} months free premium.`);
};
```

### Leaderboard (Public)

**Monthly Leaderboard:**
```
Rank | User | Contributions | Total Impact | Status
1    | Aarav | 8 Q&As, 2 cases | Used 200 times | Gold Badge
2    | Priya | 6 Q&As, 1 case | Used 150 times | Silver Badge
3    | Karan | 4 Q&As | Used 80 times | Bronze Badge
4    | Maya | 3 Q&As, 2 frameworks | Used 60 times | -
5    | Rohit | 2 Q&As | Used 35 times | -
```

**How "Impact" is measured:**
- Every time someone uses your contributed Q&A in prep (via RAG retrieval)
- Every time someone references your framework
- Every time someone studies your case solution
- Aggregated: "Your Q&A has been used 50 times"

### Psychological Incentives

**Beyond free months:**

1. **Public recognition**
   - Featured on homepage: "Aarav's top Q&A this month"
   - Badge system (bronze, silver, gold)
   - "Top Contributor" role in community

2. **Reputation**
   - Build credibility as an expert
   - "Aarav has 20 verified contributions"
   - Other students trust your submissions

3. **Career signal**
   - Show this on your resume: "Contributed 20+ verified interview prep resources used by 500+ students"
   - Tell it in interviews: "I saw a gap in placement prep, contributed community knowledge, helped my peers"

4. **Intrinsic motivation**
   - "My Q&A helped 50 students prep"
   - "I'm giving back to my batch"
   - Altruism matters

---

## 5. FROM CONTRIBUTION TO RAG KNOWLEDGE BASE

### The Data Pipeline

```
Step 1: Submission
  └─ Student: "I have an interview Q&A for Razorpay PM"
  └─ Form captures: question, company, role, frameworks

Step 2: Validation (Automated)
  └─ System: Check PII, format, copyrighted content
  └─ Status: "pending" or "rejected"

Step 3: Community Voting (7 days)
  └─ Other students: "I interviewed here too!" (+1 vote)
  └─ Threshold: 5+ votes → auto-approve
  └─ Status: "community_voted" or "sent_for_review"

Step 4: Human Verification
  └─ Placement staff: Approve or reject
  └─ Status: "verified" or "rejected"

Step 5: Insert into Database
  └─ INSERT INTO company_interview_questions (...) VALUES (...)
  └─ Add metadata: contributor, verification date, source

Step 6: Generate Embedding
  └─ Convert text to vector (using Claude embeddings API)
  └─ INSERT INTO embeddings table
  └─ This makes it searchable via RAG

Step 7: Available in RAG
  └─ Next Claude API call can retrieve this Q&A
  └─ If student prepping for Razorpay PM, this Q&A shows up

Step 8: Track Usage
  └─ Every time it's used: contribution_usage.usage_count += 1
  └─ Display to contributor: "Your Q&A has been used 50 times"
  └─ Update leaderboard with impact
```

### Example: Full Workflow

**Tuesday, 2:30 PM**
```
Aarav: "I just finished my Razorpay PM interview. Submitting my Q&A."
Upload form:
- Question: "How would you reduce payment failure rates?"
- Company: Razorpay
- Role: PM
- Difficulty: 2
- Sample answer: "I'd define failure first..."

Automated check:
✓ No PII
✓ Valid structure
✓ Razorpay is in database
Status: "pending" → visible to community
```

**Tuesday, 3:15 PM**
```
Priya (also interviewed at Razorpay): 
Click "I interviewed here too!"
Message: "Got this exact question, Aarav's sample answer is solid."
Vote: +1 endorsement
```

**Wednesday, 10 AM**
```
Karan (interviewed 6 months ago):
Click "I interviewed here too!"
Vote: +1 endorsement
```

**Thursday, 2 PM**
```
Maya (3 more endorsements arrive)
Total: 5 endorsements, 0 flags
System: Auto-approve!
Status: "verified"

INSERT INTO company_interview_questions:
- question_id: UUID
- company_id: razorpay.id
- question: "How would you reduce payment failure rates?"
- difficulty: 2
- submitted_by: aarav.id
- verified_by: system (auto-approval)
- verification_date: Thursday 2 PM

Generate embedding:
- embedding = claudeAPI.embeddings("How would you reduce payment failure rates?")
- INSERT INTO embeddings (source_id: question_id, embedding: [...], source_type: 'company_interview_questions')

Notify Aarav:
✓ Your Q&A was verified!
✓ You've earned 3 months free premium
✓ Leaderboard rank: #23

Database status:
- Now searchable via RAG
- Available in Claude prompts
```

**Friday**
```
New student: "Help me prep for Razorpay PM interview"
Backend RAG retrieval:
  SELECT * FROM embeddings
  WHERE source_type = 'company_interview_questions'
  AND company = 'razorpay'
  AND role = 'PM'
  ORDER BY similarity DESC
  LIMIT 5

Returns:
1. Aarav's Q&A: "How would you reduce payment failure rates?"
2. Priya's Q&A: "What metrics define payment health?"
3. Karan's Q&A: "How would you prioritize between merchant and customer satisfaction?"
4. [...] 2 more

Claude receives:
System: "You are an interview coach."
Context: [All 5 Q&As from above]
User: "Help me prepare for my Razorpay PM interview"

Claude generates:
"Based on real Razorpay interviews, PMs are asked about... [references all 5 Q&As]"

Student gets grounded, accurate prep
Aarav gets notification: "Your Q&A was used in a prep session!"
```

**Month-end**
```
Leaderboard update (automated):
Aarav's Q&A: Used 47 times
Leaderboard score: +47 points
Rank: #12 (up from #23)
```

---

## 6. FINE-TUNING: WHEN, WHY, HOW

### The Case Against Early Fine-Tuning

**Cost:**
- Claude fine-tuning: $3-5 per 1M tokens
- vs Claude API: $0.003-0.01 per 1M tokens
- **100x more expensive**

**Time:**
- Fine-tuning: 2-4 hours to complete
- vs RAG: Instant retrieval
- **Every update requires retraining**

**Quality:**
- Fine-tuning: Takes 10,000+ examples to see measurable improvement
- You won't have 10,000 high-quality examples until semester 3-4
- RAG: Works well with even 500 examples

**Rollback:**
- If fine-tuned model performs worse: Hard to rollback
- If RAG has bad data: Delete it and retrain instantly

**My recommendation: Start with RAG, consider fine-tuning later**

### When to Fine-Tune

**Consider fine-tuning IF:**

1. **You've grown to 10,000+ verified contributions**
2. **RAG performance plateaus** (you've hit ceiling on what retrieval can do)
3. **You want to change Claude's behavior**, not just add knowledge
   - Examples: "Use more concise language" | "Always start with framework" | "Use Razorpay-specific terminology"

### How Fine-Tuning Would Work (If You Do It)

**Step 1: Prepare training data**
```
Take top 5,000 community contributions (by endorsements/impact)
Format as: "Student prompt" → "Ideal Claude response"

Example:
[
  {
    "messages": [
      {"role": "user", "content": "Razorpay PM interview Q: How would you reduce payment failure rates?"},
      {"role": "assistant", "content": "I'd start by defining what 'failure' means..."}
    ]
  },
  {...},
  ... 5000 more
]
```

**Step 2: Submit to Claude fine-tuning API**
```javascript
const fineTunedModel = await anthropic.betaMessages.createModelFineTune({
  model: 'claude-3-sonnet',
  training_data: trainingDataset, // 5,000 examples
  learning_rate_multiplier: 1.0
});
// Returns: model ID, takes 2-4 hours
```

**Step 3: Use fine-tuned model in production**
```javascript
const response = await anthropic.messages.create({
  model: 'claude-3-sonnet-ft-<fine-tune-id>', // Use fine-tuned version
  max_tokens: 1000,
  system: "You are an expert interview coach...",
  messages: [...]
});
```

**Step 4: A/B test**
- 50% of users: Original Claude
- 50% of users: Fine-tuned Claude
- Compare: Response quality, user satisfaction, hallucination rate

**Step 5: Decision**
- If fine-tuned > original: Switch all users over
- If fine-tuned = original: Stick with RAG (cheaper)
- If fine-tuned < original: Roll back, investigate

---

## 7. SCALING THE COMMUNITY

### Phase 1 (Weeks 1-4): Your Batch Only

**Goal:** Proof of concept

**Actions:**
- Launch community feature
- Recruit 10 close friends to submit first Q&As
- Placement cell staff (2 people) verify

**Expected:** 50-100 contributions

---

### Phase 2 (Weeks 5-8): Your Entire Cohort

**Goal:** Network effects

**Actions:**
- Announce on campus: "Contribute your interview Q&As, get free premium"
- Demo in placement cell orientation
- Send email: "Your classmates are sharing, join in"
- Create "Top Contributors" leaderboard (public)

**Expected:** 500-1,000 contributions

---

### Phase 3 (Months 2+): Other B-Schools

**Goal:** Scale across India

**Actions:**
- Approach placement cells at ISB, MDI, XLRI, IIM Bangalore
- "Free version for your students if you verify contributions"
- Each campus becomes a node in the network

**Expected:** 5,000+ contributions

**Why this works:**
- Each campus has institutional incentive (helps their students)
- Placement staff do verification (free value)
- Students see campus-mates on leaderboard (social proof)

---

## 8. TECHNICAL IMPLEMENTATION

### Database Tables (Already Added)

```sql
community_contributions
├─ id, user_id, contribution_type, content_text
├─ company_id, role, status
├─ community_votes, community_flags
├─ verified_by, verification_date
└─ reward_claimed, reward_type

community_contribution_votes
├─ contribution_id, user_id, vote_type
└─ reason, created_at

community_leaderboard
├─ user_id, verified_contributions, total_impact
└─ ranking, updated_at

contribution_usage
├─ contribution_id, usage_count
└─ last_used_date, updated_at
```

### API Endpoints

```javascript
// Submit contribution
POST /api/community/contributions
{
  type: 'interview_qa',
  company: 'razorpay',
  role: 'pm',
  question: '...',
  sampleAnswer: '...'
}
Response: { status: 'pending', id: '...' }

// Vote on contribution
POST /api/community/contributions/:id/vote
{
  voteType: 'endorse' | 'flag',
  reason: '...'
}

// Get leaderboard
GET /api/community/leaderboard?period=month
Response: [{ rank, user, contributions, impact }, ...]

// Get my contributions
GET /api/community/my-contributions
Response: [{ status, verifiedDate, usageCount }, ...]

// Admin: Review pending contributions
GET /api/admin/contributions/pending
```

### Cron Jobs (Automated Tasks)

```javascript
// Run daily
scheduleJob('0 0 * * *', async () => {
  // Auto-approve contributions with 5+ votes
  const autoApprove = await db.query(`
    SELECT id FROM community_contributions
    WHERE community_votes >= 5 AND community_flags = 0 AND status = 'pending'
  `);
  
  for (const contrib of autoApprove) {
    await approveContribution(contrib.id);
  }
  
  // Auto-reject old contributions with no votes
  const autoReject = await db.query(`
    SELECT id FROM community_contributions
    WHERE created_at < NOW() - INTERVAL 7 DAYS 
    AND community_votes < 1 AND status = 'pending'
  `);
  
  for (const contrib of autoReject) {
    await rejectContribution(contrib.id, 'Insufficient community validation');
  }
  
  // Update leaderboard
  await updateLeaderboard();
});
```

### Embedding Generation

```javascript
// When contribution is verified, generate embedding
const generateAndStoreEmbedding = async (contributionId) => {
  const contrib = await getContribution(contributionId);
  
  // Get text to embed
  const textToEmbed = `
    ${contrib.content_text}
    Company: ${contrib.company}
    Role: ${contrib.role}
    Type: ${contrib.type}
  `;
  
  // Call Claude embeddings API
  const embedding = await claudeAPI.embeddings({
    model: 'claude-embeddings', // when available
    input: textToEmbed
  });
  
  // Store in vector DB
  await db.query(`
    INSERT INTO embeddings (source_id, source_type, content, embedding)
    VALUES (?, 'community_contribution', ?, ?)
  `, [contributionId, textToEmbed, embedding]);
};
```

---

## 9. MONITORING & ITERATION

### Key Metrics to Track

| Metric | Target | Why |
|---|---|---|
| Contributions/week | 10+ by week 2, 50+ by month 2 | Growth signal |
| Auto-approval rate | 60%+ | Quality signal (low flags) |
| Human rejection rate | <20% | Automated validation working |
| Avg time to verification | <5 days | Community engagement healthy |
| Contribution type mix | 60% Q&A, 20% cases, 20% frameworks | Aligned with priorities |
| Leaderboard engagement | 30%+ of users viewing | Gamification working |

### Monthly Review Checklist

**Week 1 of new month:**
```
☐ Review flagged contributions (placement staff time: 1-2 hours)
☐ Approve/reject human review queue
☐ Update leaderboard + award rewards
☐ Email top contributors: "Thanks for X contributions!"

☐ Check metrics: growth rate, auto-approval rate
☐ Identify patterns: Which companies get most Q&As? Which roles?
☐ Any quality issues? (review rejected contributions)

☐ Update knowledge base stats: "Now 3,000+ verified resources!"
☐ Send batch-wide email: Share leaderboard, encourage contributions
```

### When to Escalate to Fine-Tuning

**After 6 months, ask:**

1. **Knowledge base size:** Do we have 10,000+ verified contributions? If yes → Continue.
2. **RAG effectiveness:** Are Claude responses grounded in real data? If yes → Continue.
3. **Performance plateau:** Has quality hit a ceiling? If no → Continue RAG.
4. **Budget:** Can we afford $5,000/month for fine-tuning experiments? If no → Continue RAG.
5. **Behavioral improvements:** Do we want Claude to behave differently (not just know more)? If yes → Consider fine-tuning.

**Decision tree:**
```
All conditions met?
  ├─ No → Continue RAG (cost-effective, working well)
  └─ Yes → Run fine-tuning experiment
      ├─ Fine-tuned > original → Switch
      ├─ Fine-tuned ≈ original → Keep RAG (cheaper)
      └─ Fine-tuned < original → Debug, retry, or abandon
```

---

## INTERVIEW STORY: COMMUNITY DATA

**When asked:** "How did you scale your knowledge base?"

**Your answer:**

"I started with 500 resources from B-school case books. But that wasn't enough. Razorpay PM interviews this year might be different from last year's.

So I built a community contribution system: students submit interview Q&As they experienced, cases they solved, frameworks they created. But I needed quality control.

Three-layer verification system:
1. Automated pre-validation (catch PII, spam, formatting issues)
2. Community voting (7 days; need 5+ endorsements to auto-approve)
3. Human verification (placement staff review flagged content)

I incentivized contributions: 1 verified Q&A = 3 months free premium. Built a leaderboard showing "total impact" (how many students used your Q&A).

Result: By month 3, we had 2,500+ verified resources. Every Claude API call now has access to real, verified data from real interviews.

Most importantly: No hallucination. Every interview question is from a student who actually interviewed. Every company insight is verified by placement staff. Students trust the platform because the data is real.

The fine-tuning question came up, but I decided RAG was better for MVP. RAG is instant, reversible, and cheap. Fine-tuning would cost 100x more for marginal improvements. After we hit 10,000+ verified contributions *and* RAG performance plateaus, then maybe we fine-tune. But not before."

---

## CONCLUSION

**Community contributions are your knowledge moat.**

- Start with authoritative data (case books, handbooks)
- Let community expand and verify it
- Use RAG to ground all LLM calls
- Gamify to drive engagement
- Scale to other B-schools
- Optional: Fine-tune later if ROI justifies

This is defensible in an interview because:
1. You solved a real problem (knowledge currency + accuracy)
2. You built community (network effects, incentives)
3. You prevented hallucination (verification system)
4. You understood tradeoffs (RAG vs fine-tuning)
5. You scaled thoughtfully (one batch → all batches)

**That's a strong technical + product story.**

---

**End of Community Data Strategy Document**
