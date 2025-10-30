document.addEventListener("DOMContentLoaded", () => {
  const countEl = document.getElementById("count");

  // Load the stored count on popup open
  chrome.storage.local.get("boycottCount", (data) => {
    countEl.textContent = data.boycottCount || 0;
  });

  // Listen for live updates from content script
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "UPDATE_BOYCOTT_COUNT") {
      countEl.textContent = msg.count;
    }
  });
});
