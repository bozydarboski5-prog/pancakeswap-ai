---
name: farming-planner
description: Plan yield farming and CAKE staking on PancakeSwap. Use when user says "farm on pancakeswap", "stake CAKE", "unstake CAKE", "stake LP", "unstake LP", "yield farming", "syrup pool", "pancakeswap farm", "earn CAKE", "farm APR", "veCAKE", "harvest rewards", "deposit LP", "withdraw LP", or describes wanting to stake, unstake, or earn yield on PancakeSwap.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(curl:*), Bash(jq:*), Bash(cast:*), Bash(python3:*), Bash(node:*), Bash(xdg-open:*), Bash(open:*), WebFetch, WebSearch, Task(subagent_type:Explore), AskUserQuestion
model: sonnet
license: MIT
metadata:
  author: pancakeswap
  version: '1.1.0'
---

# PancakeSwap Farming Planner

Plan yield farming, CAKE staking, and reward harvesting on PancakeSwap by discovering active farms, comparing APR/APY, and generating deep links to the PancakeSwap farming interface.

## Overview

This skill **does not execute transactions** — it plans farming strategies. The output is a deep link URL that opens the PancakeSwap interface at the relevant farming or staking page, so the user can review and confirm in their own wallet.

## Decision Guide — Read First

Route to the correct section based on what the user wants:

| User Says...                                    | Go To Section         | Primary Output                   |
| ----------------------------------------------- | --------------------- | -------------------------------- |
| "best farms" / "highest APR" / "discover farms" | Farm Discovery        | Table with APY + deep links      |
| "stake LP" / "deposit LP into farm"             | Stake LP Tokens       | Deep link + cast examples        |
| "unstake LP" / "withdraw LP from farm"          | Unstake LP Tokens     | Deep link + cast examples        |
| "stake CAKE" / "syrup pool"                     | Stake CAKE            | Deep link to Syrup Pools         |
| "harvest" / "claim rewards" / "pending rewards" | Harvest Rewards       | cast command + deep link         |
| "veCAKE" / "boost" / "gauge voting"             | veCAKE & Gauge Voting | Deep link to cake-staking        |

| User Wants...                  | Best Recommendation                                |
| ------------------------------ | -------------------------------------------------- |
| Passive CAKE yield, no IL      | CAKE staking (Syrup Pool) or veCAKE lock           |
| Highest APR, willing to manage | V3 Farm with tight range + bCAKE boost             |
| Set-and-forget farming         | V2 Farm (full range, no rebalancing needed)        |
| Earn partner tokens            | Syrup Pools                                        |
| Governance + revenue share     | veCAKE lock + gauge voting                         |
| Stablecoin yield, minimal risk | USDT-USDC StableSwap LP farm                       |

---

## Token Addresses (BSC — Chain ID 56)

Use these to construct deep links. Always use the WBNB address for BNB in URLs (not the symbol `BNB`).

| Token  | Address                                      | Decimals |
| ------ | -------------------------------------------- | -------- |
| CAKE   | `0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82` | 18       |
| WBNB   | `0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c` | 18       |
| BNB    | Use WBNB address above in URLs               | 18       |
| USDT   | `0x55d398326f99059fF775485246999027B3197955` | 18       |
| USDC   | `0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d` | 18       |
| BUSD   | `0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56` | 18       |
| ETH    | `0x2170Ed0880ac9A755fd29B2688956BD959F933F8` | 18       |
| BTCB   | `0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c` | 18       |
| MBOX   | `0x3203c9E46cA618C8C1cE5dC67e7e9D75f5da2377` | 18       |
| XRP    | `0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBE` | 18       |
| ADA    | `0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47` | 18       |
| DOGE   | `0xbA2aE424d960c26247Dd6c32edC70B295c744C43` | 8        |
| DOT    | `0x7083609fCE4d1d8Dc0C979AAb8c869Ea2C873402` | 18       |
| LINK   | `0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD` | 18       |
| UNI    | `0xBf5140A22578168FD562DCcF235E5D43A02ce9B1` | 18       |
| TWT    | `0x4B0F1812e5Df2A09796481Ff14017e6005508003` | 18       |

---

## Deep Link Reference

### URL Formulas

```
# V2 — add liquidity
https://pancakeswap.finance/v2/add/{token0}/{token1}?chain={chainKey}&persistChain=1

# V3 — add liquidity (fee tier: 100=0.01%, 500=0.05%, 2500=0.25%, 10000=1%)
https://pancakeswap.finance/add/{token0}/{token1}/{feeTier}?chain={chainKey}&persistChain=1

# StableSwap — add liquidity (for stablecoin pairs like USDT/USDC)
https://pancakeswap.finance/stable/add/{token0}/{token1}?chain={chainKey}&persistChain=1

# Infinity — add liquidity (uses poolId from CampaignManager, NOT token addresses)
https://pancakeswap.finance/liquidity/add/{chainKey}/infinity/{poolId}?chain={chainKey}&persistChain=1
```

For V2/V3, use the wrapped token address (WBNB `0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c` on BSC).
For V3, common fee tiers: `2500` (most pairs), `500` (major pairs), `100` (stablecoins).
For Infinity, you need the `poolId` (bytes32 hash) from the CampaignManager contract — see "Method B" in Farm Discovery.

### Pre-built Deep Links (BSC)

| Pair        | Type       | Add Liquidity Deep Link                                                                                                                 |
| ----------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| CAKE / WBNB | V2         | `https://pancakeswap.finance/v2/add/0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82/0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c?chain=bsc&persistChain=1` |
| CAKE / WBNB | Infinity   | `https://pancakeswap.finance/liquidity/add/bsc/infinity/0xcbc43b950eb089f1b28694324e76336542f1c158ec955921704cebaa53a278bc?chain=bsc&persistChain=1` |
| CAKE / USDT | V3         | `https://pancakeswap.finance/add/0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82/0x55d398326f99059fF775485246999027B3197955/2500?chain=bsc&persistChain=1` |
| WBNB / USDT | V3         | `https://pancakeswap.finance/add/0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c/0x55d398326f99059fF775485246999027B3197955/2500?chain=bsc&persistChain=1` |
| ETH / WBNB  | V3         | `https://pancakeswap.finance/add/0x2170Ed0880ac9A755fd29B2688956BD959F933F8/0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c/2500?chain=bsc&persistChain=1` |
| BTCB / WBNB | V3         | `https://pancakeswap.finance/add/0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c/0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c/2500?chain=bsc&persistChain=1` |
| USDT / USDC | StableSwap | `https://pancakeswap.finance/stable/add/0x55d398326f99059fF775485246999027B3197955/0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d?chain=bsc&persistChain=1` |
| MBOX / WBNB | V2         | `https://pancakeswap.finance/v2/add/0x3203c9E46cA618C8C1cE5dC67e7e9D75f5da2377/0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c?chain=bsc&persistChain=1` |
| XRP / WBNB  | V2         | `https://pancakeswap.finance/v2/add/0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBE/0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c?chain=bsc&persistChain=1` |
| ADA / WBNB  | V2         | `https://pancakeswap.finance/v2/add/0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47/0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c?chain=bsc&persistChain=1` |

### Page Deep Links

| Page                  | URL                                                          |
| --------------------- | ------------------------------------------------------------ |
| All BSC Farms         | `https://pancakeswap.finance/farms?chain=bsc`                |
| V3 Farms              | `https://pancakeswap.finance/farms?chain=bsc&type=v3`        |
| Infinity Farms        | `https://pancakeswap.finance/liquidity/pools?type=1`         |
| Syrup Pools           | `https://pancakeswap.finance/pools`                          |
| CAKE Staking / veCAKE | `https://pancakeswap.finance/cake-staking`                   |
| Gauge Voting          | `https://pancakeswap.finance/gauges-voting`                  |

### Chain Keys

| Chain           | Key      |
| --------------- | -------- |
| BNB Smart Chain | `bsc`    |
| Ethereum        | `eth`    |
| Arbitrum One    | `arb`    |
| Base            | `base`   |
| zkSync Era      | `zksync` |

If you cannot find a token address in the table above, look it up on-chain:

```bash
cast call $TOKEN_ADDRESS "symbol()(string)" --rpc-url https://bsc-dataseed1.binance.org
```

Or use the farms page with search: `https://pancakeswap.finance/farms?chain=bsc&search={SYMBOL}`

---

## Contract Addresses (BSC)

| Contract            | Address                                      | Purpose                            |
| ------------------- | -------------------------------------------- | ---------------------------------- |
| MasterChef v2       | `0xa5f8C5Dbd5F286960b9d90548680aE5ebFf07652` | V2 LP farm staking & CAKE rewards  |
| MasterChef v3       | `0x556B9306565093C855AEA9AE92A594704c2Cd59e` | V3 position farming & CAKE rewards |
| CampaignManager     | `0x26Bde0AC5b77b65A402778448eCac2aCaa9c9115` | Infinity farm campaign registry    |
| Distributor         | `0xEA8620aAb2F07a0ae710442590D649ADE8440877` | Infinity farm CAKE reward claims   |
| CAKE Token          | `0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82` | CAKE ERC-20 token                  |
| PositionManager v3  | `0x46A15B0b27311cedF172AB29E4f4766fbE7F4364` | V3 NFT position manager            |
| veCAKE              | `0x5692DB8177a81A6c6afc8084C2976C9933EC1bAB` | Vote-escrowed CAKE                 |
| GaugeVoting         | `0xf81953dC234cdEf1D6D0d3ef61b232C6bCbF9aeF` | Gauge vote allocation              |
| RevenueSharingGateway | `0x011f2a82846a4E9c62C2FC4Fd6fDbad19147D94A` | Unified claiming gateway         |

---

## Farm Discovery

### Method A: DefiLlama API (recommended — always works)

Fetch live yield data for all PancakeSwap farms. Use `python3` to filter, sort, and build deep links in one step:

```bash
curl -s "https://yields.llama.fi/pools" | python3 -c "
import json, sys

TOKENS = {
    'CAKE': '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
    'WBNB': '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    'BNB':  '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    'USDT': '0x55d398326f99059fF775485246999027B3197955',
    'USDC': '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    'BUSD': '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
    'ETH':  '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
    'BTCB': '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
    'MBOX': '0x3203c9E46cA618C8C1cE5dC67e7e9D75f5da2377',
    'XRP':  '0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBE',
    'ADA':  '0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47',
    'DOGE': '0xbA2aE424d960c26247Dd6c32edC70B295c744C43',
    'DOT':  '0x7083609fCE4d1d8Dc0C979AAb8c869Ea2C873402',
    'LINK': '0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD',
    'UNI':  '0xBf5140A22578168FD562DCcF235E5D43A02ce9B1',
    'TWT':  '0x4B0F1812e5Df2A09796481Ff14017e6005508003',
}

def build_link(symbol, project):
    parts = symbol.replace(' ', '').split('-')
    if len(parts) != 2:
        return 'https://pancakeswap.finance/farms?chain=bsc'
    t0, t1 = TOKENS.get(parts[0], ''), TOKENS.get(parts[1], '')
    if not t0 or not t1:
        return f'https://pancakeswap.finance/farms?chain=bsc&search={parts[0]}'
    if 'v3' in project:
        return f'https://pancakeswap.finance/add/{t0}/{t1}/2500?chain=bsc&persistChain=1'
    else:
        return f'https://pancakeswap.finance/v2/add/{t0}/{t1}?chain=bsc&persistChain=1'

data = json.load(sys.stdin)['data']
pools = [p for p in data if p.get('chain') == 'BSC' and 'pancakeswap' in p.get('project', '')]
pools.sort(key=lambda p: p.get('apy', 0) or 0, reverse=True)

print(f'| Pair | APY | TVL | Type | Deep Link |')
print(f'|------|-----|-----|------|-----------|')
for p in pools[:15]:
    sym = p['symbol']
    apy = f\"{p.get('apy', 0):.1f}%\"
    tvl = f\"\${int(p.get('tvlUsd', 0)):,}\"
    typ = 'V3' if 'v3' in p['project'] else 'V2'
    link = build_link(sym, p['project'])
    print(f'| {sym} | {apy} | {tvl} | {typ} | {link} |')
"
```

This outputs a ready-to-use markdown table with deep links per row. Copy the output directly into your response.

### Method B: On-chain via CampaignManager (Infinity farms)

Use when you specifically need Infinity farm details:

```bash
cast call 0x26Bde0AC5b77b65A402778448eCac2aCaa9c9115 \
  "campaignLength()(uint256)" \
  --rpc-url https://bsc-dataseed1.binance.org
```

```bash
cast call 0x26Bde0AC5b77b65A402778448eCac2aCaa9c9115 \
  "campaignInfo(uint256)(address,bytes32,uint64,uint64,uint128,address,uint256)" 1 \
  --rpc-url https://bsc-dataseed1.binance.org
```

Response fields: `poolManager`, `poolId`, `startTime`, `duration`, `campaignType`, `rewardToken`, `totalRewardAmount`.

To resolve `poolId` to a token pair:

```bash
cast call 0xa0FfB9c1CE1Fe56963B0321B32E7A0302114058b \
  "poolIdToPoolKey(bytes32)(address,address,address,uint24,int24,address)" $POOL_ID \
  --rpc-url https://bsc-dataseed1.binance.org
```

Then build the deep link using the `poolId` directly (NOT the resolved token addresses):

```
https://pancakeswap.finance/liquidity/add/bsc/infinity/{poolId}?chain=bsc
```

The `poolId` is the bytes32 hash from `campaignInfo`, e.g.:
`https://pancakeswap.finance/liquidity/add/bsc/infinity/0xcbc43b950eb089f1b28694324e76336542f1c158ec955921704cebaa53a278bc?chain=bsc`

Resolving to token symbols is still useful for display (showing "CAKE / BNB" to the user), but the URL uses the poolId.

### Method C: CAKE price (for reward valuation)

```bash
curl -s "https://api.coingecko.com/api/v3/simple/price?ids=pancakeswap-token&vs_currencies=usd"
```

---

## Stake LP Tokens

**Primary: Direct the user to the PancakeSwap UI via deep link.** Only provide `cast` examples when the user explicitly asks for CLI/programmatic staking.

### Step 1: Add liquidity (get LP tokens)

Build the add-liquidity deep link from the Token Addresses and Deep Link Reference above:

```
# V2 example: CAKE/WBNB
https://pancakeswap.finance/v2/add/0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82/0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c?chain=bsc&persistChain=1

# V3 example: CAKE/USDT (fee tier 2500 = 0.25%)
https://pancakeswap.finance/add/0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82/0x55d398326f99059fF775485246999027B3197955/2500?chain=bsc&persistChain=1
```

### Step 2: Stake in the farm

```
# V2 farms page
https://pancakeswap.finance/farms?chain=bsc

# V3 farms page
https://pancakeswap.finance/farms?chain=bsc&type=v3
```

### CLI: V2 Farm staking (MasterChef v2)

```solidity
function deposit(uint256 pid, uint256 amount, address to) external;
function withdraw(uint256 pid, uint256 amount, address to) external;
function harvest(uint256 pid, address to) external;
function emergencyWithdraw(uint256 pid, address to) external;
```

- `pid` — pool ID (query `poolLength()` to enumerate)
- `amount` — LP token amount in wei

```bash
cast send $LP_TOKEN_ADDRESS \
  "approve(address,uint256)" 0xa5f8C5Dbd5F286960b9d90548680aE5ebFf07652 $AMOUNT \
  --private-key $PRIVATE_KEY --rpc-url https://bsc-dataseed1.binance.org

cast send 0xa5f8C5Dbd5F286960b9d90548680aE5ebFf07652 \
  "deposit(uint256,uint256,address)" $PID $AMOUNT $YOUR_ADDRESS \
  --private-key $PRIVATE_KEY --rpc-url https://bsc-dataseed1.binance.org
```

### CLI: V3 Farm staking (MasterChef v3)

V3 positions are NFTs. Transfer the position NFT to MasterChef v3:

```bash
cast send 0x46A15B0b27311cedF172AB29E4f4766fbE7F4364 \
  "safeTransferFrom(address,address,uint256)" \
  $YOUR_ADDRESS 0x556B9306565093C855AEA9AE92A594704c2Cd59e $TOKEN_ID \
  --private-key $PRIVATE_KEY --rpc-url https://bsc-dataseed1.binance.org
```

::: danger
Never use mainnet private keys in scripts. Use the PancakeSwap UI deep links for mainnet. CLI examples are for testnet or programmatic integrations only.
:::

---

## Unstake LP Tokens

### UI (recommended)

Direct the user to the same farm page where they can manage/withdraw:

```
# V2 farms
https://pancakeswap.finance/farms?chain=bsc

# V3 farms
https://pancakeswap.finance/farms?chain=bsc&type=v3
```

### CLI: V2 unstake

```bash
cast send 0xa5f8C5Dbd5F286960b9d90548680aE5ebFf07652 \
  "withdraw(uint256,uint256,address)" $PID $AMOUNT $YOUR_ADDRESS \
  --private-key $PRIVATE_KEY --rpc-url https://bsc-dataseed1.binance.org
```

### CLI: V3 unstake

```bash
cast send 0x556B9306565093C855AEA9AE92A594704c2Cd59e \
  "withdraw(uint256,address)" $TOKEN_ID $YOUR_ADDRESS \
  --private-key $PRIVATE_KEY --rpc-url https://bsc-dataseed1.binance.org
```

---

## Stake CAKE

### Syrup Pools (earn partner tokens or CAKE)

Syrup Pools let users stake CAKE to earn various reward tokens. Each pool is a separate `SmartChefInitializable` contract.

**Primary: Deep link to the Syrup Pools page:**

```
https://pancakeswap.finance/pools
```

The user selects a pool in the UI, approves CAKE, and stakes. No contract address lookup is needed.

### CLI: Syrup Pool staking

```solidity
function deposit(uint256 amount) external;
function withdraw(uint256 amount) external;
function emergencyWithdraw() external;
function pendingReward(address user) external view returns (uint256);
function userInfo(address user) external view returns (uint256 amount, uint256 rewardDebt);
```

```bash
CAKE="0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82"
POOL_ADDRESS="0x..."  # from BscScan link on the pool card in the UI

cast send $CAKE \
  "approve(address,uint256)" $POOL_ADDRESS $AMOUNT \
  --private-key $PRIVATE_KEY --rpc-url https://bsc-dataseed1.binance.org

cast send $POOL_ADDRESS \
  "deposit(uint256)" $AMOUNT \
  --private-key $PRIVATE_KEY --rpc-url https://bsc-dataseed1.binance.org
```

### Unstake CAKE from Syrup Pool

```bash
cast send $POOL_ADDRESS \
  "withdraw(uint256)" $AMOUNT \
  --private-key $PRIVATE_KEY --rpc-url https://bsc-dataseed1.binance.org
```

::: danger
Never use mainnet private keys in scripts. Use the PancakeSwap UI for mainnet staking.
:::

---

## Harvest Rewards

### V2 Farm rewards

```bash
cast call 0xa5f8C5Dbd5F286960b9d90548680aE5ebFf07652 \
  "pendingCake(uint256,address)(uint256)" $PID $YOUR_ADDRESS \
  --rpc-url https://bsc-dataseed1.binance.org

cast send 0xa5f8C5Dbd5F286960b9d90548680aE5ebFf07652 \
  "harvest(uint256,address)" $PID $YOUR_ADDRESS \
  --private-key $PRIVATE_KEY --rpc-url https://bsc-dataseed1.binance.org
```

### V3 Farm rewards

```bash
cast call 0x556B9306565093C855AEA9AE92A594704c2Cd59e \
  "pendingCake(uint256)(uint256)" $TOKEN_ID \
  --rpc-url https://bsc-dataseed1.binance.org

cast send 0x556B9306565093C855AEA9AE92A594704c2Cd59e \
  "harvest(uint256,address)" $TOKEN_ID $YOUR_ADDRESS \
  --private-key $PRIVATE_KEY --rpc-url https://bsc-dataseed1.binance.org
```

### Syrup Pool rewards

```bash
cast call $POOL_ADDRESS \
  "pendingReward(address)(uint256)" $YOUR_ADDRESS \
  --rpc-url https://bsc-dataseed1.binance.org
```

### Infinity Farm rewards (Merkle claim)

Infinity farms distribute CAKE every **8 hours** (epochs at 00:00, 08:00, 16:00 UTC).

```bash
USER_ADDRESS="0xYourAddress"
CURRENT_TS=$(date +%s)
curl -s "https://infinity.pancakeswap.com/farms/users/56/${USER_ADDRESS}/${CURRENT_TS}"
```

Claim via the Distributor contract with the Merkle proof from the API response:

```bash
cast send 0xEA8620aAb2F07a0ae710442590D649ADE8440877 \
  "claim((address,uint256,bytes32[])[])" \
  "[($REWARD_TOKEN,$AMOUNT,[$PROOF1,$PROOF2,...])]" \
  --private-key $PRIVATE_KEY --rpc-url https://bsc-dataseed1.binance.org
```

### UI Harvest (recommended for mainnet)

Direct the user to the relevant farm page — the UI has "Harvest" buttons:

```
https://pancakeswap.finance/farms?chain=bsc
```

---

## veCAKE & Gauge Voting

Users lock CAKE for a period to receive veCAKE, which grants:
- **Gauge voting power** — direct CAKE emissions to preferred farms
- **Revenue sharing** — earn a portion of PancakeSwap protocol revenue
- **bCAKE boost** — up to 2.5x multiplier on farm APR

### Deep Links

```
# Lock CAKE for veCAKE
https://pancakeswap.finance/cake-staking

# Gauge voting
https://pancakeswap.finance/gauges-voting
```

### bCAKE Farm Boost

| veCAKE Holding | Typical Boost | Notes                   |
| -------------- | ------------- | ----------------------- |
| Small (<100)   | 1.0x–1.2x    | Minimal boost           |
| Medium (1K+)   | 1.2x–1.8x    | Noticeable APR increase |
| Large (10K+)   | 1.8x–2.5x    | Near-maximum boost      |

Maximum boost: 2.5x for V2 farms, 2.0x for V3 positions.

---

## Output Templates

::: danger MANDATORY OUTPUT RULE
**Every farm row you output MUST include a full `https://pancakeswap.finance/...` deep link URL.** A farm row without a URL is INVALID. Build the link from the Token Addresses table and URL Formulas above.
:::

### Multi-farm comparison table

Use this format when listing multiple farms. The **Deep Link** column is mandatory:

```
| Pair | APY | TVL | Type | Deep Link |
|------|-----|-----|------|-----------|
| MBOX / WBNB | 15.2% | $984K | V2 | https://pancakeswap.finance/v2/add/0x3203c9E46cA618C8C1cE5dC67e7e9D75f5da2377/0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c?chain=bsc&persistChain=1 |
| CAKE / USDT | 12.4% | $340K | V3 | https://pancakeswap.finance/add/0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82/0x55d398326f99059fF775485246999027B3197955/2500?chain=bsc&persistChain=1 |
| USDT / WBNB | 10.7% | $321K | V2 | https://pancakeswap.finance/v2/add/0x55d398326f99059fF775485246999027B3197955/0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c?chain=bsc&persistChain=1 |
```

### Single farm recommendation

```
## Farming Plan Summary

**Strategy:** Stake WBNB-CAKE LP in V3 Farm
**Chain:** BNB Smart Chain
**Pool:** WBNB / CAKE (0.25% fee tier)
**Farm APR:** ~45% (base) + up to 2x with bCAKE boost
**Reward:** CAKE

### Steps
1. Add liquidity: https://pancakeswap.finance/add/0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c/0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82/2500?chain=bsc&persistChain=1
2. Stake in farm: https://pancakeswap.finance/farms?chain=bsc&type=v3
3. (Optional) Lock CAKE for bCAKE boost: https://pancakeswap.finance/cake-staking

### Risks
- Impermanent loss if BNB/CAKE price ratio changes significantly
- CAKE reward value depends on CAKE token price
- V3 positions require active range management
```

---

## Anti-Patterns

::: danger Never do these
1. **Never hardcode APR values** — always fetch live data from DefiLlama
2. **Never skip IL warnings** — always warn about impermanent loss for volatile pairs
3. **Never assume farm availability** — farms can be stopped; verify via DefiLlama or CampaignManager
4. **Never expose private keys** — always use deep links for mainnet
5. **Never ignore chain context** — V2 farms are BSC-only; other chains have V3/Infinity only
6. **Never output a farm without a deep link** — every farm row needs a clickable URL
:::

---

## Farming Types Reference

| Type           | Pool Version | How It Works                                                  | Reward  |
| -------------- | ------------ | ------------------------------------------------------------- | ------- |
| V2 Farms       | V2           | Stake LP tokens in MasterChef v2, earn CAKE per block         | CAKE    |
| V3 Farms       | V3           | Stake V3 NFT positions in MasterChef v3, earn CAKE per block  | CAKE    |
| Infinity Farms | Infinity     | Provide liquidity, CAKE allocated per epoch (8h) via Merkle   | CAKE    |
| Syrup Pools    | —            | Stake CAKE to earn partner tokens or more CAKE                | Various |
| veCAKE Staking | —            | Lock CAKE for veCAKE, earn revenue share + gauge voting power | CAKE    |

## Supported Chains

| Chain           | Chain ID | Farms Support    | Native Token |
| --------------- | -------- | ---------------- | ------------ |
| BNB Smart Chain | 56       | V2, V3, Infinity | BNB          |
| Ethereum        | 1        | V3               | ETH          |
| Arbitrum One    | 42161    | V3               | ETH          |
| Base            | 8453     | V3               | ETH          |
| zkSync Era      | 324      | V3               | ETH          |
