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
      await pupBrowser.disconnect();
    } catch {}
    try {
      await transport.close();
    } catch {}
    await browser.debugger.detach({ tabId: tab!.id! });
  };

  return { page, close };
}
