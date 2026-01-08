# Check Watcher Status

## Title
**Check Watcher Status** - Monitor and Diagnose Watcher Script Health

## Description

This skill monitors the health and activity of Watcher scripts (Gmail, WhatsApp, Bank, File Drop) that act as the AI Employee's "senses." It detects stale watchers, missing scripts, configuration issues, and provides actionable recommendations for ensuring continuous monitoring.

**Capability Level**: Bronze Tier
**Category**: System Health & Diagnostics
**Risk Level**: Low (Read-only monitoring)

## Instructions

### Execution Flow

#### 1. Check Configuration

**Read Configuration File**: `watcher_config.json`

```json
{
  "gmail_enabled": false,
  "whatsapp_enabled": true,
  "bank_enabled": true,
  "file_drop_enabled": true,
  "gmail_interval": 300,
  "whatsapp_interval": 60,
  "bank_interval": 600,
  "watch_directories": ["Watched_Files"],
  "needs_action_dir": "Needs_Action"
}
```

**Validate Configuration**:
- [ ] File exists and is valid JSON
- [ ] All required keys present
- [ ] Intervals are positive integers
- [ ] Directories exist

**Extract Enabled Watchers**:
```python
enabled_watchers = []
if config['gmail_enabled']:
    enabled_watchers.append('gmail')
if config['whatsapp_enabled']:
    enabled_watchers.append('whatsapp')
if config['bank_enabled']:
    enabled_watchers.append('bank')
if config['file_drop_enabled']:
    enabled_watchers.append('file_drop')
```

#### 2. Check Watcher Scripts Exist

**Script Locations**:
```
Required Files:
- gmail_watcher.py (if gmail_enabled)
- whatsapp_watcher.py (if whatsapp_enabled)
- bank_watcher.py (if bank_enabled)
- file_drop_watcher.py (if file_drop_enabled)
- watcher_manager.py (orchestrator - always required)
```

**Validation**:
```python
missing_scripts = []
for watcher in enabled_watchers:
    script = f'{watcher}_watcher.py'
    if not exists(script):
        missing_scripts.append(script)
```

#### 3. Check Recent Activity

**Activity Detection Strategy**:
Since Bronze Tier cannot check running processes, detect activity by looking for recently created files.

**A. Gmail Watcher**:
- Pattern: `EMAIL_*.md` in `/Needs_Action`
- Expected interval: 300 seconds (5 minutes)
- Status:
  - ✅ **Active**: File created within last 10 minutes (2x interval)
  - ⚠️ **Stale**: No file in last 10-30 minutes
  - ❌ **Stopped**: No file in last 30+ minutes

**B. WhatsApp Watcher**:
- Pattern: `WHATSAPP_*.md` in `/Needs_Action`
- Expected interval: 60 seconds (1 minute)
- Status:
  - ✅ **Active**: File created within last 2 minutes
  - ⚠️ **Stale**: No file in last 2-5 minutes
  - ❌ **Stopped**: No file in last 5+ minutes

**C. Bank Watcher**:
- Pattern: `bank_*.md` in `/Needs_Action`
- Expected interval: 600 seconds (10 minutes)
- Status:
  - ✅ **Active**: File created within last 20 minutes
  - ⚠️ **Stale**: No file in last 20-60 minutes
  - ❌ **Stopped**: No file in last 60+ minutes

**D. File Drop Watcher**:
- Pattern: `FILE_*.md` in `/Needs_Action`
- Real-time monitoring (no interval)
- Status based on process check or database timestamp

**Code Pattern**:
```python
def check_watcher_activity(pattern, interval_seconds):
    files = glob(f'/Needs_Action/{pattern}')
    if not files:
        return 'unknown', None

    latest = max(files, key=lambda f: f.stat().st_mtime)
    age_seconds = time.time() - latest.stat().st_mtime

    if age_seconds < interval_seconds * 2:
        return 'active', latest.stat().st_mtime
    elif age_seconds < interval_seconds * 5:
        return 'stale', latest.stat().st_mtime
    else:
        return 'stopped', latest.stat().st_mtime
```

#### 4. Check Database Files

**Database Health**:
```
Expected Databases:
- .watched_files.db (File Drop Watcher)
- .whatsapp_messages.db (WhatsApp Watcher)
- .bank_transactions.db (Bank Watcher)
```

**Validation**:
```python
def check_database(db_path):
    if not exists(db_path):
        return 'missing'

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute('SELECT name FROM sqlite_master WHERE type="table"')
        tables = cursor.fetchall()
        conn.close()
        return 'ok' if tables else 'empty'
    except sqlite3.DatabaseError:
        return 'corrupted'
```

#### 5. Generate Status Report

**Report Template**:
```markdown
# Watcher Status Report
Generated: {timestamp}

## Configuration
- Gmail: {Enabled/Disabled}
- WhatsApp: {Enabled/Disabled}
- Bank: {Enabled/Disabled}
- File Drop: {Enabled/Disabled}

## Watcher Status

### Gmail Watcher
- **Status**: {Active/Stale/Stopped/Disabled}
- **Script**: {Found/Missing}
- **Last Activity**: {timestamp or "None"}
- **Expected Interval**: 300s (5 minutes)

### WhatsApp Watcher
- **Status**: {Active/Stale/Stopped/Disabled}
- **Script**: {Found/Missing}
- **Database**: {OK/Empty/Corrupted/Missing}
- **Last Activity**: {timestamp or "None"}
- **Expected Interval**: 60s (1 minute)

### Bank Watcher
- **Status**: {Active/Stale/Stopped/Disabled}
- **Script**: {Found/Missing}
- **Database**: {OK/Empty/Corrupted/Missing}
- **Last Activity**: {timestamp or "None"}
- **Expected Interval**: 600s (10 minutes)

### File Drop Watcher
- **Status**: {Active/Stale/Stopped/Disabled}
- **Script**: {Found/Missing}
- **Database**: {OK/Empty/Corrupted/Missing}
- **Watch Directories**: {list}

## Issues Detected
{List of problems or "None"}

## Recommendations
{List of suggested actions}

## Summary
- Total Watchers: {count}
- Active: {count}
- Stale: {count}
- Stopped: {count}
- Disabled: {count}

---
*Bronze Tier Limitation: Cannot check running processes, status based on file activity*
```

#### 6. Generate Recommendations

**Logic**:
```python
recommendations = []

if missing_scripts:
    recommendations.append(f'Install missing scripts: {", ".join(missing_scripts)}')

for watcher, status in watcher_status.items():
    if status == 'stopped':
        recommendations.append(f'Start {watcher} watcher: python {watcher}_watcher.py')
    elif status == 'stale':
        recommendations.append(f'Check {watcher} watcher logs for errors')

if any(db == 'corrupted' for db in database_status.values()):
    recommendations.append('Rebuild corrupted databases (see docs)')

if all(status == 'stopped' for status in watcher_status.values()):
    recommendations.append('CRITICAL: All watchers stopped. Start orchestrator: python watcher_manager.py')
```

### Acceptance Criteria

- [ ] All enabled watchers are identified from config
- [ ] Script existence verified for each enabled watcher
- [ ] Activity status determined from recent files
- [ ] Database health checked for watchers that use them
- [ ] Clear recommendations provided for any issues
- [ ] Report is well-formatted and actionable

### Constraints

**Constitution Compliance**:
- **Principle III**: Proactive Autonomous Management - Watchers must be monitored
- **Principle VII**: Graceful Degradation - System should detect and report failures

**Bronze Tier Limitations**:
- Cannot check running processes (no `ps` or process manager API)
- Cannot restart watchers automatically (Silver/Gold capability)
- Cannot send alerts (file-based only)
- Status based on file activity, not actual process health

**Operational Constraints**:
- Read-only checks (no modifications to watcher scripts)
- No automatic process restarts
- Report only, no automatic remediation

## Examples

### Example 1: All Watchers Healthy

**Setup**:
- All watchers enabled and running
- Recent files from each watcher
- All databases healthy

**Skill Output**:
```markdown
# Watcher Status Report
Generated: 2026-01-08T11:00:00Z

## Configuration
- Gmail: Disabled
- WhatsApp: Enabled
- Bank: Enabled
- File Drop: Enabled

## Watcher Status

### Gmail Watcher
- **Status**: Disabled
- **Script**: Found
- **Last Activity**: N/A

### WhatsApp Watcher
- **Status**: ✅ Active
- **Script**: ✅ Found
- **Database**: ✅ OK
- **Last Activity**: 2026-01-08T10:59:30Z (30 seconds ago)
- **Expected Interval**: 60s (1 minute)

### Bank Watcher
- **Status**: ✅ Active
- **Script**: ✅ Found
- **Database**: ✅ OK
- **Last Activity**: 2026-01-08T10:55:00Z (5 minutes ago)
- **Expected Interval**: 600s (10 minutes)

### File Drop Watcher
- **Status**: ✅ Active
- **Script**: ✅ Found
- **Database**: ✅ OK
- **Watch Directories**: Watched_Files

## Issues Detected
None - All enabled watchers are operational

## Recommendations
- Continue monitoring
- Consider enabling Gmail watcher for complete coverage

## Summary
- Total Watchers: 4
- Active: 3
- Stale: 0
- Stopped: 0
- Disabled: 1

---
*Bronze Tier Limitation: Cannot check running processes, status based on file activity*
```

---

### Example 2: Stale Watcher Detected

**Setup**:
- WhatsApp watcher hasn't created files in 3 minutes
- Other watchers normal

**Output**:
```markdown
# Watcher Status Report
Generated: 2026-01-08T14:30:00Z

## Watcher Status

### WhatsApp Watcher
- **Status**: ⚠️ Stale
- **Script**: ✅ Found
- **Database**: ✅ OK
- **Last Activity**: 2026-01-08T14:27:00Z (3 minutes ago)
- **Expected Interval**: 60s (1 minute)
- **Warning**: No new files in 3x expected interval

## Issues Detected
1. WhatsApp watcher appears stale (no activity in 3 minutes)

## Recommendations
1. Check WhatsApp watcher logs: `tail -f whatsapp_watcher.log`
2. Verify WhatsApp Web session is still active
3. If frozen, restart: `python whatsapp_watcher.py`
4. Check for network connectivity issues

## Summary
- Total Watchers: 4
- Active: 2
- Stale: 1 ⚠️
- Stopped: 0
- Disabled: 1
```

---

### Example 3: Critical - All Watchers Stopped

**Setup**:
- No recent files from any watcher
- All scripts exist

**Output**:
```markdown
# Watcher Status Report
Generated: 2026-01-08T09:00:00Z

## Watcher Status

### WhatsApp Watcher
- **Status**: ❌ Stopped
- **Script**: ✅ Found
- **Database**: ✅ OK
- **Last Activity**: 2026-01-07T18:30:00Z (14.5 hours ago)

### Bank Watcher
- **Status**: ❌ Stopped
- **Script**: ✅ Found
- **Database**: ✅ OK
- **Last Activity**: 2026-01-07T20:00:00Z (13 hours ago)

### File Drop Watcher
- **Status**: ❌ Stopped
- **Script**: ✅ Found
- **Database**: ✅ OK
- **Last Activity**: None

## Issues Detected
1. ❌ CRITICAL: All watchers have stopped
2. Likely cause: System reboot or manual termination
3. AI Employee is BLIND - not receiving any new items

## Recommendations
🚨 **URGENT**: Restart all watchers immediately

### Quick Start (All Watchers):
```bash
python watcher_manager.py
```

### Individual Start:
```bash
python whatsapp_watcher.py &
python bank_watcher.py &
python file_drop_watcher.py &
```

### For Persistent Operation (Silver Tier):
```bash
pm2 start watcher_manager.py --interpreter python3
pm2 save
pm2 startup
```

## Summary
- Total Watchers: 3
- Active: 0
- Stale: 0
- Stopped: 3 ❌
- Disabled: 1

---
*CRITICAL ALERT: AI Employee is not monitoring any inputs*
```

---

### Example 4: Missing Scripts

**Setup**:
- Config has watchers enabled
- Scripts don't exist

**Output**:
```markdown
# Watcher Status Report
Generated: 2026-01-08T10:00:00Z

## Watcher Status

### WhatsApp Watcher
- **Status**: ❌ Missing Script
- **Script**: ❌ NOT FOUND (whatsapp_watcher.py)
- **Database**: ⚠️ Missing

### Bank Watcher
- **Status**: ❌ Missing Script
- **Script**: ❌ NOT FOUND (bank_watcher.py)
- **Database**: ⚠️ Missing

## Issues Detected
1. Missing watcher scripts (enabled but not installed)
2. Missing databases (will be created on first run)

## Recommendations
1. Install missing watcher scripts from repository
2. Verify Python dependencies: `pip install -r requirements.txt`
3. Run setup: `python setup_watchers.py`
4. Verify installation: `python watcher_manager.py --check`

### Installation Steps:
```bash
# Install dependencies
pip install watchdog google-api-python-client playwright

# Setup watchers
python setup_watchers.py

# Start watchers
python watcher_manager.py
```

## Summary
Configuration issues prevent watcher operation. Setup required.
```

## References

### Related Skills
- `/bronze.process-inbox.md` - Processes items created by watchers
- `/bronze.update-dashboard.md` - Shows watcher-derived metrics
- `/silver.restart-watchers.md` - Automatic restart capability (Silver Tier)

### Documentation
- `WATCHER_SETUP_GUIDE.md` - Installation and configuration
- `watcher_config.json` - Configuration file
- `.specify/memory/constitution.md` - Principle III (Proactive Management)

### Code References
- `watcher_manager.py:1-50` - Orchestrator that manages all watchers
- `file_drop_watcher.py:15-80` - File drop implementation
- `bank_watcher.py:45-120` - Bank transaction monitoring
- `whatsapp_watcher.py:30-100` - WhatsApp message monitoring

### External Resources
- [PM2 Process Manager](https://pm2.keymetrics.io/) - For Silver/Gold tier process management
- [Watchdog Documentation](https://python-watchdog.readthedocs.io/) - File system monitoring library
- [SQLite3 Python](https://docs.python.org/3/library/sqlite3.html) - Database health checks

### Related Constitution Principles
- **Principle III**: Proactive Autonomous Management - Watchers enable 24/7 monitoring
- **Principle VII**: Graceful Degradation - Detect failures and provide recovery steps
- **Principle IV**: Comprehensive Audit Logging - Watchers feed the audit log

### Watcher Architecture Reference

```
┌─────────────────────────────────────────────────────────┐
│                   External Sources                      │
│     Gmail    WhatsApp    Bank APIs    File System      │
└────────┬──────────┬──────────┬──────────┬──────────────┘
         │          │          │          │
         ▼          ▼          ▼          ▼
┌─────────────────────────────────────────────────────────┐
│                  Watcher Layer                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────┐  │
│  │ Gmail   │ │WhatsApp │ │  Bank   │ │ File Drop   │  │
│  │ Watcher │ │ Watcher │ │ Watcher │ │   Watcher   │  │
│  └────┬────┘ └────┬────┘ └────┬────┘ └──────┬──────┘  │
│       │           │           │              │          │
│  ┌────┴───────────┴───────────┴──────────────┴──────┐  │
│  │          watcher_manager.py (Orchestrator)       │  │
│  └──────────────────────────────────────────────────┘  │
└────────┬────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│              /Needs_Action Folder                       │
│  Files created: EMAIL_*.md, WHATSAPP_*.md, bank_*.md   │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│         Bronze: process-inbox.md skill                  │
│         Analyzes and creates action plans               │
└─────────────────────────────────────────────────────────┘
```

### Troubleshooting Guide

**Issue**: Watcher shows "Stopped" but script is running

**Cause**: Script is running but not creating files (possible error in processing logic)

**Solution**:
1. Check script logs for errors
2. Test watcher manually with sample data
3. Verify API credentials are valid
4. Check network connectivity

---

**Issue**: Database shows "Corrupted"

**Cause**: SQLite file corruption (improper shutdown, disk issues)

**Solution**:
```bash
# Backup corrupted DB
mv .watched_files.db .watched_files.db.corrupted

# Watcher will create new DB on next run
python file_drop_watcher.py
```

---

**Skill Version**: 1.0.0
**Last Updated**: 2026-01-08
**Tier**: Bronze
**Author**: Personal AI Employee System
**Status**: Production Ready
