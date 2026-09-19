# PRODUCT REQUIREMENTS DOCUMENT
## Placement Prep Platform: Interview Mastery Hub

**Version:** 1.0  
**Date:** August 2026  
**Owner:** Aalhad Morabkar  
**Target User:** B-School students (IIM Trichy, expanding to other institutions)  
**Launch Timeline:** 6 weeks  

---

## 1. EXECUTIVE SUMMARY

**Product Name:** Interview Mastery Hub (IMH)

**One-Liner:** A personalized, AI-powered interview prep platform that connects skill development, company research, framework learning, and narrative building into a seamless workflow—eliminating the need for students to manually research, synthesize, and practice across multiple platforms.

**Why Now:** 
- Students sit for placements across 8+ domains (consulting, operations, marketing, sales, product, strategy, finance, tech).
- Current prep is fragmented: scattered notes, ChatGPT queries, YouTube videos, senior advice.
- No platform connects role preparation → company-specific coaching → resume interrogation → personalized storytelling.
- Gap exists between "learning frameworks" and "telling your story coherently."

**Business Model:**
- Freemium (core features free; premium for company intel, story coaching, unlimited practice)
- Revenue at scale: ₹99-199/month subscription; monetization via analytics insights sold to placement cells

---

## 2. PROBLEM STATEMENT

### 2.1 User Pain Points

**Fragmentation of Resources**
- Students Google "guesstimate strategies," watch YouTube, ask seniors in groups—no integrated experience.
- Time spent synthesizing across sources: 4-6 hours for one domain.
- Information is stale, inconsistent, generic.

**Lack of Personalization**
- Marketing frameworks taught the same way to all students, regardless of their target company (Razorpay ≠ P&G ≠ Amazon).
- Interview prep doesn't account for student's actual background/experiences.
- Resume sit unused during prep; students don't see how their internships connect to narratives.

**Story Coherence Gap**
- Students have 3-5 disparate experiences (Thermax internship, coursework, club, side project).
- Can't weave them into a coherent narrative when asked, "Tell me about a time you solved a problem."
- Storytelling is treated separately from skill prep, not integrated.

**No Resume-to-Question Mapping**
- Resume says "Led analytics project at Thermax"—but students don't know what follow-up questions will likely come.
- They're surprised in interviews, can't anticipate depth required.

**Company-Specific Blind Spots**
- Student doesn't know: Does Razorpay value growth metrics more than unit economics? Does Juspay care about payment flows?
- No systematic way to calibrate prep to company culture/hiring bar.

**Inefficient Feedback Loops**
- Mock interviews with peers: "You did well" ≠ actionable feedback.
- No structured rubric; no tracking of weak areas; no iteration system.

---

## 3. SOLUTION OVERVIEW

### 3.1 What IMH Solves

**Unified Workflow**
User flows through a single platform:
1. Select role (consulting, operations, marketing, sales, product, strategy, finance, tech)
2. Select company (or choose "general prep")
3. Upload resume
4. Choose prep mode: skill sharpening → frameworks → guesstimates → case studies → story building
5. Get personalized, sequenced learning path + company-specific coaching + story angles

**AI-Powered Personalization**
- Claude parses resume, identifies experiences, suggests likely interview questions
- Learns from user's choices (what frameworks matter to them)
- Generates company-calibrated frameworks (e.g., "Marketing at Razorpay" vs. "Marketing at P&G")

**Story Coaching Engine**
- Takes user's background + role target + company + resume
- Generates 3-4 coherent narrative angles ("Here's how your Thermax analytics work connects to growth at Razorpay")
- Tests narratives through mock Q&A

**Company Intelligence Layer**
- Crowdsourced interview questions from seniors who interviewed at target companies
- Company profiles: hiring bar, culture signal, likely question patterns
- Realistic profile requirements ("Razorpay calls candidates with X GPA/background")

---

## 4. USER PERSONAS

### Persona 1: Generalist Prep Student (Primary)
**Name:** Aarav  
**Profile:** 2nd year, target = 6-8 companies across 3-4 domains, GPA 7.5-8.5  
**Behavior:** 
- Sits for multiple rounds; doesn't know domain specialization yet
- Frantically Googles frameworks day-before interviews
- Has good internship, struggles to articulate learnings
- Needs "just-in-time" prep, not deep expertise

**Need:** Fast, personalized, on-demand prep. Frameworks connected to his background.

---

### Persona 2: Domain-Focused Student (Secondary)
**Name:** Priya  
**Profile:** 2nd year, targeting consulting at top-3 firms, GPA 8.2+, clear on domain  
**Behavior:**
- Serious about one domain; prepares deeply
- Studies case competitions; reads annual reports
- Needs reinforcement + company-specific nuance

**Need:** Advanced framework depth + company positioning + refined storytelling.

---

### Persona 3: Nervous Preparer (Secondary)
**Name:** Karan  
**Profile:** 2nd year, feels underprepared, worried about resume gaps  
**Behavior:**
- Asks seniors constantly; seeks confidence
- Needs validation + structured feedback
- Benefits from rubric-based mock interviews

**Need:** Structured feedback system + narrative reframing of "weaker" experiences.

---

## 5. CORE FEATURES

### 5.1 Feature 1: Role & Company Selection
**Description:** Guided workflow to select prep path  
**User Flow:**
1. User selects role: Consulting | Operations | Marketing | Sales | Product | Strategy | Finance | Tech
2. User selects company: Bain | McKinsey | Razorpay | Juspay | PhonePe | CRED | Groww | [50+ more] | General prep
3. System loads role-specific + company-specific frameworks

**Output:** Customized prep dashboard with frameworks, guesstimate types, likely questions

**Technical Note:** Role + Company → Claude generates context-aware learning modules

---

### 5.2 Feature 2: Skill Sharpening (Framework Library)
**Description:** Role-specific frameworks with personalized examples  
**What's Included (per role):**

**Consulting:**
- MECE thinking framework
- Business problem-solving waterfall
- Profitability drivers analysis
- Market sizing methodology
- Examples tied to user's background (e.g., "Here's how MECE applies to Thermax's market positioning")

**Operations:**
- Process optimization framework
- Bottleneck identification
- Cost-benefit analysis
- Lean methodology
- Metrics tracking

**Marketing:**
- 4Ps framework
- GTM strategy
- Customer segmentation
- Positioning & messaging
- Campaign ROI analysis

**Product:**
- Jobs-to-be-done framework
- User persona mapping
- Feature prioritization
- Metrics (DAU, retention, LTV)
- Roadmap thinking

**Sales:**
- Sales funnel analysis
- Deal structuring
- Objection handling
- Territory planning
- Quota attainment metrics

**[Similar depth for Strategy, Finance, Tech]**

**Personalization:**
- "You mentioned analytics at Thermax. Here's how MECE thinking applies to the problem you solved there."
- Examples use user's industry/background context

**Format:** Interactive cards, explainer videos (AI-generated), practice Q&A

---

### 5.3 Feature 3: Guesstimate Practice
**Description:** Guided, company-calibrated estimation practice  
**Workflow:**
1. User selects guesstimate type: Market sizing | Profitability | User base | Revenue | Operational | Other
2. System presents: Problem statement + hints + framework to apply
3. User works through estimate step-by-step
4. Claude evaluates: Identifies logical gaps, suggests better approaches, reveals "industry standard" answer
5. Feedback rubric: Logic clarity | Data assumptions | Calculation accuracy | Communication

**Examples:**
- "Size the market for UPI payments in India" (Razorpay context)
- "How many payment transactions happen in India monthly?" (Juspay context)
- "Estimate Groww's annual trading volume" (Product context)

**Personalization:**
- Questions weighted toward user's target company domain
- Hints calibrated to user's past performance

---

### 5.4 Feature 4: Case Studies & Problem-Solving
**Description:** Structured case practice with real or realistic briefs  
**Sources:**
- Past IIM Trichy case competitions (Airtel iCreate, RSM Accelerate, PwC StyleVerse)
- Real consulting case frameworks
- Company-specific business challenges

**Workflow:**
1. User selects case difficulty: Beginner | Intermediate | Advanced
2. Presents case brief (1 page, no solution given)
3. User develops hypothesis, analysis, recommendation
4. Claude evaluates against scoring rubric:
   - Problem clarity (did you restate correctly?)
   - Hypothesis quality (is it testable and interesting?)
   - Analysis rigor (MECE? data-driven?)
   - Recommendation strength (is it actionable? justified?)
   - Storytelling (did you communicate clearly?)
5. System generates detailed feedback + suggested "winning" answer

**Company-Specific Calibration:**
- Razorpay cases focus on growth/retention metrics
- Juspay cases focus on payment flow/network effects
- Consulting cases emphasize profitability & strategy

---

### 5.5 Feature 5: Resume Interrogation
**Description:** Claude parses resume and generates likely interview questions  
**Workflow:**
1. User uploads resume + optionally adds role + company context
2. Claude analyzes:
   - Identifies each experience/achievement
   - Flags likely follow-up questions
   - Maps to frameworks (e.g., "your analytics project → likely asked about metrics definition, causality, business impact")
3. System generates Q&A card deck:
   - 15-20 questions likely to be asked based on resume
   - Suggested answer angles (with framework hints, not full answers)
   - Depth scoring (basic Q vs. hard Q based on role)

**Example:**
- Resume says: "Led analytics project at Thermax, 10% cost optimization"
- System generates:
  - "What was the problem you were trying to solve?" (Problem clarity)
  - "How did you define the 10% saving?" (Metrics rigor)
  - "What was the root cause of the inefficiency?" (Root cause thinking)
  - "How would you prioritize if there were multiple solutions?" (Prioritization framework)
  - [10+ more, graded by difficulty]

**Output:** Printable study deck + interactive quiz mode

---

### 5.6 Feature 6: Story Building & Narrative Coaching
**Description:** AI-powered narrative weaver that connects user's background into coherent interview stories  
**Workflow:**
1. User uploads resume + fills questionnaire:
   - "What's your strongest experience?"
   - "What problem have you solved?"
   - "Why this role? Why this company?"
   - "What are you proud of? What do you regret?"
2. Claude analyzes patterns across experiences
3. System generates 3-4 narrative angles:
   - **"Growth narrative"**: "You started as engineer, learned analytics, now chasing PM role. Thermax was where you learned metrics matter."
   - **"Problem-solver narrative"**: "Across Thermax, coursework, projects, you keep optimizing processes. Here's why you're suited for Razorpay's scaling challenges."
   - **"Domain expertise narrative"**: "You've been in fintech adjacent space (Thermax's Oracle experience). Here's why Razorpay's tech stack aligns with your growth vector."
   - **"Culture fit narrative"**: "You value impact + autonomy. Here's evidence from your choices."

4. For each narrative, system generates:
   - 2-minute "tell me about yourself" story
   - Key talking points
   - Potential follow-up questions + suggested responses
   - How to tie it to company mission/values

**Format:** Editable story cards, practice script mode (read aloud), mock interview simulation

---

### 5.7 Feature 7: Company Intelligence Profiles
**Description:** Crowdsourced + public data on target companies  
**For Each Company:**
- **Hiring Bar**: Realistic GPA/background/experience profile
- **Culture Signals**: What do they value? (Growth? Technical excellence? Sales? Impact?)
- **Interview Pattern**: Typical rounds + question themes
- **Crowdsourced Q&As**: "I interviewed at Razorpay for PM role. They asked..."
- **Exit Patterns**: Where do employees go after?
- **Recent News**: Product launches, funding, strategy shifts
- **Glassdoor Insights**: (Aggregated, anonymized)

**Personalization:**
- Role + Company → system surfaces relevant Q&As and culture signals
- "If you're targeting product at Razorpay, they'll likely ask about API design, metrics, and growth loops. Here's what that means."

**Crowdsourcing Mechanism:**
- Students who interview at a company can (optionally) log their Q&As
- Anonymized, aggregate in real-time
- Early adopter incentive: free premium month for each interview logged

---

### 5.8 Feature 8: Mock Interview Simulator
**Description:** Structured mock interview with AI feedback  
**Workflow:**
1. User selects scenario: Role + Company + Interview round (screening | case | behavioral | final)
2. Claude plays interviewer, asks questions naturally
3. User responds (text or voice input)
4. System evaluates each response against rubric:
   - **Clarity**: Could the interviewer understand your point?
   - **Relevance**: Did you answer the question asked?
   - **Depth**: Did you go deep enough without over-explaining?
   - **Structure**: Did you use a framework or logical flow?
   - **Story**: Did you tie it to your narrative/background?
5. Post-interview report:
   - Scores per question
   - Weak areas highlighted
   - Suggested improvements
   - Transcript for review

**Features:**
- Video/audio recording optional (practice tone, pacing, body language cues for video)
- Difficulty level adjusts based on user performance
- Company-specific interviewer persona (e.g., "This is a Razorpay PM, expects fast-paced answers")

---

### 5.9 Feature 9: Progress Tracking & Analytics
**Description:** Dashboard showing prep progress and weak areas  
**Tracks:**
- Frameworks mastered (guesstimate accuracy, case scores)
- Mock interview scores (by category: clarity, depth, structure, etc.)
- Resume Q&A deck: questions answered correctly vs. struggled on
- Story coherence score (feedback from mock interviews)
- Company prep progress (% of company intel reviewed)

**User View:**
- "You're strong in MECE thinking (85%), weak in metrics definition (62%). Here are targeted exercises."
- "Mock interview scores: Structure 78%, Storytelling 65%, Depth 72%. Focus on depth this week."
- "You've prepped 3/8 target companies. 40% ready."

**Comparison (Optional):**
- Anonymized peer benchmarking: "Your peers average 72% on guesstimates; you're at 68%. Here's what they're doing."
- (Privacy-preserved; no naming)

---

## 6. USER FLOWS (Core Scenarios)

### 6.1 Scenario 1: "I have an interview with Razorpay PM in 3 days. What do I do?"

**Flow:**
1. Open IMH
2. Select "Quick Prep" → Role: Product | Company: Razorpay | Timeline: 3 days
3. System generates 3-day prep plan:
   - Day 1: Learn product management frameworks + Razorpay company profile (2 hours)
   - Day 2: Guesstimate practice (market sizing, user base, LTV) + resume interrogation (1.5 hours)
   - Day 3: Mock interview (PM round) + story refinement (1.5 hours)
4. User works through modules
5. Day 3 evening: Final mock interview, get feedback
6. Go to interview with confidence

**Outcome:** Structured, efficient prep. User feels ready.

---

### 6.2 Scenario 2: "I'm sitting for 5 companies across 3 roles. Where do I start?"

**Flow:**
1. Open IMH → "General Prep Mode"
2. Add roles: Operations, Consulting, Product
3. Add companies: McKinsey, Bain, Razorpay, PhonePe, CRED
4. System generates: Prioritized prep framework
   - Frameworks common across roles (problem-solving, communication)
   - Role-specific deep dives (1 week each)
   - Company-specific coaching (1-2 hours per company, before interviews)
5. User follows 8-week plan
6. Weekly progress tracking shows weak areas
7. System auto-recommends: "You're weak in profitability analysis. Here are 3 guesstimates to practice before your Bain interview."

**Outcome:** Structured long-term prep. Efficiency across multiple interviews.

---

### 6.3 Scenario 3: "I don't know how to talk about my Thermax experience in a PM interview."

**Flow:**
1. Open IMH → Feature: Story Building
2. Upload resume + select role (Product)
3. Fill questionnaire: "What did you do at Thermax? What did you learn?"
4. Claude analyzes: analytics work + process optimization
5. System generates: "Your Thermax experience shows metrics obsession and operational thinking. Here's how that maps to PM thinking..."
6. Generates narrative: "I learned that data without action is useless. At Thermax, I built dashboards, but the real win was teaching the ops team to use them. That's why I want to be a PM—to own the entire user journey."
7. User refines narrative through story cards
8. Practices in mock interview: "Tell me about a time you had to influence without authority."
9. Nails interview because narrative is coherent and personal

**Outcome:** User feels confident their background is actually strong. Interview performance improves.

---

## 7. FEATURE PRIORITIZATION & PHASING

### MVP (Weeks 1-3)
- [ ] Role & Company selection UI
- [ ] Skill Sharpening: Consulting + Operations frameworks (basic)
- [ ] Resume Interrogation: Basic Q&A generation
- [ ] Story Building: Basic narrative generation
- [ ] Mock Interview: Single-round simulator (text-based)
- [ ] Progress tracking: Basic dashboard

**Launch Target:** 20-30 students in your batch (beta)

---

### Phase 2 (Weeks 4-5)
- [ ] Add 4 more roles: Marketing, Product, Strategy, Finance
- [ ] Company Intelligence profiles: 10-15 companies
- [ ] Guesstimate Practice with feedback rubric
- [ ] Case Studies: 5-10 real cases with scoring
- [ ] Enhanced story building (video practice)

---

### Phase 3 (Weeks 6-8)
- [ ] Crowdsourcing mechanism for interview Q&As
- [ ] Advanced mock interviews: multi-round, adaptive difficulty
- [ ] Video mock interviews (optional)
- [ ] Analytics & peer benchmarking
- [ ] Polish + bug fixes

---

## 8. TECHNICAL ARCHITECTURE

### 8.1 Tech Stack

**Frontend:**
- Lovable (UI/UX, responsive design)
- React (interactivity)
- Tailwind CSS (styling)

**Backend:**
- Claude API (core AI: frameworks, Q&A generation, feedback, story building)
- Supabase (free tier: user data, progress tracking, company intel, crowdsourced Q&As)
- Node.js (optional, for API layer)

**APIs & Integrations:**
- Claude API for all AI features
- Supabase PostgreSQL for data
- (Optional in Phase 3: Google Cloud for analytics)

### 8.2 Key AI Workflows

**Resume Parsing & Q&A Generation:**
- Input: Resume text + role + company
- Claude system prompt: "You are an expert interviewer. Parse this resume and generate 15 likely interview questions calibrated to [Role] at [Company]. Grade by difficulty. Suggest answer angles."
- Output: JSON array of questions + suggested answer frameworks

**Story Building:**
- Input: Resume + questionnaire responses + role + company
- Claude system prompt: "You are a narrative coach. Identify patterns across this student's experiences. Generate 3-4 coherent narratives that connect their background to their target role/company. Each narrative should include: 2-min story + key talking points + potential follow-ups."
- Output: Narrative cards with editable stories

**Mock Interview Feedback:**
- Input: User response + question asked + role + company context
- Claude system prompt: "You are a tough interviewer evaluating this response. Score across clarity (0-10), depth (0-10), structure (0-10), relevance (0-10). Provide specific, actionable feedback. Suggest how to improve."
- Output: Score card + feedback

**Guesstimate Evaluation:**
- Input: User's guesstimate logic + framework applied
- Claude system prompt: "Evaluate this guesstimate on logic, assumptions, calculation accuracy. Identify weaknesses. Suggest better approach. Show 'industry standard' answer."
- Output: Detailed feedback + scoring

---

## 9. SUCCESS METRICS

### Engagement Metrics
- **MAU (Monthly Active Users):** Target 50+ from your batch in month 1
- **Feature Adoption:** % of users using each feature (frameworks, guesstimates, mock interviews, story building)
- **Session Duration:** Average time per session (target: 45 min for deep prep, 15 min for quick reviews)
- **Repeat Usage:** % returning weekly (target: 70%+ during placement season)

### Learning Metrics
- **Guesstimate Accuracy:** Improvement over time (baseline → week 4)
- **Case Scores:** Trend improvement in case analysis scoring
- **Mock Interview Scores:** Progress in clarity, depth, structure, storytelling (week 1 → week 8)
- **Story Coherence:** Qualitative feedback from users + peer feedback on narratives

### Outcome Metrics
- **Interview Success Rate:** % of users who advance to next round at their target companies
- **Placement Rate:** % who get offers from target companies
- **User Testimonials:** "This helped me get into Razorpay"
- **Referral Rate:** % of users who recommend IMH to peers

### Business Metrics
- **Free-to-Premium Conversion:** % converting to paid tier (target: 20-30%)
- **ARPU (Average Revenue Per User):** ₹99-199/month × conversion rate
- **Cohort Retention:** How long do users stay active? (placement season = 12 weeks)

---

## 10. GO-TO-MARKET & ROLLOUT

### 10.1 Launch Strategy

**Phase 0 (Week 1): Soft Launch**
- Invite 10-15 friends/close peers
- Collect feedback (UX, feature gaps, bugs)
- Iterate rapidly

**Phase 1 (Week 2): Batch Launch**
- Release to entire IIM Trichy 2nd year cohort (~200-300 students)
- In-person demo + WhatsApp group
- Incentive: Early users get 3 months free premium
- Collect testimonials

**Phase 2 (Weeks 4-6): Referral Growth**
- "Refer a friend" incentive (both get 1 month free)
- Students refer to seniors (other batches) + juniors
- Growth target: 500+ users by week 6

**Phase 3 (Weeks 7-8): Scaling**
- Expand to other IIM campuses (ISB, MDI, XLRI) via warm intros
- Monetize: ₹99-199/month for premium features
- Target: 1,000+ users, 50-100 paying subscribers by end of 8 weeks

---

### 10.2 Messaging

**For Students:**
- "Your entire interview prep in one place. No more juggling 5 tabs."
- "Get company-specific coaching, not generic frameworks."
- "Turn your background into a compelling story."

**For Placement Cells (future):**
- "Track your cohort's prep progress. Know who's ready. Identify who needs help."
- "Aggregate company feedback on your graduates. Know what companies value."

---

## 11. COMPETITIVE LANDSCAPE

### Existing Solutions (What They Miss)

| Solution | What It Does | What It Misses |
|----------|-------------|----------------|
| ChatGPT + Google | Generic answers, scattered | Personalization, workflow, story coaching |
| InterviewBit | Coding + interview problems | PM/strategy frameworks, company calibration, narrative building |
| Case Academy | Case study teaching | Personalization, resume interrogation, company intel |
| Glassdoor | Company reviews | Structured interview prep, personalized coaching, story weaving |
| Senior WhatsApp Groups | Crowdsourced Q&As | Structured learning, feedback rubric, scalable platform |

**IMH Differentiator:** Integrated workflow + resume interrogation + story building + company intel all in one place, personalized to *your* background and target role/company.

---

## 12. RISKS & MITIGATIONS

### Risk 1: Low Adoption
**Why:** Students think "I can just use ChatGPT" or "My seniors will help me"  
**Mitigation:**
- Launch with high-profile beta testers (top case comp winners, students who got into target companies)
- Get placement cell endorsement
- Show concrete outcomes: "30 students using IMH got interviews; only 10% of non-users did."

### Risk 2: Crowdsourced Data Quality
**Why:** Interview Q&As from students might be inaccurate/incomplete  
**Mitigation:**
- Moderate contributions; flag unverified Q&As
- Cross-reference with Glassdoor + LinkedIn intel
- Prioritize data from students who got offers (vetted)

### Risk 3: AI Feedback Doesn't Feel "Real"
**Why:** Students might think "Claude isn't a real interviewer"  
**Mitigation:**
- Combine AI feedback with peer feedback (optional)
- Gather student testimonials: "This mock interview feedback was spot-on"
- Iterate feedback quality based on user feedback

### Risk 4: Scaling Beyond One Batch
**Why:** Company intel, frameworks might not transfer to other campuses/contexts  
**Mitigation:**
- Build modular framework: core frameworks are universal; company intel is campus-specific
- Launch at one campus first, prove concept, then expand
- Crowdsource from each campus independently

### Risk 5: Monetization Challenges
**Why:** Students reluctant to pay for interview prep (too many free alternatives)  
**Mitigation:**
- Free tier is robust; premium is optional (company intel + advanced story coaching)
- Target placement cells + corporate recruiters for B2B revenue (insights on candidate prep level)
- Freemium approach: free basic features, premium for advanced features

---

## 13. SUCCESS CRITERIA (End of 8 Weeks)

**You've succeeded if:**

1. ✅ **Adoption:** 50+ active users from your batch, 30%+ daily active rate
2. ✅ **Engagement:** Average session 30-45 min; 70%+ use 2+ features per week
3. ✅ **Learning:** Users show measurable improvement (guesstimate accuracy +20%, mock interview scores +25% over 8 weeks)
4. ✅ **Outcomes:** Testimonials from users: "Got interview," "Felt confident," "Story helped me"
5. ✅ **Technical:** Platform is stable, responsive, no major bugs
6. ✅ **Monetization:** 10-15 users on paid tier; generating ₹1,000-2,000/month
7. ✅ **Story:** You can tell a compelling interview story: "I identified a problem [fragmented prep], built a solution [integrated platform], validated with users [50+ users, positive feedback], and learned [X about user behavior/product thinking]"

---

## 14. APPENDIX: FEATURE SPECIFICATIONS

### A1. Resume Interrogation – Detailed Spec

**Inputs:**
- Resume (text or uploaded PDF)
- Target role (optional)
- Target company (optional)

**Processing:**
1. Claude parses resume, extracts experiences with dates, titles, achievements
2. For each achievement, Claude generates 2-3 likely follow-up questions
3. Questions are graded by difficulty (screening Q vs. deep-dive Q)
4. Questions are mapped to frameworks (e.g., "analytics project" → "metrics rigor," "root cause thinking")
5. Suggested answer angle provided (hints, not full answers)

**Output Format (JSON):**
```json
{
  "resume_parsed": {
    "name": "Aalhad Morabkar",
    "experiences": [
      {
        "title": "Senior Systems Engineer",
        "company": "Infosys",
        "duration": "31 months",
        "key_achievement": "Managed Oracle PeopleSoft for PwC",
        "likely_questions": [
          {
            "question": "Tell me about your most complex technical challenge at Infosys.",
            "framework": "Problem-solving, systems thinking",
            "difficulty": "medium",
            "answer_angle": "Be specific. Don't just say 'complex.' Describe the constraint, your approach, the outcome."
          },
          ...
        ]
      }
    ]
  },
  "role_specific_deep_dives": [
    {
      "if_targeting_role": "Product Management",
      "questions": [
        "How did you think about user impact in your Oracle work?",
        "Did you ever have to deprioritize a feature? Walk me through that decision."
      ]
    }
  ]
}
```

---

### A2. Story Building – Detailed Spec

**Inputs:**
- Resume
- Questionnaire responses:
  - "What's your strongest experience?"
  - "What problem have you solved repeatedly?"
  - "Why do you want this role?"
  - "Why this company?"
- Target role + company

**Processing:**
1. Claude identifies patterns across experiences (e.g., "analytics," "optimization," "cross-functional influence")
2. Generates 3-4 narrative themes that connect these patterns
3. For each theme, writes:
   - 2-minute story ("Tell me about yourself")
   - Key talking points (3-4 bullets)
   - Likely follow-up questions
   - Suggested responses to follow-ups
   - How to tie to company mission/values

**Output Format:**
```json
{
  "narratives": [
    {
      "theme": "Data-Driven Decision Maker",
      "story_2min": "I started as an engineer, but I realized technical skills alone weren't enough. At Infosys, I built analytics for PwC—not just dashboards, but tools that changed how they made decisions. That's when I realized: the best technology is the one that creates impact. Now, as a PM, I want to own that entire journey—from understanding the user problem to shipping solutions they actually use.",
      "talking_points": [
        "Technical foundation matters, but impact requires understanding users.",
        "Shifted from building features to building products.",
        "At Thermax, learned that data without action is just noise."
      ],
      "likely_followups": [
        {
          "q": "Tell me about a time when data told you to do something counterintuitive.",
          "suggested_response": "At Thermax, our Power BI dashboards showed that manual processes were costing us 20% of operating expenses. But process change was hard—people resisted. I built a pilot to show the ROI. The insight wasn't just the number; it was understanding *why* people resisted change."
        }
      ],
      "company_tie_in": "At Razorpay, this mindset is critical. You're moving fast, shipping features weekly. But the ones that matter are the ones that solve real merchant problems. I want to be the person who connects Razorpay's capabilities to what merchants actually need."
    }
  ]
}
```

---

## 15. NEXT STEPS

1. **Week 1:** Finalize PRD with feedback from friends/cohort
2. **Week 2:** Start MVP build (UX flow + core features)
3. **Week 3:** Internal testing + rapid iteration
4. **Week 4:** Soft launch to beta group
5. **Week 5:** Collect feedback, iterate
6. **Week 6:** Full launch to batch
7. **Weeks 7-8:** Scale, monetize, document learnings

---

**End of PRD**

---

*This PRD is a living document. Update as you learn from users.*
