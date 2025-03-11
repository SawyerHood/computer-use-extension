import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: "chrome",
  modules: ["@wxt-dev/module-react"],
  vite: () => {
    return {
      plugins: [tailwindcss() as any],
    };
  },
  manifest: {
    action: {},
  },
});
