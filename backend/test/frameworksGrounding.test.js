// Regression test for the image_url RPC-drop bug found after R7:
// migration_037's drop/recreate of match_document_chunks (to add the
// is_active filter) accidentally stopped returning `image_url`, so every
// row frameworksGrounding.js's v1 `findGrounding` path received had
// image_url === undefined - topImage never matched, grounded_image stayed
// null for every live Frameworks lookup, no error ever thrown. Fixed by
// migration_043 (restores image_url to the RPC's return columns). This
// test pins the JS-side contract: *given* rows that do carry image_url (the
// shape match_document_chunks is meant to return), pickTopTextAndImage must
// actually find the image row. It can't see the DB-side regression itself
// (that's a SQL function definition, not JS), but it would catch any future
// JS-side regression in the same row-picking logic, and documents exactly
// what "fixed" looks like from the call site.
import { test } from "node:test";
import assert from "node:assert/strict";
import { pickTopTextAndImage } from "../src/lib/frameworksGrounding.js";

test("pickTopTextAndImage: finds the image row when image_url is present and above its threshold", () => {
  const rows = [
    { content: "a plain excerpt", similarity: 0.9, image_url: null, source_file: "a.pdf" },
    {
      content: "a diagram caption",
      similarity: 0.9,
      image_url: "https://storage.example/casebook-images/foo.png",
      source_file: "b.pdf"
    }
  ];
  const { topText, topImage } = pickTopTextAndImage(rows);
  assert.equal(topText.content, "a plain excerpt");
  assert.equal(topImage.content, "a diagram caption");
  assert.equal(topImage.image_url, "https://storage.example/casebook-images/foo.png");
});

test("pickTopTextAndImage: an image row below the image threshold is not picked (even if above the text one)", () => {
  // Mirrors the real thresholds: SIMILARITY_THRESHOLD 0.5, IMAGE_SIMILARITY_THRESHOLD 0.58.
  const rows = [{ content: "weak image match", similarity: 0.52, image_url: "https://x/y.png" }];
  const { topImage } = pickTopTextAndImage(rows);
  assert.equal(topImage, undefined);
});

test("pickTopTextAndImage: this is exactly what broke - rows missing image_url never produce a topImage", () => {
  // Simulates the pre-migration_043 RPC output: no image_url column at all,
  // so every row's image_url is undefined, same as a JS object literal that
  // never sets the key.
  const rows = [{ content: "a diagram caption with no image_url column", similarity: 0.95 }];
  const { topImage } = pickTopTextAndImage(rows);
  assert.equal(topImage, undefined);
});

test("pickTopTextAndImage: empty rows never throws and returns undefined for both", () => {
  const { topText, topImage } = pickTopTextAndImage([]);
  assert.equal(topText, undefined);
  assert.equal(topImage, undefined);
});
