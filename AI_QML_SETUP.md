# AI Chatbot & Quantum Machine Learning Setup Guide

## 🚀 New Features

### 1. **AI Chatbot with Gemini Integration**
- 💬 Natural language circuit generation
- 🎯 Drag-and-drop floating chat window
- ✨ Smooth animations with Framer Motion
- 📝 Conversation history with explanations
- 🔄 Automatic circuit visualization

### 2. **Quantum Machine Learning Toolkit**
- 🧠 Quantum Neural Network (QNN) builder
- 📊 Dataset upload and management
- 🎯 Training with visualization
- 📈 Model evaluation metrics
- 🏗️ Pre-built QML templates
- 🔬 Data encoding circuits (angle & amplitude)

---

## 📋 Prerequisites

### Backend Requirements
- **Python 3.10 or 3.11** (⚠️ NOT 3.13 due to qiskit-aer build issues)
- pip package manager
- Virtual environment support

### Frontend Requirements
- Node.js 18+ 
- npm or yarn

### API Keys
- Google Gemini API key (get from [Google AI Studio](https://makersuite.google.com/app/apikey))

---

## 🛠️ Installation Steps

### Step 1: Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment with Python 3.10 or 3.11
python3.11 -m venv .venv

# Activate virtual environment
# On macOS/Linux:
source .venv/bin/activate
# On Windows:
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Step 2: Configure Gemini API

Create a `.env` file in the `backend` directory:

```bash
# Copy example file
cp .env.example .env

# Edit .env and add your API key
echo "GEMINI_API_KEY=your_actual_gemini_api_key_here" >> .env
```

Get your Gemini API key:
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy and paste into `.env` file

### Step 3: Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (if not already done)
npm install

# Dependencies added:
# - papaparse: CSV parsing for QML datasets
# - recharts: Training visualization charts
# - @types/papaparse: TypeScript types
```

---

## 🚀 Running the Application

### Terminal 1: Start Backend

```bash
cd backend
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will run at: `http://localhost:8000`

### Terminal 2: Start Frontend

```bash
cd frontend
npm run dev
```

Frontend will run at: `http://localhost:5173`

---

## 🎯 Using the AI Chatbot

### Quick Start
1. Click the **chat icon** (💬) in the top-right header
2. Select number of qubits (2-5)
3. Type natural language requests like:
   - "Create a Bell state"
   - "Add Hadamard gates to qubits 0 and 1"
   - "Build a quantum teleportation circuit"
   - "Create a GHZ state with 3 qubits"

### Features
- **Draggable**: Click and drag the header to move the chat window
- **Minimizable**: Click the minimize button to collapse
- **Copy**: Copy AI responses to clipboard
- **Clear**: Start fresh conversation anytime
- **Auto-add**: Generated gates automatically appear in your circuit

### Example Prompts
```
"Create a 2-qubit entanglement circuit"
"Add a controlled-NOT gate with qubit 0 controlling qubit 1"
"Build a quantum phase estimation circuit"
"Create a superposition state on qubit 0"
"Apply Pauli-X gates to all qubits"
```

---

## 🧠 Using the QML Toolkit

### Navigation
1. Click **QML** button in header
2. Navigate through 5 tabs:
   - 📊 **Dataset**: Upload or generate training data
   - 🏗️ **Model Builder**: Configure QNN architecture
   - 🎯 **Training**: Train your quantum model
   - 📈 **Results**: View evaluation metrics
   - 📚 **Templates**: Load pre-built architectures

### Workflow

#### 1. Prepare Dataset
**Option A: Upload CSV**
- Training data format: `feature1,feature2,...,label`
- Test data format: same as training
- Labels: 0 or 1 (binary classification)

**Option B: Generate Sample**
- Click "Generate Sample Data"
- Creates XOR pattern dataset (15 train, 5 test)

#### 2. Build Model
Configure QNN parameters:
- **Qubits**: 2-10 (default: 2)
- **Layers**: 1-5 variational layers (default: 2)
- **Encoding**: Angle or Amplitude
- **Shots**: 100-10,000 measurements (default: 1024)

Total parameters = `qubits × 3 × layers`

#### 3. Train Model
Set hyperparameters:
- **Learning Rate**: 0.001-0.1 (default: 0.01)
- **Epochs**: 1-100 (default: 10)
- **Cost Function**: MSE or Cross Entropy

Click "Start Training" and watch the loss curve!

#### 4. Evaluate Results
- Click "Evaluate on Test Set"
- View accuracy, MSE, confusion matrix
- Analyze model performance

#### 5. Use Templates
Pre-configured architectures:
- **Basic Classifier**: 2 qubits, 2 layers, angle encoding
- **Deep QNN**: 4 qubits, 3 layers, amplitude encoding
- **Quantum Kernel**: Optimized for kernel methods

---

## 🔧 API Endpoints

### Chat Endpoints
```
POST /api/v1/chat/generate-circuit
Body: { "prompt": "Create a Bell state", "num_qubits": 2 }
Response: { "gates": [...], "explanation": "..." }
```

### QML Endpoints
```
POST /api/v1/qml/train
Body: { "train_data": [[...]], "train_labels": [...], ... }
Response: { "parameters": [...], "history": {...}, "final_loss": 0.123 }

POST /api/v1/qml/evaluate
Body: { "test_data": [[...]], "test_labels": [...], "parameters": [...], ... }
Response: { "accuracy": 0.85, "mse": 0.15, "confusion_matrix": {...} }

GET /api/v1/qml/templates
Response: { "templates": [...] }

POST /api/v1/qml/encode-data
Body: { "data": [[...]], "encoding": "angle", "num_qubits": 2 }
Response: { "circuits": [...] }
```

---

## 🐛 Troubleshooting

### Python Version Error
```
ERROR: Could not build wheels for qiskit-aer
```
**Solution**: Use Python 3.10 or 3.11, NOT 3.13
```bash
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Gemini API Error
```
Error: API key not valid
```
**Solution**: Check your `.env` file
```bash
cat backend/.env  # Verify GEMINI_API_KEY is set
```

### Missing Dependencies
```
ModuleNotFoundError: No module named 'google.generativeai'
```
**Solution**: Reinstall backend dependencies
```bash
cd backend
source .venv/bin/activate
pip install -r requirements.txt
```

### CORS Error
```
Access to fetch blocked by CORS policy
```
**Solution**: Ensure backend is running on port 8000
```bash
# Backend should show:
INFO: Uvicorn running on http://0.0.0.0:8000
```

### Frontend Build Error
```
Cannot find module 'papaparse'
```
**Solution**: Install frontend dependencies
```bash
cd frontend
npm install
```

---

## 📊 Dataset Format Guide

### CSV Structure
```csv
feature1,feature2,feature3,label
0.5,1.2,0.8,0
1.3,0.4,1.9,1
0.2,1.8,0.3,0
```

### Requirements
- **Header row**: Optional (will be skipped)
- **Features**: Numerical values (any dimension)
- **Label**: Last column, values 0 or 1
- **Format**: Comma-separated values (.csv)

### Example Datasets
- **XOR Pattern**: 2 features, non-linear separation
- **Iris Binary**: 4 features, classes 0/1
- **MNIST Binary**: 784 features (28×28 pixels), digits 0/1

---

## 🎨 UI/UX Features

### AI Chatbot
- 🎭 Light/dark mode support
- 🎯 Drag anywhere on screen
- ↕️ Minimize/maximize toggle
- 📋 Copy responses
- 🗑️ Clear conversation
- 🔄 Real-time streaming (placeholder)

### QML Panel
- 📑 Tabbed interface for workflow
- 📊 Live training charts
- 🎯 Responsive design
- 🌈 Color-coded metrics
- 📱 Mobile-friendly (responsive grid)

---

## 🔐 Security Notes

⚠️ **Important**:
- Never commit `.env` file to version control
- Keep your Gemini API key private
- Use environment variables in production
- Rotate API keys regularly

---

## 📚 Additional Resources

### Documentation
- [Qiskit Documentation](https://qiskit.org/documentation/)
- [Qiskit Machine Learning](https://qiskit.org/ecosystem/machine-learning/)
- [Gemini API Docs](https://ai.google.dev/docs)
- [Recharts Documentation](https://recharts.org/)

### Tutorials
- [Quantum Machine Learning Guide](https://qiskit.org/textbook/ch-machine-learning/)
- [Variational Quantum Algorithms](https://qiskit.org/textbook/ch-applications/vqe-molecules.html)

### Community
- [Qiskit Slack](https://qiskit.slack.com)
- [Quantum Computing Stack Exchange](https://quantumcomputing.stackexchange.com)

---

## 🚀 Next Steps

1. ✅ Install dependencies (backend + frontend)
2. ✅ Configure Gemini API key
3. ✅ Start both servers
4. 🎯 Try the AI chatbot
5. 🧠 Train your first QNN
6. 📊 Upload custom datasets
7. 🏗️ Explore QML templates

---

## 📝 Quick Command Reference

```bash
# Backend
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload

# Frontend
cd frontend
npm run dev

# Check backend health
curl http://localhost:8000/health

# View API docs
open http://localhost:8000/docs
```

---

## 🎉 Success Checklist

- [ ] Backend running on port 8000
- [ ] Frontend running on port 5173
- [ ] Gemini API key configured
- [ ] Chat icon visible in header
- [ ] QML button visible in header
- [ ] Can generate circuits with AI
- [ ] Can train QNN on sample data
- [ ] Training charts display correctly
- [ ] Evaluation metrics appear

---

**Happy Quantum Computing! 🚀⚛️**

For issues or questions, check the [GitHub Issues](https://github.com/yourusername/QuantumFlow/issues) page.
