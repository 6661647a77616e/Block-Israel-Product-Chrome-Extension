async function main() {
  const boycottedBrands = await fetchBoycottList();
  if (!boycottedBrands.length) return;

  injectHideStyle();

  const processed = new WeakSet();

  const observer = new MutationObserver(() => {
    const count1 = filterItems(boycottedBrands, processed);
    const count2 = filterHomePageRecommendation(boycottedBrands);
    updateBoycottCount(count1 + count2);
  });

  const container = document.querySelector("ul.shopee-search-item-result__items");
  if (container) {
    observer.observe(container, { childList: true, subtree: true });
  }

  // Initial filter
  const count1 = filterItems(boycottedBrands, processed);
  const count2 = filterHomePageRecommendation(boycottedBrands);
  updateBoycottCount(count1 + count2);

  // Fallback: extra safety on scroll
  window.addEventListener(
    "scroll",
    debounce(() => {
      const c1 = filterItems(boycottedBrands, processed);
      const c2 = filterHomePageRecommendation(boycottedBrands);
      updateBoycottCount(c1 + c2);
    }, 300)
  );
}

async function fetchBoycottList() {
  try {
    const url = chrome.runtime.getURL("boycott_list.txt");
    const res = await fetch(url);
    const text = await res.text();

    return text
      .split("\n")
      .map(line => line.toLowerCase().trim())
      .filter(Boolean);
  } catch (e) {
    console.error("Failed to fetch boycott list:", e);
    return [];
  }
}

function filterItems(boycottedBrands, processed) {
  let count = 0;
  const regex = new RegExp(boycottedBrands.join("|"), "i");
  const items = document.querySelectorAll("ul .shopee-search-item-result__item");

  items.forEach(li => {
    if (processed.has(li)) return;

    const itemEl = li.querySelector(".line-clamp-2");
    if (!itemEl) return;

    const name = itemEl.textContent.toLowerCase();
    if (regex.test(name)) {
      li.classList.add("boycott-hidden");
      count++;
    }

    processed.add(li);
  });

  return count;
}

function filterHomePageRecommendation(boycottedBrands) {
  let count = 0;
  const itemDivs = Array.from(document.querySelectorAll(".oMSmr0"));
  itemDivs.forEach((itemDiv) => {
    const itemEl = itemDiv.querySelector("div .line-clamp-2");
    if (!itemEl) return;

    const itemName = itemEl.textContent.toLowerCase().trim();
    const matched = boycottedBrands.some((brand) => itemName.includes(brand));
    if (matched) {
      itemDiv.style.pointerEvents = "none";
      itemDiv.style.opacity = "0.05";
      count++;
    }
  });

  return count;
}

function injectHideStyle() {
  if (document.getElementById("boycott-style")) return;

  const style = document.createElement("style");
  style.id = "boycott-style";
  style.textContent = `
    .boycott-hidden {
      pointer-events: none !important;
      opacity: 0.05 !important;
      transition: opacity 0.3s ease;
    }
  `;
  document.head.appendChild(style);
}

function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

// ✅ Store and log boycott count persistently
function updateBoycottCount(newCount) {
  if (newCount === 0) return; // avoid updating when no new items found

  chrome.storage.local.get(["boycottCount"], (data) => {
    const current = data.boycottCount || 0;
    const updated = current + newCount;
    chrome.storage.local.set({ boycottCount: updated }, () => {
      console.log(`🛑 Total boycotted products so far: ${updated}`);
    });
  });
}

main();
