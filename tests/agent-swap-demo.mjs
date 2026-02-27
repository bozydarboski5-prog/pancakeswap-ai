/**
 * Agent Swap Demo — Simulates how an AI agent uses the pancakeswap-ai skills
 * to autonomously execute a swap.
 *
 * This script demonstrates the THREE-PHASE agent execution model:
 *
 *   Phase 1 — PLAN:    Agent reads the swap-planner skill, generates a deep link
 *   Phase 2 — CODE:    Agent reads the swap-integration skill, generates TypeScript
 *   Phase 3 — EXECUTE: Agent runs the generated code and reports the result
 *
 * In a real Claude Code session, phases 1 and 2 happen as the agent reads
 * SKILL.md and generates a response. Phase 3 happens when the agent runs
 * `node` via the Bash tool.
 *
 * This file shows the output of that process — a fully working program —
 * to prove the skills produce correct, runnable code.
 *
 * Run: PRIVATE_KEY=0x... node tests/agent-swap-demo.mjs
 */

import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dir = dirname(fileURLToPath(import.meta.url))
const root = join(__dir, '..')

// ─── Phase 0: Load the skills (what an agent does when the plugin is installed) ─

function loadSkill(relativePath) {
  return readFileSync(join(root, relativePath), 'utf8')
}

const swapIntegrationSkill = loadSkill('packages/plugins/pancakeswap-trading/skills/swap-integration/SKILL.md')
const swapPlannerSkill = loadSkill('packages/plugins/pancakeswap-driver/skills/swap-planner/SKILL.md')

console.log('╔══════════════════════════════════════════════════════════════╗')
console.log('║        PancakeSwap AI — Agent Execution Demo                 ║')
console.log('╚══════════════════════════════════════════════════════════════╝')
console.log()

// ─── Phase 1: PLAN (swap-planner skill) ──────────────────────────────────────

console.log('━━━ Phase 1: PLAN  (swap-planner skill) ━━━━━━━━━━━━━━━━━━━━━━')
console.log()
console.log('  Agent receives user request:')
console.log('  "Swap 0.01 BNB for CAKE on BSC testnet"')
console.log()
console.log('  Agent reads: packages/plugins/pancakeswap-driver/skills/swap-planner/SKILL.md')
console.log(`  Skill size:  ${swapPlannerSkill.split('\n').length} lines`)
console.log()

// Simulate what the agent would output from the swap-planner skill
const TESTNET_CAKE = '0xFa60D973f7642b748046464E165A65B7323b0C73'

function buildDeepLink({ chainId, inputCurrency, outputCurrency, exactAmount, exactField = 'input' }) {
  const CHAIN_KEYS = { 56: 'bsc', 1: 'eth', 42161: 'arb', 8453: 'base', 137: 'polygon', 324: 'zksync', 59144: 'linea', 204: 'opbnb' }
  const chain = CHAIN_KEYS[chainId]
  if (!chain) throw new Error(`Unsupported chainId: ${chainId}`)
  const q = new URLSearchParams({ chain, inputCurrency, outputCurrency })
  if (exactAmount) q.set('exactAmount', exactAmount)
  if (exactField)  q.set('exactField', exactField)
  return `https://pancakeswap.finance/swap?${q.toString()}`
}

// Note: testnet uses chain ID 97, but PancakeSwap's UI deep links are mainnet-only.
// The agent correctly generates a mainnet link for the UI and a separate testnet script for execution.
const mainnetLink = buildDeepLink({
  chainId: 56,
  inputCurrency: 'BNB',
  outputCurrency: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', // mainnet CAKE
  exactAmount: '0.01',
  exactField: 'input',
})

console.log('  ✅ Plan output:')
console.log(`     Deep link (mainnet UI):`)
console.log(`     ${mainnetLink}`)
console.log()
console.log('  ⚠️  Testnet note: PancakeSwap UI only supports mainnet chains.')
console.log('     For autonomous execution on testnet, the agent uses Phase 2.')
console.log()

// ─── Phase 2: CODE  (swap-integration skill) ─────────────────────────────────

console.log('━━━ Phase 2: CODE  (swap-integration skill) ━━━━━━━━━━━━━━━━━━')
console.log()
console.log('  Agent reads: packages/plugins/pancakeswap-trading/skills/swap-integration/SKILL.md')
console.log(`  Skill size:  ${swapIntegrationSkill.split('\n').length} lines`)
console.log()
console.log('  Agent generates: tests/testnet-swap.mjs')
console.log('  Method:          Direct V2 Router (Method 3 from the skill)')
console.log('  Reason:          Smart Router SDK does not index testnet pools.')
console.log('                   The skill\'s decision table guides: simple V2 → Method 3.')
console.log()

// Verify the generated file exists
try {
  const generated = readFileSync(join(__dir, 'testnet-swap.mjs'), 'utf8')
  const lines = generated.split('\n').length
  const hasRouter    = generated.includes('0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3')
  const hasSlippage  = generated.includes('SLIPPAGE_BPS')
  const hasDeadline  = generated.includes('deadline')
  const hasSimulate  = generated.includes('simulateContract')
  const hasReceipt   = generated.includes('waitForTransactionReceipt')

  console.log(`  ✅ Generated file checks (${lines} lines):`)
  console.log(`     ${hasRouter   ? '✅' : '❌'} Contains testnet V2 router address`)
  console.log(`     ${hasSlippage ? '✅' : '❌'} Applies slippage protection`)
  console.log(`     ${hasDeadline ? '✅' : '❌'} Sets transaction deadline`)
  console.log(`     ${hasSimulate ? '✅' : '❌'} Simulates before sending (no wasted gas on reverts)`)
  console.log(`     ${hasReceipt  ? '✅' : '❌'} Waits for on-chain confirmation`)
} catch {
  console.log('  ❌ testnet-swap.mjs not found — run the skill first to generate it')
  process.exit(1)
}
console.log()

// ─── Phase 3: EXECUTE ────────────────────────────────────────────────────────

console.log('━━━ Phase 3: EXECUTE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log()

const privateKey = process.env.PRIVATE_KEY

if (!privateKey) {
  console.log('  PRIVATE_KEY not set — skipping live execution.')
  console.log()
  console.log('  To run the full end-to-end test:')
  console.log()
  console.log('  1. Create a dedicated testnet-only wallet (never reuse mainnet keys)')
  console.log('  2. Get testnet BNB from: https://testnet.bnbchain.org/faucet-smart')
  console.log('  3. Run:')
  console.log('     export PRIVATE_KEY=0x<your-testnet-private-key>')
  console.log('     node tests/agent-swap-demo.mjs')
  console.log()
  console.log('  The agent will then:')
  console.log('  → Get a live quote from the BSC testnet V2 router')
  console.log('  → Simulate the transaction (dry-run, no gas spent)')
  console.log('  → Execute the swap on-chain')
  console.log('  → Report the confirmed CAKE received')
} else {
  console.log('  PRIVATE_KEY found. Running live testnet swap...')
  console.log()
  console.log('  Agent executes: node tests/testnet-swap.mjs')
  console.log('─'.repeat(64))
  console.log()
  try {
    // The agent runs the generated script — this is the Bash tool call in Claude Code.
    // stdio: 'inherit' streams output live, matching real agent Bash tool behaviour.
    execSync('node tests/testnet-swap.mjs', {
      env: { ...process.env },
      cwd: root,
      stdio: 'inherit',
    })
  } catch (err) {
    // Child already printed its own error to stderr above; just exit.
    process.exit(1)
  }
}

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log()
console.log('━━━ Agent Execution Model Summary ━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log()
console.log('  How any AI agent uses pancakeswap-ai skills:')
console.log()
console.log('  1. User installs the plugin:')
console.log('     claude plugin add @pancakeswap/pancakeswap-trading')
console.log()
console.log('  2. User asks: "Swap 0.1 BNB for CAKE on BSC"')
console.log()
console.log('  3. Agent reads swap-integration/SKILL.md automatically')
console.log()
console.log('  4. Agent picks the right method from the Decision Guide:')
console.log('     • No SDK needed / quick → Routing API (Method 1)')
console.log('     • Full programmatic control → Smart Router (Method 2)')
console.log('     • Simple / Solidity / testnet → Direct V2 (Method 3)')
console.log()
console.log('  5. Agent generates complete runnable code')
console.log()
console.log('  6. Agent executes it via Bash tool: node swap.mjs')
console.log()
console.log('  7. Agent reports the tx hash and confirmed output amount')
console.log()
console.log('  The skill handles steps 3–5. The agent\'s tool use handles 6–7.')
console.log('  No human writes any code — the agent reads, decides, generates, executes.')
