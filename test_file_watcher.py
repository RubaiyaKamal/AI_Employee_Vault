"""
Test script to verify file drop watcher functionality
"""
import time
from file_drop_watcher import FileDropWatcher

def test_file_drop_watcher():
    print("Testing File Drop Watcher...")

    # Create a test file to trigger the watcher
    test_content = """---
type: file
priority: normal
status: pending
---

Test file created to verify the file drop watcher is working.
"""

    # Write a test file to the watched directory
    with open("Watched_Files/test_file.txt", "w") as f:
        f.write(test_content)

    print("Test file created in Watched_Files/")
    print("The file drop watcher should detect this and create an action file in Needs_Action/")

    # Wait a moment for the watcher to process
    time.sleep(2)

    print("Check the Needs_Action/ directory for a new action file.")

if __name__ == "__main__":
    test_file_drop_watcher()