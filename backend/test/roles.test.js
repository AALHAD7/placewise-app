import { test } from "node:test";
import assert from "node:assert/strict";
import { ingestDomainForRole } from "../src/lib/roles.js";

// Covers the 7 mappable platform domains, the 3 unmapped ones (null -
// unfiltered, not a guess), and an unresolvable/free-text name - see the
// document_chunks.domain timeout fix (log.md) this guards against regressing.
test("ingestDomainForRole maps each covered platform domain to its ingest bucket", () => {
  assert.equal(ingestDomainForRole("Product Manager"), "Prodman");
  assert.equal(ingestDomainForRole("Consultant"), "Consulting");
  assert.equal(ingestDomainForRole("Investment Banking Associate"), "Finance");
  assert.equal(ingestDomainForRole("Marketing Manager"), "Marketing:Sales");
  assert.equal(ingestDomainForRole("Business Development Manager"), "Marketing:Sales");
  assert.equal(ingestDomainForRole("HR Business Partner"), "HR");
  assert.equal(ingestDomainForRole("Chief of Staff"), "General Management");
});

test("ingestDomainForRole returns null for platform domains with no ingested bucket", () => {
  assert.equal(ingestDomainForRole("Business Analyst"), null); // Data and Analytics
  assert.equal(ingestDomainForRole("Operations Manager"), null); // Operations and Supply Chain
  assert.equal(ingestDomainForRole("Technology Consultant"), null); // IT and Technology
});

test("ingestDomainForRole returns null for a name that doesn't resolve to a canonical role", () => {
  assert.equal(ingestDomainForRole("Some Made Up Title"), null);
  assert.equal(ingestDomainForRole(""), null);
  assert.equal(ingestDomainForRole(null), null);
});
