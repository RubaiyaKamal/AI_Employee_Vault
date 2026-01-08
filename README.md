# Personal AI Employee System

This is a comprehensive system for managing personal and business operations through an Obsidian vault structure.

## System Overview

The Personal AI Employee operates as a proactive digital employee that:
- Monitors incoming items in the vault
- Creates plans for required actions
- Requests approval for sensitive operations
- Executes approved tasks
- Maintains detailed logs and reports

## Folder Structure

```
/
├── Dashboard.md          # System dashboard and status overview
├── Company_Handbook.md   # Operational rules and procedures
├── Business_Goals.md     # Business objectives and KPIs
├── Inbox/               # Raw incoming items
├── Needs_Action/        # Items requiring processing
├── Plans/               # Detailed action plans
├── Pending_Approval/    # Items awaiting human approval
├── Approved/            # Approved items ready for execution
├── Rejected/            # Items rejected by human
├── Done/                # Completed tasks
├── Logs/                # Action logs by date
├── Briefings/           # Weekly CEO briefings
├── Accounting/          # Financial records and transactions
├── sample_*.md          # Template files for reference
└── README.md            # This file
```

## How the System Works

### 1. Perception (See)
- The AI Employee monitors `/Inbox` and `/Needs_Action` for new items
- Processes incoming items from various sources (emails, messages, transactions)
- Watchers automatically create action files when new items are detected

### 2. Reasoning (Think)
- Analyzes the content of incoming items
- Consults `/Company_Handbook.md` for operational rules
- Determines appropriate actions based on content and priority

### 3. Planning (Plan)
- Creates detailed plans in the `/Plans/` directory
- Uses checkboxes to track progress
- Marks approval-required steps clearly

### 4. Approval (Wait)
- Moves approval-required items to `/Pending_Approval`
- Waits for human to move files to `/Approved` or `/Rejected`

### 5. Action (Act)
- Executes tasks when files are in `/Approved`
- Updates status and moves completed items to `/Done`

### 6. Completion (Finish)
- Updates `/Dashboard.md` with current status
- Logs all actions to `/Logs/YYYY-MM-DD.json`
- Generates weekly briefings on Mondays

## File Formats

### Action Files
```
---
type: email | whatsapp | bank | file
priority: high | normal
status: pending
---
CONTENT HERE
```

### Plan Files
```
# PLAN_<task_name>.md

---
created: YYYY-MM-DD
status: pending
---

## Objective
What needs to be done

## Steps
- [x] Step already done
- [ ] Step to do
- [ ] Step requiring approval (MARK CLEARLY)

## Approval Required
Yes / No
```

### Approval Requests
```
# /Pending_Approval/<ACTION_NAME>.md

---
action: send_email | payment | post
amount: optional
recipient: optional
status: pending
---

## What will happen
Explain clearly

## How to approve
Move this file to /Approved

## How to reject
Move this file to /Rejected
```

## Weekly CEO Briefings

Every Monday, the system generates a briefing in `/Briefings/` containing:
- Revenue summary
- Completed tasks
- Bottlenecks
- Cost-saving suggestions
- Upcoming deadlines

## Security & Approval Requirements

Sensitive actions always require human approval:
- Sending emails or messages
- Making payments
- Posting content publicly
- Accessing sensitive information

## Getting Started

1. Review `/Company_Handbook.md` for operational rules
2. Set up your `/Business_Goals.md` with objectives
3. Place incoming items in `/Inbox` or `/Needs_Action`
4. Monitor `/Dashboard.md` for system status
5. Review and approve items in `/Pending_Approval` as needed