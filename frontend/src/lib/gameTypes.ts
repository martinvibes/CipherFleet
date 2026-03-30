export type Phase = 'WAITING' | 'PLACING' | 'BATTLE' | 'FINISHED';

export type CellState = 'empty' | 'ship' | 'hit' | 'miss' | 'my-hit' | 'targeting' | 'sunk';

export interface Ship {
  name: string;
  size: number;
  cells: [number, number][];
  hits: number;
  sunk: boolean;
}

export interface AttackRecord {
  row: number;
  col: number;
  isHit: boolean;
  timestamp: number;
}

export interface FHELogEntry {
  id: string;
  type: 'fhe' | 'hit' | 'miss' | 'enc' | 'sys';
  label: string;
  message: string;
  timestamp: string;
}

export interface GameState {
  gameId: string;
  phase: Phase;
  myShips: Set<string>;
  myHits: Set<string>;
  enemyHits: Set<string>;
  enemyMisses: Set<string>;
  myShipsRemaining: number;
  enemyShipsRemaining: number;
  attackCount: number;
  hitCount: number;
  isMyTurn: boolean;
  ships: Ship[];
  // Enemy AI state
  enemyShipCells: Set<string>;       // hidden enemy ship positions
  enemyShipList: Ship[];             // enemy fleet for sink tracking
  enemyAttackedCells: Set<string>;   // cells enemy has attacked on your board
}

export const COLS = 'ABCDEFGH';
export const GRID_SIZE = 8;

export const DEFAULT_SHIPS: Ship[] = [
  { name: 'Carrier', size: 4, cells: [], hits: 0, sunk: false },
  { name: 'Destroyer', size: 3, cells: [], hits: 0, sunk: false },
  { name: 'Submarine', size: 2, cells: [], hits: 0, sunk: false },
  { name: 'Patrol Boat', size: 2, cells: [], hits: 0, sunk: false },
];
