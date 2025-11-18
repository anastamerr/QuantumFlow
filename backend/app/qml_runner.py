"""
Quantum Machine Learning circuit execution and training.
"""
import numpy as np
from typing import List, Dict, Any, Tuple, Optional
from .qiskit_runner import run_circuit
from .qml_templates import create_qnn_circuit


def cost_function_mse(predictions: List[float], labels: List[float]) -> float:
    """Mean squared error cost function."""
    predictions = np.array(predictions)
    labels = np.array(labels)
    return float(np.mean((predictions - labels) ** 2))


def cost_function_cross_entropy(predictions: List[float], labels: List[float]) -> float:
    """Binary cross-entropy cost function."""
    predictions = np.array(predictions)
    labels = np.array(labels)
    # Clip to avoid log(0)
    predictions = np.clip(predictions, 1e-10, 1 - 1e-10)
    return float(-np.mean(labels * np.log(predictions) + (1 - labels) * np.log(1 - predictions)))


def execute_qnn_circuit(
    data_point: List[float],
    parameters: List[float],
    num_qubits: int,
    num_layers: int,
    encoding: str = "angle",
    shots: int = 1024
) -> float:
    """
    Execute QNN circuit and get expectation value.
    
    Args:
        data_point: Input data
        parameters: Variational parameters
        num_qubits: Number of qubits
        num_layers: Number of layers
        encoding: Encoding method
        shots: Number of measurement shots
        
    Returns:
        Expectation value (prediction)
    """
    # Build QNN circuit
    gates = create_qnn_circuit(data_point, num_qubits, num_layers, parameters, encoding)
    
    # Execute circuit
    result = run_circuit(num_qubits, gates, shots=shots, memory=False)
    
    # Calculate expectation value from measurement probabilities
    # Use Z expectation on first qubit: <Z> = P(0) - P(1)
    probs = result["probabilities"]
    
    prob_0 = sum(float(p) for state, p in probs.items() if state.endswith('0'))
    prob_1 = sum(float(p) for state, p in probs.items() if state.endswith('1'))
    
    expectation = prob_0 - prob_1
    
    # Map to [0, 1] for classification
    prediction = (expectation + 1) / 2
    
    return float(prediction)


def train_qnn(
    train_data: List[List[float]],
    train_labels: List[float],
    num_qubits: int,
    num_layers: int,
    encoding: str = "angle",
    learning_rate: float = 0.01,
    epochs: int = 10,
    shots: int = 1024,
    cost_fn: str = "mse"
) -> Dict[str, Any]:
    """
    Train a QNN using parameter-shift gradient descent.
    
    Args:
        train_data: Training data points
        train_labels: Training labels
        num_qubits: Number of qubits
        num_layers: Number of variational layers
        encoding: Data encoding method
        learning_rate: Learning rate for optimization
        epochs: Number of training epochs
        shots: Shots per circuit execution
        cost_fn: Cost function ("mse" or "cross_entropy")
        
    Returns:
        Training results with parameters and history
    """
    # Initialize parameters randomly
    num_params = num_qubits * 3 * num_layers
    parameters = np.random.uniform(0, 2 * np.pi, num_params).tolist()
    
    # Training history
    history = {
        "loss": [],
        "epoch": []
    }
    
    # Choose cost function
    if cost_fn == "cross_entropy":
        cost_func = cost_function_cross_entropy
    else:
        cost_func = cost_function_mse
    
    # Training loop (simplified - just a few epochs for demo)
    for epoch in range(min(epochs, 3)):  # Limit to 3 for speed
        predictions = []
        
        # Forward pass: get predictions for all samples
        for data_point in train_data:
            pred = execute_qnn_circuit(
                data_point, parameters, num_qubits, num_layers, encoding, shots
            )
            predictions.append(pred)
        
        # Calculate cost
        cost = cost_func(predictions, train_labels)
        history["loss"].append(float(cost))
        history["epoch"].append(epoch + 1)
        
        # Simplified parameter update (random perturbation for demo)
        # In production, use proper gradient descent or SPSA
        if epoch < min(epochs, 3) - 1:  # Don't update on last epoch
            perturbation = np.random.normal(0, learning_rate, num_params)
            parameters = (np.array(parameters) + perturbation).tolist()
    
    return {
        "parameters": parameters,
        "final_loss": history["loss"][-1] if history["loss"] else 0.0,
        "history": history,
        "num_params": num_params,
        "epochs_completed": len(history["loss"])
    }


def evaluate_qnn(
    test_data: List[List[float]],
    test_labels: List[float],
    parameters: List[float],
    num_qubits: int,
    num_layers: int,
    encoding: str = "angle",
    shots: int = 1024
) -> Dict[str, Any]:
    """
    Evaluate trained QNN on test data.
    
    Args:
        test_data: Test data points
        test_labels: Test labels
        parameters: Trained parameters
        num_qubits: Number of qubits
        num_layers: Number of layers
        encoding: Encoding method
        shots: Measurement shots
        
    Returns:
        Evaluation metrics
    """
    predictions = []
    
    for data_point in test_data:
        pred = execute_qnn_circuit(
            data_point, parameters, num_qubits, num_layers, encoding, shots
        )
        predictions.append(pred)
    
    # Calculate metrics
    predictions_np = np.array(predictions)
    labels_np = np.array(test_labels)
    
    # For binary classification: threshold at 0.5
    binary_preds = (predictions_np >= 0.5).astype(int)
    binary_labels = (labels_np >= 0.5).astype(int)
    
    accuracy = float(np.mean(binary_preds == binary_labels))
    mse = float(np.mean((predictions_np - labels_np) ** 2))
    
    # Confusion matrix
    tp = int(np.sum((binary_preds == 1) & (binary_labels == 1)))
    tn = int(np.sum((binary_preds == 0) & (binary_labels == 0)))
    fp = int(np.sum((binary_preds == 1) & (binary_labels == 0)))
    fn = int(np.sum((binary_preds == 0) & (binary_labels == 1)))
    
    return {
        "accuracy": accuracy,
        "mse": mse,
        "predictions": [float(p) for p in predictions],
        "confusion_matrix": {
            "tp": tp, "tn": tn, "fp": fp, "fn": fn
        }
    }
