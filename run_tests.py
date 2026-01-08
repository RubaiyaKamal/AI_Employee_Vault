#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Quick Test Runner for Personal AI Employee
Tests file monitoring and basic system functionality
"""

import os
import sys
import time
import argparse
import threading
from pathlib import Path
from datetime import datetime

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Colors for output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_header(text):
    print(f"\n{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BLUE}{text:^60}{Colors.END}")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}\n")

def print_success(text):
    print(f"{Colors.GREEN}✓ {text}{Colors.END}")

def print_error(text):
    print(f"{Colors.RED}✗ {text}{Colors.END}")

def print_warning(text):
    print(f"{Colors.YELLOW}⚠ {text}{Colors.END}")

def test_vault_structure():
    """Test 1: Verify vault folder structure"""
    print_header("Test 1: Vault Structure")

    required_folders = [
        'Inbox', 'Needs_Action', 'Plans', 'Pending_Approval',
        'Approved', 'Rejected', 'Done', 'Logs', 'Briefings',
        'Watched_Files', '.claude/skills'
    ]

    all_exist = True
    for folder in required_folders:
        path = Path(folder)
        if path.exists():
            print_success(f"Folder exists: {folder}")
        else:
            print_error(f"Folder missing: {folder}")
            all_exist = False

    return all_exist

def test_required_files():
    """Test 2: Verify required files exist"""
    print_header("Test 2: Required Files")

    required_files = [
        'Dashboard.md',
        'Company_Handbook.md',
        'Business_Goals.md',
        'README.md',
        '.specify/memory/constitution.md',
        'watcher_config.json',
        'file_drop_watcher.py',
        '.gitignore'
    ]

    all_exist = True
    for file in required_files:
        path = Path(file)
        if path.exists():
            print_success(f"File exists: {file}")
        else:
            print_error(f"File missing: {file}")
            all_exist = False

    return all_exist

def test_file_drop():
    """Test 3: File Drop Monitoring"""
    print_header("Test 3: File Drop Test")

    # Start a temporary watcher for the test
    watcher_thread = None
    observer = None

    def run_temp_watcher():
        nonlocal observer
        from file_drop_watcher import FileDropWatcher
        watcher = FileDropWatcher()
        observer = watcher.observer
        for directory in watcher.directories_to_watch:
            observer.schedule(watcher.handler, directory, recursive=True)
        observer.start()
        try:
            time.sleep(8)  # Run for 8 seconds
        finally:
            observer.stop()
            observer.join()

    # Start watcher in background
    print_warning("Starting temporary file watcher for test...")
    watcher_thread = threading.Thread(target=run_temp_watcher, daemon=True)
    watcher_thread.start()
    time.sleep(1)  # Give watcher time to initialize

    # Create test file
    test_file = Path("test_file_drop.md")
    test_content = f"""---
type: file_drop
priority: high
status: pending
created: {datetime.now().isoformat()}
---

# Test File Drop

This is an automated test to verify file monitoring works.

Created by: run_tests.py
Timestamp: {datetime.now().isoformat()}
"""

    try:
        test_file.write_text(test_content)
        print_success(f"Created test file: {test_file}")
    except Exception as e:
        print_error(f"Failed to create test file: {e}")
        return False

    # Move to Watched_Files
    watched_dir = Path("Watched_Files")
    destination = watched_dir / test_file.name

    try:
        test_file.rename(destination)
        print_success(f"Moved test file to: {watched_dir}")
        print_warning("Waiting 5 seconds for file watcher to detect...")
        time.sleep(5)
    except Exception as e:
        print_error(f"Failed to move file: {e}")
        return False

    # Check if action file created
    needs_action = Path("Needs_Action")
    action_files = list(needs_action.glob("file_drop_*test_file_drop*.md"))

    if action_files:
        print_success(f"Action file created: {action_files[0].name}")
        print_success("File watcher is working!")

        # Show content
        print(f"\n{Colors.YELLOW}Action file content:{Colors.END}")
        print(action_files[0].read_text()[:200] + "...")

        # Clean up test files
        destination.unlink(missing_ok=True)
        for f in action_files:
            f.unlink(missing_ok=True)

        return True
    else:
        print_warning("No action file found in Needs_Action/")
        print_warning("File watcher may not be running")
        print(f"\n{Colors.YELLOW}To start file watcher manually:{Colors.END}")
        print("  python file_drop_watcher.py")
        return False

def test_skills():
    """Test 4: Verify Agent Skills"""
    print_header("Test 4: Agent Skills")

    skills_dir = Path(".claude/skills")
    expected_skills = [
        'process-inbox.md',
        'update-dashboard.md',
        'check-watchers.md',
        'generate-plan.md',
        'review-approvals.md',
        'generate-briefing.md',
        'browse-web.md',
        'README.md'
    ]

    all_exist = True
    for skill in expected_skills:
        skill_path = skills_dir / skill
        if skill_path.exists():
            size = skill_path.stat().st_size
            print_success(f"Skill exists: {skill} ({size:,} bytes)")
        else:
            print_error(f"Skill missing: {skill}")
            all_exist = False

    return all_exist

def test_mcp_config():
    """Test 5: MCP Configuration"""
    print_header("Test 5: MCP Configuration")

    import json

    # Check local config
    home = Path.home()
    claude_config = home / ".claude.json"

    if claude_config.exists():
        print_success(f"MCP config found: {claude_config}")
        try:
            config = json.loads(claude_config.read_text())
            if 'mcpServers' in config:
                servers = config['mcpServers']
                print_success(f"MCP servers configured: {len(servers)}")
                for server_name in servers:
                    print(f"  - {server_name}")
            else:
                print_warning("No MCP servers in config")
        except Exception as e:
            print_error(f"Failed to parse config: {e}")
            return False
    else:
        print_warning(f"MCP config not found at: {claude_config}")
        print_warning("MCP servers may not be configured")
        return False

    print(f"\n{Colors.YELLOW}To verify MCP servers are running:{Colors.END}")
    print("  claude mcp list")

    return True

def create_sample_items():
    """Create sample test items"""
    print_header("Creating Sample Test Items")

    samples = [
        {
            'file': 'Needs_Action/TEST_email_sample.md',
            'content': '''---
type: email
from: test@example.com
subject: Test Invoice Request
priority: normal
status: pending
---

## Email Content
Can you send me the invoice for last month?

Thanks!
'''
        },
        {
            'file': 'Needs_Action/TEST_urgent_sample.md',
            'content': '''---
type: whatsapp
from: +1234567890
priority: high
status: pending
---

## Message
URGENT: Need help with website issue!
'''
        }
    ]

    for sample in samples:
        try:
            path = Path(sample['file'])
            path.write_text(sample['content'])
            print_success(f"Created: {path}")
        except Exception as e:
            print_error(f"Failed to create {path}: {e}")

def main():
    """Run all tests"""
    parser = argparse.ArgumentParser(description='Test Personal AI Employee System')
    parser.add_argument('--auto', action='store_true',
                       help='Run all tests automatically without prompts')
    args = parser.parse_args()

    print_header("Personal AI Employee - Test Runner")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Working Directory: {os.getcwd()}")

    results = {}

    # Run tests
    results['Vault Structure'] = test_vault_structure()
    results['Required Files'] = test_required_files()
    results['Agent Skills'] = test_skills()
    results['MCP Config'] = test_mcp_config()

    # File drop test (optional - may fail if watcher not running)
    print(f"\n{Colors.YELLOW}Note: File drop test requires watcher to be running{Colors.END}")

    # Check if running in auto mode
    if args.auto:
        print("Running in auto mode - auto-running file drop test")
        run_drop_test = True
    elif not sys.stdin.isatty():
        # Non-interactive mode - auto-run if watcher is detected
        print("Running in non-interactive mode - auto-running file drop test")
        run_drop_test = True
    else:
        user_input = input("Run file drop test? (y/n): ").lower()
        run_drop_test = user_input == 'y'

    if run_drop_test:
        results['File Drop'] = test_file_drop()

    # Summary
    print_header("Test Summary")

    passed = sum(1 for v in results.values() if v)
    total = len(results)

    for test_name, result in results.items():
        if result:
            print_success(f"{test_name}: PASSED")
        else:
            print_error(f"{test_name}: FAILED")

    print(f"\n{Colors.BLUE}Results: {passed}/{total} tests passed{Colors.END}")

    if passed == total:
        print_success("\n🎉 All tests passed! System is operational.")
        print(f"\n{Colors.YELLOW}Next steps:{Colors.END}")
        print("1. Start file watcher: python file_drop_watcher.py")
        print("2. Process inbox: claude /bronze.process-inbox")
        print("3. Update dashboard: claude /bronze.update-dashboard")
        print("4. Check watchers: claude /bronze.check-watchers")
    else:
        print_warning(f"\n⚠️  {total - passed} test(s) failed. See details above.")
        print(f"\n{Colors.YELLOW}Troubleshooting:{Colors.END}")
        print("- Check TESTING_GUIDE.md for solutions")
        print("- Review setup documentation")
        print("- Verify all prerequisites installed")

    # Offer to create sample items
    print(f"\n{Colors.YELLOW}Create sample test items in Needs_Action?{Colors.END}")

    # Check if running in auto mode
    if args.auto or not sys.stdin.isatty():
        # Auto mode or non-interactive - skip creating samples
        print("Auto mode - skipping sample creation")
        create_samples = False
    else:
        user_input = input("This helps test processing workflow (y/n): ").lower()
        create_samples = user_input == 'y'

    if create_samples:
        create_sample_items()
        print_success("\nSample items created!")
        print("Process them with: claude /bronze.process-inbox")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n\n{Colors.YELLOW}Test interrupted by user{Colors.END}")
        sys.exit(0)
    except Exception as e:
        print_error(f"\nTest runner error: {e}")
        sys.exit(1)
