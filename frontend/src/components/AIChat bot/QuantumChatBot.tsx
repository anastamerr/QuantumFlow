import { useState } from "react";
import axios from "axios";

interface Message {
  sender: "user" | "bot";
  text: string;
}

export default function QuantumChatBot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input) return;

    const userMessage: Message = { sender: "user", text: input };
    setMessages([...messages, userMessage]);
    setInput("");

    try {
      const response = await axios.post<{ answer: string }>("http://localhost:8000/ask", { question: input });
      const botMessage: Message = { sender: "bot", text: response.data.answer };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Error: Could not get a response from the server." },
      ]);
    }
  };

  return (
    <div style={{ border: "1px solid #ccc", padding: 20, width: 400 }}>
      <div style={{ maxHeight: 300, overflowY: "scroll", marginBottom: 10 }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ textAlign: msg.sender === "user" ? "right" : "left" }}>
            <strong>{msg.sender}:</strong> {msg.text}
          </div>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && sendMessage()}
        placeholder="Ask a quantum question..."
        style={{ width: "80%" }}
      />
      <button onClick={sendMessage} style={{ width: "20%" }}>Send</button>
    </div>
  );
}