"""
Quantum Circuit Assistant - MCP Server
Provides tools for the AI chatbot to manipulate quantum circuits with human-in-the-loop guidance
"""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class CircuitState(BaseModel):
    """Current state of the quantum circuit"""
    num_qubits: int
    gates: List[Dict[str, Any]]
    depth: int
    
    
class GateOperation(BaseModel):
    """A gate operation to be performed"""
    type: str
    qubit: Optional[int] = None
    targets: Optional[List[int]] = None
    controls: Optional[List[int]] = None
    params: Optional[Dict[str, float]] = None
    position: Optional[int] = None


class CircuitAssistant:
    """
    AI assistant that can read and manipulate quantum circuits
    with educational guidance and error correction
    """
    
    def __init__(self):
        self.circuit_state: Optional[CircuitState] = None
        self.interaction_history: List[Dict[str, Any]] = []
        
    def get_circuit_state(self, circuit_data: Dict[str, Any]) -> CircuitState:
        """Parse and understand the current circuit state"""
        gates = circuit_data.get('gates', [])
        num_qubits = circuit_data.get('qubits', 2)
        
        # Calculate circuit depth
        depth = 0
        if gates:
            depth = max((g.get('position', 0) for g in gates), default=0) + 1
            
        self.circuit_state = CircuitState(
            num_qubits=num_qubits,
            gates=gates,
            depth=depth
        )
        return self.circuit_state
    
    def analyze_circuit(self) -> Dict[str, Any]:
        """Analyze the current circuit and provide insights"""
        if not self.circuit_state:
            return {
                "status": "empty",
                "message": "The circuit is empty. Let's start building! Would you like to begin with a simple gate like Hadamard (H) to create superposition?",
                "suggestions": [
                    "Add an H gate to qubit 0 to create superposition",
                    "Start with an X gate to flip a qubit",
                    "Create a Bell state with H and CNOT gates"
                ]
            }
        
        gates = self.circuit_state.gates
        num_qubits = self.circuit_state.num_qubits
        
        # Analyze circuit properties
        analysis = {
            "num_qubits": num_qubits,
            "num_gates": len(gates),
            "depth": self.circuit_state.depth,
            "gate_types": {},
            "has_entanglement": False,
            "has_superposition": False,
            "issues": [],
            "suggestions": []
        }
        
        # Count gate types
        for gate in gates:
            gate_type = gate.get('type', gate.get('name', 'unknown'))
            analysis["gate_types"][gate_type] = analysis["gate_types"].get(gate_type, 0) + 1
            
            # Check for entanglement
            if gate_type in ['cx', 'cnot', 'cz', 'swap']:
                analysis["has_entanglement"] = True
                
            # Check for superposition
            if gate_type in ['h', 'hadamard', 'ry', 'rx']:
                analysis["has_superposition"] = True
        
        # Generate educational feedback
        if not analysis["has_superposition"]:
            analysis["suggestions"].append(
                "💡 Try adding a Hadamard (H) gate to create superposition - it puts a qubit in a state where it's both 0 and 1 at the same time!"
            )
            
        if num_qubits > 1 and not analysis["has_entanglement"]:
            analysis["suggestions"].append(
                "🔗 You have multiple qubits but no entanglement yet. Try adding a CNOT gate to create quantum correlations between qubits!"
            )
            
        if len(gates) == 0:
            analysis["suggestions"].append(
                "🚀 Great! You're ready to build. What kind of circuit would you like to create? I can help you with Bell states, GHZ states, or quantum algorithms!"
            )
        
        return analysis
    
    def validate_gate_operation(self, operation: GateOperation) -> Dict[str, Any]:
        """
        Validate if a gate operation is valid and provide helpful feedback
        """
        if not self.circuit_state:
            return {
                "valid": False,
                "error": "No circuit initialized. Let's create one first!",
                "suggestion": "I'll help you set up a circuit. How many qubits would you like to work with?"
            }
        
        issues = []
        warnings = []
        
        # Check qubit bounds
        if operation.qubit is not None:
            if operation.qubit >= self.circuit_state.num_qubits or operation.qubit < 0:
                issues.append(
                    f"Oops! Qubit {operation.qubit} doesn't exist. Your circuit has qubits 0 to {self.circuit_state.num_qubits - 1}. "
                    f"Would you like to use qubit {self.circuit_state.num_qubits - 1} instead?"
                )
        
        # Check target qubits for multi-qubit gates
        if operation.targets:
            for target in operation.targets:
                if target >= self.circuit_state.num_qubits or target < 0:
                    issues.append(
                        f"Target qubit {target} is out of range. Let me help you fix that!"
                    )
        
        # Check control qubits
        if operation.controls:
            for control in operation.controls:
                if control >= self.circuit_state.num_qubits or control < 0:
                    issues.append(
                        f"Control qubit {control} is out of range."
                    )
                if operation.targets and control in operation.targets:
                    issues.append(
                        "A qubit can't control itself! Let's choose different qubits for control and target."
                    )
        
        # Educational warnings
        if operation.type.lower() in ['h', 'hadamard']:
            if operation.qubit is not None:
                # Check if there's already an H gate on this qubit
                existing_h = [g for g in self.circuit_state.gates 
                             if g.get('type', '').lower() in ['h', 'hadamard'] 
                             and g.get('qubit') == operation.qubit]
                if len(existing_h) > 0:
                    warnings.append(
                        f"📚 Fun fact: Two Hadamard gates in a row cancel each other out! "
                        f"You already have {len(existing_h)} H gate(s) on qubit {operation.qubit}."
                    )
        
        if operation.type.lower() in ['x', 'pauli-x']:
            warnings.append(
                "🔄 The X gate is like a classical NOT gate - it flips |0⟩ to |1⟩ and vice versa!"
            )
        
        return {
            "valid": len(issues) == 0,
            "issues": issues,
            "warnings": warnings,
            "can_proceed": len(issues) == 0
        }
    
    def suggest_next_step(self, user_goal: Optional[str] = None) -> Dict[str, Any]:
        """
        Provide educational suggestions for what to do next
        """
        if not self.circuit_state or len(self.circuit_state.gates) == 0:
            return {
                "message": "Let's start with the basics! Here are some great first steps:",
                "suggestions": [
                    {
                        "action": "add_hadamard",
                        "description": "Add a Hadamard gate to create superposition",
                        "difficulty": "beginner",
                        "gates": [{"type": "h", "qubit": 0}]
                    },
                    {
                        "action": "add_x_gate",
                        "description": "Add an X gate to flip a qubit",
                        "difficulty": "beginner",
                        "gates": [{"type": "x", "qubit": 0}]
                    },
                    {
                        "action": "bell_state",
                        "description": "Create a Bell state (maximum entanglement!)",
                        "difficulty": "intermediate",
                        "gates": [
                            {"type": "h", "qubit": 0},
                            {"type": "cx", "controls": [0], "targets": [1]}
                        ]
                    }
                ]
            }
        
        # Analyze current state
        analysis = self.analyze_circuit()
        suggestions = []
        
        if not analysis["has_superposition"]:
            suggestions.append({
                "action": "add_superposition",
                "description": "Create superposition with a Hadamard gate",
                "difficulty": "beginner",
                "explanation": "Superposition is the foundation of quantum computing!",
                "gates": [{"type": "h", "qubit": 0}]
            })
        
        if analysis["num_qubits"] >= 2 and not analysis["has_entanglement"]:
            suggestions.append({
                "action": "add_entanglement",
                "description": "Entangle qubits with a CNOT gate",
                "difficulty": "intermediate",
                "explanation": "Entanglement creates quantum correlations that classical systems can't replicate!",
                "gates": [{"type": "cx", "controls": [0], "targets": [1]}]
            })
        
        if analysis["has_superposition"] and analysis["has_entanglement"]:
            suggestions.append({
                "action": "measure",
                "description": "Add measurement to see the results",
                "difficulty": "beginner",
                "explanation": "Measurement collapses the quantum state and gives us classical results!"
            })
        
        return {
            "message": "Great progress! Here's what you could do next:",
            "suggestions": suggestions,
            "current_state": analysis
        }
    
    def generate_educational_response(
        self, 
        action: str, 
        success: bool,
        details: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Generate friendly, educational responses to user actions
        """
        if success:
            responses = {
                "add_gate": [
                    "Excellent! ✨ Gate added successfully. ",
                    "Nice work! 🎯 The gate has been added. ",
                    "Perfect! ⚛️ Your circuit is growing. "
                ],
                "remove_gate": [
                    "Gate removed! 🗑️ ",
                    "Done! The gate has been removed. ",
                ],
                "clear_circuit": [
                    "Circuit cleared! 🆕 Ready for a fresh start. ",
                    "All gates removed. Let's build something new! ",
                ]
            }
        else:
            responses = {
                "add_gate": [
                    "Oops! That didn't work. 😅 Let me help you fix it. ",
                    "I see an issue there. Don't worry, let's figure it out together! ",
                ],
                "remove_gate": [
                    "Hmm, couldn't remove that gate. Let's try something else. ",
                ],
            }
        
        import random
        base_response = random.choice(responses.get(action, ["Done! "]))
        
        if details and details.get("educational_note"):
            base_response += details["educational_note"]
        
        return base_response


# MCP Server Tools Interface
class MCPCircuitTools:
    """
    MCP Server tool definitions for circuit manipulation
    """
    
    def __init__(self):
        self.assistant = CircuitAssistant()
    
    def get_tools(self) -> List[Dict[str, Any]]:
        """Return available MCP tools"""
        return [
            {
                "name": "get_circuit_state",
                "description": "Get the current state of the quantum circuit to understand what gates are present",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "circuit_data": {
                            "type": "object",
                            "description": "Current circuit data from frontend"
                        }
                    },
                    "required": ["circuit_data"]
                }
            },
            {
                "name": "analyze_circuit",
                "description": "Analyze the circuit and get educational insights about its properties",
                "parameters": {
                    "type": "object",
                    "properties": {}
                }
            },
            {
                "name": "validate_gate",
                "description": "Check if a gate operation is valid before adding it",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "gate_type": {"type": "string"},
                        "qubit": {"type": "integer"},
                        "targets": {"type": "array", "items": {"type": "integer"}},
                        "controls": {"type": "array", "items": {"type": "integer"}},
                    },
                    "required": ["gate_type"]
                }
            },
            {
                "name": "suggest_next_step",
                "description": "Get educational suggestions for what to add next to the circuit",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "user_goal": {
                            "type": "string",
                            "description": "Optional: what the user wants to achieve"
                        }
                    }
                }
            },
            {
                "name": "add_gate",
                "description": "Add a gate to the circuit with validation and educational feedback",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "type": {"type": "string", "description": "Gate type (h, x, cx, etc.)"},
                        "qubit": {"type": "integer"},
                        "targets": {"type": "array", "items": {"type": "integer"}},
                        "controls": {"type": "array", "items": {"type": "integer"}},
                        "position": {"type": "integer"}
                    },
                    "required": ["type"]
                }
            },
            {
                "name": "remove_gate",
                "description": "Remove a gate from the circuit",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "gate_id": {"type": "string", "description": "ID of gate to remove"}
                    },
                    "required": ["gate_id"]
                }
            },
            {
                "name": "explain_gate",
                "description": "Get a friendly explanation of what a quantum gate does",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "gate_type": {"type": "string"}
                    },
                    "required": ["gate_type"]
                }
            }
        ]


# Educational content for different gates
GATE_EXPLANATIONS = {
    "h": {
        "name": "Hadamard Gate",
        "emoji": "🌊",
        "simple": "Creates superposition - makes a qubit be both 0 and 1 at the same time!",
        "detailed": "The Hadamard gate is one of the most important gates in quantum computing. It creates an equal superposition, meaning the qubit has a 50% chance of being measured as 0 or 1. It's like flipping a coin that stays in the air!",
        "math": "H|0⟩ = (|0⟩ + |1⟩)/√2",
        "use_cases": ["Creating superposition", "Quantum algorithms like Grover's", "Bell state preparation"]
    },
    "x": {
        "name": "Pauli-X Gate (NOT Gate)",
        "emoji": "🔄",
        "simple": "Flips the qubit - turns |0⟩ into |1⟩ and vice versa!",
        "detailed": "The X gate is the quantum equivalent of a classical NOT gate. It flips the state of a qubit, just like flipping a bit in classical computing.",
        "math": "X|0⟩ = |1⟩, X|1⟩ = |0⟩",
        "use_cases": ["State initialization", "Bit flipping", "Error correction"]
    },
    "cx": {
        "name": "CNOT (Controlled-NOT)",
        "emoji": "🔗",
        "simple": "Creates entanglement between two qubits - they become mysteriously connected!",
        "detailed": "The CNOT gate is a two-qubit gate that flips the target qubit if and only if the control qubit is |1⟩. It's the key to creating entanglement!",
        "math": "CNOT|00⟩ = |00⟩, CNOT|10⟩ = |11⟩",
        "use_cases": ["Creating Bell states", "Entanglement", "Quantum teleportation", "Error correction codes"]
    },
    "y": {
        "name": "Pauli-Y Gate",
        "emoji": "↕️",
        "simple": "Rotates the qubit around the Y-axis of the Bloch sphere",
        "detailed": "The Y gate combines a bit flip with a phase flip, rotating the qubit state around the Y-axis by π radians.",
        "math": "Y|0⟩ = i|1⟩, Y|1⟩ = -i|0⟩",
        "use_cases": ["Quantum error correction", "Certain quantum algorithms"]
    },
    "z": {
        "name": "Pauli-Z Gate",
        "emoji": "🎭",
        "simple": "Adds a phase flip - changes the sign of |1⟩",
        "detailed": "The Z gate leaves |0⟩ unchanged but adds a negative phase to |1⟩. It's crucial for many quantum algorithms.",
        "math": "Z|0⟩ = |0⟩, Z|1⟩ = -|1⟩",
        "use_cases": ["Phase oracles", "Grover's algorithm", "Phase estimation"]
    },
    "s": {
        "name": "S Gate (Phase Gate)",
        "emoji": "📐",
        "simple": "Adds a 90° phase shift",
        "detailed": "The S gate adds a phase of π/2 (90 degrees) to the |1⟩ state. It's like the square root of a Z gate!",
        "math": "S|0⟩ = |0⟩, S|1⟩ = i|1⟩",
        "use_cases": ["Building T gates", "Phase manipulation"]
    },
    "t": {
        "name": "T Gate",
        "emoji": "🔬",
        "simple": "Adds a 45° phase shift - crucial for universal quantum computing!",
        "detailed": "The T gate is essential because it (along with H and CNOT) forms a universal gate set. Any quantum computation can be built from these gates!",
        "math": "T|0⟩ = |0⟩, T|1⟩ = e^(iπ/4)|1⟩",
        "use_cases": ["Universal quantum computation", "Fault-tolerant quantum computing"]
    },
}
