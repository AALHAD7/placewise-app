import { supabase } from "./supabase.js";
import { embedTexts } from "./gemini.js";
import { groundedConsultingLookup } from "./consultingRetrieval.js";

// Below this, a "closest match" isn't actually about the framework - better
// to show nothing than a misleadingly-labeled irrelevant excerpt.
const SIMILARITY_THRESHOLD = 0.5;
// Separate, slightly higher bar for images specifically - an image caption
// matching a framework name loosely is a much weaker signal than a text
// excerpt actually discussing it (captions are short, generic-sounding
// descriptions of a picture, easy to false-positive on).
const IMAGE_SIMILARITY_THRESHOLD = 0.58;

// R7 switch: off by default, so flipping it off at any time restores today's
// exact behavior (document_chunks + frameworksGrounding below). On, and only
// for fw.domain === "Consulting" (the one domain R6 has re-ingested so far),
// Frameworks grounds against ingest_chunks instead, via consultingRetrieval.js
// - real page-level citations (school/casebook/page), which document_chunks
// structurally cannot provide (it never stored page numbers). See
// grounded-answering skill. Until R9 flips any ingest_chunks row's is_active
// to true, this path returns "not covered" for everything - that is the
// correct, safe state, not a bug.
const CONSULTING_RAG_V2_ENABLED = process.env.ENABLE_CONSULTING_RAG_V2 === "true";

async function findGroundingV2(fw) {
  const query = `${fw.name} framework diagram case study real example application ${fw.subdomain || fw.role || ""}`;
  const result = await groundedConsultingLookup(query, { domain: "Consulting" });
  if (!result.covered) return { example: null, image: null };

  const textIdx = result.chunks.findIndex(c => !c.hasDiagram);
  const diagramIdx = result.chunks.findIndex(c => c.hasDiagram);

  // grounded_example/grounded_image are jsonb (migration_011/019) - the
  // `citation` field below is new structure, not a new column. v1 rows have
  // no `citation` key at all, so the frontend can treat its absence as
  // "citation not available" without a schema change.
  return {
    example: textIdx >= 0
      ? {
          sourceFile: result.citations[textIdx].casebook,
          excerpt: result.chunks[textIdx].content,
          similarity: result.chunks[textIdx].similarity,
          citation: result.citations[textIdx]
        }
      : null,
    // url: null deliberately, not a bug - unlike v1 (document_chunks.image_url,
    // a raw Storage URL), this chunk carries no image_url at all: the real
    // rebuilt diagram lives in ingest_pages.diagrams (diagram-transcription
    // format), keyed by page, not on ingest_chunks. Joining that in and
    // rendering the structured block is R8's job ("render new diagram
    // types"), not R7's. Exposing a raw page image here would also violate
    // the diagram privacy rule (CLAUDE.md) even if the data were available.
    image: diagramIdx >= 0
      ? {
          url: null,
          caption: result.chunks[diagramIdx].content,
          sourceFile: result.citations[diagramIdx].casebook,
          similarity: result.chunks[diagramIdx].similarity,
          citation: result.citations[diagramIdx]
        }
      : null
  };
}

// filter_domain uses the same raw value stored on document_chunks.domain
// (e.g. "Prodman", "Marketing:Sales") - frameworks.domain is seeded with
// those exact values (see migration_019) specifically so no remapping layer
// is needed here.
async function findGrounding(fw) {
  if (CONSULTING_RAG_V2_ENABLED && fw.domain === "Consulting") {
    try {
      return await findGroundingV2(fw);
    } catch (err) {
      console.warn(`[frameworksGrounding] v2 lookup failed for "${fw.name}", falling back to v1: ${err.message}`);
      // Fall through to the v1 path below rather than surfacing nothing -
      // same resilience posture as the rest of this function.
    }
  }

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
