/**
 * Checks if the user is currently logged in (has a cached OAuth token)
 * Returns true if a token exists, false otherwise
 */
export async function isLoggedInGoogleDrive(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.identity || !chrome.identity.getAuthToken) {
      resolve(false);
      return;
    }

    chrome.identity.getAuthToken(
      {
        interactive: false, // Don't show UI, just check for cached token
        scopes: ['https://www.googleapis.com/auth/drive.file'],
      },
      (token) => {
        if (chrome.runtime.lastError || !token) {
          resolve(false);
          return;
        }
        resolve(true);
      }
    );
  });
}

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
    console.log(error);
    
    // Check if it's an authentication error (401)
    if (response.status === 401) {
      // Remove the expired/invalid token from cache
      if (chrome.identity && chrome.identity.removeCachedAuthToken) {
        chrome.identity.removeCachedAuthToken(
          { token: accessToken },
          () => {
            // Token removed - will be re-authenticated on next attempt
          }
        );
      }
      throw new Error('Authentication expired. Please try again.');
    }
    
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
  try {
    let accessToken = await authenticateGoogleDrive();
    let fileId = await uploadToGoogleDrive(csvContent, filename, accessToken);
    return fileId;
  } catch (error) {
    // If authentication failed, remove token and try once more
    if (error instanceof Error && 
        (error.message.includes('Authentication expired') || 
         error.message.includes('invalid authentication credentials'))) {
      
      // Get a fresh token and retry
      const freshToken = await authenticateGoogleDrive();
      const fileId = await uploadToGoogleDrive(csvContent, filename, freshToken);
      return fileId;
    }
    throw error; // Re-throw if it's not an auth error
  }
}

/**
 * Revokes the access token on Google's servers (disconnect)
 * This invalidates the token server-side, not just locally
 */
async function revokeTokenOnServer(token: string): Promise<void> {
  const revokeUrl = `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`;
  
  try {
    const response = await fetch(revokeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Google returns 200 even if token was already revoked or invalid
    // So we consider it successful if we get any response
    if (!response.ok && response.status !== 400) {
      throw new Error(`Failed to revoke token: ${response.status}`);
    }
  } catch (error) {
    // If revocation fails, we still want to remove from cache
    // So we log but don't throw
    console.warn('Failed to revoke token on server:', error);
  }
}

export async function signOutGoogleDrive(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof chrome === 'undefined' || !chrome.identity) {
      reject(new Error('Chrome extension API is not available.'));
      return;
    }

    if (!chrome.identity.getAuthToken || !chrome.identity.removeCachedAuthToken) {
      reject(new Error('Chrome Identity API methods are not available.'));
      return;
    }

    // First, try to get the current token (if any) to revoke and remove it
    chrome.identity.getAuthToken(
      {
        interactive: false, // Don't show UI, just get cached token
        scopes: ['https://www.googleapis.com/auth/drive.file'],
      },
      async (token) => {
        if (chrome.runtime.lastError) {
          // No token cached, already signed out
          resolve();
          return;
        }

        if (token) {
          // Step 1: Revoke the token on Google's servers (disconnect)
          await revokeTokenOnServer(token);

          // Step 2: Remove the cached token from Chrome's cache
          chrome.identity.removeCachedAuthToken(
            { token: token },
            () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
              }
              resolve();
            }
          );
        } else {
          // No token to remove, already signed out
          resolve();
        }
      }
    );
  });
}

