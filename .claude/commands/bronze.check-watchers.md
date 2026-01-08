# Check Watcher Status - Bronze Tier Skill

## User Input
```text
$ARGUMENTS
```

## Outline

You are checking the status of the Watcher scripts (Gmail, WhatsApp, Bank, File Drop) to ensure they are running properly. This is a Bronze Tier monitoring capability.

### Execution Flow:

1. **Check Configuration**
   - Read `watcher_config.json` to see which watchers are enabled
   - Verify configuration is valid JSON
   - List enabled watchers:
     - gmail_enabled
     - whatsapp_enabled
     - bank_enabled
     - file_drop_enabled

2. **Check Watcher Scripts Exist**
   For each enabled watcher, verify the Python script exists:
   - `gmail_watcher.py` (if gmail_enabled)
   - `whatsapp_watcher.py` (if whatsapp_enabled)
   - `bank_watcher.py` (if bank_enabled)
   - `file_drop_watcher.py` (if file_drop_enabled)
   - `watcher_manager.py` (orchestrator)

3. **Check Recent Activity**
   For each watcher, check if it has created recent action files:
   - Gmail: Look for files matching `EMAIL_*.md` in `/Needs_Action`
   - WhatsApp: Look for files matching `WHATSAPP_*.md` in `/Needs_Action`
   - Bank: Look for files matching `bank_*.md` in `/Needs_Action`
   - File Drop: Look for files matching `FILE_*.md` in `/Needs_Action`

   Check timestamps:
   - Gmail: Should have activity within last 300s (5 min) if monitoring
   - WhatsApp: Should have activity within last 60s (1 min) if monitoring
   - Bank: Should have activity within last 600s (10 min) if monitoring
   - File Drop: Real-time, check if `/Watched_Files` has new files

4. **Check Database Files**
   - `.watched_files.db` (for file drop watcher)
   - `.whatsapp_messages.db` (for WhatsApp watcher)
   - `.bank_transactions.db` (for bank watcher)

   Verify these databases exist and are not corrupted

5. **Generate Status Report**
   Create a status report with:
   ```
   # Watcher Status Report
   Generated: <timestamp>

   ## Configuration
   - Gmail: <Enabled/Disabled>
   - WhatsApp: <Enabled/Disabled>
   - Bank: <Enabled/Disabled>
   - File Drop: <Enabled/Disabled>

   ## Status
   - Gmail Watcher: <Running/Stopped/Unknown> (Last activity: <timestamp or "None">)
   - WhatsApp Watcher: <Running/Stopped/Unknown> (Last activity: <timestamp or "None">)
   - Bank Watcher: <Running/Stopped/Unknown> (Last activity: <timestamp or "None">)
   - File Drop Watcher: <Running/Stopped/Unknown> (Last activity: <timestamp or "None">)

   ## Issues
   <List any missing files, stale watchers, or configuration problems>

   ## Recommendations
   <Suggest starting watchers if they appear stopped>
   ```

6. **Bronze Tier Limitations**
   For Bronze Tier, we can only check for evidence of watcher activity (recent files).
   We CANNOT check process IDs or running processes (that requires Silver/Gold tier with process management).

### Acceptance Criteria:
- All enabled watchers are identified
- Activity status is determined from recent files
- Missing scripts or databases are reported
- Clear recommendations for action

### Constraints:
- MUST follow Constitution Principle III (Proactive Autonomous Management)
- Read-only checks (no modification of watcher scripts)
- Cannot restart processes (Bronze limitation)

### Output:
Display the status report showing:
- Which watchers are configured
- Which watchers appear to be active
- Any issues detected
- Recommendations for next steps

### How to Start Watchers:

For Bronze Tier users, provide instructions:
```
To start watchers manually:

1. File Drop Watcher (simplest):
   python file_drop_watcher.py

2. Bank Watcher:
   python bank_watcher.py

3. All Watchers:
   python watcher_manager.py

For Silver/Gold Tier, use PM2 for process management.
```

---

**Note**: This is a Bronze Tier skill for basic watcher monitoring. For Silver/Gold tiers, this will integrate with process managers (PM2) to automatically restart failed watchers.
