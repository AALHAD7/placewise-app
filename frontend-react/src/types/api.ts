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
export interface FrameworkGridDiagram {
  xAxis: string | null;
  yAxis: string | null;
  cols: string[];
  rows: string[];
  cells: string[][];
}
export interface FrameworkFunnelDiagram {
  stages: string[];
}
export interface Framework {
  id: string;
  name: string;
  role?: string;
  level?: string;
  domain?: string;
  subdomain?: string;
  description?: string;
  when_to_use?: string;
  when_not_to_use?: string;
  pitfalls?: string[];
  example?: string;
  grounded_example?: { excerpt: string; sourceFile: string };
  grounded_image?: { url: string; caption: string; sourceFile: string };
  steps?: string[];
  diagram_type?: "grid" | "funnel" | null;
  diagram_data?: FrameworkGridDiagram | FrameworkFunnelDiagram | null;
}

export interface FrameworksResponse {
  success: true;
  frameworks: Framework[];
}

// GET /api/frameworks/taxonomy
export interface FrameworkDomainTaxonomy {
  domain: string;
  subdomains: string[];
}
export interface FrameworksTaxonomyResponse {
  success: true;
  domains: FrameworkDomainTaxonomy[];
}

// GET /api/frameworks/catalog?domain=Consulting - frameworks actually found in the
// ingested club casebooks (diagram titles), not the static seeded Framework list above.
// Empty while ENABLE_CONSULTING_RAG_V2 is off, or for any domain other than Consulting.
export interface FrameworkCatalogOccurrence {
  sourceFile: string;
  school: string | null;
  club: string | null;
  year: string | null;
  page: number;
}
export interface FrameworkCatalogEntry {
  title: string;
  occurrences: FrameworkCatalogOccurrence[];
}
export interface FrameworksCatalogResponse {
  success: true;
  frameworks: FrameworkCatalogEntry[];
}

// GET /api/guesstimates/random, /api/guesstimates/ask?topic=...
export interface GuesstimateCitation {
  school: string | null;
  club: string | null;
  casebook: string;
  year: string | null;
  pages: number[];
}
export interface GuesstimateResponse {
  success: true;
  available: boolean;
  reason?: "feature_disabled" | "not_yet_live";
  covered?: boolean;
  label?: string | null;
  problem?: string;
  hasDiagram?: boolean;
  citation?: GuesstimateCitation;
  chunks?: { content: string; hasDiagram: boolean; similarity: number }[];
  citations?: GuesstimateCitation[];
}

// GET /api/companies/:name - backend/src/routes/companies.js
export interface CompanyOverview {
  about?: string;
  sector?: string | null;
  listed?: boolean | null;
  listedDetail?: string | null;
  sharePrice?: string | null;
  financials?: string | null;
  facts?: { k: string; v: string }[];
  processNote?: string;
  rounds?: { name: string; detail: string }[];
  experiences?: { who: string; when?: string; text: string }[];
  investments?: { title: string; detail: string }[];
  overviewSources?: ValueChainSource[];
  overviewGrounded?: boolean;
}
export interface CompanyOverviewResponse {
  success: true;
  company: CompanyOverview;
}

// GET /api/companies/:name/leadership
export interface CompanyExecutive {
  name: string;
  title: string;
  photoUrl: string | null;
}
export interface CompanyLeadershipResponse {
  success: true;
  company: string;
  executives: CompanyExecutive[];
  sources: ValueChainSource[];
  grounded: boolean;
  cached: boolean;
  fetchedAt: string;
}

// GET /api/companies/:name/logo
export interface CompanyLogoResponse {
  success: true;
  company: string;
  url: string | null;
  domain: string | null;
}

// GET /api/companies/:name/subsidiaries
export interface CompanySubsidiariesResponse {
  success: true;
  company: string;
  subsidiaries: string[];
  sources: ValueChainSource[];
  grounded: boolean;
  cached: boolean;
  fetchedAt: string;
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

// GET /api/companies/:name/value-chain
export interface CompanyValueChainStage {
  name: string;
  description: string;
}
export interface CompanyValueChainResponse {
  success: true;
  stages: CompanyValueChainStage[];
}

// GET /api/companies/:name/value-chain/:stageName?description=
export interface ValueChainSource {
  title: string;
  uri: string;
}
export interface CompanyValueChainStageDetailResponse {
  success: true;
  company: string;
  stage: string;
  detail: string;
  sources: ValueChainSource[];
  grounded: boolean;
  cached: boolean;
  fetchedAt: string;
}

// GET /api/companies/:name/business-model
export interface CompanyBusinessModelResponse {
  success: true;
  company: string;
  ascii: string;
  howItWorks: string;
  sources: ValueChainSource[];
  grounded: boolean;
  cached: boolean;
  fetchedAt: string;
}

// GET /api/companies/:name/rating
export interface CompanyRatingResponse {
  success: true;
  company: string;
  found: boolean;
  rating: number | null;
  reviewCount: string | null;
  sources: ValueChainSource[];
  grounded: boolean;
  cached: boolean;
  fetchedAt: string;
}

// GET /api/companies/:name/rating/:roleName
export interface CompanyRoleRatingResponse {
  success: true;
  company: string;
  role: string;
  found: boolean;
  rating: number | null;
  reviewCount: string | null;
  matchedRoleTitle: string | null;
  isExactMatch: boolean;
  sources: ValueChainSource[];
  grounded: boolean;
  cached: boolean;
  fetchedAt: string;
}

// GET /api/roles/:title[?company=] - backend/src/routes/roles.js
// `companies` (who hires, plural) is only present in the role-wide response;
// `company`/`process` are only present when ?company= was passed - a single
// company is already fixed, so "who hires for it" is replaced by "process"
// (that company's interview rounds for this role).
// A real grounding citation (Phase 1 amendment B) - `uri` is a Google
// grounding-redirect link, not a bare domain (see gemini.js's
// generateGroundedText), so the badge shows `title` as the visible label,
// not a parsed-out domain name.
export interface RoleSource {
  title: string;
  uri: string;
}
export interface RoleOverview {
  requestedTitle?: string;
  what?: string;
  companies?: string[];
  company?: string;
  process?: string[];
  salary?: string;
  salaryNote?: string;
  skills?: string[];
  // Phase 1.5 item 6: split, not a single "exits" field.
  careerProgression?: string[];
  exitOpportunities?: string[];
  sources?: RoleSource[];
  // Phase 1.5 item 3: source-quality tiers - hasTrustedSource gates salary;
  // process also accepts hasSupportingSource (with a weaker label).
  hasTrustedSource?: boolean;
  hasSupportingSource?: boolean;
  fetchedAt?: string;
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
// Phase 1.5 item 2: the 5-flag content check (replaces Phase 1's
// arithmetic-only verifier). modelAnswer gets a real pass/fail + issue - a
// still-failing explanation is shown with a notice. practicePrompts never
// ships unverified, so it only reports whether any of the 3 questions had
// to be swapped for a fresh one, not a pass/fail to notice about.
export interface ContentCheck {
  checked: boolean;
  passed: boolean;
  issue: string;
}
export interface PracticePromptsCheck {
  checked: boolean;
  anyReplaced: boolean;
}
export interface RoleTopic {
  name: string;
  points: string[];
  concept: string;
  pitfalls: string[];
  frameworks: RoleTopicFramework[];
  modelAnswer: { prompt: string; walkthrough: string[] };
  practicePrompts: RoleTopicPractice[];
  modelAnswerVerified?: ContentCheck;
  practicePromptsVerified?: PracticePromptsCheck;
}
export interface RoleTopicsResponse {
  success: true;
  matchedRole: string;
  topics: RoleTopic[];
  // R7/G2 (backend-only until R8): real casebook citations when covered, or false +
  // no citations when this is general AI guidance - see GroundingNote.tsx.
  groundedInCasebooks?: boolean;
  citations?: GuesstimateCitation[];
}

// GET /api/roles/:title/company-notes?company=&topics=
export interface RoleCompanyNotesResponse {
  success: true;
  notes: Record<string, string>;
  // Keyed the same as `notes` - only topics with a real company mention get a
  // citation; the rest are simply absent (grounding policy: show nothing, not a guess).
  citations?: Record<string, GuesstimateCitation[]>;
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
export type SkillConceptTierName = "basic" | "intermediate" | "advanced";
export type SkillConceptTiers = Record<SkillConceptTierName, SkillConcept[]>;
export interface SkillContentResponse {
  success: true;
  isCode: boolean;
  language: "sql" | "python" | null;
  concepts: SkillConceptTiers;
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

// GET /api/community/summary - backend/src/routes/community.js
export interface CommunitySummaryResponse {
  success: true;
  memberCount: number;
  showCount: boolean;
  avatars: { initials: string }[];
}

// POST /api/plan/generate, GET /api/plan/current - backend/src/routes/plan.js
export interface PlanTask {
  title: string;
  section: string;
  minutes: number;
}
export interface PlanDay {
  day: number;
  focus: string;
  tasks: PlanTask[];
}
export interface GeneratePlanResponse {
  success: true;
  days: PlanDay[];
  saved: boolean;
  sectionRoutes: Record<string, string>;
}
export interface SavedPlan {
  target_role: string;
  domain: string;
  interview_date: string;
  hours_per_day: number;
  days: PlanDay[];
  created_at: string;
}
export interface CurrentPlanResponse {
  success: true;
  plan: SavedPlan | null;
  sectionRoutes: Record<string, string>;
}

// GET /api/admin/usage - backend/src/routes/admin.js (Phase 1.6 item 1)
export interface AdminAlert {
  id: string;
  kind: string;
  message: string;
  created_at: string;
  acknowledged: boolean;
}
export interface AdminUsageResponse {
  success: true;
  callsByFeature: { feature: string; callType: string; count: number }[];
  totalCallsToday: number;
  keySource: { platform: number; byok: number };
  escalationsToday: number;
  escalationsByFeature: { feature: string; count: number }[];
  openAlerts: AdminAlert[];
}

// ---------------------------------------------------------------------------
// R5 admin review queue - backend/src/routes/adminReview.js (/api/admin/review/*).
// Admin-only. No storage path or URL is ever part of these shapes: the page
// image comes from GET /api/admin/review/pages/:pageId/image as bytes.

export type ReviewStatus = "pending" | "approved" | "fixed" | "wrong";
export type ReviewAction = "approve" | "mark_wrong" | "edit_approve" | "reopen";

// GET /api/admin/review/documents
export interface AdminReviewDocument {
  id: string;
  source_file: string;
  school: string | null;
  year: string | null;
  ingestion_version: number;
  status: string | null;
  flagged: number;
  pending_flagged: number;
}
export interface AdminReviewDocumentsResponse {
  success: true;
  documents: AdminReviewDocument[];
  default_document_id: string | null;
}

// GET /api/admin/review/pages?document_id=&status=&reason=&flagged=
export interface AdminReviewLastAction {
  action: ReviewAction;
  new_status: ReviewStatus;
  reviewer_email: string;
  created_at: string;
}
export interface AdminReviewPageListItem {
  id: string;
  page_no: number;
  review_status: ReviewStatus;
  review_reasons: string[];
  diagram_count: number | null;
  method: string | null;
  finding_count: number;
  last_action: AdminReviewLastAction | null;
}
export interface AdminReviewPagesResponse {
  success: true;
  pages: AdminReviewPageListItem[];
  reason_counts: Record<string, number>;
  total: number;
  review_schema_ready: boolean;
}

// GET /api/admin/review/pages/:pageId
export interface AdminReviewMismatch {
  type?: string;
  item?: string;
  page_shows?: string;
  stored?: string;
  note?: string;
  [key: string]: unknown;
}
export interface AdminReviewFinding {
  id: string;
  document_id: string | null;
  ingestion_version: number | null;
  source_name: string;
  entry_key: string | null;
  reviewer: string | null;
  verdict: string | null;
  outcome: string | null;
  mismatch_types: string[] | null;
  mismatches: AdminReviewMismatch[] | null;
  note: string | null;
  imported_at: string;
  is_current_version: boolean;
}
export interface AdminReviewHistoryItem {
  id: string;
  action: ReviewAction;
  prev_status: ReviewStatus | null;
  new_status: ReviewStatus;
  note: string | null;
  edited_markdown: string | null;
  edited_diagrams: unknown[] | null;
  reviewer_email: string;
  created_at: string;
}
export interface AdminReviewPageDetail {
  id: string;
  page_no: number;
  review_status: ReviewStatus;
  needs_review: boolean;
  review_reasons: string[] | null;
  markdown: string | null;
  diagrams: unknown[] | null;
  diagram_issues: unknown[] | null;
  number_coverage: number | null;
  word_coverage: number | null;
  diagram_label_coverage: number | null;
  method: string | null;
  prompt_version: string | null;
}
export interface AdminReviewPageResponse {
  success: true;
  page: AdminReviewPageDetail;
  document: { id: string; school?: string | null; year?: string | null; ingestion_version?: number };
  findings: AdminReviewFinding[];
  history: AdminReviewHistoryItem[];
  prev_page_id: string | null;
  next_page_id: string | null;
  review_schema_ready: boolean;
}

// POST /api/admin/review/pages/:pageId/actions
// Errors: 400 (+ block_errors for edit_approve), 404, 409 status conflict, 429, 503 (migration 041 missing).
export interface AdminReviewActionRequest {
  action: ReviewAction;
  note?: string;
  markdown?: string;
  expected_status?: ReviewStatus;
}
export interface AdminReviewActionResponse {
  success: true;
  review_status: ReviewStatus;
  review_id: string;
}
export interface AdminReviewBlockError {
  index: number;
  errors: string[];
}

// ```placewise-diagram blocks (diagram-transcription skill). Discriminated on `type`.
interface PlacewiseDiagramBase {
  title?: string | null;
  source_page?: number;
  notes?: string[];
}
export interface PlacewiseTreeNode {
  label: string;
  children?: PlacewiseTreeNode[];
}
export type PlacewiseDiagramBlock =
  | (PlacewiseDiagramBase & { type: "issue_tree"; root: PlacewiseTreeNode })
  | (PlacewiseDiagramBase & {
      type: "matrix";
      xAxis?: string | null;
      yAxis?: string | null;
      cols: string[];
      rows: string[];
      cells: (string | null)[][];
    })
  | (PlacewiseDiagramBase & { type: "funnel"; stages: string[] })
  | (PlacewiseDiagramBase & {
      type: "flow";
      nodes: { id: string | number; label: string }[];
      edges: { from: string | number; to: string | number; label?: string | null }[];
    })
  | (PlacewiseDiagramBase & {
      type: "chart";
      chart_kind?: string;
      xLabel?: string | null;
      yLabel?: string | null;
      series: { name: string; points: [string | number, number | null][] }[];
    })
  | (PlacewiseDiagramBase & { type: "table"; header: string[]; rows: (string | null)[][] })
  | (PlacewiseDiagramBase & { type: "other"; description: string; labels?: string[] });
