export type GameMode = 'PVP' | 'PVC'

export type QubitPosition = '0' | '1' | '+' | '-' | '+i' | '-i'

export type CardType =
  | 'H'
  | 'S'
  | 'X'
  | 'Y'
  | 'Z'
  | 'SQRT_X'
  | 'I'
  | 'MEASURE'

export interface QubitCard {
  id: string
  type: CardType
}

export interface QubitPlayer {
  id: number
  name: string
  endzone: QubitPosition
  touchdowns: number
  hand: QubitCard[]
}

export interface QubitGameState {
  game_id: string
  mode: GameMode
  ball_position: QubitPosition
  current_player_id: number
  players: QubitPlayer[]
  remaining_cards: number
  is_over: boolean
  last_action?: string | null
  last_die_roll?: number | null

}

export interface NewGamePayload {
  mode: GameMode
  player1Name?: string
  player2Name?: string
}

export interface PlayCardPayload {
  gameId: string
  playerId: number
  cardId: string
}
