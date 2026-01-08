# Testing Guide - Personal AI Employee

**Last Updated**: 2026-01-08
**Purpose**: Verify all components are working correctly

---

## Quick Test Checklist

Before detailed testing, verify basics:

```bash
# 1. Check you're in the vault directory
pwd
# Should show: .../AI_Employee_Vault

# 2. Verify MCP servers
claude mcp list
# Should show: ✓ playwright, ✓ vault-filesystem, ✓ context7

# 3. Check folder structure
ls -la
# Should show: Inbox, Needs_Action, Plans, Dashboard.md, etc.

# 4. Verify Python installed
python --version
# Should show: Python 3.13+

# 5. Check watcher scripts exist
ls *.py
# Should show: gmail_watcher.py, file_drop_watcher.py, etc.
```

✅ **All checks passed?** → Proceed to detailed testing below

---

## Test 1: File Monitoring (Simplest Test)

**Purpose**: Verify file drop watcher and inbox processing workflow

### Step 1: Prepare Test File

```bash
# Create a test task file
cat > test_task.md << 'EOF'
---
type: file_drop
priority: high
status: pending
---

# Test Task

This is a test file to verify the file monitoring system works.

Action needed: Process this file and create a plan.
EOF

# Verify file created
cat test_task.md
```

### Step 2: Drop File in Watched Directory

```bash
# Copy test file to Watched_Files folder
cp test_task.md Watched_Files/

# Wait 2-3 seconds for watcher to detect
sleep 3

# Check if watcher created action file
ls Needs_Action/
# Should show: FILE_test_task*.md (if watcher is running)
```

**Expected Result**: New file in `Needs_Action/` folder

**If file appears**: ✅ File watcher is working!

**If no file appears**: Watcher may not be running → See "Start Watcher" below

### Step 3: Start File Watcher (if not running)

```bash
# Start file drop watcher manually
python file_drop_watcher.py
```

**Expected Output**:
```
Starting FileDropWatcher...
Monitoring directories: ['Watched_Files']
Watcher initialized. Watching for new files...
```

**Keep this running in terminal**, then in a **new terminal** drop the file:

```bash
# In new terminal
cd "C:\Users\Lap Zone\Personal AI Employee\AI_Employee_Vault"
cp test_task.md Watched_Files/

# Check Needs_Action
ls Needs_Action/
```

**Should see**: `FILE_test_task_<timestamp>.md`

✅ **Success**: File watcher detected and created action file!

### Step 4: Process with Claude Code

```bash
# Process the inbox
claude /bronze.process-inbox
```

**Expected Output**:
```
Inbox Processing Report
=======================
- Items scanned: 1
- Items processed: 1
- Plans created: 1
- Approval required: 0
- Auto-executable: 1

Items Processed:
1. FILE_test_task → Plan created

Next Steps:
- 1 plan ready for review in /Plans
```

**Verify**:
```bash
# Check plan was created
ls Plans/
# Should show: PLAN_file_test_task_*.md

# Read the plan
cat Plans/PLAN_file_test_task_*.md
```

✅ **Success**: File → Watcher → Needs_Action → Claude → Plan created!

---

## Test 2: Gmail Monitoring (Full Setup)

**Purpose**: Verify Gmail watcher detects emails and creates action items

### Prerequisites

**Gmail API Setup Required**:
1. Google Cloud Project
2. Gmail API enabled
3. OAuth credentials
4. Token file (`token.json`)

**Check if already set up**:
```bash
ls credentials.json token.json
# If both exist: ✅ Already configured
# If missing: Follow GMAIL_SETUP_GUIDE.md
```

### Step 1: Quick Gmail Setup (if needed)

```bash
# 1. Check setup guide
cat GMAIL_SETUP_GUIDE.md

# 2. Run authentication script
python authenticate_gmail.py

# This will:
# - Open browser for Google login
# - Request Gmail permissions
# - Save token.json
```

**Expected**: Browser opens, you log in, permissions granted, `token.json` created

### Step 2: Test Gmail Connection

```bash
# Test Gmail API connection
python test_gmail_setup.py
```

**Expected Output**:
```
Testing Gmail API connection...
✓ Credentials loaded successfully
✓ Gmail API connected
✓ Access granted

Recent emails:
1. From: sender@example.com - Subject: Test Email
2. From: another@example.com - Subject: Hello

Gmail connection test: PASSED ✅
```

**If error**: Check `token.json` exists and credentials are valid

### Step 3: Configure Gmail Watcher

```bash
# Edit watcher config to enable Gmail
cat watcher_config.json

# Should show:
# "gmail_enabled": false  ← Change to true
```

**Enable Gmail**:
```bash
# Edit config (use nano, vim, or text editor)
nano watcher_config.json

# Change line:
"gmail_enabled": false
# To:
"gmail_enabled": true

# Save and exit (Ctrl+O, Ctrl+X in nano)
```

**Verify**:
```bash
cat watcher_config.json | grep gmail_enabled
# Should show: "gmail_enabled": true
```

### Step 4: Start Gmail Watcher

```bash
# Start Gmail watcher
python gmail_watcher.py
```

**Expected Output**:
```
Starting Gmail Watcher...
Checking for Gmail API credentials...
✓ Credentials found
✓ Gmail API connected
Monitoring Gmail every 300 seconds (5 minutes)...

[2026-01-08 15:00:00] Checking for new emails...
Found 0 new important emails
Waiting 300 seconds until next check...
```

✅ **Success**: Gmail watcher is running!

### Step 5: Send Test Email to Yourself

**Method 1: Use Another Email Account**

1. From another email, send to your Gmail
2. Subject: **URGENT: Test Email for AI Employee**
3. Body: "This is a test to verify Gmail monitoring works"
4. Mark as **Important** (star it)

**Method 2: Create Test Email in Gmail**

1. Open Gmail web interface
2. Draft email to yourself
3. Subject: **URGENT: Invoice Request Test**
4. Send and mark important

### Step 6: Wait for Watcher Detection

**Watcher checks every 300 seconds (5 minutes)**

```bash
# Watch the watcher output in terminal
# You should see:
[2026-01-08 15:05:00] Checking for new emails...
Found 1 new important email
Creating action file: EMAIL_test_20260108.md
✓ Action file created in Needs_Action/

Waiting 300 seconds until next check...
```

**Or check manually**:
```bash
# After 5 minutes, check Needs_Action folder
ls Needs_Action/
# Should show: EMAIL_*_test_*.md
```

### Step 7: Verify Action File Created

```bash
# Read the created email action file
cat Needs_Action/EMAIL_*.md
```

**Expected Content**:
```markdown
---
type: email
from: your-email@gmail.com
subject: URGENT: Test Email for AI Employee
received: 2026-01-08T15:05:00Z
priority: high
status: pending
---

## Email Content
This is a test to verify Gmail monitoring works

## Suggested Actions
- [ ] Reply to sender
- [ ] Process request
- [ ] Archive after processing
```

✅ **Success**: Gmail → Watcher → Action file created!

### Step 8: Process Email with Claude

```bash
# Process the email through Claude
claude /bronze.process-inbox
```

**Expected Output**:
```
Inbox Processing Report
=======================
- Items scanned: 1 (EMAIL)
- Items processed: 1
- Plans created: 1
- Approval required: 1 (email reply)

Items Processed:
1. EMAIL_test → Plan created (approval req)

Next Steps:
- Review 1 item in /Pending_Approval
```

**Verify Plan**:
```bash
# Check plan created
ls Plans/PLAN_email_*.md

# Read the plan
cat Plans/PLAN_email_*.md
```

**Should contain**:
- Analysis of email content
- Steps to respond
- Approval requirement (for email reply)
- Success criteria

✅ **Complete Gmail Test**: Email received → Watcher detected → Action created → Plan generated!

---

## Test 3: Complete End-to-End Workflow

**Purpose**: Test full workflow from file drop to completion

### Workflow Steps

```
1. File Drop → Watched_Files/
2. Watcher Detects → Creates Needs_Action/
3. Claude Processes → Creates Plans/
4. Human Reviews → Moves to Approved/
5. (Silver Tier: Execute) → Moves to Done/
6. Dashboard Updates → Shows metrics
```

### Complete Test Scenario

**Scenario**: Client sends invoice request (simulated via file)

#### Step 1: Create Realistic Test Email

```bash
cat > test_invoice_request.md << 'EOF'
---
type: email
from: client.a@example.com
subject: January Invoice Request
received: 2026-01-08T15:30:00Z
priority: high
status: pending
---

## Email Content
Hi,

Can you please send me the invoice for January consulting services?

Thanks,
Client A
EOF

# Move to Needs_Action (simulating email watcher)
mv test_invoice_request.md Needs_Action/
```

#### Step 2: Process Inbox

```bash
claude /bronze.process-inbox
```

**Expected**: Plan created for invoice generation

#### Step 3: Check Generated Plan

```bash
# List plans
ls Plans/

# Read the invoice plan
cat Plans/PLAN_email_client*invoice*.md
```

**Should show**:
- Objective: Send invoice to Client A
- Steps with checkboxes
- Approval required: Yes
- Draft email or invoice details

#### Step 4: Review Approval Request

```bash
# Check pending approvals
ls Pending_Approval/

# Read approval request
cat Pending_Approval/APPROVAL_*.md
```

**Should show**:
- What will happen (send invoice email)
- Details (amount, recipient)
- How to approve
- How to reject

#### Step 5: Approve the Action

```bash
# Move to Approved folder (simulating human approval)
mv Pending_Approval/APPROVAL_email_client*.md Approved/

# Verify
ls Approved/
```

**Note**: In Bronze Tier, this is where workflow pauses
**Silver Tier** would automatically execute and move to Done/

#### Step 6: Update Dashboard

```bash
# Update dashboard to reflect changes
claude /bronze.update-dashboard
```

**Expected Output**:
```
Dashboard Updated
=================
- Active Tasks: 1
- Pending Approval: 0 (was 1)
- Approved: 1
- Needs Action: 0
- Vault Health: ✅ Operational
```

**Verify Dashboard**:
```bash
cat Dashboard.md
```

**Should show**:
- Pending Approval: 0
- Recent Activity: "[2026-01-08 15:35] Processed invoice request"

✅ **Complete Workflow Test Passed!**

---

## Test 4: Skills Testing

### Test Each Skill Individually

#### Process Inbox Skill
```bash
# Create test item
echo "Test" > Needs_Action/test.md

# Run skill
claude /bronze.process-inbox

# Verify
ls Plans/  # Should have new plan
```

#### Update Dashboard Skill
```bash
claude /bronze.update-dashboard

# Check output
cat Dashboard.md
# Should show current counts
```

#### Check Watchers Skill
```bash
claude /bronze.check-watchers
```

**Expected Output**:
```
Watcher Status Report
=====================
Gmail Watcher: ✅ Active (if running)
WhatsApp Watcher: ⚠️ Disabled (if not configured)
Bank Watcher: ⚠️ Disabled (if not configured)
File Drop Watcher: ✅ Active (last activity: 2 min ago)

Issues Detected: None
Recommendations: All enabled watchers operational
```

#### Generate Plan Skill
```bash
# Create specific test item
cat > Needs_Action/urgent_test.md << 'EOF'
---
type: whatsapp
from: +1234567890
priority: high
---
URGENT: Website is down!
EOF

# Generate plan for it
claude /bronze.generate-plan "Needs_Action/urgent_test.md"

# Check plan
ls Plans/PLAN_whatsapp_urgent*.md
```

#### Browse Web Skill (MCP Test)
```bash
# Test web browsing
claude /bronze.browse-web "https://example.com"
```

**Expected Output**:
```
Web Browsing Results
====================
URL: https://example.com
Status: 200 OK
Title: Example Domain

Main Heading: "Example Domain"
Description: "This domain is for use in illustrative examples..."

Content extracted successfully.
```

✅ **MCP Integration Working!**

#### Generate Briefing Skill
```bash
# Generate test briefing
claude /bronze.generate-briefing
```

**Expected**: Briefing file created in `/Briefings/`

```bash
# Check briefing
ls Briefings/
cat Briefings/2026-01-08*.md
```

---

## Test 5: Watcher Manager (All Watchers)

**Purpose**: Test orchestrator that manages all watchers

### Start All Watchers at Once

```bash
# Edit config to enable watchers you want
nano watcher_config.json

# Enable what you have set up:
{
  "gmail_enabled": true,      # If Gmail configured
  "whatsapp_enabled": false,  # If not set up yet
  "bank_enabled": false,      # If not set up yet
  "file_drop_enabled": true   # Should work
}

# Start watcher manager
python watcher_manager.py
```

**Expected Output**:
```
Starting Watcher Manager...
Loading configuration from watcher_config.json

Enabled watchers:
✓ Gmail Watcher (interval: 300s)
✓ File Drop Watcher (real-time)

Starting watchers...
✓ Gmail Watcher started (PID: 12345)
✓ File Drop Watcher started (PID: 12346)

All watchers running. Press Ctrl+C to stop.

[Monitor mode - showing watcher activity]
```

### Test with Manager Running

**While manager is running, in a new terminal**:

```bash
# Drop test file
echo "Manager test" > test_manager.md
cp test_manager.md Watched_Files/

# Wait 3 seconds
sleep 3

# Check if detected
ls Needs_Action/FILE_test_manager*.md
# Should exist!

# If Gmail enabled, send test email
# Check in 5 minutes: ls Needs_Action/EMAIL_*.md
```

✅ **Watcher Manager Working!**

---

## Test 6: Dashboard and Metrics

### Test Dashboard Updates

```bash
# Create some activity
echo "Test 1" > Needs_Action/test1.md
echo "Test 2" > Needs_Action/test2.md
echo "Test 3" > Needs_Action/test3.md

# Update dashboard
claude /bronze.update-dashboard

# Check counts
cat Dashboard.md
```

**Should show**:
- Needs Action: 3
- Active Tasks: 0
- Vault Health: ✅ Operational

```bash
# Process inbox
claude /bronze.process-inbox

# Update dashboard again
claude /bronze.update-dashboard

# Check counts updated
cat Dashboard.md
```

**Should show**:
- Needs Action: 0 (processed)
- Active Tasks: 3 (plans created)

✅ **Dashboard Tracking Working!**

---

## Test 7: MCP Servers

### Test All 3 MCP Servers

#### Playwright MCP
```bash
claude /bronze.browse-web "https://example.com"
# Should extract "Example Domain" heading
```

#### Filesystem MCP
```bash
# Automatic - test by doing file operations
claude /bronze.update-dashboard
# Uses filesystem MCP internally - faster than before!
```

#### Context7 MCP
```bash
# Tell Claude something to remember
# In conversation with Claude:
```

**Test Context7**:
```
You: "Remember: Client A prefers invoices sent on the 1st of each month"

Claude: [Stores in Context7] "Got it! I'll remember that Client A prefers invoices on the 1st of each month."

You: "What do you know about Client A?"

Claude: [Retrieves from Context7] "Client A prefers to receive invoices on the 1st of each month."
```

✅ **All MCP Servers Operational!**

---

## Troubleshooting Common Issues

### File Watcher Not Detecting

**Problem**: Dropped file not appearing in Needs_Action

**Solutions**:
```bash
# 1. Check watcher is running
ps aux | grep file_drop_watcher
# If not running: python file_drop_watcher.py

# 2. Check database
ls .watched_files.db
# Should exist

# 3. Check folder exists
ls Watched_Files/
# Should exist

# 4. Try with absolute path
cp test.md "$(pwd)/Watched_Files/"
```

### Gmail Watcher Not Starting

**Problem**: Gmail watcher fails to start

**Solutions**:
```bash
# 1. Check credentials exist
ls credentials.json token.json

# 2. Re-authenticate
python authenticate_gmail.py

# 3. Check Gmail API enabled in Google Cloud Console

# 4. View error messages
python gmail_watcher.py 2>&1 | tee gmail_error.log
```

### Skills Not Found

**Problem**: `claude /bronze.process-inbox` says "skill not found"

**Solutions**:
```bash
# 1. Check skills exist
ls .claude/skills/*.md

# 2. Check you're in vault directory
pwd

# 3. Restart Claude Code
# (Close and reopen terminal)

# 4. Try with commands instead
ls .claude/commands/bronze.*.md
```

### MCP Not Connected

**Problem**: `claude mcp list` shows "✗ Failed"

**Solutions**:
```bash
# 1. Reinstall MCP packages
npm install -g @playwright/mcp@latest
npm install -g @modelcontextprotocol/server-filesystem
npm install -g @upstash/context7-mcp

# 2. Check Node.js version
node --version  # Should be v16+

# 3. Check configuration
cat ~/.claude.json

# 4. Try list again
claude mcp list
```

---

## Testing Checklist

Use this checklist to verify your system:

### Basic Setup
- [ ] In vault directory
- [ ] MCP servers connected (3/3)
- [ ] Folders exist (Inbox, Needs_Action, Plans, etc.)
- [ ] Python 3.13+ installed
- [ ] Node.js v16+ installed

### File Monitoring
- [ ] File drop watcher script exists
- [ ] Can drop file in Watched_Files
- [ ] File appears in Needs_Action
- [ ] Claude can process file
- [ ] Plan created in Plans/

### Gmail Monitoring (if configured)
- [ ] Gmail API credentials configured
- [ ] token.json exists
- [ ] Gmail watcher starts without errors
- [ ] Test email detected
- [ ] Action file created in Needs_Action
- [ ] Claude processes email

### Skills
- [ ] process-inbox works
- [ ] update-dashboard works
- [ ] check-watchers works
- [ ] generate-plan works
- [ ] browse-web works (MCP)
- [ ] generate-briefing works

### MCP Servers
- [ ] Playwright connected
- [ ] Filesystem connected
- [ ] Context7 connected
- [ ] Web browsing works
- [ ] Context persistence works

### Complete Workflow
- [ ] Item detected → Action created
- [ ] Action processed → Plan created
- [ ] Plan requires approval → Approval request created
- [ ] Approval given → Ready for execution
- [ ] Dashboard reflects changes

---

## Next Steps After Testing

### If All Tests Pass ✅

Congratulations! Your system is working. Next:

1. **Use in production**: Start processing real items
2. **Schedule watchers**: Use cron/Task Scheduler for continuous operation
3. **Customize goals**: Update Business_Goals.md for your needs
4. **Monitor metrics**: Generate weekly CEO briefings
5. **Plan Silver Tier**: Add execution capability

### If Some Tests Fail ⚠️

1. **Document failures**: Note which tests failed
2. **Check troubleshooting**: See solutions above
3. **Review setup guides**: GMAIL_SETUP_GUIDE.md, WATCHER_SETUP_GUIDE.md
4. **Test incrementally**: Fix one thing at a time
5. **Ask for help**: Join Wednesday research meetings

---

## Production Readiness Checklist

Before using for real work:

- [ ] All tests above pass
- [ ] Gmail configured (if needed)
- [ ] Business_Goals.md customized
- [ ] Company_Handbook.md reviewed
- [ ] Watchers scheduled or running continuously
- [ ] Backup strategy in place
- [ ] .env file not committed to git
- [ ] Constitution principles understood

✅ **All checked?** → Your AI Employee is production ready!

---

**Last Updated**: 2026-01-08
**Status**: Comprehensive testing guide complete
**Next**: Run tests and verify your system works!
