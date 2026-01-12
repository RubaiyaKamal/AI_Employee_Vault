"""
LinkedIn Watcher for Personal AI Employee System

Monitors LinkedIn for:
- New messages and connection requests
- Post engagement (likes, comments, shares)
- Suggested content opportunities

Creates action files in /Needs_Action and posting suggestions
"""
import os
import time
import json
from datetime import datetime
import sqlite3
from pathlib import Path
import requests
from requests_oauthlib import OAuth2Session

class LinkedInWatcher:
    def __init__(self, config_file='watcher_config.json'):
        self.config = self.load_config(config_file)
        self.access_token = None
        self.db_path = Path('.linkedin_messages.db')
        self.init_database()
        self.last_check_time = self.get_last_check_time()
        self.base_url = "https://api.linkedin.com/v2"

    def load_config(self, config_file):
        """Load configuration from JSON file"""
        try:
            with open(config_file, 'r') as f:
                config = json.load(f)
                return config
        except FileNotFoundError:
            print(f"Config file {config_file} not found. Using defaults.")
            return {}

    def authenticate(self):
        """Authenticate with LinkedIn OAuth 2.0"""
        # Check for existing access token
        token_file = '.linkedin_token.json'

        if os.path.exists(token_file):
            with open(token_file, 'r') as f:
                token_data = json.load(f)
                self.access_token = token_data.get('access_token')

                # Check if token is expired
                expires_at = token_data.get('expires_at', 0)
                if time.time() < expires_at:
                    return True

        # Get credentials from config
        client_id = self.config.get('linkedin_client_id')
        client_secret = self.config.get('linkedin_client_secret')

        if not client_id or not client_secret:
            print("LinkedIn credentials not found in config.")
            print("\nTo set up LinkedIn integration:")
            print("1. Create a LinkedIn App at https://www.linkedin.com/developers/apps")
            print("2. Add redirect URL: http://localhost:8080/callback")
            print("3. Request r_liteprofile, r_emailaddress, w_member_social, r_organization_social permissions")
            print("4. Add linkedin_client_id and linkedin_client_secret to watcher_config.json")
            return False

        # OAuth flow
        redirect_uri = 'http://localhost:8080/callback'
        authorization_base_url = 'https://www.linkedin.com/oauth/v2/authorization'
        token_url = 'https://www.linkedin.com/oauth/v2/accessToken'

        scope = ['r_liteprofile', 'r_emailaddress', 'w_member_social', 'r_organization_social']

        linkedin = OAuth2Session(client_id, scope=scope, redirect_uri=redirect_uri)

        # Get authorization URL
        authorization_url, state = linkedin.authorization_url(authorization_base_url)

        print(f"\nPlease visit this URL to authorize the app:\n{authorization_url}\n")

        # For now, return False and require manual setup
        # In production, this would handle the OAuth callback
        return False

    def init_database(self):
        """Initialize SQLite database to track processed items"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Messages table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS processed_messages (
                id TEXT PRIMARY KEY,
                timestamp REAL,
                processed_at REAL
            )
        ''')

        # Engagement table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS processed_engagement (
                id TEXT PRIMARY KEY,
                type TEXT,
                timestamp REAL,
                processed_at REAL
            )
        ''')

        # Posted content table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS posted_content (
                id TEXT PRIMARY KEY,
                content TEXT,
                posted_at REAL,
                engagement_count INTEGER DEFAULT 0
            )
        ''')

        conn.commit()
        conn.close()

    def get_last_check_time(self):
        """Get timestamp of last check"""
        try:
            with open('.linkedin_last_check', 'r') as f:
                return float(f.read().strip())
        except FileNotFoundError:
            return time.time() - 86400  # Default to 24 hours ago

    def save_last_check_time(self, timestamp):
        """Save timestamp of last check"""
        with open('.linkedin_last_check', 'w') as f:
            f.write(str(timestamp))

    def is_item_processed(self, item_id, table='processed_messages'):
        """Check if item has already been processed"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute(f"SELECT 1 FROM {table} WHERE id = ?", (item_id,))
        result = cursor.fetchone()
        conn.close()
        return result is not None

    def mark_item_processed(self, item_id, table='processed_messages', item_type=None):
        """Mark item as processed"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        if table == 'processed_engagement':
            cursor.execute(
                f"INSERT OR IGNORE INTO {table} (id, type, timestamp, processed_at) VALUES (?, ?, ?, ?)",
                (item_id, item_type, time.time(), time.time())
            )
        else:
            cursor.execute(
                f"INSERT OR IGNORE INTO {table} (id, timestamp, processed_at) VALUES (?, ?, ?)",
                (item_id, time.time(), time.time())
            )

        conn.commit()
        conn.close()

    def get_profile_info(self):
        """Get LinkedIn profile information"""
        if not self.access_token:
            return None

        headers = {'Authorization': f'Bearer {self.access_token}'}

        try:
            response = requests.get(f"{self.base_url}/me", headers=headers)
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Error fetching profile: {response.status_code}")
                return None
        except Exception as e:
            print(f"Error: {e}")
            return None

    def generate_content_suggestions(self):
        """Generate LinkedIn post suggestions based on business context"""
        suggestions = []

        # Read recent activity from Needs_Action and Done folders
        recent_projects = self.analyze_recent_work()

        if not recent_projects:
            # Default content ideas
            suggestions = [
                {
                    'type': 'post_suggestion',
                    'topic': 'AI Automation Success',
                    'content_idea': 'Share how AI is transforming your workflow and productivity',
                    'hashtags': ['#AI', '#Automation', '#Productivity', '#BusinessGrowth'],
                    'priority': 'normal'
                },
                {
                    'type': 'post_suggestion',
                    'topic': 'Industry Insights',
                    'content_idea': 'Share insights about trends in your industry',
                    'hashtags': ['#BusinessStrategy', '#Innovation', '#Leadership'],
                    'priority': 'low'
                }
            ]
        else:
            # Generate suggestions based on actual work
            for project in recent_projects[:3]:
                suggestions.append({
                    'type': 'post_suggestion',
                    'topic': f"Project Update: {project['name']}",
                    'content_idea': f"Share progress or learnings from {project['name']}",
                    'hashtags': ['#ProjectManagement', '#Success', '#BusinessGrowth'],
                    'priority': 'normal',
                    'context': project
                })

        return suggestions

    def analyze_recent_work(self):
        """Analyze recent work from Done folder to generate content ideas"""
        done_dir = Path('Done')
        if not done_dir.exists():
            return []

        projects = []
        cutoff_time = time.time() - 604800  # Last 7 days

        try:
            for file in done_dir.glob('*.md'):
                if file.stat().st_mtime > cutoff_time:
                    # Basic project info extraction
                    projects.append({
                        'name': file.stem,
                        'completed_at': file.stat().st_mtime
                    })
        except Exception as e:
            print(f"Error analyzing recent work: {e}")

        return projects

    def create_action_file(self, item_data):
        """Create action file in /Needs_Action directory"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        item_type = item_data.get('type', 'linkedin')
        item_id = item_data.get('id', 'unknown')[:8]

        filename = f"{item_type}_{timestamp}_{item_id}.md"
        filepath = os.path.join("Needs_Action", filename)

        if item_data['type'] == 'post_suggestion':
            content = f"""---
type: linkedin_post_suggestion
priority: {item_data.get('priority', 'normal')}
status: pending
topic: "{item_data['topic']}"
auto_generated: true
---

## LinkedIn Post Suggestion

**Topic:** {item_data['topic']}

**Content Idea:**
{item_data['content_idea']}

**Suggested Hashtags:**
{' '.join(item_data.get('hashtags', []))}

**Instructions for Claude:**
1. Review this suggestion
2. Create a draft LinkedIn post (150-300 words)
3. Make it engaging and professional
4. Include a call-to-action
5. Create approval request in /Pending_Approval

---
**Automatically generated by LinkedIn Watcher at {datetime.now().isoformat()}**
"""
        elif item_data['type'] == 'message':
            content = f"""---
type: linkedin_message
priority: high
status: pending
from: "{item_data.get('from', 'Unknown')}"
---

## LinkedIn Message

**From:** {item_data.get('from', 'Unknown')}
**Received:** {datetime.fromtimestamp(item_data.get('timestamp', time.time())).isoformat()}

{item_data.get('body', '[Message content]')}

---
**Automatically generated by LinkedIn Watcher at {datetime.now().isoformat()}**
"""
        else:
            content = f"""---
type: {item_data['type']}
priority: normal
status: pending
---

## LinkedIn Activity

{json.dumps(item_data, indent=2)}

---
**Automatically generated by LinkedIn Watcher at {datetime.now().isoformat()}**
"""

        os.makedirs("Needs_Action", exist_ok=True)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

        print(f"Created action file: {filepath}")
        return filepath

    def run_once(self):
        """Run one check cycle"""
        print("LinkedIn Watcher checking for activity...")

        # Generate content suggestions (this works without API access)
        suggestions = self.generate_content_suggestions()

        # Only create one suggestion per day
        suggestion_marker = '.linkedin_suggestion_today'
        today = datetime.now().date().isoformat()

        create_suggestion = True
        if os.path.exists(suggestion_marker):
            with open(suggestion_marker, 'r') as f:
                last_suggestion = f.read().strip()
                if last_suggestion == today:
                    create_suggestion = False

        if create_suggestion and suggestions:
            # Create one suggestion
            suggestion = suggestions[0]
            suggestion['id'] = f"suggestion_{int(time.time())}"
            self.create_action_file(suggestion)

            # Mark that we created a suggestion today
            with open(suggestion_marker, 'w') as f:
                f.write(today)

        # If authenticated, check for messages and engagement
        if self.access_token:
            # This would fetch actual LinkedIn data
            # For now, we'll skip this part
            print("LinkedIn API access configured - would check messages and engagement")
        else:
            print("LinkedIn API not configured - generating content suggestions only")
            print("To enable full LinkedIn monitoring, configure linkedin_client_id and linkedin_client_secret")

        # Update last check time
        self.save_last_check_time(time.time())
        print(f"LinkedIn watcher cycle complete")

    def run(self, interval=3600):  # Default 1 hour
        """Run continuously with specified interval"""
        print("Starting LinkedIn Watcher...")
        print("Mode: Content Suggestion Generator (API integration optional)")

        while True:
            try:
                self.run_once()
                time.sleep(interval)
            except KeyboardInterrupt:
                print("\nLinkedIn Watcher stopped by user")
                break
            except Exception as e:
                print(f"Error in LinkedIn Watcher: {e}")
                time.sleep(300)  # Wait 5 minutes before retrying

if __name__ == "__main__":
    watcher = LinkedInWatcher()
    watcher.run()
