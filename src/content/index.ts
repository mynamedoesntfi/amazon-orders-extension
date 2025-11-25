import type { OrderItem } from "../model/OrderItem";
import type { Order } from "../model/Order";
import { OrderStatus } from "../model/Order";

function getTextContent(element: Element | null): string {
  return element?.textContent?.trim() ?? "";
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
 * Check if we're on the first page of pagination
 * Returns true if on first page or if no pagination exists
 */
function isFirstPage(): boolean {
  // Check URL parameters for page number
  const urlParams = new URLSearchParams(window.location.search);
  const pageParam = urlParams.get('page');
  if (pageParam) {
    const pageNum = parseInt(pageParam, 10);
    if (Number.isFinite(pageNum) && pageNum > 1) {
      return false;
    }
  }
  
  // Check for page number in URL path (e.g., /orders/2 or /orders?page=2)
  const pathMatch = window.location.pathname.match(/\/orders\/(\d+)/);
  if (pathMatch) {
    const pageNum = parseInt(pathMatch[1], 10);
    if (Number.isFinite(pageNum) && pageNum > 1) {
      return false;
    }
  }
  
  // Check for "Previous" button - if it exists and is enabled, we're not on first page
  const previousButton = document.querySelector('a[aria-label*="Previous"], a[aria-label*="previous"], .a-pagination .a-last[aria-disabled="false"]');
  if (previousButton && !previousButton.hasAttribute('aria-disabled')) {
    // Check if it's actually clickable (not disabled)
    const isDisabled = previousButton.classList.contains('a-disabled') || 
                       previousButton.getAttribute('aria-disabled') === 'true' ||
                       previousButton.hasAttribute('disabled');
    if (!isDisabled) {
      return false;
    }
  }
  
  // Check for page number indicators in pagination controls
  const paginationContainer = document.querySelector('.a-pagination, [class*="pagination"]');
  if (paginationContainer) {
    // Look for current page indicator
    const currentPageElement = paginationContainer.querySelector('.a-selected, [aria-current="page"]');
    if (currentPageElement) {
      const pageText = getTextContent(currentPageElement);
      const pageNum = parseInt(pageText, 10);
      if (Number.isFinite(pageNum) && pageNum > 1) {
        return false;
      }
    }
  }
  
  // If no pagination indicators found, assume we're on first page
  return true;
}

/**
 * Navigate to the first page of orders if not already on it
 * Returns true if navigation was needed, false if already on first page
 */
function navigateToFirstPage(): boolean {
  if (isFirstPage()) {
    return false;
  }
  
  // Try to find and click the "1" page link or first page link
  const paginationContainer = document.querySelector('.a-pagination, [class*="pagination"]');
  if (paginationContainer) {
    // Look for page 1 link
    const pageOneLink = Array.from(paginationContainer.querySelectorAll('a')).find(link => {
      const text = getTextContent(link).trim();
      return text === '1' || link.getAttribute('aria-label')?.includes('Page 1');
    }) as HTMLAnchorElement | null;
    
    if (pageOneLink) {
      pageOneLink.click();
      return true;
    }
  }
  
  // If no page 1 link found, construct URL to first page
  const url = new URL(window.location.href);
  url.searchParams.delete('page');
  url.searchParams.delete('pageNumber');
  
  // Remove page number from path if present
  const pathWithoutPage = url.pathname.replace(/\/orders\/\d+/, '/orders');
  url.pathname = pathWithoutPage;
  
  // Navigate to first page
  window.location.href = url.toString();
  return true;
}

/**
 * Find pagination link for order items (e.g., "See all X items" or "View order details")
 */
function findOrderItemsPaginationLink(orderCard: Element): string | null {
  // Look for "See all X items" link - highly specific
  // a-link-emphasis is often used for "See all 2 items"
  const seeAllLink = orderCard.querySelector('a[href*="/gp/your-account/order-details"]');
  if (seeAllLink && seeAllLink.textContent?.toLowerCase().includes('see all')) {
    return getAbsoluteUrl((seeAllLink as HTMLAnchorElement).href);
  }
  
  // Look for pagination buttons/links within the order card
  // Be strict: only if text explicitly mentions "see all" or "items" with a number
  const paginationLinks = Array.from(orderCard.querySelectorAll('a')).find(link => {
    const text = link.textContent?.toLowerCase() || '';
    const href = link.getAttribute('href') || '';
    
    // Match "See all 2 items" or similar specific patterns
    // Avoid generic "Order details" which is on every card
    const isPaginationText = text.includes('see all') || 
                             (text.includes('items') && /\d/.test(text));
                             
    return isPaginationText && 
           (href.includes('order-details') || href.includes('gp/your-account'));
  }) as HTMLAnchorElement | null;
  
  return paginationLinks ? getAbsoluteUrl(paginationLinks.href) : null;
}

/**
 * Fetch HTML from a URL without navigating (using fetch in content script context)
 */
async function fetchPageHtml(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include', // Include cookies for authenticated requests
      headers: {
        'Accept': 'text/html',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.text();
  } catch (error) {
    console.warn(`Failed to fetch ${url}:`, error);
    throw error;
  }
}

/**
 * DEBUG FUNCTION - Can be removed easily later
 * Logs order card HTML to console and optionally injects fetched HTML into page for visual inspection
 */
function debugPageExtraction(
  orderCards: NodeListOf<Element>,
  pageCount: number,
  fetchedHtml?: string,
  pageUrl?: string
): void {
  // Option 2: Log order card HTML to console
  if (orderCards.length > 0) {
    console.log(`=== DEBUG: Order Cards on Page ${pageCount} ===`);
    Array.from(orderCards).forEach((card, idx) => {
      const outerHTML = card.outerHTML || 'No outerHTML';
      console.log(`Order card ${idx} outerHTML (first 1000 chars):`, outerHTML.substring(0, 1000));
    });
    console.log(`=== End DEBUG: Order Cards ===`);
  }

  // Option 3: Inject fetched HTML into page for visual inspection
  if (fetchedHtml) {
    // Remove any existing debug div
    const existingDebug = document.getElementById('amazon-scraper-debug');
    if (existingDebug) {
      existingDebug.remove();
    }

    const debugDiv = document.createElement('div');
    debugDiv.id = 'amazon-scraper-debug';
    debugDiv.style.cssText = 'position:fixed; top:0; left:0; width:50%; height:100%; overflow:auto; background:white; z-index:99999; border:2px solid red; padding:20px; font-family:monospace; font-size:12px;';
    debugDiv.innerHTML = `
      <div id="amazon-scraper-debug-header" style="position:sticky; top:0; background:#f0f0f0; padding:10px; border-bottom:2px solid #ccc; margin-bottom:10px;">
        <h2 style="margin:0 0 10px 0;">DEBUG: Fetched Page ${pageCount} HTML</h2>
        ${pageUrl ? `<p style="margin:0; word-break:break-all;"><strong>URL:</strong> ${pageUrl}</p>` : ''}
        <p style="margin:5px 0 0 0;"><strong>HTML Length:</strong> ${fetchedHtml.length} characters</p>
        <button onclick="this.closest('#amazon-scraper-debug').remove()" style="margin-top:10px; padding:5px 15px; cursor:pointer;">Close Debug Panel</button>
      </div>
      <pre id="amazon-scraper-debug-pre" style="white-space:pre-wrap; word-wrap:break-word; margin:0;"></pre>
    `;
    const preElement = debugDiv.querySelector('#amazon-scraper-debug-pre');
    if (preElement) {
      preElement.textContent = `${fetchedHtml.substring(0, 50000)}${fetchedHtml.length > 50000 ? '\n\n... (truncated, showing first 50000 chars)' : ''}`;
    }
    document.body.appendChild(debugDiv);
  }
}

/**
 * Extract orders from HTML string (parsed order details page)
 * Reuses the same extraction logic as extractOrderItems but works with a Document
 */
function extractItemsFromHtml(html: string): OrderItem[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  const allItems: OrderItem[] = [];
  
  // Use the same selectors as the main extraction function
  const itemBoxes = doc.querySelectorAll('.item-box');
  
  if (itemBoxes.length > 0) {
    itemBoxes.forEach((itemBox) => {
      // Extract title
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
      if (!title) return;
      
      const productUrl = titleElement ? getAbsoluteUrl(titleElement.href) : "";
      
      // Extract image
      const imageElement = itemBox.querySelector('img[src*="media-amazon"], .product-image img') as HTMLImageElement | null;
      let imageUrl = imageElement?.src || imageElement?.getAttribute('data-a-hires') || "";
      
      if (imageElement?.getAttribute('data-a-hires')) {
        imageUrl = imageElement.getAttribute('data-a-hires') || imageUrl;
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
      
      allItems.push({
        title,
        imageUrl,
        quantity,
        productUrl,
      });
    });
  } else {
    // Fallback: try finding items in list structure (same as extractOrderItems)
    const listItems = doc.querySelectorAll('li span.a-list-item, li .a-list-item');
    listItems.forEach((listItem) => {
      const itemBox = listItem.querySelector('.item-box') || (listItem as Element).closest('.item-box');
      if (!itemBox) {
        return;
      }
      
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
      if (!title) return;
      
      const productUrl = titleElement ? getAbsoluteUrl(titleElement.href) : "";
      
      const imageElement = itemBox.querySelector('img[src*="media-amazon"], .product-image img') as HTMLImageElement | null;
      let imageUrl = imageElement?.src || imageElement?.getAttribute('data-a-hires') || "";
      
      if (imageElement?.getAttribute('data-a-hires')) {
        imageUrl = imageElement.getAttribute('data-a-hires') || imageUrl;
      }
      
      let quantity = 1;
      const quantityText = itemBox.textContent || "";
      const quantityMatch = quantityText.match(/Qty[:\s]*(\d+)/i) || quantityText.match(/Quantity[:\s]*(\d+)/i);
      if (quantityMatch) {
        const parsed = parseInt(quantityMatch[1], 10);
        if (Number.isFinite(parsed) && parsed > 0) {
          quantity = parsed;
        }
      }
      
      allItems.push({
        title,
        imageUrl,
        quantity,
        productUrl,
      });
    });
  }
  
  // Also try finding items in shipment boxes or delivery boxes
  const shipmentBoxes = doc.querySelectorAll('.delivery-box, [class*="shipment"]');
  shipmentBoxes.forEach((shipmentBox) => {
    const itemContainer = shipmentBox.querySelector('.a-fixed-right-grid-col.a-col-left');
    if (itemContainer) {
      const itemList = itemContainer.querySelector('ul.a-unordered-list, ul[role="list"]');
      if (itemList) {
        const shipmentItems = extractOrderItems(itemList);
        allItems.push(...shipmentItems);
      } else {
        const shipmentItems = extractOrderItems(itemContainer);
        allItems.push(...shipmentItems);
      }
    }
  });
  
  return allItems;
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
    itemBoxes.forEach((itemBox) => {
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
        quantity,
        productUrl,
      });
    });
  } else {
    // Fallback: try finding items in list structure
    const listItems = container.querySelectorAll('li span.a-list-item, li .a-list-item');
    listItems.forEach((listItem) => {
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
        quantity,
        productUrl,
      });
    });
  }
  
  return items;
}

/**
 * Extract order data from an order card element (div.order-card.js-order-card)
 * Now handles paginated items by fetching additional pages
 */
async function extractOrderData(orderCard: Element): Promise<Order> {
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
  
  // Extract order status
  let orderStatus: OrderStatus | undefined;
  
  // Check for Cancelled status
  const cancelledElement = orderCard.querySelector('span.a-size-medium.delivery-box__primary-text.a-text-bold');
  if (cancelledElement && cancelledElement.textContent?.includes('Cancelled')) {
    orderStatus = OrderStatus.Cancelled;
  } else {
    // Check for Shipped status - look for span with classes a-color-secondary and a-text-caps containing "Ship to"
    const allSpans = orderCard.querySelectorAll('span');
    const shipToElement = Array.from(allSpans).find(span => {
      const hasClasses = span.classList.contains('a-color-secondary') && span.classList.contains('a-text-caps');
      const hasText = span.textContent?.includes('Ship to');
      return hasClasses && hasText;
    });
    
    if (shipToElement) {
      orderStatus = OrderStatus.Shipped;
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
    if (allItemBoxes.length > 0) {
        allItemBoxes.forEach((itemBox) => {
          const shipmentItems = extractOrderItems(itemBox);
          items.push(...shipmentItems);
        });
    } else {
        // Fallback for legacy views where items might be in a-fixed-right-grid-col but not marked as item-box
        // This is common in older Amazon order history views
        const gridCols = orderCard.querySelectorAll('.a-fixed-right-grid-col.a-col-left');
        gridCols.forEach(col => {
             // Avoid the header column
             if (col.querySelector('.order-header__header-list-item')) return;
             
             const extracted = extractOrderItems(col);
             if (extracted.length > 0) {
                 items.push(...extracted);
             } else {
                 // Last resort: try to find title links directly in the column
                 const titleLink = col.querySelector('a[href*="/dp/"], a[href*="product"]');
                 if (titleLink) {
                     const title = getTextContent(titleLink);
                     const productUrl = getAbsoluteUrl((titleLink as HTMLAnchorElement).href);
                     items.push({
                         title: title || "Unknown Item",
                         imageUrl: "",
                         quantity: 1,
                         productUrl
                     });
                 }
             }
        });
    }
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
  
  // Check if there's a pagination link to fetch additional items
  const paginationUrl = findOrderItemsPaginationLink(orderCard);
  
  if (paginationUrl) {
    try {
      // Fetch the order details page HTML without navigating
      const html = await fetchPageHtml(paginationUrl);
      
      // Extract additional items from the fetched HTML
      const additionalItems = extractItemsFromHtml(html);
      
      // Deduplicate items (in case some appear on both pages)
      const existingUrls = new Set(items.map(item => `${item.productUrl}-${item.title}`));
      const uniqueAdditionalItems = additionalItems.filter(item => {
        const key = `${item.productUrl}-${item.title}`;
        return !existingUrls.has(key);
      });
      
      items.push(...uniqueAdditionalItems);
    } catch (error) {
      console.warn(`Failed to fetch additional items from ${paginationUrl}:`, error);
      // Continue with items already found on current page
    }
  }
  
  return {
    orderNumber: orderNumber,
    date: orderDate,
    orderValue: orderTotal,
    status: orderStatus,
    items,
  };
}

/**
 * Find the "Next" page link for the main order history list
 */
function findNextPageLink(doc: Document | Element = document): string | null {
  // Amazon uses .a-last a for the next button
  const nextButton = doc.querySelector('.a-pagination .a-last a, li.a-last a');
  if (nextButton) {
    return getAbsoluteUrl((nextButton as HTMLAnchorElement).href);
  }
  return null;
}

/**
 * Scrape orders from the Amazon orders page
 * Updated to handle async order extraction with pagination (both internal items and order history pages)
 */
export async function scrapeOrders(): Promise<Order[]> {
  // Ensure we're on the first page before extracting data
  if (!isFirstPage()) {
    navigateToFirstPage();
    // Return empty array - caller should wait for page navigation and call again
    // or handle the navigation asynchronously
    return [];
  }
  
  const allOrders: Order[] = [];
  let currentDoc: Document = document;
  let nextUrl: string | null = null;
  let pageCount = 0;
  const MAX_PAGES = 10; // Safety limit
  
  do {
    pageCount++;
    console.log(`Scraping page ${pageCount}...`);
    
    // Find all order cards on the current page/document
    // Try multiple selectors in case Amazon changes the class
    let orderCards = currentDoc.querySelectorAll('.order-card.js-order-card');
    
    // If no cards found with standard selector, try fallback selectors
    if (orderCards.length === 0) {
      console.warn(`No order cards found on page ${pageCount} with standard selector. Trying fallbacks...`);
      orderCards = currentDoc.querySelectorAll('.js-order-card, .order-card');
    }
    
    console.log(`Found ${orderCards.length} orders on page ${pageCount}`);
    
    // DEBUG: Log order card HTML and inject fetched HTML if available
    debugPageExtraction(orderCards, pageCount);
    
    // Process each order card (must be sequential to avoid overwhelming with requests)
    let pageOrdersAdded = 0;
    for (const orderCard of Array.from(orderCards)) {
      try {
        const orderData = await extractOrderData(orderCard);
        console.log(`Order data: ${JSON.stringify(orderData)}`);
        if (orderData.items.length > 0 || orderData.orderNumber) {
          allOrders.push(orderData);
          pageOrdersAdded++;
        } else {
           console.warn(`Skipped order on page ${pageCount}: No items or order number found.`, 
             { hasItems: orderData.items.length > 0, hasOrderNumber: !!orderData.orderNumber });
        }
      } catch (error) {
        console.error('Error extracting order data:', error);
        // Continue with next order
      }
    }
    console.log(`Successfully added ${pageOrdersAdded} orders from page ${pageCount}. Total orders: ${allOrders.length}`);
    
    // Check for next page
    nextUrl = findNextPageLink(currentDoc);
    
    if (nextUrl && pageCount < MAX_PAGES) {
      try {
        console.log(`Fetching next page: ${nextUrl}`);
        const html = await fetchPageHtml(nextUrl);
        const parser = new DOMParser();
        currentDoc = parser.parseFromString(html, 'text/html');
        
        // Validate we actually got a page with orders
        const cardCheck = currentDoc.querySelectorAll('.order-card.js-order-card');
        console.log(`Parsed next page. Found ${cardCheck.length} order cards.`);
        
        // DEBUG: Log fetched HTML and inject into page for inspection
        debugPageExtraction(cardCheck, pageCount + 1, html, nextUrl);
        
        if (cardCheck.length === 0) {
           // Sometimes Amazon redirects to a login page or bot check if scraping too fast
           const title = currentDoc.title;
           console.warn(`Parsed page has no orders. Title: ${title}`);
           // Check if it's a sign-in page
           if (title.includes('Sign-In') || currentDoc.querySelector('form[name="signIn"]')) {
             console.error('Hit sign-in wall. Stopping scrape.');
             break;
           }
        }
      } catch (error) {
        console.error(`Failed to fetch next page ${nextUrl}:`, error);
        break; // Stop if we can't fetch the next page
      }
    } else {
      nextUrl = null; // Stop loop
    }
    
  } while (nextUrl && pageCount < MAX_PAGES);
  
  return allOrders;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "SCRAPE_ORDERS") {
    // Make this async to handle pagination
    scrapeOrders()
      .then(orders => sendResponse({ orders }))
      .catch(error => sendResponse({ error: (error as Error).message ?? "Unknown error" }));
    return true; // Keep channel open for async response
  }
  return true;
});
