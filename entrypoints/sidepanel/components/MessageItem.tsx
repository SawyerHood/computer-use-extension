import React from "react";
import { ResponseInput } from "openai/resources/responses/responses.mjs";

// A ResponseInput item can be one of several types
type ResponseInputItem = ResponseInput[number];

// Define more specific interfaces for working with response content
interface MessageWithContent {
  content: any[];
  role?: string;
  type?: string;
}

interface ReasoningMessage {
  type: "reasoning";
  summary: Array<{ text: string }>;
}

interface ComputerCallMessage {
  type: "computer_call";
  action: {
    type: string;
    x?: number;
    y?: number;
    button?: string;
    path?: Array<{ x: number; y: number }>;
    keys?: string[];
    scroll_x?: number;
    scroll_y?: number;
    text?: string;
  };
}

interface ComputerCallOutputMessage {
  type: "computer_call_output";
  output?: {
    type: "computer_screenshot";
    image_url: string;
  };
}

type MessageItemProps = {
  message: ResponseInputItem;
  index: number;
};

export const MessageItem: React.FC<MessageItemProps> = ({ message, index }) => {
  // Handle user messages
  if ("role" in message && message.role === "user") {
    // User messages have content that may be an array
    const content = message.content;
    let text: string;

    if (Array.isArray(content)) {
      // Extract text from input_text content items
      text = content
        .filter((item) => item.type === "input_text")
        .map((item) => item.text as string)
        .join("\n");
    } else {
      // Handle string content
      text = content as string;
    }

    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] rounded-lg p-3 bg-blue-600 text-white rounded-br-none">
          {text}
        </div>
      </div>
    );
  }

  // Handle reasoning messages (AI responses)
  if ("type" in message && message.type === "reasoning") {
    const reasoningMessage = message as unknown as ReasoningMessage;
    if (!reasoningMessage.summary) return null;

    const text = reasoningMessage.summary.map((item) => item.text).join("");

    if (text.length === 0) {
      return null;
    }

    return (
      <div className="flex justify-start">
        <div className="max-w-[75%] rounded-lg p-3 bg-gray-700 text-gray-100 rounded-bl-none">
          {text}
        </div>
      </div>
    );
  }

  // Handle AI message responses
  if ("type" in message && message.type === "message") {
    const msgContent = message.content;
    let text: string;

    if (Array.isArray(msgContent)) {
      // Extract text from output_text content items
      text = msgContent
        .filter((item) => item.type === "output_text")
        .map((item) => item.text as string)
        .join("\n");
    } else {
      // Handle string content
      text = msgContent as string;
    }

    return (
      <div className="flex justify-start">
        <div className="max-w-[75%] rounded-lg p-3 bg-gray-700 text-gray-100 rounded-bl-none">
          {text}
        </div>
      </div>
    );
  }

  // Handle computer calls
  if ("type" in message && message.type === "computer_call") {
    const callData = message as ComputerCallMessage;
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
        if (action.path && action.path.length > 0) {
          actionDescription = `Drag from (${action.path[0].x}, ${
            action.path[0].y
          }) to (${action.path[action.path.length - 1].x}, ${
            action.path[action.path.length - 1].y
          })`;
        }
        break;
      case "keypress":
        actionDescription = `Press keys: ${action.keys?.join(", ") || ""}`;
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
      <div className="flex justify-start">
        <div className="max-w-[75%] rounded-lg p-3 bg-purple-700 text-white rounded-bl-none">
          <div className="font-semibold mb-1">Computer Action:</div>
          {actionDescription}
        </div>
      </div>
    );
  }

  // Handle computer call outputs (screenshots)
  if ("type" in message && message.type === "computer_call_output") {
    const outputData = message as ComputerCallOutputMessage;
    if (
      outputData.output?.type === "computer_screenshot" &&
      outputData.output?.image_url
    ) {
      return (
        <div className="flex justify-start">
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
};
