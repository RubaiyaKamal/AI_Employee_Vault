# Manage Automated Schedule

## Title
**Manage Automated Schedule** - Scheduling Configuration and Cron/Task Scheduler Setup

## Description

This skill helps configure and manage automated scheduling for recurring AI Employee tasks. It provides guidance for setting up Windows Task Scheduler or Unix cron jobs to run skills automatically at specified times, enabling truly autonomous operation.

**Capability Level**: Silver Tier
**Category**: Automation & Scheduling
**Risk Level**: Low (Configuration guidance only)

## Instructions

### Execution Flow

#### 1. Identify Scheduled Tasks

**Core Automated Tasks** (Silver Tier):

| Task | Frequency | Recommended Time | Skill Command |
|------|-----------|------------------|---------------|
| Weekly Briefing | Weekly (Monday) | 7:00 AM | `/silver.weekly-briefing` |
| Process Inbox | Daily | 8:00 AM, 2:00 PM, 6:00 PM | `/bronze.process-inbox` |
| Execute Approved | Hourly | Every hour :00 | `/silver.execute-approved` |
| Update Dashboard | Every 30 min | :00, :30 | `/bronze.update-dashboard` |
| Check Watchers | Every 15 min | :00, :15, :30, :45 | `/bronze.check-watchers` |

#### 2. Windows Task Scheduler Setup

**Create Weekly Briefing Task**:

```powershell
# PowerShell script to create Weekly Briefing task
$action = New-ScheduledTaskAction -Execute "claude" `
    -Argument "/silver.weekly-briefing" `
    -WorkingDirectory "C:\Users\Lap Zone\Personal AI Employee\AI_Employee_Vault"

$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At 7:00AM

$settings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Hours 1) `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 5)

Register-ScheduledTask `
    -TaskName "AI Employee - Weekly Briefing" `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Description "Generates weekly CEO briefing every Monday at 7 AM"
```

**Create Hourly Execution Task**:

```powershell
$action = New-ScheduledTaskAction -Execute "claude" `
    -Argument "/silver.execute-approved" `
    -WorkingDirectory "C:\Users\Lap Zone\Personal AI Employee\AI_Employee_Vault"

$trigger = New-ScheduledTaskTrigger -Once -At 12:00AM -RepetitionInterval (New-TimeSpan -Hours 1)

Register-ScheduledTask `
    -TaskName "AI Employee - Execute Approved" `
    -Action $action `
    -Trigger $trigger `
    -Description "Executes approved actions every hour"
```

**Create Dashboard Update Task** (Every 30 minutes):

```powershell
$action = New-ScheduledTaskAction -Execute "claude" `
    -Argument "/bronze.update-dashboard" `
    -WorkingDirectory "C:\Users\Lap Zone\Personal AI Employee\AI_Employee_Vault"

$trigger = New-ScheduledTaskTrigger -Once -At 12:00AM -RepetitionInterval (New-TimeSpan -Minutes 30)

Register-ScheduledTask `
    -TaskName "AI Employee - Update Dashboard" `
    -Action $action `
    -Trigger $trigger `
    -Description "Updates dashboard every 30 minutes"
```

#### 3. Unix/macOS Cron Setup

**Edit Crontab**:

```bash
crontab -e
```

**Add Cron Entries**:

```cron
# AI Employee Automated Tasks

# Weekly Briefing (Monday 7:00 AM)
0 7 * * 1 cd /path/to/vault && claude /silver.weekly-briefing >> /path/to/logs/briefing.log 2>&1

# Process Inbox (3 times daily: 8 AM, 2 PM, 6 PM)
0 8,14,18 * * * cd /path/to/vault && claude /bronze.process-inbox >> /path/to/logs/inbox.log 2>&1

# Execute Approved (Every hour)
0 * * * * cd /path/to/vault && claude /silver.execute-approved >> /path/to/logs/execute.log 2>&1

# Update Dashboard (Every 30 minutes)
*/30 * * * * cd /path/to/vault && claude /bronze.update-dashboard >> /path/to/logs/dashboard.log 2>&1

# Check Watchers (Every 15 minutes)
*/15 * * * * cd /path/to/vault && claude /bronze.check-watchers >> /path/to/logs/watchers.log 2>&1
```

#### 4. Verify Scheduled Tasks

**Windows - List Tasks**:

```powershell
Get-ScheduledTask | Where-Object {$_.TaskName -like "AI Employee*"}
```

**Unix/macOS - List Cron Jobs**:

```bash
crontab -l | grep "AI Employee"
```

#### 5. Test Scheduled Tasks

**Windows - Run Task Manually**:

```powershell
Start-ScheduledTask -TaskName "AI Employee - Weekly Briefing"
```

**Unix/macOS - Run Command Manually**:

```bash
cd /path/to/vault && claude /silver.weekly-briefing
```

#### 6. Monitor Execution Logs

**Create Log Monitoring Script**:

```bash
# check-schedule-health.sh
#!/bin/bash

VAULT_PATH="/path/to/vault"
LOG_PATH="/path/to/logs"

echo "=== AI Employee Schedule Health Check ==="
echo ""

# Check last briefing
echo "Last Weekly Briefing:"
ls -lt "$VAULT_PATH/Briefings/" | head -2

echo ""
echo "Last 5 Dashboard Updates:"
tail -5 "$LOG_PATH/dashboard.log"

echo ""
echo "Inbox Processing (last 24 hours):"
grep -c "$(date +%Y-%m-%d)" "$LOG_PATH/inbox.log" || echo "0"

echo ""
echo "Approved Executions (last 24 hours):"
grep -c "$(date +%Y-%m-%d)" "$LOG_PATH/execute.log" || echo "0"
```

### Acceptance Criteria

- [ ] All core tasks scheduled appropriately
- [ ] Schedules match recommended times
- [ ] Working directory set correctly
- [ ] Execution time limits configured
- [ ] Restart policies in place (Windows)
- [ ] Logging configured for all tasks
- [ ] Tasks verified through test runs

### Constraints

**Operational Constraints**:
- Tasks must run in correct working directory (vault root)
- Logs should rotate to prevent disk space issues
- Execution timeout: 1 hour per task maximum
- Failed tasks should retry (max 3 attempts)

**Security Constraints**:
- Scheduled tasks run with appropriate user permissions
- Credentials stored securely (not in task command)
- Log files protected from unauthorized access

## Examples

### Example 1: Complete Windows Setup

**Script**: `setup-windows-scheduler.ps1`

```powershell
# Complete Windows Task Scheduler Setup for AI Employee

$vaultPath = "C:\Users\Lap Zone\Personal AI Employee\AI_Employee_Vault"

# Task 1: Weekly Briefing
Write-Host "Creating Weekly Briefing task..."
$action1 = New-ScheduledTaskAction -Execute "claude" -Argument "/silver.weekly-briefing" -WorkingDirectory $vaultPath
$trigger1 = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At 7:00AM
Register-ScheduledTask -TaskName "AI Employee - Weekly Briefing" -Action $action1 -Trigger $trigger1

# Task 2: Hourly Execution
Write-Host "Creating Execute Approved task..."
$action2 = New-ScheduledTaskAction -Execute "claude" -Argument "/silver.execute-approved" -WorkingDirectory $vaultPath
$trigger2 = New-ScheduledTaskTrigger -Once -At 12:00AM -RepetitionInterval (New-TimeSpan -Hours 1)
Register-ScheduledTask -TaskName "AI Employee - Execute Approved" -Action $action2 -Trigger $trigger2

# Task 3: Dashboard Updates
Write-Host "Creating Dashboard Update task..."
$action3 = New-ScheduledTaskAction -Execute "claude" -Argument "/bronze.update-dashboard" -WorkingDirectory $vaultPath
$trigger3 = New-ScheduledTaskTrigger -Once -At 12:00AM -RepetitionInterval (New-TimeSpan -Minutes 30)
Register-ScheduledTask -TaskName "AI Employee - Update Dashboard" -Action $action3 -Trigger $trigger3

Write-Host ""
Write-Host "✅ All tasks created successfully!"
Write-Host ""
Write-Host "Verify with: Get-ScheduledTask | Where-Object {`$_.TaskName -like 'AI Employee*'}"
```

**Run Setup**:

```powershell
.\setup-windows-scheduler.ps1
```

**Output**:

```
Creating Weekly Briefing task...
Creating Execute Approved task...
Creating Dashboard Update task...

✅ All tasks created successfully!

Verify with: Get-ScheduledTask | Where-Object {$_.TaskName -like 'AI Employee*'}
```

### Example 2: Cron Job Installation

**Script**: `install-cron-jobs.sh`

```bash
#!/bin/bash

VAULT_PATH="/Users/you/AI_Employee_Vault"
LOG_PATH="$VAULT_PATH/Logs/scheduler"

# Create log directory
mkdir -p "$LOG_PATH"

# Backup existing crontab
crontab -l > "$VAULT_PATH/crontab.backup" 2>/dev/null

# Create new crontab entries
cat << EOF | crontab -
# AI Employee Automated Tasks
# Generated: $(date)

# Weekly Briefing (Monday 7:00 AM)
0 7 * * 1 cd "$VAULT_PATH" && claude /silver.weekly-briefing >> "$LOG_PATH/briefing.log" 2>&1

# Process Inbox (3x daily)
0 8,14,18 * * * cd "$VAULT_PATH" && claude /bronze.process-inbox >> "$LOG_PATH/inbox.log" 2>&1

# Execute Approved (Hourly)
0 * * * * cd "$VAULT_PATH" && claude /silver.execute-approved >> "$LOG_PATH/execute.log" 2>&1

# Update Dashboard (Every 30 min)
*/30 * * * * cd "$VAULT_PATH" && claude /bronze.update-dashboard >> "$LOG_PATH/dashboard.log" 2>&1

# Check Watchers (Every 15 min)
*/15 * * * * cd "$VAULT_PATH" && claude /bronze.check-watchers >> "$LOG_PATH/watchers.log" 2>&1
EOF

echo "✅ Cron jobs installed!"
echo ""
echo "Verify with: crontab -l"
echo "Backup saved to: $VAULT_PATH/crontab.backup"
```

## References

### Related Skills
- `/silver.weekly-briefing.md` - Scheduled weekly on Mondays
- `/silver.execute-approved.md` - Scheduled hourly
- `/bronze.process-inbox.md` - Scheduled 3x daily
- `/bronze.update-dashboard.md` - Scheduled every 30 min
- `/bronze.check-watchers.md` - Scheduled every 15 min

### Documentation
- `README.md` - System overview
- `.specify/memory/constitution.md` - Principle III (Proactive Management)

### External Resources
- [Windows Task Scheduler Docs](https://docs.microsoft.com/en-us/windows/win32/taskschd/task-scheduler-start-page)
- [Cron Expression Guide](https://crontab.guru/)
- [PowerShell Scheduled Tasks](https://docs.microsoft.com/en-us/powershell/module/scheduledtasks/)

### Related Constitution Principles
- **Principle III**: Proactive Autonomous Management

---

**Skill Version**: 1.0.0
**Last Updated**: 2026-01-09
**Tier**: Silver
**Author**: Personal AI Employee System
**Status**: Production Ready
**Requires**: Windows Task Scheduler or Unix cron
