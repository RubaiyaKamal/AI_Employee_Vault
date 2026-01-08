"""
Test script to run the file drop watcher and verify it works
"""
import threading
import time
import os
from pathlib import Path

def run_file_watcher():
    """Function to run the file watcher in a separate thread"""
    from file_drop_watcher import FileDropWatcher

    # Create the watcher with default config
    watcher = FileDropWatcher()

    # Start the observer
    for directory in watcher.directories_to_watch:
        print(f"Watching directory: {directory}")
        watcher.observer.schedule(watcher.handler, directory, recursive=True)

    watcher.observer.start()

    try:
        # Keep the observer running for a short time
        time.sleep(10)  # Run for 10 seconds
    except KeyboardInterrupt:
        print("Stopping watcher...")
    finally:
        watcher.observer.stop()
        watcher.observer.join()

def main():
    print("Starting file watcher test...")

    # Start the file watcher in a background thread
    watcher_thread = threading.Thread(target=run_file_watcher, daemon=True)
    watcher_thread.start()

    # Wait a moment for the watcher to start
    time.sleep(2)

    # Create a test file
    print("Creating test file...")
    test_file_path = Path("Watched_Files") / f"test_file_{int(time.time())}.txt"
    test_file_path.parent.mkdir(exist_ok=True)

    with open(test_file_path, 'w') as f:
        f.write(f"Test file created at {time.time()}")

    print(f"Created test file: {test_file_path}")

    # Wait for the watcher to process the file
    time.sleep(3)

    # Check if an action file was created
    needs_action_files = list(Path("Needs_Action").glob("file_drop_*.md"))
    if needs_action_files:
        print(f"Success! Created {len(needs_action_files)} action file(s):")
        for f in needs_action_files:
            print(f"  - {f.name}")
    else:
        print("No action files were created. The watcher may not be working properly.")

    # Wait a bit more for the thread to finish
    time.sleep(3)
    print("Test completed.")

if __name__ == "__main__":
    main()