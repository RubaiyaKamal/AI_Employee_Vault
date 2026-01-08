# Quick Testing Guide - Personal AI Employee

**Goal**: Verify your system works in 5 minutes

---

## Option 1: Automated Test (Recommended)

Run the automated test script:

```bash
python run_tests.py
```

**What it tests**:
- ✅ Vault folder structure
- ✅ Required files exist
- ✅ Agent skills available
- ✅ MCP configuration
- ✅ File drop monitoring (optional)

**Expected**: Most tests pass (file drop test may fail if watcher not running)

---

## Option 2: Manual Quick Tests

### Test 1: File Monitoring (2 minutes)

```bash
# Create test file
echo "---
type: file_drop
priority: high
---
# Test Task
This is a test." > test_task.md

# Drop in watched folder
mv test_task.md Watched_Files/

# Wait 3 seconds
sleep 3

# Check if action file created
ls Needs_Action/FILE_test_task*.md
```

**✅ Success**: File appears in Needs_Action/
**❌ If not**: Watcher not running → `python file_drop_watcher.py`

---

### Test 2: Process Inbox (1 minute)

```bash
# Process test items
claude /bronze.process-inbox
```

**Expected Output**:
```
Inbox Processing Report
=======================
- Items processed: X
- Plans created: X
```

**✅ Success**: Plans created in /Plans folder

---

### Test 3: Dashboard Update (30 seconds)

```bash
# Update dashboard
claude /bronze.update-dashboard

# View results
cat Dashboard.md
```

**Expected**: Dashboard shows current counts (Active Tasks, Pending Approvals, etc.)

**✅ Success**: Dashboard.md updated with timestamp

---

### Test 4: Web Browsing (30 seconds)

```bash
# Test MCP integration
claude /bronze.browse-web "https://example.com"
```

**Expected Output**:
```
Web Browsing Results
====================
URL: https://example.com
Status: 200 OK
Main Heading: "Example Domain"
```

**✅ Success**: MCP servers working!

---

### Test 5: Check Watchers (30 seconds)

```bash
claude /bronze.check-watchers
```

**Expected**: Status report showing which watchers are active/inactive

**✅ Success**: Report generated without errors

---

## Gmail-Specific Test (If Configured)

### Prerequisites
- Gmail API credentials (credentials.json)
- Authenticated (token.json exists)
- Watcher enabled in watcher_config.json

### Quick Gmail Test

```bash
# 1. Verify credentials
ls credentials.json token.json
# Both should exist

# 2. Test Gmail connection
python test_gmail_setup.py
```

**Expected Output**:
```
✓ Gmail API connected
✓ Access granted
Recent emails: [list of emails]
```

```bash
# 3. Start Gmail watcher
python gmail_watcher.py
```

**Expected**: Watcher starts and checks every 5 minutes

```bash
# 4. Send test email to yourself
# Subject: "URGENT: Test Email"
# Mark as Important (star it)

# 5. Wait 5 minutes, then check
ls Needs_Action/EMAIL_*.md
```

**✅ Success**: Email action file created!

---

## File Drop Complete Example

**Scenario**: Test complete workflow

```bash
# 1. Create realistic test file
cat > invoice_request.md << 'EOF'
---
type: email
from: client@example.com
subject: Invoice Request
priority: high
---
Can you send me the invoice for January?
EOF

# 2. Drop in Needs_Action (simulating email watcher)
mv invoice_request.md Needs_Action/

# 3. Process it
claude /bronze.process-inbox
# Expected: Plan created

# 4. Check plan
ls Plans/PLAN_email_*.md
cat Plans/PLAN_email_*.md
# Expected: Detailed plan with steps

# 5. Check if approval needed
ls Pending_Approval/
# May have approval request

# 6. Update dashboard
claude /bronze.update-dashboard
cat Dashboard.md
# Expected: Counts updated
```

**✅ Success**: Full workflow from item → plan → approval request!

---

## Troubleshooting Quick Checks

### File Watcher Not Working?

```bash
# Check if watcher is running
ps aux | grep file_drop_watcher

# If not running, start it
python file_drop_watcher.py

# In another terminal, test again
```

### Skills Not Found?

```bash
# Verify skills directory
ls .claude/skills/*.md
# Should show 7+ .md files

# Check you're in vault directory
pwd
# Should end with: AI_Employee_Vault
```

### MCP Not Working?

```bash
# Check MCP servers
claude mcp list
# Should show: ✓ Connected for 3 servers

# If not, reinstall
npm install -g @playwright/mcp@latest
npm install -g @modelcontextprotocol/server-filesystem
npm install -g @upstash/context7-mcp
```

---

## Success Criteria

Your system is working if:

- ✅ Automated test script passes most tests
- ✅ File drop creates action file in Needs_Action/
- ✅ Claude can process inbox items
- ✅ Dashboard updates correctly
- ✅ Web browsing works (MCP)
- ✅ Watchers show status

**All working?** → Your AI Employee is operational! 🎉

---

## Next Steps After Testing

### If Everything Works ✅

```bash
# 1. Start continuous monitoring
python watcher_manager.py
# Or individually:
python file_drop_watcher.py &
python gmail_watcher.py &  # If Gmail configured

# 2. Use in production
# Drop real files in Watched_Files/
# Process real emails

# 3. Schedule automation
# Set up cron jobs or Task Scheduler
# See TESTING_GUIDE.md for details
```

### If Some Tests Fail ⚠️

1. **Read detailed guide**: `TESTING_GUIDE.md`
2. **Check specific section** for the failed test
3. **Follow troubleshooting steps**
4. **Rerun tests** after fixes

---

## Daily Usage After Setup

```bash
# Morning routine (5 min)
claude /bronze.check-watchers
claude /bronze.update-dashboard
claude /bronze.process-inbox
claude /bronze.review-approvals

# Monday morning (add this)
claude /bronze.generate-briefing
```

---

## Complete Test Checklist

**Quick checklist for verification**:

- [ ] Run `python run_tests.py` → Most tests pass
- [ ] File drop test works (Watched_Files → Needs_Action)
- [ ] Process inbox works (Needs_Action → Plans)
- [ ] Dashboard updates correctly
- [ ] Web browsing works (example.com test)
- [ ] Watcher status shows correctly
- [ ] Gmail works (if configured)
- [ ] Skills all accessible

**All checked?** → Production ready! 🚀

---

## Getting Help

If tests fail:

1. **Check**: `TESTING_GUIDE.md` (detailed troubleshooting)
2. **Review**: Setup guides (GMAIL_SETUP_GUIDE.md, etc.)
3. **Verify**: Prerequisites (Python 3.13+, Node.js v16+)
4. **Join**: Wednesday research meetings

---

**Last Updated**: 2026-01-08
**Estimated Time**: 5-10 minutes for quick test
**Full Test**: 20-30 minutes with Gmail setup
