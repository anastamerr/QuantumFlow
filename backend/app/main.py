from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from .models import ExecuteRequest, ExecuteResponse ,NewGameRequest,NewGameResponse,MoveRequest,MoveResponse

from .qiskit_runner import run_circuit



from .models import (
    QubitNewGameRequest,
    QubitPlayCardRequest,
    QubitTouchdownState,
)
from .qubit_touchdown_runner import create_new_game, play_card


load_dotenv()

ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "*").split(",")]
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))

app = FastAPI(title="QuantumFlow Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS if ALLOWED_ORIGINS != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    # Check Qiskit availability and env config
    qiskit_ok = True
    try:
        import qiskit  # noqa: F401
    except Exception:
        qiskit_ok = False
    return {
        "status": "ok",
        "qiskit": qiskit_ok,
        "backend_env": os.getenv("QISKIT_BACKEND", "aer_simulator"),
    }


@app.post("/api/v1/execute", response_model=ExecuteResponse)
def execute(req: ExecuteRequest) -> ExecuteResponse:
    try:
        result = run_circuit(
            num_qubits=req.num_qubits,
            gates=[g.model_dump() for g in req.gates],
            shots=req.shots,
            memory=req.memory,
            override_backend=req.backend,
        )
        return ExecuteResponse(**result, status="success")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@app.post("/api/v1/qubit-touchdown/new-game", response_model=QubitTouchdownState)
async def qubit_touchdown_new_game(req: QubitNewGameRequest) -> QubitTouchdownState:
    """
    Create a new Qubit Touchdown game.

    mode:
      - PVP: 2 local human players.
      - PVC: player 1 vs. a simple computer player.
    """
    try:
        return create_new_game(req)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.post("/api/v1/qubit-touchdown/play-card", response_model=QubitTouchdownState)
async def qubit_touchdown_play_card(req: QubitPlayCardRequest) -> QubitTouchdownState:
    """
    Play a card from the current player's hand.

    If the mode is PVC and it becomes the computer's turn, the computer move
    will also be simulated and included in the returned state.
    """
    try:
        return play_card(req.game_id, req.player_id, req.card_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=HOST, port=PORT)


