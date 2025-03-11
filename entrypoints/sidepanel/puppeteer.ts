import {
  ExtensionTransport,
  connect,
} from "puppeteer-core/lib/esm/puppeteer/puppeteer-core-browser.js";

export async function createPuppeteer() {
  const tabs = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });

  const tab = tabs[0]!;

  const transport = await ExtensionTransport.connectTab(tab!.id!);

  const pupBrowser = await connect({
    transport,
    defaultViewport: null,
  });

  const [page] = await pupBrowser.pages();

  const close = async () => {
    try {
      await page.close();
    } catch {}
    try {
      await pupBrowser.close();
    } catch {}
    try {
      await transport.close();
    } catch {}
  };

  return { page, close };
}
