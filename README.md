# Token Risk Brief

![Token Risk Brief cover](assets/token-risk-brief-cover-1280x720.png)

**Evidence. Confidence. Verdict.**

Token Risk Brief turns scattered token-security and market signals into a concise, source-linked risk assessment. Give it a contract address and blockchain; it returns a plain-language `Low`, `Medium`, or `High` risk verdict, a confidence level, the evidence behind the decision, and any important data gaps.

Token Risk Brief is **Agent #6064** on OKX.AI. It is designed for people and AI agents that need an interpretation layer rather than another unexplained scanner score.

> This public repository contains the product overview, a representative UNI report, and the static demo. It does not contain wallet credentials, private service configuration, or the production Agent implementation.

## What it evaluates

Token Risk Brief organizes read-only evidence into four decision areas:

| Area | Signals considered |
|---|---|
| Contract control | Ownership, minting, blacklist, pause, fee changes, proxy or admin privileges, and upgradeability |
| Sellability | Honeypot signals, transfer restrictions, trading gates, and buy or sell taxes |
| Market structure | Liquidity depth, pool concentration, and amount-aware price impact when a transaction amount is provided |
| Ownership structure | Top-holder and deployer concentration, excluding identified burn, bridge, exchange, and pool addresses where the source supports that attribution |

Material incidents and attributable warnings are included when available. Missing evidence is reported as `Not available`; it is never filled with assumptions.

## How it works

1. **Identify the asset precisely.** The contract address and blockchain are required. A ticker alone is never treated as a unique token identity.
2. **Collect current, read-only evidence.** The Agent prioritizes official OKX Onchain OS token-security and market data, with authoritative explorer or project sources used when needed.
3. **Normalize the signals.** Raw permissions, sellability checks, liquidity data, holder data, source timestamps, and evidence gaps are grouped into a consistent report structure.
4. **Apply evidence-led risk rules.** The verdict is based on verified findings and coverage, not popularity, token price direction, or a single upstream scanner score.
5. **Explain the result.** Every brief provides a risk level, confidence level, top findings, check-by-check evidence, sources, and an `As of` timestamp.

The Agent performs research and analysis only. It does not execute trades, move funds, sign wallet transactions, or predict returns.

## Risk rules

- **High risk:** A verified critical condition can prevent selling, seize or arbitrarily alter balances, create unlimited supply, or leaves liquidity or ownership extremely concentrated without credible controls.
- **Medium risk:** Meaningful centralized privileges, concentration, liquidity fragility, or incomplete evidence remains, but no verified critical blocker is present.
- **Low risk:** Critical checks are clear, liquidity and concentration are reasonable for the token's context, and evidence coverage is strong. `Low` never means risk-free.

Confidence is rated separately as `High`, `Medium`, or `Low` to reflect evidence coverage and quality. A clean scanner result is not sufficient on its own for a low-risk verdict.

## UNI example

The included [UNI sample](DEMO_SAMPLE.md) analyzes the Ethereum contract:

`0x1f9840a85d5af5bf1d1762f925bdaddc4201f984`

In the sample snapshot, the upstream security scan reports `LOW`, with no honeypot signal, 0% buy and sell taxes, and approximately $125.25M in reported liquidity. Token Risk Brief returns **Medium risk / Medium confidence** because minting capability remains enabled and the top 10 addresses hold 38.18% of supply.

That difference is the product's core value: it interprets the evidence as a whole and explains why an apparently clean scanner result may still require caution. The figures are a point-in-time demonstration, not live market data.

## Run the demo

The demo is a self-contained, 57-second browser presentation. It requires no build step, package installation, API key, or wallet connection.

1. Clone or download this repository.
2. Open [`demo/index.html`](demo/index.html) in Google Chrome.
3. Click **Start demo**.
4. The presentation enters full screen and plays automatically.

For screen-recording instructions, see the [demo guide](demo/README.md).

## Repository contents

- [`DEMO_SAMPLE.md`](DEMO_SAMPLE.md) — representative UNI risk brief
- [`assets/token-risk-brief-avatar.png`](assets/token-risk-brief-avatar.png) — Agent avatar
- [`assets/token-risk-brief-cover-1280x720.png`](assets/token-risk-brief-cover-1280x720.png) — project cover
- [`demo/index.html`](demo/index.html) — self-contained product demo
- [`demo/README.md`](demo/README.md) — demo recording instructions

## Disclaimer

Token Risk Brief is an automated, point-in-time research aid, not a smart-contract audit, guarantee of safety, endorsement, investment recommendation, or financial advice. On-chain state, liquidity, ownership, permissions, and third-party data can change after a report is generated, and available sources may be incomplete or inaccurate. Independently verify material facts and use qualified professional review before making financial or security decisions.

**Research only, not financial advice.**
