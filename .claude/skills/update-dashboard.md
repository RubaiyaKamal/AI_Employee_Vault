# Update Dashboard

## Title
**Update Dashboard** - Real-Time System Status and Metrics Display

## Description

This skill updates the `Dashboard.md` file with current system status, including active task counts, pending approvals, completed items, vault health, and recent activity. It provides a real-time overview of the AI Employee's operational state and serves as the primary user interface for monitoring system health.

**Capability Level**: Bronze Tier
**Category**: Monitoring & Reporting
**Risk Level**: Low (Read-only checks with dashboard write)

## Instructions

### Execution Flow

#### 1. Gather Current Status

**Folder Counts**:
```python
# Pseudocode for counting
counts = {
    'inbox': count_files('/Inbox/*.md'),
    'needs_action': count_files('/Needs_Action/*.md'),
    'pending_approval': count_files('/Pending_Approval/*.md'),
    'active_plans': count_files('/Plans/*.md', status='pending'),
    'completed_today': count_files('/Done/*.md', created_date=today)
}
```

**Required Metrics**:
- **Active Tasks**: Count of files in `/Plans` with `status: pending`
- **Pending Approval**: Count of files in `/Pending_Approval`
- **Completed Today**: Count of files in `/Done` created today (check frontmatter `created` field)
- **Needs Action**: Count of files in `/Needs_Action` + `/Inbox`

#### 2. Calculate Quick Stats

**A. Vault Health Check**:

Check for existence of all required folders:
```
Required Folders:
- Inbox/
- Needs_Action/
- Plans/
- Pending_Approval/
- Approved/
- Rejected/
- Done/
- Logs/
- Briefings/
- Accounting/
```

**Health Status**:
- ✅ **Operational**: All folders exist
- ⚠️ **Degraded**: 1-2 folders missing
- ❌ **Critical**: 3+ folders missing or /Needs_Action missing

**B. Last Briefing**:
```python
# Find most recent briefing
briefings = glob('/Briefings/*.md')
if briefings:
    latest = max(briefings, key=lambda f: f.stat().st_mtime)
    last_briefing = latest.name  # e.g., "2026-01-06_Monday_Briefing.md"
else:
    last_briefing = "None"
```

**C. System Status**:
Determine based on counts:
- **"Ready for instructions"**: No active tasks, no needs_action items
- **"Processing items"**: Active tasks > 0 or needs_action > 0
- **"Awaiting approval"**: pending_approval > 0
- **"Idle"**: All counts zero, no activity in 24 hours

#### 3. Read Recent Logs

**Log File Location**: `/Logs/YYYY-MM-DD.json`

```python
# Read today's log
log_file = f'/Logs/{today}.json'
if exists(log_file):
    logs = read_json(log_file)
    recent_activities = logs[-5:]  # Last 5 entries
else:
    recent_activities = []
```

**Format Activities**:
```markdown
- [2026-01-08 11:00] Processed invoice request from Client A
- [2026-01-08 10:45] Categorized Netflix subscription
- [2026-01-08 10:30] Created plan for WhatsApp urgent request
```

#### 4. Update Dashboard.md

**Template**:
```markdown
# Personal AI Employee Dashboard

## Status Overview
- **Active Tasks**: {active_plans}
- **Pending Approval**: {pending_approval}
- **Completed Today**: {completed_today}
- **Needs Action**: {needs_action}

## Quick Stats
- **Vault Health**: {health_status}
- **Last Briefing**: {last_briefing}
- **System Status**: {system_status}

## Recent Activity
{recent_activities or "No recent activities logged"}

## Quick Actions
- [ ] Check /Inbox for new items
- [ ] Review /Needs_Action
- [ ] Generate weekly briefing (if Monday)

---
*Last updated: {timestamp}*
```

**Update Method**:
- Read current Dashboard.md
- Replace only the data sections (preserve structure)
- Add timestamp at bottom
- Write back to Dashboard.md

#### 5. Validation

**Post-Update Checks**:
- [ ] All counts are non-negative integers
- [ ] Timestamps are in ISO 8601 format
- [ ] Markdown formatting preserved
- [ ] No placeholder text like `{variable}` remains
- [ ] Health status is valid emoji (✅/⚠️/❌)
- [ ] File is valid markdown

### Acceptance Criteria

- [ ] Dashboard.md exists and is readable
- [ ] All sections updated with current data
- [ ] Counts match actual folder contents
- [ ] Recent activity shows last 5 log entries (if available)
- [ ] Timestamp reflects update time
- [ ] No errors during update process

### Constraints

**Constitution Compliance**:
- **Principle V**: File-Based Workflow - Dashboard is a file, not a UI
- **Principle IV**: Audit Logging - Dashboard updates can be logged

**Operational Constraints**:
- Read-only operations on all folders (counting only)
- Never delete Dashboard.md
- Never modify Quick Actions checklist (user guidance)
- Preserve markdown structure exactly
- Use atomic writes (write to temp, then rename) to prevent corruption

## Examples

### Example 1: Fresh Morning Update

**Current State**:
- `/Plans`: 3 files (pending)
- `/Pending_Approval`: 1 file
- `/Done`: 2 files created today
- `/Needs_Action`: 5 files
- `/Inbox`: 0 files
- All folders exist
- Last briefing: `2026-01-06_Monday_Briefing.md`
- Log file exists with 8 entries

**Skill Execution**:
1. Counts folders
2. Determines health: ✅ Operational
3. Reads last 5 log entries
4. System status: "Processing items" (active tasks > 0)

**Output** (`Dashboard.md`):
```markdown
# Personal AI Employee Dashboard

## Status Overview
- **Active Tasks**: 3
- **Pending Approval**: 1
- **Completed Today**: 2
- **Needs Action**: 5

## Quick Stats
- **Vault Health**: ✅ Operational
- **Last Briefing**: 2026-01-06_Monday_Briefing.md
- **System Status**: Processing items

## Recent Activity
- [2026-01-08 11:00] Processed invoice request from Client A
- [2026-01-08 10:45] Categorized Netflix subscription
- [2026-01-08 10:30] Created plan for WhatsApp urgent request
- [2026-01-08 10:15] Updated dashboard
- [2026-01-08 10:00] File watcher started

## Quick Actions
- [ ] Check /Inbox for new items
- [ ] Review /Needs_Action
- [ ] Generate weekly briefing (if Monday)

---
*Last updated: 2026-01-08T11:05:00Z*
```

---

### Example 2: System Idle State

**Current State**:
- All folders: 0 files
- All required folders exist
- No briefings yet
- No log file for today

**Output**:
```markdown
# Personal AI Employee Dashboard

## Status Overview
- **Active Tasks**: 0
- **Pending Approval**: 0
- **Completed Today**: 0
- **Needs Action**: 0

## Quick Stats
- **Vault Health**: ✅ Operational
- **Last Briefing**: None
- **System Status**: Ready for instructions

## Recent Activity
No recent activities logged

## Quick Actions
- [ ] Check /Inbox for new items
- [ ] Review /Needs_Action
- [ ] Generate weekly briefing (if Monday)

---
*Last updated: 2026-01-08T08:00:00Z*
```

---

### Example 3: Degraded Vault Health

**Current State**:
- `/Plans`: Missing (deleted accidentally)
- `/Logs`: Missing
- Other counts: Normal
- System detected 2 missing critical folders

**Output**:
```markdown
# Personal AI Employee Dashboard

## Status Overview
- **Active Tasks**: 0 (⚠️ /Plans folder missing!)
- **Pending Approval**: 1
- **Completed Today**: 0
- **Needs Action**: 3

## Quick Stats
- **Vault Health**: ⚠️ Degraded (Missing: /Plans, /Logs)
- **Last Briefing**: 2026-01-06_Monday_Briefing.md
- **System Status**: Awaiting repair

## Recent Activity
Cannot read logs (folder missing)

## Quick Actions
- [ ] **URGENT**: Restore missing folders (/Plans, /Logs)
- [ ] Check /Inbox for new items
- [ ] Review /Needs_Action

---
*Last updated: 2026-01-08T14:30:00Z*
```

**Alert Triggered**:
The skill should also create an alert file:
`/Needs_Action/ALERT_vault_degraded_20260108.md` with recovery instructions.

---

### Example 4: High Activity Day

**Current State**:
- `/Plans`: 15 active plans
- `/Pending_Approval`: 7 items
- `/Done`: 23 completed today
- `/Needs_Action`: 2 items
- Logs: 45 entries today

**Output**:
```markdown
# Personal AI Employee Dashboard

## Status Overview
- **Active Tasks**: 15
- **Pending Approval**: 7 ⚠️
- **Completed Today**: 23 ✅
- **Needs Action**: 2

## Quick Stats
- **Vault Health**: ✅ Operational
- **Last Briefing**: 2026-01-08_Monday_Briefing.md
- **System Status**: High activity - Review pending approvals

## Recent Activity
- [2026-01-08 16:45] Completed client proposal review
- [2026-01-08 16:30] Sent invoice to Client B
- [2026-01-08 16:15] Categorized 5 bank transactions
- [2026-01-08 16:00] Updated business goals progress
- [2026-01-08 15:45] Generated weekly report

## Quick Actions
- [ ] **Priority**: Review 7 pending approvals
- [ ] Check /Inbox for new items
- [ ] Review end-of-day summary

---
*Last updated: 2026-01-08T16:50:00Z*
```

## References

### Related Skills
- `/bronze.process-inbox.md` - Processes items that affect counts
- `/bronze.check-watchers.md` - Monitors data sources feeding the dashboard
- `/bronze.generate-plan.md` - Creates plans counted in Active Tasks

### Documentation
- `Dashboard.md` - The file this skill updates
- `README.md` - System architecture (Section: "How the System Works")
- `.specify/memory/constitution.md` - Principle V (File-Based Workflow)

### Code References
- `watcher_manager.py:120-145` - Log file format
- `file_drop_watcher.py:85-100` - Frontmatter structure for created files

### External Resources
- [Obsidian Dataview](https://blacksmithgu.github.io/obsidian-dataview/) - Advanced vault queries
- [ISO 8601 DateTime Format](https://en.wikipedia.org/wiki/ISO_8601) - Timestamp standard
- [Markdown Specification](https://commonmark.org/) - Formatting reference

### Related Constitution Principles
- **Principle IV**: Comprehensive Audit Logging - Dashboard shows logged activities
- **Principle V**: File-Based Workflow - Dashboard is a file, not in-memory state
- **Principle III**: Proactive Autonomous Management - Dashboard enables monitoring

### Folder Structure Reference
```
Vault Root/
├── Dashboard.md          ← This skill updates this file
├── Inbox/                ← Counted for "Needs Action"
├── Needs_Action/         ← Counted for "Needs Action"
├── Plans/                ← Counted for "Active Tasks"
├── Pending_Approval/     ← Counted for "Pending Approval"
├── Done/                 ← Counted for "Completed Today"
└── Logs/                 ← Source for "Recent Activity"
    └── YYYY-MM-DD.json   ← Today's log file
```

### Monitoring Schedule

**Recommended Update Frequency**:
- **Manual Trigger**: After any major operation
- **Scheduled**: Every 15 minutes (cron: `*/15 * * * *`)
- **Event-Driven**: After file watcher detects changes
- **On-Demand**: User can trigger via `/bronze.update-dashboard`

**Silver/Gold Tier Enhancement**:
- Real-time updates via file system watcher
- Dashboard API endpoint for web interface
- Push notifications on critical status changes
- Historical metrics (trend graphs)

---

**Skill Version**: 1.0.0
**Last Updated**: 2026-01-08
**Tier**: Bronze
**Author**: Personal AI Employee System
**Status**: Production Ready
