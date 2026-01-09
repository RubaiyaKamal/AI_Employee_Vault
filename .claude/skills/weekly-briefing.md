# Generate Weekly Briefing

## Title
**Generate Weekly Briefing** - Executive Summary and Business Intelligence Report

## Description

This skill generates comprehensive weekly briefings every Monday morning, providing executives with actionable insights about revenue, completed tasks, bottlenecks, cost-saving opportunities, and upcoming deadlines. It serves as the AI Employee's primary reporting mechanism to keep leadership informed.

**Capability Level**: Silver Tier
**Category**: Business Intelligence & Reporting
**Risk Level**: Low (Read-only analysis and reporting)

## Instructions

### Execution Flow

#### 1. Determine Briefing Period
```
Input: Optional date range or use default (last 7 days)
Output: Start and end dates for analysis
```

**Default Behavior**:
- Run on Mondays (or when manually triggered)
- Period: Previous Monday 00:00 to Sunday 23:59
- If run mid-week: Last Monday to today

**Code Pattern**:
```python
from datetime import datetime, timedelta

def get_briefing_period():
    today = datetime.now()

    # Find last Monday
    days_since_monday = (today.weekday() - 0) % 7
    if days_since_monday == 0:  # Today is Monday
        start = today - timedelta(days=7)
    else:
        start = today - timedelta(days=days_since_monday + 7)

    end = start + timedelta(days=6, hours=23, minutes=59)

    return {
        'start': start.replace(hour=0, minute=0, second=0),
        'end': end,
        'week_number': start.isocalendar()[1],
        'year': start.year
    }
```

#### 2. Gather Data from Multiple Sources

**A. Revenue & Financial Data**
Source: `/Accounting/Current_Month.md` and transaction logs

Collect:
- Total revenue (current month)
- Revenue change vs. last month
- Top revenue sources (clients/projects)
- Payment collection status (invoices paid/outstanding)
- Expenses categorized

**B. Completed Tasks**
Source: `/Done/` folder + `/Logs/` entries

Collect:
- Count of items completed this week
- Breakdown by type (email, whatsapp, bank, file)
- High-priority tasks completed
- Tasks with external actions (emails sent, payments made)

**C. Active Tasks & Bottlenecks**
Source: `/Needs_Action/`, `/Pending_Approval/`, `/Plans/`

Identify:
- Items in Needs_Action for >3 days (stale)
- Items in Pending_Approval for >2 days (waiting for human)
- Plans created but not executed
- Failed actions that need attention

**D. Cost-Saving Opportunities**
Source: Bank transactions + usage analysis

Analyze:
- Unused subscriptions (no login >30 days)
- Duplicate services
- Above-average spending in any category
- Potential consolidation opportunities

**E. Upcoming Deadlines**
Source: Calendar items, invoice due dates, project milestones

List:
- Invoices due this week
- Project deadlines within 7 days
- Recurring tasks scheduled
- Appointments and meetings

#### 3. Generate Revenue Summary

**Template Section**:
```markdown
## Revenue Summary

**Period**: Jan 1 - Jan 7, 2026 (Week 1)

### Key Metrics
- **Total Revenue**: $X,XXX
- **Change from Last Week**: +X% (↑ $XXX) or -X% (↓ $XXX)
- **Outstanding Invoices**: $X,XXX (X invoices)
- **Collection Rate**: XX%

### Top Revenue Sources
1. Client A: $X,XXX (Project Alpha)
2. Client B: $X,XXX (Monthly Retainer)
3. Product Sales: $XXX

### Expenses
- **Total Expenses**: $XXX
- **Top Categories**:
  - Software/Tools: $XXX
  - Contractors: $XXX
  - Marketing: $XXX

### Net Profit
**$X,XXX** (XX% margin)
```

**Code Pattern**:
```python
def generate_revenue_summary(period):
    # Read accounting files
    transactions = read_accounting_transactions(period)

    revenue = sum(t['amount'] for t in transactions if t['type'] == 'income')
    expenses = sum(abs(t['amount']) for t in transactions if t['type'] == 'expense')

    # Calculate changes
    last_week = get_previous_week_data()
    revenue_change = ((revenue - last_week['revenue']) / last_week['revenue']) * 100

    # Top sources
    sources = group_by(transactions, 'client')
    top_sources = sorted(sources.items(), key=lambda x: x[1], reverse=True)[:3]

    return {
        'total_revenue': revenue,
        'revenue_change': revenue_change,
        'expenses': expenses,
        'net_profit': revenue - expenses,
        'top_sources': top_sources,
        'outstanding_invoices': get_outstanding_invoices()
    }
```

#### 4. Generate Completed Tasks Summary

**Template Section**:
```markdown
## Completed Tasks

**Total Completed**: XX tasks

### Breakdown by Type
- Emails Processed: XX (XX sent, XX archived)
- WhatsApp Messages: XX replies sent
- Bank Transactions: XX categorized
- Files Processed: XX

### High-Priority Items
1. [URGENT] Client emergency - Website restored (Jan 8)
2. [HIGH] Invoice sent to Client A (Jan 9)
3. [HIGH] Quarterly report generated (Jan 10)

### External Actions Taken
- Emails sent: XX to XX recipients
- Payments processed: $X,XXX
- Documents generated: XX
```

#### 5. Identify Bottlenecks

**Analysis Logic**:
```python
def identify_bottlenecks(period):
    bottlenecks = []

    # Check stale items in Needs_Action
    needs_action = list_files('/Needs_Action')
    for item in needs_action:
        age_days = (datetime.now() - item['received']).days
        if age_days > 3:
            bottlenecks.append({
                'type': 'stale_action',
                'item': item['path'],
                'age_days': age_days,
                'reason': f'In Needs_Action for {age_days} days'
            })

    # Check pending approvals
    pending = list_files('/Pending_Approval')
    for item in pending:
        age_days = (datetime.now() - item['created']).days
        if age_days > 2:
            bottlenecks.append({
                'type': 'approval_delay',
                'item': item['path'],
                'age_days': age_days,
                'reason': 'Waiting for human approval'
            })

    # Check failed actions
    logs = read_logs(period)
    failed = [l for l in logs if l['status'] == 'failed']
    for failure in failed:
        bottlenecks.append({
            'type': 'failed_action',
            'item': failure['file'],
            'error': failure['error'],
            'reason': 'Action failed and needs retry'
        })

    return bottlenecks
```

**Template Section**:
```markdown
## Bottlenecks & Issues

**Total Items Needing Attention**: X

### Stale Items (>3 days in Needs_Action)
1. EMAIL_client_followup.md (5 days) - Awaiting response draft
2. BANK_unusual_transaction.md (4 days) - Needs manual review

### Delayed Approvals (>2 days in Pending_Approval)
1. APPROVAL_send_proposal.md (3 days) - Proposal email waiting approval
2. APPROVAL_payment_vendor.md (2 days) - $500 payment needs approval

### Failed Actions
1. Email send failed (network timeout) - Retry needed
2. File upload failed (quota exceeded) - Storage cleanup required

**Recommended Actions**:
- Review and approve 2 pending items
- Retry 1 failed email send
- Archive or process 2 stale items
```

#### 6. Generate Cost-Saving Suggestions

**Analysis Logic**:
```python
def find_cost_savings(period):
    savings = []

    # Analyze subscriptions
    subscriptions = get_subscriptions()
    for sub in subscriptions:
        last_login = get_last_login(sub['service'])
        days_unused = (datetime.now() - last_login).days if last_login else 999

        if days_unused > 30:
            savings.append({
                'type': 'unused_subscription',
                'service': sub['service'],
                'amount': sub['monthly_cost'],
                'last_used': last_login,
                'recommendation': f'Cancel or pause {sub["service"]} subscription'
            })

    # Find duplicate services
    services_by_category = group_by(subscriptions, 'category')
    for category, services in services_by_category.items():
        if len(services) > 1:
            total_cost = sum(s['monthly_cost'] for s in services)
            savings.append({
                'type': 'duplicate_services',
                'category': category,
                'services': [s['service'] for s in services],
                'total_cost': total_cost,
                'recommendation': f'Consolidate {category} tools (currently using {len(services)})'
            })

    return savings
```

**Template Section**:
```markdown
## Cost-Saving Opportunities

**Total Potential Monthly Savings**: $XXX

### Unused Subscriptions
1. **Netflix** - $15.99/month
   - Last login: Nov 15, 2025 (56 days ago)
   - Recommendation: Cancel or pause subscription
   - Annual savings: $191.88

2. **Tool X** - $29/month
   - Last login: Dec 1, 2025 (39 days ago)
   - Recommendation: Evaluate if still needed

### Duplicate Services
- **Project Management Tools** (3 active: Asana, Trello, Monday.com)
  - Total cost: $75/month
  - Recommendation: Consolidate to one tool
  - Potential savings: ~$50/month

### Above-Average Spending
- **Cloud Storage**: $50/month (industry avg: $30/month)
  - Recommendation: Review storage usage and optimize
```

#### 7. List Upcoming Deadlines

**Template Section**:
```markdown
## Upcoming Deadlines (Next 7 Days)

### This Week
- **Mon, Jan 13**: Client A - Project Alpha milestone
- **Wed, Jan 15**: Invoice #INV-001 due (Client B, $1,500)
- **Fri, Jan 17**: Quarterly tax filing deadline

### Recurring Tasks
- Daily: Check inbox and process new items
- Weekly: Generate briefing (Mondays)
- Monthly: Send invoices (1st of month)

### Appointments
- **Tue, Jan 14 at 2:00 PM**: Client meeting (Project Beta)
- **Thu, Jan 16 at 10:00 AM**: Team standup
```

#### 8. Create Briefing File

**File Location**: `/Briefings/BRIEFING_YYYY-WW.md`
- Example: `/Briefings/BRIEFING_2026-W01.md`

**Complete File Structure**:
```markdown
---
created: 2026-01-09T07:00:00Z
week_number: 1
year: 2026
period_start: 2026-01-01
period_end: 2026-01-07
report_type: weekly_ceo_briefing
---

# Weekly CEO Briefing - Week 1, 2026

**Period**: January 1-7, 2026
**Generated**: January 9, 2026 at 7:00 AM
**AI Employee**: Personal AI Employee System v1.0

---

## Executive Summary

This week saw **positive revenue growth** (+15%) with $X,XXX in total revenue. Completed XX tasks including urgent client issues. Identified X cost-saving opportunities worth $XXX/month. X items require your attention.

**Key Highlights**:
- ✅ Resolved client emergency (website down)
- ✅ Sent X invoices totaling $X,XXX
- ⚠️ X items pending your approval for 2+ days
- 💡 Identified $XXX/month in potential savings

---

[Revenue Summary Section]

[Completed Tasks Section]

[Bottlenecks & Issues Section]

[Cost-Saving Opportunities Section]

[Upcoming Deadlines Section]

---

## Action Items for You

- [ ] Review and approve X pending items in /Pending_Approval
- [ ] Decide on Netflix subscription (unused 56 days, $16/month)
- [ ] Prepare for Client meeting on Jan 14 at 2:00 PM
- [ ] Review cost-saving recommendations ($XXX/month potential)

---

*This briefing was generated automatically by your AI Employee.*
*For details, see `/Logs/2026-01-09.json` and `/Done/` folder.*
```

#### 9. Optional: Send Email Notification

If configured, create an approval request to email the briefing:

```markdown
---
action: send_email
recipient: you@example.com
subject: Weekly CEO Briefing - Week 1, 2026
status: pending
priority: normal
---

# Email: Weekly Briefing

[Attach or include briefing content]

Move to /Approved to send.
```

### Acceptance Criteria

- [ ] Briefing generated every Monday morning (if scheduled)
- [ ] All data sections populated with accurate information
- [ ] Revenue calculations correct and match accounting records
- [ ] Bottlenecks identified and categorized appropriately
- [ ] Cost-saving suggestions are actionable and realistic
- [ ] Deadlines pulled from multiple sources (calendar, invoices, projects)
- [ ] Action items clearly listed for human review
- [ ] File saved to `/Briefings/` with proper naming convention

### Constraints

**Constitution Compliance**:
- **Principle IV**: Audit Logging - All data sources logged
- **Principle V**: File-Based Workflow - Briefing saved as file

**Operational Constraints**:
- Run time: Complete within 2 minutes
- Data accuracy: Use only vault data (no assumptions)
- Period: Default to last 7 days (Mon-Sun)
- File size: Keep briefing concise (<3000 words)

## Examples

### Example 1: Monday Morning Briefing

**Trigger**: Scheduled run on Monday, Jan 9, 2026 at 7:00 AM

**Execution**:
```
Generating Weekly CEO Briefing...
Period: Jan 1-7, 2026 (Week 1)

Gathering data:
✅ Revenue data collected from /Accounting
✅ Completed tasks counted from /Done (42 items)
✅ Bottlenecks identified (5 items need attention)
✅ Cost savings analyzed ($47/month potential)
✅ Upcoming deadlines compiled (8 items)

Generating briefing file...
✅ File created: /Briefings/BRIEFING_2026-W01.md

Summary:
- Total Revenue: $12,450
- Change from Last Week: +15% (↑ $1,625)
- Tasks Completed: 42
- Items Needing Attention: 5
- Potential Savings: $47/month
- Upcoming Deadlines: 8

Briefing ready for review!
File: /Briefings/BRIEFING_2026-W01.md
```

**Generated Briefing** (excerpt):
```markdown
# Weekly CEO Briefing - Week 1, 2026

## Executive Summary

Strong week with 15% revenue growth ($12,450 total). Processed 42 items including 8 urgent tasks. Found $47/month in cost-saving opportunities. 5 items need your attention.

## Revenue Summary

- Total Revenue: $12,450
- Change: +15% (↑ $1,625)
- Top Sources:
  1. Client A Retainer: $4,000
  2. Client B Project: $3,500
  3. Product Sales: $2,950
- Outstanding: $3,000 (2 invoices)

## Bottlenecks

1. APPROVAL_client_proposal.md (3 days) - Needs approval
2. EMAIL_followup_clientc.md (5 days) - Stale in Needs_Action

## Cost Savings

- Netflix subscription: $16/month (unused 56 days)
- **Action**: Cancel or evaluate usage

## Action Items

- [ ] Approve client proposal (pending 3 days)
- [ ] Review Netflix subscription
- [ ] Prepare for client meeting (Jan 14)
```

---

## References

### Related Skills
- `/bronze.update-dashboard.md` - Dashboard data used in briefing
- `/bronze.process-inbox.md` - Completed task counting
- `/silver.execute-approved.md` - Execution logs analyzed

### Documentation
- `Business_Goals.md` - KPIs and objectives referenced
- `Company_Handbook.md` - Cost thresholds and policies
- `sample_weekly_briefing.md` - Template example

### Code References
- `/Accounting/Current_Month.md` - Revenue data source
- `/Logs/*.json` - Activity logs
- `/Done/` - Completed tasks

### Related Constitution Principles
- **Principle III**: Proactive Autonomous Management
- **Principle IV**: Comprehensive Audit Logging

### Scheduling

**Recommended Schedule** (Windows Task Scheduler):
```
Task Name: AI Employee Weekly Briefing
Trigger: Weekly, every Monday at 7:00 AM
Action: claude /silver.weekly-briefing
```

**Recommended Schedule** (macOS/Linux cron):
```cron
0 7 * * 1 cd /path/to/vault && claude /silver.weekly-briefing
```

---

**Skill Version**: 1.0.0
**Last Updated**: 2026-01-09
**Tier**: Silver
**Author**: Personal AI Employee System
**Status**: Production Ready
**Recommended Schedule**: Every Monday at 7:00 AM
