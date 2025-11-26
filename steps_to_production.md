# Steps to Production

This guide outlines the steps to publish your Amazon Orders Extension to production.

## Overview

There are two separate processes:
1. **Chrome Web Store** - Publishing the extension itself
2. **Google OAuth Verification** - Enabling Google Drive features for all users

These are independent - you can publish the extension first and handle OAuth verification later.

---

## Step 1: Build the Extension

Build the production-ready extension:

```bash
npm run build
```

This creates a `dist/` folder with the compiled extension files.

---

## Step 2: Test Locally (Recommended)

Before publishing, test the built extension:

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in top-right corner)
3. Click **"Load unpacked"**
4. Select the `dist/` folder from your project
5. Test all features:
   - Order scraping
   - CSV export to downloads
   - Google Drive export (if OAuth is configured)

---

## Step 3: Package for Chrome Web Store

Create a ZIP file of the `dist/` folder for submission:

**On Windows (PowerShell):**
```powershell
Compress-Archive -Path dist\* -DestinationPath amazon-orders-extension-v0.1.0.zip
```

**On Mac/Linux:**
```bash
cd dist
zip -r ../amazon-orders-extension-v0.1.0.zip .
```

**Note:** Update the version number in the filename to match your `manifest.json` version.

---

## Step 4: Update Version Number

Before publishing, increment the version in `manifest.json`:

```json
{
  "version": "0.1.0"  // Update to 0.1.1, 0.2.0, etc.
}
```

---

## Step 5: Publish to Chrome Web Store

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Sign in with your Google account
3. Click **"New Item"**
4. Upload the ZIP file you created
5. Fill in the required information:
   - **Store listing:**
     - Name, description, detailed description
     - Category
     - Language
   - **Graphics:**
     - At least one screenshot (1280x800 or 640x400 recommended)
     - Small promotional tile (440x280)
     - Large promotional tile (920x680) - optional
     - Icon (128x128)
   - **Privacy:**
     - Single purpose description
     - Permission justifications
   - **Distribution:**
     - Visibility (public, unlisted, or private)
     - Countries/regions
6. Submit for review

**Review time:** Typically 1-3 business days for first submission.

---

## Step 6: OAuth Verification (For Google Drive Feature)

### Current Status Options

**Testing Mode (Current Recommended):**
- No verification required
- Up to 100 test users can use Google Drive export
- Add test users in Google Cloud Console → OAuth consent screen → Test users

**Production Mode:**
- Requires verification if using sensitive scopes (like Google Drive)
- All users can use Google Drive export (after verification)
- May require security assessment

### When to Verify

**You can publish the extension first**, then verify OAuth later:

1. ✅ **Publish extension to Chrome Web Store** (Step 5)
2. ✅ Users can install and use basic features (scraping, CSV download)
3. ⏳ **Keep OAuth in "Testing" mode** initially
4. ⏳ **Verify OAuth when ready** to enable Google Drive for all users

### What's Needed for OAuth Verification

1. **Privacy Policy** (Required)
   - Publicly accessible URL
   - Must explain:
     - What data you collect
     - How you use Google Drive API
     - Data storage practices
   - Must be hosted on a domain you control

2. **Terms of Service** (Often required)
   - Publicly accessible URL
   - Explains terms users agree to

3. **OAuth Consent Screen** (Complete all fields)
   - App name, logo, support email
   - Privacy policy URL
   - Terms of service URL
   - Authorized domains
   - Developer contact information

4. **Security Assessment** (If required by Google)
   - For sensitive scopes
   - Can take weeks
   - May have associated fees

5. **Video Demonstration** (Sometimes required)
   - Screen recording showing how your app uses requested scopes

### Steps to Verify OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **OAuth consent screen**
3. Complete all required fields
4. Add your privacy policy URL
5. Switch status to **"In production"** (if ready)
6. Submit for verification
7. Wait for review (1-4 weeks typically)

### Important Notes

- You can switch between "Testing" and "In production" at any time
- If OAuth is in "Production" but unverified, users will see warnings
- Verification is only needed for the Google Drive feature
- Basic extension features work regardless of OAuth status

---

## Checklist

### Before Publishing Extension:
- [ ] Run `npm run build`
- [ ] Test extension locally in Chrome
- [ ] Update version in `manifest.json`
- [ ] Create ZIP file from `dist/` folder
- [ ] Prepare store listing materials:
  - [ ] Screenshots (at least one)
  - [ ] Description and detailed description
  - [ ] Icon (128x128)
  - [ ] Promotional tiles (optional)

### For OAuth Verification (Can be done later):
- [ ] Create privacy policy (hosted on public URL)
- [ ] Create terms of service (if required)
- [ ] Complete OAuth consent screen with all fields
- [ ] Add privacy policy URL to consent screen
- [ ] Submit for verification (when ready)

---

## Recommended Timeline

1. **Week 1:** Build, test locally, publish to Chrome Web Store
2. **Week 2-3:** Keep OAuth in Testing, gather feedback from test users
3. **Week 4+:** Create privacy policy, submit OAuth for verification
4. **After verification:** Switch OAuth to Production, enable Google Drive for all users

---

## Troubleshooting

### Extension won't load locally
- Check that you selected the `dist/` folder, not the root project folder
- Ensure `npm run build` completed successfully
- Check browser console for errors

### Chrome Web Store submission rejected
- Review Chrome Web Store policies
- Ensure all required fields are filled
- Check permission justifications are clear

### OAuth verification issues
- Ensure privacy policy is publicly accessible
- Complete all required fields in consent screen
- Respond promptly to any Google requests for clarification

---

## Resources

- [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
- [Chrome Web Store Policies](https://developer.chrome.com/docs/webstore/program-policies)
- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth Verification Process](https://support.google.com/cloud/answer/9110914)

