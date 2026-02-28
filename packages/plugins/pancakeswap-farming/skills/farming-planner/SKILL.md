---
name: farming-planner
description: Plan yield farming and CAKE staking on PancakeSwap. Use when user says "farm on pancakeswap", "stake CAKE", "yield farming", "syrup pool", "pancakeswap farm", "earn CAKE", "farm APR", "veCAKE", "harvest rewards", or describes wanting to earn yield on PancakeSwap without writing code.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(curl:*), Bash(jq:*), Bash(cast:*), Bash(xdg-open:*), Bash(open:*), WebFetch, WebSearch, Task(subagent_type:Explore), AskUserQuestion
model: sonnet
license: MIT
metadata:
  author: pancakeswap
  version: '1.0.0'
---

# PancakeSwap Farming Planner

Plan yield farming, CAKE staking, and reward harvesting on PancakeSwap by discovering active farms, comparing APR/APY, and generating deep links to the PancakeSwap farming interface.

## Overview

This skill **does not execute transactions** — it plans farming strategies. The output is a deep link URL that opens the PancakeSwap interface at the relevant farming or staking page, so the user can review and confirm in their own wallet.

**Key features:**
- **Farm discovery**: Find active farms via CampaignManager contract or PancakeSwap API
- **APR/APY comparison**: Fetch yield data and compare farming opportunities
- **CAKE staking**: Guide through CAKE staking options
- **Reward claiming**: Merkle-proof-based reward harvesting for Infinity farms
- **Deep link generation**: Pre-filled URLs to PancakeSwap farming UI
- **Multi-chain support**: BSC (primary), Ethereum, Arbitrum, Base

---

## Supported Chains

| Chain           | Chain ID | Farms Support    | Deep Link Key | Native Token |
| --------------- | -------- | ---------------- | ------------- | ------------ |
| BNB Smart Chain | 56       | V2, V3, Infinity | `bsc`         | BNB          |
| Ethereum        | 1        | V3               | `eth`         | ETH          |
| Arbitrum One    | 42161    | V3               | `arb`         | ETH          |
| Base            | 8453     | V3               | `base`        | ETH          |
| zkSync Era      | 324      | V3               | `zksync`      | ETH          |

---

## Contract Addresses

### Farming Contracts (BSC — Chain ID 56)

| Contract            | Address                                      | Purpose                              |
| ------------------- | -------------------------------------------- | ------------------------------------ |
| MasterChef v2       | `0xa5f8C5Dbd5F286960b9d90548680aE5ebFf07652` | V2 LP farm staking & CAKE rewards    |
| MasterChef v3       | `0x556B9306565093C855AEA9AE92A594704c2Cd59e` | V3 position farming & CAKE rewards   |
| CampaignManager     | `0x26Bde0AC5b77b65A402778448eCac2aCaa9c9115` | Infinity farm campaign registry      |
| Distributor         | `0xEA8620aAb2F07a0ae710442590D649ADE8440877` | Infinity farm CAKE reward claims     |
| CAKE Token          | `0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82` | CAKE ERC-20 token                    |

### veCAKE Contracts (BSC — Chain ID 56)

| Contract                    | Address                                      | Purpose                         |
| --------------------------- | -------------------------------------------- | ------------------------------- |
| veCAKE                      | `0x5692DB8177a81A6c6afc8084C2976C9933EC1bAB` | Vote-escrowed CAKE              |
| GaugeVoting                 | `0xf81953dC234cdEf1D6D0d3ef61b232C6bCbF9aeF` | Gauge vote allocation           |
| GaugeVotingCalc             | `0x94f8cba8712b3e72c9bf8ba4d6619ac9046fe695` | Gauge weight calculations       |
| RevenueSharingPool (weekly) | `0xCaF4e48a4Cb930060D0c3409F40Ae7b34d2AbE2D` | Weekly CAKE revenue distribution |
| RevenueSharingPool (veCAKE) | `0x9cac9745731d1Cf2B483f257745A512f0938DD01` | veCAKE emission rewards         |
| RevenueSharingGateway       | `0x011f2a82846a4E9c62C2FC4Fd6fDbad19147D94A` | Unified claiming gateway        |

---

## Farming Types

| Type            | Pool Version | How It Works                                                   | Reward   |
| --------------- | ------------ | -------------------------------------------------------------- | -------- |
| V2 Farms        | V2           | Stake LP tokens in MasterChef v2, earn CAKE per block          | CAKE     |
| V3 Farms        | V3           | Stake V3 NFT positions in MasterChef v3, earn CAKE per block   | CAKE     |
| Infinity Farms  | Infinity     | Provide liquidity, CAKE allocated per epoch (8h) via Merkle    | CAKE     |
| Syrup Pools     | —            | Stake CAKE to earn partner tokens or more CAKE                 | Various  |
| veCAKE Staking  | —            | Lock CAKE for veCAKE, earn revenue share + gauge voting power  | CAKE     |

---

## Workflow

```
1. Gather Intent        → What does the user want? (farm, stake CAKE, harvest)
2. Identify Farm Type   → V2, V3, Infinity, Syrup Pool, or veCAKE
3. Discover Farms       → Query active farms, APR data
4. Assess Opportunity   → Compare yields, IL risk, lock duration
5. Generate Deep Link   → Pre-filled PancakeSwap URL
6. Present Summary      → APR, risks, link for confirmation
```

---

## Step 1: Gather User Intent

Ask the user or infer from context:

| Question              | Why It Matters                                     |
| --------------------- | -------------------------------------------------- |
| What tokens do you hold? | Determines which farms are available             |
| How much to stake?    | Affects APR calculations and bCAKE boost           |
| Which chain?          | BSC has most farms; other chains have V3 only       |
| Risk tolerance?       | IL risk varies by pair volatility                   |
| Lock duration?        | veCAKE requires time lock for higher boost          |

---

## Step 2: Discover Active Farms

### Infinity Farms (recommended for new integrations)

#### Query the CampaignManager contract

```bash
# Get total number of farm campaigns
cast call 0x26Bde0AC5b77b65A402778448eCac2aCaa9c9115 \
  "campaignLength()(uint256)" \
  --rpc-url https://bsc-dataseed1.binance.org

# Get details for campaign ID 1
cast call 0x26Bde0AC5b77b65A402778448eCac2aCaa9c9115 \
  "campaignInfo(uint256)(address,bytes32,uint64,uint64,uint128,address,uint256)" 1 \
  --rpc-url https://bsc-dataseed1.binance.org
```

Response fields:
- `poolManager` — the Infinity pool manager contract
- `poolId` — the specific pool
- `startTime` — epoch start (unix seconds)
- `duration` — campaign length in seconds
- `rewardToken` — token distributed (usually CAKE)
- `totalRewardAmount` — total CAKE allocated

#### Monitor CampaignManager events

```solidity
event CampaignCreated(
    uint256 indexed campaignId,
    IPoolManager indexed poolManager,
    PoolId indexed poolId,
    uint64 startTime,
    uint64 duration,
    uint128 campaignType,
    IERC20 rewardToken,
    int256 totalRewardAmount
);

event CampaignStopped(
    uint256 indexed campaignId,
    uint128 newDuration,
    uint256 newTotalRewardAmount
);
```

### V3 Farms via MasterChef v3

```bash
# Get number of V3 farm pools
cast call 0x556B9306565093C855AEA9AE92A594704c2Cd59e \
  "poolLength()(uint256)" \
  --rpc-url https://bsc-dataseed1.binance.org
```

### Farm List via DeFi Aggregators

```bash
# DefiLlama — PancakeSwap pools with APY data
curl -s "https://yields.llama.fi/pools" | \
  jq '[.data[] | select(.project == "pancakeswap-amm-v3" or .project == "pancakeswap-amm") | {pool: .pool, symbol: .symbol, chain: .chain, tvl: .tvlUsd, apy: .apy}] | sort_by(-.apy) | .[0:20]'
```

---

## Step 3: Reward Epoch & Claiming (Infinity Farms)

Infinity farms distribute CAKE rewards every **8 hours** (epochs at 00:00, 08:00, 16:00 UTC). Rewards are proportional to the fees your LP generates relative to the pool's total fees.

### Fetch Merkle Proof for Claiming

```bash
# Replace with actual user address and current timestamp
USER_ADDRESS="0xYourAddress"
CURRENT_TS=$(date +%s)
CHAIN_ID=56

curl -s "https://infinity.pancakeswap.com/farms/users/${CHAIN_ID}/${USER_ADDRESS}/${CURRENT_TS}"
```

Response:
```json
{
  "rewards": [
    {
      "endBlock": "49740160",
      "epochEndTimestamp": 1747353600,
      "user": "0x...",
      "rewardTokenAddress": "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82",
      "totalRewardAmount": "678344590635830",
      "merkleRoot": "0x...",
      "proofs": ["0x...", "0x..."]
    }
  ]
}
```

### Claim Rewards

Call the Distributor contract with the Merkle proof:

```solidity
struct ClaimParams {
    address token;    // rewards[0].rewardTokenAddress
    uint256 amount;   // rewards[0].totalRewardAmount
    bytes32[] proof;  // rewards[0].proofs
}

// If user already claimed partial rewards (e.g. 10 of 20 CAKE),
// only the remaining unclaimed amount is distributed.
function claim(ClaimParams[] calldata claimParams) external;
```

```bash
# Example claim via cast
cast send 0xEA8620aAb2F07a0ae710442590D649ADE8440877 \
  "claim((address,uint256,bytes32[])[])" \
  "[($REWARD_TOKEN,$AMOUNT,[$PROOF1,$PROOF2,...])]" \
  --private-key $PRIVATE_KEY \
  --rpc-url https://bsc-dataseed1.binance.org
```

::: danger
Never use a mainnet private key in scripts or environment variables. Use hardware wallets or the PancakeSwap UI for mainnet transactions.
:::

---

## Step 4: veCAKE & Gauge Voting

### What is veCAKE?

Users lock CAKE for a period to receive veCAKE, which grants:
- **Gauge voting power** — direct CAKE emissions to preferred farms
- **Revenue sharing** — earn a portion of PancakeSwap protocol revenue
- **bCAKE boost** — up to 2.5x multiplier on farm APR

### veCAKE Deep Links

```
# Lock CAKE for veCAKE
https://pancakeswap.finance/cake-staking

# Gauge voting
https://pancakeswap.finance/gauges-voting
```

### bCAKE Farm Boost

The bCAKE boost multiplier depends on:
1. Your veCAKE balance relative to total veCAKE supply
2. Your staked liquidity relative to the pool's total liquidity

| veCAKE Holding | Typical Boost | Notes                    |
| -------------- | ------------- | ------------------------ |
| Small (<100)   | 1.0x–1.2x    | Minimal boost            |
| Medium (1K+)   | 1.2x–1.8x    | Noticeable APR increase  |
| Large (10K+)   | 1.8x–2.5x    | Near-maximum boost       |

**Maximum boost:** 2.5x for V2 farms, 2.0x for V3 positions.

---

## Step 5: Deep Link Generation

### Farm Pages

```
# All farms
https://pancakeswap.finance/farms

# Infinity pools & farms
https://pancakeswap.finance/liquidity/pools?type=1

# Specific V3 farm (by token pair)
https://pancakeswap.finance/farms?chain={chainKey}&token={tokenAddress}
```

### CAKE Staking Pages

```
# CAKE staking overview
https://pancakeswap.finance/cake-staking

# Syrup Pools (earn partner tokens)
https://pancakeswap.finance/pools
```

### Liquidity Addition (prerequisite for farming)

Before farming, users need LP tokens. Generate the appropriate liquidity deep link:

```
# V3 LP (required for V3 farms)
https://pancakeswap.finance/liquidity/add/v3/{tokenA}/{tokenB}?chain={chainKey}

# V2 LP (required for V2 farms)
https://pancakeswap.finance/liquidity/add/v2/{tokenA}/{tokenB}?chain={chainKey}

# Infinity LP (required for Infinity farms)
https://pancakeswap.finance/liquidity/add/infinity/{tokenA}/{tokenB}?chain={chainKey}
```

### Chain Keys

| Chain           | Key        |
| --------------- | ---------- |
| BNB Smart Chain | `bsc`      |
| Ethereum        | `eth`      |
| Arbitrum One    | `arb`      |
| Base            | `base`     |
| zkSync Era      | `zksync`   |

---

## Step 6: Present Summary

Always present a clear summary before the user acts:

```
## Farming Plan Summary

**Strategy:** Stake BNB-CAKE LP in V3 Farm
**Chain:** BNB Smart Chain
**Pool:** BNB / CAKE (0.25% fee tier)
**Farm APR:** ~45% (base) + up to 2x with bCAKE boost
**Reward:** CAKE (harvested manually or auto-compounded)

### Steps
1. Add liquidity → [Add BNB-CAKE V3 LP](https://pancakeswap.finance/liquidity/add/v3/BNB/0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82?chain=bsc)
2. Stake in farm → [BNB-CAKE Farm](https://pancakeswap.finance/farms?chain=bsc)
3. (Optional) Lock CAKE for bCAKE boost → [CAKE Staking](https://pancakeswap.finance/cake-staking)

### Risks
- Impermanent loss if BNB/CAKE price ratio changes significantly
- CAKE reward value depends on CAKE token price
- V3 positions require active range management
```

---

## Anti-Patterns

::: danger Never do these
1. **Never hardcode APR values** — APRs change every epoch; always fetch live data
2. **Never skip IL warnings** — always warn users about impermanent loss for volatile pairs
3. **Never assume farm availability** — farms can be stopped; always verify via CampaignManager
4. **Never expose private keys** — always use deep links for mainnet; scripts for testnet only
5. **Never ignore chain context** — V2 farms are BSC-only; other chains only have V3/Infinity
:::

---

## Token Addresses (Common Farm Pairs)

### BSC (Chain ID 56)

| Token  | Address                                      | Decimals |
| ------ | -------------------------------------------- | -------- |
| CAKE   | `0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82` | 18       |
| WBNB   | `0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c` | 18       |
| USDT   | `0x55d398326f99059fF775485246999027B3197955` | 18       |
| USDC   | `0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d` | 18       |
| BUSD   | `0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56` | 18       |
| ETH    | `0x2170Ed0880ac9A755fd29B2688956BD959F933F8` | 18       |
| BTCB   | `0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c` | 18       |

### Popular Farm Pairs (BSC)

| Pair         | Farm Type | Notes                              |
| ------------ | --------- | ---------------------------------- |
| CAKE / BNB   | V2, V3    | Flagship pair, highest CAKE rewards |
| CAKE / USDT  | V3        | Stable-side CAKE exposure           |
| BNB / USDT   | V3        | High-volume blue chip pair          |
| ETH / BNB    | V3        | Cross-asset pair                    |
| BTCB / BNB   | V3        | Bitcoin exposure on BSC             |
| USDT / USDC  | StableSwap| Minimal IL, lower yield             |

---

## Fetching APR Data

### Via DefiLlama API

```bash
# Get all PancakeSwap pool yields
curl -s "https://yields.llama.fi/pools" | \
  jq '[.data[] | select(.project == "pancakeswap-amm-v3") | select(.chain == "BSC") | {symbol: .symbol, tvl: .tvlUsd, apy: .apy, apyBase: .apyBase, apyReward: .apyReward}] | sort_by(-.apy) | .[0:10]'
```

Fields:
- `apyBase` — trading fee APY
- `apyReward` — CAKE farming reward APY
- `apy` — total (base + reward)
- `tvl` — total value locked in USD

### Via CoinGecko (CAKE price for reward valuation)

```bash
curl -s "https://api.coingecko.com/api/v3/simple/price?ids=pancakeswap-token&vs_currencies=usd"
```

---

## Decision Guide

| User Wants...                        | Recommend                                          |
| ------------------------------------ | -------------------------------------------------- |
| Passive CAKE yield, no IL            | CAKE staking (Syrup Pool) or veCAKE lock            |
| Highest APR, willing to manage       | V3 Farm with tight range + bCAKE boost              |
| Set-and-forget farming               | V2 Farm (full range, no rebalancing needed)         |
| Earn partner tokens                  | Syrup Pools                                         |
| Governance + revenue share           | veCAKE lock + gauge voting                          |
| New Infinity pools                   | Infinity Farms via CampaignManager                  |
| Stablecoin yield, minimal risk       | USDT-USDC StableSwap LP → farm                     |
