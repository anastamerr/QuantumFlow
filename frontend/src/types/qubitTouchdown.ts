export type QubitPosition = '0' | '1' | '+' | '-' | '+i' | '-i';
export type GameMode = 'PVP' | 'PVC';

export interface QubitCard {
  id: string;
  type: string; // 'H', 'X', 'Y', 'Z', 'S', 'I', 'Meas', '√X'
}

export interface Player {
  id: number;
  name: string;
  endzone: QubitPosition;
  touchdowns: number;
  hand: QubitCard[];
}

export interface PendingMove {
  newPos: QubitPosition;
  nextPid: number;
  newLastAction: string;
  updatedPlayers: Record<number, Player>;
  isOver: boolean;
  newDeck: QubitCard[];
}

export interface QubitTouchdownState {
  game_id: string;
  mode: GameMode;
  ballPosition: QubitPosition;
  current_player_id: number;
  deck: QubitCard[];
  players: Player[]; // Note: Logic returns object, we often convert to array for UI
  lastAction: string;
  lastDieRoll: number | null;
  is_over: boolean;
  
  // Animation States
  isDiceRolling: boolean;
  rollTrigger: number;
  pendingMove: PendingMove | null;
}