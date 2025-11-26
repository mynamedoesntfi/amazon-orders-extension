# Amazon Orders Extension

**Version:** 0.1.0

A Chrome extension that scrapes your Amazon order history and exports it to CSV format. Supports exporting to your local downloads folder or directly to Google Drive.

## Features

- 📦 **Scrape Order History**: Automatically extracts order data from Amazon's "Your Orders" page
- 📄 **CSV Export**: Export orders to CSV format for easy analysis
- ☁️ **Google Drive Integration**: Save CSV files directly to your Google Drive
- 🔄 **Multi-Page Support**: Handles pagination and scrapes orders across multiple pages
- 🎨 **Modern UI**: Clean React-based popup interface
- 🔒 **Privacy-Focused**: All processing happens locally in your browser

## Installation

### From Chrome Web Store

*Coming soon - extension will be available on the Chrome Web Store*

### Development Installation

1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd amazon-orders-extension
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable **"Developer mode"** (toggle in top-right)
   - Click **"Load unpacked"**
   - Select the `dist/` folder from this project

## Usage

1. Navigate to [Amazon Your Orders](https://www.amazon.com/your-orders/orders)
2. Click the extension icon in your Chrome toolbar
3. Click **"Scrape Orders"** to extract your order data
4. Once scraping is complete, choose to:
   - **Download CSV**: Saves to your local downloads folder
   - **Save to Google Drive**: Requires Google OAuth authentication

## Development

### Project Structure

```
amazon-orders-extension/
├── src/
│   ├── background/          # Service worker (background script)
│   ├── content/             # Content script for scraping Amazon orders
│   ├── popup/               # React popup UI
│   ├── components/          # React components (Order, OrderList, etc.)
│   ├── hooks/               # React hooks (useOrders)
│   ├── model/               # TypeScript models (Order, OrderItem)
│   └── utils/               # Utility functions (CSV, currency, Google Drive)
├── manifest.json            # Chrome extension manifest (MV3)
├── package.json             # NPM dependencies and scripts
├── tsconfig.json            # TypeScript configuration
└── vite.config.ts           # Vite build configuration
```

### Available Scripts

- `npm run dev` - Start development build with watch mode
- `npm run build` - Build production bundle
- `npm run clean` - Clean the dist folder
- `npm run lint` - Run ESLint

### Building

The build process:
1. Cleans the `dist/` folder
2. Compiles TypeScript
3. Bundles assets with Vite
4. Outputs to `dist/` folder

```bash
npm run build
```

### Technologies

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Chrome Extension Manifest V3** - Extension API

## How It Works

### Order Scraping

The extension uses a content script that:
1. Detects when you're on Amazon's "Your Orders" page
2. Scrapes order data from the current page
3. Handles pagination by fetching subsequent pages
4. Executes pages in sandboxed iframes to allow Amazon's client-side decryption scripts to run
5. Extracts order details: order number, date, total, status, and items

### Data Export

- **CSV Format**: Standard comma-separated values with order and item details
- **Google Drive**: Uses OAuth 2.0 to authenticate and upload files

## Configuration

### Google Drive Setup

To enable Google Drive export:
1. Create a Google Cloud Project
2. Enable Google Drive API
3. Create OAuth 2.0 credentials
4. Update `manifest.json` with your OAuth client ID

See `steps_to_production.md` for detailed setup instructions.

## Permissions

The extension requires:
- **activeTab**: To interact with Amazon pages
- **scripting**: To inject content scripts
- **identity**: For Google OAuth authentication
- **host_permissions**: Access to Amazon.com and Google OAuth endpoints

## Troubleshooting

### Orders Not Scraping

- Ensure you're on the correct Amazon page: `https://www.amazon.com/your-orders/orders`
- Check browser console for errors
- Make sure you're logged into Amazon

### Google Drive Export Failing

- Verify OAuth credentials are correctly configured
- Check that Google Drive API is enabled in your Google Cloud project
- Ensure you've authorized the extension to access Google Drive

### Extension Not Loading

- Verify you selected the `dist/` folder (not the root project folder)
- Check that `npm run build` completed successfully
- Review Chrome's extension error page for details

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

[Add your license here]

## Version History

See `CHANGELOG.md` for detailed version history.

**Current Version:** 0.1.0

## Support

For issues, questions, or feature requests, please open an issue on GitHub.

## Related Documentation

- [Steps to Production](steps_to_production.md) - Guide for publishing to Chrome Web Store
- [Solution to Next Page Data Retrieval](solution_to_next_page_data_retrieval_problem.md) - Technical details on pagination handling

