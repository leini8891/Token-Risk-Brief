import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { analyzeEvidence, renderMarkdown, validateEvidence } from "../src/engine.js";

async function fixture(name) {
  return JSON.parse(await readFile(new URL(`../fixtures/${name}.json`, import.meta.url), "utf8"));
}

test("UNI fixture returns Medium risk, REVIEW, and Medium confidence", async () => {
  const result = analyzeEvidence(await fixture("uni"));

  assert.equal(result.verdict.risk, "Medium");
  assert.equal(result.verdict.decision, "REVIEW");
  assert.equal(result.verdict.confidence, "Medium");
  assert.equal(result.verdict.coverage.percentage, 100);
  assert.deepEqual(result.verdict.unknown_checks, [
    "holder_concentration.address_attribution",
  ]);
  assert.equal(result.checks.contract_control.result, "Warning");
  assert.equal(result.checks.sellability.result, "Pass");
  assert.equal(result.checks.liquidity.result, "Pass");
  assert.equal(result.checks.holder_concentration.result, "Warning");
});

test("verified sell blocker returns High risk and BLOCK", async () => {
  const result = analyzeEvidence(await fixture("honeypot"));

  assert.equal(result.verdict.risk, "High");
  assert.equal(result.verdict.decision, "BLOCK");
  assert.equal(result.verdict.confidence, "High");
  assert.equal(result.verdict.coverage.percentage, 100);
  assert.deepEqual(result.verdict.unknown_checks, []);
  assert.equal(result.checks.sellability.result, "Critical");
});

test("incomplete evidence cannot produce a low-risk result", async () => {
  const result = analyzeEvidence(await fixture("incomplete"));

  assert.equal(result.verdict.risk, "Medium");
  assert.equal(result.verdict.decision, "REVIEW");
  assert.equal(result.verdict.confidence, "Low");
  assert.equal(result.verdict.coverage.percentage, 50);
  assert.ok(result.verdict.unknown_checks.includes("liquidity.depth"));
  assert.ok(result.verdict.unknown_checks.includes("holder_concentration.top_holders"));
  assert.equal(result.checks.liquidity.result, "Not available");
  assert.equal(result.checks.holder_concentration.result, "Not available");
  assert.match(result.top_findings[0].summary, /^Evidence gap:/);
});

test("markdown renderer produces a delivery-ready report", async () => {
  const result = analyzeEvidence(await fixture("uni"));
  const markdown = renderMarkdown(result);

  assert.match(markdown, /# Token Risk Brief/);
  assert.match(markdown, /\*\*Risk:\*\* Medium/);
  assert.match(markdown, /\*\*Decision:\*\* REVIEW/);
  assert.match(markdown, /\*\*Confidence:\*\* Medium/);
  assert.match(markdown, /holder_concentration\.address_attribution/);
  assert.match(markdown, /Research only, not financial advice\./);
});

test("invalid asset identity fails closed", async () => {
  const input = await fixture("uni");
  input.asset.identity_verified = false;

  assert.throws(
    () => validateEvidence(input),
    /identity_verified must be true before a verdict can be issued/,
  );
});

test("evidence schema is valid JSON", async () => {
  const schema = JSON.parse(
    await readFile(new URL("../schema/evidence.schema.json", import.meta.url), "utf8"),
  );

  assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
  assert.equal(schema.properties.schema_version.const, "1.0");
});
