"""
Setup script for Personal AI Employee Watchers

This script helps configure the watcher system and handles missing dependencies
"""
import os
import json
from pathlib import Path

def create_missing_directories():
    """Create required directories if they don't exist"""
    dirs_to_create = [
        "Needs_Action",
        "Watched_Files",
        "Inbox",
        "Plans",
        "Pending_Approval",
        "Approved",
        "Rejected",
        "Done",
        "Logs",
        "Briefings",
        "Accounting"
    ]

    for directory in dirs_to_create:
        Path(directory).mkdir(exist_ok=True)
        print(f"[OK] Created directory: {directory}")

def check_dependencies():
    """Check if required dependencies are installed"""
    required_packages = [
        "google.auth.transport.requests",
        "google.oauth2.credentials",
        "google_auth_oauthlib.flow",
        "googleapiclient.discovery",
        "twilio.rest",
        "watchdog.observers",
        "requests"
    ]

    missing_packages = []
    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            missing_packages.append(package.split('.')[0])  # Get base package name

    if missing_packages:
        print(f"⚠ Missing packages: {', '.join(set(missing_packages))}")
        print("Install with: pip install -r requirements.txt")
        return False
    else:
        print("[OK] All dependencies available")
        return True

def create_placeholder_credentials():
    """Create placeholder credential files"""
    # Create a placeholder for Gmail credentials
    gmail_placeholder = {
        "web": {
            "client_id": "19456572897-vrrdr8f227m2ttur2c9n0sr1j3pcfbum.apps.googleusercontent.com",
            "project_id": "https://console.cloud.google.com/welcome?project=gen-lang-client-0496116036",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_secret": "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",
            "redirect_uris": ["urn:ietf:wg:oauth:2.0:oob", "http://localhost"]
        }
    }

    if not Path('credentials.json').exists():
        with open('credentials.json', 'w') as f:
            json.dump(gmail_placeholder, f, indent=2)
        print("[OK] Created placeholder credentials.json (update with your actual credentials)")

    # Create placeholder token file
    if not Path('token.json').exists():
        with open('token.json', 'w') as f:
            json.dump({}, f)
        print("[OK] Created placeholder token.json")

def update_watcher_manager():
    """Update the watcher manager to handle missing credentials gracefully"""
    watcher_manager_code = '''"""
Personal AI Employee - Watcher Manager

Manages all individual watchers and coordinates their operation
"""
import os
import sys
import time
import threading
import json
from datetime import datetime
from pathlib import Path

class WatcherManager:
    def __init__(self, config_file='watcher_config.json'):
        self.config = self.load_config(config_file)
        self.watchers = {}
        self.threads = {}
        self.running = False

    def load_config(self, config_file):
        """Load configuration from JSON file"""
        try:
            with open(config_file, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"Config file {config_file} not found. Creating default config.")
            default_config = {
                "gmail_enabled": True,
                "whatsapp_enabled": True,
                "bank_enabled": True,
                "file_drop_enabled": True,
                "gmail_interval": 300,  # 5 minutes
                "whatsapp_interval": 60,  # 1 minute
                "bank_interval": 600,  # 10 minutes
                "watch_directories": ["Watched_Files"],
                "needs_action_dir": "Needs_Action",
                "log_level": "INFO"
            }
            self.save_default_config(config_file, default_config)
            return default_config

    def save_default_config(self, config_file, default_config):
        """Save default configuration to file"""
        with open(config_file, 'w') as f:
            json.dump(default_config, f, indent=2)
        print(f"Default configuration saved to {config_file}")

    def initialize_watchers(self):
        """Initialize all enabled watchers"""
        # Import watchers with error handling
        if self.config.get('gmail_enabled', True):
            try:
                from gmail_watcher import GmailWatcher
                # Check if Gmail credentials exist before initializing
                if Path('credentials.json').exists():
                    self.watchers['gmail'] = GmailWatcher()
                    print("[OK] Gmail watcher initialized")
                else:
                    print("[WARN] Gmail watcher: credentials.json not found, skipping")
            except ImportError as e:
                print(f"Gmail watcher not available: {e}")
            except Exception as e:
                print(f"Gmail watcher initialization failed: {e}")

        if self.config.get('whatsapp_enabled', True):
            try:
                from whatsapp_watcher import WhatsAppWatcher
                self.watchers['whatsapp'] = WhatsAppWatcher()
                print("[OK] WhatsApp watcher initialized")
            except ImportError as e:
                print(f"WhatsApp watcher not available: {e}")
            except Exception as e:
                print(f"WhatsApp watcher initialization failed: {e}")

        if self.config.get('bank_enabled', True):
            try:
                from bank_watcher import BankWatcher
                self.watchers['bank'] = BankWatcher()
                print("[OK] Bank watcher initialized")
            except ImportError as e:
                print(f"Bank watcher not available: {e}")
            except Exception as e:
                print(f"Bank watcher initialization failed: {e}")

        if self.config.get('file_drop_enabled', True):
            try:
                from file_drop_watcher import FileDropWatcher
                # For file drop watcher, we'll run it in a separate thread
                self.watchers['file_drop'] = FileDropWatcher()
                print("[OK] File drop watcher initialized")
            except ImportError as e:
                print(f"File drop watcher not available: {e}")
            except Exception as e:
                print(f"File drop watcher initialization failed: {e}")

    def run_gmail_watcher(self):
        """Run Gmail watcher in a separate thread"""
        if 'gmail' in self.watchers:
            try:
                interval = self.config.get('gmail_interval', 300)
                self.watchers['gmail'].run_once()  # Run once initially
                while self.running:
                    time.sleep(interval)
                    self.watchers['gmail'].run_once()
            except Exception as e:
                print(f"Error in Gmail watcher: {e}")

    def run_whatsapp_watcher(self):
        """Run WhatsApp watcher in a separate thread"""
        if 'whatsapp' in self.watchers:
            try:
                interval = self.config.get('whatsapp_interval', 60)
                self.watchers['whatsapp'].run_once()  # Run once initially
                while self.running:
                    time.sleep(interval)
                    self.watchers['whatsapp'].run_once()
            except Exception as e:
                print(f"Error in WhatsApp watcher: {e}")

    def run_bank_watcher(self):
        """Run Bank watcher in a separate thread"""
        if 'bank' in self.watchers:
            try:
                interval = self.config.get('bank_interval', 600)
                self.watchers['bank'].run_once()  # Run once initially
                while self.running:
                    time.sleep(interval)
                    self.watchers['bank'].run_once()
            except Exception as e:
                print(f"Error in Bank watcher: {e}")

    def run_file_drop_watcher(self):
        """Run File Drop watcher"""
        if 'file_drop' in self.watchers:
            try:
                self.watchers['file_drop'].run()
            except Exception as e:
                print(f"Error in File Drop watcher: {e}")

    def start_all_watchers(self):
        """Start all enabled watchers"""
        print("Initializing watchers...")
        self.initialize_watchers()

        if not self.watchers:
            print("No watchers initialized. Check dependencies and credentials.")
            return

        print("Starting watchers...")
        self.running = True

        # Start threaded watchers
        if 'gmail' in self.watchers:
            gmail_thread = threading.Thread(target=self.run_gmail_watcher, daemon=True)
            gmail_thread.start()
            self.threads['gmail'] = gmail_thread
            print("[OK] Gmail watcher started")

        if 'whatsapp' in self.watchers:
            whatsapp_thread = threading.Thread(target=self.run_whatsapp_watcher, daemon=True)
            whatsapp_thread.start()
            self.threads['whatsapp'] = whatsapp_thread
            print("[OK] WhatsApp watcher started")

        if 'bank' in self.watchers:
            bank_thread = threading.Thread(target=self.run_bank_watcher, daemon=True)
            bank_thread.start()
            self.threads['bank'] = bank_thread
            print("[OK] Bank watcher started")

        # File drop watcher runs in main thread (it's event-based)
        if 'file_drop' in self.watchers:
            print("File drop watcher starting...")
            self.run_file_drop_watcher()
        else:
            print("No active watchers to run. Exiting.")
            self.running = False

    def stop_all_watchers(self):
        """Stop all watchers"""
        print("\\nStopping watchers...")
        self.running = False

        # Wait for threads to finish (with timeout)
        for name, thread in self.threads.items():
            thread.join(timeout=5)  # Wait up to 5 seconds
            if thread.is_alive():
                print(f"Warning: {name} watcher thread did not stop gracefully")

        print("All watchers stopped")

    def get_status(self):
        """Get status of all watchers"""
        status = {
            'timestamp': datetime.now().isoformat(),
            'running': self.running,
            'watchers': {}
        }

        for name in self.watchers:
            status['watchers'][name] = {
                'enabled': name in self.watchers,
                'thread_running': self.threads.get(name, threading.Thread()).is_alive() if name in self.threads else 'N/A'
            }

        return status

    def run(self):
        """Main run method"""
        print("Personal AI Employee - Watcher Manager Starting...")
        print("=" * 50)

        try:
            self.start_all_watchers()
        except KeyboardInterrupt:
            print("\\nReceived interrupt signal...")
        finally:
            if self.running:
                self.stop_all_watchers()
            print("Watcher Manager stopped.")

def main():
    """Main entry point"""
    manager = WatcherManager()
    manager.run()

if __name__ == "__main__":
    main()
'''

    with open('watcher_manager.py', 'w') as f:
        f.write(watcher_manager_code)
    print("[OK] Updated watcher_manager.py with error handling")

def main():
    print("Setting up Personal AI Employee Watchers...")
    print("-" * 40)

    create_missing_directories()
    check_dependencies()
    create_placeholder_credentials()
    update_watcher_manager()

    print("-" * 40)
    print("Setup complete!")
    print("\\nTo use the watchers:")
    print("1. Install dependencies: pip install -r requirements.txt")
    print("2. Update credentials.json with your Google API credentials")
    print("3. Update watcher_config.json with your API keys")
    print("4. Run: python watcher_manager.py")
    print("\\nFor Gmail setup, visit: https://developers.google.com/gmail/api/quickstart/python")
    print("For WhatsApp setup, visit: https://www.twilio.com/docs/whatsapp")

if __name__ == "__main__":
    main()