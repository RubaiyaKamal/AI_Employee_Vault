"""
File Drop Watcher for Personal AI Employee System

Monitors specified directories for new files and creates action files in /Needs_Action
"""
import os
import time
import json
from datetime import datetime
from pathlib import Path
import hashlib
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class FileDropHandler(FileSystemEventHandler):
    def __init__(self, watched_dirs, needs_action_dir="Needs_Action"):
        self.watched_dirs = [Path(d) for d in watched_dirs]
        self.needs_action_dir = Path(needs_action_dir)
        self.processed_files = set()
        self.db_path = Path('.watched_files.db')
        self.init_database()

    def init_database(self):
        """Initialize database to track processed files"""
        import sqlite3
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS processed_files (
                filepath TEXT PRIMARY KEY,
                hash TEXT,
                timestamp REAL,
                processed_at REAL
            )
        ''')
        conn.commit()
        conn.close()

    def get_file_hash(self, filepath):
        """Calculate MD5 hash of file"""
        hash_md5 = hashlib.md5()
        try:
            with open(filepath, "rb") as f:
                for chunk in iter(lambda: f.read(4096), b""):
                    hash_md5.update(chunk)
            return hash_md5.hexdigest()
        except Exception:
            return None

    def is_file_processed(self, filepath):
        """Check if file has already been processed"""
        import sqlite3
        file_hash = self.get_file_hash(filepath)
        if not file_hash:
            return False

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT 1 FROM processed_files WHERE filepath = ? AND hash = ?", (str(filepath), file_hash))
        result = cursor.fetchone()
        conn.close()
        return result is not None

    def mark_file_processed(self, filepath):
        """Mark file as processed"""
        import sqlite3
        file_hash = self.get_file_hash(filepath)
        if not file_hash:
            return

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT OR REPLACE INTO processed_files (filepath, hash, timestamp, processed_at) VALUES (?, ?, ?, ?)",
            (str(filepath), file_hash, filepath.stat().st_mtime, time.time())
        )
        conn.commit()
        conn.close()

    def should_process_file(self, filepath):
        """Determine if file should be processed"""
        path = Path(filepath)

        # Skip temporary and system files
        if path.name.startswith('.'):
            return False
        if path.suffix.lower() in ['.tmp', '.swp', '.lock']:
            return False
        if path.name.endswith('~'):
            return False

        # Skip if already processed
        if self.is_file_processed(path):
            return False

        return True

    def create_action_file(self, filepath):
        """Create action file in /Needs_Action directory"""
        path = Path(filepath)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_id = path.name.replace('.', '_').replace(' ', '_')[:20]
        filename = f"file_drop_{timestamp}_{file_id}.md"
        action_filepath = self.needs_action_dir / filename

        # Get file details
        stat = path.stat()
        size = stat.st_size
        mod_time = datetime.fromtimestamp(stat.st_mtime).isoformat()

        # Determine file type based on extension
        if path.suffix.lower() in ['.pdf', '.doc', '.docx', '.txt', '.rtf']:
            file_type = "document"
        elif path.suffix.lower() in ['.jpg', '.jpeg', '.png', '.gif', '.bmp']:
            file_type = "image"
        elif path.suffix.lower() in ['.mp4', '.avi', '.mov', '.mkv']:
            file_type = "video"
        elif path.suffix.lower() in ['.mp3', '.wav', '.flac']:
            file_type = "audio"
        else:
            file_type = "other"

        # Determine priority based on file type and size
        priority = "normal"
        if size > 100 * 1024 * 1024:  # 100MB
            priority = "high"
        elif file_type in ["document", "image"]:
            priority = "normal"
        else:
            priority = "normal"

        content = f"""---
type: file
priority: {priority}
status: pending
source_file: "{filepath}"
file_type: "{file_type}"
file_size: {size}
---

## File Drop Notification

**Source:** {filepath}
**Type:** {file_type}
**Size:** {size:,} bytes
**Modified:** {mod_time}

### File Details
- **Original Name:** {path.name}
- **Extension:** {path.suffix}
- **Directory:** {path.parent}
- **Size:** {size / (1024*1024):.2f} MB

### Content Preview
```
File content would be analyzed here if text-based.
For binary files, metadata is captured.
```

---
**Automatically generated by File Drop Watcher at {datetime.now().isoformat()}**
"""

        with open(action_filepath, 'w', encoding='utf-8') as f:
            f.write(content)

        print(f"Created action file: {action_filepath}")

    def on_created(self, event):
        """Handle file creation events"""
        if event.is_directory:
            return

        filepath = Path(event.src_path)
        if self.should_process_file(filepath):
            print(f"New file detected: {filepath}")
            self.create_action_file(filepath)
            self.mark_file_processed(filepath)

    def on_moved(self, event):
        """Handle file move events"""
        if event.is_directory:
            return

        dest_path = Path(event.dest_path)
        if self.should_process_file(dest_path):
            print(f"Moved file detected: {dest_path}")
            self.create_action_file(dest_path)
            self.mark_file_processed(dest_path)


class FileDropWatcher:
    def __init__(self, config_file='watcher_config.json'):
        self.config = self.load_config(config_file)
        self.directories_to_watch = self.config.get('watch_directories', ['Watched_Files'])
        self.needs_action_dir = self.config.get('needs_action_dir', 'Needs_Action')
        self.observer = Observer()
        self.handler = FileDropHandler(self.directories_to_watch, self.needs_action_dir)

    def load_config(self, config_file):
        """Load configuration from JSON file"""
        try:
            with open(config_file, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"Config file {config_file} not found. Using defaults.")
            return {
                'watch_directories': ['Watched_Files'],
                'needs_action_dir': 'Needs_Action'
            }

    def setup_watched_dirs(self):
        """Create watched directories if they don't exist"""
        for directory in self.directories_to_watch:
            Path(directory).mkdir(parents=True, exist_ok=True)
        Path(self.needs_action_dir).mkdir(parents=True, exist_ok=True)

    def run(self):
        """Start watching for file drops"""
        print("Setting up watched directories...")
        self.setup_watched_dirs()

        print("Starting File Drop Watcher...")
        for directory in self.directories_to_watch:
            print(f"Watching directory: {directory}")
            self.observer.schedule(self.handler, directory, recursive=True)

        self.observer.start()

        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("File Drop Watcher stopped by user")
            self.observer.stop()

        self.observer.join()

if __name__ == "__main__":
    watcher = FileDropWatcher()
    watcher.run()