# AI Employee - Windows Task Scheduler Setup Script
# Generated: 2026-01-09
# Purpose: Configure automated scheduling for Silver Tier

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  AI Employee - Scheduler Setup (Silver)" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$vaultPath = "C:\Users\Lap Zone\Personal AI Employee\AI_Employee_Vault"
$claudeCommand = "claude"

Write-Host "Vault Path: $vaultPath" -ForegroundColor Yellow
Write-Host "Claude Command: $claudeCommand" -ForegroundColor Yellow
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "WARNING: Not running as Administrator" -ForegroundColor Yellow
    Write-Host "Some tasks may require elevated privileges" -ForegroundColor Yellow
    Write-Host ""
}

# Remove existing tasks (if any)
Write-Host "Checking for existing AI Employee tasks..." -ForegroundColor Cyan
$existingTasks = Get-ScheduledTask | Where-Object {$_.TaskName -like "AI Employee*"}
if ($existingTasks) {
    Write-Host "Found $($existingTasks.Count) existing task(s). Removing..." -ForegroundColor Yellow
    $existingTasks | ForEach-Object {
        Unregister-ScheduledTask -TaskName $_.TaskName -Confirm:$false
        Write-Host "  Removed: $($_.TaskName)" -ForegroundColor Gray
    }
    Write-Host ""
}

# Task 1: Weekly Briefing (Monday 7:00 AM)
Write-Host "[1/4] Creating Weekly Briefing task..." -ForegroundColor Green

$action1 = New-ScheduledTaskAction `
    -Execute $claudeCommand `
    -Argument "/silver.weekly-briefing" `
    -WorkingDirectory $vaultPath

$trigger1 = New-ScheduledTaskTrigger `
    -Weekly `
    -DaysOfWeek Monday `
    -At 7:00AM

$settings1 = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Hours 1) `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 5) `
    -StartWhenAvailable

Register-ScheduledTask `
    -TaskName "AI Employee - Weekly Briefing" `
    -Action $action1 `
    -Trigger $trigger1 `
    -Settings $settings1 `
    -Description "Generates weekly CEO briefing every Monday at 7:00 AM" `
    -ErrorAction Stop | Out-Null

Write-Host "  [OK] Weekly Briefing (Mondays at 7:00 AM)" -ForegroundColor Green
Write-Host ""

# Task 2: Execute Approved Actions (Every Hour)
Write-Host "[2/4] Creating Execute Approved task..." -ForegroundColor Green

$action2 = New-ScheduledTaskAction `
    -Execute $claudeCommand `
    -Argument "/silver.execute-approved" `
    -WorkingDirectory $vaultPath

$trigger2 = New-ScheduledTaskTrigger `
    -Once `
    -At 12:00AM `
    -RepetitionInterval (New-TimeSpan -Hours 1) `
    -RepetitionDuration (New-TimeSpan -Days 365)

$settings2 = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 30) `
    -RestartCount 2 `
    -RestartInterval (New-TimeSpan -Minutes 5) `
    -StartWhenAvailable

Register-ScheduledTask `
    -TaskName "AI Employee - Execute Approved" `
    -Action $action2 `
    -Trigger $trigger2 `
    -Settings $settings2 `
    -Description "Executes approved actions every hour" `
    -ErrorAction Stop | Out-Null

Write-Host "  [OK] Execute Approved (Every hour)" -ForegroundColor Green
Write-Host ""

# Task 3: Process Inbox (3x Daily: 8 AM, 2 PM, 6 PM)
Write-Host "[3/4] Creating Process Inbox task..." -ForegroundColor Green

$action3 = New-ScheduledTaskAction `
    -Execute $claudeCommand `
    -Argument "/bronze.process-inbox" `
    -WorkingDirectory $vaultPath

# Create 3 triggers for 8 AM, 2 PM, 6 PM
$trigger3a = New-ScheduledTaskTrigger -Daily -At 8:00AM
$trigger3b = New-ScheduledTaskTrigger -Daily -At 2:00PM
$trigger3c = New-ScheduledTaskTrigger -Daily -At 6:00PM

$settings3 = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 30) `
    -RestartCount 2 `
    -RestartInterval (New-TimeSpan -Minutes 5) `
    -StartWhenAvailable

Register-ScheduledTask `
    -TaskName "AI Employee - Process Inbox" `
    -Action $action3 `
    -Trigger $trigger3a,$trigger3b,$trigger3c `
    -Settings $settings3 `
    -Description "Processes inbox items 3 times daily (8 AM, 2 PM, 6 PM)" `
    -ErrorAction Stop | Out-Null

Write-Host "  [OK] Process Inbox (8 AM, 2 PM, 6 PM)" -ForegroundColor Green
Write-Host ""

# Task 4: Update Dashboard (Every 30 Minutes)
Write-Host "[4/4] Creating Update Dashboard task..." -ForegroundColor Green

$action4 = New-ScheduledTaskAction `
    -Execute $claudeCommand `
    -Argument "/bronze.update-dashboard" `
    -WorkingDirectory $vaultPath

$trigger4 = New-ScheduledTaskTrigger `
    -Once `
    -At 12:00AM `
    -RepetitionInterval (New-TimeSpan -Minutes 30) `
    -RepetitionDuration (New-TimeSpan -Days 365)

$settings4 = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 10) `
    -RestartCount 2 `
    -RestartInterval (New-TimeSpan -Minutes 2) `
    -StartWhenAvailable `
    -MultipleInstances IgnoreNew

Register-ScheduledTask `
    -TaskName "AI Employee - Update Dashboard" `
    -Action $action4 `
    -Trigger $trigger4 `
    -Settings $settings4 `
    -Description "Updates dashboard every 30 minutes" `
    -ErrorAction Stop | Out-Null

Write-Host "  [OK] Update Dashboard (Every 30 minutes)" -ForegroundColor Green
Write-Host ""

# Verification
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Verification" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$createdTasks = Get-ScheduledTask | Where-Object {$_.TaskName -like "AI Employee*"}

if ($createdTasks.Count -eq 4) {
    Write-Host "[OK] SUCCESS: All 4 tasks created successfully!" -ForegroundColor Green
    Write-Host ""

    Write-Host "Scheduled Tasks:" -ForegroundColor Cyan
    $createdTasks | ForEach-Object {
        $nextRun = (Get-ScheduledTaskInfo -TaskName $_.TaskName).NextRunTime
        Write-Host "  * $($_.TaskName)" -ForegroundColor White
        Write-Host "    Next run: $nextRun" -ForegroundColor Gray
    }
} else {
    Write-Host "[ERROR] ERROR: Expected 4 tasks, but found $($createdTasks.Count)" -ForegroundColor Red
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Schedule Summary" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Weekly Briefing:      Mondays at 7:00 AM" -ForegroundColor White
Write-Host "Execute Approved:     Every hour (24x daily)" -ForegroundColor White
Write-Host "Process Inbox:        3x daily (8 AM, 2 PM, 6 PM)" -ForegroundColor White
Write-Host "Update Dashboard:     Every 30 minutes (48x daily)" -ForegroundColor White
Write-Host ""

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Next Steps" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. View tasks in Task Scheduler:" -ForegroundColor Yellow
Write-Host "   taskschd.msc" -ForegroundColor Gray
Write-Host ""

Write-Host "2. Test a task manually:" -ForegroundColor Yellow
Write-Host "   Start-ScheduledTask -TaskName 'AI Employee - Update Dashboard'" -ForegroundColor Gray
Write-Host ""

Write-Host "3. Check task history:" -ForegroundColor Yellow
Write-Host "   Get-ScheduledTask | Where-Object {`$_.TaskName -like 'AI Employee*'} | Get-ScheduledTaskInfo" -ForegroundColor Gray
Write-Host ""

Write-Host "4. Disable a task (if needed):" -ForegroundColor Yellow
Write-Host "   Disable-ScheduledTask -TaskName 'AI Employee - [TaskName]'" -ForegroundColor Gray
Write-Host ""

Write-Host "[OK] Setup Complete! Silver Tier scheduling configured." -ForegroundColor Green
Write-Host ""
