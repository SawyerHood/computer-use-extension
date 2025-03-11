export default defineBackground(() => {
  browser.action.onClicked.addListener(async (tab) => {
    await browser.sidePanel.open({
      tabId: tab.id!,
    });
  });
});
