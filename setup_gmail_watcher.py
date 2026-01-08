"""
Gmail Watcher Setup Helper

This script helps you set up the Gmail API credentials for the Personal AI Employee system.
"""
import os
import json
import webbrowser
from pathlib import Path

def create_gmail_setup_guide():
    """Create a detailed guide for setting up Gmail API credentials"""

    guide_content = """
# Gmail API Setup Guide for Personal AI Employee

## Overview
This guide will help you set up Google API credentials to enable the Gmail watcher in your Personal AI Employee system.

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
"""

    with open('GMAIL_SETUP_GUIDE.md', 'w', encoding='utf-8') as f:
        f.write(guide_content.strip())

    print("[OK] Created GMAIL_SETUP_GUIDE.md with detailed setup instructions")


def create_gmail_test_script():
    """Create a test script to verify Gmail setup"""

    test_script = '''
"""
Gmail Watcher Test Script

This script tests the Gmail watcher setup and authentication.
"""
import os
import sys
from pathlib import Path

# Add current directory to path to import local modules
sys.path.insert(0, str(Path(__file__).parent))

def test_gmail_setup():
    """Test the Gmail watcher setup"""
    print("Testing Gmail Watcher Setup...")
    print("=" * 40)

    # Check if credentials file exists
    credentials_path = Path("credentials.json")
    if not credentials_path.exists():
        print("❌ Error: credentials.json not found!")
        print("   Please follow the Gmail setup guide to create credentials.")
        print("   Run: python GMAIL_SETUP_GUIDE.md for detailed instructions")
        return False

    print("✅ Found credentials.json")

    # Try to import required modules
    try:
        import google.auth
        import google.auth.transport.requests
        import google.oauth2.credentials
        import google_auth_oauthlib.flow
        import googleapiclient.discovery
        print("✅ Required Google libraries are available")
    except ImportError as e:
        print(f"❌ Error importing Google libraries: {e}")
        print("   Install requirements with: pip install -r requirements.txt")
        return False

    # Try to initialize the Gmail watcher
    try:
        from gmail_watcher import GmailWatcher
        print("✅ GmailWatcher module imported successfully")

        # Initialize the watcher
        watcher = GmailWatcher()
        print("✅ GmailWatcher initialized")

        # Test authentication
        if watcher.service:
            print("✅ Gmail API service authenticated successfully")

            # Try to get basic account info
            try:
                profile = watcher.service.users().getProfile(userId='me').execute()
                print(f"✅ Connected to Gmail account: {profile.get('emailAddress', 'Unknown')}")

                # Try to get a few recent emails to verify permissions
                results = watcher.service.users().messages().list(
                    userId='me', maxResults=1).execute()
                messages = results.get('messages', [])
                print(f"✅ Successfully accessed mailbox - found {len(messages)} recent message(s)")

                return True
            except Exception as e:
                print(f"⚠️  Warning: Could not access Gmail data: {e}")
                print("   This might be due to insufficient OAuth scopes")
                return True  # Still return True if basic auth works
        else:
            print("❌ Failed to authenticate with Gmail API")
            return False

    except Exception as e:
        print(f"❌ Error initializing GmailWatcher: {e}")
        return False

def main():
    """Main function"""
    success = test_gmail_setup()

    print("\n" + "=" * 40)
    if success:
        print("🎉 Gmail watcher setup test completed successfully!")
        print("\nYou can now use the Gmail watcher with your Personal AI Employee system.")
        print("Run the full system with: python watcher_manager.py")
    else:
        print("❌ Gmail watcher setup test failed!")
        print("\nPlease check the errors above and follow the setup guide:")
        print("1. Ensure credentials.json is properly configured")
        print("2. Install required packages: pip install -r requirements.txt")
        print("3. Check GMAIL_SETUP_GUIDE.md for detailed instructions")

    return success

if __name__ == "__main__":
    main()
'''

    with open('test_gmail_setup.py', 'w', encoding='utf-8') as f:
        f.write(test_script)

    print("[OK] Created test_gmail_setup.py to verify Gmail setup")


def main():
    """Main setup function"""
    print("Setting up Gmail Watcher for Personal AI Employee...")
    print("-" * 50)

    create_gmail_setup_guide()
    create_gmail_test_script()

    print("-" * 50)
    print("Setup complete!")
    print("\nNext steps:")
    print("1. Read GMAIL_SETUP_GUIDE.md for detailed setup instructions")
    print("2. Create your Google Cloud project and OAuth credentials")
    print("3. Download credentials.json and place it in this directory")
    print("4. Test the setup with: python test_gmail_setup.py")
    print("\nThe Gmail watcher will create action files in /Needs_Action when new emails arrive.")


if __name__ == "__main__":
    main()