# Setup Instructions

## Google Drive OAuth Configuration

To enable Google Drive export functionality, you need to set up OAuth credentials.

### Step 1: Create config.json

Copy the example config file:
```bash
cp config.example.json config.json
```

### Step 2: Add Your Client ID

Edit `config.json` and replace `YOUR_CLIENT_ID.apps.googleusercontent.com` with your actual Google OAuth Client ID.

```json
{
  "googleOAuthClientId": "your-actual-client-id.apps.googleusercontent.com"
}
```

### Step 3: Build the Extension

The build process will automatically inject your Client ID into `manifest.json`:

```bash
npm run build
```

### Important Notes

- **`config.json` is gitignored** - Your Client ID will not be committed to version control
- **`config.example.json` is tracked** - This serves as a template for other developers
- The Client ID is injected into `manifest.json` during the build process
- Never commit your actual `config.json` file

### Getting Your Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project and enable Google Drive API
3. Create OAuth 2.0 credentials
4. Copy the Client ID and paste it into `config.json`

