# QuantumFlow Quick Start Guide

Get QuantumFlow running in 5 minutes! This guide will help you set up and test the application quickly.

## Prerequisites Check

Before starting, ensure you have:

- [ ] **Node.js** 16.x or higher - [Download](https://nodejs.org/)
  ```bash
  node --version  # Should show v16.x or higher
  ```

- [ ] **Python** 3.8 or higher - [Download](https://www.python.org/)
  ```bash
  python --version  # Should show 3.8 or higher
  ```

- [ ] **Git** - [Download](https://git-scm.com/)
  ```bash
  git --version
  ```

- [ ] A code editor (VS Code recommended)
- [ ] A terminal/command prompt

---

## Step-by-Step Setup

### Step 1: Clone the Repository (30 seconds)

```bash
# Navigate to where you want the project
cd /path/to/your/projects

# Clone the repo
git clone <repository-url>
cd QuantumFlow
```

### Step 2: Start the Backend (2 minutes)

**Windows (PowerShell):**
```powershell
# Open PowerShell in the project directory
cd backend
./dev.ps1
```

**macOS/Linux:**
```bash
# Open terminal in the project directory
cd backend
chmod +x dev.sh
./dev.sh
```

**What this does:**
- Creates Python virtual environment
- Installs Qiskit and dependencies
- Creates `.env` file if needed
- Starts FastAPI server on port 8000

**Expected output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

✅ **Verify:** Open http://localhost:8000/health in your browser
- Should show: `{"status": "ok", "qiskit": true, "backend_env": "aer_simulator"}`

### Step 3: Start the Frontend (2 minutes)

**Open a NEW terminal/PowerShell window:**

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (first time only)
npm install

# Start development server
npm run dev
```

**Expected output:**
```
  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

✅ **Verify:** Open http://localhost:5173 in your browser
- Should show QuantumFlow interface with gate palette

### Step 4: Test the Application (1 minute)

1. **Build a simple circuit:**
   - Drag a Hadamard (H) gate from the sidebar to qubit 0
   - Drag a CNOT gate to create a Bell state

2. **Run simulation:**
   - Click the "Simulation" tab at the top
   - Click "Run Simulation"
   - You should see measurement probabilities (50% |00⟩, 50% |11⟩)

3. **Generate code:**
   - Click the "Code" tab
   - Select "Qiskit" from the dropdown
   - You should see Python code for your circuit

🎉 **Success!** QuantumFlow is running!

---

## Common Issues and Fixes

### Backend Won't Start

**Issue:** `ModuleNotFoundError: No module named 'qiskit'`

**Fix:**
```bash
cd backend
pip install -r requirements.txt
```

**Issue:** `Port 8000 already in use`

**Fix:**
```bash
# Find and kill the process using port 8000
# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:8000 | xargs kill -9
```

### Frontend Won't Start

**Issue:** `Module not found` or dependency errors

**Fix:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**Issue:** `Port 5173 already in use`

**Fix:** Vite will automatically use the next available port (5174, 5175, etc.)

### CORS Errors

**Issue:** Frontend can't connect to backend

**Fix:**
```bash
# In backend/.env, add your frontend URL:
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
```

Then restart the backend server.

### Python Version Too Old

**Issue:** `Python 3.8+ required`

**Fix:** Download and install Python 3.8+ from https://www.python.org/

---

## Next Steps

Now that QuantumFlow is running:

1. **Explore the interface:**
   - Try different quantum gates
   - Build circuits like Bell states, GHZ states
   - Experiment with rotation gates

2. **Read the documentation:**
   - `README.md` - Project overview
   - `frontend/README.md` - Frontend development
   - `backend/README.md` - Backend development
   - `HACKATHON_IDEAS.md` - Project ideas

3. **Pick a hackathon project:**
   - Browse `HACKATHON_IDEAS.md`
   - Choose beginner, intermediate, or advanced
   - Or create your own idea!

4. **Start coding:**
   - Create a feature branch: `git checkout -b feature/my-idea`
   - Read `CONTRIBUTING.md` for guidelines
   - Ask mentors if you get stuck

---

## Quick Reference

### Backend Commands

```bash
# Start backend (first time)
cd backend
./dev.sh  # or dev.ps1 on Windows

# Start backend (subsequent runs, skip install)
NO_INSTALL=1 ./dev.sh  # or dev.ps1 -NoInstall on Windows

# Manual start (if scripts don't work)
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\Activate.ps1 on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Backend URLs:**
- Health: http://localhost:8000/health
- API Docs: http://localhost:8000/docs
- Alternative Docs: http://localhost:8000/redoc

### Frontend Commands

```bash
# Install dependencies
cd frontend
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

**Frontend URL:**
- Dev Server: http://localhost:5173

---

## Development Workflow

```bash
# 1. Create feature branch
git checkout -b feature/my-awesome-feature

# 2. Make changes (edit code)

# 3. Test changes
cd frontend && npm run dev  # Test frontend
cd backend && ./dev.sh      # Test backend

# 4. Commit changes
git add .
git commit -m "Add my awesome feature"

# 5. Push to GitHub
git push origin feature/my-awesome-feature

# 6. Create Pull Request on GitHub
```

---

## Getting Help

### Documentation
- Main README: Project overview and hackathon info
- Frontend README: React, TypeScript, component guide
- Backend README: FastAPI, Qiskit, API docs
- Hackathon Ideas: 20+ project ideas with details
- Contributing Guide: Code style, PR templates

### Interactive Help
- **API Docs**: http://localhost:8000/docs (test backend endpoints)
- **Browser Console**: F12 → Console (check for errors)
- **Server Logs**: Check terminal where backend is running

### Community
- Ask hackathon mentors
- Check GitHub issues
- Join Discord/Slack channel

---

## Useful Resources

### Quantum Computing
- [Qiskit Textbook](https://qiskit.org/textbook/) - Learn quantum computing
- [IBM Quantum Composer](https://quantum-computing.ibm.com/composer) - Visual circuit builder
- [Qiskit Tutorials](https://qiskit.org/documentation/tutorials.html)

### Development
- [React Docs](https://react.dev/) - React 18 documentation
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Chakra UI](https://chakra-ui.com/) - Component library
- [FastAPI Docs](https://fastapi.tiangolo.com/) - Backend framework

---

## Tips for Success

### Time Savers
- ✅ Use `http://localhost:8000/docs` to test backend APIs
- ✅ Use browser DevTools (F12) to debug frontend
- ✅ Use Redux DevTools extension to inspect state
- ✅ Read existing code before writing new code
- ✅ Start with small features, then expand

### Avoid These Mistakes
- ❌ Don't skip reading the documentation
- ❌ Don't commit `node_modules` or `.venv`
- ❌ Don't work on `main` branch (use feature branches)
- ❌ Don't forget to test before committing
- ❌ Don't hesitate to ask for help

---

## Hackathon Checklist

Before you start coding:
- [ ] QuantumFlow is running (frontend + backend)
- [ ] Tested building a simple circuit
- [ ] Read main README.md
- [ ] Browsed HACKATHON_IDEAS.md
- [ ] Created a feature branch
- [ ] Picked a project idea

During development:
- [ ] Commit frequently with clear messages
- [ ] Test changes in browser
- [ ] Check console for errors
- [ ] Document complex code
- [ ] Ask for help when stuck

Before submitting:
- [ ] Feature works as expected
- [ ] No console errors
- [ ] Code is clean and commented
- [ ] Updated relevant README files
- [ ] Prepared demo for presentation

---

## Environment Variables

### Backend `.env`
```env
HOST=0.0.0.0
PORT=8000
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
QISKIT_BACKEND=aer_simulator
```

### Frontend `.env`
```env
VITE_API_BASE_URL=http://localhost:8000
```

---

## System Requirements

**Minimum:**
- 4GB RAM
- 2 CPU cores
- 5GB disk space
- Modern browser (Chrome, Firefox, Edge)

**Recommended:**
- 8GB RAM
- 4 CPU cores
- 10GB disk space
- Chrome (best performance for Three.js)

---

## Testing Your Setup

Run this checklist to ensure everything works:

1. **Backend Health Check:**
   ```bash
   curl http://localhost:8000/health
   # Should return: {"status":"ok","qiskit":true,"backend_env":"aer_simulator"}
   ```

2. **Frontend Loads:**
   - Open http://localhost:5173
   - Should see gate palette on left
   - Should see circuit canvas in center

3. **Drag and Drop Works:**
   - Drag an H gate to the circuit
   - Gate should appear on canvas

4. **Simulation Works:**
   - Build a simple circuit (H gate + CNOT)
   - Click Simulation → Run Simulation
   - Should see probability distribution

5. **Code Generation Works:**
   - Click Code tab
   - Select Qiskit
   - Should see Python code

✅ **All working?** You're ready to start hacking!

---

## Need More Help?

If you're still stuck after trying this guide:

1. Check the **full README.md** for detailed information
2. Browse **HACKATHON_IDEAS.md** for project inspiration
3. Read **CONTRIBUTING.md** for development guidelines
4. Ask a **mentor** for help
5. Check **GitHub Issues** for known problems

---

**Ready to build something amazing?** Let's go! 🚀⚛️
