import {
  ExtensionTransport,
  connect,
} from "puppeteer-core/lib/esm/puppeteer/puppeteer-core-browser.js";

export async function createPuppeteer() {
  // Create a new tab
  const newTab = await browser.tabs.create({
    url: "https://example.com", // Start with a blank page
    active: false,
  });

  // Create a tab group called "doobie" and add the tab to it
  const groupId = await browser.tabs.group({
    tabIds: [newTab.id!],
  });

  // Set the group's properties
  await browser.tabGroups.update(groupId, {
    title: "CUA",
    color: "purple", // You can choose a different color if preferred
  });

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
