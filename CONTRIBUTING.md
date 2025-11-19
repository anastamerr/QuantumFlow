# Contributing to QuantumFlow - Hackathon Edition

Thank you for participating in Qiskit Fall Fest 2025! This guide will help you contribute effectively to QuantumFlow.

## Quick Start Checklist

- [ ] Forked the repository
- [ ] Cloned your fork locally
- [ ] Set up frontend (Node.js + npm install)
- [ ] Set up backend (Python + pip install)
- [ ] Created a feature branch
- [ ] Read the relevant README files
- [ ] Picked a project idea (or created your own!)

## Development Workflow

### 1. Fork and Clone

```bash
# Fork the repo on GitHub, then clone your fork
git clone https://github.com/anastamerr/QuantumFlow.git
cd QuantumFlow

# Add upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/QuantumFlow.git
```

### 2. Create a Feature Branch

**IMPORTANT: For Qiskit Fall Fest 2025 Hackathon Submissions**

All participants must create their branch from the `hackathon/qiskit-fall-fest-2025` branch using the following naming convention:

```bash
# First, checkout the hackathon branch
git checkout hackathon/qiskit-fall-fest-2025

# Create and switch to a new branch with the format: team-name/feature-or-addition
git checkout -b your-team-name/your-feature-name

# Examples:
# git checkout -b quantum-explorers/vqe-module
# git checkout -b circuit-masters/tutorial-system
# git checkout -b qiskit-ninjas/noise-simulator
```

**Branch Naming Format:** `team-name/feature-or-addition`
- Replace `team-name` with your team or personal identifier
- Replace `feature-or-addition` with a brief description of what you're adding
- Use kebab-case (lowercase with dashes)

This branch structure allows for organized submissions and gives your contribution a chance to get merged into the main project!

### 3. Make Your Changes

**Before you start coding:**
- Check existing issues and PRs to avoid duplicates
- Read the architecture docs in README files
- Set up your development environment

**While coding:**
- Follow the code style guidelines below
- Write clean, documented code
- Test as you go
- Commit frequently with clear messages

### 4. Test Your Changes

**Frontend:**
```bash
cd frontend
npm run dev    # Test in browser
npm run build  # Ensure it builds
npm run lint   # Check for linting errors
```

**Backend:**
```bash
cd backend
./dev.sh       # Start server (or dev.ps1 on Windows)

# Test endpoints at http://localhost:8000/docs
# Check health endpoint
curl http://localhost:8000/health
```

### 5. Commit Your Work

```bash
# Stage your changes
git add .

# Commit with a descriptive message
git commit -m "Add VQE module with energy landscape visualization"

# More commit message examples:
# git commit -m "Fix: Correct Hadamard gate matrix in simulator"
# git commit -m "Docs: Update README with VQE tutorial"
# git commit -m "Refactor: Simplify circuit state management"
```

### 6. Push and Create Pull Request

```bash
# Push to your fork (use your team-name/feature-name branch)
git push origin your-team-name/your-feature-name
```

Then create a Pull Request on GitHub:
1. Go to your fork on GitHub
2. Click "New Pull Request"
3. **Set base branch to:** `hackathon/qiskit-fall-fest-2025`
4. **Set compare branch to:** your `team-name/feature-or-addition` branch
5. Write a **quick description** of your feature/addition (see template below)
6. Submit your PR for a chance to get merged!

**Note:** Your PR will be reviewed for potential merge into the project. Make sure to include a clear, concise description of what you've added!

## Pull Request Template

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Refactoring

## Hackathon Project
- **Project Name**: [e.g., "VQE Module"]
- **Difficulty Level**: [Beginner/Intermediate/Advanced]
- **Estimated Time Spent**: [e.g., "8 hours"]

## Features Added
- Feature 1
- Feature 2
- Feature 3

## Screenshots/Demo
(Add screenshots or GIFs if applicable)

## Testing Done
- [ ] Frontend builds without errors
- [ ] Backend starts correctly
- [ ] Tested manually in browser
- [ ] No console errors
- [ ] Works on Chrome/Firefox

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-reviewed my code
- [ ] Commented complex sections
- [ ] Updated documentation (README, etc.)
- [ ] No breaking changes to existing features
```

---

## Code Style Guidelines

### Frontend (TypeScript/React)

**File Naming:**
- Components: `PascalCase.tsx` (e.g., `VQEPanel.tsx`)
- Utilities: `camelCase.ts` (e.g., `circuitStats.ts`)
- Types: `circuit.ts`, `vqe.ts`

**Component Structure:**
```typescript
import React from 'react'
import { Box, Heading } from '@chakra-ui/react'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '@/store'

interface MyComponentProps {
  prop1: string
  prop2?: number  // Optional props with ?
}

export default function MyComponent({ prop1, prop2 = 0 }: MyComponentProps) {
  // Hooks at the top
  const dispatch = useDispatch()
  const state = useSelector((state: RootState) => state.circuit)

  // Event handlers
  const handleClick = () => {
    // Handler logic
  }

  // Render
  return (
    <Box p={4}>
      <Heading>{prop1}</Heading>
      {/* Component content */}
    </Box>
  )
}
```

**TypeScript Best Practices:**
- Always use type annotations
- Avoid `any` type
- Use interfaces for props
- Export types when shared

**State Management:**
- Use Redux for global state
- Use local state (`useState`) for component-specific state
- Keep state minimal and normalized

**Styling:**
- Use Chakra UI components
- Prefer Chakra props over custom CSS
- Use theme colors (e.g., `colorScheme="blue"`)

### Backend (Python/FastAPI)

**File Naming:**
- Modules: `snake_case.py` (e.g., `qiskit_runner.py`)
- Classes: `PascalCase`
- Functions: `snake_case`

**Function Structure:**
```python
from typing import List, Dict, Optional
from pydantic import BaseModel

def my_function(param1: str, param2: int = 0) -> Dict[str, any]:
    """
    Brief description of what this function does.

    Args:
        param1: Description of param1
        param2: Description of param2 (default: 0)

    Returns:
        Dictionary containing the result

    Raises:
        ValueError: If param1 is invalid
    """
    # Function implementation
    result = {"status": "success"}
    return result
```

**API Endpoint Structure:**
```python
@app.post("/api/v1/my-endpoint", response_model=MyResponse)
async def my_endpoint(request: MyRequest):
    """
    Endpoint description.

    This endpoint does X, Y, and Z.
    """
    try:
        # Validate input
        # Process request
        # Return response
        return MyResponse(status="success", data=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

**Python Best Practices:**
- Follow PEP 8 style guide
- Use type hints everywhere
- Add docstrings to all functions
- Handle exceptions properly
- Keep functions small and focused

---

## Project Structure Guidelines

### Adding a New Feature

**Frontend Feature:**
```
frontend/src/
├── components/
│   ├── panels/
│   │   └── MyNewPanel.tsx        # Your new panel
│   └── ...
├── store/slices/
│   └── myFeatureSlice.ts         # If you need new state
├── utils/
│   └── myFeatureUtils.ts         # Helper functions
└── types/
    └── myFeature.ts              # Type definitions
```

**Backend Feature:**
```
backend/app/
├── main.py                       # Add endpoint here
├── models.py                     # Add request/response models
└── my_feature_runner.py          # New module for complex logic
```

### File Organization

- **One component per file** (frontend)
- **Group related utilities** (e.g., all VQE utils in one file)
- **Separate concerns** (UI, logic, data)
- **Keep files under 300 lines** when possible

---

## Testing Guidelines

### Manual Testing Checklist

**Before submitting a PR:**
- [ ] Feature works as expected
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Works in Chrome and Firefox
- [ ] Mobile responsive (if applicable)
- [ ] Doesn't break existing features
- [ ] Backend endpoints return correct data
- [ ] Error handling works
- [ ] Loading states work properly

### Testing Your Feature

**Frontend:**
1. Start dev server: `npm run dev`
2. Test all user interactions
3. Check browser console for errors
4. Test edge cases (empty inputs, large numbers, etc.)
5. Test with different circuit sizes

**Backend:**
1. Start server: `./dev.sh`
2. Use http://localhost:8000/docs to test endpoints
3. Test with invalid inputs
4. Check server logs for errors
5. Test with different circuit configurations

---

## Documentation Guidelines

### Code Comments

**When to comment:**
- Complex algorithms
- Non-obvious logic
- Quantum mechanics explanations
- Performance considerations
- Workarounds or hacks

**When NOT to comment:**
- Obvious code (e.g., `// Set x to 5`)
- Redundant explanations

**Example:**
```typescript
// Apply Hadamard gate: Creates superposition by rotating qubit
// from |0⟩ to (|0⟩ + |1⟩)/√2
function applyHadamard(state: StateVector, qubit: number) {
  // Matrix-free implementation for performance
  // H = (1/√2) * [[1, 1], [1, -1]]
  const factor = 1 / Math.sqrt(2)
  // ... implementation
}
```

### README Updates

**If you add a new feature, update:**
- Main README.md (add to features list)
- Frontend/Backend README (if applicable)
- HACKATHON_IDEAS.md (if you implemented an idea)

**Format:**
```markdown
### Your New Feature

Brief description (1-2 sentences).

**How to use:**
1. Step 1
2. Step 2
3. Step 3

**Technical details:**
- Location: `path/to/file.ts`
- Dependencies: List any new packages
```

---

## Common Pitfalls to Avoid

### Frontend

❌ **Don't:**
- Mutate Redux state directly
- Use `any` type
- Forget to handle loading/error states
- Use inline styles instead of Chakra props
- Create huge components (>300 lines)

✅ **Do:**
- Use Redux actions to update state
- Add proper TypeScript types
- Show loading spinners and error messages
- Use Chakra UI components and props
- Break large components into smaller ones

### Backend

❌ **Don't:**
- Skip input validation
- Return raw error messages to frontend
- Use global variables
- Forget type hints
- Block the event loop with heavy computation

✅ **Do:**
- Use Pydantic models for validation
- Return user-friendly error messages
- Use function parameters and return values
- Add type hints to all functions
- Use async/await for I/O operations

---

## Git Best Practices

### Commit Messages

**Format:**
```
Type: Brief description (50 chars max)

Longer explanation if needed (wrap at 72 chars).
Can include multiple paragraphs.

- Bullet points are okay
- List changes or rationale
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Formatting, missing semicolons, etc.
- `refactor:` Code restructuring
- `test:` Adding tests
- `chore:` Maintenance tasks

**Examples:**
```
feat: Add VQE module with energy optimization

Implements variational quantum eigensolver for molecular
chemistry problems. Includes ansatz builder, classical
optimizer integration, and energy landscape visualization.

- Added VQEPanel component
- Integrated Qiskit Nature
- Created energy plotting with D3.js
```

```
fix: Correct Bloch sphere rotation calculation

The previous implementation didn't account for phase.
Now properly converts state vector to spherical coordinates.
```

### Branch Naming

**Format:** `type/short-description`

**Examples:**
- `feature/vqe-module`
- `feature/tutorial-system`
- `fix/bloch-sphere-rotation`
- `docs/update-readme`
- `refactor/circuit-state`

### Keeping Your Fork Updated

```bash
# Fetch upstream changes
git fetch upstream

# Merge into your branch
git checkout main
git merge upstream/main

# Push to your fork
git push origin main
```

---

## Getting Help

### Resources

- **Main README**: `README.md` - Project overview
- **Frontend README**: `frontend/README.md` - Frontend guide
- **Backend README**: `backend/README.md` - Backend guide
- **Ideas**: `HACKATHON_IDEAS.md` - Project inspiration

### Ask Questions

- **Hackathon Discord/Slack**: Real-time help from mentors
- **GitHub Issues**: Report bugs or ask questions
- **Qiskit Docs**: https://qiskit.org/documentation/
- **React Docs**: https://react.dev/
- **FastAPI Docs**: https://fastapi.tiangolo.com/

---

## Hackathon-Specific Tips

### Time Management

**Hour 1-2:** Setup and planning
- Get everything running
- Pick your project
- Break it into tasks

**Hour 3-8:** Core implementation
- Build main features
- Test as you go
- Ask for help when stuck

**Hour 9-10:** Polish
- Fix bugs
- Add documentation
- Prepare demo

**Hour 11-12:** Presentation prep
- Practice demo
- Prepare slides (optional)
- Test one more time

### Presentation Tips

**What to include:**
1. **Problem**: What issue does your project solve?
2. **Solution**: How does it work?
3. **Demo**: Show it in action!
4. **Technical details**: Cool tech you used
5. **Impact**: Who benefits and how?

**What to avoid:**
- Reading slides
- Showing only code
- Skipping the demo
- Going over time

---

## Code of Conduct

### Be Respectful
- Respect other participants' ideas
- Give constructive feedback
- Help others when you can
- Have fun!

### Be Collaborative
- Share knowledge
- Ask questions
- Offer help
- Celebrate others' success

### Be Honest
- Don't plagiarize code
- Give credit where due
- Use open-source responsibly
- Follow licensing rules

---

## License

By contributing to QuantumFlow, you agree that your contributions will be licensed under the MIT License.

---

## Thank You!

Thank you for contributing to QuantumFlow and participating in Qiskit Fall Fest 2025! Your innovation helps make quantum computing more accessible to everyone.

**Happy hacking!** 🚀⚛️
