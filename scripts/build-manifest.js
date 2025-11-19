import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const configPath = resolve(process.cwd(), 'config.json');
const manifestPath = resolve(process.cwd(), 'manifest.json');

try {
  // Read config.json
  const config = JSON.parse(readFileSync(configPath, 'utf-8'));
  const clientId = config.googleOAuthClientId;

  if (!clientId || clientId.includes('YOUR_CLIENT_ID')) {
    console.warn('⚠️  Warning: Using placeholder Client ID. Please set up config.json');
  }

  // Read manifest.json
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

  // Inject client ID
  if (manifest.oauth2) {
    manifest.oauth2.client_id = clientId || 'YOUR_CLIENT_ID.apps.googleusercontent.com';
  }

  // Write updated manifest.json
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log('✅ Manifest.json updated with OAuth Client ID');
} catch (error) {
  if (error.code === 'ENOENT' && error.path === configPath) {
    console.warn('⚠️  config.json not found. Using placeholder Client ID.');
    console.warn('   Create config.json from config.example.json and add your Client ID');
  } else {
    console.error('❌ Error building manifest:', error.message);
    process.exit(1);
  }
}

