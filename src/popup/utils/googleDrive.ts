export async function authenticateGoogleDrive(): Promise<string> {
  return new Promise((resolve, reject) => {
    // Debug: Check chrome object availability
    if (typeof chrome === 'undefined') {
      reject(new Error('Chrome extension API is not available. Make sure you are running this in a Chrome extension context.'));
      return;
    }

    // Debug: Log available chrome APIs (for troubleshooting)
    console.log('[CART] Chrome APIs available:', {
      chrome: typeof chrome !== 'undefined',
      identity: typeof chrome.identity !== 'undefined',
      runtime: typeof chrome.runtime !== 'undefined',
      manifest: chrome.runtime?.getManifest?.()?.permissions || 'N/A',
      oauth2: chrome.runtime?.getManifest?.()?.oauth2 || 'N/A'
    });

    // Check if chrome.identity API is available
    if (!chrome.identity) {
      const manifest = chrome.runtime?.getManifest?.();
      const permissions = manifest?.permissions || [];
      const hasIdentityPermission = permissions.includes('identity');
      
      reject(new Error(
        `Chrome Identity API is not available. ` +
        `Manifest permissions: [${permissions.join(', ')}]. ` +
        `Has identity permission: ${hasIdentityPermission}. ` +
        `Please remove and reload the extension.`
      ));
      return;
    }

    if (!chrome.identity.getAuthToken) {
      reject(new Error('chrome.identity.getAuthToken is not available. Make sure the extension has the "identity" permission and proper OAuth2 configuration.'));
      return;
    }

    chrome.identity.getAuthToken(
      {
        interactive: true,
        scopes: ['https://www.googleapis.com/auth/drive.file'],
      },
      (token) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (!token) {
          reject(new Error('Failed to get authentication token'));
          return;
        }
        resolve(token);
      }
    );
  });
}

export async function uploadToGoogleDrive(
  csvContent: string,
  filename: string,
  accessToken: string
): Promise<string> {
  // Create file metadata
  const metadata = {
    name: filename,
    mimeType: 'text/csv',
  };

  // Create form data for multipart upload
  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  form.append('file', new Blob([csvContent], { type: 'text/csv' }));

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.error?.message || 'Failed to upload to Google Drive'
    );
  }

  const file = await response.json();
  return file.id;
}

export async function exportToGoogleDrive(
  csvContent: string,
  filename: string
): Promise<string> {
  const accessToken = await authenticateGoogleDrive();
  const fileId = await uploadToGoogleDrive(csvContent, filename, accessToken);
  return fileId;
}

