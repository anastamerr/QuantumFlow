# QuantumFlow - Qiskit Fall Fest 2025 Hackathon Edition

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![React](https://img.shields.io/badge/React-18.x-61dafb)
![Python](https://img.shields.io/badge/Python-3.8+-green)
![Qiskit](https://img.shields.io/badge/Qiskit-1.2.4-purple)
![Chakra UI](https://img.shields.io/badge/Chakra%20UI-2.x-319795)

**Welcome to QuantumFlow!** A modern, interactive quantum circuit design and simulation platform built for the Qiskit Fall Fest 2025. This repository is your starting point for building innovative quantum computing features and modules.

## Table of Contents
- [What is QuantumFlow?](#what-is-quantumflow)
- [Getting Started in 5 Minutes](#getting-started-in-5-minutes)
- [Hackathon Challenge](#hackathon-challenge)
- [Project Architecture](#project-architecture)
- [Current Features](#current-features)
- [Suggested Hackathon Ideas](#suggested-hackathon-ideas)
- [Development Workflow](#development-workflow)
- [Resources & Documentation](#resources--documentation)

---

## What is QuantumFlow?

QuantumFlow is a **full-stack quantum circuit simulator** that allows users to:
- Design quantum circuits visually with drag-and-drop
- Simulate circuits in real-time using a custom JavaScript quantum engine
- Generate code for Qiskit, Cirq, and AWS Braket
- Execute circuits on real Qiskit backends (Aer simulator or IBM Quantum hardware)
- Visualize quantum states with 3D Bloch spheres and probability distributions

**Tech Stack:**
- **Frontend**: React + TypeScript + Chakra UI + Vite
- **Backend**: FastAPI + Python + Qiskit
- **State Management**: Redux Toolkit
- **Visualization**: Three.js + D3.js

---

## Getting Started in 5 Minutes

### Prerequisites
- **Node.js** 16.x or higher ([Download](https://nodejs.org/))
- **Python** 3.8+ ([Download](https://www.python.org/))
- **Git** ([Download](https://git-scm.com/))
- A code editor (VS Code recommended)

### Step 1: Clone the Repository
```bash
git clone <your-fork-url>
cd QuantumFlow
```

### Step 2: Start the Backend (Qiskit Server)

**Windows (PowerShell):**
```powershell
cd backend
./dev.ps1
```

**macOS/Linux:**
```bash
cd backend
chmod +x dev.sh
./dev.sh
```

The backend will start at `http://localhost:8000`. Verify it's running by visiting:
- Health check: http://localhost:8000/health
- API docs: http://localhost:8000/docs

### Step 3: Start the Frontend

**In a new terminal:**
```bash
cd frontend
npm install
npm run dev
```

The frontend will start at `http://localhost:5173` (or similar). Open it in your browser!

### Step 4: Test the Application

1. You should see the QuantumFlow interface with a gate palette and circuit canvas
2. Try dragging a Hadamard (H) gate to qubit 0
3. Add a CNOT gate to create a Bell state
4. Click "Simulation" panel and run the simulation
5. View results in the visualization panel

**Congratulations!** You're ready to start hacking.

---

## Hackathon Challenge

### Your Mission
Enhance QuantumFlow by adding new features, modules, or improvements that make quantum computing more accessible, powerful, or educational.

### What You Can Build
- **New quantum algorithms**: Implement Grover's search, Shor's algorithm, VQE, QAOA
- **Educational features**: Interactive tutorials, step-by-step algorithm walkthroughs
- **Visualization improvements**: New ways to visualize quantum states, entanglement, or noise
- **Hardware integration**: Connect to real IBM Quantum devices or other quantum backends
- **Optimization tools**: Better circuit optimization, transpilation, or error mitigation
- **Collaborative features**: Multi-user circuit editing, sharing, or version control
- **Performance enhancements**: Improve simulation speed, support more qubits
- **Developer tools**: Circuit debugger, profiler, or testing framework

### Judging Criteria (Typical for Hackathons)
- **Innovation**: How creative and original is your idea?
- **Technical Implementation**: Code quality, architecture, and use of Qiskit
- **User Experience**: Is it intuitive and easy to use?
- **Impact**: How useful is this feature to the quantum computing community?
- **Presentation**: Can you clearly explain your solution?

---

## Project Architecture

### Repository Structure
```
QuantumFlow/
├── frontend/              # React + TypeScript application
│   ├── src/
│   │   ├── components/    # UI components (gates, canvas, panels)
│   │   ├── store/         # Redux state management
│   │   ├── utils/         # Quantum simulation, code generation
│   │   └── lib/           # API client for backend
│   └── package.json
│
├── backend/               # FastAPI + Qiskit server
│   ├── app/
│   │   ├── main.py        # API routes
│   │   ├── qiskit_runner.py  # Circuit execution engine
│   │   └── models.py      # Data models
│   └── requirements.txt
│
└── README.md             # You are here!
```

### Key Files to Explore

#### Frontend
- `frontend/src/App.tsx` - Main application component
- `frontend/src/store/slices/circuitSlice.ts` - Circuit state management
- `frontend/src/utils/stateEvolution.ts` - Quantum simulator (JavaScript)
- `frontend/src/utils/gateLibrary.ts` - Gate definitions
- `frontend/src/components/generator/generators/qiskitGenerator.ts` - Qiskit code generator
- `frontend/src/lib/quantumApi.ts` - Backend API client

#### Backend
- `backend/app/main.py` - FastAPI server and routes
- `backend/app/qiskit_runner.py` - Qiskit circuit execution
- `backend/app/models.py` - Request/response schemas

### Data Flow
```
User drags gate → Redux store updated → Circuit canvas re-renders
                                      ↓
                          User clicks "Run Simulation"
                                      ↓
                    Frontend sends circuit to backend API
                                      ↓
                         Backend builds Qiskit circuit
                                      ↓
                        Executes on Aer simulator/IBM Quantum
                                      ↓
                    Returns measurement counts + probabilities
                                      ↓
                      Frontend visualizes results
```

---

## Current Features

### Circuit Design
- 15+ quantum gates (H, X, Y, Z, S, T, RX, RY, RZ, P, CNOT, CZ, SWAP, Toffoli, Measure)
- Drag-and-drop interface with real-time SVG visualization
- Interactive parameter controls for rotation gates
- Multi-qubit operations with automatic target assignment

### Quantum Simulation
- Custom JavaScript state vector simulator (up to 8-10 qubits)
- Step-by-step state evolution tracking
- Measurement probability calculations
- 3D Bloch sphere visualization (Three.js)
- Superposition and entanglement detection

### Code Generation
- **Qiskit Python**: Full circuit code with optimization passes
- **Cirq Python**: Google Cirq moment-based circuits
- **Braket Python**: AWS Braket code generation
- **JSON Export**: Structured circuit data

### Optimization
- Gate consolidation and cancellation
- Circuit depth reduction
- Hardware-aware qubit mapping (IBM Falcon, Google Sycamore, linear, grid)
- Noise-aware optimization

### Backend Integration
- FastAPI server with CORS support
- Qiskit Aer simulator execution
- Extensible for IBM Quantum hardware
- Health monitoring and API documentation

---

## Suggested Hackathon Ideas

Here are some creative project ideas to get you started:

### Beginner-Friendly Ideas

1. **Quantum Algorithm Library Expansion**
   - Add pre-built circuits for Grover's search, Shor's algorithm, or quantum teleportation
   - Location: `frontend/src/utils/algorithmLibrary.ts`
   - Difficulty: Easy-Medium

2. **Interactive Tutorial System**
   - Create step-by-step tutorials that highlight gates as they're explained
   - Build a "Quantum Computing 101" guided tour
   - Location: `frontend/src/components/panels/TutorialPanel.tsx`
   - Difficulty: Easy

3. **Circuit Statistics Dashboard**
   - Show circuit depth, gate count, entanglement metrics
   - Add a "Circuit Complexity Score"
   - Location: New component in `frontend/src/components/panels/`
   - Difficulty: Easy

4. **Custom Gate Creator**
   - Allow users to define custom gates as combinations of existing gates
   - Save and reuse custom gates
   - Location: `frontend/src/utils/gateLibrary.ts` + new UI component
   - Difficulty: Medium

### Intermediate Ideas

5. **Real IBM Quantum Hardware Integration**
   - Connect to IBM Quantum using Qiskit Runtime
   - Show queue times and device calibration data
   - Location: `backend/app/qiskit_runner.py` + new frontend panel
   - Difficulty: Medium

6. **Quantum Circuit Debugger**
   - Set breakpoints in circuits
   - Inspect quantum state at each step
   - Show gate-by-gate state changes
   - Location: New panel + enhance `stateEvolution.ts`
   - Difficulty: Medium

7. **Noise Simulator**
   - Add realistic quantum noise models (depolarizing, amplitude damping)
   - Visualize how noise affects circuit fidelity
   - Location: `frontend/src/utils/stateEvolution.ts` or backend
   - Difficulty: Medium-Hard

8. **Circuit Import from OpenQASM**
   - Parse OpenQASM 2.0/3.0 files
   - Import circuits from Qiskit code
   - Location: New utility in `frontend/src/utils/`
   - Difficulty: Medium

### Advanced Ideas

9. **Variational Quantum Eigensolver (VQE) Module**
   - Build a VQE interface for chemistry problems
   - Implement classical optimizer integration
   - Visualize energy landscapes
   - Location: New feature module + backend optimization
   - Difficulty: Hard

10. **Quantum Error Correction Simulator**
    - Implement surface codes or Shor code
    - Visualize error syndrome detection
    - Show logical vs physical qubits
    - Location: New module + visualization components
    - Difficulty: Hard

11. **Multi-User Collaborative Circuit Editing**
    - Real-time WebSocket connections
    - See other users' cursors and edits
    - Circuit version control
    - Location: New backend WebSocket server + frontend collab system
    - Difficulty: Hard

12. **Quantum Machine Learning Toolkit**
    - Quantum neural networks (QNN)
    - Quantum kernel methods
    - Integration with quantum datasets
    - Location: New module with Qiskit Machine Learning
    - Difficulty: Hard

### Creative/Wildcard Ideas

13. **Quantum Music Generator**
    - Use quantum superposition to generate melodies
    - Map quantum states to musical notes
    - Play sounds based on measurement outcomes
    - Difficulty: Medium

14. **Quantum Game**
    - Build a puzzle game teaching quantum concepts
    - Use circuit building as game mechanics
    - Difficulty: Medium

15. **AR/VR Quantum Circuit Visualizer**
    - 3D circuit visualization in VR/AR
    - Walk through circuits in virtual space
    - Difficulty: Hard

---

## Development Workflow

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/my-awesome-feature
   ```

2. **Make your changes**
   - Frontend code: `frontend/src/`
   - Backend code: `backend/app/`

3. **Test your changes**
   ```bash
   # Frontend
   cd frontend
   npm run dev

   # Backend
   cd backend
   ./dev.sh  # or dev.ps1 on Windows
   ```

4. **Commit and push**
   ```bash
   git add .
   git commit -m "Add my awesome feature"
   git push origin feature/my-awesome-feature
   ```

### Code Organization Tips

- **Adding a new gate**: Modify `frontend/src/utils/gateLibrary.ts` and `stateEvolution.ts`
- **Adding a new panel**: Create in `frontend/src/components/panels/` and register in `App.tsx`
- **Adding a backend endpoint**: Add route in `backend/app/main.py` and model in `models.py`
- **Modifying state**: Update Redux slices in `frontend/src/store/slices/`

### Debugging

**Frontend:**
- Open browser DevTools (F12)
- Check Console for errors
- Use React DevTools extension
- Use Redux DevTools extension

**Backend:**
- Check terminal output for FastAPI logs
- Visit http://localhost:8000/docs for interactive API testing
- Add `print()` statements in Python code

### Common Issues

| Issue | Solution |
|-------|----------|
| Backend won't start | Check Python version (`python --version`), reinstall deps |
| Frontend build errors | Delete `node_modules`, run `npm install` again |
| CORS errors | Check `ALLOWED_ORIGINS` in `backend/.env` |
| Simulation crashes | Reduce qubit count (<10 qubits for browser) |
| Gate not appearing | Check `gateLibrary.ts` and component imports |

---

## Resources & Documentation

### Quantum Computing Basics
- [Qiskit Textbook](https://qiskit.org/textbook/) - Learn quantum computing
- [Quantum Computing for the Very Curious](https://quantum.country/) - Interactive essay
- [IBM Quantum Composer](https://quantum-computing.ibm.com/composer) - Similar visual tool

### Qiskit Documentation
- [Qiskit Documentation](https://qiskit.org/documentation/)
- [Qiskit Tutorials](https://qiskit.org/documentation/tutorials.html)
- [Qiskit API Reference](https://qiskit.org/documentation/apidoc/qiskit.html)

### QuantumFlow Specific
- **Frontend README**: `frontend/README.md` - Frontend development guide
- **Backend README**: `backend/README.md` - Backend API documentation
- **Gate Library**: `frontend/src/utils/gateLibrary.ts` - All available gates
- **API Docs**: http://localhost:8000/docs (when backend is running)

### Technologies Used
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Chakra UI](https://chakra-ui.com/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [Three.js](https://threejs.org/)

---

## Getting Help

### During the Hackathon
- Ask mentors for help with quantum computing concepts
- Check existing GitHub issues for known problems
- Join the hackathon Discord/Slack for real-time support

### Technical Questions
- **Quantum computing questions**: Ask mentors or check Qiskit docs
- **Frontend issues**: Check React/TypeScript docs, browser console
- **Backend issues**: Check FastAPI docs, Python logs
- **Git issues**: Use `git status` and `git log` to debug

---

## Contributing Best Practices

1. **Write clean code**: Use TypeScript types, add comments for complex logic
2. **Test your features**: Make sure existing functionality still works
3. **Document your changes**: Update READMEs if you add new features
4. **Follow existing patterns**: Look at similar components/modules for consistency
5. **Ask questions**: Don't hesitate to ask mentors or teammates

---

## License

MIT License - see LICENSE file for details.

---

## Acknowledgments

- IBM Qiskit team for the amazing quantum computing framework
- Qiskit Fall Fest organizers for hosting this hackathon
- All contributors and participants

---

## Start Building!

**Your quantum journey starts here.** Pick an idea, explore the code, and build something amazing!

Have questions? Check the `frontend/README.md` and `backend/README.md` for more detailed development guides.

**Good luck and have fun!**
