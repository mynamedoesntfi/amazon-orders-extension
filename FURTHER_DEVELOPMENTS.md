# Further Developments

This document tracks future improvements, bug fixes, and feature enhancements for the CART extension.

## Tickets

### TICKET-001: Cross-Origin Image Loading in Popup
**Status:** Open  
**Priority:** Medium  
**Type:** Bug Fix / Enhancement

#### TLDR
Chrome extension CSP may block external images in popup. Solution: Use content script to fetch images and convert to base64 data URLs for safe loading.

#### Description
Chrome extensions have strict Content Security Policy (CSP) restrictions that may prevent loading images from external domains (like Amazon's CDN) directly in the extension popup. Currently, product images are loaded using:

```tsx
<img src={item.imageUrl} alt={item.title} />
```

If CSP restrictions are enforced, images may fail to load, resulting in:
- Broken image icons
- Placeholder text instead of images
- Console errors: "Refused to load the image..."

#### Proposed Solution
**Solution #3: Use Content Script to Fetch Images**

Since content scripts run in the page context, they can access Amazon images without CSP restrictions. The solution involves:

1. **Modify content script** to fetch image data:
   - When scraping cart items, fetch each image via `fetch()` in the content script context
   - Convert images to base64 data URLs or blob URLs
   - Include the processed image data in the `CartItem` response

2. **Update CartItem type** to support both URL and data URL:
   ```typescript
   export type CartItem = {
     title: string;
     imageUrl: string;        // Original URL (fallback)
     imageDataUrl?: string;    // Base64 data URL (preferred)
     // ... other fields
   };
   ```

3. **Update CartListItem component** to prefer data URL:
   ```tsx
   {item.imageDataUrl ? (
     <img src={item.imageDataUrl} alt={item.title} />
   ) : item.imageUrl ? (
     <img src={item.imageUrl} alt={item.title} />
   ) : (
     <div>No image</div>
   )}
   ```

4. **Implementation details**:
   - Add async image fetching function in content script
   - Use `fetch()` to get image as blob
   - Convert blob to base64 using `FileReader` or `btoa()`
   - Handle errors gracefully with fallback to original URL

#### Acceptance Criteria
- [ ] Images load successfully in popup without CSP errors
- [ ] Fallback to original URL if data URL conversion fails
- [ ] No performance degradation (consider lazy loading or caching)
- [ ] Error handling for failed image fetches
- [ ] Works with all Amazon image CDN domains

#### Notes
- This solution leverages the content script's page context privileges
- Base64 encoding will increase payload size but ensures compatibility
- Consider implementing image caching to avoid re-fetching on refresh

---

## Ticket Template

### TICKET-XXX: [Title]
**Status:** [Open/In Progress/Closed]  
**Priority:** [Low/Medium/High/Critical]  
**Type:** [Bug Fix/Feature/Enhancement/Refactor]

#### TLDR
[One or two line summary of the issue/feature]

#### Description
[Detailed description of the issue or feature]

#### Proposed Solution
[Solution approach and implementation details]

#### Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

#### Notes
[Additional context, considerations, or related tickets]

