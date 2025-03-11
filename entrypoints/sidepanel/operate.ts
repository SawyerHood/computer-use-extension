import {
  KeyInput,
  MouseButton,
  Page,
} from "puppeteer-core/lib/esm/puppeteer/puppeteer-core-browser.js";
import { OpenAI } from "openai";
import {
  ResponseInput,
  ResponseComputerToolCall,
  ResponseInputItem,
} from "openai/resources/responses/responses.mjs";
import { createPuppeteer } from "./puppeteer";

export const operate = async ({
  initialMessages,
  onMessageChange,
  apiKey,
}: {
  initialMessages: ResponseInput;
  onMessageChange: (message: ResponseInput) => void;
  apiKey: string;
}) => {
  try {
    const openai = new OpenAI({
      dangerouslyAllowBrowser: true,
      apiKey: apiKey,
    });

    const { page, close } = await createPuppeteer();

    await interactWithAIAssistant({
      page,
      initialMessages,
      onMessageChange,
      openai,
    });

    await close();
  } catch (error) {
    console.error("Error in browser session:", error);
  }
};

interface ComputerUseSessionParams {
  page: Page;
  initialMessages: ResponseInput;
  onMessageChange: (message: ResponseInput) => void;
  openai: OpenAI;
}

async function interactWithAIAssistant({
  page,
  initialMessages,
  onMessageChange,
  openai,
}: ComputerUseSessionParams) {
  let input: ResponseInput = [...initialMessages];

  if (
    input.length === 1 &&
    typeof input[0] === "object" &&
    "role" in input[0] &&
    "content" in input[0] &&
    input[0].role === "user" &&
    Array.isArray(input[0].content)
  ) {
    const screenshot = await page.screenshot({ encoding: "base64" });
    input[0].content.push({
      type: "input_image",
      image_url: `data:image/png;base64,${screenshot}`,
      detail: "high",
    });
    input = [...input];
    onMessageChange(input);
  }

  while (true) {
    const viewport = await page.evaluate(() => {
      return {
        width: window.innerWidth,
        height: window.innerHeight,
      };
    });

    const response = await openai.responses.create({
      model: "computer-use-preview",
      tools: [
        {
          type: "computer-preview",
          display_width: viewport!.width,
          display_height: viewport!.height,
          environment: "browser", // other possible values: "mac", "windows", "ubuntu"
        },
      ],
      input,
      truncation: "auto",
    });

    input.push(...response.output);
    input = [...input];
    onMessageChange(input);

    const computerCall = response.output.find(
      (output) => output.type === "computer_call"
    );

    if (!computerCall) {
      console.log("No computer call found");
      break;
    }

    const computerCallOutput = await executeAIAction(page, computerCall);

    input.push(computerCallOutput);
    input = [...input];
    onMessageChange(input);
  }
}

async function executeAIAction(
  page: Page,
  computerCall: ResponseComputerToolCall
): Promise<ResponseInputItem.ComputerCallOutput> {
  const action = computerCall.action;

  switch (action.type) {
    case "click":
      console.log(
        `Clicking at (${action.x}, ${action.y}) with ${action.button} button`
      );
      await page.mouse.click(action.x, action.y, {
        button: action.button as MouseButton,
      });
      break;

    case "double_click":
      console.log(`Double clicking at (${action.x}, ${action.y})`);
      await page.mouse.click(action.x, action.y, { clickCount: 2 });
      break;

    case "drag":
      console.log(
        `Dragging from (${action.path[0].x}, ${action.path[0].y}) to (${
          action.path[action.path.length - 1].x
        }, ${action.path[action.path.length - 1].y})`
      );
      await page.mouse.move(action.path[0].x, action.path[0].y);
      await page.mouse.down();

      for (const point of action.path.slice(1)) {
        await page.mouse.move(point.x, point.y);
      }

      await page.mouse.up();
      break;

    case "keypress":
      console.log(`Pressing keys: ${action.keys.join(", ")}`);
      for (const key of action.keys) {
        await page.keyboard.press(
          (key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()) as KeyInput
        );
      }
      break;

    case "move":
      console.log(`Moving mouse to (${action.x}, ${action.y})`);
      await page.mouse.move(action.x, action.y);
      break;

    case "screenshot":
      console.log("Taking screenshot");
      const screenshot = await page.screenshot();
      // Handle screenshot - you could save it to a file or process it
      console.log("Screenshot taken");
      break;

    case "scroll":
      console.log(
        `Scrolling by (${action.scroll_x}, ${action.scroll_y}) at position (${action.x}, ${action.y})`
      );
      await page.mouse.move(action.x, action.y);
      await page.mouse.wheel({
        deltaX: action.scroll_x,
        deltaY: action.scroll_y,
      });
      break;

    case "type":
      console.log(`Typing text: ${action.text}`);
      await page.keyboard.type(action.text);
      break;

    case "wait":
      console.log("Waiting for page to load/process");
      await page.waitForNetworkIdle();
      break;

    default:
      console.log(`Unhandled action type`);
      break;
  }

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const screenshot = await page.screenshot({ encoding: "base64" });

  return {
    call_id: computerCall.call_id,
    type: "computer_call_output",
    output: {
      type: "computer_screenshot",
      image_url: `data:image/png;base64,${screenshot}`,
    },
  };
}
