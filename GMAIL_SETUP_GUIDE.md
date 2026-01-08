# Gmail API Setup Guide for Personal AI Employee

## Overview
This guide will help you set up Google API credentials to enable the Gmail watcher in your Personal AI Employee system.

⚠️ **IMPORTANT**: The credentials.json file currently contains placeholder values. You MUST follow the steps below to create actual Google API credentials before the Gmail watcher will work.

If you encounter the error "OAuth client was not found" or "invalid_client", it means your credentials.json file contains placeholder values and you need to follow the setup process below to obtain real Google API credentials.

## Step-by-Step Instructions

### 1. Create a Google Cloud Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" in the top navigation bar
3. Click "New Project"
4. Give your project a name (e.g., "Personal AI Employee")
5. Click "Create"

### 2. Enable the Gmail API
1. In your project dashboard, search for "Gmail API" in the search bar
2. Click on "Gmail API" in the results
3. Click "Enable" button

### 3. Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials" in the left sidebar
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Click "Configure Consent Screen"
   - Select "External" (unless you have a Google Workspace account)
   - Add your application name (e.g., "Personal AI Employee")
   - Add your email address
   - Click "Save and Continue"
   - Skip adding scopes for now (click "Save and Continue" twice)
   - Skip adding test users (click "Save and Continue")
   - Review and submit the consent screen

### 4. Configure OAuth 2.0 Client
1. Go back to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs" again
3. For Application type, select "Desktop application"
4. For Name, enter something like "Personal AI Employee Gmail Watcher"
5. Click "Create"
6. Download the credentials JSON file by clicking the download icon
7. Rename the downloaded file to `credentials.json`
8. Place `credentials.json` in your Personal AI Employee root directory

### 5. Verify Setup
1. Run the Gmail watcher for the first time:
   ```
   python -c "from gmail_watcher import GmailWatcher; w = GmailWatcher(); print('Gmail watcher initialized successfully')"
   ```
2. The first run will open a browser window asking you to authenticate
3. Follow the prompts to grant access to your Gmail account

## Security Best Practices

- Store `credentials.json` securely and never commit it to version control
- Use a dedicated Google account for the AI employee if privacy is a concern
- Regularly review the granted permissions in your Google account
- Consider using an app-specific password if using Gmail with 2FA

## Troubleshooting

### Common Issues:
1. **"Access Not Configured"**: Make sure you've enabled the Gmail API
2. **"Invalid Grant"**: Delete `token.json` and run the watcher again to re-authenticate
3. **"Scope Not Authorized"**: Check that your OAuth consent screen is properly configured

## Next Steps

Once you've completed the setup:
1. Run the Gmail watcher to authenticate: `python -c "from gmail_watcher import GmailWatcher; w = GmailWatcher(); w.run_once()"`
2. Test the full system: `python watcher_manager.py`
3. Monitor the `/Needs_Action` directory for new email notifications

Remember to keep your credentials secure and review Google's API usage limits.