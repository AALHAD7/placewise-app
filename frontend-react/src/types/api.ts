// Response DTOs per backend route, filled in incrementally as each page is
// ported (see migration plan §0.2 for the full endpoint list). Only the
// pieces needed by shared/Phase 0 infra + Home are typed so far.

export type ActivityType =
  | "resume_interrogation"
  | "framework_review"
  | "mock_interview"
  | "tone_shift"
  | "story_builder";

export interface PlanItem {
  type: ActivityType;
  label: string;
  minutes: number;
  done: boolean;
}

export interface RecentItem {
  type: ActivityType;
  label: string;
  detail: string;
  createdAt: string;
}

export interface WeekDay {
  label: string;
  done: boolean;
  isFuture: boolean;
}

// GET /api/activity/summary - backend/src/routes/activity.js
export interface ActivitySummary {
  success: true;
  streak: number;
  plan: PlanItem[];
  recent: RecentItem[];
  thisWeek: WeekDay[];
  readiness?: number;
  readinessSampleSize?: number;
  sessionsCompleted?: number;
  questionsPracticed?: number;
}

// GET /api/frameworks - backend/src/routes/frameworks.js
export interface Framework {
  id: string;
  name: string;
  role?: string;
  level?: string;
  description?: string;
  example?: string;
  grounded_example?: { excerpt: string; sourceFile: string };
  steps?: string[];
}

export interface FrameworksResponse {
  success: true;
  frameworks: Framework[];
}

// GET /api/companies/:name - backend/src/routes/companies.js
export interface CompanyOverview {
  about?: string;
  facts?: { k: string; v: string }[];
  processNote?: string;
  rounds?: { name: string; detail: string }[];
  experiences?: { who: string; when?: string; text: string }[];
  investments?: { title: string; detail: string }[];
}
export interface CompanyOverviewResponse {
  success: true;
  company: CompanyOverview;
}

// GET /api/companies/:name/news
export interface CompanyNewsArticle {
  title: string;
  source?: string;
  publishedAt?: string;
  url: string;
}
export interface CompanyNewsResponse {
  success: true;
  articles: CompanyNewsArticle[];
}

// GET /api/companies/:name/roles
export interface CompanyRolesResponse {
  success: true;
  roles: string[];
}

// GET /api/companies/:name/timeline
export interface CompanyTimelineEvent {
  year: string;
  title: string;
  description: string;
}
export interface CompanyTimelineResponse {
  success: true;
  events: CompanyTimelineEvent[];
}

// GET /api/roles/:title[?company=] - backend/src/routes/roles.js
// `companies` (who hires, plural) is only present in the role-wide response;
// `company`/`process` are only present when ?company= was passed - a single
// company is already fixed, so "who hires for it" is replaced by "process"
// (that company's interview rounds for this role).
export interface RoleOverview {
  requestedTitle?: string;
  what?: string;
  companies?: string[];
  company?: string;
  process?: string[];
  salary?: string;
  salaryNote?: string;
  skills?: string[];
  exits?: string[];
}
export interface RoleOverviewResponse {
  success: true;
  role: RoleOverview;
}

// GET /api/roles/:title/topics
export interface RoleTopicFramework {
  name: string;
  answers: string;
  whenNotToUse: string;
}
export interface RoleTopicPractice {
  question: string;
  difficulty: "Easy" | "Medium" | "Hard";
}
export interface RoleTopicCompanyNote {
  company: string;
  note: string;
}
export interface RoleTopic {
  name: string;
  points: string[];
  concept: string;
  pitfalls: string[];
  frameworks: RoleTopicFramework[];
  modelAnswer: { prompt: string; walkthrough: string[] };
  practicePrompts: RoleTopicPractice[];
  companyNotes: RoleTopicCompanyNote[];
  samples?: string[];
}
export interface RoleTopicsResponse {
  success: true;
  matchedRole: string;
  topics: RoleTopic[];
}

// POST /api/mock-interview/start - backend/src/routes/mockInterview.js
export interface MockInterviewStartResponse {
  sessionId: string;
  question: string;
}

// POST /api/mock-interview/answer
export interface MockInterviewFeedback {
  score: number;
  strengths: string[];
  improvements: string[];
  sampleBetterAnswer: string;
  followUpQuestion?: string;
}
export interface MockInterviewAnswerResponse {
  feedback: MockInterviewFeedback;
}

// POST /api/resume/upload - backend/src/routes/resume.js
export interface ResumeUploadResponse {
  resumeText: string;
  fileName: string;
  truncated: boolean;
}

// POST /api/resume/interrogate (SSE "done" event) / refresh
export interface ResumeQuestion {
  q: string;
  level: "Easy" | "Medium" | "Hard";
  tag: string;
  note?: string;
}
export type ResumeCategory = "Behavioural" | "Technical" | "Situational";
export type ResumeResults = Partial<Record<ResumeCategory, ResumeQuestion[]>>;

// POST /api/resume/feedback
export interface ResumeFeedbackResponse {
  good: string[];
  fix: string[];
}

// POST /api/resume/questions/clarify
export interface ResumeClarifyResponse {
  understood: boolean;
  answer: string;
}

// POST /api/resume/questions/helpful
export interface ResumeHelpfulResponse {
  id: string;
}

// POST /api/story/generate - backend/src/routes/story.js
export interface StoryNarrative {
  title?: string;
  keyThemes?: string[];
  story: string;
}
export interface StoryGenerateResponse {
  narratives: StoryNarrative[];
}

// GET /api/skills/:role/:skill - backend/src/routes/skills.js
export interface SkillConcept {
  title: string;
  explanation: string;
  link?: string;
}
export interface SkillContentResponse {
  success: true;
  isCode: boolean;
  language: "sql" | "python" | null;
  concepts: SkillConcept[];
}

// GET /api/skills/:role/:skill/problems?difficulty=
export type SkillDifficulty = "Easy" | "Medium" | "Hard";
export interface SkillProblem {
  id: string;
  prompt: string;
  difficulty: SkillDifficulty;
  concept?: string;
  // code problems (isCode: true)
  schemaSql?: string;
  seedSql?: string;
  expectedResult?: Record<string, unknown>[];
  solutionSql?: string;
  starterCode?: string;
  testCases?: { args: unknown[]; label: string; expectedOutput: unknown }[];
  solutionCode?: string;
  // open-ended problems (isCode: false)
  modelAnswer?: string;
}
export interface SkillProblemsResponse {
  success: true;
  problems: SkillProblem[];
}

// POST /api/skills/:role/:skill/score
export interface SkillScoreFeedback {
  score: number;
  strengths: string[];
  improvements: string[];
  sampleBetterAnswer: string;
}
export interface SkillScoreResponse {
  success: true;
  feedback: SkillScoreFeedback;
}

// GET /api/community, POST /api/community/contribute
export type CommunityContributionType = "interview_qa" | "case_study" | "framework";
export type CommunityContributionStatus = "pending" | "auto_approved" | "approved" | "rejected";
export interface CommunityContribution {
  id: string;
  type: CommunityContributionType;
  company: string | null;
  role: string | null;
  content: string;
  sources: string[] | null;
  status: CommunityContributionStatus;
  created_at: string;
}
export interface CommunityListResponse {
  success: true;
  contributions: CommunityContribution[];
}
export interface CommunityContributeResponse {
  success: true;
  contributionId: string;
  status: string;
  message: string;
}
