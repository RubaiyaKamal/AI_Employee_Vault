# Generate CEO Briefing

## Title
**Generate CEO Briefing** - Weekly Business Audit and Executive Summary

## Description

This skill generates a comprehensive "Monday Morning CEO Briefing" that audits the week's activities, analyzes financial transactions, identifies bottlenecks, suggests cost optimizations, and provides proactive recommendations. It transforms raw operational data into strategic business intelligence, making the AI Employee a true business partner rather than just a task executor.

**Capability Level**: Bronze Tier (enhanced in Silver/Gold)
**Category**: Analytics & Business Intelligence
**Risk Level**: Low (Read-only analysis, no actions)

## Instructions

### Execution Flow

#### 1. Determine Reporting Period

**Default**: Last 7 days (Monday-Sunday)

```python
from datetime import datetime, timedelta

# For Monday execution
today = datetime.now()
if today.weekday() == 0:  # Monday
    end_date = today - timedelta(days=1)  # Yesterday (Sunday)
    start_date = end_date - timedelta(days=6)  # Previous Monday
else:
    # Can be run any day for current week-to-date
    end_date = today
    start_date = today - timedelta(days=today.weekday())  # This week's Monday

period_label = f"{start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}"
```

**Custom Period** (via argument):
```bash
/bronze.generate-briefing --period "2026-01-01 to 2026-01-07"
```

#### 2. Load Business Context

**Read Business Goals**: `Business_Goals.md`

Extract:
```python
business_context = {
    'revenue_target_monthly': 10000,  # From Q1 Objectives
    'revenue_target_mtd': calculate_mtd_target(today),
    'key_metrics': parse_metrics_table(),  # Response time, payment rate, etc.
    'active_projects': parse_active_projects(),  # Project Alpha, Beta, etc.
    'subscription_audit_rules': parse_subscription_rules()
}
```

**Example Extraction**:
```python
# From Business_Goals.md
active_projects = [
    {'name': 'Project Alpha', 'due': '2026-01-15', 'budget': 2000},
    {'name': 'Project Beta', 'due': '2026-01-30', 'budget': 3500}
]
```

#### 3. Collect Revenue Data

**Source**: Bank transactions in `/Accounting` or from bank transaction logs

**A. Find Revenue Transactions**:
```python
# From bank transaction files or /Done/bank_*.md files
revenue_transactions = []

for txn_file in glob('/Done/bank_*.md'):
    txn = parse_file(txn_file)
    if txn.frontmatter.get('amount', 0) > 0:  # Credit (revenue)
        if is_within_period(txn.frontmatter['date'], start_date, end_date):
            revenue_transactions.append({
                'date': txn.frontmatter['date'],
                'amount': txn.frontmatter['amount'],
                'merchant': txn.frontmatter.get('merchant', 'Unknown'),
                'description': txn.frontmatter.get('description', '')
            })

total_revenue_week = sum(txn['amount'] for txn in revenue_transactions)
```

**B. Calculate MTD (Month-To-Date)**:
```python
mtd_transactions = [txn for txn in all_transactions if is_current_month(txn['date'])]
total_revenue_mtd = sum(txn['amount'] for txn in mtd_transactions)
revenue_progress = (total_revenue_mtd / business_context['revenue_target_monthly']) * 100
```

#### 4. Analyze Completed Tasks

**Source**: `/Done` folder

**A. Count Completed Tasks**:
```python
completed_plans = []
for plan_file in glob('/Done/PLAN_*.md'):
    plan = parse_file(plan_file)
    completed_date = plan.frontmatter.get('completed_at')
    if is_within_period(completed_date, start_date, end_date):
        completed_plans.append({
            'name': extract_title(plan.content),
            'completed_date': completed_date,
            'complexity': plan.frontmatter.get('estimated_complexity'),
            'source_type': plan.frontmatter.get('source_item')
        })

total_completed = len(completed_plans)
```

**B. Categorize by Type**:
```python
by_type = {
    'email_responses': count_by_source_type(completed_plans, 'EMAIL'),
    'client_communications': count_by_source_type(completed_plans, 'WHATSAPP'),
    'financial_processing': count_by_source_type(completed_plans, 'bank'),
    'file_processing': count_by_source_type(completed_plans, 'FILE')
}
```

#### 5. Identify Bottlenecks

**A. Analyze Task Duration**:
```python
# Calculate time from creation to completion
bottlenecks = []

for plan in completed_plans:
    created_at = datetime.fromisoformat(plan.frontmatter['created'])
    completed_at = datetime.fromisoformat(plan.frontmatter['completed_at'])
    duration = (completed_at - created_at).total_seconds() / 3600  # hours

    # Expected duration by complexity
    expected_duration = {
        'simple': 24,    # 24 hours
        'medium': 72,    # 3 days
        'complex': 168   # 7 days
    }

    complexity = plan.frontmatter.get('estimated_complexity', 'simple')
    expected = expected_duration[complexity]

    if duration > expected * 1.5:  # 50% over expected
        delay = duration - expected
        bottlenecks.append({
            'task': extract_title(plan.content),
            'expected_hours': expected,
            'actual_hours': round(duration, 1),
            'delay_hours': round(delay, 1),
            'delay_percentage': round((delay / expected) * 100, 1)
        })

# Sort by delay percentage (worst first)
bottlenecks.sort(key=lambda x: x['delay_percentage'], reverse=True)
```

**B. Identify Recurring Issues**:
```python
# Look for patterns in delays
issue_patterns = {}
for bottleneck in bottlenecks:
    # Extract issue type from task name or source
    issue_type = categorize_bottleneck(bottleneck)
    issue_patterns[issue_type] = issue_patterns.get(issue_type, 0) + 1
```

#### 6. Subscription and Cost Analysis

**A. Find Subscription Charges**:
```python
subscription_patterns = {
    'netflix': r'netflix',
    'spotify': r'spotify',
    'adobe': r'adobe',
    'notion': r'notion',
    'slack': r'slack'
}

subscriptions = []
for txn in all_transactions_this_month:
    for name, pattern in subscription_patterns.items():
        if re.search(pattern, txn['merchant'].lower()):
            subscriptions.append({
                'name': name.title(),
                'amount': txn['amount'],
                'date': txn['date'],
                'merchant': txn['merchant']
            })

total_subscription_cost = sum(abs(sub['amount']) for sub in subscriptions)
```

**B. Check Usage (if data available)**:
```python
# This would require integration with service APIs (Silver/Gold tier)
# Bronze tier: Flag for manual review
unused_subscriptions = []

for sub in subscriptions:
    # Check if mentioned in logs or task files
    last_mentioned = find_last_mention(sub['name'])
    days_since_mention = (datetime.now() - last_mentioned).days if last_mentioned else 999

    if days_since_mention > 30:
        unused_subscriptions.append({
            'name': sub['name'],
            'cost_monthly': sub['amount'],
            'cost_annual': sub['amount'] * 12,
            'last_activity': last_mentioned or "Never detected",
            'days_idle': days_since_mention
        })
```

#### 7. Proactive Suggestions

**Generate Recommendations**:
```python
suggestions = []

# Revenue suggestions
if revenue_progress < 50 and today.day > 15:
    suggestions.append({
        'category': 'revenue',
        'priority': 'high',
        'suggestion': f'Revenue at {revenue_progress:.0f}% of target. Consider reaching out to clients for pending invoices.'
    })

# Cost optimization
if unused_subscriptions:
    annual_savings = sum(sub['cost_annual'] for sub in unused_subscriptions)
    suggestions.append({
        'category': 'cost_optimization',
        'priority': 'medium',
        'suggestion': f'Cancel {len(unused_subscriptions)} unused subscriptions to save ${annual_savings:.2f}/year'
    })

# Bottleneck resolution
if bottlenecks:
    top_bottleneck = bottlenecks[0]
    suggestions.append({
        'category': 'efficiency',
        'priority': 'high',
        'suggestion': f'Investigate delays in "{top_bottleneck["task"]}" ({top_bottleneck["delay_percentage"]:.0f}% over expected)'
    })

# Project deadlines
for project in active_projects:
    days_until_due = (datetime.fromisoformat(project['due']) - datetime.now()).days
    if days_until_due <= 7:
        suggestions.append({
            'category': 'deadline',
            'priority': 'high',
            'suggestion': f'{project["name"]} due in {days_until_due} days - verify on track'
        })
```

#### 8. Generate Briefing Document

**Output File**: `/Briefings/YYYY-MM-DD_Monday_Briefing.md`

**Template**:
```markdown
---
generated: {timestamp}
period: {start_date} to {end_date}
week_number: {week_of_year}
---

# Monday Morning CEO Briefing

**Period**: {start_date} to {end_date}
**Generated**: {timestamp}

## Executive Summary
{1-2_sentence_overview_of_week}

## Revenue
- **This Week**: ${total_revenue_week:,.2f}
- **MTD**: ${total_revenue_mtd:,.2f} ({revenue_progress:.0f}% of ${revenue_target_monthly:,.0f} target)
- **Trend**: {On track | Ahead | Behind}

### Revenue Breakdown
| Source | Amount | Date |
|--------|--------|------|
{revenue_transaction_table}

## Completed Tasks
- **Total Completed**: {total_completed}
- **Email Responses**: {by_type['email_responses']}
- **Client Communications**: {by_type['client_communications']}
- **Financial Processing**: {by_type['financial_processing']}
- **File Processing**: {by_type['file_processing']}

### Notable Completions
{list_of_significant_completed_tasks}

## Bottlenecks
{if_bottlenecks_exist:}
| Task | Expected | Actual | Delay |
|------|----------|--------|-------|
{bottleneck_table}

**Analysis**: {pattern_analysis}

{else:}
No significant bottlenecks detected this week. All tasks completed within expected timeframes.

## Proactive Suggestions

### Cost Optimization
{if_unused_subscriptions:}
- **Potential Savings**: ${annual_savings:.2f}/year

| Subscription | Monthly Cost | Last Activity | Recommendation |
|--------------|--------------|---------------|----------------|
{unused_subscription_table}

**[ACTION]** Review and cancel unused subscriptions? Create approval request?

### Revenue Opportunities
{revenue_suggestions}

### Efficiency Improvements
{efficiency_suggestions}

## Upcoming Deadlines
{for_each_project:}
- **{project_name}**: {due_date} ({days_remaining} days) - Budget: ${budget:,.2f}

## Key Metrics

### Performance
| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Client response time | < 24 hours | {actual} | {✅/⚠️/❌} |
| Invoice payment rate | > 90% | {actual}% | {✅/⚠️/❌} |
| Software costs | < $500/month | ${actual} | {✅/⚠️/❌} |

### System Health
- Vault Health: {✅ Operational | ⚠️ Degraded}
- Watcher Status: {active_watchers}/{total_watchers} active
- Pending Approvals: {count}
- Backlog Size: {needs_action_count} items

## Actions Required
{prioritized_list_of_actions_for_user}

---
*Generated by AI Employee v{version} | Constitution v{const_version}*
```

#### 9. Update Dashboard with Briefing Link

Update `Dashboard.md`:
```markdown
## Quick Stats
- **Last Briefing**: 2026-01-08_Monday_Briefing.md (click to view)
```

#### 10. Log Briefing Generation

**Log Entry**:
```json
{
  "timestamp": "2026-01-08T07:00:00Z",
  "action_type": "briefing_generated",
  "period_start": "2026-01-01",
  "period_end": "2026-01-07",
  "revenue_week": 2450.00,
  "revenue_mtd": 4500.00,
  "tasks_completed": 23,
  "bottlenecks_identified": 1,
  "suggestions_made": 3,
  "briefing_file": "/Briefings/2026-01-08_Monday_Briefing.md"
}
```

### Acceptance Criteria

- [ ] Briefing file created in `/Briefings` folder
- [ ] All data sections populated with accurate information
- [ ] Revenue correctly calculated from transactions
- [ ] Completed tasks counted and categorized
- [ ] Bottlenecks identified with delay percentages
- [ ] Subscriptions analyzed for usage
- [ ] Proactive suggestions generated
- [ ] Upcoming deadlines listed
- [ ] Actionable recommendations provided
- [ ] Well-formatted markdown with tables
- [ ] Dashboard updated with link to briefing

### Constraints

**Constitution Compliance**:
- **Principle III**: Proactive Autonomous Management - Briefing is proactive analysis
- **Principle IV**: Comprehensive Audit Logging - Briefing generation logged

**Data Quality**:
- Must use actual data, not placeholders
- Revenue calculations must be accurate
- Task counts must match actual files
- Dates must be correct

**Bronze Tier Limitations**:
- Cannot access external service APIs (usage data estimation only)
- Cannot automatically schedule (manual trigger or cron)
- No real-time dashboards (file-based only)

## Examples

### Example 1: Successful Week

**Generated Briefing**: `/Briefings/2026-01-06_Monday_Briefing.md`

```markdown
---
generated: 2026-01-06T07:00:00Z
period: 2025-12-30 to 2026-01-05
week_number: 1
---

# Monday Morning CEO Briefing

**Period**: December 30, 2025 to January 5, 2026
**Generated**: January 6, 2026 at 7:00 AM

## Executive Summary
Strong week with revenue ahead of target. One minor bottleneck identified. Three cost optimization opportunities detected.

## Revenue
- **This Week**: $2,450.00
- **MTD**: $4,500.00 (45% of $10,000 target)
- **Trend**: ✅ On track

### Revenue Breakdown
| Source | Amount | Date |
|--------|--------|------|
| Client A - Invoice #123 | $1,500.00 | 2026-01-03 |
| Client C - Consulting | $950.00 | 2026-01-05 |

## Completed Tasks
- **Total Completed**: 23
- **Email Responses**: 8
- **Client Communications**: 5
- **Financial Processing**: 7
- **File Processing**: 3

### Notable Completions
- ✅ Client A invoice sent and paid ($1,500)
- ✅ Project Alpha milestone 2 delivered
- ✅ Weekly social media posts scheduled (3 platforms)
- ✅ Q1 tax prep documents organized

## Bottlenecks
| Task | Expected | Actual | Delay |
|------|----------|--------|-------|
| Client B proposal | 48h | 120h | +72h (+150%) |

**Analysis**: Proposal delayed due to waiting on client feedback for requirements clarification. Consider setting internal deadline for client responses in future.

## Proactive Suggestions

### Cost Optimization
- **Potential Savings**: $180.00/year

| Subscription | Monthly Cost | Last Activity | Recommendation |
|--------------|--------------|---------------|----------------|
| Notion | $15.00 | No activity in 45 days | Cancel - using Obsidian instead |

**[ACTION]** Cancel Notion subscription? Expected annual savings: $180.

### Revenue Opportunities
- 2 clients haven't been contacted in 30+ days
- Consider sending check-in emails to re-engage

### Efficiency Improvements
- Client proposal process could benefit from template creation
- Would reduce typical 48h timeline to 24h

## Upcoming Deadlines
- **Project Alpha**: January 15, 2026 (9 days) - Budget: $2,000.00
- **Quarterly Tax Prep**: January 31, 2026 (25 days) - Budget: N/A

## Key Metrics

### Performance
| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Client response time | < 24 hours | 18 hours | ✅ |
| Invoice payment rate | > 90% | 95% | ✅ |
| Software costs | < $500/month | $485.00 | ✅ |

### System Health
- Vault Health: ✅ Operational
- Watcher Status: 3/3 active
- Pending Approvals: 0
- Backlog Size: 2 items

## Actions Required
1. **High Priority**: Finalize Client B proposal (overdue by 3 days)
2. **Medium Priority**: Review and approve Notion cancellation
3. **Low Priority**: Create proposal template for future efficiency

---
*Generated by AI Employee v1.0.0 | Constitution v1.0.0*
```

---

### Example 2: Week with Issues

**Scenario**: Behind on revenue, multiple bottlenecks, high costs

**Generated Briefing**:

```markdown
## Executive Summary
⚠️ Challenging week: Revenue below target, 3 significant bottlenecks, urgent action needed.

## Revenue
- **This Week**: $850.00
- **MTD**: $1,200.00 (12% of $10,000 target)
- **Trend**: ⚠️ Behind - Need $8,800 in next 23 days

## Bottlenecks
| Task | Expected | Actual | Delay |
|------|----------|--------|-------|
| Client A proposal | 72h | 240h | +168h (+233%) |
| Invoice follow-up | 24h | 120h | +96h (+400%) |
| Website bug fix | 48h | 144h | +96h (+200%) |

**Analysis**: ⚠️ Critical delays in client-facing work. Pattern: Waiting on external dependencies (client responses, vendor fixes).

## Proactive Suggestions

### Revenue Recovery (URGENT)
- **Action 1**: Follow up on 3 overdue invoices (total: $4,500)
- **Action 2**: Send proposals to 2 warm leads contacted last month
- **Action 3**: Schedule calls with top 3 clients for Q1 planning

### Cost Optimization
- **Immediate Savings**: $600/year

| Subscription | Monthly Cost | Last Activity | Recommendation |
|--------------|--------------|---------------|----------------|
| Slack Premium | $25.00 | Last used 60 days ago | Downgrade to free |
| Adobe CC | $50.00 | Last used 90 days ago | Cancel - not in use |

**[ACTION]** Cancel 2 subscriptions for $900/year savings.

## Actions Required (Prioritized)
1. **🚨 URGENT**: Chase overdue invoices ($4,500) - TODAY
2. **High**: Unblock Client A proposal (waiting 10 days for response)
3. **High**: Address website bug causing client complaints
4. **Medium**: Cancel unused subscriptions ($75/month savings)
5. **Medium**: Review bottleneck patterns and implement process improvements
```

---

### Example 3: No Activity Week

**Scenario**: Vacation week, no transactions or tasks

**Generated Briefing**:

```markdown
## Executive Summary
No activity this week (vacation/holiday period). System operational and ready for resumption.

## Revenue
- **This Week**: $0.00
- **MTD**: $0.00 (0% of $10,000 target)
- **Trend**: N/A (no activity period)

## Completed Tasks
No tasks completed this week.

## System Health
- Vault Health: ✅ Operational
- Watcher Status: 3/3 active
- All systems monitoring and ready

## Actions Required
None - Resume normal operations next week.
```

## References

### Related Skills
- `/bronze.update-dashboard.md` - Updates dashboard with briefing link
- `/bronze.process-inbox.md` - Processes tasks counted in briefing
- `/bronze.check-watchers.md` - Provides system health data

### Documentation
- `Business_Goals.md` - Revenue targets and KPIs
- `Company_Handbook.md` - Performance metrics
- `.specify/memory/constitution.md` - Principle III (Proactive Management)
- `sample_weekly_briefing.md` - Briefing template reference

### Code References
- `bank_watcher.py:100-150` - Transaction categorization for revenue
- `generate-plan.md:200-250` - Task completion tracking

### External Resources
- [Executive Dashboards Best Practices](https://www.tableau.com/learn/articles/executive-dashboard-examples) - Dashboard design
- [Business KPIs Guide](https://www.klipfolio.com/resources/kpi-examples) - Key performance indicators
- [Cost Optimization Strategies](https://www.mckinsey.com/capabilities/operations/our-insights/cost-reduction) - McKinsey framework

### Related Constitution Principles
- **Principle III**: Proactive Autonomous Management - Briefing is proactive analysis
- **Principle IV**: Comprehensive Audit Logging - Data sources for briefing

### Scheduling

**Recommended Schedule**:
```bash
# Cron job for every Monday at 7 AM
0 7 * * 1 cd /path/to/vault && claude /bronze.generate-briefing
```

**Windows Task Scheduler**:
- Trigger: Weekly, Monday, 7:00 AM
- Action: `claude /bronze.generate-briefing`
- Working directory: Vault path

**Manual Trigger**:
```bash
claude /bronze.generate-briefing
claude /bronze.generate-briefing --period "2026-01-01 to 2026-01-07"
```

---

**Skill Version**: 1.0.0
**Last Updated**: 2026-01-08
**Tier**: Bronze
**Author**: Personal AI Employee System
**Status**: Production Ready
