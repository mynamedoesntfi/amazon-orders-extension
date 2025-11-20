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
  const activeCartRoot =
    document.querySelector('[data-name="Active Items"]') ?? document;

  const itemNodes = activeCartRoot.querySelectorAll(
    '[data-asin].sc-list-item, .sc-list-item'
  );

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
      return;
    }

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

  return items;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "SCRAPE_CART") {
    try {
      const items = scrapeCart();
      sendResponse({ items });
    } catch (error) {
      sendResponse({ error: (error as Error).message ?? "Unknown error" });
    }
  }
  return true;
});
