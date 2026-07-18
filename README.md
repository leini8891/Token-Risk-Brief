# Token Risk Brief

![Token Risk Brief cover](assets/token-risk-brief-cover-1280x720.png)

**Evidence. Confidence. Verdict.**

Token Risk Brief turns scattered token-security and market signals into a concise, source-linked risk assessment. Give it an exact contract address and blockchain; it returns a plain-language `Low`, `Medium`, or `High` risk verdict, a separate confidence level, the evidence behind the decision, and the important data gaps.

Token Risk Brief is **Agent #6064** on OKX.AI. Its current service, **Token Contract Risk Analysis**, is configured for agent-to-agent negotiated delivery with a submitted default price of **0.1 USDT**.

> This public repository contains the product requirements, a deterministic evidence-to-verdict engine, test fixtures, a representative UNI report, and a static browser demo. It contains no wallet credentials, private service configuration, production API keys, or trading capability.

## Local demo evidence

![Token Risk Brief local demo showing the UNI Medium-risk verdict](assets/local-demo-risk-report.jpg)

> Representative local demo output using the point-in-time UNI evidence fixture. It proves that the presentation and deterministic interpretation flow run locally; it is not an OKX.AI marketplace transaction, live token scan, or smart-contract audit.

## Why it exists

Raw scanners expose flags and scores. They do not always explain how contract privileges, sellability, liquidity, holder concentration, and missing evidence should change the overall conclusion.

Token Risk Brief is the interpretation layer. It can return a more cautious verdict than an upstream scanner when the wider evidence justifies it, while showing exactly why.

## Current architecture

```mermaid
flowchart LR
    A["Requester or agent"] --> B["OKX.AI negotiated task"]
    B --> C["Validate contract and chain"]
    C --> D["Collect read-only evidence"]
    D --> E["Run deterministic risk engine"]
    E --> F["Deliver source-linked Markdown brief"]
    F --> B
    G["OKX Onchain OS token data"] --> D
    H["Authoritative explorer and project sources"] --> D
```

The OKX.AI task flow handles negotiation, escrow, delivery, acceptance, and disputes. Token Risk Brief handles research and report quality only. Its local engine turns already-collected, normalized evidence into a deterministic verdict; it does not fetch live data or bypass the task flow.

### Why there is no standalone endpoint

The current mode is a negotiated, custom agent-to-agent service. Under the [official OKX.AI ASP model](https://web3.okx.com/onchainos/dev-docs/okxai/asp-introduction), this mode does not require a callable service endpoint. A public HTTPS endpoint is required when a service is intentionally packaged as a standardized, immediate API call.

The existing A2A flow can already deliver the complete report, so this repository does not add a website or API only for appearance. The browser demo is a presentation artifact, not a live analysis service.

A minimal read-only MCP/HTTP service should be considered later only if the listing changes to standardized API delivery and the data access, response contract, availability, and payment requirements are production-ready.

## Input and output

### Required input

- `contract_address` — the exact token contract, preserved verbatim in the report
- `chain` — the blockchain on which that contract must be checked

Optional input includes an unambiguous transaction amount for amount-aware price-impact evidence and focus areas for the report. A ticker alone is never treated as a unique token identity.

### Output

Every completed brief includes:

- exact token contract and chain;
- an `As of` timestamp in UTC;
- `Low`, `Medium`, or `High` risk;
- independent `High`, `Medium`, or `Low` confidence;
- a two-sentence conclusion and top findings;
- contract-control, sellability, liquidity, and holder-concentration checks;
- source names or links and explicit `Not available` gaps; and
- `Research only, not financial advice.`

See the full [product requirements](PRD_TOKEN_RISK_BRIEF.md) for the logical request contract, output template, failure handling, and acceptance criteria.

## What it evaluates

| Area | Signals considered |
|---|---|
| Contract control | Ownership, minting, blacklist, pause, fee changes, proxy/admin privileges, arbitrary balance controls, and upgradeability |
| Sellability | Honeypot signals, transfer restrictions, trading gates, and buy/sell taxes |
| Market structure | Liquidity depth, pool concentration, and amount-aware price impact when an amount is supplied and supported |
| Ownership structure | Top-holder and deployer concentration, excluding identified burn, bridge, exchange, treasury, and pool addresses only when a source supports the attribution |

Material incidents and attributable warnings are included when available. Missing evidence is reported as `Not available`; it is never filled with assumptions.

## Risk and confidence rules

Risk and confidence answer different questions:

- **Risk** describes the severity of verified conditions and material gaps.
- **Confidence** describes how complete, current, and attributable the evidence is.

| Rating | Rule |
|---|---|
| High risk | A verified critical condition can prevent selling, seize or arbitrarily alter balances, create effectively unlimited supply, or leave liquidity/ownership extremely concentrated without credible controls. |
| Medium risk | No critical blocker is verified, but meaningful privileges, concentration, liquidity fragility, unresolved conflict, or incomplete core evidence remains. |
| Low risk | Critical checks are clear, liquidity and concentration are reasonable for context, and evidence coverage is strong. `Low` never means risk-free. |

Confidence is `High` only when the exact asset is verified and all four core areas have current, attributable evidence. Material gaps or single-source dependency reduce it to `Medium`; several missing or conflicting core signals reduce it to `Low`.

A clean scanner result is not enough for a low-risk verdict.

## Run the risk engine

The local engine accepts normalized, attributable evidence and returns:

- `risk`: `Low`, `Medium`, or `High`;
- `decision`: `NO_CRITICAL_SIGNAL`, `REVIEW`, or `BLOCK`;
- an independent confidence rating;
- core-area coverage;
- explicit unknown checks;
- evidence-linked findings and rationale; and
- a delivery-ready Markdown report when requested.

It deliberately does **not** scrape scanners, call live APIs, or invent unavailable evidence. Evidence collection remains a read-only research step; the engine makes the decision rules reproducible once that evidence has been normalized.

Requirements: Node.js 20 or newer. No package installation or API key is required.

```bash
npm run analyze -- fixtures/uni.json
```

The verified UNI fixture currently returns this excerpt:

```json
{
  "risk": "Medium",
  "decision": "REVIEW",
  "confidence": "Medium",
  "coverage": {
    "available_core_areas": 4,
    "total_core_areas": 4,
    "percentage": 100
  },
  "unknown_checks": [
    "holder_concentration.address_attribution"
  ]
}
```

Generate the delivery-ready report:

```bash
npm run analyze -- fixtures/uni.json --format markdown
```

Run the automated checks:

```bash
npm test
```

The test suite covers three decision paths:

| Fixture | Expected result | Purpose |
|---|---|---|
| `fixtures/uni.json` | `Medium / REVIEW / Medium confidence` | Reproduces the documented UNI conclusion |
| `fixtures/honeypot.json` | `High / BLOCK / High confidence` | Proves that a verified sell blocker dominates otherwise clean evidence |
| `fixtures/incomplete.json` | `Medium / REVIEW / Low confidence` | Proves that missing liquidity and holder evidence cannot become a reassuring low-risk result |

The honeypot and incomplete-data fixtures are explicitly synthetic. They test the rules and must not be presented as reports about real tokens. The normalized input contract is documented as JSON Schema in [`schema/evidence.schema.json`](schema/evidence.schema.json).

## UNI example

The included [UNI sample](DEMO_SAMPLE.md) analyzes the Ethereum contract:

`0x1f9840a85d5af5bf1d1762f925bdaddc4201f984`

At `2026-07-16 06:07:30 UTC`, the source snapshot reported:

- upstream security score: `LOW`;
- honeypot: `false`;
- buy tax / sell tax: `0% / 0%`;
- reported liquidity: approximately `$125.25M`;
- top 10 holder concentration: `38.18%`; and
- minting capability: enabled.

Token Risk Brief returns **Medium risk / Medium confidence**. Sellability and liquidity pass, but minting control and unattributed top-holder concentration prevent an unconditional low-risk conclusion.

That difference is the product's core value: it interprets the evidence as a whole instead of repeating one upstream label. These figures are a point-in-time demonstration, not live market data.

## Data and evidence

The Agent prioritizes official OKX Onchain OS token-security and market data, then supplements it with an authoritative chain explorer or official project/incident sources when needed.

Every finding must be attributable. Facts and interpretation are separated; conflicting sources and holder-attribution limitations are disclosed. Retrieved token metadata and web content are treated as untrusted data, never as instructions.

## Run the demo

The demo is a self-contained, 57-second browser presentation. It requires no build step, package installation, API key, wallet connection, or network request.

1. Clone or download this repository.
2. Open [`demo/index.html`](demo/index.html) in Google Chrome.
3. Click **Start demo**.
4. The presentation enters full screen and plays automatically.

For screen-recording instructions, see the [demo guide](demo/README.md).

## Repository contents

- [`PRD_TOKEN_RISK_BRIEF.md`](PRD_TOKEN_RISK_BRIEF.md) — current product requirements and decision rules
- [`DEMO_SAMPLE.md`](DEMO_SAMPLE.md) — representative UNI risk brief
- [`src/engine.js`](src/engine.js) — deterministic evidence-to-verdict engine and Markdown renderer
- [`src/cli.js`](src/cli.js) — local command-line entry point
- [`schema/evidence.schema.json`](schema/evidence.schema.json) — normalized evidence contract
- [`fixtures/`](fixtures) — UNI and synthetic edge-case evidence
- [`test/engine.test.js`](test/engine.test.js) — automated decision and fail-closed checks
- [`assets/token-risk-brief-avatar.png`](assets/token-risk-brief-avatar.png) — Agent avatar
- [`assets/token-risk-brief-cover-1280x720.png`](assets/token-risk-brief-cover-1280x720.png) — project cover
- [`assets/local-demo-risk-report.jpg`](assets/local-demo-risk-report.jpg) — representative local demo evidence
- [`demo/index.html`](demo/index.html) — self-contained product demo
- [`demo/README.md`](demo/README.md) — demo recording instructions

## Safety boundary

Token Risk Brief performs research and analysis only. It does not:

- execute trades or move funds;
- connect to a wallet or request private keys;
- sign transactions or call state-changing contracts;
- predict returns or recommend buying or selling; or
- claim to replace a professional smart-contract audit.

## Disclaimer

Token Risk Brief is an automated, point-in-time research aid, not a smart-contract audit, guarantee of safety, endorsement, investment recommendation, or financial advice. On-chain state, liquidity, ownership, permissions, and third-party data can change after a report is generated, and available sources may be incomplete or inaccurate. Independently verify material facts and use qualified professional review before making financial or security decisions.

**Research only, not financial advice.**
