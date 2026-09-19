import { supabase } from "./supabase.js";
import { embedTexts } from "./gemini.js";

// Below this, a "closest match" isn't actually about the framework - better
// to show nothing than a misleadingly-labeled irrelevant excerpt. The
// ingested corpus only covers Prodman/Consulting cases so far, so a
// framework outside those domains legitimately gets no example.
const SIMILARITY_THRESHOLD = 0.5;

async function findGroundedExample(fw) {
  try {
    const [queryEmbedding] = await embedTexts(
      [`${fw.name} framework case study real example application ${fw.role || ""}`],
      "RETRIEVAL_QUERY"
    );
    const { data: chunks, error } = await supabase.rpc("match_document_chunks", {
      query_embedding: queryEmbedding,
      match_count: 1,
      filter_domain: null
    });
    if (error) throw error;
    const top = (chunks || [])[0];
    if (!top || top.similarity < SIMILARITY_THRESHOLD) return null;
    // The excerpt itself, verbatim - not an LLM paraphrase - so there's
    // nothing here that could be a fabricated claim about the framework.
    return { sourceFile: top.source_file, excerpt: top.content, similarity: top.similarity };
  } catch (err) {
    console.warn(`[frameworksGrounding] lookup failed for "${fw.name}": ${err.message}`);
    return null;
  }
}

/**
 * Augments framework rows with `grounded_example` (a real casebook excerpt,
 * or null if nothing relevant enough was found) - computed lazily on each
 * row's first request and cached in the DB (grounded_checked_at) from then
 * on, so a row that's already been checked never re-embeds or re-queries.
 */
export async function withGroundedExamples(frameworks) {
  const toCheck = frameworks.filter(f => !f.grounded_checked_at);
  if (!toCheck.length) return frameworks;

  const updates = await Promise.all(
    toCheck.map(async fw => ({
      id: fw.id,
      grounded_example: await findGroundedExample(fw),
      grounded_checked_at: new Date().toISOString()
    }))
  );

  await Promise.all(updates.map(async u => {
    const { error } = await supabase
      .from("frameworks")
      .update({ grounded_example: u.grounded_example, grounded_checked_at: u.grounded_checked_at })
      .eq("id", u.id);
    if (error) console.warn(`[frameworksGrounding] cache write failed for ${u.id}: ${error.message}`);
  }));

  const byId = Object.fromEntries(updates.map(u => [u.id, u]));
  return frameworks.map(f => (byId[f.id] ? { ...f, ...byId[f.id] } : f));
}
