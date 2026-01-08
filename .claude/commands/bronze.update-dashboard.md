# Update Dashboard - Bronze Tier Skill

## User Input
```text
$ARGUMENTS
```

## Outline

You are updating the `Dashboard.md` file with current system status. This is a core Bronze Tier capability for maintaining visibility into the AI Employee's operations.

### Execution Flow:

1. **Gather Current Status**
   - Count files in `/Inbox` folder
   - Count files in `/Needs_Action` folder
   - Count files in `/Pending_Approval` folder
   - Count files in `/Plans` folder (active plans)
   - Count files in `/Done` folder created today
   - Check if any watchers are running (optional for Bronze)

2. **Calculate Quick Stats**
   - Vault Health: Check if all required folders exist
     - Required: Inbox, Needs_Action, Plans, Pending_Approval, Approved, Rejected, Done, Logs, Briefings
     - Status: ✅ Operational (all exist) or ⚠️ Degraded (missing folders)
   - Last Briefing: Find most recent file in `/Briefings` folder
   - System Status: "Ready for instructions" or "Processing items" based on active tasks

3. **Read Recent Logs**
   - Check `/Logs/YYYY-MM-DD.json` for today
   - Extract last 5 activities (if exists)
   - Format as: `[YYYY-MM-DD HH:MM] Action description`

4. **Update Dashboard.md**
   Replace the following sections:
   - **Status Overview**: Update counts
   - **Quick Stats**: Update health, last briefing, system status
   - **Recent Activity**: List recent log entries or "No recent activities logged"
   - **Quick Actions**: Keep the checklist as-is (it's for user guidance)

5. **Validation**
   - Ensure all counts are accurate
   - Ensure timestamps are in ISO 8601 format
   - Ensure markdown formatting is preserved

### Template Structure:

```markdown
# Personal AI Employee Dashboard

## Status Overview
- **Active Tasks**: <count from /Plans>
- **Pending Approval**: <count from /Pending_Approval>
- **Completed Today**: <count from /Done filtered by today>
- **Needs Action**: <count from /Needs_Action>

## Quick Stats
- **Vault Health**: <✅ Operational | ⚠️ Degraded | ❌ Critical>
- **Last Briefing**: <date or "None">
- **System Status**: <status description>

## Recent Activity
<last 5 log entries or "No recent activities logged">

## Quick Actions
- [ ] Check /Inbox for new items
- [ ] Review /Needs_Action
- [ ] Generate weekly briefing (if Monday)
```

### Acceptance Criteria:
- Dashboard.md is updated with accurate counts
- All sections are present and properly formatted
- Timestamp shows when dashboard was last updated
- No placeholder text remains

### Constraints:
- MUST follow Constitution Principle V (File-Based Workflow)
- Read-only operations on all folders (just counting)
- Never delete or modify Dashboard.md structure

### Output:
Confirm dashboard update:
- Active Tasks: X
- Pending Approval: X
- Completed Today: X
- Needs Action: X
- Vault Health: <status>

---

**Note**: This is a Bronze Tier skill for basic dashboard updates. For Silver/Gold tiers, this will include real-time watcher status and performance metrics.
