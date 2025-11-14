export type CartItem = {
  title: string;
  imageUrl: string;
  price: string;
  quantity: number;
  total: string;
  productUrl: string;
};

function getTextContent(element: Element | null): string {
  return element?.textContent?.trim() ?? "";
}

function getQuantity(itemElement: HTMLElement): number {
  // First try to get from data-quantity attribute on the item container
  const dataQuantity = itemElement.getAttribute("data-quantity");
  if (dataQuantity) {
    const parsed = parseInt(dataQuantity.trim(), 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  // Try to get from the quantity stepper value span
  const stepperValue = itemElement.querySelector(
    '[data-steppervalue] span[data-a-selector="value"]'
  );
  if (stepperValue) {
    const parsed = parseInt(stepperValue.textContent?.trim() ?? "", 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  // Fallback to input/select elements
  const quantityInput = itemElement.querySelector(
    ".sc-update-quantity-input, select[name$='quantity'], input[name='quantityBox']"
  );
  if (quantityInput) {
    const value =
      (quantityInput instanceof HTMLInputElement && quantityInput.value) ||
      (quantityInput instanceof HTMLSelectElement && quantityInput.value) ||
      quantityInput.getAttribute("value") ||
      quantityInput.textContent ||
      "";
    const parsed = parseInt(value.trim(), 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return 1;
}

function getAbsoluteUrl(href: string): string {
  if (!href) return "";
  if (href.startsWith("http://") || href.startsWith("https://")) {
    return href;
  }
  // Handle relative URLs
  if (href.startsWith("/")) {
    return `https://www.amazon.com${href}`;
  }
  return href;
}

export function scrapeCart(): CartItem[] {
  console.log("[CART] Starting cart scrape...");
  
  const activeCartRoot =
    document.querySelector('[data-name="Active Items"]') ?? document;
  
  console.log("[CART] Active cart root found:", activeCartRoot !== document);

  const itemNodes = activeCartRoot.querySelectorAll(
    '[data-asin].sc-list-item, .sc-list-item'
  );

  console.log("[CART] Found", itemNodes.length, "item nodes");

  const items: CartItem[] = [];

  itemNodes.forEach((node) => {
    const itemElement = node instanceof HTMLElement ? node : null;
    if (!itemElement) {
      return;
    }

    // Extract title - prefer the full text from .a-truncate-full
    const titleElement =
      itemElement.querySelector(".sc-product-title .a-truncate-full") ||
      itemElement.querySelector(".sc-product-title") ||
      itemElement.querySelector("a.sc-product-link.sc-product-title");
    const title = getTextContent(titleElement);

    if (!title) {
      console.log("[CART] Skipping item - no title found");
      return;
    }
    
    console.log("[CART] Processing item:", title.substring(0, 50) + "...");

    // Extract product link and make it absolute
    const linkElement = itemElement.querySelector(
      "a.sc-product-link.sc-product-title, a.sc-product-link"
    ) as HTMLAnchorElement | null;
    const link = getAbsoluteUrl(linkElement?.href ?? "");

    // Extract image URL
    const imageElement = itemElement.querySelector(
      "img.sc-product-image"
    ) as HTMLImageElement | null;
    const imageUrl = imageElement?.src ?? "";

    // Extract price - get visible text, not offscreen
    const priceElement = itemElement.querySelector(
      ".sc-product-price span[aria-hidden='true'], .sc-product-price .a-offscreen, .sc-product-price"
    );
    let price = "";
    if (priceElement) {
      // Prefer aria-hidden text (visible), fallback to offscreen, then any text
      const visiblePrice = itemElement.querySelector(
        ".sc-product-price span[aria-hidden='true']"
      );
      price = getTextContent(visiblePrice || priceElement);
    }

    // Extract quantity using improved function
    const quantity = getQuantity(itemElement);

    // Total price is same as price per item for now (can be calculated if needed)
    const total = price;

    items.push({
      title,
      imageUrl,
      price,
      quantity,
      total,
      productUrl: link,
    });
  });

  console.log("[CART] Scraped", items.length, "items");
  return items;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("[CART] Received message:", message?.type);
  if (message?.type === "SCRAPE_CART") {
    try {
      const items = scrapeCart();
      console.log("[CART] Sending response with", items.length, "items");
      sendResponse({ items });
    } catch (error) {
      console.error("[CART] Error scraping cart:", error);
      sendResponse({ error: (error as Error).message ?? "Unknown error" });
    }
  }
  return true;
});

// Log immediately when script loads - multiple ways to ensure visibility
console.log("[CART] ========================================");
console.log("[CART] Content script loaded and ready");
console.log("[CART] Current URL:", window.location.href);
console.log("[CART] Document ready state:", document.readyState);
console.log("[CART] ========================================");

// Also add a visual indicator to the page
if (document.body) {
  const indicator = document.createElement("div");
  indicator.textContent = "[CART] Extension loaded";
  indicator.style.cssText = "position:fixed;top:0;right:0;background:red;color:white;padding:5px;z-index:99999;font-size:12px;";
  document.body.appendChild(indicator);
  setTimeout(() => indicator.remove(), 3000);
}
