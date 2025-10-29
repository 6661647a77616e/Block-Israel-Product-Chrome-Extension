async function main() {
  const boycottedBrands = await fetchBoycottList();
  if (!boycottedBrands.length) return;

  injectHideStyle();

  const processed = new WeakSet();

  const observer = new MutationObserver(() => {
    filterItems(boycottedBrands, processed);
  });

  const container = document.querySelector("ul.shopee-search-item-result__items");
  if (container) {
    observer.observe(container, { childList: true, subtree: true });
  }

  // Initial filter
  filterItems(boycottedBrands, processed);

  // Fallback: extra safety on scroll
  window.addEventListener("scroll", debounce(() => {
    filterItems(boycottedBrands, processed);
  }, 300));
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
  const regex = new RegExp(boycottedBrands.join("|"), "i");
  const items = document.querySelectorAll("ul .shopee-search-item-result__item");

  items.forEach(li => {
    if (processed.has(li)) return;

    const itemEl = li.querySelector(".line-clamp-2");
    if (!itemEl) return;

    const name = itemEl.textContent.toLowerCase();
    if (regex.test(name)) {
      li.classList.add("boycott-hidden");
    }

    processed.add(li);
  });
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

main();
