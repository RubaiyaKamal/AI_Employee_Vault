"""
Gmail Authentication Helper

This script helps authenticate the Gmail API for the first time.
"""
import os
import sys
from pathlib import Path

# Add current directory to path to import local modules
sys.path.insert(0, str(Path(__file__).parent))

def authenticate_gmail():
    """Run the Gmail authentication process"""
    print("Gmail API Authentication for Personal AI Employee")
    print("=" * 50)
    print("This script will guide you through the first-time Gmail API setup.")
    print("")

    # Check if credentials.json exists
    if not Path('credentials.json').exists():
        print("[ERROR] credentials.json not found!")
        print("Please follow the Gmail setup guide to create credentials first.")
        print("Read: GMAIL_SETUP_GUIDE.md for instructions.")
        return False

    print("[OK] Found credentials.json")
    print("")

    # Import required modules
    try:
        import google.auth
        import google.auth.transport.requests
        import google.oauth2.credentials
        import google_auth_oauthlib.flow
        import googleapiclient.discovery
    except ImportError as e:
        print(f"[ERROR] Missing Google libraries: {e}")
        print("Install with: pip install -r requirements.txt")
        return False

    print("[OK] Google libraries available")
    print("")

    # Try to authenticate using the Gmail watcher's authentication method
    try:
        from google.auth.transport.requests import Request
        from google.oauth2.credentials import Credentials
        from google_auth_oauthlib.flow import InstalledAppFlow
        from googleapiclient.discovery import build

        SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']

        creds = None

        # Check if token.json exists (user's authentication token)
        if Path('token.json').exists():
            print("[OK] Found existing token.json (previously authenticated user)")
            creds = Credentials.from_authorized_user_file('token.json', SCOPES)
        else:
            print("[INFO] No existing authentication token found.")
            print("You will need to authenticate for the first time.")
            print("")

        # If there are no valid credentials, request authorization
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                print("[INFO] Refreshing expired credentials...")
                creds.refresh(Request())
            else:
                print("[INFO] Starting OAuth flow...")
                print("A browser window will open to complete authentication.")
                print("Please allow access to your Gmail account.")
                print("")

                # This will open the browser for authentication
                flow = InstalledAppFlow.from_client_secrets_file(
                    'credentials.json', SCOPES)
                creds = flow.run_local_server(port=0)

                print("[OK] Authentication completed successfully!")

            # Save credentials for next run
            print("[INFO] Saving authentication token...")
            with open('token.json', 'w') as token:
                token.write(creds.to_json())
                print("[OK] Authentication token saved to token.json")

        # Test the connection
        print("[INFO] Testing Gmail API connection...")
        service = build('gmail', 'v1', credentials=creds)

        # Get basic profile info
        profile = service.users().getProfile(userId='me').execute()
        print(f"[SUCCESS] Connected to Gmail account: {profile.get('emailAddress', 'Unknown')}")

        # Test getting messages
        results = service.users().messages().list(userId='me', maxResults=1).execute()
        messages = results.get('messages', [])
        print(f"[OK] Successfully accessed mailbox - found {len(messages)} recent message(s)")

        print("")
        print("=" * 50)
        print("[SUCCESS] Gmail authentication completed successfully!")
        print("")
        print("The Gmail watcher is now ready to use with your Personal AI Employee system.")
        print("Run the full system with: python watcher_manager.py")
        print("")
        print("The Gmail watcher will now monitor your inbox and create action files")
        print("in the /Needs_Action directory when new emails arrive.")

        return True

    except Exception as e:
        print(f"[ERROR] Authentication failed: {e}")
        print("")
        print("Troubleshooting tips:")
        print("1. Make sure your credentials.json is properly configured")
        print("2. Check that you've enabled the Gmail API in Google Cloud Console")
        print("3. Verify that your OAuth consent screen is properly configured")
        print("4. See GMAIL_SETUP_GUIDE.md for detailed instructions")
        return False

def main():
    """Main function"""
    success = authenticate_gmail()

    if not success:
        print("\nAuthentication failed. Please resolve the issues above and try again.")
        return 1

    return 0

if __name__ == "__main__":
    exit(main())