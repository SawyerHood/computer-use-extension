import { useState, useEffect, useRef } from "react";
import "./App.css";
import { ResponseInput } from "openai/resources/responses/responses.mjs";
import { operate } from "./operate";
import { getApiKey, hasApiKey } from "./apiKeyStorage";
import { SettingsModal } from "./components/SettingsModal";
import { MessageItem } from "./components/MessageItem";
import { Settings, Loader, Trash2 } from "lucide-react";

function App() {
  const [messages, setMessages] = useState<ResponseInput>([]);
  const [input, setInput] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showApiKeyForm, setShowApiKeyForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if API key is already stored
  useEffect(() => {
    const checkApiKey = async () => {
      const hasKey = await hasApiKey();
      setIsApiKeySet(hasKey);
      if (hasKey) {
        const key = await getApiKey();
        setApiKey(key);
      } else {
        setShowApiKeyForm(true);
      }
    };

    checkApiKey();
  }, []);

  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [messages]);

  const handleSend = async () => {
    if (!isApiKeySet) {
      setShowApiKeyForm(true);
      return;
    }

    if (!input.trim() || isLoading) return;

    setIsLoading(true);

    const newMessages: ResponseInput = [
      ...messages,
      { role: "user", content: [{ type: "input_text", text: input }] },
    ];
    setMessages(newMessages);
    setInput("");

    try {
      await operate({
        initialMessages: newMessages,
        onMessageChange: setMessages,
        apiKey,
      });
    } catch (error) {
      console.error("Error in operate:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleApiKeyForm = () => {
    setShowApiKeyForm(!showApiKeyForm);
  };

  const resetChat = () => {
    setMessages([]);
  };

  console.log(messages);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white w-screen">
      {/* Settings Modal Component */}
      <SettingsModal
        apiKey={apiKey}
        setApiKey={setApiKey}
        showApiKeyForm={showApiKeyForm}
        setShowApiKeyForm={setShowApiKeyForm}
        isApiKeySet={isApiKeySet}
        setIsApiKeySet={setIsApiKeySet}
      />

      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 py-3 px-4 flex justify-between items-center">
        <div className="flex space-x-2">
          <button
            onClick={toggleApiKeyForm}
            className="bg-gray-700 hover:bg-gray-600 p-2 rounded-full text-white"
            title="API Key Settings"
          >
            <Settings size={20} />
          </button>
          <button
            onClick={resetChat}
            className="bg-gray-700 hover:bg-gray-600 p-2 rounded-full text-white"
            title="Reset Chat"
          >
            <Trash2 size={20} />
          </button>
        </div>
        {isLoading && (
          <div className="text-blue-400 flex items-center">
            <Loader size={18} className="animate-spin mr-2" />
            <span className="text-sm">Processing...</span>
          </div>
        )}
      </header>

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <MessageItem key={index} message={message} index={index} />
        ))}

        {/* Loading indicator at the bottom of messages */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-2 bg-gray-700 text-gray-100 rounded-lg p-3 rounded-bl-none">
              <div
                className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              ></div>
              <div
                className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              ></div>
              <div
                className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              ></div>
            </div>
          </div>
        )}

        {/* Empty div for scrolling to bottom */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-700 p-4 bg-gray-800">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            className={`flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isLoading ? "opacity-70" : ""
            }`}
            placeholder={
              isLoading ? "Waiting for response..." : "Type a message..."
            }
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className={`bg-blue-600 text-white px-4 py-2 rounded-lg transition ${
              isLoading || !input.trim()
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-blue-700"
            }`}
          >
            {isLoading ? (
              <div className="flex items-center">
                <Loader size={16} className="animate-spin mr-1" />
                <span>Wait</span>
              </div>
            ) : (
              "Send"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
