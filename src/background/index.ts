chrome.runtime.onInstalled.addListener(() => {
  console.log("[CART] Extension scaffold installed.");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "PING_BACKGROUND") {
    sendResponse({ ok: true, timestamp: Date.now() });
  }
  return false;
});
