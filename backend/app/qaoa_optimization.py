from __future__ import annotations

from typing import Dict, List, Literal, Tuple

from pydantic import BaseModel, Field
from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator
from scipy.optimize import minimize


class MaxCutEdge(BaseModel):
    """Single weighted edge in an undirected graph for MaxCut.

    Nodes are referred to by integer ids; weights default to 1.0 if omitted.
    The QUBO builder will treat (u, v) and (v, u) symmetrically.
    """

    u: int
    v: int
    weight: float = 1.0


class KnapsackItem(BaseModel):
    """Item in a 0/1 knapsack instance (value, weight)."""

    value: float
    weight: float


class QuboModel(BaseModel):
    """Lightweight container for a QUBO matrix stored in a dict.

    Keys are of the form "i,j" and represent x_i * x_j quadratic terms.
    """

    Q: Dict[str, float]


class QaoaProblem(BaseModel):
    """Problem description sent from the frontend to the QAOA optimizer.

    The frontend specifies a logical problem (MaxCut or Knapsack) and coarse
    QAOA hyper-parameters. All heavy lifting (QUBO construction, Ising
    mapping, circuit building, and parameter optimization) happens on the
    backend so the UI stays lightweight.
    """

    problem_type: Literal["maxcut", "knapsack"]
    # MaxCut
    edges: List[MaxCutEdge] | None = None
    # Knapsack
    items: List[KnapsackItem] | None = None
    capacity: float | None = None

    # QAOA settings
    # p is the number of alternating cost/mixer layers; we keep it small
    # to avoid very deep circuits and long runtimes in the browser demo.
    p: int = Field(1, ge=1, le=3)
    # shots controls sampling resolution for estimating the objective.
    shots: int = Field(512, ge=1, le=8192)


class QaoaResult(BaseModel):
    """Compact result returned to the frontend.

    best_bitstring is expressed in *logical* order: index 0 corresponds to
    variable / qubit 0 and is shown as the left-most bit in the UI.
    probabilities contains the sampled distribution over logical bitstrings.
    gates is a minimal representation of the QAOA circuit that the frontend
    can render on the existing canvas.
    """

    best_bitstring: str
    best_energy: float
    probabilities: Dict[str, float]
    gates: List[Dict[str, object]]


def _build_qubo_maxcut(edges: List[MaxCutEdge]) -> Dict[str, float]:
    """Build a standard MaxCut QUBO from a set of weighted edges.

    For an edge (u, v) with weight w, the classical MaxCut cost can be
    written as w * x_u * (1 - x_v) + w * x_v * (1 - x_u). After expansion
    and collecting terms we get contributions to Q[u,u], Q[v,v], and Q[u,v].
    The resulting QUBO is compatible with the evaluate_bitstring() helper.
    """

    Q: Dict[str, float] = {}

    def add(i: int, j: int, value: float) -> None:
        # Store terms in a symmetric QUBO dict using sorted indices.
        if i > j:
            i, j = j, i
        key = f"{i},{j}"
        Q[key] = Q.get(key, 0.0) + float(value)

    for e in edges:
        u, v, w = e.u, e.v, float(e.weight or 1.0)
        # -w x_u^2 - w x_v^2 + 2w x_u x_v
        add(u, u, -w)
        add(v, v, -w)
        add(u, v, 2 * w)

    return Q


def _build_qubo_knapsack(items: List[KnapsackItem], capacity: float, penalty: float | None = None) -> Dict[str, float]:
    """Build a QUBO for a 0/1 knapsack instance.

    We maximize total value subject to a capacity constraint by minimizing:

        -sum_i v_i x_i + λ (sum_i w_i x_i - C)^2

    where λ is chosen large enough (if not provided explicitly) to penalize
    constraint violations. The square expands into linear and quadratic
    terms on the binary variables, which we collect into Q.
    """

    values = [float(it.value) for it in items]
    weights = [float(it.weight) for it in items]
    n = len(values)
    if n == 0:
        return {}
    # Default penalty: slightly larger than the biggest item value.
    lam = penalty or (max(values) + 1.0)

    Q: Dict[str, float] = {}

    def add(i: int, j: int, value: float) -> None:
        if i > j:
            i, j = j, i
        key = f"{i},{j}"
        Q[key] = Q.get(key, 0.0) + float(value)

    # Objective term: -v_i x_i
    for i, v in enumerate(values):
        add(i, i, -v)

    # Penalty term: λ (Σ w_i x_i - C)^2
    for i, wi in enumerate(weights):
        diag = lam * (wi * wi - 2 * capacity * wi)
        add(i, i, diag)
    for i in range(n):
        for j in range(i + 1, n):
            wi, wj = weights[i], weights[j]
            add(i, j, 2 * lam * wi * wj)

    return Q


def _qubo_to_ising(Q: Dict[str, float]) -> Tuple[Dict[int, float], Dict[Tuple[int, int], float]]:
    """Convert a QUBO Q(x) into an equivalent Ising model H(z).

    We use the standard substitution x_i = (1 - z_i) / 2 to translate the
    quadratic form defined on {0,1} variables into a Hamiltonian on
    {+1,-1} spins, capturing the same optimization landscape up to an
    additive constant. The resulting model is parameterized by:

      H(z) = sum_i h_i z_i + sum_{i<j} J_{ij} z_i z_j + const.
    """

    diag: Dict[int, float] = {}
    off: Dict[Tuple[int, int], float] = {}
    for key, value in Q.items():
        i_str, j_str = key.split(",")
        i = int(i_str)
        j = int(j_str)
        if i == j:
            diag[i] = diag.get(i, 0.0) + float(value)
        else:
            if i > j:
                i, j = j, i
            off[(i, j)] = off.get((i, j), 0.0) + float(value)

    h: Dict[int, float] = {}
    J: Dict[Tuple[int, int], float] = {}

    # Linear terms from diagonal of Q.
    for i, qii in diag.items():
        h[i] = h.get(i, 0.0) - qii / 2.0

    # Couplings and additional linear shifts from off-diagonal terms.
    for (i, j), qij in off.items():
        c = qij / 4.0
        h[i] = h.get(i, 0.0) - c
        h[j] = h.get(j, 0.0) - c
        J[(i, j)] = J.get((i, j), 0.0) + c

    return h, J


def _evaluate_bitstring(bitstring: str, Q: Dict[str, float]) -> float:
    """Evaluate QUBO energy for a given logical bitstring.

    The bitstring is interpreted in *logical* order: bit 0 corresponds to
    variable index 0, which is also qubit 0 in the QAOA circuit. This
    matches the UI expectation where the left-most character is x_0.
    """

    x = [1 if b == "1" else 0 for b in bitstring]
    energy = 0.0
    for key, coeff in Q.items():
        i_str, j_str = key.split(",")
        i, j = int(i_str), int(j_str)
        if i < len(x) and j < len(x):
            energy += float(coeff) * x[i] * x[j]
    return energy


def _build_qaoa_circuit(
    num_qubits: int,
    h: Dict[int, float],
    J: Dict[Tuple[int, int], float],
    p: int,
    betas: List[float],
    gammas: List[float],
) -> Tuple[QuantumCircuit, List[Dict[str, object]]]:
    """Build a QAOA circuit for given angles ``betas`` and ``gammas``.

    The returned ``QuantumCircuit`` is what we execute on the simulator and
    always ends with measurements. The accompanying gate list is a simplified
    schema (type, qubit, position, params, targets, controls) that mirrors
    the frontend's ``GateModel`` and is used only for visualization.
    """
    qc = QuantumCircuit(num_qubits)
    gates: List[Dict[str, object]] = []

    def add_gate(
        gtype: str,
        qubit: int | None = None,
        position: int | None = None,
        params: Dict[str, float] | None = None,
        targets: List[int] | None = None,
        controls: List[int] | None = None,
    ) -> None:
        """Append a gate description to ``gates`` for frontend rendering.

        We do not assign ids here; the frontend Redux slice will generate
        stable ids when it merges these gates into the canvas state.
        """
        g: Dict[str, object] = {"type": gtype}
        if qubit is not None:
            g["qubit"] = qubit
        if position is not None:
            g["position"] = position
        if params:
            g["params"] = params
        if targets:
            g["targets"] = targets
        if controls:
            g["controls"] = controls
        gates.append(g)

    # Initial superposition layer (Hadamards on all qubits).
    # We keep a simple integer time index ``t`` for the visualization
    # so the frontend can lay gates out in order from left to right.
    t = 0

    for q in range(num_qubits):
        qc.h(q)
        add_gate("h", qubit=q, position=t)

    for k in range(p):
        beta = betas[k]
        gamma = gammas[k]

    # Cost unitary: single-qubit Z rotations from h_i z_i terms.
        for q, hz in h.items():
            if abs(hz) < 1e-12:
                continue
            angle = 2 * gamma * hz
            qc.rz(angle, q)
            t += 1
            add_gate("rz", qubit=q, position=t, params={"phi": angle})

    # Cost unitary: two-qubit ZZ interactions from J_{ij} z_i z_j.
        for (i, j), Jij in J.items():
            if abs(Jij) < 1e-12:
                continue
            angle = 2 * gamma * Jij
            qc.cx(i, j)
            add_gate("cnot", qubit=i, position=t, targets=[j])
            qc.rz(angle, j)
            t += 1
            add_gate("rz", qubit=j, position=t, params={"phi": angle})
            qc.cx(i, j)
            t += 1
            add_gate("cnot", qubit=i, position=t, targets=[j])

    # Mixer unitary: Rx rotations on each qubit.
        for q in range(num_qubits):
            angle = 2 * beta
            qc.rx(angle, q)
            t += 1
            add_gate("rx", qubit=q, position=t, params={"theta": angle})

    # Measure all qubits at the end to obtain bitstrings.
    qc.measure_all()
    return qc, gates


def run_qaoa(problem: QaoaProblem) -> QaoaResult:
    """End-to-end QAOA solver used by the ``/api/v1/qaoa/optimize`` endpoint.

    Steps:
      1. Build a QUBO from the high-level problem description.
      2. Convert QUBO to an Ising model (h, J).
      3. Use COBYLA to optimize QAOA angles (betas, gammas) by minimizing
         the expected QUBO energy.
      4. Rebuild the circuit with optimized parameters, sample bitstrings,
         and pick the lowest-energy sample as best_bitstring.

    Bitstring endianness is carefully normalized so that all QUBO energy
    computations and UI rendering treat bit 0 as the *left-most* character
    corresponding to qubit / variable 0.
    """

    # Build QUBO
    if problem.problem_type == "maxcut":
        edges = problem.edges or []
        Q = _build_qubo_maxcut(edges)
        num_vars = max([max(e.u, e.v) for e in edges], default=-1) + 1
    else:
        items = problem.items or []
        if problem.capacity is None:
            raise ValueError("capacity is required for knapsack QAOA")
        Q = _build_qubo_knapsack(items, float(problem.capacity))
        num_vars = len(items)

    if num_vars <= 0:
        raise ValueError("No variables in QAOA problem")

    # QUBO -> Ising
    h, J = _qubo_to_ising(Q)

    backend = AerSimulator()

    # Objective function for COBYLA: minimize expected QUBO energy
    def objective(theta: List[float]) -> float:
        p = problem.p
        betas = list(theta[:p])
        gammas = list(theta[p: 2 * p])

        qc, _ = _build_qaoa_circuit(num_vars, h, J, p, betas, gammas)
        job = backend.run(qc, shots=problem.shots)
        result = job.result()

        counts = result.get_counts()
        if not isinstance(counts, dict):
            if isinstance(counts, list) and counts:
                counts = counts[0]
            else:
                raise RuntimeError("Unexpected counts format from QAOA execution")

        # Normalize bitstrings so index 0 corresponds to variable/qubit 0 (leftmost)
        logical_counts: Dict[str, int] = {}
        for raw_bs, c in counts.items():
            bs = str(raw_bs)
            logical_bs = bs[::-1]
            logical_counts[logical_bs] = logical_counts.get(logical_bs, 0) + int(c)

        total = float(problem.shots) if problem.shots else sum(logical_counts.values())
        exp_energy = 0.0
        for bitstring, c in logical_counts.items():
            p_bs = float(c) / total
            e_bs = _evaluate_bitstring(bitstring, Q)
            exp_energy += p_bs * e_bs
        return exp_energy

    # Initial angles: small random-ish values to start COBYLA
    import math

    p_layers = problem.p
    x0 = [0.1 * (k + 1) for k in range(p_layers)] + [0.05 * (k + 1) for k in range(p_layers)]

    res = minimize(
        objective,
        x0,
        method="COBYLA",
        options={"maxiter": 50, "rhobeg": 0.5},
    )

    opt_betas = list(res.x[:p_layers])
    opt_gammas = list(res.x[p_layers: 2 * p_layers])

    # Build final circuit with optimized angles and compute probabilities
    qc_opt, gate_list = _build_qaoa_circuit(num_vars, h, J, p_layers, opt_betas, opt_gammas)
    job_opt = backend.run(qc_opt, shots=problem.shots)
    result_opt = job_opt.result()

    counts = result_opt.get_counts()
    if not isinstance(counts, dict):
        if isinstance(counts, list) and counts:
            counts = counts[0]
        else:
            raise RuntimeError("Unexpected counts format from optimized QAOA execution")

    # Normalize bitstrings as above
    logical_counts: Dict[str, int] = {}
    for raw_bs, c in counts.items():
        bs = str(raw_bs)
        logical_bs = bs[::-1]
        logical_counts[logical_bs] = logical_counts.get(logical_bs, 0) + int(c)

    total_shots = float(problem.shots) if problem.shots else sum(logical_counts.values())
    probabilities: Dict[str, float] = {}
    for bitstring, c in logical_counts.items():
        probabilities[bitstring] = float(c) / total_shots

    # Pick best bitstring by QUBO energy using final probabilities
    best_bitstring = None
    best_energy = float("inf")
    for bitstring, p_bs in probabilities.items():
        if p_bs <= 0.0:
            continue
        e = _evaluate_bitstring(bitstring, Q)
        if e < best_energy:
            best_energy = e
            best_bitstring = bitstring

    if best_bitstring is None:
        raise RuntimeError("Could not determine best bitstring from QAOA results")

    return QaoaResult(
        best_bitstring=best_bitstring,
        best_energy=float(best_energy),
        probabilities=probabilities,
        gates=gate_list,
    )
