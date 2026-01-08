# Generate Action Plan

## Title
**Generate Action Plan** - Create Detailed Execution Plans from Action Items

## Description

This skill generates comprehensive, actionable plans for specific items in the `/Needs_Action` folder. It performs deep analysis of item content, consults operational guidelines, determines approval requirements, and creates structured plans with measurable success criteria. This is the core reasoning capability of the AI Employee.

**Capability Level**: Bronze Tier
**Category**: Planning & Reasoning
**Risk Level**: Low (Planning only, no execution)

## Instructions

### Execution Flow

#### 1. Identify Target Item

**Input Methods**:
- **Explicit**: User provides item path - `/bronze.generate-plan "/Needs_Action/EMAIL_client_a.md"`
- **Automatic**: Process oldest unprocessed item in `/Needs_Action`

**Selection Criteria** (if automatic):
```python
# Find items without corresponding plans
items_without_plans = []
for item in glob('/Needs_Action/*.md'):
    item_id = extract_id(item)  # e.g., "EMAIL_client_a"
    plan_exists = glob(f'/Plans/PLAN_{item_id}*.md')
    if not plan_exists:
        items_without_plans.append(item)

# Sort by priority and age
items_without_plans.sort(key=lambda x: (
    get_frontmatter(x).get('priority') != 'high',
    get_frontmatter(x).get('received')
))

target = items_without_plans[0] if items_without_plans else None
```

#### 2. Read and Parse Item

**Extract Frontmatter**:
```yaml
---
type: email | whatsapp | bank | file_drop
from: sender@example.com
subject: "Invoice Request"
received: 2026-01-08T10:30:00Z
priority: high | normal
status: pending
---
```

**Extract Content**:
Read the body below frontmatter, which contains the actual message, transaction, or file details.

#### 3. Load Context Documents

**Required Reads**:
1. **Company_Handbook.md**:
   - Extract Decision Matrix
   - Extract Communication Protocols
   - Extract Priority System

2. **Business_Goals.md**:
   - Extract active projects
   - Extract revenue targets
   - Extract subscription audit rules
   - Extract key metrics

3. **.specify/memory/constitution.md**:
   - Extract Human-in-the-Loop rules (Principle II)
   - Extract approval thresholds
   - Extract prohibited actions

**Context Data Structure**:
```python
context = {
    'decision_matrix': parse_handbook_decision_matrix(),
    'active_projects': parse_business_goals_projects(),
    'approval_rules': parse_constitution_approval_rules(),
    'subscription_patterns': parse_subscription_rules()
}
```

#### 4. Analyze Item Content

**A. Type-Specific Analysis**:

**For Email (`type: email`)**:
```python
analysis = {
    'sender_type': classify_sender(from_address),  # client, vendor, colleague, unknown
    'intent': detect_intent(content),  # request, question, notification, complaint
    'urgency': detect_urgency(subject, content),  # urgent, normal
    'action_required': determine_action(intent),  # reply, forward, create_task, archive
    'contains_sensitive': check_sensitive(content)  # PII, financial, credentials
}
```

**For WhatsApp (`type: whatsapp`)**:
```python
analysis = {
    'sender_type': classify_sender(from_number),
    'keywords': extract_keywords(content),  # urgent, invoice, payment, help
    'business_context': match_business_context(content, active_projects),
    'response_urgency': calculate_urgency(keywords, business_context)
}
```

**For Bank Transaction (`type: bank`)**:
```python
analysis = {
    'transaction_type': 'debit' | 'credit',
    'merchant': identify_merchant(description),
    'category': categorize_transaction(merchant, amount),
    'is_subscription': match_subscription_pattern(merchant),
    'is_unusual': detect_anomaly(amount, merchant, history),
    'requires_review': amount > THRESHOLD or is_unusual
}
```

**For File Drop (`type: file_drop`)**:
```python
analysis = {
    'file_type': detect_file_type(filename, size),
    'purpose': infer_purpose(filename, content_preview),
    'processing_needed': determine_processing(file_type, purpose),
    'risk_level': assess_risk(file_type, size, source)
}
```

**B. Cross-Reference with Context**:
- Match sender against known contacts
- Align intent with business goals
- Check if relates to active projects
- Identify relevant handbook policies

#### 5. Determine Approval Requirements

**Decision Logic**:
```python
requires_approval = False
approval_reasons = []

# Constitution Principle II: Human-in-the-Loop
if action_type in ['send_email', 'send_message', 'post_content']:
    requires_approval = True
    approval_reasons.append('External communication requires approval')

if action_type in ['payment', 'transfer', 'subscription_cancel']:
    requires_approval = True
    approval_reasons.append('Financial transaction requires approval')

if action_involves_new_contact and action_type == 'send_email':
    requires_approval = True
    approval_reasons.append('New contact communication requires approval')

if transaction_amount > 100:
    requires_approval = True
    approval_reasons.append(f'Amount ${transaction_amount} exceeds auto-approval threshold')

# Handbook decision matrix
if decision_matrix[item_type]['approval'] == 'required':
    requires_approval = True
    approval_reasons.append(f'Handbook requires approval for {item_type}')
```

#### 6. Generate Plan Structure

**Plan Filename**:
```python
# Format: PLAN_<type>_<identifier>_<timestamp>.md
plan_id = f"PLAN_{item.type}_{extract_id(item)}_{timestamp()}.md"
plan_path = f"/Plans/{plan_id}"
```

**Plan Template**:
```markdown
---
created: {ISO_timestamp}
source_item: {path_to_original_item}
status: pending
requires_approval: {yes|no}
priority: {high|normal}
estimated_complexity: {simple|medium|complex}
---

# Action Plan: {Brief_Title}

## Source
- Type: {type}
- From: {sender}
- Received: {timestamp}
- Original: [{item_filename}]({relative_path})

## Objective
{1-2_sentence_description_of_goal}

## Analysis
{Content_analysis_and_rationale}
- Intent: {detected_intent}
- Urgency: {urgency_level}
- Business context: {alignment_with_goals}
- Sensitivity: {contains_sensitive_data_yes_no}

## Steps
- [ ] Step 1: {action_description} (Status: pending)
- [ ] Step 2: {action_description} (Status: pending)
- [ ] Step 3: {action_description} **[REQUIRES APPROVAL]** (Status: pending)
- [ ] Step 4: {action_description} (Status: pending)

## Approval Required
{Yes|No}

{if_yes:}
**Why Approval is Needed**:
{list_of_reasons}

**How to Approve**:
1. Review this plan carefully
2. Verify all details are accurate
3. Move this file to `/Approved` folder

**How to Reject**:
1. Move this file to `/Rejected` folder
2. Add a note explaining why (optional)

{if_no:}
**Auto-Executable**: This plan involves information processing only and can be executed automatically (Silver/Gold tier).

## Success Criteria
- [ ] {Measurable_outcome_1}
- [ ] {Measurable_outcome_2}
- [ ] {Measurable_outcome_3}

## Constraints
- Constitution Principle: {applicable_principles}
- Handbook Policy: {applicable_policies}
- Must not: {prohibited_actions}
- Must comply with: {required_compliance}

## Estimated Complexity
{Simple|Medium|Complex}

**Rationale**: {explanation_of_complexity_rating}
- Simple: 1-2 steps, no external dependencies, no approval
- Medium: 3-5 steps, may involve approval or external lookup
- Complex: 6+ steps, multiple approvals, coordination required

## Related Items
- Business Goal: {related_goal_if_applicable}
- Active Project: {related_project_if_applicable}
- Previous Plans: {similar_past_plans_if_relevant}

---
*Plan generated by AI Employee on {timestamp}*
*Constitution v{version} | Handbook v{version}*
```

#### 7. Create Approval Request (if needed)

If `requires_approval == True`, also create:

**Approval Request Filename**: `/Pending_Approval/APPROVAL_{item_id}.md`

```markdown
---
action: {action_type}
related_plan: {plan_path}
amount: {amount_if_financial}
recipient: {recipient_if_communication}
status: pending
expires: {timestamp_24_hours_from_now}
---

# Approval Request: {Brief_Title}

## What Will Happen
{Clear_explanation_of_the_action}

## Details
- **Action Type**: {send_email|make_payment|post_content|etc}
- **Target**: {email_address|payment_recipient|platform}
- **Content/Amount**: {email_body_preview|payment_amount}
- **Timing**: {immediate|scheduled}

## Why This Action
{Rationale_from_source_item_and_analysis}

## Risk Assessment
- **Risk Level**: {Low|Medium|High}
- **Reversibility**: {Can_be_undone|Irreversible}
- **Impact**: {description_of_potential_impact}

## To Approve
Move this file to `/Approved` folder.

## To Reject
Move this file to `/Rejected` folder with optional note.

## Related Files
- Source Item: [{item_name}]({path})
- Full Plan: [{plan_name}]({path})

---
*Approval request created: {timestamp}*
*Expires: {expiry_timestamp} (24 hours)*
```

#### 8. Update References

**Link Plan to Source Item**:
Edit source item to add reference:
```markdown
---
# ... existing frontmatter
related_plan: /Plans/PLAN_email_client_a_20260108.md
plan_status: pending
---
```

**Update Dashboard** (via update-dashboard skill):
- Increment "Active Tasks"
- If approval required: Increment "Pending Approval"
- Add to "Recent Activity"

#### 9. Log Action

**Log Entry**: `/Logs/YYYY-MM-DD.json`
```json
{
  "timestamp": "2026-01-08T11:00:00Z",
  "action_type": "plan_generated",
  "actor": "bronze.generate-plan",
  "source_item": "/Needs_Action/EMAIL_client_a.md",
  "plan_created": "/Plans/PLAN_email_client_a_20260108.md",
  "requires_approval": true,
  "approval_request": "/Pending_Approval/APPROVAL_client_a.md",
  "result": "success"
}
```

### Acceptance Criteria

- [ ] Plan file created in `/Plans` with unique filename
- [ ] All template sections filled with relevant content
- [ ] Steps are actionable and specific (not vague)
- [ ] Approval requirements correctly determined
- [ ] Success criteria are measurable
- [ ] Constitution and Handbook policies referenced
- [ ] Source item linked in plan frontmatter
- [ ] If approval required: approval request created
- [ ] Dashboard updated
- [ ] Action logged

### Constraints

**Constitution Compliance**:
- **Principle II**: Human-in-the-Loop - Correctly identify sensitive actions
- **Principle V**: File-Based Workflow - Plan is a file, not in-memory
- **Principle IV**: Audit Logging - Plan creation must be logged

**Quality Standards**:
- Plans must be specific, not generic
- Steps must be actionable by AI or human
- No ambiguous language ("consider", "maybe", "possibly")
- Use declarative statements ("Send email", not "We might want to send email")
- Success criteria must be verifiable

## Examples

### Example 1: Email Reply Plan (Requires Approval)

**Input Item**: `/Needs_Action/EMAIL_client_b_20260108.md`
```markdown
---
type: email
from: client.b@example.com
subject: Question about project timeline
received: 2026-01-08T14:00:00Z
priority: normal
status: pending
---

Hi, when will the website redesign be completed?
```

**Generated Plan**: `/Plans/PLAN_email_client_b_20260108.md`
```markdown
---
created: 2026-01-08T14:05:00Z
source_item: /Needs_Action/EMAIL_client_b_20260108.md
status: pending
requires_approval: yes
priority: normal
estimated_complexity: simple
---

# Action Plan: Reply to Client B Timeline Query

## Source
- Type: email
- From: client.b@example.com (known client)
- Received: 2026-01-08T14:00:00Z
- Original: [EMAIL_client_b_20260108.md](../Needs_Action/EMAIL_client_b_20260108.md)

## Objective
Provide project timeline update to Client B regarding website redesign completion.

## Analysis
- Intent: Information request (project status)
- Urgency: Normal (no deadline mentioned)
- Business context: Client B is active in Business_Goals.md with "Project Beta - Due Jan 30"
- Sensitivity: No sensitive data, standard business communication

## Steps
- [ ] Check current project status in /Plans or project management system
- [ ] Verify completion date (Business_Goals.md shows Jan 30, 2026)
- [ ] Draft professional email response **[REQUIRES APPROVAL]**
- [ ] Send email to client.b@example.com **[REQUIRES APPROVAL]**
- [ ] Log communication in project notes
- [ ] Move source email to /Done

## Approval Required
Yes

**Why Approval is Needed**:
- External client communication (Constitution Principle II)
- Represents company commitment on timeline
- Client expects accurate and professional response

**How to Approve**:
1. Review draft email below
2. Verify Jan 30 completion date is accurate
3. Move this plan to `/Approved` folder

**Draft Email**:
```
Subject: Re: Question about project timeline

Hi [Client B Name],

Thanks for reaching out! The website redesign project is on track for completion by January 30, 2026, as outlined in our project agreement.

We're currently in the final development phase and will begin user acceptance testing next week. I'll send you a detailed progress update early next week.

Please let me know if you have any other questions!

Best regards,
[Your Name]
```

## Success Criteria
- [ ] Email sent to client.b@example.com
- [ ] Response sent within 24 hours of inquiry
- [ ] Accurate timeline communicated
- [ ] Professional tone maintained

## Constraints
- Constitution Principle II: Email requires approval
- Handbook: "Maintain professional tone and accuracy"
- Must verify timeline accuracy before sending
- Cannot promise earlier date without project review

## Estimated Complexity
Simple

**Rationale**: Straightforward email reply with known information. Only requires draft review and send approval.

## Related Items
- Business Goal: Project Beta completion (Jan 30)
- Client: Known client from Business_Goals.md

---
*Plan generated by AI Employee on 2026-01-08T14:05:00Z*
*Constitution v1.0.0 | Handbook v1.0.0*
```

**Approval Request Created**: `/Pending_Approval/APPROVAL_email_client_b.md`

---

### Example 2: Bank Transaction Categorization (No Approval)

**Input Item**: `/Needs_Action/bank_20260108_grocery.md`
```markdown
---
type: bank
transaction_id: TXN_67890
merchant: Whole Foods Market
amount: -85.43
date: 2026-01-08
account: checking
status: pending
---

Debit transaction at grocery store.
```

**Generated Plan**: `/Plans/PLAN_bank_grocery_20260108.md`
```markdown
---
created: 2026-01-08T15:00:00Z
source_item: /Needs_Action/bank_20260108_grocery.md
status: pending
requires_approval: no
priority: normal
estimated_complexity: simple
---

# Action Plan: Categorize Grocery Transaction

## Source
- Type: bank
- Merchant: Whole Foods Market
- Amount: -$85.43
- Date: 2026-01-08

## Objective
Categorize grocery purchase in accounting records.

## Analysis
- Transaction type: Personal expense
- Merchant: Grocery store (not business expense)
- Amount: Normal grocery amount ($85.43)
- Unusual: No (typical grocery transaction)
- Requires review: No (below threshold and routine)

## Steps
- [ ] Categorize as "Personal - Groceries"
- [ ] Log in /Accounting/Personal_Expenses_2026-01.md
- [ ] Update monthly spending summary
- [ ] Move transaction to /Done

## Approval Required
No

**Auto-Executable**: This is information processing (categorization) with no external actions.

## Success Criteria
- [ ] Transaction categorized correctly
- [ ] Logged in accounting with date, merchant, amount
- [ ] Monthly totals updated

## Constraints
- Constitution Principle IV: Must log financial transaction
- No approval needed for categorization (info processing only)
- Must maintain accurate records

## Estimated Complexity
Simple

**Rationale**: Standard categorization with no external actions or approvals needed.

---
*Plan generated by AI Employee on 2026-01-08T15:00:00Z*
```

---

### Example 3: Complex Multi-Step Plan

**Input**: Urgent WhatsApp about website down

**Generated Plan**: Complex plan with multiple steps, some requiring approval, technical investigation, and escalation paths.

## References

### Related Skills
- `/bronze.process-inbox.md` - Calls this skill for each item
- `/bronze.update-dashboard.md` - Updates metrics after plan creation
- `/bronze.review-approvals.md` - Human reviews plans requiring approval

### Documentation
- `Company_Handbook.md` - Decision Matrix and policies
- `Business_Goals.md` - Active projects and objectives
- `.specify/memory/constitution.md` - Approval rules (Principle II)
- `sample_plan_file.md` - Plan template reference

### Code References
- `watcher_manager.py:200-250` - Creates items that become plans
- `process-inbox.md:80-150` - Calls generate-plan for items

### External Resources
- [SMART Goals](https://en.wikipedia.org/wiki/SMART_criteria) - Success criteria framework
- [Decision Matrix Method](https://asq.org/quality-resources/decision-matrix) - Decision making framework

### Related Constitution Principles
- **Principle II**: Human-in-the-Loop - Determines approval requirements
- **Principle III**: Proactive Autonomous Management - Creates plans proactively
- **Principle IV**: Comprehensive Audit Logging - Logs plan creation
- **Principle V**: File-Based Workflow - Plans are files

---

**Skill Version**: 1.0.0
**Last Updated**: 2026-01-08
**Tier**: Bronze
**Author**: Personal AI Employee System
**Status**: Production Ready
