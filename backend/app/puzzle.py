from qiskit import QuantumCircuit
from qiskit.quantum_info import Operator

def get_target_unitary(label: str, circuit_qubits: int) -> Operator:
    base_targets = {
        "Pauli X": Operator.from_label("X"),
        "Pauli Z": Operator.from_label("Z"),
        "Identity": Operator.from_label("I"),
    }
    
    if label in base_targets:
        base_op = base_targets[label]
        if circuit_qubits == base_op.num_qubits:
            return base_op
        if circuit_qubits > base_op.num_qubits:
            remaining_qubits = circuit_qubits - base_op.num_qubits
            identity_qc = QuantumCircuit(remaining_qubits)
            identity_op = Operator(identity_qc)
            return base_op.expand(identity_op)
        raise ValueError(f"Circuit has fewer qubits than required")
    
    if label == "Swap":
        if circuit_qubits < 2:
            raise ValueError(f"Swap requires at least 2 qubits")
        swap_op = Operator([[1, 0, 0, 0],[0, 0, 1, 0],[0, 1, 0, 0],[0, 0, 0, 1]])
        if circuit_qubits > 2:
            remaining_qubits = circuit_qubits - 2
            identity_qc = QuantumCircuit(remaining_qubits)
            identity_op = Operator(identity_qc)
            return swap_op.expand(identity_op)
        return swap_op
    
    if label == "Toffoli":
        if circuit_qubits < 3:
            raise ValueError(f"Toffoli requires at least 3 qubits")
        toffoli_op = Operator([[1,0,0,0,0,0,0,0],[0,1,0,0,0,0,0,0],[0,0,1,0,0,0,0,0],[0,0,0,1,0,0,0,0],[0,0,0,0,1,0,0,0],[0,0,0,0,0,1,0,0],[0,0,0,0,0,0,0,1],[0,0,0,0,0,0,1,0]])
        if circuit_qubits > 3:
            remaining_qubits = circuit_qubits - 3
            identity_qc = QuantumCircuit(remaining_qubits)
            identity_op = Operator(identity_qc)
            return toffoli_op.expand(identity_op)
        return toffoli_op
    
    if label == "Controlled Rz":
        if circuit_qubits < 2:
            raise ValueError(f"Controlled Rz requires at least 2 qubits")
        crz_op = Operator([[1, 0, 0, 0],[0, 1, 0, 0],[0, 0, (0.9238795 - 0.3826834j), 0],[0, 0, 0, (0.9238795 + 0.3826834j)]])
        if circuit_qubits > 2:
            remaining_qubits = circuit_qubits - 2
            identity_qc = QuantumCircuit(remaining_qubits)
            identity_op = Operator(identity_qc)
            return crz_op.expand(identity_op)
        return crz_op
    
    raise ValueError(f"Unknown target label: {label}")

def check_solution(user_circuit: QuantumCircuit, target_matrix_label: str) -> bool:
    clean_circuit = user_circuit.copy()
    clean_circuit.remove_final_measurements()
    target_op = get_target_unitary(target_matrix_label, user_circuit.num_qubits)
    if clean_circuit.num_qubits != target_op.num_qubits:
        return False
    circuit_unitary = Operator(clean_circuit)
    return circuit_unitary.equiv(target_op)
