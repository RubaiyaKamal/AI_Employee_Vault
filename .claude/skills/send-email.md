# Send Email via SMTP

## Title
**Send Email via SMTP** - Secure Email Sending with Human-in-the-Loop Approval

## Description

This skill sends emails through SMTP using credentials from .env file after verifying human approval. It implements the complete Human-in-the-Loop workflow for external communication, ensuring all outgoing emails are reviewed and explicitly approved before sending.

**Capability Level**: Silver Tier
**Category**: External Communication
**Risk Level**: High (External communication, requires approval)

## Instructions

### Execution Flow

#### 1. Verify Approval Status
```
Input: Path to approval file or scan /Approved folder
Output: Approved email actions ready for sending
```

**Steps**:
- Check that file is in `/Approved` folder (not `/Pending_Approval`)
- Read frontmatter and verify:
  - `status: approved` (explicitly set by human)
  - `action: send_email`
  - `approved_by: human` (not auto-approved)
  - `approved_at` timestamp exists and is recent (<7 days)
- If any verification fails: STOP and report error

**Security Checks**:
```python
# Pseudocode for approval verification
def verify_approval(file_path):
    if '/Approved' not in file_path:
        return False, "File not in Approved folder"

    frontmatter = parse_frontmatter(file_path)

    if frontmatter.get('status') != 'approved':
        return False, "Status is not 'approved'"

    if frontmatter.get('action') != 'send_email':
        return False, "Action type is not 'send_email'"

    if frontmatter.get('approved_by') != 'human':
        return False, "Not approved by human"

    approved_at = parse_datetime(frontmatter.get('approved_at'))
    if (datetime.now() - approved_at).days > 7:
        return False, "Approval expired (>7 days old)"

    return True, "Approval verified"
```

#### 2. Extract Email Parameters

**Required Fields** from frontmatter:
- `recipient`: Email address(es) - single or comma-separated
- `subject`: Email subject line
- `body`: Email content (supports markdown)

**Optional Fields**:
- `cc`: CC recipients (comma-separated)
- `bcc`: BCC recipients (comma-separated)
- `attachments`: File paths to attach (array)
- `reply_to`: Custom Reply-To address
- `priority`: `high` | `normal` | `low`

**Example Frontmatter**:
```yaml
---
action: send_email
status: approved
approved_by: human
approved_at: 2026-01-09T10:30:00Z
recipient: client@example.com
cc: manager@mycompany.com
subject: Project Status Update - Week 2
priority: normal
attachments:
  - /Accounting/Invoice_January_2026.pdf
---
```

#### 3. Validate Email Parameters

**Validation Rules**:

| Field | Validation | Error Message |
|-------|-----------|---------------|
| recipient | Valid email regex | "Invalid recipient email format" |
| subject | Min 1 char, max 200 chars | "Subject cannot be empty" |
| body | Min 1 char | "Email body cannot be empty" |
| attachments | Files exist, total <25MB | "Attachment not found or too large" |
| email format | Not HTML injection | "Suspicious content detected" |

**Validation Code Pattern**:
```python
import re

EMAIL_REGEX = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

def validate_email(email):
    return re.match(EMAIL_REGEX, email.strip()) is not None

def validate_parameters(params):
    errors = []

    # Validate recipient
    recipients = params['recipient'].split(',')
    for recipient in recipients:
        if not validate_email(recipient):
            errors.append(f"Invalid recipient: {recipient}")

    # Validate subject
    if not params['subject'] or len(params['subject']) < 1:
        errors.append("Subject cannot be empty")
    if len(params['subject']) > 200:
        errors.append("Subject too long (max 200 chars)")

    # Validate body
    if not params['body'] or len(params['body']) < 1:
        errors.append("Body cannot be empty")

    # Validate attachments
    if 'attachments' in params:
        total_size = 0
        for attachment in params['attachments']:
            if not os.path.exists(attachment):
                errors.append(f"Attachment not found: {attachment}")
            else:
                total_size += os.path.getsize(attachment)

        if total_size > 25 * 1024 * 1024:  # 25MB
            errors.append("Total attachment size exceeds 25MB")

    # Check for suspicious content
    suspicious_patterns = ['<script', 'javascript:', 'onerror=', 'onclick=']
    for pattern in suspicious_patterns:
        if pattern.lower() in params['body'].lower():
            errors.append(f"Suspicious content detected: {pattern}")

    return errors
```

#### 4. Check SMTP Email Server Connection

**SMTP Server Requirements**:
- Configuration: Valid Gmail credentials in .env file
- Required variables: `EMAIL_USER` and `EMAIL_PASSWORD` (App Password)

**Connection Check**:
```bash
# Verify credentials exist
python -c "import os; print('EMAIL_USER exists:', bool(os.getenv('EMAIL_USER'))); print('EMAIL_PASSWORD exists:', bool(os.getenv('EMAIL_PASSWORD')))"
```

**If SMTP Not Available**:
- Log error: "SMTP email server not configured properly"
- Mark plan as `status: blocked`
- Keep file in `/Approved` for retry
- Report to user: "Email sending blocked - SMTP credentials needed"

#### 5. Send Email via SMTP

**SMTP Call Structure**:
```python
result = send_email_via_smtp(
    recipient="client@example.com",
    cc="manager@mycompany.com",
    subject="Project Status Update - Week 2",
    body="<email content>",
    attachments=["/path/to/file.pdf"],
    priority="normal"
)
```

**Expected SMTP Response**:
```json
{
  "status": "success",
  "message_id": "<unique-message-id@gmail.com>",
  "sent_at": "2026-01-09T10:35:00Z",
  "recipients": {
    "to": ["client@example.com"],
    "cc": ["manager@mycompany.com"]
  }
}
```

#### 6. Handle Send Results

**On Success**:
1. Mark email as `status: sent` in frontmatter
2. Add `sent_at` timestamp
3. Add `message_id` from SMTP response
4. Move file from `/Approved` to `/Done`
5. Update source item (if exists) to `/Done`
6. Create audit log entry
7. Update Dashboard counts

**On Failure**:
1. Mark email as `status: failed`
2. Add `error` field with detailed message
3. Keep file in `/Approved` (for retry)
4. Create error log entry
5. Report to user with troubleshooting steps

**Failure Handling Code**:
```python
def handle_failure(approval_file, error):
    # Update file with error
    frontmatter = parse_frontmatter(approval_file)
    frontmatter['status'] = 'failed'
    frontmatter['error'] = str(error)
    frontmatter['failed_at'] = datetime.now().isoformat()
    update_frontmatter(approval_file, frontmatter)

    # Log error
    log_entry = {
        'timestamp': datetime.now().isoformat(),
        'action': 'send_email',
        'status': 'failed',
        'file': approval_file,
        'error': str(error)
    }
    append_to_log(log_entry)

    # Keep in Approved for retry
    # (Don't move to Done or Rejected)

    return f"Email send failed: {error}"
```

#### 7. Comprehensive Audit Logging

**Log Entry Structure**:
```json
{
  "timestamp": "2026-01-09T10:35:00Z",
  "action": "send_email",
  "status": "success",
  "approval_file": "/Approved/APPROVAL_email_client_update.md",
  "source_item": "/Needs_Action/EMAIL_client_request.md",
  "recipient": {
    "to": "client@example.com",
    "cc": "manager@mycompany.com"
  },
  "subject": "Project Status Update - Week 2",
  "sent_via": "smtp_server",
  "message_id": "<msg-id@gmail.com>",
  "attachments": [
    {"name": "Invoice_January_2026.pdf", "size": 125000}
  ],
  "execution_time_ms": 1234,
  "approved_by": "human",
  "approved_at": "2026-01-09T10:30:00Z"
}
```

**Log File**: `/Logs/YYYY-MM-DD.json`

**Log Retention**: 90 days (per Constitution Principle IV)

#### 8. Update Dashboard

**Dashboard Updates**:
- **Pending Approval**: Decrement by 1
- **Completed Today**: Increment by 1
- **Active Tasks**: Decrement by 1 (if plan completed)
- **Recent Activity**: Add entry `"[2026-01-09 10:35] Sent email to client@example.com: Project Status Update"`

**Dashboard Update Code**:
```python
def update_dashboard_after_send(email_details):
    dashboard = read_file('Dashboard.md')

    # Parse current counts
    counts = parse_dashboard_counts(dashboard)
    counts['pending_approval'] -= 1
    counts['completed_today'] += 1
    counts['active_tasks'] -= 1

    # Add to recent activity
    activity = f"[{datetime.now().strftime('%Y-%m-%d %H:%M')}] " \
               f"Sent email to {email_details['recipient']}: {email_details['subject']}"

    # Update dashboard file
    updated_dashboard = update_dashboard_sections(dashboard, counts, activity)
    write_file('Dashboard.md', updated_dashboard)
```

### Acceptance Criteria

- [ ] Email sent only after human approval verified
- [ ] All email parameters validated before sending
- [ ] SMTP email server used (credentials from .env)
- [ ] Success/failure logged in audit trail
- [ ] Files moved to appropriate folders (Done or kept in Approved)
- [ ] Dashboard updated with accurate counts
- [ ] Source item updated and moved to Done
- [ ] No emails sent without explicit approval

### Constraints

**Constitution Compliance**:
- **Principle II**: Human-in-the-Loop for Sensitive Actions
  - **NEVER** send email without human approval
  - **NEVER** modify email content after approval
  - **NEVER** add recipients not listed in approval
- **Principle IV**: Comprehensive Audit Logging
  - **MUST** log every send attempt (success and failure)
  - **MUST** include all details (recipient, subject, timestamp)
- **Principle VI**: Security and Credential Management
  - **MUST** use SMTP with credentials from .env (securely stored)
  - **NEVER** expose credentials in logs or files

**Operational Constraints**:
- Maximum email size: 25MB (Gmail limit)
- Maximum recipients: 100 (to+cc+bcc combined)
- Subject line: 1-200 characters
- Body: Minimum 1 character
- Approval expiration: 7 days
- Retry attempts: 3 maximum (with exponential backoff)

**Security Constraints**:
- No HTML injection or XSS attempts
- No executable attachments (.exe, .bat, .sh)
- Attachments must be within vault directory
- Email addresses must match regex pattern
- Use App Passwords for Gmail authentication

## Examples

### Example 1: Sending Client Status Update

**Approval File**: `/Approved/APPROVAL_email_client_statusupdate.md`

```markdown
---
action: send_email
status: approved
approved_by: human
approved_at: 2026-01-09T10:30:00Z
source_item: /Needs_Action/EMAIL_client_request_20260108.md
recipient: john.doe@clientcompany.com
cc: manager@mycompany.com
subject: Project Alpha - Status Update Week 2
priority: normal
---

# Email: Project Status Update

## Approval Details
Reviewed and approved by: Human
Approved at: 2026-01-09 10:30 AM
Reason: Routine project update, content verified

## Email Content

### To
john.doe@clientcompany.com

### CC
manager@mycompany.com

### Subject
Project Alpha - Status Update Week 2

### Body

Hi John,

Here's the status update for Project Alpha:

**Completed This Week:**
- Feature A deployed to staging environment
- Bug fixes for issues #123 and #456
- Performance optimization (30% improvement)

**In Progress:**
- Feature B development (80% complete)
- Integration testing for Feature A
- Documentation updates

**Planned for Next Week:**
- Deploy Feature B to staging
- Begin Feature C planning
- Conduct user acceptance testing

**Blockers:**
None at this time.

**Next Meeting:**
Friday, January 12 at 2:00 PM EST

Please let me know if you have any questions or concerns.

Best regards,
AI Employee
(Sent on behalf of Your Company)

---
*This email was approved for sending on 2026-01-09*
```

**Skill Execution**:

1. **Verify Approval**: ✅ File in `/Approved`, status: approved, approved_by: human
2. **Extract Parameters**:
   - To: john.doe@clientcompany.com
   - CC: manager@mycompany.com
   - Subject: "Project Alpha - Status Update Week 2"
   - Body: [Full email content above]

3. **Validate**: ✅ All fields valid, no suspicious content

4. **Check SMTP**: ✅ Credentials available in .env

5. **Send Email**:
   ```python
   result = send_email_via_smtp(
       recipient="john.doe@clientcompany.com",
       cc="manager@mycompany.com",
       subject="Project Alpha - Status Update Week 2",
       body="[Full body content]"
   )
   ```

6. **Result**: ✅ Success
   - Message ID: `<abc123@gmail.com>`
   - Sent at: 2026-01-09T10:35:22Z

7. **Post-Send Actions**:
   - Moved `/Approved/APPROVAL_email_client_statusupdate.md` → `/Done/`
   - Moved `/Needs_Action/EMAIL_client_request_20260108.md` → `/Done/`
   - Created log entry in `/Logs/2026-01-09.json`
   - Updated Dashboard: Pending Approval: 2 → 1, Completed Today: 5 → 6

8. **Output**:
   ```
   ✅ Email sent successfully!

   Recipient: john.doe@clientcompany.com
   CC: manager@mycompany.com
   Subject: Project Alpha - Status Update Week 2
   Sent at: 2026-01-09 10:35:22
   Message ID: <abc123@gmail.com>

   File moved to: /Done/APPROVAL_email_client_statusupdate.md
   Source item moved to: /Done/EMAIL_client_request_20260108.md
   Log entry created: /Logs/2026-01-09.json
   Dashboard updated: Pending Approval: 1, Completed Today: 6
   ```

---

### Example 2: Sending Invoice Email with Attachment

**Approval File**: `/Approved/APPROVAL_email_invoice_client_a.md`

```markdown
---
action: send_email
status: approved
approved_by: human
approved_at: 2026-01-09T11:00:00Z
source_item: /Needs_Action/EMAIL_client_a_invoice_request.md
recipient: clienta@example.com
subject: Invoice - January 2026 Consulting Services
priority: normal
attachments:
  - /Accounting/Invoices/Invoice_ClientA_Jan2026.pdf
---

# Email: January Invoice for Client A

## To
clienta@example.com

## Subject
Invoice - January 2026 Consulting Services

## Body

Dear Client A,

Please find attached the invoice for January 2026 consulting services.

**Invoice Details:**
- Invoice #: INV-2026-001
- Date: January 9, 2026
- Amount: $1,500.00
- Due Date: January 23, 2026 (Net 15)

**Services Provided:**
- January consulting retainer (40 hours)
- Project planning and strategy sessions

Payment can be made via bank transfer or check. Details are included in the attached invoice.

Thank you for your continued partnership.

Best regards,
Your Company

---
*Attachment: Invoice_ClientA_Jan2026.pdf (125 KB)*
```

**Skill Execution**:

1. **Verify Approval**: ✅ Approved by human

2. **Validate Attachment**:
   - Check file exists: `/Accounting/Invoices/Invoice_ClientA_Jan2026.pdf`
   - ✅ File exists
   - ✅ Size: 125 KB (within 25MB limit)
   - ✅ Path is within vault

3. **Send with Attachment**:
   ```python
   result = send_email_via_smtp(
       recipient="clienta@example.com",
       subject="Invoice - January 2026 Consulting Services",
       body="[Full body]",
       attachments=["/Accounting/Invoices/Invoice_ClientA_Jan2026.pdf"]
   )
   ```

4. **Result**: ✅ Success with attachment

5. **Log Entry**:
   ```json
   {
     "timestamp": "2026-01-09T11:05:00Z",
     "action": "send_email",
     "status": "success",
     "recipient": {
       "to": "clienta@example.com"
     },
     "subject": "Invoice - January 2026 Consulting Services",
     "attachments": [
       {
         "name": "Invoice_ClientA_Jan2026.pdf",
         "size": 128000,
         "type": "application/pdf"
       }
     ],
     "message_id": "<def456@gmail.com>"
   }
   ```

---

### Example 3: Failed Send - SMTP Credentials Missing

**Scenario**: SMTP credentials are not properly configured in .env

**Approval File**: `/Approved/APPROVAL_email_urgent_client.md`

**Skill Execution**:

1. **Verify Approval**: ✅ Approved
2. **Extract Parameters**: ✅ Valid
3. **Validate Parameters**: ✅ All valid
4. **Check SMTP Credentials**: ❌ Not available

**Error Detection**:
```
SMTP Credential Check: FAILED
Error: Email credentials not found in .env file
Variable EMAIL_USER: Not set
Variable EMAIL_PASSWORD: Not set
```

**Actions Taken**:
1. Mark plan as `status: blocked`
2. Add error to frontmatter:
   ```yaml
   status: blocked
   error: "SMTP email server not configured properly - credentials missing"
   blocked_at: 2026-01-09T11:10:00Z
   ```
3. Keep file in `/Approved` (don't move to Done)
4. Create error log entry
5. Report to user

**Output**:
```
❌ Email sending blocked!

Error: SMTP email server not configured properly - credentials missing
File: /Approved/APPROVAL_email_urgent_client.md
Status: Blocked (kept in Approved for retry)

Troubleshooting Steps:
1. Verify EMAIL_USER and EMAIL_PASSWORD are set in .env file
2. For Gmail, use App Passwords (not regular password)
3. Visit: https://myaccount.google.com/apppasswords
4. Generate app password for "Mail" and your device
5. Update .env file with:
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=generated-app-password
6. Restart Claude Code after updating
7. Retry this skill: claude /silver.send-email

The approval file will remain in /Approved until successfully sent.
```

---

### Example 4: Failed Send - Invalid Email Address

**Approval File**: Contains invalid recipient email

```yaml
recipient: invalid-email-format
subject: Test Email
```

**Skill Execution**:

1. **Verify Approval**: ✅ Approved
2. **Extract Parameters**: ✅ Extracted
3. **Validate Parameters**: ❌ Invalid email format

**Validation Error**:
```
Validation Failed:
- Invalid recipient email format: "invalid-email-format"
```

**Actions Taken**:
1. DO NOT send email
2. Mark as `status: validation_failed`
3. Add validation errors to frontmatter
4. Keep in `/Approved` for correction
5. Log validation failure

**Output**:
```
❌ Email validation failed!

Validation Errors:
- Invalid recipient email format: "invalid-email-format"

File: /Approved/APPROVAL_email_test.md
Status: Validation failed (kept in Approved)

Action Required:
1. Review the approval file
2. Correct the recipient email address
3. Ensure it matches format: user@domain.com
4. Save the file
5. Retry: claude /silver.send-email

Email was NOT sent due to validation errors.
```

## References

### Related Skills
- `/bronze.process-inbox.md` - Creates email send requests
- `/bronze.generate-plan.md` - Generates email plans requiring approval
- `/silver.execute-approved.md` - Orchestrates execution including email sending
- `/silver.review-approvals.md` - Helps review and approve email drafts

### Documentation
- `Company_Handbook.md` - Email communication policies
- `.specify/memory/constitution.md` - Principle II (HITL) and IV (Audit Logging)
- `EMAIL_MCP_SETUP_GUIDE.md` - Email SMTP configuration
- `README.md:128-135` - Approval requirements for emails

### SMTP Server
- **Configuration**: `.env` file with `EMAIL_USER` and `EMAIL_PASSWORD`
- **Service**: Gmail SMTP (smtp.gmail.com:587)
- **Authentication**: App Passwords (for Gmail accounts with 2FA)

### Code References
- `send_email_smtp.py` - SMTP email sending implementation
- `watcher_manager.py:15-40` - Creates email action items
- `gmail_watcher.py:80-150` - Gmail monitoring creates email responses

### External Resources
- [Gmail SMTP Settings](https://support.google.com/mail/answer/7126229)
- [Email RFC 5322](https://tools.ietf.org/html/rfc5322) - Email format standard
- [SMTP Best Practices](https://www.rfc-editor.org/rfc/rfc5321)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)

### Related Constitution Principles
- **Principle II**: Human-in-the-Loop for Sensitive Actions (NON-NEGOTIABLE)
- **Principle IV**: Comprehensive Audit Logging (all sends logged)
- **Principle VI**: Security and Credential Management (SMTP-based auth)
- **Principle VII**: Graceful Degradation (handles SMTP unavailability)

### Templates
- `sample_approval_request.md:99-117` - Email approval template
- `.specify/templates/plan-template.md` - Plan generation with email steps

### Security Considerations
- **XSS Prevention**: Body content sanitized for HTML injection
- **Attachment Safety**: No executable files, size limits enforced
- **Recipient Validation**: Email regex pattern matching
- **Approval Expiry**: 7-day expiration prevents stale approvals
- **Audit Trail**: Complete logging for compliance and debugging
- **Credential Security**: App Passwords for Gmail authentication

---

**Skill Version**: 1.0.0
**Last Updated**: 2026-01-09
**Tier**: Silver
**Author**: Personal AI Employee System
**Status**: Production Ready
**Requires**: MCP Email Server (`@modelcontextprotocol/server-email`)
