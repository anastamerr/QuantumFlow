"""
Quantum Machine Learning circuit templates.
"""
from typing import List, Dict, Any
import math


def create_angle_encoding_circuit(data_point: List[float], num_qubits: int) -> List[Dict[str, Any]]:
    """
    Create angle encoding circuit (RY rotations with data).
    
    Args:
        data_point: Data values to encode (one per qubit)
        num_qubits: Number of qubits
        
    Returns:
        List of gate dictionaries
    """
    gates = []
    for i in range(min(num_qubits, len(data_point))):
        gates.append({
            "type": "ry",
            "qubit": i,
            "position": 0,
            "params": {"theta": float(data_point[i])}
        })
    return gates


def create_amplitude_encoding_circuit(data_point: List[float], num_qubits: int) -> List[Dict[str, Any]]:
    """
    Create amplitude encoding circuit (approximation using RY gates).
    
    Args:
        data_point: Data values to encode
        num_qubits: Number of qubits
        
    Returns:
        List of gate dictionaries
    """
    # Normalize data
    norm = math.sqrt(sum(x**2 for x in data_point))
    if norm == 0:
        norm = 1
    normalized = [x / norm for x in data_point]
    
    gates = []
    # Use RY gates to approximate amplitude encoding
    for i in range(min(num_qubits, len(normalized))):
        angle = 2 * math.asin(min(1.0, abs(normalized[i])))
        gates.append({
            "type": "ry",
            "qubit": i,
            "position": 0,
            "params": {"theta": float(angle)}
        })
    return gates


def create_variational_layer(num_qubits: int, layer_index: int, params: List[float]) -> List[Dict[str, Any]]:
    """
    Create a variational layer with RY rotations and CNOT entanglement.
    Optimized for XOR-like problems with all-to-all connectivity.
    
    Args:
        num_qubits: Number of qubits
        layer_index: Layer index for positioning
        params: Rotation parameters (3 per qubit: RY, RZ, RY)
        
    Returns:
        List of gate dictionaries
    """
    gates = []
    base_position = layer_index * 4  # 3 rotations + 1 entanglement
    
    # Rotation layer 1: RY gates
    for i in range(num_qubits):
        param_idx = i * 3
        if param_idx < len(params):
            gates.append({
                "type": "ry",
                "qubit": i,
                "position": base_position,
                "params": {"theta": float(params[param_idx])}
            })
    
    # Rotation layer 2: RZ gates
    for i in range(num_qubits):
        param_idx = i * 3 + 1
        if param_idx < len(params):
            gates.append({
                "type": "rz",
                "qubit": i,
                "position": base_position + 1,
                "params": {"phi": float(params[param_idx])}
            })
    
    # Rotation layer 3: RY gates
    for i in range(num_qubits):
        param_idx = i * 3 + 2
        if param_idx < len(params):
            gates.append({
                "type": "ry",
                "qubit": i,
                "position": base_position + 2,
                "params": {"theta": float(params[param_idx])}
            })
    
    # Entanglement layer: CNOTs
    for i in range(num_qubits - 1):
        gates.append({
            "type": "cnot",
            "qubit": i,
            "targets": [i + 1],
            "position": base_position + 3
        })
    
    # Cyclic entanglement
    if num_qubits > 2:
        gates.append({
            "type": "cnot",
            "qubit": num_qubits - 1,
            "targets": [0],
            "position": base_position + 3
        })
    
    return gates


def create_qnn_circuit(
    data_point: List[float],
    num_qubits: int,
    num_layers: int,
    parameters: List[float],
    encoding: str = "angle"
) -> List[Dict[str, Any]]:
    """
    Create a full QNN circuit with data encoding and variational layers.
    
    Args:
        data_point: Input data to encode
        num_qubits: Number of qubits
        num_layers: Number of variational layers
        parameters: All variational parameters
        encoding: Encoding method ("angle" or "amplitude")
        
    Returns:
        List of gate dictionaries forming complete QNN circuit
    """
    gates = []
    
    # Data encoding layer
    if encoding == "angle":
        gates.extend(create_angle_encoding_circuit(data_point, num_qubits))
    elif encoding == "amplitude":
        gates.extend(create_amplitude_encoding_circuit(data_point, num_qubits))
    
    # Variational layers
    params_per_layer = num_qubits * 3
    for layer_idx in range(num_layers):
        start_idx = layer_idx * params_per_layer
        end_idx = start_idx + params_per_layer
        layer_params = parameters[start_idx:end_idx] if start_idx < len(parameters) else []
        
        # Pad with zeros if not enough parameters
        while len(layer_params) < params_per_layer:
            layer_params.append(0.0)
        
        gates.extend(create_variational_layer(num_qubits, layer_idx + 1, layer_params))
    
    return gates


def get_qml_templates() -> Dict[str, Any]:
    """
    Get all available QML templates.
    
    Returns:
        Dictionary of template configurations
    """
    return {
        "templates": [
            {
                "id": "qnn_regression",
                "name": "Quantum Neural Network (Regression)",
                "description": "QNN for continuous value prediction",
                "num_qubits": 3,
                "num_layers": 3,
                "encoding": "amplitude",
                "num_parameters": 27  # 3 qubits * 3 params * 3 layers
            },
            {
                "id": "hardware_efficient",
                "name": "Hardware-Efficient Ansatz",
                "description": "Optimized for near-term quantum hardware",
                "num_qubits": 4,
                "num_layers": 2,
                "encoding": "angle",
                "num_parameters": 24
            }
        ]
    }
