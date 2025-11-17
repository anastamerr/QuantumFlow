from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel
from .models import ExecuteRequest, ExecuteResponse, AIResponse, GateModel
from .qiskit_runner import run_circuit
import math

# optional genai (Gemini) client — try common import paths so environments
# that expose the client under different module names are supported.
genai = None
_HAS_GENAI = False
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import logging

load_dotenv()

# logger
logging.basicConfig()
logger = logging.getLogger("quantumflow")

raw_origins = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "*").split(",")]
# Expand common local variants so dev servers using 127.0.0.1 or localhost both work
ALLOWED_ORIGINS = []
for o in raw_origins:
    if not o:
        continue
    ALLOWED_ORIGINS.append(o)
    try:
        # if origin contains 'localhost', add a 127.0.0.1 variant
        if 'localhost' in o:
            ALLOWED_ORIGINS.append(o.replace('localhost', '127.0.0.1'))
    except Exception:
        pass
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


class AIChatRequest(BaseModel):
    history: list
    message: str
    model: str | None = None
    # optional circuit context sent from frontend
    circuit: dict | None = None


def _extract_json_block(text: str) -> str | None:
    import re
    fence = re.search(r"```json\s*([\s\S]*?)\s*```", text, flags=re.IGNORECASE)
    if fence:
        return fence.group(1)
    brace = re.search(r"({[\s\S]*})", text)
    return brace.group(1) if brace else None


def _parse_qubit_index(v) -> int | None:
    """Parse qubit index from common forms: int, 'q0', 'q[0]', 'qubit0'"""
    if v is None:
        return None
    try:
        if isinstance(v, int):
            return v
        s = str(v)
        # digits anywhere
        import re
        m = re.search(r"(\d+)", s)
        if m:
            return int(m.group(1))
    except Exception:
        return None
    return None


def _map_gate_alias(name: str) -> str:
    """Map common gate name aliases from assistant output to canonical gate ids used by the frontend gate library."""
    if not name:
        return name
    s = str(name).strip().lower()
    mapping = {
        'cx': 'cnot',
        'c-x': 'cnot',
        'cnot': 'cnot',
        'controlled-not': 'cnot',
        'h': 'h',
        'hadamard': 'h',
        'x': 'x',
        'pauli-x': 'x',
        'y': 'y',
        'pauli-y': 'y',
        'z': 'z',
        'pauli-z': 'z',
        's': 's',
        't': 't',
        'rx': 'rx',
        'ry': 'ry',
        'rz': 'rz',
        'p': 'p',
        'measure': 'measure',
        'm': 'measure',
        'swap': 'swap',
        'toffoli': 'toffoli',
    'ccx': 'toffoli',
    'ccz': 'toffoli',
        'cz': 'cz',
        'qft': 'qft',
        'iqft': 'iqft',
    }
    return mapping.get(s, s)


def _normalize_gate_dict(g: dict) -> dict:
    """Normalize a gate dict (from assistant JSON) to canonical keys and gate type aliases.
    This modifies 'type' and ensures lists/ints are correct for targets/controls/qubit.
    """
    if not isinstance(g, dict):
        return g
    out = dict(g)
    # Normalize type/name fields
    if 'type' in out and out['type']:
        out['type'] = _map_gate_alias(out['type'])
    elif 'gate_type' in out and out['gate_type']:
        out['type'] = _map_gate_alias(out.get('gate_type'))
    elif 'name' in out and out['name']:
        out['type'] = _map_gate_alias(out.get('name'))

    # Normalize single 'qubit' fields
    if 'qubit' in out and out['qubit'] is not None:
        try:
            out['qubit'] = _parse_qubit_index(out['qubit'])
        except Exception:
            pass

    # Normalize targets/controls lists
    for key in ('targets', 'controls'):
        if key in out and isinstance(out[key], list):
            try:
                out[key] = [x for x in (_parse_qubit_index(x) for x in out[key]) if x is not None]
            except Exception:
                pass

    # Ensure params dict exists so we can normalize angle params for rotation gates
    params = out.get('params') if isinstance(out.get('params'), dict) else {}
    params = dict(params)
    out['params'] = params

    # Normalize position to int if possible
    if 'position' in out:
        try:
            out['position'] = int(out['position'])
        except Exception:
            pass

    # Normalize rotation parameters: AI returns degrees, convert to radians and map aliases
    gate_type = str(out.get('type', '')).lower()
    if gate_type in {'rx', 'ry', 'rz', 'p'}:
        def _extract_numeric(value):
            if value is None:
                return None
            if isinstance(value, (int, float)):
                return float(value)
            try:
                return float(str(value).strip())
            except Exception:
                return None

        def _convert_aliases(preferred_key: str, aliases: list[str]):
            chosen_value = None
            chosen_is_numeric = False
            for alias in aliases:
                if alias in params and params[alias] is not None:
                    val = params[alias]
                    numeric = _extract_numeric(val)
                    if numeric is not None:
                        chosen_value = math.radians(numeric)
                        chosen_is_numeric = True
                        break
                    else:
                        chosen_value = val
                        chosen_is_numeric = False
                        break
            if chosen_value is not None:
                params[preferred_key] = chosen_value
            # remove duplicates while keeping the preferred key
            for alias in aliases:
                if alias != preferred_key:
                    params.pop(alias, None)

        if gate_type in {'rx', 'ry'}:
            _convert_aliases('theta', ['theta', 'angle', 'value', 'degrees', 'deg'])
        elif gate_type in {'rz', 'p'}:
            _convert_aliases('phi', ['phi', 'theta', 'angle', 'value', 'degrees', 'deg'])

    return out


def _normalize_action(raw: dict, circuit: dict | None) -> dict:
    """Try to normalize loosely-structured actions into our canonical action shapes.
    This maps common keys like 'action'->'type', 'target'->gate.qubit, uppercase gate names, etc.
    """
    if not isinstance(raw, dict):
        return raw
    out = dict(raw)
    # normalize action key
    action_key = raw.get('action') or raw.get('type') if raw.get('type') in ('add_gate', 'remove_gate', 'update_gate', 'add_qubit', 'remove_qubit', 'import_circuit', 'add_gates') else None
    if action_key:
        # if 'action' existed and is like 'add_gate', produce type
        if raw.get('action'):
            ak = str(raw.get('action')).lower()
            mapping = {
                'add': 'add_gate',
                'add_gate': 'add_gate',
                'addgate': 'add_gate',
                'remove': 'remove_gate',
                'remove_gate': 'remove_gate',
                'update': 'update_gate',
                'update_gate': 'update_gate',
                'add_qubit': 'add_qubit',
                'remove_qubit': 'remove_qubit',
                'import_circuit': 'import_circuit',
                'add_gates': 'add_gates'
            }
            atype = mapping.get(ak, ak)
            out['type'] = atype

    # If the raw expresses an add_gate in a shorthand form, convert to {type:'add_gate', gate: {...}}
    if out.get('type') == 'add_gate' or (raw.get('action') and str(raw.get('action')).lower() in ('add', 'add_gate', 'addgate')):
        gate_obj = {}
        # Determine gate type: avoid confusing the action 'type' with the gate type
        action_types = {'add_gate','remove_gate','update_gate','add_qubit','remove_qubit','import_circuit','add_gates'}
        gtype = None
        # prefer explicit embedded gate dict
        if isinstance(raw.get('gate'), dict):
            gate_obj = dict(raw.get('gate'))
        else:
            # look for common gate-type fields but skip when 'type' is an action
            if raw.get('gate_type'):
                gtype = raw.get('gate_type')
            elif raw.get('gateType'):
                gtype = raw.get('gateType')
            elif raw.get('name'):
                gtype = raw.get('name')
            elif raw.get('gate_name'):
                gtype = raw.get('gate_name')
            elif raw.get('type') and str(raw.get('type')) not in action_types:
                gtype = raw.get('type')
            elif raw.get('action_type'):
                gtype = raw.get('action_type')
            if gtype is not None:
                gate_obj['type'] = _map_gate_alias(gtype)

        # Detect qubit/target/control ids from many possible keys
        # Single-qubit target keys
        target_keys = ['target_qubit_id','target_qubit','target_qubit_index','target','qubit','qubit_id','q','qubitId']
        control_keys = ['control_qubit_id','control_qubit','control_qubit_index','control','ctrl','controlId']
        # prefer explicit control/target pairs for multi-qubit gates
        ctrl = None
        targ = None
        for k in control_keys:
            if k in raw and raw.get(k) is not None:
                ctrl = _parse_qubit_index(raw.get(k))
                break
        for k in target_keys:
            if k in raw and raw.get(k) is not None:
                targ = _parse_qubit_index(raw.get(k))
                break

        # If explicit control/target found, set controls/targets
        if ctrl is not None:
            gate_obj.setdefault('controls', [])
            gate_obj['controls'] = [ctrl]
        if targ is not None:
            # for two-qubit gates, treat targ as target
            # single-qubit gates prefer 'qubit'
            if ctrl is None and (not gate_obj.get('targets')):
                gate_obj['qubit'] = targ
            else:
                gate_obj.setdefault('targets', [])
                gate_obj['targets'] = [targ]

        # support list-style 'qubits' or 'target_qubits': ["q0","q1"]
        if 'qubits' in raw and isinstance(raw.get('qubits'), list):
            qlist = [ _parse_qubit_index(x) for x in raw.get('qubits') ]
            qlist = [x for x in qlist if x is not None]
            if len(qlist) > 0:
                gate_obj['qubit'] = qlist[0]
            if len(qlist) > 1:
                gate_obj['targets'] = qlist[1:]
        if 'target_qubits' in raw and isinstance(raw.get('target_qubits'), list):
            qlist = [ _parse_qubit_index(x) for x in raw.get('target_qubits') ]
            qlist = [x for x in qlist if x is not None]
            if len(qlist) > 0:
                gate_obj['qubit'] = qlist[0]
            if len(qlist) > 1:
                gate_obj['targets'] = qlist[1:]
        # support camelCase variants
        if 'qubitsList' in raw and isinstance(raw.get('qubitsList'), list):
            qlist = [ _parse_qubit_index(x) for x in raw.get('qubitsList') ]
            qlist = [x for x in qlist if x is not None]
            if len(qlist) > 0:
                gate_obj['qubit'] = qlist[0]
            if len(qlist) > 1:
                gate_obj['targets'] = qlist[1:]

        # position
        if 'position' in raw:
            try:
                gate_obj['position'] = int(raw.get('position'))
            except Exception:
                pass
        # targets/controls arrays
        if 'targets' in raw and isinstance(raw.get('targets'), list):
            gate_obj['targets'] = [ _parse_qubit_index(x) for x in raw.get('targets') ]
        if 'controls' in raw and isinstance(raw.get('controls'), list):
            gate_obj['controls'] = [ _parse_qubit_index(x) for x in raw.get('controls') ]
        # If controls present but no targets, try to infer a target from circuit context
        try:
            if ('controls' in gate_obj and gate_obj.get('controls') and not gate_obj.get('targets')) and circuit:
                # pick the first qubit id in circuit that is not a control
                cq = circuit.get('qubits') if isinstance(circuit, dict) else None
                if isinstance(cq, list):
                    all_ids = [ _parse_qubit_index(x.get('id') if isinstance(x, dict) else x) for x in cq ]
                    for cand in all_ids:
                        if cand is not None and cand not in gate_obj.get('controls'):
                            gate_obj['targets'] = [cand]
                            break
        except Exception:
            pass
        # if we found any gate fields, set out
        if gate_obj:
            out = {'type': 'add_gate', 'gate': gate_obj}

    # normalize remove_qubit with 'id' or 'index'
    if out.get('type') == 'remove_qubit' and 'id' not in out:
        if 'index' in raw:
            out['id'] = raw.get('index')
        elif 'qubit' in raw:
            out['id'] = _parse_qubit_index(raw.get('qubit'))

    return out


@app.post("/api/v1/ai/chat", response_model=AIResponse)
def ai_chat(req: AIChatRequest = Body(...)):
    """Call Gemini (server-side) and return assistant text + validated actions.
    Requires GEMINI_API_KEY in the environment and the google-genai python client installed.
    """
    GEMINI_KEY = os.getenv('GEMINI_API_KEY')
    # prefer a model that supports response schema enforcement; default to gemini-2.0-flash
    MODEL = req.model or os.getenv('GEMINI_MODEL', 'gemini-2.0-flash')

    # No dev mock: require the genai client and GEMINI_API_KEY to be present.

    # Detect genai client at call time. Prefer the modern import pattern used by
    # the google GenAI package: `from google import genai` per upstream examples.
    local_genai = None
    has_genai = False
    try:
        from google import genai as _g
        local_genai = _g
        has_genai = True
    except Exception:
        try:
            import genai as _g
            local_genai = _g
            has_genai = True
        except Exception:
            try:
                import google.generativeai as _g
                local_genai = _g
                has_genai = True
            except Exception:
                local_genai = None
                has_genai = False

    # Require the genai client and GEMINI_API_KEY; fail loud if either is missing.
    if not has_genai:
        raise HTTPException(status_code=501, detail='genai client not installed on server')
    if not GEMINI_KEY:
        raise HTTPException(status_code=501, detail='GEMINI_API_KEY not configured')

    try:
        # create client (genai reads GOOGLE_API_KEY env var). Ensure the key is
        # available under that name so the client can authenticate.
        os.environ.setdefault('GOOGLE_API_KEY', GEMINI_KEY)
        if hasattr(local_genai, 'Client'):
            client = local_genai.Client()
        else:
            client = local_genai
        # Build conversational contents: include a strict system prompt instructing the model to output
        # a fenced JSON block that exactly matches our schema. This encourages the model to produce
        # machine-parseable output which we validate server-side with Pydantic.
        # Strict system prompt: require canonical gate ids and strict JSON output.
        # We list the canonical gate ids the frontend supports to reduce ambiguity.
        allowed_gates = [
            'h','x','y','z','s','t','rx','ry','rz','p',
            'cnot','cz','swap','toffoli','measure','qft','iqft'
        ]

        system = (
            "You are the QuantumFlow assistant. YOUR RESPONSE MUST follow these rules exactly:\n"
            "1) Reply first with a 1-2 sentence human readable summary (no JSON in this part).\n"
            "2) Then output exactly one fenced JSON block containing a single JSON object (```json ... ```).\n"
            "3) That JSON object MUST have the exact top-level keys: 'actions' (array), optionally 'qubits' (array) and/or 'gates' (array).\n"
            "4) Each action object MUST have a 'type' whose value is one of: add_gate, remove_gate, update_gate, add_qubit, remove_qubit, import_circuit, add_gates.\n"
            "5) For gate objects use the canonical gate ids (lowercase) from this list only: " + ", ".join(allowed_gates) + ".\n"
            "6) Use 0-based numeric qubit indices. Multi-qubit gates MUST use 'controls' and/or 'targets' arrays of numeric indices.\n"
            "7) Do NOT include comments, code blocks other than the single JSON fenced block, or any extra text inside the JSON block.\n"
            "8) If you are unable to produce valid JSON that follows these rules, return a JSON object with an empty 'actions' array and a brief human-readable explanation in the assistant text.\n\n"
            "Examples (use these exact shapes):\n"
            "{ \"actions\": [ { \"type\": \"add_gate\", \"gate\": { \"type\": \"h\", \"qubit\": 0, \"position\": 1 } } ] }\n"
            "{ \"actions\": [ { \"type\": \"add_gates\", \"gates\": [ { \"type\": \"cnot\", \"controls\": [0], \"targets\": [1], \"position\": 2 } ] } ] }\n"
        )

        # Combine history into a single string for context
        convo = ''
        for m in req.history:
            role = m.get('role', 'user')
            content = m.get('content', '')
            convo += f"[{role}] {content}\n"

        # include circuit context if present
        circuit_context = ''
        try:
            import json as _json
            if req.circuit:
                circuit_context = "\nCurrent circuit state:\n" + _json.dumps(req.circuit, indent=2)
        except Exception:
            circuit_context = ''

        prompt = f"{system}\nConversation:\n{convo}{circuit_context}\nUser: {req.message}\nAssistant:"

        # Prefer asking the model to return structured JSON that matches our Pydantic AIResponse.
        # The genai client supports passing a response_schema to validate the model output server-side.
        structured = None
        response = None
        try:
            # Provide a response schema object so the client can return structured
            # content directly. Use the AIResponse Pydantic model as our schema
            # and alias it to ResponseMessage to match the genai examples.
            ResponseMessage = AIResponse
            response = client.models.generate_content(
                model=MODEL,
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "response_schema": ResponseMessage,
                    "temperature": 0.0,
                    "max_output_tokens": 800,
                },
            )
            # try to extract structured content (depends on client version)
            if hasattr(response, 'content'):
                structured = response.content
            elif hasattr(response, 'output'):
                structured = getattr(response, 'output')
            elif hasattr(response, 'text'):
                try:
                    import json as _json
                    structured = _json.loads(response.text)
                except Exception:
                    structured = None
        except Exception:
            # fallback: call without schema (older client or model) and parse free-text
            # fallback: try a plain call but keep deterministic temperature
            response = client.models.generate_content(model=MODEL, contents=prompt, config={"temperature": 0.0})

        assistant_text = ''
        if structured is not None:
            # structured may be an AIResponse instance or a dict
            try:
                if isinstance(structured, dict):
                    assistant_text = structured.get('assistant_text') or ''
                    # if the schema validated actions, we can use them directly later
                    json_block = None
                    actions_validated = structured.get('actions', [])
                    parsed_qubits_validated = structured.get('qubits')
                    parsed_gates_validated = structured.get('gates')
                else:
                    # Pydantic model instance
                    assistant_text = getattr(structured, 'assistant_text', '') or str(structured)
                    try:
                        actions_validated = getattr(structured, 'actions', []) or []
                    except Exception:
                        actions_validated = []
                    try:
                        parsed_qubits_validated = getattr(structured, 'qubits', None)
                    except Exception:
                        parsed_qubits_validated = None
                    try:
                        parsed_gates_validated = getattr(structured, 'gates', None)
                    except Exception:
                        parsed_gates_validated = None
            except Exception:
                assistant_text = getattr(response, 'text', None) or str(response)
        else:
            assistant_text = getattr(response, 'text', None) or str(response)

        # extract JSON block and validate
        json_block = _extract_json_block(assistant_text)
        actions_validated: list[dict] = []
        parsed_qubits_validated = None
        parsed_gates_validated = None
        if json_block:
            import json
            try:
                parsed = json.loads(json_block)
                acts = parsed.get('actions', []) if isinstance(parsed, dict) else []
                # debug: log raw acts
                try:
                    logger.debug("raw acts from assistant: %s", acts)
                except Exception:
                    logger.debug("raw acts logging failed")
                # attempt to normalize loosely-formed actions into canonical shapes
                acts = [_normalize_action(a, req.circuit) for a in acts]
                # Normalize any embedded gate dicts and gate.type aliases
                for a in acts:
                    try:
                        if isinstance(a, dict) and a.get('gate') and isinstance(a.get('gate'), dict):
                            a['gate'] = _normalize_gate_dict(a['gate'])
                        if isinstance(a, dict) and a.get('gates') and isinstance(a.get('gates'), list):
                            a['gates'] = [_normalize_gate_dict(g) for g in a.get('gates')]
                    except Exception:
                        pass
                try:
                    logger.debug("normalized acts: %s", acts)
                except Exception:
                    logger.debug("normalized acts logging failed")
                # Validate each action by trying to parse into one of AIAction variants
                validated: list = []
                from .models import AddGateAction, RemoveGateAction, UpdateGateAction, AddQubitAction, RemoveQubitAction, ImportCircuitAction, AddGatesAction
                for a in acts:
                    a_type = a.get('type')
                    try:
                        if a_type == 'add_gate':
                            # ensure embedded gate dict is normalized before validation
                            if isinstance(a.get('gate'), dict):
                                a['gate'] = _normalize_gate_dict(a['gate'])
                            obj = AddGateAction.model_validate(a)
                        elif a_type == 'remove_gate':
                            obj = RemoveGateAction.model_validate(a)
                        elif a_type == 'update_gate':
                            obj = UpdateGateAction.model_validate(a)
                        elif a_type == 'add_qubit':
                            obj = AddQubitAction.model_validate(a)
                        elif a_type == 'remove_qubit':
                            obj = RemoveQubitAction.model_validate(a)
                        elif a_type == 'import_circuit':
                            obj = ImportCircuitAction.model_validate(a)
                        elif a_type == 'add_gates':
                            obj = AddGatesAction.model_validate(a)
                        else:
                            continue
                        validated.append(obj.model_dump())
                    except Exception as e:
                        # log validation failure for debugging
                        try:
                            logger.exception('VALIDATION ERROR for action: %s', a)
                        except Exception:
                            logger.debug('Validation logging failed')
                        # Attempt a tolerant fallback for common 'add_gate' shorthand
                        try:
                            if a.get('type') == 'add_gate' and isinstance(a.get('gate'), dict):
                                # validate gate shape and accept (normalize first)
                                gm = GateModel.model_validate(_normalize_gate_dict(a.get('gate')))
                                validated.append({ 'type': 'add_gate', 'gate': gm.model_dump() })
                                continue
                            # tolerate when action already contains gate-like keys
                            if a.get('type') == 'add_gate' and ('gate_type' in a or 'qubits' in a or 'target_qubits' in a):
                                # build gate object
                                gate_obj = {}
                                if 'gate_type' in a:
                                    gate_obj['type'] = str(a.get('gate_type')).lower()
                                if 'qubits' in a and isinstance(a.get('qubits'), list):
                                    qlist = [ _parse_qubit_index(x) for x in a.get('qubits') ]
                                    qlist = [x for x in qlist if x is not None]
                                    if len(qlist) > 0:
                                        gate_obj['qubit'] = qlist[0]
                                    if len(qlist) > 1:
                                        gate_obj['targets'] = qlist[1:]
                                if 'target_qubits' in a and isinstance(a.get('target_qubits'), list):
                                    qlist = [ _parse_qubit_index(x) for x in a.get('target_qubits') ]
                                    qlist = [x for x in qlist if x is not None]
                                    if len(qlist) > 0:
                                        gate_obj['qubit'] = qlist[0]
                                    if len(qlist) > 1:
                                        gate_obj['targets'] = qlist[1:]
                                if gate_obj:
                                    try:
                                        gm = GateModel.model_validate(_normalize_gate_dict(gate_obj))
                                        validated.append({ 'type': 'add_gate', 'gate': gm.model_dump() })
                                        continue
                                    except Exception:
                                        pass
                        except Exception:
                            pass
                        # skip invalid actions but continue
                        continue
                actions_validated = validated
            except Exception as e:
                # bad JSON; ignore actions
                actions_validated = []

            # also accept whole-circuit suggestions in the JSON (qubits/gates)
            try:
                if isinstance(parsed, dict):
                    pq = parsed.get('qubits')
                    pg = parsed.get('gates')
                    if isinstance(pq, list):
                        parsed_qubits_validated = pq
                    if isinstance(pg, list):
                        # validate gates with GateModel
                        validated_gates = []
                        for g in pg:
                            try:
                                gm = GateModel.model_validate(_normalize_gate_dict(g))
                                validated_gates.append(gm.model_dump())
                            except Exception:
                                continue
                        parsed_gates_validated = validated_gates
            except Exception:
                parsed_qubits_validated = None
                parsed_gates_validated = None

        return AIResponse(assistant_text=assistant_text, actions=actions_validated, qubits=parsed_qubits_validated, gates=parsed_gates_validated)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=HOST, port=PORT)
