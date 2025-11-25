## Current Problem

When attempting to scrape orders from Amazon's "Your Orders" page, the extension successfully fetches the HTML for subsequent pages (e.g., page 2 with `startIndex=10`), but the order data is not immediately available in the static HTML response.

**The Issue:**
- The extension uses `fetchPageHtml()` to retrieve page 2 HTML (≈547 KB), which succeeds.
- However, when parsing this HTML with `DOMParser`, the `.order-card` elements are found but contain only empty script placeholders.
- The actual order details (order number, date, items, etc.) are not present in the initial HTML because Amazon uses **client-side decryption** to populate the order cards.
- Each order card is paired with a script that initializes `window.SiegeClientSideDecryption`, which must execute in a browser context to decrypt and render the order data.
- Simply parsing the static HTML string returns empty order cards, resulting in "Successfully added 0 orders from page 2" despite finding 2+ order card elements.

**Root Cause:**
Amazon's order pages use a security measure where order data is encrypted in the HTML and only decrypted by client-side JavaScript. The `fetch()` API retrieves the raw HTML, but without executing the JavaScript, the decryption never happens, leaving the order cards empty.

## Current Findings
- The second page of Amazon orders (`startIndex=10`) is fetched successfully (≈547 KB HTML), but actual order content is not rendered server-side.
- Within `page2response.html`, each `<div class="order-card js-order-card">` is paired with a script that initializes the *Siege client-side decryption* bundle. Example block around lines 5923-5949 shows `window.SiegeClientSideDecryption` gating the rendering logic.
- Because the payload relies on client-side scripts to decrypt and populate the DOM, simply parsing the static HTML from `fetchPageHtml` returns empty order cards (just script placeholders).

## Possible Ways Forward
1. **Let Amazon's Client Script Run in an Isolated Document**
   - Create a hidden `iframe` or `Document` via `document.implementation.createHTMLDocument`.
   - Write the fetched HTML into that document so its scripts execute naturally.
   - Wait for the iframe to finish running and then scrape `.order-card` nodes from within it.
   - *Code touchpoints*: `scrapeOrders` pagination branch where `currentDoc` is assigned (lines 675-735) and the new iframe creation/cleanup logic.

2. **Reproduce the Decryption Flow Programmatically**
   - Inspect the scripts inside each order card to identify the network request or crypto routine they call (likely via `window.SiegeClientSideDecryption`).
   - Mimic the same API call from the extension, passing required headers/cookies, then parse the JSON payload.
   - *Code touchpoints*: new helper in `src/content/index.ts` to request decrypted order data; modifications to `extractOrderData` to consume that payload.

3. **Drive the Visible Page through DOM Events**
   - Instead of fetching Page 2 manually, navigate the actual tab to Page 2, allow the browser to execute Amazon's scripts, then scrape normally.
   - Requires either user interaction or automated clicks plus a delay while scripts populate content.
   - *Code touchpoints*: logic near `navigateToFirstPage` to detect pagination controls, simulate clicks, and coordinate scraping per page.

4. **Hybrid Approach (Preload + DOM Snapshot)**
   - Use `fetchPageHtml` to prefetch, inject the HTML into a sandboxed iframe for execution, then snapshot the resulting DOM tree for parsing.
   - Provides concurrency without taking over the main tab.
   - *Code touchpoints*: same as Option 1 plus additional messaging to transfer the parsed snapshot back into `scrapeOrders`.

## Decision: Proceeding with Option 4

We are proceeding with **Option 4 (Hybrid Approach: Preload + DOM Snapshot)** for the following reasons:

### Why Option 4 is Better Than Option 1:
- **Concurrency**: Option 4 can prefetch and process multiple pages in parallel, while Option 1 processes pages sequentially (page 2, then 3, then 4). This significantly improves performance when scraping many pages.
- **Better Architecture**: Option 4 separates concerns (prefetching, execution, snapshotting) making it easier to handle errors, retries, and maintain the codebase.
- **Scalability**: Option 4 scales better for users with many order pages, as it can process multiple pages simultaneously rather than one-at-a-time.

### Why Option 4 is Better Than Option 2:
- **Maintainability**: Option 4 uses Amazon's own scripts to do the decryption, so it's less likely to break when Amazon updates their encryption/decryption logic. Option 2 requires reverse-engineering Amazon's proprietary decryption, which could break with any Amazon update.
- **Reliability**: By letting Amazon's scripts execute naturally, we avoid potential bot detection that might occur with direct API calls. Option 2's programmatic approach may trigger security measures.
- **Implementation Complexity**: While Option 4 requires iframe management, Option 2 requires deep reverse engineering of encryption/decryption flows, network protocol analysis, and maintaining compatibility with Amazon's changing APIs.
- **Risk**: Option 2 is fragile and high-risk—if Amazon changes their decryption method, the entire approach breaks. Option 4 is more resilient because it relies on Amazon's own execution environment.

**Trade-off**: Option 4 is slightly slower (must wait for scripts to execute) but provides better long-term reliability and maintainability, which is crucial for a browser extension that users depend on.

## Next Steps
- Implement Option 4: Create iframe-based execution environment for fetched pages
- Prototype the approach on Page 2 to confirm decrypted content becomes accessible
- Update `scrapeOrders` and/or `extractOrderData` to use the new data source while keeping existing functionality for Page 1 intact
- Add parallel processing capability to handle multiple pages concurrently

