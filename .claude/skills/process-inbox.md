# Process Inbox Items

## Title
**Process Inbox Items** - Automated Processing of Incoming Action Items

## Description

This skill processes all items in the `/Inbox` and `/Needs_Action` folders, analyzes their content, determines required actions, and creates structured action plans. It is the primary entry point for the AI Employee's reasoning workflow.

**Capability Level**: Bronze Tier
**Category**: Core Operations
**Risk Level**: Low (Read-only analysis, no external actions)

## Instructions

### Execution Flow

#### 1. Scan for New Items
```
Input: None (scans predefined folders)
Output: List of unprocessed items with metadata
```

**Steps**:
- List all files in `/Inbox` folder
- List all files in `/Needs_Action` folder
- Filter for `.md` files only
- Check if each item has a corresponding plan in `/Plans`
- Identify unprocessed items (no existing plan)
- Sort by:
  1. Priority (high → normal) from frontmatter
  2. Timestamp (oldest → newest) from frontmatter

**Code Pattern**:
```python
# Pseudocode for scanning
items = []
for folder in ['/Inbox', '/Needs_Action']:
    for file in folder.glob('*.md'):
        frontmatter = parse_frontmatter(file)
        plan_exists = check_plan_exists(file)
        if not plan_exists:
            items.append({
                'path': file,
                'priority': frontmatter.get('priority', 'normal'),
                'timestamp': frontmatter.get('received'),
                'type': frontmatter.get('type')
            })
items.sort(key=lambda x: (x['priority'] != 'high', x['timestamp']))
```

#### 2. Load Context
**Required Files**:
- `Company_Handbook.md` - Decision rules and operational policies
- `Business_Goals.md` - Strategic objectives and KPIs
- `.specify/memory/constitution.md` - Governance principles

**Extract**:
- Decision Matrix (Information/Communication/Financial/Content)
- Priority keywords and triggers
- Approval thresholds
- Business objectives for alignment

#### 3. Process Each Item

For each item in the queue:

**A. Read Item Content**:
```markdown
# Example item structure
---
type: email | whatsapp | bank | file_drop
from: sender@example.com
subject: Invoice Request
received: 2026-01-08T10:30:00Z
priority: high | normal
status: pending
---

## Content
[Item body/message/transaction details]
```

**B. Analyze Item**:
- **Type Classification**: Email, WhatsApp, Bank, File Drop
- **Intent Detection**: Request, Question, Transaction, Notification
- **Urgency**: Time-sensitive keywords (urgent, ASAP, today, deadline)
- **Sensitivity**: Contains payment, credentials, personal data?
- **Business Alignment**: Relates to active projects or goals?

**C. Determine Action Type**:

| Item Type | Common Actions | Approval Required? |
|-----------|---------------|-------------------|
| Email (known contact) | Reply, Forward, Archive | Yes (reply/forward) |
| Email (new contact) | Review, Reply | Yes (always) |
| WhatsApp (client) | Reply, Create task | Yes (reply) |
| Bank (subscription) | Categorize, Flag review | No (info only) |
| Bank (large transaction) | Flag, Request approval | Yes (>$500) |
| File Drop (document) | Classify, Extract data | No (read-only) |

#### 4. Create Action Plans

For each processed item, generate `/Plans/PLAN_<type>_<id>.md`:

**Template Structure**:
```markdown
---
created: <ISO timestamp>
source_item: <path to original>
status: pending
requires_approval: yes|no
priority: high|normal
---

# Action Plan: <Brief Title>

## Source
- Type: <type>
- From: <sender>
- Received: <timestamp>

## Objective
<1-2 sentence description>

## Analysis
<Content analysis and required action rationale>

## Steps
- [ ] Step 1: Action description
- [ ] Step 2: Action description
- [ ] Step 3: Action **[REQUIRES APPROVAL]**
- [ ] Step 4: Action description

## Approval Required
Yes/No

<If yes, explain why and approval process>

## Success Criteria
- [ ] Measurable outcome 1
- [ ] Measurable outcome 2

## Constraints
- Constitution Principle: <applicable>
- Must not: <prohibited actions>
```

#### 5. Update Dashboard

After processing:
- Increment "Active Tasks" count
- Update "Needs Action" count (decrement)
- Add entry to "Recent Activity"
- Update "Last Processing Run" timestamp

#### 6. Generate Summary Report

Output format:
```markdown
# Inbox Processing Report
Generated: 2026-01-08T11:00:00Z

## Summary
- Items scanned: 15
- Items processed: 8
- Plans created: 8
- Approval required: 3
- Auto-executable: 5

## Items Processed
1. EMAIL_client_a_inv - Invoice request → Plan created (approval req)
2. WHATSAPP_urgent_help - Support request → Plan created (approval req)
3. bank_subscription_netflix - Subscription charge → Plan created (auto)
...

## Next Steps
- Review 3 items in /Pending_Approval
- 5 plans ready for execution (Silver Tier)
- No errors encountered
```

### Acceptance Criteria

- [ ] All `.md` files in Inbox/Needs_Action are scanned
- [ ] Each unprocessed item has a corresponding plan
- [ ] Plans accurately reflect item content and intent
- [ ] Approval requirements correctly identified
- [ ] Dashboard.md updated with accurate counts
- [ ] No duplicate plans created
- [ ] All frontmatter fields populated correctly

### Constraints

**Constitution Compliance**:
- **Principle II**: Human-in-the-Loop - Sensitive actions flagged for approval
- **Principle IV**: Audit Logging - All processing logged
- **Principle V**: File-Based Workflow - Plans created as files, not in-memory

**Operational Constraints**:
- Never modify original items in Inbox/Needs_Action
- Never execute actions during processing (Bronze Tier limitation)
- Never delete or move items without explicit instruction
- Read-only access to all reference documents

## Examples

### Example 1: Processing Email Invoice Request

**Input File**: `/Needs_Action/EMAIL_client_a_20260108.md`
```markdown
---
type: email
from: client.a@example.com
subject: January Invoice Request
received: 2026-01-08T10:30:00Z
priority: high
status: pending
---

## Email Content
Hi, can you send me the invoice for January consulting services?

Thanks,
Client A
```

**Skill Action**:
1. Reads item and detects:
   - Type: Email from known client
   - Intent: Request for invoice
   - Urgency: High priority
   - Requires: Invoice generation and sending

2. Creates `/Plans/PLAN_invoice_client_a_20260108.md`:
```markdown
---
created: 2026-01-08T11:00:00Z
source_item: /Needs_Action/EMAIL_client_a_20260108.md
status: pending
requires_approval: yes
priority: high
---

# Action Plan: Send January Invoice to Client A

## Source
- Type: email
- From: client.a@example.com
- Received: 2026-01-08T10:30:00Z

## Objective
Generate and send January 2026 invoice to Client A for consulting services.

## Analysis
Known client requesting standard monthly invoice. Based on Business_Goals.md,
Client A is active project with $1,500/month retainer. Invoice should include:
- Services: January consulting (40 hours)
- Amount: $1,500
- Due: Net 15 (2026-01-23)

## Steps
- [ ] Verify hours worked in January (check time tracking)
- [ ] Generate invoice PDF with details above
- [ ] Draft professional email with invoice attached **[REQUIRES APPROVAL]**
- [ ] Send email to client.a@example.com **[REQUIRES APPROVAL]**
- [ ] Log transaction in /Accounting/Current_Month.md
- [ ] Move original request to /Done

## Approval Required
Yes

**Why**: This plan requires:
1. Sending external email communication (Principle II: HITL)
2. Financial documentation (invoice) - requires accuracy verification

**How to Approve**:
Review the generated invoice and email draft, then move this plan to /Approved.

**How to Reject**:
Move this plan to /Rejected with a note explaining why.

## Success Criteria
- [ ] Invoice generated with accurate details
- [ ] Email sent successfully to client
- [ ] Transaction logged in accounting
- [ ] Client confirms receipt (within 24 hours)

## Constraints
- Constitution Principle II: Human-in-the-Loop for email sending
- Must use standard invoice template
- Must include all required fields (hours, rate, total, due date)
- Must be professional tone and free of errors
```

**Dashboard Update**:
- Active Tasks: 0 → 1
- Needs Action: 1 → 0
- Recent Activity: "[2026-01-08 11:00] Processed invoice request from Client A"

---

### Example 2: Processing Bank Transaction

**Input File**: `/Needs_Action/bank_20260108_subscription.md`
```markdown
---
type: bank
transaction_id: TXN_12345
merchant: Netflix
amount: -15.99
date: 2026-01-08
account: checking
status: pending
---

## Transaction Details
Recurring subscription charge from Netflix.
```

**Skill Action**:
1. Detects:
   - Type: Bank debit transaction
   - Merchant: Netflix (subscription)
   - Amount: Low ($15.99)
   - Recurring: Yes

2. Creates `/Plans/PLAN_categorize_netflix_20260108.md`:
```markdown
---
created: 2026-01-08T11:02:00Z
source_item: /Needs_Action/bank_20260108_subscription.md
status: pending
requires_approval: no
priority: normal
---

# Action Plan: Categorize Netflix Subscription

## Source
- Type: bank
- Merchant: Netflix
- Amount: -$15.99

## Objective
Categorize Netflix subscription and check if service is still in use.

## Analysis
Standard recurring subscription. Low amount, no approval needed for categorization.
However, should check last login date to identify unused subscriptions per
Business_Goals.md cost optimization objective.

## Steps
- [ ] Categorize as "Entertainment" expense
- [ ] Check last Netflix login date (if accessible)
- [ ] Log in /Accounting/Current_Month.md
- [ ] If unused >30 days: Flag for review in next CEO Briefing
- [ ] Move transaction to /Done

## Approval Required
No

This is information processing only (categorization). No external actions needed.

## Success Criteria
- [ ] Transaction categorized correctly
- [ ] Logged in accounting records
- [ ] Usage status determined

## Constraints
- Constitution Principle IV: Must log all financial transactions
- Read-only access to banking data
- No automatic cancellations (requires human decision)
```

**Dashboard Update**:
- Active Tasks: 1 → 2
- Recent Activity: "[2026-01-08 11:02] Categorized Netflix subscription"

---

### Example 3: Processing WhatsApp Message

**Input File**: `/Needs_Action/WHATSAPP_urgent_20260108.md`
```markdown
---
type: whatsapp
from: +923172074784
message: "URGENT: Website is down! Clients can't access it."
received: 2026-01-08T09:15:00Z
priority: high
status: pending
---

## Message Content
URGENT: Website is down! Clients can't access it.
```

**Skill Action**:
Creates emergency plan with high priority:
```markdown
# Action Plan: Emergency - Website Down

## Objective
Investigate and restore website access immediately.

## Steps
- [ ] Check website status (use Browser MCP to verify)
- [ ] Check hosting provider status page
- [ ] Review recent changes (git log, deployment logs)
- [ ] Draft response to sender with ETA **[REQUIRES APPROVAL]**
- [ ] If simple fix: Document and apply
- [ ] If complex: Escalate to technical team
- [ ] Send update to sender **[REQUIRES APPROVAL]**

## Approval Required
Yes (WhatsApp communication)
```

## References

### Related Skills
- `/bronze.update-dashboard.md` - Updates dashboard after processing
- `/bronze.generate-plan.md` - Detailed plan generation logic
- `/bronze.check-watchers.md` - Ensures watchers are feeding Inbox

### Documentation
- `Company_Handbook.md` - Decision Matrix and operational rules
- `Business_Goals.md` - Strategic alignment and KPIs
- `.specify/memory/constitution.md` - Governance principles
- `README.md` - System architecture and folder structure

### Code References
- `watcher_manager.py` - Creates items that this skill processes
- `file_drop_watcher.py:15-80` - File drop handler creating action files
- `bank_watcher.py:45-120` - Bank transaction formatter

### External Resources
- [Claude Agent Skills Documentation](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
- [Personal AI Employee Hackathon Spec](../CLAUDE.md) - Section on Bronze Tier requirements
- [Obsidian Frontmatter Guide](https://help.obsidian.md/Editing+and+formatting/Properties)

### Related Constitution Principles
- **Principle II**: Human-in-the-Loop for Sensitive Actions
- **Principle III**: Proactive Autonomous Management
- **Principle IV**: Comprehensive Audit Logging
- **Principle V**: File-Based Workflow and Status Flow

### Templates
- `sample_action_file.md` - Example action file structure
- `sample_plan_file.md` - Example plan file structure
- `.specify/templates/plan-template.md` - Plan generation template

---

**Skill Version**: 1.0.0
**Last Updated**: 2026-01-08
**Tier**: Bronze
**Author**: Personal AI Employee System
**Status**: Production Ready
