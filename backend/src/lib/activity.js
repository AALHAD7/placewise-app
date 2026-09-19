import { supabase } from "./supabase.js";

// Every "did the user do something today" signal on the home dashboard
// (streak, today's plan, recent activity) traces back to a real row in
// user_activity - no invented numbers. The one place this can't reach is a
// per-category skill score (Communication/Problem Solving/etc.): nothing in
// the schema tags mock-interview or resume-interrogation answers by category
// with a numeric score attached, so getDashboard() only reports what it can
// actually back - an overall readiness average from real mock-interview
// scores, real counts, and a real streak - rather than a plausible-looking
// fabricated breakdown.
const ACTIVITY_TYPES = {
  mock_interview: { label: "Mock Interview", minutes: 20 },
  resume_interrogation: { label: "Resume Interrogation", minutes: 15 },
  framework_review: { label: "Framework Practice", minutes: 10 },
  tone_shift: { label: "Tone Shifter", minutes: 10 },
  story_builder: { label: "Story Builder", minutes: 15 }
};

// Priority order for "Today's plan" - the three activities this product is
// actually built around, shown when not yet logged today.
const PLAN_TYPES = ["resume_interrogation", "framework_review", "mock_interview"];

export function isValidActivityType(type) {
  return Object.prototype.hasOwnProperty.call(ACTIVITY_TYPES, type);
}

export async function logActivity(userId, type, label) {
  if (!userId || !isValidActivityType(type)) return;
  try {
    const { error } = await supabase
      .from("user_activity")
      .insert({ user_id: userId, type, label: (label || ACTIVITY_TYPES[type].label).slice(0, 200) });
    if (error) console.warn(`[activity] log failed: ${error.message}`);
  } catch (err) {
    console.warn(`[activity] log failed: ${err.message}`);
  }
}

function dayKey(d) {
  return new Date(d).toISOString().slice(0, 10); // YYYY-MM-DD, UTC calendar day
}

function utcMidnight(d) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

// Longest run of consecutive calendar days (UTC) with >=1 activity, ending
// today or yesterday - a day with zero activity breaks the run, same
// semantics as any habit-streak counter. Today not having activity yet
// doesn't zero out yesterday's streak (matches how every habit app treats
// "still today" leniently).
function computeStreak(dayKeySet) {
  let cursor = utcMidnight(new Date());
  if (!dayKeySet.has(dayKey(cursor))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
    if (!dayKeySet.has(dayKey(cursor))) return 0;
  }
  let count = 0;
  while (dayKeySet.has(dayKey(cursor))) {
    count++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return count;
}

// Mon-Sun for the current ISO week, each flagged with whether that day (so
// far, for today/future days this week) had any logged activity.
function thisWeekFlags(dayKeySet) {
  const today = utcMidnight(new Date());
  const isoDow = today.getUTCDay() === 0 ? 7 : today.getUTCDay(); // 1=Mon..7=Sun
  const monday = new Date(today);
  monday.setUTCDate(monday.getUTCDate() - (isoDow - 1));
  const labels = ["M", "T", "W", "T", "F", "S", "S"];
  return labels.map((label, i) => {
    const d = new Date(monday);
    d.setUTCDate(d.getUTCDate() + i);
    return { label, done: dayKeySet.has(dayKey(d)), isFuture: d > today };
  });
}

/**
 * @param {string} userId
 * @returns {Promise<{streak:number, thisWeek:object[], plan:object[], recent:object[], readiness:number|null, readinessSampleSize:number, questionsPracticed:number, sessionsCompleted:number}>}
 */
export async function getDashboard(userId) {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 60);

  const { data: activity, error } = await supabase
    .from("user_activity")
    .select("type, label, created_at")
    .eq("user_id", userId)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false });
  if (error) throw error;

  const rows = activity || [];
  const dayKeySet = new Set(rows.map(r => dayKey(r.created_at)));
  const streak = computeStreak(dayKeySet);
  const thisWeek = thisWeekFlags(dayKeySet);

  const todayKey = dayKey(new Date());
  const doneToday = new Set(rows.filter(r => dayKey(r.created_at) === todayKey).map(r => r.type));
  const plan = PLAN_TYPES.map(type => ({
    type, label: ACTIVITY_TYPES[type].label, minutes: ACTIVITY_TYPES[type].minutes, done: doneToday.has(type)
  }));

  const recent = rows.slice(0, 8).map(r => ({
    type: r.type,
    label: ACTIVITY_TYPES[r.type]?.label || r.type,
    detail: r.label,
    createdAt: r.created_at
  }));

  const { count: sessionsCompleted, error: countErr } = await supabase
    .from("mock_interview_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (countErr) throw countErr;

  const { data: sessions, error: sessErr } = await supabase
    .from("mock_interview_sessions")
    .select("questions")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (sessErr) throw sessErr;

  const allScores = (sessions || [])
    .flatMap(s => (Array.isArray(s.questions) ? s.questions : []))
    .filter(q => typeof q.score === "number")
    .map(q => q.score);
  const recentScores = allScores.slice(0, 10);
  const readiness = recentScores.length >= 3
    ? Math.round((recentScores.reduce((a, b) => a + b, 0) / recentScores.length) * 10)
    : null;

  return {
    streak, thisWeek, plan, recent,
    readiness, readinessSampleSize: recentScores.length,
    questionsPracticed: allScores.length,
    sessionsCompleted: sessionsCompleted || 0
  };
}
