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
            current_circuit: Current state of the circuit (includes lesson context)
            conversation_history: Previous messages for context
            
        Returns:
            Response with gates (if applicable), explanation, and teaching notes
        """
        if not self.available:
            return self._fallback_response(user_message, current_circuit)
        
        # Extract lesson context if provided
        lesson_context = current_circuit.get("lessonContext") if current_circuit else None
        
        # Analyze current circuit
        circuit_analysis = ""
        suggestions = []
        lesson_info = ""
        
        if current_circuit:
            # Remove lesson context for circuit analysis to avoid confusion
            circuit_data = {k: v for k, v in current_circuit.items() if k != "lessonContext"}
            self.assistant.get_circuit_state(circuit_data)
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
        
        # Add lesson context information
        if lesson_context and lesson_context.get("isInLesson"):
            lesson_info = f"""
🎓 LESSON MODE ACTIVE: {lesson_context.get('lessonTitle', 'Unknown Lesson')}
Current Step: {lesson_context.get('currentStep', 1)} of {lesson_context.get('totalSteps', '?')}
Difficulty: {lesson_context.get('difficulty', 'unknown')}

Current Step Details:
{self._format_lesson_step(lesson_context.get('currentStepData', {}))}

Expected Next Gate: {self._format_expected_gate(lesson_context.get('expectedNextGate', {}))}
"""
        
        # Build conversation context
        context_messages = ""
        if conversation_history:
            recent = conversation_history[-3:]  # Last 3 messages for context
            context_messages = "\n".join([
                f"{'User' if msg['role'] == 'user' else 'Assistant'}: {msg['content']}"
                for msg in recent
            ])
        
        # Create educational prompt with lesson awareness
        system_prompt = f"""You are an enthusiastic and HELPFUL quantum computing teacher! 🎓⚛️

Your teaching philosophy:
1. **Be Proactive & Helpful**: Don't just suggest - TAKE ACTION! Add gates when asked, fix mistakes, build circuits
2. **Analyze & Guide**: Look at what they have, identify what's missing, and help complete it
3. **Encourage & Celebrate**: Praise every step, acknowledge progress, celebrate achievements
4. **Teach by Doing**: Build circuits together, explain as you go
5. **Step-by-Step Support**: Break down complex tasks into manageable steps
6. **Error Prevention**: Validate before adding, warn about issues, suggest fixes
7. **Lesson Awareness**: When in lesson mode, guide them toward the current step goal

{circuit_analysis}

{lesson_info if lesson_info else ''}

{'Recent conversation:' + context_messages if context_messages else ''}

{'Current suggestions for the user:' + chr(10) + chr(10).join(f'• {s}' for s in suggestions) if suggestions else ''}

User's message: "{user_message}"

LESSON MODE GUIDELINES:
{self._get_lesson_guidelines(lesson_context) if lesson_context and lesson_context.get("isInLesson") else ''}

Your response should be in JSON format:
{{
  "response": "Your friendly, helpful response - explain what you're doing and WHY",
  "gates": [array of gates to add - BE GENEROUS with this! If they ask, ADD THEM],
  "explanation": "What you just did and why it matters",
  "teaching_note": "Educational insight or fun fact",
  "next_suggestions": ["Specific actionable next steps"],
  "action_taken": "add_gates|remove_gates|analyze|explain",
  "praise": "Specific praise for their approach or progress",
  "warnings": ["Any issues or things to watch out for"]
}}

Available gates: h, x, y, z, s, t, cx (CNOT), rx, ry, rz, swap

Gate formats:
- Single-qubit: {{"type": "h", "qubit": 0, "position": 0}}
- Two-qubit CNOT: {{"type": "cx", "controls": [0], "targets": [1], "position": 1}}
  IMPORTANT: For CNOT gates, ALWAYS use "controls" and "targets" arrays
- Rotation gates (MUST include params): {{"type": "rx", "qubit": 0, "params": {{"theta": 0.5}}, "position": 0}}
  - RX uses "theta" parameter
  - RY uses "theta" parameter  
  - RZ uses "phi" parameter
  - Angles are in RADIANS (π = 3.14159)
  - Common angles: 90° = π/2 = 1.5708, 180° = π = 3.14159, 45° = π/4 = 0.7854

IMPORTANT Guidelines:
- When they ask to ADD gates → ACTUALLY ADD THEM in the "gates" array
- When describing their circuit → ANALYZE what's there and what's missing
- When they're stuck → OFFER TO BUILD IT FOR THEM
- When there's an error → EXPLAIN IT and FIX IT
- Use position to place gates in correct order (0 = first column, 1 = second, etc.)
- Be specific about qubit numbers and positions
- If they say "add X" → Add it! Don't just suggest it!
- CNOT gates: ALWAYS use {{"type": "cx", "controls": [control_qubit], "targets": [target_qubit], "position": N}}
- Think: "How can I help them RIGHT NOW?" not "What should they do?"

Examples of being helpful:
- User: "add a hadamard gate" → Response: "Done! I've added an H gate to qubit 0..." + gates=[{{"type":"h","qubit":0,"position":0}}]
- User: "add CNOT from qubit 0 to 1" → Response: "Adding CNOT!" + gates=[{{"type":"cx","controls":[0],"targets":[1],"position":1}}]
- User: "add RZ gate with angle 0.3" → Response: "Added RZ rotation!" + gates=[{{"type":"rz","qubit":0,"params":{{"phi":0.3}},"position":0}}]
- User: "make a bell state" → Response: "Let's build it together!" + gates=[{{"type":"h","qubit":0,"position":0}},{{"type":"cx","controls":[0],"targets":[1],"position":1}}]
- User: "rotate qubit 1 by 45 degrees around Y" → Response: "Rotating!" + gates=[{{"type":"ry","qubit":1,"params":{{"theta":0.7854}},"position":0}}]
- User: "what's in my circuit?" → Analyze and list all gates with explanations
- User: "this isn't working" → Identify the issue and offer to fix it

Be the helpful assistant they need!
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
        circuit_empty = True
        num_qubits = 2
        
        if current_circuit:
            self.assistant.get_circuit_state(current_circuit)
            analysis = self.assistant.analyze_circuit()
            num_qubits = current_circuit.get('qubits', 2)
            
            if analysis.get("status") == "empty":
                return {
                    "response": "Your circuit is empty - let's build something awesome! 🎯 I'm adding a Hadamard gate to get you started with superposition!",
                    "explanation": "The H gate creates superposition, which is the foundation of quantum computing. Your qubit is now in a state that's both |0⟩ and |1⟩ simultaneously!",
                    "gates": [{"type": "h", "qubit": 0, "position": 0}],
                    "teaching_note": "💡 Superposition is like a coin spinning in the air - it's both heads AND tails until you catch it (measure it)!",
                    "action_taken": "add_gates",
                    "next_suggestions": [
                        "Add another H gate to qubit 1 for more superposition",
                        "Add a CNOT gate to create entanglement between qubits",
                        "Run a simulation to see the probability distribution"
                    ]
                }
            else:
                circuit_empty = False
        
        # Pattern matching for common requests
        msg_lower = user_message.lower()
        
        # Determine position for new gates
        next_position = 0
        if current_circuit and current_circuit.get('gates'):
            positions = [g.get('position', 0) for g in current_circuit['gates']]
            next_position = max(positions, default=-1) + 1
        
        # Bell state or entanglement
        if any(word in msg_lower for word in ['bell', 'entangle', 'cnot', 'bell state']):
            return {
                "response": "Perfect! I'm building a Bell state for you right now! 🔗 First, I'll add an H gate for superposition, then a CNOT to create entanglement between qubits 0 and 1.",
                "explanation": "The H gate puts qubit 0 in superposition (both 0 and 1), then CNOT uses qubit 0 to control qubit 1, creating maximum entanglement. When you measure them, they'll always be correlated!",
                "gates": [
                    {"type": "h", "qubit": 0, "position": next_position},
                    {"type": "cx", "controls": [0], "targets": [1], "position": next_position + 1}
                ],
                "teaching_note": "🔗 Bell states are magical! Once entangled, measuring one qubit instantly determines the other - even if they're light-years apart! Einstein called this 'spooky action at a distance.'",
                "action_taken": "add_gates",
                "next_suggestions": [
                    "Run a simulation to see the 50/50 split between |00⟩ and |11⟩",
                    "Visualize on the Bloch sphere",
                    "Extend to a 3-qubit GHZ state"
                ]
            }
        
        # Hadamard gate
        if any(word in msg_lower for word in ['hadamard', 'superposition', 'h gate', 'add h', 'add hadamard']):
            return {
                "response": "Coming right up! ✨ I'm adding a Hadamard gate to qubit 0. This will create a beautiful superposition state!",
                "explanation": "The H gate is THE fundamental gate of quantum computing. It transforms |0⟩ into (|0⟩ + |1⟩)/√2, meaning the qubit is now equally likely to be 0 or 1 when measured. This is pure quantum weirdness!",
                "gates": [{"type": "h", "qubit": 0, "position": next_position}],
                "teaching_note": "🌊 Think of H as creating a wave - your qubit is now 'surfing' between 0 and 1! Fun fact: Applying H twice brings you back to the start.",
                "action_taken": "add_gates",
                "next_suggestions": [
                    "Add H gates to other qubits to create multi-qubit superposition",
                    "Follow with a CNOT to create entanglement",
                    "Measure and see the 50/50 probability split"
                ]
            }
        
        # X gate (NOT)
        if any(word in msg_lower for word in ['x gate', 'not gate', 'add x', 'flip', 'pauli-x', 'pauli x']):
            return {
                "response": "Done! 🔄 I've added an X gate (quantum NOT) to qubit 0. This will flip |0⟩ to |1⟩ or vice versa!",
                "explanation": "The X gate is the quantum version of a classical NOT gate. It's like flipping a coin from heads to tails. Simple but powerful!",
                "gates": [{"type": "x", "qubit": 0, "position": next_position}],
                "teaching_note": "🔄 The X gate is one of the Pauli gates. Combined with Y and Z, they form the basis for quantum error correction!",
                "action_taken": "add_gates",
                "next_suggestions": [
                    "Try Y or Z gates to see other Pauli operations",
                    "Combine with H gates for interesting effects",
                    "Use controlled-X (CNOT) for entanglement"
                ]
            }
        
        # GHZ state
        if any(word in msg_lower for word in ['ghz', 'greenberger']):
            gates_to_add = [{"type": "h", "qubit": 0, "position": next_position}]
            for i in range(min(num_qubits - 1, 2)):
                gates_to_add.append({"type": "cx", "controls": [0], "targets": [i + 1], "position": next_position + i + 1})
            
            return {
                "response": f"Awesome! 🌟 I'm creating a {min(num_qubits, 3)}-qubit GHZ state for you - one of the most fascinating entangled states!",
                "explanation": f"GHZ states extend Bell states to more qubits. I'm adding H to qubit 0, then using CNOT gates to entangle all {min(num_qubits, 3)} qubits together. They'll all be perfectly correlated!",
                "gates": gates_to_add,
                "teaching_note": "🎭 GHZ states are named after Greenberger, Horne, and Zeilinger. They show even stronger quantum correlations than Bell states and are crucial for quantum error correction!",
                "action_taken": "add_gates",
                "next_suggestions": [
                    "Simulate to see the multi-qubit entanglement",
                    "Try quantum teleportation with this state",
                    "Explore quantum error correction codes"
                ]
            }
        
        # Analysis request
        if any(word in msg_lower for word in ['what', 'analyze', 'explain', 'show', 'describe', 'status', 'have']):
            if circuit_empty:
                return {
                    "response": "Your circuit is completely empty right now - a blank canvas! 🎨 Let me help you get started! Would you like to create a Bell state, add some Hadamard gates, or try something else?",
                    "explanation": "An empty circuit is ready for quantum gates. The possibilities are endless!",
                    "teaching_note": "💡 Every quantum algorithm starts with an empty circuit. What will you build?",
                    "action_taken": "analyze",
                    "next_suggestions": [
                        "Say 'add a Hadamard gate' to create superposition",
                        "Say 'make a Bell state' for entanglement",
                        "Say 'add an X gate' to flip a qubit"
                    ]
                }
            else:
                analysis = self.assistant.analyze_circuit()
                gate_list = ", ".join([f"{k} (×{v})" for k, v in analysis.get('gate_types', {}).items()])
                
                return {
                    "response": f"Let me analyze your circuit! 🔍\n\nYou have:\n• {analysis['num_qubits']} qubits\n• {analysis['num_gates']} gates: {gate_list}\n• Circuit depth: {analysis['depth']}\n• Superposition: {'✅ Yes!' if analysis['has_superposition'] else '❌ Not yet'}\n• Entanglement: {'✅ Yes!' if analysis['has_entanglement'] else '❌ Not yet'}\n\n{analysis.get('suggestions', ['Looking good!'])[0] if analysis.get('suggestions') else 'Great start!'}",
                    "explanation": "Your circuit is taking shape! The depth shows how many time steps your quantum computer needs. Lower depth = faster execution.",
                    "teaching_note": "📊 Circuit depth matters! Real quantum computers have limited coherence time, so keeping circuits shallow helps avoid errors.",
                    "action_taken": "analyze",
                    "next_suggestions": analysis.get('suggestions', [
                        "Add more gates to explore quantum phenomena",
                        "Try running a simulation",
                        "Visualize the quantum state"
                    ])
                }
        
        # Default helpful response
        return {
            "response": "I'm here to help! 😊 I can:\n• Add gates to your circuit (just ask!)\n• Build Bell states, GHZ states, and more\n• Explain how quantum gates work\n• Analyze your current circuit\n• Suggest next steps\n\nWhat would you like to do?",
            "explanation": "I'm your quantum circuit assistant. Think of me as your helpful partner in building quantum circuits!",
            "teaching_note": "💡 Tip: Try saying things like 'add a Hadamard gate', 'create a Bell state', 'analyze my circuit', or 'what can I do next?'",
            "action_taken": "explain",
            "next_suggestions": [
                "Add a Hadamard gate for superposition",
                "Create a Bell state with H + CNOT",
                "Build a GHZ state for multi-qubit entanglement",
                "Ask me to explain any quantum gate"
            ]
        }
    
    def _format_lesson_step(self, step_data: Dict[str, Any]) -> str:
        """Format lesson step information for display."""
        if not step_data:
            return "No step data available"
        
        return f"""
• Title: {step_data.get('title', 'Unknown')}
• Instruction: {step_data.get('instruction', 'No instruction')}
• Hint: {step_data.get('hint', 'No hint')}
• Educational Note: {step_data.get('educationalNote', 'No note')}
• Why It Matters: {step_data.get('whyItMatters', 'No explanation')}
"""
    
    def _format_expected_gate(self, expected_gate: Dict[str, Any]) -> str:
        """Format expected gate information for display."""
        if not expected_gate:
            return "No specific gate expected"
        
        gate_type = expected_gate.get('gateType', 'unknown')
        targets = expected_gate.get('targets', [])
        controls = expected_gate.get('controls', [])
        params = expected_gate.get('params', {})
        
        result = f"Type: {gate_type}"
        if targets:
            result += f", Targets: {targets}"
        if controls:
            result += f", Controls: {controls}"
        if params:
            result += f", Params: {params}"
        
        return result
    
    def _get_lesson_guidelines(self, lesson_context: Dict[str, Any]) -> str:
        """Get lesson-specific guidelines for the AI."""
        if not lesson_context or not lesson_context.get("isInLesson"):
            return ""
        
        difficulty = lesson_context.get('difficulty', 'unknown')
        current_step = lesson_context.get('currentStep', 1)
        total_steps = lesson_context.get('totalSteps', 1)
        
        guidelines = f"""
- You are helping with a {difficulty} lesson (Step {current_step}/{total_steps})
- Focus on the current step goal and guide them toward the expected gate
- If they ask for help, reference the lesson instruction and hint
- Provide step-appropriate explanations (simpler for beginner, more detailed for advanced)
- If they seem stuck, offer to add the expected gate for them
- Celebrate when they complete steps correctly
- Connect what they're doing to the lesson's learning objectives
"""
        
        if difficulty == "beginner":
            guidelines += "- Use simple language and focus on basic concepts\n- Explain why each gate matters\n- Be very encouraging\n"
        elif difficulty == "intermediate":
            guidelines += "- Include some technical details\n- Reference quantum concepts like superposition and entanglement\n- Challenge them to think about next steps\n"
        elif difficulty == "advanced":
            guidelines += "- Use precise technical language\n- Reference quantum algorithms and applications\n- Discuss optimization and real-world considerations\n"
        
        return guidelines


# Export the main service
GeminiService = EducationalGeminiService
