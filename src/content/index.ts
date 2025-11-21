export type OrderItem = {
  title: string;
  imageUrl: string;
  price: string;
  quantity: number;
  productUrl: string;
};


export type OrderData = {
  orderNumber?: string;
  items: OrderItem[];
  date?: string;
  orderValue?: string;
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

/**
 * Extract order items from a container element (div.a-fixed-right-grid-col.a-col-left or item-box)
 */
function extractOrderItems(container: Element): OrderItem[] {
  const items: OrderItem[] = [];
  
  // First, try to find all item-box elements directly - these contain the actual product information
  const itemBoxes = container.querySelectorAll('.item-box');
  
  // If item-boxes found, process them directly
  if (itemBoxes.length > 0) {
    itemBoxes.forEach((itemBox, index) => {
      // Extract title from product title link - try multiple selectors
      let titleElement = itemBox.querySelector('.yohtmlc-product-title a') as HTMLAnchorElement | null;
      if (!titleElement) {
        titleElement = itemBox.querySelector('a[href*="/dp/"]') as HTMLAnchorElement | null;
      }
      if (!titleElement) {
        // Try finding any link with product title
        titleElement = itemBox.querySelector('a.a-link-normal[href*="/dp/"]') as HTMLAnchorElement | null;
      }
      if (!titleElement) {
        // Last resort: find any anchor in the item-box
        titleElement = itemBox.querySelector('a[href*="dp/"]') as HTMLAnchorElement | null;
      }
      
      const title = getTextContent(titleElement);
      
      if (!title) {
        return; // Skip items without titles
      }
      
      // Extract product URL
      const productUrl = titleElement ? getAbsoluteUrl(titleElement.href) : "";
      
      // Extract image URL - try multiple selectors
      const imageElement = itemBox.querySelector('img[src*="media-amazon"], .product-image img') as HTMLImageElement | null;
      let imageUrl = imageElement?.src || imageElement?.getAttribute('data-a-hires') || "";
      
      // Use higher resolution image if available
      if (imageElement?.getAttribute('data-a-hires')) {
        imageUrl = imageElement.getAttribute('data-a-hires') || imageUrl;
      }
      
      // Extract price - look for price information in various places
      // Prices might not be visible in order history, so we'll try to find them
      let price = "";
      const priceElement = itemBox.querySelector('.a-price, [class*="price"], .a-color-price');
      if (priceElement) {
        price = getTextContent(priceElement);
      }
      
      // Extract quantity - default to 1 if not found
      let quantity = 1;
      const quantityText = itemBox.textContent || "";
      const quantityMatch = quantityText.match(/Qty[:\s]*(\d+)/i) || quantityText.match(/Quantity[:\s]*(\d+)/i);
      if (quantityMatch) {
        const parsed = parseInt(quantityMatch[1], 10);
        if (Number.isFinite(parsed) && parsed > 0) {
          quantity = parsed;
        }
      }
      
      items.push({
        title,
        imageUrl,
        price,
        quantity,
        productUrl,
      });
    });
  } else {
    // Fallback: try finding items in list structure
    const listItems = container.querySelectorAll('li span.a-list-item, li .a-list-item');
    listItems.forEach((listItem, index) => {
      // Find the item-box within this list item
      const itemBox = listItem.querySelector('.item-box') || listItem.closest('.item-box');
      if (!itemBox) {
        return;
      }
      
      // Extract title from product title link - try multiple selectors
      let titleElement = itemBox.querySelector('.yohtmlc-product-title a') as HTMLAnchorElement | null;
      if (!titleElement) {
        titleElement = itemBox.querySelector('a[href*="/dp/"]') as HTMLAnchorElement | null;
      }
      if (!titleElement) {
        titleElement = itemBox.querySelector('a.a-link-normal[href*="/dp/"]') as HTMLAnchorElement | null;
      }
      if (!titleElement) {
        titleElement = itemBox.querySelector('a[href*="dp/"]') as HTMLAnchorElement | null;
      }
      
      const title = getTextContent(titleElement);
      
      if (!title) {
        return; // Skip items without titles
      }
      
      // Extract product URL
      const productUrl = titleElement ? getAbsoluteUrl(titleElement.href) : "";
      
      // Extract image URL
      const imageElement = itemBox.querySelector('img[src*="media-amazon"], .product-image img') as HTMLImageElement | null;
      let imageUrl = imageElement?.src || imageElement?.getAttribute('data-a-hires') || "";
      
      if (imageElement?.getAttribute('data-a-hires')) {
        imageUrl = imageElement.getAttribute('data-a-hires') || imageUrl;
      }
      
      // Extract price
      let price = "";
      const priceElement = itemBox.querySelector('.a-price, [class*="price"], .a-color-price');
      if (priceElement) {
        price = getTextContent(priceElement);
      }
      
      // Extract quantity
      let quantity = 1;
      const quantityText = itemBox.textContent || "";
      const quantityMatch = quantityText.match(/Qty[:\s]*(\d+)/i) || quantityText.match(/Quantity[:\s]*(\d+)/i);
      if (quantityMatch) {
        const parsed = parseInt(quantityMatch[1], 10);
        if (Number.isFinite(parsed) && parsed > 0) {
          quantity = parsed;
        }
      }
      
      items.push({
        title,
        imageUrl,
        price,
        quantity,
        productUrl,
      });
    });
  }
  
  return items;
}

/**
 * Extract order data from an order card element (div.order-card.js-order-card)
 */
function extractOrderData(orderCard: Element): OrderData {
  // Extract order ID from order header
  let orderNumber = "";
  const orderNumberContainer = orderCard.querySelector('.yohtmlc-order-id');
  if (orderNumberContainer) {
    const orderNumberSpan = orderNumberContainer.querySelector('span[dir="ltr"]');
    if (orderNumberSpan) {
      orderNumber = getTextContent(orderNumberSpan).trim();
    }
  }
  
  // Extract order date
  let orderDate = "";
  const dateContainer = Array.from(orderCard.querySelectorAll('.order-header__header-list-item')).find(item => {
    return item.textContent?.includes('Order placed');
  });
  if (dateContainer) {
    const dateSpan = dateContainer.querySelector('.a-size-base');
    orderDate = getTextContent(dateSpan);
  }
  
  // Extract order value (previously called "total")
  let orderTotal = "";
  const totalContainer = Array.from(orderCard.querySelectorAll('.order-header__header-list-item')).find(item => {
    const text = item.textContent || "";
    return text.includes('Total') || text.includes('total');
  });
  if (totalContainer) {
    // Try multiple selectors to find the total value
    const totalSpan = totalContainer.querySelector('.a-size-base') || 
                      totalContainer.querySelector('span.a-size-base') ||
                      totalContainer.querySelector('.aok-break-word');
    orderTotal = getTextContent(totalSpan);
    
    // If still empty, try to extract from the second div/row
    if (!orderTotal) {
      const rows = totalContainer.querySelectorAll('.a-row');
      if (rows.length >= 2) {
        const valueRow = rows[1];
        orderTotal = getTextContent(valueRow);
      }
    }
  }
  
  // Extract order items
  const items: OrderItem[] = [];
  
  // Find all shipment boxes or delivery boxes
  const shipmentBoxes = orderCard.querySelectorAll('.delivery-box, [class*="shipment"]');
  
  shipmentBoxes.forEach((shipmentBox) => {
    // Find the a-fixed-right-grid-col a-col-left within this shipment
    const itemContainer = shipmentBox.querySelector('.a-fixed-right-grid-col.a-col-left');
    
    if (itemContainer) {
      // First try to find the ul list that contains items
      const itemList = itemContainer.querySelector('ul.a-unordered-list, ul[role="list"]');
      
      if (itemList) {
        const shipmentItems = extractOrderItems(itemList);
        items.push(...shipmentItems);
      } else {
        // If no ul found, try extracting directly from the container
        const shipmentItems = extractOrderItems(itemContainer);
        items.push(...shipmentItems);
      }
    }
  });
  
  // If no items found in shipment boxes, try finding item-box directly in order card
  if (items.length === 0) {
    const allItemBoxes = orderCard.querySelectorAll('.item-box');
    allItemBoxes.forEach((itemBox) => {
      const shipmentItems = extractOrderItems(itemBox);
      items.push(...shipmentItems);
    });
  }
  
  // Also try finding items in any a-fixed-right-grid-col a-col-left directly in the order card
  // (but skip the order header one)
  if (items.length === 0) {
    const itemContainers = orderCard.querySelectorAll('.a-fixed-right-grid-col.a-col-left');
    itemContainers.forEach((container) => {
      // Skip if this is the order header container (it has order-header__header-list-item)
      if (container.querySelector('.order-header__header-list-item')) {
        return;
      }
      // Try to find ul list first
      const itemList = container.querySelector('ul.a-unordered-list, ul[role="list"]');
      if (itemList) {
        const shipmentItems = extractOrderItems(itemList);
        items.push(...shipmentItems);
      } else {
        const shipmentItems = extractOrderItems(container);
        items.push(...shipmentItems);
      }
    });
  }
  
  return {
    orderNumber: orderNumber,
    date: orderDate,
    orderValue: orderTotal,
    items,
  };
}

/**
 * Scrape orders from the Amazon orders page
 */
export function scrapeOrders(): OrderData[] {
  const orders: OrderData[] = [];
  
  // Find all order cards
  const orderCards = document.querySelectorAll('.order-card.js-order-card');
  
  orderCards.forEach((orderCard) => {
    const orderData = extractOrderData(orderCard);
    
    if (orderData.items.length > 0 || orderData.orderNumber) {
      orders.push(orderData);
    }
  });
  
  return orders;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "SCRAPE_ORDERS") {
    try {
      const orders = scrapeOrders();
      sendResponse({ orders });
    } catch (error) {
      sendResponse({ error: (error as Error).message ?? "Unknown error" });
    }
  }
  return true;
});
