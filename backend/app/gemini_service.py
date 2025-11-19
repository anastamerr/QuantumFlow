"""
Gemini AI Service for natural language circuit generation.
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


class GeminiService:
    """Service for interacting with Google Gemini API."""
    
    def __init__(self):
        """Initialize Gemini service with API key."""
        self.api_key = os.getenv("GEMINI_API_KEY")
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
    
    def generate_circuit_from_prompt(self, user_message: str, num_qubits: int = 2) -> Dict[str, Any]:
        """
        Generate quantum circuit from natural language description.
        
        Args:
            user_message: User's natural language description
            num_qubits: Number of qubits to use
            
        Returns:
            Dictionary with gates array and explanation
        """
        if not self.available:
            raise RuntimeError("Gemini API not available. Check GEMINI_API_KEY in .env")
        
        system_prompt = f"""You are a quantum computing expert. Generate Qiskit-compatible quantum circuits from natural language descriptions.

Available quantum gates:
- h (Hadamard): Creates superposition
- x, y, z (Pauli gates): Single-qubit rotations
- s, t (Phase gates): Phase rotations
- rx, ry, rz (Rotation gates): Parameterized rotations (params: {{"theta": angle_in_radians}})
- p (Phase gate): Phase rotation (params: {{"phi": angle_in_radians}})
- cnot/cx (CNOT): Controlled-X gate (needs control and target)
- cz (Controlled-Z): Controlled-Z gate
- swap (SWAP): Swaps two qubits
- toffoli/ccx (Toffoli): Controlled-controlled-X gate

Circuit has {num_qubits} qubits indexed 0 to {num_qubits-1}.

Return ONLY a JSON object in this exact format:
{{
  "gates": [
    {{"type": "h", "qubit": 0, "position": 0}},
    {{"type": "cnot", "qubit": 0, "targets": [1], "position": 1}}
  ],
  "explanation": "Brief explanation of the circuit",
  "num_qubits": {num_qubits}
}}

Rules:
1. position starts at 0 and increments for each time step
2. For CNOT: use "qubit" for control and "targets": [target_qubit]
3. For rotation gates: include "params": {{"theta": value_in_radians}}
4. Keep circuits simple and valid
5. Return ONLY valid JSON, no markdown, no code blocks

User request: {user_message}"""

        try:
            response = self.model.generate_content(system_prompt)
            response_text = response.text.strip()
            
            # Remove markdown code blocks if present
            response_text = re.sub(r'```json\s*', '', response_text)
            response_text = re.sub(r'```\s*', '', response_text)
            response_text = response_text.strip()
            
            # Parse JSON
            result = json.loads(response_text)
            
            # Validate structure
            if "gates" not in result:
                result["gates"] = []
            if "explanation" not in result:
                result["explanation"] = "Circuit generated successfully"
            if "num_qubits" not in result:
                result["num_qubits"] = num_qubits
                
            return result
            
        except json.JSONDecodeError as e:
            # Try to extract JSON from response
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                try:
                    result = json.loads(json_match.group(0))
                    return result
                except:
                    pass
            
            raise ValueError(f"Failed to parse Gemini response as JSON: {e}\nResponse: {response_text[:200]}")
        except Exception as e:
            raise RuntimeError(f"Gemini API error: {str(e)}")
    
    def chat_about_circuit(self, message: str, context: Optional[str] = None) -> str:
        """
        General chat about quantum circuits and concepts.
        
        Args:
            message: User's message
            context: Optional context about current circuit
            
        Returns:
            AI response as string
        """
        if not self.available:
            raise RuntimeError("Gemini API not available")
        
        prompt = f"""You are a quantum computing expert assistant for QuantumFlow, a visual quantum circuit designer.

{f'Current circuit context: {context}' if context else ''}

Answer the user's question clearly and concisely. If they ask to create a circuit, provide step-by-step instructions using available gates.

User: {message}"""

        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            raise RuntimeError(f"Gemini chat error: {str(e)}")


# Global instance
_gemini_service = None

def get_gemini_service() -> GeminiService:
    """Get or create global Gemini service instance."""
    global _gemini_service
    if _gemini_service is None:
        _gemini_service = GeminiService()
    return _gemini_service
