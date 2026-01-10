# Privacy Policy for DragTranslator

**Last Updated: January 11, 2026**

## Introduction

DragTranslator ("we", "our", or "the extension") is committed to protecting your privacy. This Privacy Policy explains how we handle data when you use our Chrome extension.

## Data Collection and Usage

### Data We Collect

DragTranslator collects and stores the following data **locally on your device only**:

1. **Translation History**: Original text and translated text that you choose to save
2. **User Preferences**: Your selected UI language and translation target language

### How We Use Your Data

- **Translation History**: Stored locally in your browser's storage (`chrome.storage.local`) to allow you to review past translations
- **User Preferences**: Stored in Chrome's sync storage (`chrome.storage.sync`) to maintain your language settings across devices

### Data Storage

- All data is stored **locally in your browser**
- Translation history is stored in `chrome.storage.local` (device-only)
- Language preferences are stored in `chrome.storage.sync` (synced across your Chrome browsers if you're signed in)
- We do **NOT** have access to your data
- We do **NOT** transmit your data to any remote servers we control

### Third-Party Services

DragTranslator uses the following third-party services for translation:

1. **Google Translate API** (https://translate.googleapis.com)
   - Text you choose to translate is sent to Google's servers
   - Subject to [Google's Privacy Policy](https://policies.google.com/privacy)

2. **MyMemory Translation API** (https://mymemory.translated.net) - Fallback service
   - Used only if Google Translate fails
   - Subject to MyMemory's privacy policy

3. **LibreTranslate API** (https://libretranslate.de) - Secondary fallback
   - Used only if both Google Translate and MyMemory fail
   - Subject to LibreTranslate's privacy policy

**Important**: We do not control these third-party services and are not responsible for their privacy practices.

## Data Sharing

We do **NOT**:
- Sell your data to third parties
- Share your data with advertisers
- Collect analytics or tracking data
- Require account creation or login

## Data Retention

- Translation history is stored indefinitely in your local browser storage until you manually delete it
- You can delete individual translations or all translations at any time through the extension's interface
- Language preferences remain until you change them or uninstall the extension

## Your Rights

You have the right to:
- **Access** your data: View all saved translations in the extension popup
- **Delete** your data: Remove individual or all translations through the extension
- **Export** your data: Use the export feature to download your translation history
- **Opt-out**: Simply don't save translations if you don't want data stored

## Data Security

- All data is stored using Chrome's secure storage APIs
- No data is transmitted to servers we control
- Translation requests are sent via HTTPS to third-party translation services

## Children's Privacy

DragTranslator does not knowingly collect any personal information from children under 13 years of age.

## Changes to This Privacy Policy

We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated "Last Updated" date.

## Contact Us

If you have questions about this Privacy Policy, please contact us by:
- Opening an issue on our [GitHub repository](https://github.com/baek0203/DragTranslator)
- Submitting feedback through our [feedback form](https://forms.gle/EzyJPL7aD3wKY8X49)

## Permissions Explanation

DragTranslator requests the following permissions:

- **`storage`**: To save your translation history and language preferences locally
- **`activeTab`**: To inject translation functionality into the active webpage when you select text
- **`scripting`**: To add translation buttons when you select text on webpages
- **Host permission for `https://translate.googleapis.com/*`**: To send translation requests to Google Translate API

---

**Summary**: DragTranslator stores your translation history and preferences locally in your browser. We do not collect, transmit, or have access to your data. Translation requests are sent to third-party services (Google Translate, MyMemory, LibreTranslate) which have their own privacy policies.
