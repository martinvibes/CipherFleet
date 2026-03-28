<div align="center">

# CipherFleet

### The ocean is encrypted.

**The first on-chain game where ship positions are mathematically hidden — not just hidden by trust.**

[Play Demo](https://cipherfleet.xyz) · [Watch Video](#demo) · [Smart Contract](#smart-contract) · [How It Works](#how-it-works)

---

<img src="https://img.shields.io/badge/Solidity-0.8.25-363636?style=flat-square&logo=solidity" /> <img src="https://img.shields.io/badge/Fhenix-CoFHE-8b1a1a?style=flat-square" /> <img src="https://img.shields.io/badge/Network-Arbitrum%20Sepolia-2d374b?style=flat-square" /> <img src="https://img.shields.io/badge/React-Vite-646CFF?style=flat-square&logo=vite" /> <img src="https://img.shields.io/badge/Buildathon-AKINDO%20WaveHack-e8b020?style=flat-square" />

</div>

---

## What is CipherFleet?

CipherFleet is **Battleship on the blockchain** — but with a twist that makes it actually work.

In normal Battleship, you trust your opponent not to cheat. On a normal blockchain, that trust problem gets *worse* — anyone can read the contract storage and see where your ships are.

CipherFleet solves this with **Fully Homomorphic Encryption (FHE)**. Your ship positions are stored on-chain as encrypted data that nobody can read — not your opponent, not a server, not even the smart contract itself. When someone attacks, the contract checks if they hit a ship by running math *directly on the encrypted data*. It never decrypts your ship positions. Ever.

**Think of it this way:**
- Normal blockchain: your ships are written in plain text on a public whiteboard
- CipherFleet: your ships are locked in a mathematical safe that can answer "is there a ship here?" without ever opening

---

## How It Works

### The 30-Second Version

```
1. You place your ships → positions are encrypted and stored on-chain
2. Opponent attacks a cell → the contract runs FHE.eq() on encrypted data
3. Result comes back → "Hit" or "Miss" — that's ALL that's revealed
4. Ship positions? Still encrypted. Always.
```

### The Visual Version

```
    YOUR BOARD (on-chain)          WHAT ANYONE ELSE SEES
  ┌──┬──┬──┬──┬──┬──┬──┬──┐     ┌──┬──┬──┬──┬──┬──┬──┬──┐
  │  │  │  │🚢│🚢│🚢│🚢│  │     │??│??│??│??│??│??│??│??│
  │  │  │  │  │  │  │  │  │     │??│??│??│??│??│??│??│??│
  │  │  │  │  │  │  │  │🚢│     │??│??│??│??│??│??│??│??│
  │  │  │  │  │  │  │  │🚢│     │??│??│??│??│??│??│??│??│
  │  │  │  │  │  │  │  │  │     │??│??│??│??│??│??│??│??│
  │  │🚢│🚢│🚢│  │  │  │  │     │??│??│??│??│??│??│??│??│
  │  │  │  │  │  │  │  │  │     │??│??│??│??│??│??│??│??│
  │  │  │  │  │  │🚢│🚢│  │     │??│??│??│??│??│??│??│??│
  └──┴──┴──┴──┴──┴──┴──┴──┘     └──┴──┴──┴──┴──┴──┴──┴──┘
        You see this.              Everyone else sees this.
                                   Even the contract.
```

### What Happens During an Attack

```
Attacker clicks cell [D,4]
         │
         ▼
   Smart contract runs:
   FHE.eq(grid[3][3], encrypted(1))
         │
         ▼                            Ship position
   CoFHE coprocessor does the         is NEVER revealed
   math on encrypted data ──────────► during this process
         │
         ▼
   Returns: ebool (encrypted yes/no)
         │
         ▼
   Threshold network decrypts
   ONLY the yes/no answer
         │
         ▼
   "HIT" or "MISS" — nothing else
```

---

## Why FHE? Why Not Just Hide It Normally?

Great question. Here's why every other approach fails:

| Approach | Problem |
|----------|---------|
| **Trust a server** | Server can cheat, get hacked, or go offline |
| **Commit-reveal** | Player commits a hash, but can lie about what they committed after seeing your attack |
| **Zero-knowledge proofs** | Proves something is valid, but doesn't let the contract *compute* on hidden data |
| **FHE (what we use)** | Contract does real math on encrypted data. Nobody can cheat. Nobody can read it. Just math. |

FHE is the only approach where the contract can answer "is there a ship here?" without anyone — including the contract — ever knowing where the ships actually are.

---

## The Game

### Ships

| Ship | Size | Cells |
|------|------|-------|
| Carrier | 4 cells | ████ |
| Destroyer | 3 cells | ███ |
| Submarine | 2 cells | ██ |
| Patrol Boat | 2 cells | ██ |

**Total: 11 encrypted cells per player on an 8×8 grid**

### Game Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   WAITING    │ ──► │   PLACING   │ ──► │   BATTLE    │ ──► │  FINISHED   │
│             │     │             │     │             │     │             │
│ Waiting for │     │ Both place  │     │ Take turns  │     │ All ships   │
│ opponent    │     │ ships       │     │ attacking   │     │ sunk = win  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

---

## Smart Contract

The core of CipherFleet is a Solidity contract built on [Fhenix CoFHE](https://fhenix.io).

**Key functions:**
- `placeShips()` — encrypt and store ship positions on-chain
- `attack(row, col)` — run `FHE.eq()` to check if a cell has a ship
- `resolveAttack()` — read the decrypted hit/miss result
- `getGameState()` — check game phase, scores, whose turn it is

**FHE operations used:**
| What | Does |
|------|------|
| `FHE.asEuint8(value)` | Encrypts a number (1 = ship, 0 = water) |
| `FHE.eq(a, b)` | Compares two encrypted values — returns encrypted true/false |
| `FHE.allowThis(handle)` | Lets the contract use the encrypted data |
| `FHE.getDecryptResult()` | Reads the decrypted yes/no answer |

The contract compiles and is ready for deployment on **Arbitrum Sepolia**.

```
📁 contract/
├── contracts/
│   ├── CipherFleet.sol          ← Main game logic + FHE
│   ├── CipherFleetFactory.sol   ← Creates game instances
│   └── interfaces/
│       └── ICipherFleet.sol
├── scripts/deploy.ts
├── hardhat.config.ts
└── package.json
```

---

## Frontend

A cinematic, dark-themed game UI with real-time FHE operation visualization.

**What you see:**
- Two 8×8 grids side by side (your fleet + enemy waters)
- Live FHE operation feed showing every encrypted computation
- Attack animations with encrypted processing overlay
- Ship placement with encryption visualization
- Victory screen with particle effects

```
📁 frontend/
├── src/
│   ├── components/
│   │   ├── LandingPage.tsx     ← Animated battle scene landing
│   │   ├── GameGrid.tsx        ← 8×8 interactive grid
│   │   ├── FHEFeed.tsx         ← Live encryption log
│   │   ├── AttackOverlay.tsx   ← Attack animation
│   │   ├── WinScreen.tsx       ← Victory screen
│   │   ├── SidebarLeft.tsx     ← Fleet status
│   │   └── Navbar.tsx          ← Game stats
│   ├── hooks/useGameState.ts   ← Game logic
│   └── styles/globals.css      ← Design tokens
├── tailwind.config.js
└── vite.config.ts
```

---

## Run It Yourself

**Requirements:** Node.js 20+, pnpm

```bash
# Clone
git clone https://github.com/yourusername/CipherFleet.git
cd CipherFleet

# Smart contract
cd contract
pnpm install
npx hardhat compile

# Frontend
cd ../frontend
pnpm install
pnpm dev
# Open http://localhost:5173
```

---

## Roadmap

### Wave 1 — Ideation & Proof of Concept ✅
> *March 21 – 28*

- Fully playable demo UI with animated battle scene, FHE operation feed, and attack overlay
- Smart contract compiled with real Fhenix FHE imports (`euint8`, `FHE.eq()`, `FHE.allowThis()`)
- Game logic: ship placement, turn-based attacks, hit/miss resolution, win condition
- Mobile-responsive design out of the box
- Open-source repo with documentation

### Wave 2 — Live on Testnet 🔜
> *March 30 – April 6*

- Deploy CipherFleet contract to Arbitrum Sepolia
- Wallet connection via RainbowKit + wagmi + viem
- Real encrypted ship placement using `@cofhe/sdk` client-side encryption
- Real `FHE.eq()` attack resolution through CoFHE coprocessor
- Async decryption flow with loading states (threshold network callback)
- On-chain game creation, joining, and matchmaking

### Wave 3 — Multiplayer & Wagering
> *April 8 – May 8 (Marathon wave)*

- Two-player real-time gameplay across browser sessions
- ETH wagering on game outcomes — winner takes the pot
- Private wager amounts using `fhERC20` (encrypted token balances)
- Game lobby with open/private rooms
- Spectator mode — watch live games without seeing ship positions
- Event-driven UI updates via contract event listeners

### Wave 4 — Competitive Play
> *May 11 – 20*

- Encrypted ELO rating system — rankings computed on FHE, nobody knows exact scores
- Tournament brackets with automated matchmaking
- Player profiles with win/loss history
- Leaderboard with encrypted scoring (only relative ranking visible)
- Rematch and challenge system

### Wave 5 — Production Ready
> *May 23 – June 1*

- Mainnet deployment (Arbitrum One or Fhenix mainnet)
- Multiple game modes: Salvo (multi-shot turns), Fog of War (limited visibility), Blitz (timed turns)
- Game replay system — watch completed games move by move
- Social features: friends list, invite links, share results
- Performance optimization and gas cost reduction

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Smart Contract | Solidity 0.8.25 + `@fhenixprotocol/cofhe-contracts` |
| FHE Engine | Fhenix CoFHE coprocessor |
| Contract Dev | Hardhat 2.x + `cofhe-hardhat-plugin` |
| Frontend | React 18 + Vite 6 + TypeScript |
| Styling | Tailwind CSS v3 + custom CSS |
| Target Network | Arbitrum Sepolia (chainId 421614) |
| Package Manager | pnpm |

---

## Why CipherFleet Wins

We looked at all 30 projects in the buildathon:
- **4 teams** built auction apps
- **5 teams** built payroll apps
- **1 team** attempted gaming — with zero FHE implementation

**CipherFleet is the only serious FHE gaming submission.** Fhenix explicitly lists gaming as a target category. Our demo is playable. No other submission lets judges interact with it like a real game.

Hidden-state games are the perfect use case for FHE — and we're the only ones building it.

---

## The Pitch

> "Every on-chain game today is broken for hidden state. In Poker, Battleship, any game with secrets — you have to trust a server not to cheat. CipherFleet eliminates that trust requirement. Ships are stored as FHE ciphertext. The smart contract runs equality checks on encrypted data. No server, no oracle, no commit-reveal hack — just math."

---

<div align="center">

**Built for the [Fhenix Privacy-by-Design dApp Buildathon](https://akindo.io) on AKINDO WaveHack**

$50K Grant Pool · Multi-Wave Program · Hidden-State Gaming Category

---

*CipherFleet — where the only thing revealed is the result.*

</div>
