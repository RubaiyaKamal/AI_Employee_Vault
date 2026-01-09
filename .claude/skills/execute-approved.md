# Execute Approved Actions

## Title
**Execute Approved Actions** - Autonomous Execution of Human-Approved Plans

## Description

This skill orchestrates the execution of all approved action plans in the `/Approved` folder. It acts as the central execution engine for the AI Employee, routing different action types to specialized handlers while maintaining comprehensive audit logs and status updates.

**Capability Level**: Silver Tier
**Category**: Core Operations & Orchestration
**Risk Level**: High (Executes external actions after approval)

## Instructions

### Execution Flow

#### 1. Scan Approved Folder
```
Input: Optional specific file path or scan all /Approved
Output: Queue of approved actions sorted by priority
```

**Steps**:
- List all `.md` files in `/Approved` folder
- Read frontmatter for each file
- Filter for `status: approved` (ignore `failed`, `blocked`, `pending`)
- Sort by:
  1. Priority (`high` before `normal`)
  2. Approved timestamp (oldest first - FIFO)
- Build execution queue

**Queue Structure**:
```python
approved_queue = [
    {
        'path': '/Approved/APPROVAL_email_urgent.md',
        'action': 'send_email',
        'priority': 'high',
        'approved_at': '2026-01-09T09:00:00Z',
        'source_item': '/Needs_Action/EMAIL_client_urgent.md'
    },
    # ... more items
]
```

#### 2. Route to Action Handlers

**Supported Action Types**:

| Action Type | Handler | Description | MCP Required |
|------------|---------|-------------|--------------|
| `send_email` | `/silver.send-email` | Send email via MCP email server | Yes (email) |
| `categorize_transaction` | Built-in | Categorize bank transactions | No |
| `reply_whatsapp` | Future (Gold Tier) | Reply to WhatsApp message | Yes (whatsapp) |
| `create_task` | Built-in | Create new task/reminder | No |
| `research_web` | Built-in | Web research via Playwright MCP | Yes (playwright) |
| `update_accounting` | Built-in | Update financial records | No |
| `file_processing` | Built-in | Process uploaded files | No |

**Routing Logic**:
```python
def route_action(action_type, approval_file):
    handlers = {
        'send_email': execute_send_email,
        'categorize_transaction': execute_categorize,
        'create_task': execute_create_task,
        'research_web': execute_research,
        'update_accounting': execute_accounting,
        'file_processing': execute_file_processing
    }

    handler = handlers.get(action_type)
    if not handler:
        return {
            'status': 'error',
            'message': f'Unknown action type: {action_type}'
        }

    return handler(approval_file)
```

#### 3. Execute Each Action

**For Each Item in Queue**:

1. **Pre-Execution Checks**:
   - Verify file still in `/Approved` (not moved/deleted)
   - Verify `status: approved` still set
   - Check required MCP servers available (if needed)
   - Validate all required parameters present

2. **Execute Action**:
   - Call appropriate handler function
   - Pass approval file path and parameters
   - Monitor execution progress
   - Handle timeouts (max 5 minutes per action)

3. **Process Result**:
   - **Success**: Mark steps complete, move to /Done
   - **Failure**: Log error, keep in /Approved for retry
   - **Blocked**: Mark as blocked, report missing dependency

4. **Update Files**:
   - Update approval file with execution results
   - Move source item if applicable
   - Update related files

#### 4. Built-in Action Handlers

**Handler: Categorize Transaction**
```python
def execute_categorize(approval_file):
    """
    Categorizes bank transactions based on merchant and amount.
    No MCP required - pure data processing.
    """
    # Read approval file
    frontmatter = parse_frontmatter(approval_file)
    source_item = frontmatter['source_item']

    # Read transaction details
    transaction = parse_frontmatter(source_item)
    merchant = transaction['merchant']
    amount = transaction['amount']

    # Apply categorization rules from Company_Handbook
    category = determine_category(merchant, amount)

    # Update transaction file
    transaction['category'] = category
    transaction['categorized_at'] = datetime.now().isoformat()
    update_frontmatter(source_item, transaction)

    # Log to accounting
    log_to_accounting(transaction)

    # Move files
    move_file(approval_file, '/Done')
    move_file(source_item, '/Done')

    return {
        'status': 'success',
        'category': category,
        'merchant': merchant
    }
```

**Handler: Create Task**
```python
def execute_create_task(approval_file):
    """
    Creates a new task or reminder in the vault.
    """
    frontmatter = parse_frontmatter(approval_file)

    task = {
        'title': frontmatter['task_title'],
        'description': frontmatter['task_description'],
        'due_date': frontmatter.get('due_date'),
        'priority': frontmatter.get('priority', 'normal'),
        'created_at': datetime.now().isoformat(),
        'status': 'pending'
    }

    # Create task file in /Needs_Action or /Plans
    task_file = create_task_file(task)

    return {
        'status': 'success',
        'task_file': task_file
    }
```

**Handler: Research Web**
```python
def execute_research(approval_file):
    """
    Conducts web research using Playwright MCP.
    Requires: MCP Playwright server
    """
    frontmatter = parse_frontmatter(approval_file)
    query = frontmatter['research_query']
    urls = frontmatter.get('urls', [])

    # Check Playwright MCP
    if not check_mcp_available('playwright'):
        return {
            'status': 'blocked',
            'error': 'Playwright MCP not available'
        }

    # Execute web research
    results = []
    for url in urls:
        content = fetch_url_via_playwright(url)
        summary = summarize_content(content, query)
        results.append({
            'url': url,
            'summary': summary
        })

    # Create research report
    report_file = create_research_report(query, results)

    return {
        'status': 'success',
        'report': report_file,
        'sources': len(urls)
    }
```

#### 5. Comprehensive Logging

**Log Entry for Each Execution**:
```json
{
  "timestamp": "2026-01-09T10:35:00Z",
  "action_type": "send_email",
  "status": "success",
  "approval_file": "/Approved/APPROVAL_email_client.md",
  "source_item": "/Needs_Action/EMAIL_request.md",
  "execution_time_ms": 2340,
  "result": {
    "message_id": "<abc@gmail.com>",
    "recipient": "client@example.com"
  },
  "files_moved": [
    {
      "from": "/Approved/APPROVAL_email_client.md",
      "to": "/Done/APPROVAL_email_client.md"
    },
    {
      "from": "/Needs_Action/EMAIL_request.md",
      "to": "/Done/EMAIL_request.md"
    }
  ],
  "mcp_calls": [
    {
      "server": "email",
      "function": "send_email",
      "status": "success",
      "duration_ms": 1200
    }
  ]
}
```

#### 6. Update Dashboard

After each execution:
```python
def update_dashboard(execution_result):
    dashboard = read_file('Dashboard.md')

    if execution_result['status'] == 'success':
        increment_counter(dashboard, 'completed_today')
        decrement_counter(dashboard, 'active_tasks')
        decrement_counter(dashboard, 'pending_approval')

        activity = f"[{now()}] Executed {execution_result['action_type']}"
        add_recent_activity(dashboard, activity)

    write_file('Dashboard.md', dashboard)
```

#### 7. Error Handling & Retry Logic

**Error Categories**:

1. **Validation Errors**: Invalid parameters → Keep in /Approved for correction
2. **MCP Unavailable**: Server not connected → Mark as `blocked`
3. **Network Errors**: Timeout or connection failed → Retry with backoff
4. **Permission Errors**: Insufficient access → Log and notify user

**Retry Strategy**:
```python
MAX_RETRIES = 3
RETRY_DELAYS = [5, 15, 60]  # seconds

def execute_with_retry(action, approval_file):
    for attempt in range(MAX_RETRIES):
        try:
            result = action(approval_file)
            if result['status'] == 'success':
                return result

        except NetworkError as e:
            if attempt < MAX_RETRIES - 1:
                sleep(RETRY_DELAYS[attempt])
                continue
            else:
                return {
                    'status': 'failed',
                    'error': f'Max retries exceeded: {e}'
                }

        except ValidationError as e:
            return {
                'status': 'validation_failed',
                'error': str(e)
            }

    return {'status': 'failed', 'error': 'Unknown error'}
```

### Acceptance Criteria

- [ ] Only files in `/Approved` with `status: approved` are executed
- [ ] Actions routed to correct handlers based on `action` type
- [ ] All executions logged with detailed audit trail
- [ ] Failed actions kept in /Approved for retry
- [ ] Successful actions moved to /Done
- [ ] Dashboard updated with current counts
- [ ] MCP unavailability handled gracefully (marked as blocked)
- [ ] Execution summary report generated

### Constraints

**Constitution Compliance**:
- **Principle II**: Human-in-the-Loop - Only execute approved items
- **Principle IV**: Comprehensive Audit Logging - Log everything
- **Principle V**: File-Based Workflow - All state in files
- **Principle VII**: Graceful Degradation - Handle MCP unavailability

**Operational Constraints**:
- Maximum execution time per action: 5 minutes
- Maximum retry attempts: 3
- Maximum concurrent executions: 1 (sequential processing)
- Approval expiration: 7 days

## Examples

### Example 1: Executing Multiple Approved Actions

**Input**: `/Approved` folder contains 3 approved items

**Folder Contents**:
```
/Approved/
  ├── APPROVAL_email_client_urgent.md (priority: high, action: send_email)
  ├── APPROVAL_categorize_bank_1767.md (priority: normal, action: categorize_transaction)
  └── APPROVAL_research_competitor.md (priority: normal, action: research_web)
```

**Execution**:
```
Scanning /Approved folder...
Found 3 approved items

Building execution queue:
  1. APPROVAL_email_client_urgent.md (priority: high)
  2. APPROVAL_categorize_bank_1767.md (priority: normal)
  3. APPROVAL_research_competitor.md (priority: normal)

---

Executing 1/3: APPROVAL_email_client_urgent.md
Action: send_email
Handler: /silver.send-email
Status: ✅ Success
  - Email sent to urgent@client.com
  - Message ID: <abc123@gmail.com>
  - Files moved to /Done
  - Execution time: 2.3s

Executing 2/3: APPROVAL_categorize_bank_1767.md
Action: categorize_transaction
Handler: Built-in categorize
Status: ✅ Success
  - Transaction categorized as "Subscription - Entertainment"
  - Logged to /Accounting/Current_Month.md
  - Files moved to /Done
  - Execution time: 0.5s

Executing 3/3: APPROVAL_research_competitor.md
Action: research_web
Handler: Built-in research
Status: ❌ Blocked
  - Error: Playwright MCP not available
  - File kept in /Approved for retry
  - Status marked as 'blocked'

---

Execution Summary:
✅ Successful: 2
❌ Failed: 0
🚫 Blocked: 1

Dashboard Updated:
- Pending Approval: 3 → 1
- Completed Today: 5 → 7
- Active Tasks: 8 → 6

Log File: /Logs/2026-01-09.json
```

---

### Example 2: Handling Failed Execution

**Scenario**: Email send fails due to network error

**Execution**:
```
Executing: APPROVAL_email_proposal.md
Action: send_email
Attempt 1/3: ❌ Network timeout
Retrying in 5 seconds...

Attempt 2/3: ❌ Network timeout
Retrying in 15 seconds...

Attempt 3/3: ❌ Network timeout
Max retries exceeded

Result: FAILED

Actions Taken:
- Updated approval file with error details
- Kept file in /Approved for manual retry
- Created error log entry
- Notified user

Error Log Entry:
{
  "timestamp": "2026-01-09T11:15:00Z",
  "action": "send_email",
  "status": "failed",
  "file": "/Approved/APPROVAL_email_proposal.md",
  "error": "Network timeout after 3 attempts",
  "retry_attempts": 3
}

User Action Required:
1. Check network connectivity
2. Verify MCP email server status
3. Retry manually: claude /silver.send-email
```

## References

### Related Skills
- `/silver.send-email.md` - Email sending handler
- `/bronze.update-dashboard.md` - Dashboard updates
- `/bronze.process-inbox.md` - Creates items that become approved actions
- `/bronze.generate-plan.md` - Creates plans that require approval

### Documentation
- `.specify/memory/constitution.md` - Principles II, IV, V, VII
- `Company_Handbook.md` - Decision matrix and categorization rules
- `MCP_SETUP_GUIDE.md` - MCP server configuration

### Code References
- `watcher_manager.py:50-100` - Creates action items
- `sample_approval_request.md` - Approval file template

### Related Constitution Principles
- **Principle II**: Human-in-the-Loop for Sensitive Actions
- **Principle III**: Proactive Autonomous Management
- **Principle IV**: Comprehensive Audit Logging
- **Principle V**: File-Based Workflow and Status Flow
- **Principle VII**: Graceful Degradation and Error Recovery

---

**Skill Version**: 1.0.0
**Last Updated**: 2026-01-09
**Tier**: Silver
**Author**: Personal AI Employee System
**Status**: Production Ready
**Requires**: Varies by action type (some require MCP servers)
