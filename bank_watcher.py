"""
Bank Transaction Watcher for Personal AI Employee System

Monitors bank accounts for new transactions and creates action files in /Needs_Action
"""
import os
import time
import json
from datetime import datetime, timedelta
import sqlite3
from pathlib import Path
import requests
from typing import List, Dict, Optional

class BankWatcher:
    def __init__(self, config_file='watcher_config.json'):
        self.config = self.load_config(config_file)
        self.db_path = Path('.bank_transactions.db')
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
                "bank_apis": {},
                "account_types": ["checking", "savings", "credit"]
            }

    def init_database(self):
        """Initialize SQLite database to track processed transactions"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS processed_transactions (
                transaction_id TEXT PRIMARY KEY,
                account_number TEXT,
                amount REAL,
                description TEXT,
                timestamp REAL,
                processed_at REAL
            )
        ''')
        conn.commit()
        conn.close()

    def get_last_check_time(self):
        """Get timestamp of last check from file or return current time"""
        try:
            with open('.bank_last_check', 'r') as f:
                return float(f.read().strip())
        except FileNotFoundError:
            return time.time()

    def save_last_check_time(self, timestamp):
        """Save timestamp of last check"""
        with open('.bank_last_check', 'w') as f:
            f.write(str(timestamp))

    def is_transaction_processed(self, transaction_id: str) -> bool:
        """Check if transaction has already been processed"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT 1 FROM processed_transactions WHERE transaction_id = ?", (transaction_id,))
        result = cursor.fetchone()
        conn.close()
        return result is not None

    def mark_transaction_processed(self, transaction_data: Dict):
        """Mark transaction as processed"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute(
            """INSERT OR IGNORE INTO processed_transactions
            (transaction_id, account_number, amount, description, timestamp, processed_at)
            VALUES (?, ?, ?, ?, ?, ?)""",
            (
                transaction_data['id'],
                transaction_data['account_number'],
                transaction_data['amount'],
                transaction_data['description'],
                transaction_data['timestamp'],
                time.time()
            )
        )
        conn.commit()
        conn.close()

    def get_mock_transactions(self) -> List[Dict]:
        """Generate mock bank transactions for demonstration"""
        # This is a mock implementation - in real usage, you'd connect to actual bank APIs
        # using secure methods like Plaid, Yodlee, or direct bank integrations

        transactions = []

        # Simulate checking for new transactions since last check
        current_time = time.time()
        if current_time - self.last_check_time > 300:  # 5 minutes
            # Add some mock transactions if it's been a while
            mock_transactions = [
                {
                    "id": f"txn_{int(current_time)}_1",
                    "account_number": "****1234",
                    "amount": -45.67,
                    "description": "Amazon Purchase",
                    "timestamp": current_time - 120,  # 2 minutes ago
                    "category": "Shopping",
                    "type": "debit"
                },
                {
                    "id": f"txn_{int(current_time)}_2",
                    "account_number": "****5678",
                    "amount": 1200.00,
                    "description": "Salary Deposit",
                    "timestamp": current_time - 300,  # 5 minutes ago
                    "category": "Income",
                    "type": "credit"
                }
            ]
            transactions.extend(mock_transactions)

        return transactions

    def get_transactions_from_api(self) -> List[Dict]:
        """Get transactions from configured bank APIs"""
        transactions = []

        # This is where you'd implement actual bank API connections
        # For security reasons, real bank connections would require:
        # - OAuth or secure credential storage
        # - Proper encryption
        # - Compliance with financial regulations

        # For now, using mock data as example
        return self.get_mock_transactions()

    def determine_priority(self, transaction: Dict) -> str:
        """Determine priority based on transaction amount and type"""
        amount = abs(transaction['amount'])

        # High priority for large amounts or unusual patterns
        if amount > 1000:
            return "high"
        elif amount > 100:
            return "normal"
        else:
            return "normal"

    def create_action_file(self, transaction_data: Dict):
        """Create action file in /Needs_Action directory"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"bank_{timestamp}_{transaction_data['id'][:8]}.md"
        filepath = os.path.join("Needs_Action", filename)

        priority = self.determine_priority(transaction_data)

        content = f"""---
type: bank
priority: {priority}
status: pending
account: "{transaction_data['account_number']}"
amount: {transaction_data['amount']}
category: "{transaction_data['category']}"
---

## Bank Transaction

**Account:** {transaction_data['account_number']}
**Amount:** ${transaction_data['amount']:.2f}
**Description:** {transaction_data['description']}
**Category:** {transaction_data['category']}
**Date:** {datetime.fromtimestamp(transaction_data['timestamp']).isoformat()}

### Transaction Details
- **Type:** {"Debit" if transaction_data['amount'] < 0 else "Credit"}
- **Amount:** ${abs(transaction_data['amount']):.2f}
- **Date:** {datetime.fromtimestamp(transaction_data['timestamp']).strftime('%Y-%m-%d %H:%M:%S')}

---
**Automatically generated by Bank Watcher at {datetime.now().isoformat()}**
"""

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

        print(f"Created action file: {filepath}")

    def run_once(self):
        """Run one check cycle"""
        print("Checking bank accounts for new transactions...")
        new_transactions = self.get_transactions_from_api()

        processed_count = 0
        for txn_data in new_transactions:
            if not self.is_transaction_processed(txn_data['id']):
                self.create_action_file(txn_data)
                self.mark_transaction_processed(txn_data)
                processed_count += 1

        # Update last check time
        self.save_last_check_time(time.time())
        print(f"Processed {processed_count} new bank transactions")

    def run(self, interval=600):  # Default 10 minutes
        """Run continuously with specified interval"""
        print("Starting Bank Watcher...")
        while True:
            try:
                self.run_once()
                time.sleep(interval)
            except KeyboardInterrupt:
                print("Bank Watcher stopped by user")
                break
            except Exception as e:
                print(f"Error in Bank Watcher: {e}")
                time.sleep(300)  # Wait 5 minutes before retrying

if __name__ == "__main__":
    watcher = BankWatcher()
    watcher.run()