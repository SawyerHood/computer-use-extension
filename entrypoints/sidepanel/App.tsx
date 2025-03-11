import { useState, useEffect, useRef } from "react";
import "./App.css";
import { ResponseInput } from "openai/resources/responses/responses.mjs";
import { operate } from "./operate";
import { getApiKey, hasApiKey } from "./apiKeyStorage";
import { SettingsModal } from "./components/SettingsModal";
import { Settings, Loader } from "lucide-react";

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
        <button
          onClick={toggleApiKeyForm}
          className="bg-gray-700 hover:bg-gray-600 p-2 rounded-full text-white"
          title="API Key Settings"
        >
          <Settings size={20} />
        </button>
        {isLoading && (
          <div className="text-blue-400 flex items-center">
            <Loader size={18} className="animate-spin mr-2" />
            <span className="text-sm">Processing...</span>
          </div>
        )}
      </header>

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((rawMessage, index) => {
          // Handle user messages
          if ("role" in rawMessage && rawMessage.role === "user") {
            const text = Array.isArray(rawMessage.content)
              ? rawMessage.content
                  .filter((c) => c.type === "input_text")
                  .map((c) => c.text)
                  .join("\n")
              : rawMessage.content;

            return (
              <div key={index} className="flex justify-end">
                <div className="max-w-[75%] rounded-lg p-3 bg-blue-600 text-white rounded-br-none">
                  {text}
                </div>
              </div>
            );
          }

          // Handle reasoning messages (AI responses)
          if (rawMessage.type === "reasoning") {
            const text = (rawMessage as any).summary
              .map((c: any) => c.text)
              .join("");

            if (text.length === 0) {
              return null;
            }

            return (
              <div key={index} className="flex justify-start">
                <div className="max-w-[75%] rounded-lg p-3 bg-gray-700 text-gray-100 rounded-bl-none">
                  {text}
                </div>
              </div>
            );
          }

          // Handle computer calls
          if (rawMessage.type === "computer_call") {
            const callData = rawMessage as any;
            const action = callData.action;

            let actionDescription = "Unknown action";

            switch (action.type) {
              case "click":
                actionDescription = `Click at (${action.x}, ${action.y}) with ${action.button} button`;
                break;
              case "double_click":
                actionDescription = `Double click at (${action.x}, ${action.y})`;
                break;
              case "drag":
                actionDescription = `Drag from (${action.path[0].x}, ${
                  action.path[0].y
                }) to (${action.path[action.path.length - 1].x}, ${
                  action.path[action.path.length - 1].y
                })`;
                break;
              case "keypress":
                actionDescription = `Press keys: ${action.keys.join(", ")}`;
                break;
              case "move":
                actionDescription = `Move mouse to (${action.x}, ${action.y})`;
                break;
              case "scroll":
                actionDescription = `Scroll by (${action.scroll_x}, ${action.scroll_y}) at position (${action.x}, ${action.y})`;
                break;
              case "type":
                actionDescription = `Type text: ${action.text}`;
                break;
              case "wait":
                actionDescription = "Wait for page to load";
                break;
            }

            return (
              <div key={index} className="flex justify-start">
                <div className="max-w-[75%] rounded-lg p-3 bg-purple-700 text-white rounded-bl-none">
                  <div className="font-semibold mb-1">Computer Action:</div>
                  {actionDescription}
                </div>
              </div>
            );
          }

          // Handle computer call outputs (screenshots)
          if (rawMessage.type === "computer_call_output") {
            const outputData = rawMessage as any;
            if (
              outputData.output?.type === "computer_screenshot" &&
              outputData.output?.image_url
            ) {
              return (
                <div key={index} className="flex justify-start">
                  <div className="max-w-[90%] rounded-lg p-3 bg-gray-800 text-white">
                    <div className="font-semibold mb-2">Screenshot Result:</div>
                    <img
                      src={outputData.output.image_url}
                      alt="Screenshot result"
                      className="w-full rounded border border-gray-600"
                    />
                  </div>
                </div>
              );
            }
          }

          return null;
        })}

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
