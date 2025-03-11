import { useState } from "react";
import "./App.css";

function App() {
  const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>(
    [{ text: "Hello! How can I help you today?", isUser: false }]
  );
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim() === "") return;

    // Add user message
    const updatedMessages = [...messages, { text: input, isUser: true }];
    setMessages(updatedMessages);
    setInput("");

    // Simulate bot response after a short delay
    setTimeout(() => {
      let botResponse = "I'm a chat assistant. How can I help you further?";

      // Simple response patterns
      if (
        input.toLowerCase().includes("hello") ||
        input.toLowerCase().includes("hi")
      ) {
        botResponse = "Hello there! How are you doing today?";
      } else if (input.toLowerCase().includes("thank")) {
        botResponse = "You're welcome! Anything else you'd like to discuss?";
      } else if (input.toLowerCase().includes("how are you")) {
        botResponse =
          "I'm just a bot, but I'm functioning well! How can I assist you?";
      }

      setMessages((prev) => [...prev, { text: botResponse, isUser: false }]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white w-screen">
      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.isUser ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[75%] rounded-lg p-3 ${
                message.isUser
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-gray-700 text-gray-100 rounded-bl-none"
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input area */}
      <div className="border-t border-gray-700 p-4 bg-gray-800">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type a message..."
          />
          <button
            onClick={handleSend}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
