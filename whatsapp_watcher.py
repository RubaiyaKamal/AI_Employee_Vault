"""
WhatsApp Watcher for Personal AI Employee System

Monitors WhatsApp for new messages and creates action files in /Needs_Action
"""
import os
import time
import json
from datetime import datetime
from twilio.rest import Client
import sqlite3
from pathlib import Path

class WhatsAppWatcher:
    def __init__(self, config_file='watcher_config.json'):
        self.config = self.load_config(config_file)
        self.twilio_client = self.setup_twilio()
        self.db_path = Path('.whatsapp_messages.db')
        self.init_database()
        self.last_check_time = self.get_last_check_time()

    def load_config(self, config_file):
        """Load configuration from JSON file"""
        try:
            with open(config_file, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"Config file {config_file} not found. Using defaults.")
            return {
                "twilio_account_sid": os.getenv("TWILIO_ACCOUNT_SID"),
                "twilio_auth_token": os.getenv("TWILIO_AUTH_TOKEN"),
                "whatsapp_number": os.getenv("WHATSAPP_NUMBER")
            }

    def setup_twilio(self):
        """Setup Twilio client for WhatsApp API"""
        account_sid = self.config.get("twilio_account_sid")
        auth_token = self.config.get("twilio_auth_token")

        if not account_sid or not auth_token:
            print("Twilio credentials not found in config. WhatsApp watcher disabled.")
            return None

        return Client(account_sid, auth_token)

    def init_database(self):
        """Initialize SQLite database to track processed messages"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS processed_messages (
                sid TEXT PRIMARY KEY,
                timestamp REAL,
                processed_at REAL
            )
        ''')
        conn.commit()
        conn.close()

    def get_last_check_time(self):
        """Get timestamp of last check from file or return current time"""
        try:
            with open('.whatsapp_last_check', 'r') as f:
                return float(f.read().strip())
        except FileNotFoundError:
            return time.time()

    def save_last_check_time(self, timestamp):
        """Save timestamp of last check"""
        with open('.whatsapp_last_check', 'w') as f:
            f.write(str(timestamp))

    def is_message_processed(self, sid):
        """Check if message has already been processed"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT 1 FROM processed_messages WHERE sid = ?", (sid,))
        result = cursor.fetchone()
        conn.close()
        return result is not None

    def mark_message_processed(self, sid):
        """Mark message as processed"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT OR IGNORE INTO processed_messages (sid, timestamp, processed_at) VALUES (?, ?, ?)",
            (sid, time.time(), time.time())
        )
        conn.commit()
        conn.close()

    def get_new_messages(self):
        """Get new WhatsApp messages since last check"""
        if not self.twilio_client:
            return []

        # Convert timestamp to date string for Twilio API
        from_date = datetime.fromtimestamp(self.last_check_time).date()

        try:
            messages = self.twilio_client.messages.list(
                from_="whatsapp:+14155238886",  # Twilio WhatsApp sandbox
                date_sent_after=from_date,
                limit=50
            )

            new_messages = []
            for msg in messages:
                if not self.is_message_processed(msg.sid):
                    new_messages.append({
                        'sid': msg.sid,
                        'from_num': msg.from_,
                        'to_num': msg.to,
                        'body': msg.body,
                        'timestamp': msg.date_sent.timestamp() if msg.date_sent else time.time(),
                        'media_urls': [media.uri for media in msg.media_list] if hasattr(msg, 'media_list') else []
                    })

            return new_messages
        except Exception as e:
            print(f"Error fetching WhatsApp messages: {e}")
            return []

    def create_action_file(self, message_data):
        """Create action file in /Needs_Action directory"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"whatsapp_{timestamp}_{message_data['sid'][:8]}.md"
        filepath = os.path.join("Needs_Action", filename)

        media_section = ""
        if message_data['media_urls']:
            media_section = "\n## Media Attachments\n"
            for url in message_data['media_urls']:
                media_section += f"- {url}\n"

        content = f"""---
type: whatsapp
priority: normal
status: pending
from: "{message_data['from_num']}"
to: "{message_data['to_num']}"
---

## WhatsApp Message

**From:** {message_data['from_num']}
**To:** {message_data['to_num']}

{message_data['body']}

{media_section}
---
**Automatically generated by WhatsApp Watcher at {datetime.now().isoformat()}**
"""

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

        print(f"Created action file: {filepath}")

    def run_once(self):
        """Run one check cycle"""
        if not self.twilio_client:
            print("Twilio client not configured, skipping WhatsApp check")
            return

        print("Checking WhatsApp for new messages...")
        new_messages = self.get_new_messages()

        for msg_data in new_messages:
            self.create_action_file(msg_data)
            self.mark_message_processed(msg_data['sid'])

        # Update last check time
        self.save_last_check_time(time.time())
        print(f"Checked {len(new_messages)} new WhatsApp messages")

    def run(self, interval=60):  # Default 1 minute
        """Run continuously with specified interval"""
        print("Starting WhatsApp Watcher...")
        while True:
            try:
                self.run_once()
                time.sleep(interval)
            except KeyboardInterrupt:
                print("WhatsApp Watcher stopped by user")
                break
            except Exception as e:
                print(f"Error in WhatsApp Watcher: {e}")
                time.sleep(60)  # Wait 1 minute before retrying

if __name__ == "__main__":
    watcher = WhatsAppWatcher()
    watcher.run()