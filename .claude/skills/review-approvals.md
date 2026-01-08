# Review Approvals

## Title
**Review Approvals** - Human-in-the-Loop Approval Workflow Guide

## Description

This skill assists humans in reviewing pending approval requests by providing clear summaries, risk assessments, and approval guidance. It consolidates information from approval requests and related plans, highlights critical details, and streamlines the decision-making process for the Human-in-the-Loop workflow.

**Capability Level**: Bronze Tier
**Category**: Human Interaction & Governance
**Risk Level**: Low (Informational only, no automatic approvals)

## Instructions

### Execution Flow

#### 1. Scan Pending Approvals

**Location**: `/Pending_Approval` folder

```python
# Find all approval requests
approval_requests = glob('/Pending_Approval/APPROVAL_*.md')

# Sort by priority and expiry
approval_requests.sort(key=lambda x: (
    get_frontmatter(x).get('priority') != 'high',
    get_frontmatter(x).get('expires')
))
```

**Frontmatter Fields**:
```yaml
---
action: send_email | make_payment | post_content | delete_file
related_plan: /Plans/PLAN_xxx.md
amount: 100.00 (if financial)
recipient: client@example.com (if communication)
status: pending
created: 2026-01-08T10:00:00Z
expires: 2026-01-09T10:00:00Z (24 hours from creation)
priority: high | normal
---
```

#### 2. Generate Approval Summary

**For Each Approval Request**:

**A. Extract Key Information**:
```python
approval_data = {
    'action_type': frontmatter['action'],
    'recipient': frontmatter.get('recipient'),
    'amount': frontmatter.get('amount'),
    'expires_in': calculate_time_remaining(frontmatter['expires']),
    'related_plan': frontmatter['related_plan'],
    'priority': frontmatter.get('priority', 'normal')
}
```

**B. Read Related Plan**:
```python
plan_path = frontmatter['related_plan']
plan = read_file(plan_path)
plan_data = {
    'objective': extract_section(plan, '## Objective'),
    'steps': extract_section(plan, '## Steps'),
    'success_criteria': extract_section(plan, '## Success Criteria'),
    'constraints': extract_section(plan, '## Constraints')
}
```

**C. Read Source Item**:
```python
source_path = plan.frontmatter['source_item']
source = read_file(source_path)
source_data = {
    'type': source.frontmatter['type'],
    'from': source.frontmatter.get('from'),
    'content_preview': source.content[:200]
}
```

#### 3. Assess Risk Level

**Risk Calculation**:
```python
risk_level = 'Low'
risk_factors = []

# Financial risk
if approval_data['amount']:
    if amount > 500:
        risk_level = 'High'
        risk_factors.append(f'Large amount: ${amount}')
    elif amount > 100:
        risk_level = 'Medium'
        risk_factors.append(f'Moderate amount: ${amount}')

# Communication risk
if approval_data['action_type'] in ['send_email', 'send_message']:
    if source_data['from'] == 'unknown':
        risk_level = max(risk_level, 'Medium')
        risk_factors.append('Unknown contact')

# Irreversibility
if approval_data['action_type'] in ['make_payment', 'delete_file']:
    risk_level = max(risk_level, 'High')
    risk_factors.append('Irreversible action')

# Expiry urgency
if approval_data['expires_in'] < timedelta(hours=2):
    risk_factors.append('Expiring soon')
```

#### 4. Create Approval Dashboard

**Consolidated View**: `/Pending_Approval/APPROVAL_DASHBOARD.md`

```markdown
# Approval Dashboard
Generated: {timestamp}

## Summary
- Total Pending: {count}
- High Priority: {high_count}
- Expiring Soon (<2 hours): {urgent_count}

## Pending Approvals

### 1. [HIGH PRIORITY] {Approval_Title}
**Action**: {action_type}
**Recipient/Target**: {recipient}
**Amount**: {amount if financial}
**Expires**: {expires_in_human_readable}
**Risk Level**: {Low|Medium|High}

**What Will Happen**:
{brief_description}

**Why This Action**:
{rationale_from_plan}

**To Approve**: Move `{filename}` to `/Approved`
**To Reject**: Move `{filename}` to `/Rejected`

**Details**: See `{related_plan_path}`

---

### 2. {Next_Approval}
...

## Expired Approvals
{List of approvals past 24 hour expiry}

---
*Refresh this dashboard: `/bronze.review-approvals`*
```

#### 5. Check for Expired Approvals

**Expiry Logic**:
```python
now = datetime.now()
expired_approvals = []

for approval in approval_requests:
    expiry = datetime.fromisoformat(approval.frontmatter['expires'])
    if now > expiry:
        expired_approvals.append(approval)
```

**Handle Expired**:
1. Move to `/Rejected` folder
2. Add note: "Auto-rejected: Expired after 24 hours"
3. Update related plan status: "rejected_expired"
4. Log the auto-rejection

#### 6. Provide Approval Guidance

**Decision Framework**:

**For Email/Message Approvals**:
```markdown
### Review Checklist
- [ ] Recipient is correct
- [ ] Message tone is professional
- [ ] Content is accurate
- [ ] No typos or errors
- [ ] Aligns with company voice
- [ ] Contains no sensitive information (unintentionally)
```

**For Payment Approvals**:
```markdown
### Review Checklist
- [ ] Amount is correct
- [ ] Recipient/payee is verified
- [ ] Payment purpose is clear
- [ ] Budget has sufficient funds
- [ ] No duplicate payment
- [ ] Invoice/receipt attached (if required)
```

**For Content Posting**:
```markdown
### Review Checklist
- [ ] Content is factually accurate
- [ ] Tone matches brand voice
- [ ] No controversial statements
- [ ] Grammar and spelling correct
- [ ] Links/images work correctly
- [ ] Scheduled time is appropriate
```

#### 7. Process Approval/Rejection

**When Human Moves File to /Approved**:
```python
# Detect file movement (Silver/Gold tier with file watcher)
# Bronze tier: Manual check via this skill

approved_files = glob('/Approved/APPROVAL_*.md')
for approval in approved_files:
    # Read approval and related plan
    plan_path = approval.frontmatter['related_plan']

    # Update plan status
    update_frontmatter(plan_path, {'status': 'approved', 'approved_at': now()})

    # Log approval
    log_action({
        'action': 'approval_granted',
        'approval_file': approval.path,
        'plan_file': plan_path,
        'approved_by': 'human',
        'timestamp': now()
    })

    # Move to Done (after execution in Silver/Gold tier)
    # Bronze tier: Keep in Approved for manual execution
```

**When Human Moves File to /Rejected**:
```python
rejected_files = glob('/Rejected/APPROVAL_*.md')
for approval in rejected_files:
    plan_path = approval.frontmatter['related_plan']

    # Update plan status
    update_frontmatter(plan_path, {'status': 'rejected', 'rejected_at': now()})

    # Log rejection
    log_action({
        'action': 'approval_rejected',
        'approval_file': approval.path,
        'plan_file': plan_path,
        'rejected_by': 'human',
        'timestamp': now()
    })

    # Archive
    move(approval, '/Done/rejected_approvals/')
```

### Acceptance Criteria

- [ ] All pending approvals identified
- [ ] Approval dashboard generated with all approvals
- [ ] Risk levels correctly assessed
- [ ] Expired approvals handled (moved to Rejected)
- [ ] Clear approval guidance provided
- [ ] Related plan and source item linked
- [ ] Time remaining until expiry calculated
- [ ] Sorted by priority and expiry

### Constraints

**Constitution Compliance**:
- **Principle II**: Human-in-the-Loop - This skill facilitates human review
- **Principle IV**: Audit Logging - All approvals/rejections must be logged

**Bronze Tier Limitations**:
- No automatic expiry handling (manual check required)
- No real-time notifications (dashboard must be manually refreshed)
- No automatic execution after approval (Silver/Gold capability)

**Operational Constraints**:
- Never auto-approve (always requires human action)
- Never modify approval requests (read-only)
- Cannot detect file movements automatically (Bronze limitation)

## Examples

### Example 1: Multiple Pending Approvals

**Scenario**: 3 approvals pending, one expiring soon

**Generated Dashboard**: `/Pending_Approval/APPROVAL_DASHBOARD.md`
```markdown
# Approval Dashboard
Generated: 2026-01-08T16:00:00Z

## Summary
- Total Pending: 3
- High Priority: 1
- Expiring Soon (<2 hours): 1

## Pending Approvals

### 1. [HIGH PRIORITY] Send Invoice to Client A
**Action**: send_email
**Recipient**: client.a@example.com
**Amount**: N/A
**Expires**: ⚠️ 1 hour 30 minutes
**Risk Level**: Medium

**What Will Happen**:
Send January 2026 invoice ($1,500) to Client A via email with PDF attachment.

**Why This Action**:
Client requested invoice for January consulting services (40 hours @ $37.50/hr).

**Risk Factors**:
- Email communication (requires accuracy)
- Expires soon (need decision within 1.5 hours)

**To Approve**: Move `APPROVAL_invoice_client_a.md` to `/Approved`
**To Reject**: Move `APPROVAL_invoice_client_a.md` to `/Rejected`

**Details**: See `/Plans/PLAN_invoice_client_a_20260108.md`

---

### 2. Categorize Netflix Subscription
**Action**: categorize_transaction
**Amount**: -$15.99
**Expires**: 22 hours 15 minutes
**Risk Level**: Low

**What Will Happen**:
Categorize Netflix subscription as "Entertainment" expense and check usage.

**Why This Action**:
Standard monthly subscription charge detected. Checking if service is still used.

**Risk Factors**: None (information processing only)

**To Approve**: Move `APPROVAL_netflix_sub.md` to `/Approved`
**To Reject**: Move `APPROVAL_netflix_sub.md` to `/Rejected`

**Details**: See `/Plans/PLAN_categorize_netflix_20260108.md`

---

### 3. Reply to Client B Timeline Query
**Action**: send_email
**Recipient**: client.b@example.com
**Expires**: 18 hours 45 minutes
**Risk Level**: Medium

**What Will Happen**:
Send email to Client B confirming website redesign completion date (Jan 30).

**Why This Action**:
Client asked about project timeline. Response provides accurate status update.

**Draft Email Preview**:
> Subject: Re: Question about project timeline
>
> Hi [Client B Name],
>
> Thanks for reaching out! The website redesign project is on track
> for completion by January 30, 2026...

**Risk Factors**:
- Client communication (represents company commitment)
- Timeline commitment (must be accurate)

**To Approve**: Move `APPROVAL_email_client_b.md` to `/Approved`
**To Reject**: Move `APPROVAL_email_client_b.md` to `/Rejected`

**Details**: See `/Plans/PLAN_email_client_b_20260108.md`

---

## Expired Approvals
None

---
*Refresh this dashboard: `/bronze.review-approvals`*
```

---

### Example 2: Expired Approval Detected

**Before Expiry Check**:
- `/Pending_Approval/APPROVAL_old_request.md` (created 25 hours ago)

**After Skill Execution**:
1. Detected expiry (now > created + 24 hours)
2. Moved to `/Rejected/APPROVAL_old_request.md`
3. Added note to file:
```markdown
---
status: rejected
rejection_reason: auto_expired
rejected_at: 2026-01-08T16:00:00Z
---

**AUTO-REJECTED**: This approval request expired after 24 hours with no response.

Original expiry: 2026-01-07T15:00:00Z
Auto-rejected: 2026-01-08T16:00:00Z
```

4. Updated related plan:
```yaml
---
status: rejected_expired
---
```

5. Logged action:
```json
{
  "timestamp": "2026-01-08T16:00:00Z",
  "action_type": "approval_auto_rejected",
  "reason": "expired",
  "approval_file": "/Rejected/APPROVAL_old_request.md",
  "plan_file": "/Plans/PLAN_xxx.md"
}
```

---

### Example 3: High-Risk Approval

**Approval Request**: Payment >$500

**Enhanced Dashboard Entry**:
```markdown
### [HIGH PRIORITY] [HIGH RISK] Payment to Vendor
**Action**: make_payment
**Recipient**: vendor@example.com
**Amount**: $750.00
**Expires**: 6 hours 30 minutes
**Risk Level**: ⚠️ HIGH

**What Will Happen**:
Transfer $750.00 to vendor@example.com for software license renewal.

**Why This Action**:
Annual software license renewal due. Vendor sent invoice #12345.

**Risk Factors**:
- ⚠️ High amount ($750.00)
- ⚠️ Irreversible (payment cannot be recalled)
- ⚠️ Financial transaction

**ADDITIONAL VERIFICATION REQUIRED**:
- [ ] Verify vendor email is correct (not phishing)
- [ ] Confirm invoice #12345 is legitimate
- [ ] Check budget allocation for software expenses
- [ ] Verify no duplicate payment made recently

**To Approve**: Move `APPROVAL_payment_vendor.md` to `/Approved`
**To Reject**: Move `APPROVAL_payment_vendor.md` to `/Rejected`

**Details**: See `/Plans/PLAN_payment_vendor_20260108.md`
```

## References

### Related Skills
- `/bronze.generate-plan.md` - Creates plans that require approval
- `/bronze.update-dashboard.md` - Shows "Pending Approval" count
- `/silver.execute-approved.md` - Executes approved actions (Silver Tier)

### Documentation
- `.specify/memory/constitution.md` - Principle II (Human-in-the-Loop)
- `Company_Handbook.md` - Operational Rules (Decision Matrix)
- `sample_approval_request.md` - Approval request template
- `README.md` - Approval workflow section

### Code References
- `generate-plan.md:250-300` - Creates approval requests
- `process-inbox.md:180-220` - Determines approval requirements

### External Resources
- [Decision-Making Frameworks](https://www.mindtools.com/pages/article/newTED_00.htm) - Structured decision approaches
- [Risk Assessment Matrix](https://www.projectmanager.com/blog/risk-assessment-matrix) - Risk evaluation methods

### Related Constitution Principles
- **Principle II**: Human-in-the-Loop for Sensitive Actions - Core purpose of this skill
- **Principle IV**: Comprehensive Audit Logging - All approvals/rejections logged
- **Principle V**: File-Based Workflow - Approvals managed via file movement

### Workflow Diagram

```
┌─────────────────────────────────────────────────────────┐
│           Approval Workflow (Bronze Tier)               │
└─────────────────────────────────────────────────────────┘

    Plan Created
         │
         ▼
   Requires Approval?
         │
    ┌────┴────┐
   Yes       No
    │          │
    ▼          ▼
 Create      Execute
 Approval    (Silver Tier)
 Request
    │
    ▼
/Pending_Approval/
    │
    ▼
 HUMAN REVIEWS ← /bronze.review-approvals (this skill)
 (This Skill)
    │
    ├─────────┬─────────┐
    │         │         │
  Approve   Reject   Ignore
    │         │         │
    ▼         ▼         ▼
/Approved/ /Rejected/ (Expires after 24hr)
    │         │         │
    ▼         ▼         ▼
 Execute    Log &   Auto-Reject
(Silver)   Archive    & Log
```

### Approval Decision Matrix

| Action Type | Amount/Scope | Risk Level | Review Time |
|------------|--------------|------------|-------------|
| Email (known contact) | N/A | Medium | 2-5 minutes |
| Email (new contact) | N/A | High | 5-10 minutes |
| Payment | <$100 | Low | 1-2 minutes |
| Payment | $100-$500 | Medium | 3-5 minutes |
| Payment | >$500 | High | 10-15 minutes |
| Social post | Regular | Low | 2-3 minutes |
| Social post | Controversial | High | 10-20 minutes |
| File delete | Few files | Medium | 2-5 minutes |
| File delete | Many files | High | 10-15 minutes |

---

**Skill Version**: 1.0.0
**Last Updated**: 2026-01-08
**Tier**: Bronze
**Author**: Personal AI Employee System
**Status**: Production Ready
