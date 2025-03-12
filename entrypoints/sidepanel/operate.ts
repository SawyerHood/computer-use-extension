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
  const { page, close } = await createPuppeteer();

  await new Promise((resolve) => setTimeout(resolve, 1000));
  try {
    const openai = new OpenAI({
      dangerouslyAllowBrowser: true,
      apiKey: apiKey,
    });

    await interactWithAIAssistant({
      page,
      initialMessages,
      onMessageChange,
      openai,
    });
  } catch (error) {
    console.error("Error in browser session:", error);
  } finally {
    await close();
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

  // Initialize cursor
  await injectCursor(page);

  const screenshot = await page.screenshot({ encoding: "base64" });
  const screenshotUrl = `data:image/png;base64,${screenshot}`;

  // Get the size of the screenshot url
  let screenshotSize = await getScreenshotSize(screenshotUrl);

  let devicePixelRatio = window.devicePixelRatio;

  if (
    input.length === 1 &&
    typeof input[0] === "object" &&
    "role" in input[0] &&
    "content" in input[0] &&
    input[0].role === "user" &&
    Array.isArray(input[0].content)
  ) {
    input[0].content.push({
      type: "input_image",
      image_url: screenshotUrl,
      detail: "high",
    });
    input = [...input];
    onMessageChange(input);
  }

  while (true) {
    const response = await openai.responses.create({
      model: "computer-use-preview",
      tools: [
        {
          type: "computer-preview",
          display_width: screenshotSize.width,
          display_height: screenshotSize.height,
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

    const computerCallOutput = await executeAIAction(
      page,
      computerCall,
      devicePixelRatio
    );

    devicePixelRatio = computerCallOutput.devicePixelRatio;
    screenshotSize = computerCallOutput.screenshotSize;

    input.push(computerCallOutput.output);
    input = [...input];
    onMessageChange(input);
  }
}

/**
 * Injects a custom cursor element into the page if it doesn't already exist
 */
async function injectCursor(page: Page): Promise<void> {
  const cursorExists = await page.evaluate(() => {
    return !!document.getElementById("ai-custom-cursor");
  });

  if (!cursorExists) {
    await page.evaluate(() => {
      const cursor = document.createElement("div");
      cursor.id = "ai-custom-cursor";
      cursor.style.position = "fixed";
      cursor.style.width = "24px";
      cursor.style.height = "24px";
      cursor.style.border = "4px solid rgba(220, 53, 69, 0.75)";
      cursor.style.borderRadius = "50%";
      cursor.style.pointerEvents = "none";
      cursor.style.zIndex = "9999";
      cursor.style.transition = "transform 0.2s ease-out";
      cursor.style.transform = "translate(0px, 0px)";
      cursor.style.boxShadow = "0 0 5px rgba(220, 53, 69, 0.3)";
      cursor.style.opacity = "0.9";

      // Add a dot in the center
      const dot = document.createElement("div");
      dot.style.position = "absolute";
      dot.style.width = "5px";
      dot.style.height = "5px";
      dot.style.backgroundColor = "rgba(220, 53, 69, 0.85)";
      dot.style.borderRadius = "50%";
      dot.style.top = "50%";
      dot.style.left = "50%";
      dot.style.transform = "translate(-50%, -50%)";

      cursor.appendChild(dot);
      document.body.appendChild(cursor);

      // Initial position off-screen
      cursor.style.top = "0px";
      cursor.style.left = "0px";
    });
  }
}

/**
 * Animates the cursor to a specific position on the page
 */
async function animateCursorToPosition(
  page: Page,
  x: number,
  y: number,
  duration: number = 500
): Promise<void> {
  await page.evaluate(
    ({ x, y, duration }) => {
      return new Promise<void>((resolve) => {
        const cursor = document.getElementById("ai-custom-cursor");
        if (!cursor) return resolve();

        // Show the cursor if it was hidden
        cursor.style.display = "block";

        // Update position with animation
        cursor.style.transition = `transform ${duration}ms cubic-bezier(0.2, 0.9, 0.3, 1)`;
        cursor.style.transform = `translate(${x}px, ${y}px)`;

        // Resolve when animation completes
        setTimeout(resolve, duration);
      });
    },
    { x, y, duration }
  );
}

function adjustActionForDevicePixelRatio(
  action: ResponseComputerToolCall["action"],
  devicePixelRatio: number
): ResponseComputerToolCall["action"] {
  switch (action.type) {
    case "click":
      return {
        ...action,
        x: action.x / devicePixelRatio,
        y: action.y / devicePixelRatio,
      };
    case "double_click":
      return {
        ...action,
        x: action.x / devicePixelRatio,
        y: action.y / devicePixelRatio,
      };
    case "drag":
      return {
        ...action,
        path: action.path.map((point) => ({
          ...point,
          x: point.x / devicePixelRatio,
          y: point.y / devicePixelRatio,
        })),
      };
    case "keypress":
      return {
        ...action,
        keys: action.keys.map((key) => key.toLowerCase()),
      };
    case "move":
      return {
        ...action,
        x: action.x / devicePixelRatio,
        y: action.y / devicePixelRatio,
      };

    case "screenshot":
      return action;

    case "scroll":
      return {
        ...action,
        scroll_x: action.scroll_x / devicePixelRatio,
        scroll_y: action.scroll_y / devicePixelRatio,
        x: action.x / devicePixelRatio,
        y: action.y / devicePixelRatio,
      };

    case "type":
      return action;

    case "wait":
      return action;

    default:
      return action;
  }
}

async function executeAIAction(
  page: Page,
  computerCall: ResponseComputerToolCall,
  devicePixelRatio: number
): Promise<{
  output: ResponseInputItem.ComputerCallOutput;
  screenshotSize: {
    width: number;
    height: number;
  };
  devicePixelRatio: number;
}> {
  const action = adjustActionForDevicePixelRatio(
    computerCall.action,
    devicePixelRatio
  );

  switch (action.type) {
    case "click":
      console.log(
        `Clicking at (${action.x}, ${action.y}) with ${action.button} button`
      );
      // First animate the cursor to the position
      await animateCursorToPosition(page, action.x, action.y);
      // Then perform the actual click
      await page.mouse.click(action.x, action.y, {
        button: action.button as MouseButton,
      });
      break;

    case "double_click":
      console.log(`Double clicking at (${action.x}, ${action.y})`);
      await animateCursorToPosition(page, action.x, action.y);
      await page.mouse.click(action.x, action.y, { clickCount: 2 });
      break;

    case "drag":
      console.log(
        `Dragging from (${action.path[0].x}, ${action.path[0].y}) to (${
          action.path[action.path.length - 1].x
        }, ${action.path[action.path.length - 1].y})`
      );
      // Animate cursor to start position
      await animateCursorToPosition(page, action.path[0].x, action.path[0].y);
      await page.mouse.move(action.path[0].x, action.path[0].y);
      await page.mouse.down();

      // Animate along the path
      for (const point of action.path.slice(1)) {
        await animateCursorToPosition(page, point.x, point.y, 200); // Faster animation for drag points
        await page.mouse.move(point.x, point.y);
      }

      await page.mouse.up();
      break;

    case "keypress":
      console.log(`Pressing keys: ${action.keys.join(", ")}`);

      const keys = action.keys.map((key) => {
        if (key === "CMD") {
          return "Meta";
        }
        if (key === "CTRL") {
          return "Control";
        }
        return key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
      });

      for (const key of keys) {
        await page.keyboard.down(key as KeyInput);
      }

      for (const key of keys) {
        await page.keyboard.up(key as KeyInput);
      }

      break;

    case "move":
      console.log(`Moving mouse to (${action.x}, ${action.y})`);
      await animateCursorToPosition(page, action.x, action.y);

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
      await animateCursorToPosition(page, action.x, action.y);
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
      await new Promise((resolve) => setTimeout(resolve, 3000));
      break;

    default:
      console.log(`Unhandled action type`);
      break;
  }

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const screenshot = await page.screenshot({ encoding: "base64" });

  const screenshotUrl = `data:image/png;base64,${screenshot}`;

  const screenshotSize = await getScreenshotSize(screenshotUrl);

  return {
    output: {
      call_id: computerCall.call_id,
      type: "computer_call_output",
      output: {
        type: "computer_screenshot",
        image_url: `data:image/png;base64,${screenshot}`,
      },
    },
    screenshotSize,
    devicePixelRatio: window.devicePixelRatio,
  };
}

async function getScreenshotSize(url: string): Promise<{
  width: number;
  height: number;
}> {
  const img = new Image();
  img.src = url;

  return new Promise((resolve) => {
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
  });
}
