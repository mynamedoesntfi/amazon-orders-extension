export async function authenticateGoogleDrive(): Promise<string> {
  return new Promise((resolve, reject) => {
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

