# CipherFleet

## Project Overview
CipherFleet is an on-chain hidden-state naval warfare (Battleship) game built on **Fhenix CoFHE** (Fully Homomorphic Encryption coprocessor). Ship coordinates are stored as encrypted integers (`euint8`) on-chain — mathematically hidden using FHE, not by trust or a server.

**Buildathon**: Fhenix Privacy-by-Design dApp Buildathon on AKINDO WaveHack ($50K grant pool)

## Project Structure
```
CipherFleet/
├── contract/                  # Everything Hardhat/Solidity
│   ├── contracts/
│   │   ├── CipherFleet.sol         # Main game contract (FHE-powered)
│   │   ├── CipherFleetFactory.sol  # Factory for creating game instances
│   │   └── interfaces/
│   │       └── ICipherFleet.sol
│   ├── scripts/deploy.ts
│   ├── test/
│   ├── hardhat.config.ts
│   ├── tsconfig.json
│   └── package.json              # pnpm, hardhat 2.x
├── frontend/                  # React + Vite + TypeScript + Tailwind v3
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── GameGrid.tsx       # 8x8 grid component
│   │   │   ├── FHEFeed.tsx        # Live terminal FHE operation log
│   │   │   ├── SidebarLeft.tsx    # Fleet command + phase indicator
│   │   │   ├── AttackOverlay.tsx  # Attack animation overlay
│   │   │   ├── WinScreen.tsx      # Victory screen
│   │   │   ├── Navbar.tsx         # Top nav with stats
│   │   │   └── LogoHex.tsx        # Animated hex logo
│   │   ├── hooks/
│   │   │   └── useGameState.ts    # All game state management
│   │   ├── lib/
│   │   │   └── gameTypes.ts       # Types, constants, interfaces
│   │   └── styles/
│   │       └── globals.css        # CSS vars, animations, cell styles
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── package.json
└── CLAUDE.md
```

## Tech Stack
- **Smart Contract**: Solidity 0.8.25, `@fhenixprotocol/cofhe-contracts` (FHE.sol)
- **Contract Dev**: Hardhat 2.x, `cofhe-hardhat-plugin`, `@nomicfoundation/hardhat-toolbox`
- **Frontend**: React 18, Vite 6, TypeScript, Tailwind CSS v3
- **FHE Client**: `@cofhe/sdk` (for Wave 2 wallet integration)
- **Target Network**: Arbitrum Sepolia (chainId 421614)
- **Package Manager**: pnpm

## Key FHE Concepts
- `euint8`: encrypted uint8 — ship cells stored as euint8 (0=water, 1=ship)
- `ebool`: encrypted boolean — attack result (hit/miss)
- `FHE.eq(a, b)`: compares two encrypted values, returns ebool
- `FHE.asEuint8(value)`: encrypt a plaintext value
- `FHE.allowThis(handle)`: grant contract permission to use ciphertext
- `FHE.allow(handle, addr)`: grant an address permission to decrypt
- `FHE.getDecryptResult(handle)`: read decrypted result (reverts if not ready)
- `FHE.select(cond, a, b)`: ternary on encrypted values (no `if` on ciphertext)

## Build Commands
```bash
# Contract
cd contract && pnpm install && npx hardhat compile

# Frontend
cd frontend && pnpm install && pnpm dev    # dev server
cd frontend && pnpm build                   # production build
```

## Architecture Notes
- Contract uses flat mappings (not nested structs with euint8 arrays) because Solidity doesn't support user-defined types in struct arrays well
- `viaIR: true` + `evmVersion: "cancun"` required in hardhat config for compilation
- Wave 1 frontend is a mock demo — simulated FHE operations, no wallet connection
- Wave 2 will add wagmi/viem/RainbowKit + real contract calls via @cofhe/sdk

## Design System
- Dark crimson aesthetic ("Encrypted Ocean" theme)
- Fonts: Cinzel (headers), JetBrains Mono (code/data)
- Color tokens defined as CSS custom properties in globals.css
- Cell states: empty, ship, hit, miss, targeting, sunk, my-hit

## Wave Plan
| Wave | Focus |
|------|-------|
| Wave 1 | Ideation + polished demo UI + compiled contract |
| Wave 2 | Deploy to Arbitrum Sepolia + wallet integration |
| Wave 3 | Full multiplayer + FHE wagering |
| Wave 4 | Tournament mode + ELO |
| Wave 5 | Mobile + mainnet |
