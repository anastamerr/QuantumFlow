
import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

load_dotenv()

app = FastAPI(title="Quantum AI Chatbot", version="1.0.0")

# CORS - update with your frontend URL
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite
        "http://localhost:3000",  # React default
        "http://localhost:5174",  # Alternative Vite port
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response models
class Question(BaseModel):
    question: str

class Answer(BaseModel):
    answer: str

# Initialize Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# System prompt for quantum computing expert
system_prompt = """You are an expert quantum computing assistant with deep knowledge of:
- Quantum mechanics fundamentals (superposition, entanglement, measurement)
- Quantum gates (Hadamard, CNOT, Pauli gates, rotation gates)
- Quantum algorithms (Shor's, Grover's, VQE, QAOA)
- Qiskit programming and circuit design
- Quantum error correction and noise
- Current quantum hardware and limitations

Provide clear, accurate, and educational explanations. Use analogies when helpful.
Keep responses concise but comprehensive. Use mathematical notation when appropriate.
If asked about code, provide Qiskit examples."""

# Initialize the Gemini model
model = genai.GenerativeModel(
    model_name="gemini-pro",
    system_instruction=system_prompt
)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Quantum AI Chatbot",
        "gemini_configured": bool(GEMINI_API_KEY)
    }

@app.post("/ask", response_model=Answer)
async def ask_question(data: Question):
    """
    Main chatbot endpoint - answers quantum computing questions
    """
    try:
        if not data.question.strip():
            raise HTTPException(status_code=400, detail="Question cannot be empty")
        
        # Check if Gemini API key is configured
        if not GEMINI_API_KEY:
            raise HTTPException(
                status_code=500, 
                detail="Gemini API key not configured. Please set GEMINI_API_KEY environment variable."
            )
        
        # Get AI response from Gemini
        response = model.generate_content(data.question)
        answer = response.text
        
        return Answer(answer=answer)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing question: {str(e)}")

@app.post("/ask/with-simulation")
async def ask_with_simulation(data: Question):
    """
    Enhanced endpoint that can run Qiskit simulations if needed
    This is a placeholder for future integration with your qiskit_runner.py
    """
    try:
        if not GEMINI_API_KEY:
            raise HTTPException(
                status_code=500,
                detail="Gemini API key not configured."
            )
        
        question_lower = data.question.lower()
        
        # Check if question involves circuit simulation
        simulation_keywords = ["simulate", "circuit", "run", "execute", "bell state", "ghz"]
        needs_simulation = any(keyword in question_lower for keyword in simulation_keywords)
        
        if needs_simulation:
            # TODO: Parse user intent and create appropriate circuit
            # For now, provide guidance
            enhanced_question = f"""{data.question}

Note: For actual circuit simulation, please use the /api/v1/execute endpoint with your circuit definition.
Provide an explanation of how to approach this quantum circuit simulation."""
            
            response = model.generate_content(enhanced_question)
            answer = response.text
        else:
            response = model.generate_content(data.question)
            answer = response.text
        
        return Answer(answer=answer)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing question: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    
    # Check for API key on startup
    if not GEMINI_API_KEY:
        print("  WARNING: GEMINI_API_KEY not found in environment variables")
        print("Please create a .env file with: GEMINI_API_KEY=your_key_here")
        print("Get your API key at: https://aistudio.google.com/app/apikey")
    
    PORT = int(os.getenv("PORT", "8000"))
    HOST = os.getenv("HOST", "0.0.0.0")
    
    print(f" Starting Quantum AI Chatbot on {HOST}:{PORT}")
    uvicorn.run(app, host=HOST, port=PORT)
