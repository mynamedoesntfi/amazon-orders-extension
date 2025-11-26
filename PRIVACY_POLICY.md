# Privacy Policy for Amazon Orders Extension

**Last Updated:** November 26, 2025

## Introduction

Amazon Orders Extension ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, share, and protect your information when you use our Chrome extension. This policy applies to all users of the Amazon Orders Extension.

## Information We Collect

We collect information to provide and improve our services. The types of information we collect include:

### 1. Website Content (Order Data)
- **What we collect:** When you use the extension on Amazon's "Your Orders" pages, we extract order details including order numbers, dates, totals, shipping status, and product information (titles, images, quantities).
- **How we collect it:** The extension uses content scripts to read the HTML structure of the Amazon order pages you visit.
- **Why we collect it:** This data is collected solely to allow you to export your order history to CSV format for your own analysis and record-keeping.

### 2. Authentication Information
- **What we collect:** If you choose to use the Google Drive export feature, we use Google OAuth 2.0 authentication tokens.
- **How we collect it:** Via the Chrome Identity API and Google's OAuth service.
- **Why we collect it:** To authenticate your request to upload exported CSV files directly to your Google Drive account. We do not store your credentials.

### 3. Personal Information (Future Optional Feature)
- **What we collect:** If you opt-in to the dashboard feature, we may collect and store:
  - **Contact Information:** Name, email address, and phone number (extracted from order/shipping details).
  - **Location Data:** Shipping addresses and general location information.
  - **Order History:** Full purchase details including order numbers and items.
- **How we collect it:** Through secure transmission to our cloud storage, only after your explicit consent.
- **Why we collect it:** To provide advanced dashboard analytics, such as:
  - Spending breakdown by shipping location/address.
  - Purchase history analysis by recipient (family/friends).
  - Cross-device synchronization of your complete purchase profile.

**What We Do NOT Collect:**
- We do not collect health information.
- We do not collect financial information (credit card numbers, bank accounts) beyond the transaction totals visible on your order history.
- We do not collect personal communications.
- We do not track your web browsing history outside of Amazon order pages.

## How We Use Your Information

We use your information strictly for the extension's single purpose:

1. **To Provide the Service:**
   - Processing your Amazon order data to generate CSV export files.
   - Uploading files to your Google Drive (if authorized).

2. **To Improve the Service:**
   - (Future) Analyzing aggregated data to improve extraction accuracy (only with consent).

**Limited Use Policy:**
Our use of information received from Google APIs will adhere to the [Chrome Web Store User Data Policy](https://developer.chrome.com/docs/webstore/program-policies/policies#user_data), including the Limited Use requirements. We do not use your data for advertising or other unrelated purposes.

## Data Sharing and Disclosure

We do not sell your personal data. We only share data in the following limited circumstances:

1. **With Service Providers:**
   - **Google Drive:** If you choose to export to Google Drive, your data is sent directly to Google's servers via their API.
   - **Cloud Storage (Future):** If you opt-in to cloud features, data will be stored with our secure cloud provider.

2. **Legal Requirements:**
   - We may disclose information if required by law, such as to comply with a subpoena or legal process.

3. **No Sale of Data:**
   - We do not sell, trade, or rent your personal identification information to others.
   - We do not use your data for creditworthiness checks or lending purposes.

## Data Storage and Security

- **Local Processing:** Currently, all data processing happens locally within your browser. Your order data remains on your device until you choose to export it.
- **Data Security:** We use industry-standard security measures. All data transmission (e.g., to Google Drive) occurs over secure HTTPS connections.
- **Data Retention:** We do not retain your data on our servers. For future cloud features, we will retain data only as long as necessary to provide the service or until you delete it.

## Your Rights

You have control over your data:
- **Access:** You can view all extracted data in the CSV file.
- **Export:** You can download your data at any time.
- **Delete:** Currently, no data is stored on our servers to delete. For future cloud features, you will have the ability to delete your stored data entirely.
- **Revoke Access:** You can revoke the extension's access to your Google Drive at any time via your Google Account permissions.

## Changes to This Policy

We may update this Privacy Policy. If we make significant changes, we will notify you through the extension or the Chrome Web Store listing. The "Last Updated" date at the top of this policy indicates when the latest changes were made.

## Contact Us

If you have questions about this Privacy Policy, please contact us at:
- **GitHub:** https://github.com/mynamedoesntfi/amazon-orders-extension
- **Email:** nandanbhat12799@gmail.com

---
**Compliance:** This policy is designed to comply with the Chrome Web Store Developer Program Policies.

