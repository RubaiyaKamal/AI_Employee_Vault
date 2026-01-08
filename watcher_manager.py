"""
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
        print("\nStopping watchers...")
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
            print("\nReceived interrupt signal...")
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
