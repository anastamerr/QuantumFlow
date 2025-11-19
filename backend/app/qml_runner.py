"""
Quantum Machine Learning circuit execution and training.
"""
import numpy as np
from typing import List, Dict, Any, Tuple, Optional
import logging
from .qiskit_runner import run_circuit
from .qml_templates import create_qnn_circuit

logger = logging.getLogger(__name__)


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
    # Preprocess data: scale to [0, π] for better quantum encoding
    scaled_data = [x * np.pi for x in data_point]
    
    # Build QNN circuit
    gates = create_qnn_circuit(scaled_data, num_qubits, num_layers, parameters, encoding)
    
    # Execute circuit
    result = run_circuit(num_qubits, gates, shots=shots, memory=False)
    
    # Calculate expectation value from measurement probabilities
    # For XOR-like problems, use parity measurement (measure all qubits)
    probs = result["probabilities"]
    
    # Compute parity: count 1s in bitstring, if odd -> 1, if even -> 0
    parity_expectation = 0.0
    for state, prob in probs.items():
        num_ones = state.count('1')
        parity = 1 if num_ones % 2 == 1 else 0
        parity_expectation += prob * parity
    
    return float(parity_expectation)


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
    # Initialize parameters with better initialization strategy
    num_params = num_qubits * 3 * num_layers
    # Use small random initialization near zero
    parameters = np.random.uniform(-0.5, 0.5, num_params).tolist()
    
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
    
    # Adaptive learning rate - start higher for QML
    current_lr = max(learning_rate, 0.05)  # Ensure minimum LR of 0.05
    best_loss = float('inf')
    patience = 5
    no_improve_count = 0
    
    # Training loop (simplified - just a few epochs for demo)
    for epoch in range(min(epochs, 30)):  # Limit to 30 for speed
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
        
        logger.info(f"Epoch {epoch + 1}/{min(epochs, 30)}: Loss = {cost:.4f}, LR = {current_lr:.4f}")
        logger.info(f"  Sample predictions: {predictions[:5]}")
        logger.info(f"  Sample labels: {train_labels[:5]}")
        
        # Check for improvement
        if cost < best_loss - 1e-4:
            best_loss = cost
            no_improve_count = 0
        else:
            no_improve_count += 1
            # Reduce learning rate if no improvement
            if no_improve_count >= patience:
                current_lr *= 0.5
                no_improve_count = 0
                logger.info(f"  Reducing learning rate to {current_lr:.4f}")
        
        # Early stopping if loss is very small
        if cost < 1e-3:
            logger.info("  Converged! Loss < 0.001")
            break
        
        # Parameter update using two-sided SPSA for better gradient estimation
        if epoch < min(epochs, 30) - 1:  # Don't update on last epoch
            # Generate random perturbation direction
            delta = np.random.choice([-1, 1], size=num_params)
            epsilon = 0.1  # Fixed perturbation size
            
            # Evaluate at both perturbed points (two-sided SPSA)
            params_plus = np.array(parameters) + epsilon * delta
            preds_plus = []
            for data_point in train_data:
                pred = execute_qnn_circuit(
                    data_point, params_plus.tolist(), num_qubits, num_layers, encoding, shots
                )
                preds_plus.append(pred)
            cost_plus = cost_func(preds_plus, train_labels)
            
            params_minus = np.array(parameters) - epsilon * delta
            preds_minus = []
            for data_point in train_data:
                pred = execute_qnn_circuit(
                    data_point, params_minus.tolist(), num_qubits, num_layers, encoding, shots
                )
                preds_minus.append(pred)
            cost_minus = cost_func(preds_minus, train_labels)
            
            # Two-sided SPSA gradient: g ≈ (f(θ+ε·δ) - f(θ-ε·δ)) / (2ε) · δ
            gradient_estimate = ((cost_plus - cost_minus) / (2 * epsilon)) * delta
            
            # Gradient descent update with clipping
            grad_norm = np.linalg.norm(gradient_estimate)
            if grad_norm > 5:  # Clip large gradients
                gradient_estimate = gradient_estimate / grad_norm * 5
                logger.info(f"  Clipped gradient from {grad_norm:.4f} to 5.0")
            
            # Move OPPOSITE to gradient (gradient descent)
            parameters = np.array(parameters) - current_lr * gradient_estimate
            parameters = parameters.tolist()
            
            logger.info(f"  Costs: {cost_minus:.4f} <- {cost:.4f} -> {cost_plus:.4f}")
            logger.info(f"  Gradient norm: {grad_norm:.4f}, Update: -{current_lr * grad_norm:.4f}")
    
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
