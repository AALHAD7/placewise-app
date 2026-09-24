import { supabase } from "./supabase.js";
import { embedTexts } from "./gemini.js";

// Below this, a "closest match" isn't actually about the framework - better
// to show nothing than a misleadingly-labeled irrelevant excerpt.
const SIMILARITY_THRESHOLD = 0.5;
// Separate, slightly higher bar for images specifically - an image caption
// matching a framework name loosely is a much weaker signal than a text
// excerpt actually discussing it (captions are short, generic-sounding
// descriptions of a picture, easy to false-positive on).
const IMAGE_SIMILARITY_THRESHOLD = 0.58;

// filter_domain uses the same raw value stored on document_chunks.domain
// (e.g. "Prodman", "Marketing:Sales") - frameworks.domain is seeded with
// those exact values (see migration_019) specifically so no remapping layer
// is needed here.
async function findGrounding(fw) {
  try {
    const [queryEmbedding] = await embedTexts(
      [`${fw.name} framework diagram case study real example application ${fw.subdomain || fw.role || ""}`],
      "RETRIEVAL_QUERY"
    );
    const { data: chunks, error } = await supabase.rpc("match_document_chunks", {
      query_embedding: queryEmbedding,
      match_count: 6,
      filter_domain: fw.domain || null
    });
    if (error) throw error;

    const rows = chunks || [];
    // The excerpt itself, verbatim - not an LLM paraphrase - so there's
    // nothing here that could be a fabricated claim about the framework.
    const topText = rows.find(r => !r.image_url && r.similarity >= SIMILARITY_THRESHOLD);
    const topImage = rows.find(r => r.image_url && r.similarity >= IMAGE_SIMILARITY_THRESHOLD);

    return {
      example: topText ? { sourceFile: topText.source_file, excerpt: topText.content, similarity: topText.similarity } : null,
      image: topImage ? { url: topImage.image_url, caption: topImage.content, sourceFile: topImage.source_file, similarity: topImage.similarity } : null
    };
  } catch (err) {
    console.warn(`[frameworksGrounding] lookup failed for "${fw.name}": ${err.message}`);
    return { example: null, image: null };
  }
}

/**
 * Augments framework rows with `grounded_example` (a real casebook excerpt)
 * and `grounded_image` (a real diagram/image from the ingested corpus, when
 * one scores high enough) - both null if nothing relevant enough was found.
 * Computed lazily on each row's first request and cached in the DB
 * (grounded_checked_at) from then on, so a row that's already been checked
 * never re-embeds or re-queries.
 */
export async function withGroundedExamples(frameworks) {
  const toCheck = frameworks.filter(f => !f.grounded_checked_at);
  if (!toCheck.length) return frameworks;

  const updates = await Promise.all(
    toCheck.map(async fw => {
      const { example, image } = await findGrounding(fw);
      return { id: fw.id, grounded_example: example, grounded_image: image, grounded_checked_at: new Date().toISOString() };
    })
  );

  await Promise.all(updates.map(async u => {
    const { error } = await supabase
      .from("frameworks")
      .update({ grounded_example: u.grounded_example, grounded_image: u.grounded_image, grounded_checked_at: u.grounded_checked_at })
      .eq("id", u.id);
    if (error) console.warn(`[frameworksGrounding] cache write failed for ${u.id}: ${error.message}`);
  }));

  const byId = Object.fromEntries(updates.map(u => [u.id, u]));
  return frameworks.map(f => (byId[f.id] ? { ...f, ...byId[f.id] } : f));
}
