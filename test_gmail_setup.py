
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
        print("[ERROR] Error: credentials.json not found!")
        print("   Please follow the Gmail setup guide to create credentials.")
        print("   Run: python GMAIL_SETUP_GUIDE.md for detailed instructions")
        return False

    print("[OK] Found credentials.json")

    # Try to import required modules
    try:
        import google.auth
        import google.auth.transport.requests
        import google.oauth2.credentials
        import google_auth_oauthlib.flow
        import googleapiclient.discovery
        print("[OK] Required Google libraries are available")
    except ImportError as e:
        print(f"[ERROR] Error importing Google libraries: {e}")
        print("   Install requirements with: pip install -r requirements.txt")
        return False

    # Try to initialize the Gmail watcher
    try:
        from gmail_watcher import GmailWatcher
        print("[OK] GmailWatcher module imported successfully")

        # Initialize the watcher
        watcher = GmailWatcher()
        print("[OK] GmailWatcher initialized")

        # Test authentication
        if watcher.service:
            print("[OK] Gmail API service authenticated successfully")

            # Try to get basic account info
            try:
                profile = watcher.service.users().getProfile(userId='me').execute()
                print(f"[OK] Connected to Gmail account: {profile.get('emailAddress', 'Unknown')}")

                # Try to get a few recent emails to verify permissions
                results = watcher.service.users().messages().list(
                    userId='me', maxResults=1).execute()
                messages = results.get('messages', [])
                print(f"[OK] Successfully accessed mailbox - found {len(messages)} recent message(s)")

                return True
            except Exception as e:
                print(f"[WARN] Warning: Could not access Gmail data: {e}")
                print("   This might be due to insufficient OAuth scopes")
                return True  # Still return True if basic auth works
        else:
            print("[ERROR] Failed to authenticate with Gmail API")
            return False

    except Exception as e:
        print(f"[ERROR] Error initializing GmailWatcher: {e}")
        return False

def main():
    """Main function"""
    success = test_gmail_setup()

    print("")
    print("=" * 40)
    if success:
        print("[SUCCESS] Gmail watcher setup test completed successfully!")
        print("")
        print("You can now use the Gmail watcher with your Personal AI Employee system.")
        print("Run the full system with: python watcher_manager.py")
    else:
        print("[ERROR] Gmail watcher setup test failed!")
        print("")
        print("Please check the errors above and follow the setup guide:")
        print("1. Ensure credentials.json is properly configured")
        print("2. Install required packages: pip install -r requirements.txt")
        print("3. Check GMAIL_SETUP_GUIDE.md for detailed instructions")

    return success

if __name__ == "__main__":
    main()
