"""
Simple script to test file drop watcher functionality
"""
import threading
import time
from pathlib import Path

def run_file_watcher():
    """Run the file watcher for a short period"""
    from file_drop_watcher import FileDropWatcher

    watcher = FileDropWatcher()

    # Start observing
    for directory in watcher.directories_to_watch:
        print(f"Watching: {directory}")
        watcher.observer.schedule(watcher.handler, directory, recursive=True)

    watcher.observer.start()
    print("File watcher started. Monitoring for 10 seconds...")

    try:
        time.sleep(10)  # Run for 10 seconds
    finally:
        watcher.observer.stop()
        watcher.observer.join()
        print("File watcher stopped.")

def main():
    # Start the watcher in a thread
    watcher_thread = threading.Thread(target=run_file_watcher, daemon=True)
    watcher_thread.start()

    # Wait a moment for it to start
    time.sleep(2)

    # Create a test file
    test_file = Path("Watched_Files") / f"test_{int(time.time())}.txt"
    test_file.write_text(f"Test file created at {time.time()}")
    print(f"Created test file: {test_file}")

    # Wait for watcher to process
    time.sleep(3)

    # Check for action files
    action_files = list(Path("Needs_Action").glob("*.md"))
    print(f"Found {len(action_files)} action file(s) in Needs_Action/")

    for af in action_files:
        print(f"  - {af.name}")

    # Wait for thread to finish
    time.sleep(5)

if __name__ == "__main__":
    main()