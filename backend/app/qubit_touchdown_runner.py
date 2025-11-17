from __future__ import annotations

import random
import uuid
from dataclasses import dataclass, field
from typing import Dict, List

from .models import (
    QubitCard,
    QubitCardType,
    QubitGameMode,
    QubitNewGameRequest,
    QubitPlayerState,
    QubitPosition,
    QubitTouchdownState,
)


# ------------- Gate transitions on the 6 Bloch sphere states -------------

# These transitions come from the actual single-qubit unitaries:
# X, Y, Z, H, S, sqrt(X) mapped on the set {0, 1, +, -, +i, -i}.

GATE_TRANSITIONS: Dict[QubitCardType, Dict[QubitPosition, QubitPosition]] = {
    QubitCardType.I: {
        QubitPosition.ZERO: QubitPosition.ZERO,
        QubitPosition.ONE: QubitPosition.ONE,
        QubitPosition.PLUS: QubitPosition.PLUS,
        QubitPosition.MINUS: QubitPosition.MINUS,
        QubitPosition.PLUS_I: QubitPosition.PLUS_I,
        QubitPosition.MINUS_I: QubitPosition.MINUS_I,
    },
    QubitCardType.X: {
        QubitPosition.ZERO: QubitPosition.ONE,
        QubitPosition.ONE: QubitPosition.ZERO,
        QubitPosition.PLUS: QubitPosition.PLUS,
        QubitPosition.MINUS: QubitPosition.MINUS,
        QubitPosition.PLUS_I: QubitPosition.MINUS_I,
        QubitPosition.MINUS_I: QubitPosition.PLUS_I,
    },
    QubitCardType.Y: {
        QubitPosition.ZERO: QubitPosition.ONE,
        QubitPosition.ONE: QubitPosition.ZERO,
        QubitPosition.PLUS: QubitPosition.MINUS,
        QubitPosition.MINUS: QubitPosition.PLUS,
        QubitPosition.PLUS_I: QubitPosition.PLUS_I,
        QubitPosition.MINUS_I: QubitPosition.MINUS_I,
    },
    QubitCardType.Z: {
        QubitPosition.ZERO: QubitPosition.ZERO,
        QubitPosition.ONE: QubitPosition.ONE,
        QubitPosition.PLUS: QubitPosition.MINUS,
        QubitPosition.MINUS: QubitPosition.PLUS,
        QubitPosition.PLUS_I: QubitPosition.MINUS_I,
        QubitPosition.MINUS_I: QubitPosition.PLUS_I,
    },
    QubitCardType.H: {
        QubitPosition.ZERO: QubitPosition.PLUS,
        QubitPosition.ONE: QubitPosition.MINUS,
        QubitPosition.PLUS: QubitPosition.ZERO,
        QubitPosition.MINUS: QubitPosition.ONE,
        QubitPosition.PLUS_I: QubitPosition.MINUS_I,
        QubitPosition.MINUS_I: QubitPosition.PLUS_I,
    },
    QubitCardType.S: {
        QubitPosition.ZERO: QubitPosition.ZERO,
        QubitPosition.ONE: QubitPosition.ONE,
        QubitPosition.PLUS: QubitPosition.PLUS_I,
        QubitPosition.MINUS: QubitPosition.MINUS_I,
        QubitPosition.PLUS_I: QubitPosition.MINUS,
        QubitPosition.MINUS_I: QubitPosition.PLUS,
    },
    QubitCardType.SQRT_X: {
        QubitPosition.ZERO: QubitPosition.MINUS_I,
        QubitPosition.ONE: QubitPosition.PLUS_I,
        QubitPosition.PLUS: QubitPosition.PLUS,
        QubitPosition.MINUS: QubitPosition.MINUS,
        QubitPosition.PLUS_I: QubitPosition.ZERO,
        QubitPosition.MINUS_I: QubitPosition.ONE,
    },
}


# ------------- Internal game model -------------


ALL_NON_MEASURE_GATES = [
    QubitCardType.H,
    QubitCardType.S,
    QubitCardType.X,
    QubitCardType.Y,
    QubitCardType.Z,
    QubitCardType.SQRT_X,
    QubitCardType.I,
]

ALL_CARD_TYPES = ALL_NON_MEASURE_GATES + [QubitCardType.MEASURE]


@dataclass
class InternalPlayer:
    id: int
    name: str
    endzone: QubitPosition
    touchdowns: int = 0
    hand: List[QubitCard] = field(default_factory=list)


@dataclass
class InternalGame:
    game_id: str
    mode: QubitGameMode
    ball_position: QubitPosition
    current_player_id: int
    remaining_cards: int
    is_over: bool = False
    last_action: str | None = None
    players: Dict[int, InternalPlayer] = field(default_factory=dict)

    def to_state(self) -> QubitTouchdownState:
        return QubitTouchdownState(
            game_id=self.game_id,
            mode=self.mode,
            ball_position=self.ball_position,
            current_player_id=self.current_player_id,
            remaining_cards=self.remaining_cards,
            is_over=self.is_over,
            last_action=self.last_action,
            players=[
                QubitPlayerState(
                    id=p.id,
                    name=p.name,
                    endzone=p.endzone,
                    touchdowns=p.touchdowns,
                    hand=p.hand,
                )
                for p in sorted(self.players.values(), key=lambda pl: pl.id)
            ],
        )


# In-memory store for now (hackathon friendly).
GAMES: Dict[str, InternalGame] = {}


def _random_die() -> QubitPosition:
    return QubitPosition.ZERO if random.randint(0, 1) == 0 else QubitPosition.ONE


def _new_card() -> QubitCard:
    card_type = random.choice(ALL_CARD_TYPES)
    return QubitCard(id=str(uuid.uuid4()), type=card_type)


def _draw_to_hand(game: InternalGame, player_id: int, target_size: int = 4) -> None:
    player = game.players[player_id]
    while len(player.hand) < target_size and game.remaining_cards > 0:
        player.hand.append(_new_card())
        game.remaining_cards -= 1


def _kickoff_after_touchdown(game: InternalGame, scoring_player_id: int) -> None:
    scoring_player = game.players[scoring_player_id]
    game.last_action = f"{scoring_player.name} scored a touchdown!"

    # Kickoff: reset ball to 0 or 1 using a binary die.
    game.ball_position = _random_die()

    # The other player now returns the kickoff.
    other_id = 1 if scoring_player_id == 2 else 2
    game.current_player_id = other_id


def _apply_gate(card_type: QubitCardType, pos: QubitPosition) -> QubitPosition:
    mapping = GATE_TRANSITIONS.get(card_type)
    if not mapping:
        return pos
    return mapping[pos]


def _handle_measurement(game: InternalGame) -> str:
    if game.ball_position in (QubitPosition.ZERO, QubitPosition.ONE):
        # Failed punt: nothing happens.
        return "Measurement on 0 or 1 - ball stays in place (failed punt)."

    # Successful punt: collapse to 0 or 1 with 50-50 chance.
    outcome = _random_die()
    game.ball_position = outcome
    return f"Measurement collapse - ball moved to {outcome.value}."


def _take_turn(game: InternalGame, player_id: int, card_id: str) -> None:
    if game.is_over:
        raise ValueError("Game is already over.")

    if player_id != game.current_player_id:
        raise ValueError("It is not this player's turn.")

    player = game.players[player_id]

    # Find and remove the card from the player's hand.
    try:
        card_index = next(i for i, c in enumerate(player.hand) if c.id == card_id)
    except StopIteration:
        raise ValueError("Card not found in player's hand.")

    card = player.hand.pop(card_index)

    # Apply card effect.
    if card.type == QubitCardType.MEASURE:
        action_desc = _handle_measurement(game)
    else:
        old_pos = game.ball_position
        new_pos = _apply_gate(card.type, old_pos)
        game.ball_position = new_pos
        if new_pos == old_pos:
            action_desc = f"{player.name} played {card.type.value}, but the ball did not move."
        else:
            action_desc = (
                f"{player.name} played {card.type.value}: "
                f"{old_pos.value} -> {new_pos.value}."
            )

    # Draw a replacement card if possible.
    _draw_to_hand(game, player_id)

    # Check for touchdown.
    if game.ball_position == player.endzone:
        player.touchdowns += 1
        _kickoff_after_touchdown(game, player_id)
        game.last_action = action_desc + " Touchdown!"
    else:
        # Switch to the other player.
        game.current_player_id = 1 if player_id == 2 else 2
        game.last_action = action_desc

    # End-of-game check: no cards left in deck and both hands empty.
    if (
        game.remaining_cards == 0
        and len(game.players[1].hand) == 0
        and len(game.players[2].hand) == 0
    ):
        game.is_over = True
        game.last_action = (
            game.last_action + " Game over - all 52 cards have been played."
        )


def _maybe_take_computer_turn(game: InternalGame) -> None:
    if game.is_over or game.mode != QubitGameMode.PVC:
        return
    if game.current_player_id != 2:
        return

    computer = game.players[2]
    if not computer.hand:
        return

    # Very simple "AI": prefer a move that actually changes the ball_position, else random.
    movable_cards = []
    for card in computer.hand:
        if card.type == QubitCardType.MEASURE:
            movable_cards.append(card)
        else:
            new_pos = _apply_gate(card.type, game.ball_position)
            if new_pos != game.ball_position:
                movable_cards.append(card)

    chosen = random.choice(movable_cards or computer.hand)
    _take_turn(game, computer.id, chosen.id)


# ------------- Public functions called by FastAPI endpoints -------------


def create_new_game(req: QubitNewGameRequest) -> QubitTouchdownState:
    game_id = str(uuid.uuid4())

    # Player 1 has endzone +, Player 2 has - (by convention).
    player1 = InternalPlayer(
        id=1,
        name=req.player1_name or "Player 1",
        endzone=QubitPosition.PLUS,
    )
    player2 = InternalPlayer(
        id=2,
        name=req.player2_name or ("Computer" if req.mode == QubitGameMode.PVC else "Player 2"),
        endzone=QubitPosition.MINUS,
    )

    # Initial deck: 52 cards total (we track as a counter).
    game = InternalGame(
        game_id=game_id,
        mode=req.mode,
        ball_position=QubitPosition.ZERO,  # temporary, will be set by kickoff
        current_player_id=1,  # temporary
        remaining_cards=52,
    )
    game.players = {1: player1, 2: player2}

    # Both players draw 4 cards.
    _draw_to_hand(game, 1)
    _draw_to_hand(game, 2)

    # Choose a random kicker (1 or 2).
    kicking_player_id = random.choice([1, 2])

    # Kickoff: ball goes to 0 or 1 randomly.
    game.ball_position = _random_die()

    # The other player returns the kickoff.
    game.current_player_id = 1 if kicking_player_id == 2 else 2
    kicker = game.players[kicking_player_id]
    game.last_action = (
        f"{kicker.name} kicked off - ball placed on {game.ball_position.value}. "
        f"It is now the other player's turn."
    )

    GAMES[game_id] = game
    return game.to_state()


def play_card(req_game_id: str, player_id: int, card_id: str) -> QubitTouchdownState:
    if req_game_id not in GAMES:
        raise ValueError("Game not found.")

    game = GAMES[req_game_id]

    _take_turn(game, player_id, card_id)

    # If vs-computer, let the computer take its turn automatically.
    _maybe_take_computer_turn(game)

    return game.to_state()
