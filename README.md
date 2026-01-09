# Personal AI Employee System - Bronze & Silver Tier

This is a comprehensive system for managing personal and business operations through an Obsidian vault structure. The system supports both Bronze Tier (basic automation) and Silver Tier (advanced automation with external integrations) capabilities.

## System Overview

The Personal AI Employee operates as a proactive digital employee that:
- Monitors incoming items in the vault
- Creates plans for required actions
- Requests approval for sensitive operations
- Executes approved tasks
- Maintains detailed logs and reports

## Tier Capabilities

### Bronze Tier Features
- **Dashboard Management**: Real-time system status and metrics
- **Basic File Processing**: Monitors `/Inbox` and `/Needs_Action` for new items
- **Plan Generation**: Creates simple Plan.md files for tasks
- **Approval Workflow**: Human-in-the-loop for sensitive actions
- **Logging System**: Comprehensive action logging
- **Weekly Briefings**: Automated Monday briefings
- **Basic Skills**: Agent-based skills for common operations

### Silver Tier Features
- **Automated Watchers**: Multiple watcher scripts (Gmail, WhatsApp, Bank, File Drop)
- **MCP Server Integration**: SMTP Email server for external communication
- **LinkedIn Automation**: Automated business content posting
- **Claude Reasoning Loop**: Advanced AI reasoning for complex tasks
- **Enhanced Scheduling**: Automated task scheduling and recurring operations
- **Advanced Skills**: Specialized Silver Tier agent skills

## Folder Structure

```
/
├── Dashboard.md              # System dashboard and status overview
├── Company_Handbook.md       # Operational rules and procedures
├── Business_Goals.md         # Business objectives and KPIs
├── Inbox/                   # Raw incoming items
├── Needs_Action/            # Items requiring processing
├── Plans/                   # Detailed action plans
├── Pending_Approval/        # Items awaiting human approval
├── Approved/                # Approved items ready for execution
├── Rejected/                # Items rejected by human
├── Done/                    # Completed tasks
├── Logs/                    # Action logs by date
├── Briefings/               # Weekly CEO briefings
├── Accounting/              # Financial records and transactions
├── Watched_Files/           # Monitored directories for file drop watcher
├── watcher_config.json      # Watcher configuration and intervals
├── credentials.json         # Google API credentials for Gmail watcher
├── .env                     # Environment variables (credentials)
├── sample_*.md              # Template files for reference
└── README.md                # This file
```

## How the System Works

### 1. Perception (See)
- **Bronze**: AI Employee monitors `/Inbox` and `/Needs_Action` for new items
- **Silver**: Multiple watchers monitor various sources (Gmail, WhatsApp, bank, file drops)
- Processes incoming items from various sources (emails, messages, transactions)
- Watchers automatically create action files when new items are detected

### 2. Reasoning (Think)
- **Bronze**: Analyzes content using basic rules and Company Handbook
- **Silver**: Claude-powered reasoning loop analyzes content and context
- Consults `/Company_Handbook.md` for operational rules
- Determines appropriate actions based on content and business goals

### 3. Planning (Plan)
- **Bronze**: Creates basic plans in the `/Plans/` directory
- **Silver**: Creates detailed Plan.md files using Claude reasoning
- Uses checkboxes to track progress
- Marks approval-required steps clearly

### 4. Approval (Wait)
- Moves approval-required items to `/Pending_Approval`
- Waits for human to move files to `/Approved` or `/Rejected`
- MCP servers only execute approved external actions (Silver Tier)

### 5. Action (Act)
- Executes tasks when files are in `/Approved`
- **Bronze**: Executes internal vault operations
- **Silver**: Uses MCP servers for external actions (email, LinkedIn posts)

### 6. Completion (Finish)
- Updates `/Dashboard.md` with current status
- Logs all actions to `/Logs/YYYY-MM-DD.json`
- **Bronze**: Generates weekly briefings on Mondays
- **Silver**: Automatically posts business content to LinkedIn

## Bronze Tier Features

### Basic Skills
- `/bronze.process-inbox` - Process items in the inbox
- `/bronze.generate-plan` - Create basic action plans
- `/bronze.update-dashboard` - Update system dashboard
- `/bronze.check-watchers` - Monitor active watchers

### File Processing
- **Action Files**: Basic processing of items requiring action
- **Plan Files**: Simple task planning with checkboxes
- **Approval System**: Human approval for sensitive actions

```
# Basic Action File
---
type: task | email | message
priority: high | normal
status: pending
---
Content to be processed
```

## Silver Tier Features

### Watcher Scripts
- **Gmail Watcher**: Monitors Gmail for new emails and creates action items
- **WhatsApp Watcher**: Monitors WhatsApp messages via Twilio integration
- **Bank Watcher**: Monitors bank transactions and alerts
- **File Drop Watcher**: Monitors specified directories for new files

### MCP Server Integration (Email)
- **SMTP Email Server**: Sends emails via Gmail SMTP using credentials from .env
- **Human-in-the-Loop Approval**: All emails require explicit approval before sending
- **Security Validation**: Email content, recipients, and attachments validated
- **Audit Logging**: Complete logging of all email actions and outcomes

### LinkedIn Automation
- **Automated Posting**: Creates and posts business content to LinkedIn
- **Content Generation**: Claude-powered content creation for business development
- **Scheduled Posts**: Posts at optimal times for maximum engagement

### Claude Reasoning Loop
- **Plan.md Generation**: Creates detailed Plan.md files for complex tasks
- **Multi-step Reasoning**: Breaks down complex problems into actionable steps
- **Context Awareness**: Uses company handbook and business goals for decision making

### Advanced Skills
- `/silver.send-email` - Send emails via SMTP
- `/silver.execute-approved` - Execute approved external actions
- `/silver.review-approvals` - Review pending approval items
- `/silver.manage-schedule` - Manage scheduled tasks

## MCP Server Integration

### Email MCP Server (SMTP Implementation)
- **Command**: `python execute_approved_emails.py`
- **Credentials**: Stored securely in `.env` file
- **Authentication**: Gmail App Passwords for 2FA accounts
- **Validation**: Complete email validation and security checks
- **Audit Trail**: Full logging of all email operations

### Usage:
```
# Send all approved emails
python execute_approved_emails.py

# Send specific email approval file
python execute_approved_emails.py "Approved/APPROVAL_email_file.md"
```

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

### Plan Files (Bronze)
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

### Plan Files (Silver - Claude Reasoning Loop)
```
# PLAN_<task_name>.md

---
created: YYYY-MM-DD
status: pending
reasoning: claude-generated
---

## Objective
What needs to be done

## Context Analysis
Claude's analysis of the situation and constraints

## Steps
- [x] Step already done
- [ ] Step to do
- [ ] Step requiring approval (MARK CLEARLY)

## Approval Required
Yes / No

## Reasoning Notes
Additional context and considerations from Claude
```

### Approval Requests
```
# /Pending_Approval/<ACTION_NAME>.md

---
action: send_email | payment | post_linkedin
amount: optional
recipient: optional
status: pending
approved_by: human (after moved to Approved/)
approved_at: timestamp (after moved to Approved/)
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
- **Bronze**: Revenue summary, completed tasks, bottlenecks, cost-saving suggestions, upcoming deadlines
- **Silver**: LinkedIn engagement metrics, business development updates

## Security & Approval Requirements

Sensitive actions always require human approval:
- Sending emails or messages
- Making payments
- Posting content publicly on LinkedIn
- Accessing sensitive information
- Financial transactions

## Getting Started

### Bronze Tier Setup
1. Review `/Company_Handbook.md` for operational rules
2. Set up your `/Business_Goals.md` with objectives
3. Place incoming items in `/Inbox` or `/Needs_Action`
4. Monitor `/Dashboard.md` for system status
5. Use Bronze Tier skills: `/bronze.process-inbox`, `/bronze.generate-plan`, etc.

### Silver Tier Setup
1. Complete Bronze Tier setup first
2. Configure watchers in `watcher_config.json`
3. Set up Gmail API credentials and SMTP in `.env`
4. Review and approve items in `/Pending_Approval` as needed
5. Run watchers: `python watcher_manager.py`
6. Use Silver Tier skills: `/silver.send-email`, `/silver.execute-approved`, etc.