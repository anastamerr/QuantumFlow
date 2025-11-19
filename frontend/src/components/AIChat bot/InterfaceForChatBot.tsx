import { useState, useRef, useEffect } from "react";
// Minimal inline icon fallbacks to avoid an external dependency during TS checks
const Send = (props: any) => <span {...props}>✉️</span>;
const Sparkles = (props: any) => <span {...props}>✨</span>;
const Bot = (props: any) => <span {...props}>🤖</span>;
const User = (props: any) => <span {...props}>👤</span>;
const Loader2 = (props: any) => <span {...props}>⏳</span>;

interface Message {
  sender: "user" | "bot";
  text: string;
  timestamp: Date;
}

export default function QuantumChatBot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { 
      sender: "user", 
      text: input,
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: input }),
      });
      
      const data = await response.json();
      const botText = data?.answer ?? "(no answer)";
      const botMessage: Message = { 
        sender: "bot", 
        text: botText,
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error(err);
      const botMessage: Message = { 
        sender: "bot", 
        text: "I'm having trouble connecting right now. Please try again.",
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, botMessage]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse top-10 left-10"></div>
        <div className="absolute w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse bottom-10 right-10 animation-delay-2000"></div>
        <div className="absolute w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse top-1/2 left-1/2 animation-delay-4000"></div>
      </div>

      {/* Main chat container */}
      <div className="relative w-full max-w-4xl h-[90vh] bg-gray-900/40 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/10 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 backdrop-blur-xl border-b border-white/10 p-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Quantum AI Assistant</h1>
              <p className="text-sm text-purple-200">Ask me anything about quantum computing</p>
            </div>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">Welcome to Quantum AI</h2>
                <p className="text-purple-200 max-w-md">Start a conversation and explore the fascinating world of quantum computing with AI assistance.</p>
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 animate-fade-in ${
                msg.sender === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {/* Avatar */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                msg.sender === "user" 
                  ? "bg-gradient-to-br from-blue-500 to-cyan-500" 
                  : "bg-gradient-to-br from-purple-500 to-pink-500"
              }`}>
                {msg.sender === "user" ? (
                  <User className="w-5 h-5 text-white" />
                ) : (
                  <Bot className="w-5 h-5 text-white" />
                )}
              </div>

              {/* Message bubble */}
              <div className={`flex flex-col max-w-[70%] ${
                msg.sender === "user" ? "items-end" : "items-start"
              }`}>
                <div className={`px-4 py-3 rounded-2xl ${
                  msg.sender === "user"
                    ? "bg-gradient-to-br from-blue-600 to-cyan-600 text-white rounded-tr-sm"
                    : "bg-gray-800/60 backdrop-blur-xl text-white border border-white/10 rounded-tl-sm"
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
                <span className="text-xs text-purple-300 mt-1 px-2">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 animate-fade-in">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-gray-800/60 backdrop-blur-xl border border-white/10">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="bg-gray-900/60 backdrop-blur-xl border-t border-white/10 p-6">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask about quantum entanglement, superposition..."
                disabled={loading}
                className="w-full px-5 py-4 bg-gray-800/60 border border-white/10 rounded-2xl text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:opacity-50"
              />
              {input.length > 0 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-purple-300">
                  {input.length} chars
                </div>
              )}
            </div>
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-2xl font-semibold transition-all transform hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-purple-500/30"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-purple-300/50 mt-3 text-center">
            Press Enter to send • Shift + Enter for new line
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        /* Custom scrollbar */
        .overflow-y-auto::-webkit-scrollbar {
          width: 8px;
        }

        .overflow-y-auto::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #a855f7, #ec4899);
          border-radius: 10px;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #9333ea, #db2777);
        }
      `}</style>
    </div>
  );
}