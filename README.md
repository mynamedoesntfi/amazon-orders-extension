# Amazon Orders Extension

Chrome extension that exports Amazon cart data to CSV.

## Project Layout
```
amazon-orders-extension/
├── manifest.json            # Extension manifest (MV3)
├── public/
│   ├── icons/               # Placeholder for extension icons
│   └── popup.html           # HTML shell that mounts the React popup
├── src/
│   ├── background/          # Service worker entry point
│   ├── content/             # Amazon cart scraping content script
│   └── popup/               # React popup UI
├── package.json             # NPM scripts and dependencies
├── tsconfig.json            # TypeScript configuration
└── vite.config.ts           # Multi-entry Vite build configuration
```

## Getting Started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run a development build/watch (adjust once build tooling is finalized):
   ```bash
   npm run dev
   ```
3. Build the production bundle:
   ```bash
   npm run build
   ```
4. Load the `dist/` folder as an unpacked extension from `chrome://extensions` in Developer Mode.

## Next Steps
- Implement the Amazon cart DOM parsing inside `src/content/index.ts`.
- Flesh out the popup UI in `src/popup/App.tsx` to preview cart data and trigger exports.
- Generate CSV downloads from the scraped cart data.
- Add error handling and user guidance when scraping fails or the cart is empty.
