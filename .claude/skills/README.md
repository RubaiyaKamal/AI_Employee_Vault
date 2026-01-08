# Personal AI Employee - Agent Skills

This directory contains comprehensive Agent Skills for the Personal AI Employee system, formatted with title, description, instructions, examples, and references.

## About Agent Skills

Agent Skills are Claude Code's way of extending functionality through structured, reusable capabilities. Each skill is a markdown file that provides:

- **Title**: Clear skill name and purpose
- **Description**: Capability level, category, risk assessment
- **Instructions**: Step-by-step execution flow with code examples
- **Examples**: Real-world usage scenarios with expected outputs
- **References**: Related skills, documentation, code references, external resources

## Bronze Tier Skills (Core Operations)

### 1. Process Inbox (`process-inbox.md`)
**Category**: Core Operations
**Purpose**: Automated processing of incoming action items from Inbox and Needs_Action folders

**Key Features**:
- Scans and prioritizes incoming items
- Analyzes content and determines required actions
- Creates structured action plans
- Updates dashboard with activity

**When to Use**:
- After watchers create new items
- When /Needs_Action has unprocessed files
- On-demand processing of specific items

**Usage**:
```bash
claude /bronze.process-inbox
```

---

### 2. Update Dashboard (`update-dashboard.md`)
**Category**: Monitoring & Reporting
**Purpose**: Real-time system status and metrics display

**Key Features**:
- Counts active tasks, pending approvals, completed items
- Assesses vault health (folder structure integrity)
- Displays recent activity from logs
- Calculates time-sensitive metrics

**When to Use**:
- After any major operation
- Every 15 minutes (scheduled)
- Before reviewing system status
- After file watcher detects changes

**Usage**:
```bash
claude /bronze.update-dashboard
```

---

### 3. Check Watchers (`check-watchers.md`)
**Category**: System Health & Diagnostics
**Purpose**: Monitor and diagnose watcher script health

**Key Features**:
- Validates watcher configuration
- Detects stale or stopped watchers
- Checks database health
- Provides restart recommendations

**When to Use**:
- Daily system health check
- When no new items appearing
- After system reboot
- Troubleshooting watcher issues

**Usage**:
```bash
claude /bronze.check-watchers
```

---

### 4. Generate Plan (`generate-plan.md`)
**Category**: Planning & Reasoning
**Purpose**: Create detailed execution plans from action items

**Key Features**:
- Deep content analysis
- Approval requirement determination
- Success criteria definition
- Risk assessment
- Context-aware planning

**When to Use**:
- Processing specific Needs_Action items
- Creating detailed action plans
- Before execution (Silver/Gold tier)

**Usage**:
```bash
# Process oldest item
claude /bronze.generate-plan

# Process specific item
claude /bronze.generate-plan "/Needs_Action/EMAIL_client_a.md"
```

---

### 5. Review Approvals (`review-approvals.md`)
**Category**: Human Interaction & Governance
**Purpose**: Human-in-the-Loop approval workflow guidance

**Key Features**:
- Consolidates pending approvals
- Risk assessment
- Approval dashboard generation
- Expiry management
- Decision guidance

**When to Use**:
- Before approving sensitive actions
- Checking pending approvals
- Reviewing expired requests
- Daily approval queue check

**Usage**:
```bash
claude /bronze.review-approvals
```

---

### 6. Generate Briefing (`generate-briefing.md`)
**Category**: Analytics & Business Intelligence
**Purpose**: Weekly business audit and executive summary

**Key Features**:
- Revenue analysis and tracking
- Task completion metrics
- Bottleneck identification
- Cost optimization suggestions
- Proactive recommendations
- Deadline tracking

**When to Use**:
- Every Monday morning (scheduled)
- End-of-week review
- Monthly business reviews
- Custom period analysis

**Usage**:
```bash
# Default: Last 7 days
claude /bronze.generate-briefing

# Custom period
claude /bronze.generate-briefing --period "2026-01-01 to 2026-01-07"
```

---

## Skill Format

Each skill follows this structure:

```markdown
# Skill Title

## Title
**Name** - Brief description

## Description
Detailed description with capability level, category, risk level

## Instructions
### Execution Flow
Step-by-step instructions with:
- Input/output specifications
- Code examples
- Data structures
- Decision logic

### Acceptance Criteria
Checklist of success conditions

### Constraints
- Constitution compliance
- Tier limitations
- Operational constraints

## Examples
Real-world scenarios with:
- Input files
- Skill actions
- Output results
- Dashboard updates

## References
- Related skills
- Documentation
- Code references
- External resources
- Constitution principles
```

## Skill Categorization

### By Risk Level
- **Low Risk**: process-inbox, update-dashboard, check-watchers, generate-plan, generate-briefing
- **Medium Risk**: review-approvals (facilitates sensitive decisions)

### By Automation Level
- **Fully Automated** (Bronze): update-dashboard, check-watchers
- **Semi-Automated** (Bronze): process-inbox, generate-plan, generate-briefing
- **Human-Guided** (Bronze): review-approvals

### By Data Flow
- **Input Skills**: process-inbox (reads Needs_Action)
- **Processing Skills**: generate-plan (creates Plans)
- **Output Skills**: update-dashboard (writes Dashboard), generate-briefing (writes Briefings)
- **Monitoring Skills**: check-watchers, review-approvals

## Constitution Alignment

All skills align with the Personal AI Employee Constitution (v1.0.0):

### Principle I: Local-First Privacy
- All data stays in vault
- No external storage
- Read/write to local files only

### Principle II: Human-in-the-Loop
- `review-approvals` facilitates HITL workflow
- `generate-plan` determines approval requirements
- No automatic sensitive actions

### Principle III: Proactive Autonomous Management
- `process-inbox` processes items automatically
- `generate-briefing` proactively analyzes business
- `check-watchers` monitors system health

### Principle IV: Comprehensive Audit Logging
- All skills log their actions
- Dashboard shows activity
- Briefings include metrics

### Principle V: File-Based Workflow
- All skills operate on files
- No in-memory state
- File movement triggers actions

## Workflow Integration

### Standard Daily Flow

```
1. Morning (7:00 AM)
   └─> generate-briefing (Monday only)

2. Continuous (Watchers running)
   ├─> Gmail/WhatsApp/Bank/File watchers create items
   └─> Items appear in /Needs_Action

3. Processing (Every 15 min or on-demand)
   ├─> process-inbox (scans Needs_Action)
   ├─> generate-plan (creates Plans)
   └─> update-dashboard (shows status)

4. Human Review (As needed)
   ├─> review-approvals (check Pending_Approval)
   ├─> Human moves to Approved/Rejected
   └─> (Silver/Gold: Auto-execution)

5. Health Check (Daily)
   └─> check-watchers (verify watchers running)
```

### File Relationships

```
External Sources
    ↓
[Watchers] → /Needs_Action/*.md
    ↓
[process-inbox] reads Needs_Action
    ↓
[generate-plan] → /Plans/PLAN_*.md
    ↓ (if approval needed)
[generate-plan] → /Pending_Approval/APPROVAL_*.md
    ↓
[review-approvals] reads Pending_Approval
    ↓
Human moves → /Approved or /Rejected
    ↓
(Silver/Gold: Execute approved)
    ↓
Move completed → /Done
    ↓
[generate-briefing] analyzes /Done
    ↓
[generate-briefing] → /Briefings/YYYY-MM-DD_Monday_Briefing.md
    ↓
[update-dashboard] → Dashboard.md (updated)
```

## Silver/Gold Tier Enhancements

When you advance to Silver/Gold tiers, these skills will gain:

### Silver Tier Additions
- **Automatic execution** after approval
- **MCP integration** for external actions
- **Real-time monitoring** via file watchers
- **Process management** for watchers
- **Email sending** capability
- **Scheduled tasks** via cron

### Gold Tier Additions
- **Multi-domain integration** (Personal + Business)
- **Advanced analytics** with trend graphs
- **Predictive suggestions** using ML
- **Error recovery** automation
- **Cross-platform sync**
- **Web dashboard** interface

## Using Skills

### Via Claude Code CLI
```bash
# General pattern
claude /skillname [arguments]

# Examples
claude /bronze.process-inbox
claude /bronze.update-dashboard
claude /bronze.check-watchers
claude /bronze.generate-plan "/Needs_Action/EMAIL_client_a.md"
claude /bronze.review-approvals
claude /bronze.generate-briefing
claude /bronze.generate-briefing --period "2026-01-01 to 2026-01-07"
```

### Via Skill Invocation in Conversation
```
User: Process my inbox
Claude: *Invokes process-inbox skill*

User: What's my system status?
Claude: *Invokes update-dashboard skill*

User: Generate this week's briefing
Claude: *Invokes generate-briefing skill*
```

### Via Scheduled Tasks

**Linux/macOS (cron)**:
```bash
# Dashboard update every 15 minutes
*/15 * * * * cd /path/to/vault && claude /bronze.update-dashboard

# Monday briefing at 7 AM
0 7 * * 1 cd /path/to/vault && claude /bronze.generate-briefing

# Watcher health check daily at 8 AM
0 8 * * * cd /path/to/vault && claude /bronze.check-watchers
```

**Windows (Task Scheduler)**:
- Create tasks pointing to: `claude /bronze.<skillname>`
- Set working directory to vault path
- Configure schedule

## Troubleshooting

### Skill Not Found
**Error**: `Skill 'bronze.process-inbox' not found`

**Solution**:
1. Verify file exists: `.claude/skills/process-inbox.md`
2. Check Claude Code can access `.claude` directory
3. Restart Claude Code if needed

### Skill Fails to Execute
**Error**: Various execution errors

**Solution**:
1. Check vault structure (all required folders exist)
2. Verify file permissions (read/write access)
3. Review skill logs in `/Logs`
4. Check Constitution compliance

### Performance Issues
**Issue**: Skills running slowly

**Solution**:
1. Large vault: Consider archiving old /Done files
2. Check database files aren't corrupted
3. Ensure sufficient disk space
4. Review watcher intervals

## Contributing Custom Skills

To create custom skills, follow the template in any existing skill file:

1. Use the standard format (Title, Description, Instructions, Examples, References)
2. Include Constitution principle alignment
3. Provide clear examples
4. Document acceptance criteria
5. Test thoroughly before adding

## Version History

- **v1.0.0** (2026-01-08): Initial Bronze Tier skill set
  - 6 core skills created
  - Comprehensive documentation
  - Full example coverage

## References

### Documentation
- [Claude Agent Skills Documentation](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
- [Personal AI Employee Constitution](../../.specify/memory/constitution.md)
- [System README](../../README.md)
- [Bronze Tier Status](../../BRONZE_TIER_STATUS.md)

### Related Files
- [Company Handbook](../../Company_Handbook.md) - Operational rules
- [Business Goals](../../Business_Goals.md) - Strategic objectives
- [Dashboard](../../Dashboard.md) - System status

---

**Skill Set Version**: 1.0.0 (Bronze Tier)
**Last Updated**: 2026-01-08
**Total Skills**: 6
**Status**: Production Ready
