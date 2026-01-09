# Send Email via SMTP - Silver Tier Skill

## User Input
```text
$ARGUMENTS
```

## Outline

You are sending an email via the SMTP email server after human approval. This is a core Silver Tier capability that implements the Human-in-the-Loop workflow for external communication.

### Execution Flow:

1. **Verify Approval**
   - Check that the action file is in `/Approved` folder
   - Read the approval file frontmatter to verify:
     - `status: approved` (moved by human from Pending_Approval)
     - `action: send_email`
     - Required fields present: recipient, subject, body
   - If not approved, STOP and report error

2. **Gather Email Details**
   From the approved file, extract:
   - `recipient`: Email address(es) - single or comma-separated
   - `subject`: Email subject line
   - `body`: Email content (markdown formatted)
   - `cc`: (optional) CC recipients
   - `bcc`: (optional) BCC recipients
   - `attachments`: (optional) File paths to attach
   - `reply_to`: (optional) Reply-to address
   - `priority`: (optional) high/normal/low

3. **Validate Email Parameters**
   - Recipient email format is valid (regex: `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
   - Subject is not empty (min 1 char)
   - Body is not empty (min 1 char)
   - Attachments exist if specified
   - Total email size < 25MB (Gmail limit)
   - Suspicious content check (no HTML injection)

4. **Check SMTP Email Server**
   - Verify SMTP credentials exist in .env file (EMAIL_USER, EMAIL_PASSWORD)
   - Validate that credentials are properly formatted
   - If not configured, report error and stop

5. **Send Email via SMTP**
   Use SMTP email server to send:
   ```
   Python Command: send_email_smtp.py
   Parameters:
     recipient: <recipient>
     subject: <subject>
     body: <body>
     cc: <cc> (if present)
     bcc: <bcc> (if present)
     attachments: <attachment paths> (if present)
     priority: <priority> (if present)
   ```

6. **Handle Response**
   - **Success**:
     - Update approved file status to `sent`
     - Add `sent_at` and `message_id` to frontmatter
     - Move approved file to `/Done`
     - Create log entry in `/Logs/YYYY-MM-DD.json`
     - Update Dashboard (decrement Pending Approval, increment Completed)
   - **Failure**:
     - Update file status to `failed`
     - Add error details to frontmatter
     - Keep file in `/Approved`
     - Create log entry with error details
     - Report error to user

7. **Audit Logging**
   Create detailed log entry:
   ```json
   {
     "timestamp": "ISO 8601 timestamp",
     "action": "send_email",
     "status": "success|failure",
     "recipient": "<email>",
     "subject": "<subject>",
     "sent_via": "smtp_server",
     "approval_file": "<path>",
     "message_id": "<message_id if successful>",
     "error": "<error message if failed>"
   }
   ```

8. **Update Source Item**
   - If this email was in response to an item in `/Needs_Action`
   - Move source item to `/Done`
   - Add reference to sent email in source item

### Acceptance Criteria:
- Email is sent only after human approval
- All email parameters are validated before sending
- Success/failure is logged in audit trail
- Files are moved to appropriate folders (Done or kept in Approved)
- Dashboard is updated with current status
- SMTP email server is used (credentials from .env)

### Constraints:
- **MUST** follow Constitution Principle II (Human-in-the-Loop)
- **MUST** follow Constitution Principle IV (Comprehensive Audit Logging)
- **MUST** verify approval before sending
- **NEVER** send email without approval file in `/Approved`
- **NEVER** modify email content after approval
- **NEVER** send to recipients not listed in approval
- **MUST** use credentials from .env file (secure storage)

### Security Checks:
Before sending, verify:
- ✅ File is in `/Approved` folder
- ✅ Frontmatter has `status: approved`
- ✅ Recipient is valid email address
- ✅ No suspicious content (SQL injection, XSS attempts in body)
- ✅ Attachment paths are within vault (no system files)
- ✅ Total size within limits
- ✅ SMTP credentials exist in .env file

### Output:
Confirm email send:
- Recipient: <email>
- Subject: <subject>
- Status: <Sent successfully | Failed>
- Sent at: <timestamp>
- Message ID: <message_id>
- Log file: <path to log>
- Approval file moved to: <path>

If failed:
- Error: <detailed error message>
- Action: <what user should do>

---

**Note**: This is a Silver Tier skill that uses SMTP with credentials from .env file. Ensure you have properly configured:
```bash
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

In your `.env` file. For Gmail accounts with 2FA, use App Passwords from:
https://myaccount.google.com/apppasswords

### Example Approved File:

```markdown
---
action: send_email
recipient: client@example.com
subject: Project Status Update - Week 2
status: approved
priority: normal
approved_by: human
approved_at: 2026-01-09T10:30:00Z
---

# Email: Project Status Update

## To
client@example.com

## Subject
Project Status Update - Week 2

## Body
Hi John,

Here's the status update for this week:

**Completed:**
- Feature A deployed to staging
- Bug fixes for issues #123, #456

**In Progress:**
- Feature B (80% complete)
- Performance optimization

**Next Week:**
- Deploy Feature B
- Start Feature C planning

Let me know if you have any questions.

Best regards,
Your AI Employee

---
*This email was approved for sending on 2026-01-09*
```
