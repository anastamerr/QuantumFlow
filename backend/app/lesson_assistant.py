"""
Lesson-based circuit assistant with MCP integration.
Provides step-by-step guidance for building quantum circuits.
"""
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
import math
import logging

logger = logging.getLogger(__name__)


@dataclass
class CircuitGate:
    """Represents a gate in the user's circuit."""
    id: str
    gate_type: str
    targets: List[int]
    controls: List[int]
    params: Dict[str, float]
    column: int


@dataclass
class LessonStep:
    """Represents one step in a lesson."""
    step_number: int
    title: str
    instruction: str
    hint: str
    expected_gate: CircuitGate
    educational_note: str
    why_it_matters: str


@dataclass
class LessonProgress:
    """Tracks progress through a lesson."""
    lesson_id: str
    current_step: int
    completed_steps: List[int]
    user_circuit: List[CircuitGate]
    mistakes: List[str]
    hints_used: int


class LessonAssistant:
    """
    MCP-based lesson assistant that analyzes circuits step-by-step.
    Guides users through structured lessons with real-time validation.
    """
    
    def __init__(self):
        self.lessons = self._load_lessons()
        self.active_sessions: Dict[str, LessonProgress] = {}
    
    def _load_lessons(self) -> Dict[str, Dict[str, Any]]:
        """Load lesson definitions (in production, load from qmlLessons.ts or database)."""
        # This is a simplified version - full data should come from frontend
        return {}
    
    def start_lesson(self, lesson_id: str, user_id: str = "default") -> Dict[str, Any]:
        """
        Initialize a new lesson session.
        
        Returns:
            Initial guidance for step 1
        """
        self.active_sessions[user_id] = LessonProgress(
            lesson_id=lesson_id,
            current_step=1,
            completed_steps=[],
            user_circuit=[],
            mistakes=[],
            hints_used=0
        )
        
        return {
            "status": "lesson_started",
            "lesson_id": lesson_id,
            "current_step": 1,
            "message": f"Welcome to {lesson_id}! Let's build your first quantum circuit step by step.",
            "ready_for_guidance": True
        }
    
    def get_current_step_guidance(
        self,
        lesson_id: str,
        step_number: int,
        lesson_data: Dict[str, Any],
        user_id: str = "default"
    ) -> Dict[str, Any]:
        """
        Get guidance for the current step.
        
        Args:
            lesson_id: Lesson identifier
            step_number: Current step number (1-indexed)
            lesson_data: Full lesson data from frontend
            user_id: User identifier
            
        Returns:
            Guidance message with instructions, hints, and educational notes
        """
        if step_number < 1 or step_number > len(lesson_data.get("steps", [])):
            return {
                "error": "Invalid step number",
                "valid_range": f"1 to {len(lesson_data.get('steps', []))}"
            }
        
        step = lesson_data["steps"][step_number - 1]
        
        guidance = {
            "lesson_id": lesson_id,
            "step_number": step_number,
            "total_steps": len(lesson_data["steps"]),
            "title": step["title"],
            "instruction": step["instruction"],
            "hint": step["hint"],
            "educational_note": step["educationalNote"],
            "why_it_matters": step["whyItMatters"],
            "expected_gate": step["expectedGate"],
            "progress_percentage": int((step_number - 1) / len(lesson_data["steps"]) * 100)
        }
        
        return guidance
    
    def validate_step(
        self,
        lesson_id: str,
        step_number: int,
        user_circuit: List[Dict[str, Any]],
        lesson_data: Dict[str, Any],
        user_id: str = "default"
    ) -> Dict[str, Any]:
        """
        Validate if the user has correctly completed the current step.
        
        Args:
            lesson_id: Lesson identifier
            step_number: Step to validate
            user_circuit: Current state of user's circuit
            lesson_data: Full lesson data
            user_id: User identifier
            
        Returns:
            Validation result with feedback
        """
        logger.info(f"validate_step called: lesson={lesson_id}, step={step_number}, user={user_id}")
        logger.info(f"User circuit has {len(user_circuit)} gates")
        
        if step_number < 1 or step_number > len(lesson_data.get("steps", [])):
            logger.warning(f"Invalid step number: {step_number}")
            return {"error": "Invalid step number"}
        
        step = lesson_data["steps"][step_number - 1]
        expected_gate = step["expectedGate"]
        
        logger.info(f"Expected gate: {expected_gate}")
        logger.info(f"User gates: {user_circuit}")
        
        # Find the expected gate in the user's circuit
        validation = self._check_gate_presence(user_circuit, expected_gate, step_number)
        
        if validation["correct"]:
            # Mark step as complete
            if user_id in self.active_sessions:
                session = self.active_sessions[user_id]
                if step_number not in session.completed_steps:
                    session.completed_steps.append(step_number)
                    session.current_step = step_number + 1
            
            response = {
                "status": "step_complete",
                "step_number": step_number,
                "correct": True,
                "feedback": self._generate_positive_feedback(step, step_number),
                "praise": validation.get("praise", "Excellent work!"),
                "next_step": step_number + 1 if step_number < len(lesson_data["steps"]) else None,
                "progress_percentage": int(step_number / len(lesson_data["steps"]) * 100)
            }
            
            # Check if lesson is complete
            if step_number == len(lesson_data["steps"]):
                response["lesson_complete"] = True
                response["celebration"] = self._generate_completion_message(lesson_data)
            
            return response
        else:
            return {
                "status": "step_incomplete",
                "step_number": step_number,
                "correct": False,
                "feedback": validation.get("feedback", "Not quite right yet."),
                "hints": validation.get("hints", []),
                "specific_issues": validation.get("issues", []),
                "encouragement": "Don't worry! Quantum circuits take practice. Try again!",
                "retry_suggestion": validation.get("suggestion", "")
            }
    
    def _check_gate_presence(
        self,
        user_circuit: List[Dict[str, Any]],
        expected_gate: Dict[str, Any],
        step_number: int
    ) -> Dict[str, Any]:
        """
        Check if the expected gate exists in the user's circuit with correct properties.
        
        Returns:
            Validation details with specific feedback
        """
        gate_type = expected_gate["gateType"]
        targets = expected_gate["targets"]
        controls = expected_gate.get("controls", [])
        params = expected_gate.get("params", {})
        column = expected_gate["column"]
        
        logger.info(f"Checking for gate: type={gate_type}, targets={targets}, controls={controls}, params={params}, column={column}")
        
        # Find matching gates
        matching_gates = [
            gate for gate in user_circuit
            if gate.get("gateType") == gate_type
        ]
        
        logger.info(f"Found {len(matching_gates)} gates of type {gate_type}")
        for i, gate in enumerate(matching_gates):
            logger.info(f"  Gate {i}: {gate}")
        
        if not matching_gates:
            return {
                "correct": False,
                "feedback": f"I don't see a {gate_type} gate yet. Try adding one!",
                "hints": [f"Look for the {gate_type} gate in the gate palette"],
                "suggestion": f"Drag a {gate_type} gate from the sidebar to the circuit canvas",
                "issues": ["missing_gate"]
            }
        
        # Check for correct gate with all properties
        for gate in matching_gates:
            issues = []
            
            # Check targets
            if set(gate.get("targets", [])) != set(targets):
                issues.append("wrong_target")
                continue
            
            # Check controls
            if set(gate.get("controls", [])) != set(controls):
                issues.append("wrong_control")
                continue
            
            # Check parameters (with tolerance for floating point)
            gate_params = gate.get("params", {})
            param_match = True
            for key, expected_value in params.items():
                actual_value = gate_params.get(key)
                if actual_value is None:
                    issues.append(f"missing_param_{key}")
                    param_match = False
                    break
                
                # Allow small tolerance for float comparison
                if not math.isclose(actual_value, expected_value, rel_tol=1e-2):
                    issues.append(f"wrong_param_{key}")
                    param_match = False
                    break
            
            if not param_match:
                continue
            
            # Check column (position in time)
            if gate.get("column") != column:
                issues.append("wrong_position")
                continue
            
            # All checks passed!
            return {
                "correct": True,
                "praise": self._generate_praise(step_number, gate_type),
                "gate_id": gate.get("id")
            }
        
        # Found gates but none match completely
        return self._generate_specific_feedback(matching_gates[0], expected_gate)
    
    def _generate_specific_feedback(
        self,
        actual_gate: Dict[str, Any],
        expected_gate: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate specific feedback about what's wrong with the gate."""
        issues = []
        hints = []
        
        gate_type = expected_gate["gateType"]
        
        # Check targets
        if set(actual_gate.get("targets", [])) != set(expected_gate["targets"]):
            issues.append("wrong_target")
            hints.append(
                f"The {gate_type} gate should target qubit(s) {expected_gate['targets']}, "
                f"but it's currently on {actual_gate.get('targets', [])}"
            )
        
        # Check controls
        if set(actual_gate.get("controls", [])) != set(expected_gate.get("controls", [])):
            issues.append("wrong_control")
            expected_controls = expected_gate.get("controls", [])
            if expected_controls:
                hints.append(f"The control qubit should be {expected_controls[0]}")
            else:
                hints.append("This gate should not have a control qubit")
        
        # Check parameters
        expected_params = expected_gate.get("params", {})
        actual_params = actual_gate.get("params", {})
        for key, expected_value in expected_params.items():
            actual_value = actual_params.get(key)
            if actual_value is None or not math.isclose(actual_value, expected_value, rel_tol=1e-2):
                issues.append(f"wrong_param_{key}")
                actual_str = f"{float(actual_value):.3f}" if actual_value is not None else "not set"
                hints.append(
                    f"The {key} parameter should be {float(expected_value):.3f} radians, "
                    f"but it's currently {actual_str}"
                )
        
        # Check column
        if actual_gate.get("column") != expected_gate["column"]:
            issues.append("wrong_position")
            hints.append(
                f"The gate should be in column {expected_gate['column']}, "
                f"but it's currently in column {actual_gate.get('column')}"
            )
        
        feedback = f"Good try! The {gate_type} gate is close, but there are a few issues to fix."
        if len(issues) == 1:
            feedback = f"Almost there! Just one small adjustment needed for the {gate_type} gate."
        
        return {
            "correct": False,
            "feedback": feedback,
            "hints": hints,
            "issues": issues,
            "suggestion": "Try adjusting the gate properties to match the expected values."
        }
    
    def _generate_praise(self, step_number: int, gate_type: str) -> str:
        """Generate encouraging praise messages."""
        praises = [
            f"🎉 Perfect! Your {gate_type} gate is exactly right!",
            f"✨ Excellent work! That {gate_type} gate looks great!",
            f"🌟 Nicely done! You've mastered the {gate_type} gate!",
            f"🎯 Spot on! Your {gate_type} gate is perfect!",
            f"⚡ Amazing! That {gate_type} gate is exactly what we need!",
            f"🔥 Outstanding! Your {gate_type} gate is flawless!",
        ]
        return praises[step_number % len(praises)]
    
    def _generate_positive_feedback(self, step: Dict[str, Any], step_number: int) -> str:
        """Generate positive, encouraging feedback for completed steps."""
        feedback_templates = [
            "Excellent! You've successfully completed this step. {educational}",
            "Perfect! {educational} On to the next challenge!",
            "Well done! {educational} You're making great progress!",
            "Fantastic work! {educational} Keep it up!",
            "Brilliant! {educational} You're really getting the hang of this!",
        ]
        
        template = feedback_templates[step_number % len(feedback_templates)]
        return template.format(educational=step.get("educationalNote", ""))
    
    def _generate_completion_message(self, lesson_data: Dict[str, Any]) -> str:
        """Generate celebration message for lesson completion."""
        title = lesson_data.get("title", "this lesson")
        difficulty = lesson_data.get("difficulty", "")
        
        messages = {
            "beginner": f"🎊 Congratulations! You've completed {title}! You've taken your first steps into quantum computing!",
            "intermediate": f"🏆 Amazing work! You've mastered {title}! You're becoming a quantum circuit expert!",
            "advanced": f"🌟 Extraordinary! You've conquered {title}! You're ready for real quantum machine learning research!"
        }
        
        return messages.get(difficulty, f"🎉 Congratulations! You've completed {title}!")
    
    def get_lesson_status(self, user_id: str = "default") -> Dict[str, Any]:
        """Get current lesson status for a user."""
        if user_id not in self.active_sessions:
            return {
                "active": False,
                "message": "No active lesson. Start a lesson to begin learning!"
            }
        
        session = self.active_sessions[user_id]
        return {
            "active": True,
            "lesson_id": session.lesson_id,
            "current_step": session.current_step,
            "completed_steps": session.completed_steps,
            "mistakes": len(session.mistakes),
            "hints_used": session.hints_used,
            "progress_percentage": int(len(session.completed_steps) / max(session.current_step, 1) * 100)
        }
    
    def provide_hint(
        self,
        lesson_id: str,
        step_number: int,
        lesson_data: Dict[str, Any],
        user_circuit: List[Dict[str, Any]],
        user_id: str = "default"
    ) -> Dict[str, Any]:
        """
        Provide an additional hint for the current step.
        
        Returns:
            Enhanced hint based on current circuit state
        """
        if user_id in self.active_sessions:
            self.active_sessions[user_id].hints_used += 1
        
        step = lesson_data["steps"][step_number - 1]
        expected_gate = step["expectedGate"]
        
        # Analyze what the user has done so far
        analysis = self._analyze_circuit_attempt(user_circuit, expected_gate)
        
        hint = {
            "hint": step["hint"],
            "additional_guidance": analysis["guidance"],
            "visual_guide": {
                "gate_type": expected_gate["gateType"],
                "targets": expected_gate["targets"],
                "controls": expected_gate.get("controls", []),
                "column": expected_gate["column"],
                "params": expected_gate.get("params", {})
            },
            "reminder": step.get("whyItMatters", "")
        }
        
        return hint
    
    def _analyze_circuit_attempt(
        self,
        user_circuit: List[Dict[str, Any]],
        expected_gate: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze user's circuit attempt and provide targeted guidance."""
        gate_type = expected_gate["gateType"]
        
        # Check if they have any gates at all
        if not user_circuit:
            return {
                "guidance": f"Start by dragging a {gate_type} gate from the gate palette on the left to the circuit canvas."
            }
        
        # Check if they have the right type of gate
        has_correct_type = any(g.get("gateType") == gate_type for g in user_circuit)
        if not has_correct_type:
            return {
                "guidance": f"You need to add a {gate_type} gate. Look for it in the gate palette - it might be in the rotation gates section."
            }
        
        # They have the gate but it's configured wrong
        return {
            "guidance": f"You have a {gate_type} gate, but check its position, target qubit, and parameters. Make sure everything matches the expected values!"
        }
    
    def suggest_next_action(
        self,
        lesson_id: str,
        user_circuit: List[Dict[str, Any]],
        lesson_data: Dict[str, Any],
        user_id: str = "default"
    ) -> Dict[str, Any]:
        """
        Suggest what the user should do next based on circuit state.
        Uses MCP-like monitoring to guide the user.
        """
        session = self.active_sessions.get(user_id)
        if not session:
            return {"suggestion": "Start a lesson first!"}
        
        current_step = session.current_step
        if current_step > len(lesson_data["steps"]):
            return {
                "suggestion": "Lesson complete! Try the next lesson or experiment with the circuit.",
                "lesson_complete": True
            }
        
        step = lesson_data["steps"][current_step - 1]
        expected_gate = step["expectedGate"]
        
        # Check if current step is complete
        validation = self._check_gate_presence(user_circuit, expected_gate, current_step)
        
        if validation["correct"]:
            return {
                "suggestion": f"Step {current_step} complete! Move on to step {current_step + 1}: {lesson_data['steps'][current_step]['title'] if current_step < len(lesson_data['steps']) else 'Finish'}",
                "step_complete": True,
                "next_step": current_step + 1
            }
        else:
            return {
                "suggestion": f"Focus on completing step {current_step}: {step['title']}",
                "step_incomplete": True,
                "current_step": current_step,
                "instruction": step["instruction"]
            }
    
    def fix_circuit_issue(
        self,
        lesson_id: str,
        step_number: int,
        user_circuit: List[Dict[str, Any]],
        lesson_data: Dict[str, Any],
        issue_type: str,
        user_id: str = "default"
    ) -> Dict[str, Any]:
        """
        Provide specific guidance to fix a detected issue.
        
        Args:
            issue_type: Type of issue (e.g., "wrong_target", "wrong_param_theta", "missing_gate")
        """
        step = lesson_data["steps"][step_number - 1]
        expected_gate = step["expectedGate"]
        
        fixes = {
            "missing_gate": {
                "problem": f"The {expected_gate['gateType']} gate is missing from your circuit",
                "solution": f"Add a {expected_gate['gateType']} gate from the gate palette",
                "steps": [
                    f"1. Find the {expected_gate['gateType']} gate in the sidebar",
                    f"2. Drag it to qubit {expected_gate['targets'][0]}",
                    f"3. Place it in column {expected_gate['column']}"
                ]
            },
            "wrong_target": {
                "problem": f"The gate is on the wrong qubit",
                "solution": f"Move the gate to qubit {expected_gate['targets'][0]}",
                "steps": [
                    "1. Click on the gate to select it",
                    f"2. Drag it to qubit {expected_gate['targets'][0]}",
                    "3. Make sure it's in the correct position"
                ]
            },
            "wrong_control": {
                "problem": "The control qubit is incorrect",
                "solution": f"Set the control qubit to {expected_gate.get('controls', [])[0] if expected_gate.get('controls') else 'none'}",
                "steps": [
                    "1. Click on the gate",
                    "2. Adjust the control qubit in the gate parameters",
                    f"3. Set it to qubit {expected_gate.get('controls', [])[0] if expected_gate.get('controls') else 'none'}"
                ]
            },
            "wrong_position": {
                "problem": "The gate is in the wrong column (wrong time step)",
                "solution": f"Move the gate to column {expected_gate['column']}",
                "steps": [
                    "1. Click and drag the gate horizontally",
                    f"2. Drop it in column {expected_gate['column']}",
                    "3. Verify it's aligned with other gates in that column"
                ]
            }
        }
        
        # Handle parameter issues
        if issue_type.startswith("wrong_param_"):
            param_name = issue_type.split("_")[-1]
            expected_value = expected_gate.get("params", {}).get(param_name, 0)
            fixes[issue_type] = {
                "problem": f"The {param_name} parameter has the wrong value",
                "solution": f"Set {param_name} to {expected_value:.3f} radians",
                "steps": [
                    "1. Click on the gate to open its parameters",
                    f"2. Find the {param_name} parameter",
                    f"3. Set it to {expected_value:.3f}",
                    "4. Apply the changes"
                ]
            }
        
        fix_guide = fixes.get(issue_type, {
            "problem": "There's an issue with the gate configuration",
            "solution": "Review the expected gate properties and adjust your gate accordingly",
            "steps": ["Check the instruction and hint for guidance"]
        })
        
        return {
            "issue_type": issue_type,
            "fix_guide": fix_guide,
            "expected_gate": expected_gate,
            "encouragement": "You're on the right track! Small adjustments will get you there. 💪"
        }
