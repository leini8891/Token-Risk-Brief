# Token Risk Brief

**Token:** Uniswap (UNI)

**Contract:** `0x1f9840a85d5af5bf1d1762f925bdaddc4201f984`

**Chain:** Ethereum

**As of:** 2026-07-16 06:07:30 UTC

## Verdict

**Risk:** Medium

**Confidence:** Medium

UNI is sellable and has substantial liquidity, with no honeypot or transfer-tax signal in the current scan. The result is not an unconditional “safe” rating: minting remains enabled and the top 10 addresses hold 38.18% of supply, so privilege and concentration deserve review before a large transaction.

## Top findings

1. **No immediate sellability blocker:** honeypot=false, buy tax=0%, sell tax=0%, and the security scanner returned `LOW`.
2. **Meaningful concentration:** the top 10 addresses hold 38.18% of supply. Some may be governance, exchange, treasury, bridge, or liquidity contracts; address-level attribution was not included in this snapshot.
3. **Minting capability remains present:** `isMintable=true`. This is a governance/control signal, not proof of malicious issuance, but it prevents an unconditional low-risk verdict without reviewing the controlling mechanism.

## Checks

| Area | Result | Evidence |
|---|---|---|
| Contract control | Warning | Minting capability reported as enabled; contract is open source. |
| Sellability | Pass | No honeypot signal; 0% buy and sell taxes reported. |
| Liquidity | Pass | Approximately $125.25M reported liquidity. |
| Holder concentration | Warning | Top 10 addresses hold 38.18%; 386,072 holders reported. |

## Market context

- Price: approximately $3.684
- Market cap: approximately $3.68B
- 24h DEX volume: approximately $7.95M
- 24h price change: -0.12%
- Community-recognized: yes; this is an identity signal, not a safety guarantee.

## Sources

- OKX Onchain OS token report: token metadata, market data, advanced risk metadata, and security scan.
- [OKX Ethereum explorer](https://web3.okx.com/explorer/ethereum/token/0x1f9840a85d5af5bf1d1762f925bdaddc4201f984)

Research only, not financial advice.
