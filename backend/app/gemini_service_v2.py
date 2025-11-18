"""
Educational Gemini AI Service with circuit awareness and human-in-the-loop guidance.
"""
import os
import json
import re
from typing import Dict, List, Any, Optional
from dotenv import load_dotenv

load_dotenv()

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

from .circuit_assistant import CircuitAssistant, GATE_EXPLANATIONS


class EducationalGeminiService:
    """
    Enhanced Gemini service that:
    1. Understands the current circuit state
    2. Provides educational, encouraging guidance
    3. Validates operations before suggesting them
    4. Helps users learn quantum computing step-by-step
    """
    
    def __init__(self):
        """Initialize service with circuit awareness."""
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.assistant = CircuitAssistant()
        
        if not self.api_key or self.api_key == "your_gemini_api_key_here":
            self.available = False
            return
            
        if not GEMINI_AVAILABLE:
            self.available = False
            return
            
        try:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-2.5-flash')
            self.available = True
        except Exception as e:
            print(f"Failed to initialize Gemini: {e}")
            self.available = False
    
    def chat_with_circuit_context(
        self, 
        user_message: str, 
        current_circuit: Optional[Dict[str, Any]] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Have a conversation about quantum circuits with full context awareness.
        
        Args:
            user_message: User's message or request
            current_circuit: Current state of the circuit
            conversation_history: Previous messages for context
            
        Returns:
            Response with gates (if applicable), explanation, and teaching notes
        """
        if not self.available:
            return self._fallback_response(user_message, current_circuit)
        
        # Analyze current circuit
        circuit_analysis = ""
        suggestions = []
        
        if current_circuit:
            self.assistant.get_circuit_state(current_circuit)
            analysis = self.assistant.analyze_circuit()
            
            if analysis.get("status") == "empty":
                circuit_analysis = "The circuit is empty - perfect for starting fresh!"
            else:
                circuit_analysis = f"""Current Circuit Status:
• {analysis['num_qubits']} qubits
• {analysis['num_gates']} gates placed
• Circuit depth: {analysis['depth']}
• Gates used: {', '.join(f"{k} ({v}x)" for k, v in analysis.get('gate_types', {}).items())}
• Superposition: {'Yes ✓' if analysis.get('has_superposition') else 'Not yet'}
• Entanglement: {'Yes ✓' if analysis.get('has_entanglement') else 'Not yet'}
"""
                suggestions = analysis.get('suggestions', [])
        
        # Build conversation context
        context_messages = ""
        if conversation_history:
            recent = conversation_history[-3:]  # Last 3 messages for context
            context_messages = "\n".join([
                f"{'User' if msg['role'] == 'user' else 'Assistant'}: {msg['content']}"
                for msg in recent
            ])
        
        # Create educational prompt
        system_prompt = f"""You are an enthusiastic quantum computing teacher! 🎓⚛️

Your teaching philosophy:
1. **Encourage & Praise**: Celebrate every step, no matter how small
2. **Explain Simply**: Use analogies and emojis to make concepts fun
3. **Guide Don't Tell**: Ask questions, offer hints, let them discover
4. **Build Incrementally**: Suggest logical next steps based on where they are
5. **Make It Fun**: Use friendly language, emojis, and excitement!

{circuit_analysis}

{'Recent conversation:' + context_messages if context_messages else ''}

{'Current suggestions for the user:' + chr(10) + chr(10).join(f'• {s}' for s in suggestions) if suggestions else ''}

User's message: "{user_message}"

Your response should be in JSON format:
{{
  "response": "Your friendly, encouraging response (use emojis!)",
  "gates": [optional array of gates to add, if user requested],
  "explanation": "Why these gates matter and what they do",
  "teaching_note": "A fun fact or learning moment",
  "next_suggestions": ["What they could try next", "Another idea"],
  "corrects_mistake": false,  // true if you're helping fix an error
  "praise": "Something specific to praise about their approach"
}}

Available gates: h, x, y, z, s, t, cx (CNOT), rx, ry, rz, swap
Gate format: {{"type": "h", "qubit": 0}} or {{"type": "cx", "controls": [0], "targets": [1]}}

Remember:
- Be warm and encouraging
- Explain WHY, not just WHAT
- Help them learn from mistakes
- Make quantum computing feel accessible and fun
- Use the circuit context to give relevant advice
"""

        try:
            response = self.model.generate_content(system_prompt)
            result = self._parse_response(response.text)
            
            # Validate any proposed gates
            if result.get("gates"):
                from .circuit_assistant import GateOperation
                validated_gates = []
                warnings = []
                
                for gate in result["gates"]:
                    op = GateOperation(**gate)
                    validation = self.assistant.validate_gate_operation(op)
                    
                    if validation["valid"]:
                        validated_gates.append(gate)
                    else:
                        warnings.extend(validation["issues"])
                    
                    if validation["warnings"]:
                        warnings.extend(validation["warnings"])
                
                result["gates"] = validated_gates
                if warnings:
                    result["warnings"] = warnings
            
            return result
            
        except Exception as e:
            print(f"Gemini error: {e}")
            return self._fallback_response(user_message, current_circuit)
    
    def get_gate_explanation(self, gate_type: str) -> Dict[str, Any]:
        """Get a friendly explanation of a quantum gate."""
        gate = gate_type.lower()
        
        if gate in GATE_EXPLANATIONS:
            return GATE_EXPLANATIONS[gate]
        
        return {
            "name": gate_type.upper(),
            "emoji": "⚛️",
            "simple": "This is a quantum gate!",
            "detailed": f"The {gate_type} gate is a quantum operation.",
            "use_cases": ["Various quantum algorithms"]
        }
    
    def suggest_learning_path(self, current_level: str = "beginner") -> Dict[str, Any]:
        """Suggest a learning path based on user's level."""
        paths = {
            "beginner": {
                "title": "🌱 Getting Started with Quantum Circuits",
                "steps": [
                    {
                        "step": 1,
                        "goal": "Understand qubits and superposition",
                        "activity": "Add a Hadamard gate to see superposition",
                        "gates": [{"type": "h", "qubit": 0}],
                        "explanation": "The H gate puts a qubit in superposition - it's both 0 and 1!"
                    },
                    {
                        "step": 2,
                        "goal": "Learn about bit flips",
                        "activity": "Try an X gate (quantum NOT)",
                        "gates": [{"type": "x", "qubit": 0}],
                        "explanation": "X gate flips |0⟩ to |1⟩, just like a NOT gate!"
                    },
                    {
                        "step": 3,
                        "goal": "Create your first entanglement",
                        "activity": "Build a Bell state",
                        "gates": [
                            {"type": "h", "qubit": 0},
                            {"type": "cx", "controls": [0], "targets": [1]}
                        ],
                        "explanation": "Bell states show the magic of quantum entanglement!"
                    }
                ]
            },
            "intermediate": {
                "title": "🚀 Quantum Algorithms",
                "steps": [
                    {
                        "step": 1,
                        "goal": "Quantum teleportation protocol",
                        "activity": "Build a teleportation circuit"
                    },
                    {
                        "step": 2,
                        "goal": "Quantum phase estimation",
                        "activity": "Learn about phase kickback"
                    }
                ]
            }
        }
        
        return paths.get(current_level, paths["beginner"])
    
    def _parse_response(self, text: str) -> Dict[str, Any]:
        """Parse JSON response from Gemini."""
        # Try to extract JSON from markdown code blocks
        json_match = re.search(r'```json\s*(\{.*?\})\s*```', text, re.DOTALL)
        if json_match:
            text = json_match.group(1)
        else:
            # Try to find JSON object directly
            json_match = re.search(r'\{.*\}', text, re.DOTALL)
            if json_match:
                text = json_match.group(0)
        
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            # Fallback: create a response from the text
            return {
                "response": text,
                "explanation": "Let me help you with that!",
                "gates": [],
                "next_suggestions": ["Try adding a Hadamard gate!", "What about entanglement?"]
            }
    
    def _fallback_response(
        self, 
        user_message: str, 
        current_circuit: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Provide helpful fallback when Gemini is unavailable."""
        
        # Analyze circuit to give contextual help
        if current_circuit:
            self.assistant.get_circuit_state(current_circuit)
            analysis = self.assistant.analyze_circuit()
            
            if analysis.get("status") == "empty":
                return {
                    "response": "Let's start building! 🎯 How about we add a Hadamard gate to create superposition?",
                    "explanation": "The H gate is perfect for beginners - it's the foundation of quantum computing!",
                    "gates": [{"type": "h", "qubit": 0}],
                    "teaching_note": "💡 Superposition means a qubit can be 0 AND 1 at the same time!",
                    "next_suggestions": [
                        "Add another H gate to a different qubit",
                        "Try entangling qubits with a CNOT gate"
                    ]
                }
        
        # Pattern matching for common requests
        msg_lower = user_message.lower()
        
        if any(word in msg_lower for word in ['bell', 'entangle', 'cnot']):
            return {
                "response": "Great choice! Let's create a Bell state - the simplest entangled state! 🔗",
                "explanation": "We'll use H for superposition, then CNOT for entanglement",
                "gates": [
                    {"type": "h", "qubit": 0},
                    {"type": "cx", "controls": [0], "targets": [1]}
                ],
                "teaching_note": "Bell states are maximally entangled - measuring one qubit instantly affects the other!",
                "next_suggestions": [
                    "Try running a simulation to see the results",
                    "Add more qubits for a GHZ state"
                ]
            }
        
        if any(word in msg_lower for word in ['hadamard', 'superposition', 'h gate']):
            return {
                "response": "Excellent! The Hadamard gate is one of the most important gates in quantum computing! 🌊",
                "explanation": "H creates superposition - the qubit becomes both |0⟩ and |1⟩ simultaneously",
                "gates": [{"type": "h", "qubit": 0}],
                "teaching_note": "Fun fact: Two H gates in a row cancel out and return to the original state!",
                "next_suggestions": [
                    "Add H gates to more qubits",
                    "Follow up with a CNOT for entanglement"
                ]
            }
        
        return {
            "response": "I'd love to help! 😊 (Note: Gemini AI is not configured. Check your API key)",
            "explanation": "I can still help with basic circuit building using pattern matching!",
            "teaching_note": "Try asking about: Bell states, Hadamard gates, CNOT gates, or superposition",
            "next_suggestions": [
                "Add a Hadamard gate for superposition",
                "Create a Bell state with H + CNOT",
                "Try an X gate (quantum NOT)"
            ]
        }


# Export the main service
GeminiService = EducationalGeminiService
