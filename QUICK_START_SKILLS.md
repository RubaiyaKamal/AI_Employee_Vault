# Quick Start Guide - Using Agent Skills

**Last Updated**: 2026-01-08
**Tier**: Bronze
**Skills Available**: 6 core skills

---

## What Are Agent Skills?

Agent Skills are Claude Code's superpower - they're like apps for your AI Employee. Each skill is a specialized capability that Claude can invoke to perform specific tasks.

**Think of it like this**:
- **Without skills**: "Claude, can you check my inbox?" → Claude reads files manually
- **With skills**: "Claude, process my inbox" → Claude invokes `/bronze.process-inbox` skill → Automated workflow

---

## Installation Verification

Skills are already installed in your vault at `.claude/skills/`. Verify:

```bash
ls -la .claude/skills/
```

**Expected output**:
```
process-inbox.md
update-dashboard.md
check-watchers.md
generate-plan.md
review-approvals.md
generate-briefing.md
README.md
```

✅ **All 6 skills present** → You're ready to go!

---

## The 6 Bronze Tier Skills

### 1. 📥 Process Inbox
**What it does**: Automatically processes all items in your Inbox and Needs_Action folders, creating action plans.

**When to use**:
- After watchers create new items
- When you have unprocessed emails/messages
- Start of your work session

**How to use**:
```bash
claude /bronze.process-inbox
```

**What happens**:
1. Scans Inbox and Needs_Action folders
2. Analyzes each item (email, WhatsApp, bank transaction, file)
3. Creates detailed plans in /Plans folder
4. Updates Dashboard
5. Creates approval requests for sensitive items

**Example output**:
```
Inbox Processing Report
=======================
- Items scanned: 5
- Items processed: 5
- Plans created: 5
- Approval required: 2
- Auto-executable: 3

Items Processed:
1. EMAIL_client_a - Invoice request → Plan created (approval req)
2. WHATSAPP_urgent - Support request → Plan created (approval req)
3. bank_subscription_netflix → Plan created (auto)
...

Next Steps:
- Review 2 items in /Pending_Approval
```

---

### 2. 📊 Update Dashboard
**What it does**: Updates your Dashboard.md with current system status.

**When to use**:
- After any major operation
- Before reviewing system status
- Every 15 minutes (can be scheduled)

**How to use**:
```bash
claude /bronze.update-dashboard
```

**What happens**:
1. Counts active tasks, pending approvals, completed items
2. Checks vault health
3. Reads recent logs
4. Updates Dashboard.md

**Example output**:
```
Dashboard Updated
=================
- Active Tasks: 3
- Pending Approval: 1
- Completed Today: 2
- Needs Action: 5
- Vault Health: ✅ Operational
```

---

### 3. 🔍 Check Watchers
**What it does**: Monitors your watcher scripts (Gmail, WhatsApp, Bank, File Drop) to ensure they're running.

**When to use**:
- Daily health check
- When no new items are appearing
- After system reboot
- Troubleshooting

**How to use**:
```bash
claude /bronze.check-watchers
```

**What happens**:
1. Reads watcher configuration
2. Checks if watcher scripts exist
3. Detects recent activity
4. Checks database health
5. Provides restart recommendations

**Example output**:
```
Watcher Status Report
=====================
WhatsApp Watcher: ✅ Active (last activity: 30 seconds ago)
Bank Watcher: ✅ Active (last activity: 5 minutes ago)
File Drop Watcher: ✅ Active

Issues Detected: None
Recommendations: Continue monitoring
```

---

### 4. 📝 Generate Plan
**What it does**: Creates a detailed action plan for a specific item.

**When to use**:
- Need detailed plan for specific item
- Want to customize approach before execution
- Reviewing complex scenarios

**How to use**:
```bash
# Process oldest unprocessed item
claude /bronze.generate-plan

# Process specific item
claude /bronze.generate-plan "/Needs_Action/EMAIL_client_a.md"
```

**What happens**:
1. Reads the item
2. Loads business context (Goals, Handbook)
3. Analyzes content deeply
4. Determines approval requirements
5. Creates detailed plan with steps
6. Generates approval request if needed

**Example output**:
```
Plan Generated
==============
- Plan file: /Plans/PLAN_email_client_a_20260108.md
- Source: /Needs_Action/EMAIL_client_a.md
- Objective: Send invoice to Client A
- Steps: 6
- Requires approval: Yes (email communication)
- Complexity: Simple

Approval request created in /Pending_Approval
```

---

### 5. ✅ Review Approvals
**What it does**: Helps you review all pending approval requests with risk assessment.

**When to use**:
- Before approving sensitive actions
- Daily approval queue check
- When Pending_Approval count > 0

**How to use**:
```bash
claude /bronze.review-approvals
```

**What happens**:
1. Scans /Pending_Approval folder
2. Reads related plans and source items
3. Assesses risk level
4. Generates approval dashboard
5. Handles expired approvals (>24 hours)

**Example output**:
```
Approval Dashboard
==================
Total Pending: 3
High Priority: 1
Expiring Soon: 1

1. [HIGH PRIORITY] Send Invoice to Client A
   - Action: send_email
   - Risk: Medium
   - Expires: 1 hour 30 minutes
   - To approve: Move APPROVAL_invoice_client_a.md to /Approved

2. Categorize Netflix Subscription
   - Action: categorize_transaction
   - Risk: Low
   - Expires: 22 hours

View full details in /Pending_Approval/APPROVAL_DASHBOARD.md
```

---

### 6. 📈 Generate CEO Briefing
**What it does**: Creates a comprehensive weekly business audit with revenue, tasks, bottlenecks, and recommendations.

**When to use**:
- Every Monday morning (recommended)
- End-of-week review
- Monthly business analysis
- Custom period review

**How to use**:
```bash
# Default: Last 7 days
claude /bronze.generate-briefing

# Custom period
claude /bronze.generate-briefing --period "2026-01-01 to 2026-01-07"
```

**What happens**:
1. Analyzes last 7 days (or custom period)
2. Calculates revenue from bank transactions
3. Counts completed tasks
4. Identifies bottlenecks (delayed tasks)
5. Finds unused subscriptions
6. Generates proactive suggestions
7. Tracks project deadlines
8. Creates comprehensive briefing report

**Example output**:
```
CEO Briefing Generated
======================
Period: Jan 1-7, 2026
File: /Briefings/2026-01-08_Monday_Briefing.md

Executive Summary:
- Revenue this week: $2,450
- MTD: $4,500 (45% of target)
- Tasks completed: 23
- Bottlenecks: 1 (Client B proposal delayed)
- Cost savings opportunity: $180/year

Proactive Suggestions:
1. Cancel unused Notion subscription ($180/year savings)
2. Follow up with 2 clients (no contact in 30+ days)
3. Create proposal template (reduce 48h→24h timeline)

View full briefing: /Briefings/2026-01-08_Monday_Briefing.md
```

---

## Typical Daily Workflow

### Morning Routine (5 minutes)

```bash
# 1. Check system health
claude /bronze.check-watchers

# 2. Update dashboard
claude /bronze.update-dashboard

# 3. Generate Monday briefing (Mondays only)
claude /bronze.generate-briefing

# 4. Process overnight inbox
claude /bronze.process-inbox

# 5. Review any pending approvals
claude /bronze.review-approvals
```

### During the Day (As needed)

```bash
# When new items arrive (or every 15 min)
claude /bronze.process-inbox

# Before making decisions
claude /bronze.update-dashboard

# When approvals needed
claude /bronze.review-approvals
```

### End of Day (2 minutes)

```bash
# Final dashboard update
claude /bronze.update-dashboard

# Check system health
claude /bronze.check-watchers
```

---

## Scheduled Automation

### Linux/macOS (cron)

Add to crontab (`crontab -e`):

```bash
# Update dashboard every 15 minutes
*/15 * * * * cd /path/to/vault && claude /bronze.update-dashboard

# Process inbox every 30 minutes
*/30 * * * * cd /path/to/vault && claude /bronze.process-inbox

# Monday briefing at 7 AM
0 7 * * 1 cd /path/to/vault && claude /bronze.generate-briefing

# Daily watcher health check at 8 AM
0 8 * * * cd /path/to/vault && claude /bronze.check-watchers

# Daily approval review at 9 AM
0 9 * * * cd /path/to/vault && claude /bronze.review-approvals
```

### Windows (Task Scheduler)

Create tasks with these settings:
- **Program**: `claude`
- **Arguments**: `/bronze.<skillname>`
- **Start in**: `C:\Users\Lap Zone\Personal AI Employee\AI_Employee_Vault`
- **Schedule**: As above

---

## Conversational Usage

You can also invoke skills naturally in conversation:

```
User: "Check my inbox"
Claude: [Invokes /bronze.process-inbox skill]
        I've processed 5 items from your inbox...

User: "What's my system status?"
Claude: [Invokes /bronze.update-dashboard skill]
        Dashboard updated. You have 3 active tasks...

User: "Are my watchers running?"
Claude: [Invokes /bronze.check-watchers skill]
        All watchers are operational...

User: "Review my approvals"
Claude: [Invokes /bronze.review-approvals skill]
        You have 2 pending approvals...

User: "Generate this week's briefing"
Claude: [Invokes /bronze.generate-briefing skill]
        CEO Briefing generated for Jan 1-7...
```

---

## Troubleshooting

### "Skill not found"

**Problem**: Claude can't find the skill

**Solution**:
```bash
# Verify skills exist
ls .claude/skills/*.md

# Restart Claude Code
# Ensure you're in the vault directory
```

### "Permission denied"

**Problem**: Claude can't read/write files

**Solution**:
```bash
# Check file permissions
chmod -R u+rw .claude/skills/

# Ensure vault folders exist
mkdir -p Inbox Needs_Action Plans Pending_Approval Approved Rejected Done Logs Briefings
```

### Skills run slowly

**Problem**: Large vault or many files

**Solution**:
```bash
# Archive old files
mv Done/* Done/archive_2025/

# Clean up logs older than 90 days
find Logs/ -mtime +90 -delete
```

---

## Getting Help

### Skill-Specific Help

Each skill has comprehensive documentation in `.claude/skills/`:

```bash
# Read full documentation
cat .claude/skills/process-inbox.md
cat .claude/skills/update-dashboard.md
cat .claude/skills/check-watchers.md
cat .claude/skills/generate-plan.md
cat .claude/skills/review-approvals.md
cat .claude/skills/generate-briefing.md
```

### General Help

```bash
# Skills overview
cat .claude/skills/README.md

# Bronze Tier status
cat BRONZE_TIER_STATUS.md

# Skills summary
cat SKILLS_SUMMARY.md

# System architecture
cat README.md
```

---

## Next Steps

### Test Your Skills

1. **Create test data**:
   ```bash
   # Copy a sample file to Needs_Action
   cp sample_action_file.md Needs_Action/test_item.md
   ```

2. **Process it**:
   ```bash
   claude /bronze.process-inbox
   ```

3. **Check dashboard**:
   ```bash
   claude /bronze.update-dashboard
   cat Dashboard.md
   ```

4. **Review plan**:
   ```bash
   ls Plans/
   cat Plans/PLAN_test_*.md
   ```

### Advance to Silver Tier

When ready:
1. Test all Bronze Tier skills
2. Run complete workflows
3. Install Email MCP
4. Create Silver Tier skills
5. Setup process management (PM2)
6. Configure automatic execution

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│              Bronze Tier Skills Quick Reference             │
├─────────────────────────────────────────────────────────────┤
│ /bronze.process-inbox      → Process Inbox/Needs_Action    │
│ /bronze.update-dashboard   → Update system status          │
│ /bronze.check-watchers     → Monitor watcher health        │
│ /bronze.generate-plan      → Create detailed plan          │
│ /bronze.review-approvals   → Review pending approvals      │
│ /bronze.generate-briefing  → Weekly CEO briefing           │
└─────────────────────────────────────────────────────────────┘
```

---

**Ready to start?** Run:

```bash
claude /bronze.update-dashboard
```

Your AI Employee is waiting for instructions! 🚀

---

**Document Version**: 1.0.0
**Last Updated**: 2026-01-08
**Status**: Production Ready
