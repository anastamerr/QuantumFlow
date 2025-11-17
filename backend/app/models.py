from typing import Dict, List, Optional, Union, Literal
from pydantic import BaseModel, Field
from enum import Enum

class GateModel(BaseModel):
    id: Optional[str] = None
    type: str
    qubit: Optional[int] = None
    position: Optional[int] = None
    params: Optional[Dict[str, Union[float, int, str]]] = None
    targets: Optional[List[int]] = None
    controls: Optional[List[int]] = None


class ExecuteRequest(BaseModel):
    num_qubits: int = Field(..., ge=1, description="Number of qubits in the circuit")
    gates: List[GateModel]
    shots: int = Field(1024, ge=1, le=1_000_000)
    memory: bool = Field(default=False)
    backend: Optional[str] = Field(default=None, description="Override backend name")


class ExecuteResponse(BaseModel):
    backend: str
    shots: int
    counts: Dict[str, int]
    probabilities: Dict[str, float]
    memory: Optional[List[str]] = None
    status: str = "success"


GameMode = Literal["PVP", "PVC"]  # player vs player, player vs computer


class QubitTouchdownCell(BaseModel):
    index: int
    owner: Optional[int] = None  # 1 or 2, or None for empty
    amplitude: float             # or any quantum-related metric


class QubitTouchdownState(BaseModel):
    game_id: str
    mode: GameMode
    current_player: int
    board: List[QubitTouchdownCell]
    is_over: bool = False
    winner: Optional[int] = None


class NewGameRequest(BaseModel):
    mode: GameMode


class NewGameResponse(BaseModel):
    status: str
    state: QubitTouchdownState


class MoveRequest(BaseModel):
    game_id: str
    target_index: int            # where the player wants to “play”


class MoveResponse(BaseModel):
    status: str
    state: QubitTouchdownState
    message: Optional[str] = None


class QubitPosition(str, Enum):
    ZERO = "0"
    ONE = "1"
    PLUS = "+"
    MINUS = "-"
    PLUS_I = "+i"
    MINUS_I = "-i"


class QubitCardType(str, Enum):
    H = "H"
    S = "S"
    X = "X"
    Y = "Y"
    Z = "Z"
    SQRT_X = "SQRT_X"
    I = "I"
    MEASURE = "MEASURE"


class QubitCard(BaseModel):
    id: str  # unique per card instance
    type: QubitCardType


class QubitPlayerState(BaseModel):
    id: int  # 1 or 2
    name: str
    endzone: QubitPosition  # PLUS or MINUS
    touchdowns: int
    hand: List[QubitCard]


class QubitGameMode(str, Enum):
    PVP = "PVP"  # 2 local players
    PVC = "PVC"  # player vs computer


class QubitTouchdownState(BaseModel):
    game_id: str
    mode: QubitGameMode
    ball_position: QubitPosition
    current_player_id: int  # whose turn is it now (1 or 2)
    players: List[QubitPlayerState]
    remaining_cards: int
    is_over: bool
    last_action: Optional[str] = None


class QubitNewGameRequest(BaseModel):
    """
    Create a new Qubit Touchdown game.

    mode:
      - PVP: 2 human players sharing the UI.
      - PVC: player 1 is human, player 2 is a simple AI.
    """

    mode: QubitGameMode
    player1_name: Optional[str] = "Player 1"
    player2_name: Optional[str] = "Player 2"


class QubitPlayCardRequest(BaseModel):
    """
    Play a card from the current player's hand.

    The frontend sends the game_id and the card_id they clicked.
    player_id must match current_player_id.
    """

    game_id: str
    player_id: int
    card_id: str
