import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";
import { nodeResolve } from "@rollup/plugin-node-resolve";

// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: "chrome",
  modules: ["@wxt-dev/module-react"],
  vite: () => {
    return {
      external: ["chromium-bidi/lib/cjs/bidiMapper/BidiMapper.js"],
      plugins: [
        tailwindcss() as any,
        nodeResolve({
          // Indicate that we target a browser environment.
          browser: true,
          // Exclude any dependencies except for puppeteer-core.
          // `npm install puppeteer-core` # To install puppeteer-core if needed.
          resolveOnly: ["puppeteer-core"],
        }),
      ],
    };
  },
  manifest: {
    action: {},
    permissions: ["tabs", "activeTab", "debugger", "storage"],
  },
});
