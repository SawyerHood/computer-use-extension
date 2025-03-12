import {
  ExtensionTransport,
  connect,
} from "puppeteer-core/lib/esm/puppeteer/puppeteer-core-browser.js";

export async function createPuppeteer() {
  const window = await browser.windows.create({});
  // Create a new tab

  const newTab = window.tabs![0]!;

  await browser.tabs.update(newTab.id!, {
    url: "https://example.com",
  });

  await new Promise((resolve) => setTimeout(resolve, 200));

  // Connect puppeteer to the newly created tab
  const transport = await ExtensionTransport.connectTab(newTab.id!);

  const pupBrowser = await connect({
    transport,
    defaultViewport: null,
  });

  const [page] = await pupBrowser.pages();

  const close = async () => {
    try {
      await pupBrowser.disconnect();
    } catch {}
    try {
      await transport.close();
    } catch {}
    try {
      await browser.debugger.detach({ tabId: newTab.id! });
    } catch {}
    // Close the tab we created
    try {
      await browser.tabs.remove(newTab.id!);
    } catch {}
  };

  return { page, close };
}
