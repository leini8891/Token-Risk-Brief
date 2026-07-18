const CORE_AREAS = [
  "contract_control",
  "sellability",
  "liquidity",
  "holder_concentration",
];

const AREA_LABELS = {
  contract_control: "Contract control",
  sellability: "Sellability",
  liquidity: "Liquidity",
  holder_concentration: "Holder concentration",
};

const SEVERITY_ORDER = {
  critical: 0,
  warning: 1,
  unknown: 2,
  pass: 3,
};

const DISCLAIMER = "Research only, not financial advice.";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function assertString(value, path) {
  assert(typeof value === "string" && value.trim().length > 0, `${path} must be a non-empty string`);
}

function assertTimestamp(value, path) {
  assertString(value, path);
  assert(Number.isFinite(Date.parse(value)), `${path} must be a valid timestamp`);
}

function unique(values) {
  return [...new Set(values)];
}

function validateAddress(address) {
  if (address.startsWith("0x")) {
    assert(/^0x[0-9a-fA-F]{40}$/.test(address), "asset.contract_address must be a valid EVM address");
  }
}

function validateFinding(finding, path, sourceIds) {
  assert(isObject(finding), `${path} must be an object`);
  assertString(finding.id, `${path}.id`);
  assertString(finding.summary, `${path}.summary`);
  assert(
    ["pass", "warning", "critical"].includes(finding.severity),
    `${path}.severity must be pass, warning, or critical`,
  );
  assert(typeof finding.verified === "boolean", `${path}.verified must be a boolean`);
  assert(Array.isArray(finding.source_ids), `${path}.source_ids must be an array`);

  if (finding.verified) {
    assert(finding.source_ids.length > 0, `${path}.source_ids must cite at least one source`);
  }

  for (const sourceId of finding.source_ids) {
    assertString(sourceId, `${path}.source_ids[]`);
    assert(sourceIds.has(sourceId), `${path} references unknown source "${sourceId}"`);
  }
}

export function validateEvidence(input) {
  assert(isObject(input), "input must be an object");
  assert(input.schema_version === "1.0", 'schema_version must be "1.0"');
  assert(isObject(input.asset), "asset must be an object");
  assertString(input.asset.contract_address, "asset.contract_address");
  assertString(input.asset.chain, "asset.chain");
  assert(
    input.asset.identity_verified === true,
    "asset.identity_verified must be true before a verdict can be issued",
  );
  validateAddress(input.asset.contract_address);
  assertTimestamp(input.as_of, "as_of");

  assert(Array.isArray(input.sources) && input.sources.length > 0, "sources must contain at least one source");
  const sourceIds = new Set();
  input.sources.forEach((source, index) => {
    const path = `sources[${index}]`;
    assert(isObject(source), `${path} must be an object`);
    assertString(source.id, `${path}.id`);
    assert(!sourceIds.has(source.id), `${path}.id must be unique`);
    sourceIds.add(source.id);
    assertString(source.name, `${path}.name`);
    assertTimestamp(source.retrieved_at, `${path}.retrieved_at`);
    if (source.url !== undefined) {
      assertString(source.url, `${path}.url`);
      assert(/^https:\/\//.test(source.url), `${path}.url must use https`);
    }
  });

  assert(isObject(input.areas), "areas must be an object");
  for (const areaName of CORE_AREAS) {
    const area = input.areas[areaName];
    const path = `areas.${areaName}`;
    assert(isObject(area), `${path} must be an object`);
    assert(
      ["available", "not_available"].includes(area.status),
      `${path}.status must be available or not_available`,
    );
    assert(Array.isArray(area.unknown_checks), `${path}.unknown_checks must be an array`);
    area.unknown_checks.forEach((item, index) => assertString(item, `${path}.unknown_checks[${index}]`));

    if (area.status === "available") {
      assert(Array.isArray(area.findings) && area.findings.length > 0, `${path}.findings must not be empty`);
      area.findings.forEach((finding, index) =>
        validateFinding(finding, `${path}.findings[${index}]`, sourceIds),
      );
    } else {
      assertString(area.reason, `${path}.reason`);
      assert(
        !Array.isArray(area.findings) || area.findings.length === 0,
        `${path}.findings must be empty when status is not_available`,
      );
    }
  }

  if (input.limitations !== undefined) {
    assert(Array.isArray(input.limitations), "limitations must be an array");
    input.limitations.forEach((limitation, index) => {
      const path = `limitations[${index}]`;
      assert(isObject(limitation), `${path} must be an object`);
      assert(
        ["conflict", "stale", "single_source_dependency", "attribution_gap", "other"].includes(
          limitation.type,
        ),
        `${path}.type is not supported`,
      );
      assertString(limitation.summary, `${path}.summary`);
      if (limitation.area !== undefined) {
        assert(CORE_AREAS.includes(limitation.area), `${path}.area must be a core area`);
      }
    });
  }

  return input;
}

function collectFindings(input) {
  return CORE_AREAS.flatMap((areaName) => {
    const area = input.areas[areaName];
    if (area.status !== "available") {
      return [];
    }
    return area.findings.map((finding) => ({
      ...finding,
      area: areaName,
      area_label: AREA_LABELS[areaName],
    }));
  });
}

function collectUnknownChecks(input, findings) {
  const missingAreas = CORE_AREAS.filter((areaName) => input.areas[areaName].status === "not_available");
  const missingAreasWithoutDetail = missingAreas.filter(
    (areaName) => input.areas[areaName].unknown_checks.length === 0,
  );
  const explicitUnknowns = CORE_AREAS.flatMap((areaName) => input.areas[areaName].unknown_checks);
  const unverifiedFindings = findings
    .filter((finding) => !finding.verified)
    .map((finding) => `${finding.area}.${finding.id}`);

  return unique([...missingAreasWithoutDetail, ...explicitUnknowns, ...unverifiedFindings]);
}

function confidenceFor({ missingAreas, unknownChecks, limitations }) {
  const materialConflict = limitations.some(
    (limitation) => limitation.type === "conflict" || limitation.type === "stale",
  );

  if (missingAreas.length >= 2 || unknownChecks.length >= 2 || materialConflict) {
    return "Low";
  }
  if (missingAreas.length === 1 || unknownChecks.length === 1 || limitations.length > 0) {
    return "Medium";
  }
  return "High";
}

function riskFor({ verifiedFindings, coveragePercentage, unknownChecks }) {
  if (verifiedFindings.some((finding) => finding.severity === "critical")) {
    return "High";
  }
  if (
    verifiedFindings.some((finding) => finding.severity === "warning") ||
    coveragePercentage < 100 ||
    unknownChecks.length > 0
  ) {
    return "Medium";
  }
  return "Low";
}

function decisionFor(risk) {
  if (risk === "High") {
    return "BLOCK";
  }
  if (risk === "Medium") {
    return "REVIEW";
  }
  return "NO_CRITICAL_SIGNAL";
}

function checkResult(area, findings) {
  if (area.status === "not_available") {
    return "Not available";
  }
  if (findings.some((finding) => finding.verified && finding.severity === "critical")) {
    return "Critical";
  }
  if (
    findings.some((finding) => finding.verified && finding.severity === "warning") ||
    findings.every((finding) => !finding.verified)
  ) {
    return "Warning";
  }
  return "Pass";
}

function buildRationale({ risk, decision, confidence, coverage, verifiedFindings, unknownChecks }) {
  const critical = verifiedFindings.find((finding) => finding.severity === "critical");
  const warning = verifiedFindings.find((finding) => finding.severity === "warning");

  let riskReason;
  if (critical) {
    riskReason = `${decision}: a verified critical condition was found — ${critical.summary}`;
  } else if (warning) {
    riskReason = `${decision}: no critical blocker was verified, but review is required — ${warning.summary}`;
  } else if (unknownChecks.length > 0) {
    riskReason = `${decision}: incomplete evidence prevents a low-risk conclusion.`;
  } else {
    riskReason = `${decision}: all four core areas are covered and no verified critical or warning finding was provided.`;
  }

  const confidenceReason =
    unknownChecks.length > 0
      ? `Confidence is ${confidence} with ${coverage.percentage}% core-area coverage and unresolved checks: ${unknownChecks.join(", ")}.`
      : `Confidence is ${confidence} with ${coverage.percentage}% core-area coverage and no unresolved core checks.`;

  return [riskReason, confidenceReason];
}

function buildTopFindings(verifiedFindings, unknownChecks) {
  const candidates = [
    ...verifiedFindings.map((finding) => ({
      area: finding.area,
      severity: finding.severity,
      summary: finding.summary,
      source_ids: finding.source_ids,
    })),
    ...unknownChecks.map((unknownCheck) => ({
      area: unknownCheck.split(".")[0],
      severity: "unknown",
      summary: `Evidence gap: ${unknownCheck}`,
      source_ids: [],
    })),
  ];
  const ranked = candidates.sort((left, right) => {
    const severityDifference = SEVERITY_ORDER[left.severity] - SEVERITY_ORDER[right.severity];
    if (severityDifference !== 0) {
      return severityDifference;
    }
    return CORE_AREAS.indexOf(left.area) - CORE_AREAS.indexOf(right.area);
  });

  return ranked.slice(0, 3);
}

export function analyzeEvidence(rawInput) {
  const input = validateEvidence(rawInput);
  const findings = collectFindings(input);
  const verifiedFindings = findings.filter((finding) => finding.verified);
  const missingAreas = CORE_AREAS.filter((areaName) => input.areas[areaName].status === "not_available");
  const unknownChecks = collectUnknownChecks(input, findings);
  const limitations = input.limitations ?? [];
  const availableAreas = CORE_AREAS.length - missingAreas.length;
  const coverage = {
    available_core_areas: availableAreas,
    total_core_areas: CORE_AREAS.length,
    percentage: Math.round((availableAreas / CORE_AREAS.length) * 100),
  };
  const confidence = confidenceFor({ missingAreas, unknownChecks, limitations });
  const risk = riskFor({
    verifiedFindings,
    coveragePercentage: coverage.percentage,
    unknownChecks,
  });
  const decision = decisionFor(risk);

  const checks = Object.fromEntries(
    CORE_AREAS.map((areaName) => {
      const area = input.areas[areaName];
      const areaFindings = findings.filter((finding) => finding.area === areaName);
      return [
        areaName,
        {
          label: AREA_LABELS[areaName],
          result: checkResult(area, areaFindings),
          evidence:
            area.status === "not_available"
              ? [area.reason]
              : areaFindings.map((finding) => finding.summary),
        },
      ];
    }),
  );

  return {
    engine_version: "1.0.0",
    asset: input.asset,
    as_of: input.as_of,
    verdict: {
      risk,
      decision,
      confidence,
      coverage,
      unknown_checks: unknownChecks,
      rationale: buildRationale({
        risk,
        decision,
        confidence,
        coverage,
        verifiedFindings,
        unknownChecks,
      }),
    },
    top_findings: buildTopFindings(verifiedFindings, unknownChecks),
    checks,
    limitations,
    sources: input.sources,
    disclaimer: DISCLAIMER,
  };
}

function escapeTableCell(value) {
  return value.replaceAll("|", "\\|").replaceAll("\n", " ");
}

export function renderMarkdown(result) {
  const tokenLabel = [result.asset.name, result.asset.symbol && `(${result.asset.symbol})`]
    .filter(Boolean)
    .join(" ");
  const findings = result.top_findings
    .map((finding, index) => `${index + 1}. ${finding.summary}`)
    .join("\n");
  const checkRows = CORE_AREAS.map((areaName) => {
    const check = result.checks[areaName];
    return `| ${check.label} | ${check.result} | ${escapeTableCell(check.evidence.join(" "))} |`;
  }).join("\n");
  const sourceRows = result.sources
    .map((source) => `- ${source.url ? `[${source.name}](${source.url})` : source.name}`)
    .join("\n");
  const unknownSection =
    result.verdict.unknown_checks.length > 0
      ? `\n## Unknown checks\n\n${result.verdict.unknown_checks.map((item) => `- ${item}`).join("\n")}\n`
      : "";

  return `# Token Risk Brief

**Token:** ${tokenLabel || "Not available"}
**Contract:** \`${result.asset.contract_address}\`
**Chain:** ${result.asset.chain}
**As of:** ${result.as_of}

## Verdict

**Risk:** ${result.verdict.risk}
**Decision:** ${result.verdict.decision}
**Confidence:** ${result.verdict.confidence}
**Coverage:** ${result.verdict.coverage.percentage}% (${result.verdict.coverage.available_core_areas}/${result.verdict.coverage.total_core_areas} core areas)

${result.verdict.rationale.join(" ")}

## Top findings

${findings}

## Checks

| Area | Result | Evidence |
|---|---|---|
${checkRows}
${unknownSection}
## Sources

${sourceRows}

${result.disclaimer}
`;
}

export { CORE_AREAS, DISCLAIMER };
