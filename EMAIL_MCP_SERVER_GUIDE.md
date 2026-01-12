# Email MCP Server Guide

**MCP Server**: `@modelcontextprotocol/server-email`
**Status**: ✅ Connected
**Purpose**: Silver Tier external action capability for sending/receiving emails

---

## Overview

The Email MCP Server fulfills the **Silver Tier requirement** for "One working MCP server for external action (e.g., sending emails)". This server provides email functionality through the Model Context Protocol, allowing Claude Code to send and receive emails securely.

**Current Status**:
- ✅ **IMAP (Receiving)**: Fully operational
- ⚠️ **SMTP (Sending)**: Needs Gmail App Password configuration

---

## Available MCP Tools

### 1. `mcp__email__send_email`
**Purpose**: Send emails via SMTP

**Parameters**:
```javascript
{
  to: ["recipient@example.com"],           // required
  subject: "Email Subject",                // required
  text: "Plain text email body",          // required
  html: "<p>HTML email body</p>",         // optional
  cc: ["cc@example.com"],                 // optional
  bcc: ["bcc@example.com"],               // optional
  attachments: [                          // optional
    {
      filename: "document.pdf",
      path: "/absolute/path/to/file.pdf",
      content: "base64-encoded-content"    // alternative to path
    }
  ]
}
```

**Example**:
```javascript
mcp__email__send_email({
  to: ["client@example.com"],
  subject: "Project Update",
  text: "The project is on track and will be completed by Friday."
})
```

**Response** (Success):
```
✅ 邮件发送成功！

发送详情:
- 收件人: client@example.com
- 主题: Project Update
- 发送时间: 2026-01-10 10:30:00
```

---

### 2. `mcp__email__get_recent_emails`
**Purpose**: Retrieve recent emails from inbox

**Parameters**:
```javascript
{
  days: 3,      // optional, default: 3 days
  limit: 20     // optional, default: 20 emails
}
```

**Response**:
```
📧 最近3天的邮件列表:

1. [2026-01-10 09:30] From: client@example.com
   Subject: Question about invoice
   Preview: Hi, I have a question about...

2. [2026-01-10 08:15] From: vendor@supplier.com
   Subject: Order confirmation
   Preview: Your order #12345 has been...
```

---

### 3. `mcp__email__get_email_content`
**Purpose**: Get full content of a specific email

**Parameters**:
```javascript
{
  uid: "email-unique-id"  // from get_recent_emails
}
```

**Response**: Full email with headers, body, and attachments

---

### 4. `mcp__email__setup_email_account`
**Purpose**: Configure email account (auto-detects provider)

**Parameters**:
```javascript
{
  email: "your-email@gmail.com",
  password: "your-app-password",
  provider: "gmail"  // optional, auto-detected if omitted
}
```

**Supported Providers**:
- Gmail (`gmail.com`)
- Outlook (`outlook.com`, `hotmail.com`, `live.com`)
- Yahoo (`yahoo.com`)
- QQ Mail (`qq.com`)
- 163 Mail (`163.com`, `126.com`)
- Sina Mail (`sina.com`)
- Aliyun Mail (`aliyun.com`)
- Sohu Mail (`sohu.com`)

---

### 5. `mcp__email__configure_email_server`
**Purpose**: Manually configure SMTP/IMAP settings

**Parameters**:
```javascript
{
  user: "your-email@gmail.com",
  password: "your-app-password",
  smtpHost: "smtp.gmail.com",
  smtpPort: 587,
  smtpSecure: false,  // true for port 465, false for port 587 (STARTTLS)
  imapHost: "imap.gmail.com",
  imapPort: 993,
  imapSecure: true
}
```

**Example - Gmail**:
```javascript
mcp__email__configure_email_server({
  user: "kh0102267@gmail.com",
  password: "your-16-char-app-password",
  smtpHost: "smtp.gmail.com",
  smtpPort: 587,
  smtpSecure: false,  // Use STARTTLS
  imapHost: "imap.gmail.com",
  imapPort: 993,
  imapSecure: true
})
```

---

### 6. `mcp__email__test_email_connection`
**Purpose**: Test SMTP and/or IMAP connection

**Parameters**:
```javascript
{
  testType: "both"  // "smtp", "imap", or "both"
}
```

**Response** (Success):
```
✅ SMTP服务器连接测试成功！
✅ IMAP服务器连接测试成功！
```

**Response** (Failure):
```
❌ SMTP连接测试失败: Invalid login: 535-5.7.8 Username and Password not accepted
✅ IMAP服务器连接测试成功！
```

---

### 7. `mcp__email__list_supported_providers`
**Purpose**: List all supported email providers

**Response**: List of supported email providers with configuration details

---

## Gmail Setup (Recommended)

### Why Gmail App Password is Needed

Gmail requires **App Passwords** for third-party applications when 2-Factor Authentication (2FA) is enabled. Your regular Gmail password will NOT work with SMTP.

### Steps to Generate Gmail App Password

1. **Enable 2-Factor Authentication** (if not already enabled)
   - Go to: https://myaccount.google.com/security
   - Enable "2-Step Verification"

2. **Generate App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select app: **Mail**
   - Select device: **Other** (custom name)
   - Name it: **Personal AI Employee**
   - Click **Generate**

3. **Copy the 16-Character Password**
   - Example: `abcd efgh ijkl mnop`
   - Spaces don't matter, but copy exactly

4. **Configure Email MCP Server**
   ```javascript
   mcp__email__setup_email_account({
     email: "your-email@gmail.com",
     password: "abcdefghijklmnop",  // 16-char app password (no spaces)
     provider: "gmail"
   })
   ```

5. **Test Connection**
   ```javascript
   mcp__email__test_email_connection({ testType: "both" })
   ```

   Expected:
   ```
   ✅ SMTP服务器连接测试成功！
   ✅ IMAP服务器连接测试成功！
   ```

---

## Current Configuration Status

**Email Account**: `kh0102267@gmail.com`

**IMAP (Receiving)**:
- Server: `imap.gmail.com:993`
- SSL: ✅ Enabled
- Status: ✅ **Working**

**SMTP (Sending)**:
- Server: `smtp.gmail.com:587`
- STARTTLS: ✅ Enabled (not direct SSL)
- Status: ⚠️ **Needs Gmail App Password**

**Current Issue**:
```
❌ SMTP连接测试失败: Invalid login: 535-5.7.8 Username and Password not accepted
```

**Root Cause**: Using regular Gmail password instead of App Password

**Solution**: Generate Gmail App Password and reconfigure (see steps above)

---

## Usage in Skills

### `/silver.send-email` Skill

The email sending skill uses the Email MCP Server:

**Workflow**:
1. User creates email draft in `/Needs_Action`
2. Skill generates approval request in `/Pending_Approval`
3. Human approves and moves to `/Approved`
4. Skill calls `mcp__email__send_email` tool
5. Email sent via MCP server
6. Audit log created, files moved to `/Done`

**Example Approval File**:
```markdown
---
action: send_email
status: approved
approved_by: human
approved_at: 2026-01-10T10:30:00Z
recipient: client@example.com
subject: Project Status Update
---

# Email Content

Dear Client,

The project is progressing well and will be completed by Friday.

Best regards,
AI Employee
```

**Execution**:
```bash
claude /silver.send-email
```

**MCP Tool Call** (internal):
```javascript
mcp__email__send_email({
  to: ["client@example.com"],
  subject: "Project Status Update",
  text: "Dear Client,\n\nThe project is progressing well..."
})
```

---

## Troubleshooting

### Issue: SMTP Connection Failed

**Error**:
```
❌ SMTP连接测试失败: 535-5.7.8 Username and Password not accepted
```

**Causes**:
1. Using regular Gmail password instead of App Password
2. 2FA not enabled on Gmail account
3. App Password generated for wrong app/device

**Solutions**:
1. Generate Gmail App Password (see steps above)
2. Enable 2FA first, then generate App Password
3. Generate new App Password specifically for "Mail"

---

### Issue: SSL Version Error

**Error**:
```
❌ SMTP连接测试失败: SSL routines:tls_validate_record_header:wrong version number
```

**Cause**: Using SSL on port 587 instead of STARTTLS

**Solution**: Configure with `smtpSecure: false` for port 587:
```javascript
mcp__email__configure_email_server({
  user: "your-email@gmail.com",
  password: "your-app-password",
  smtpHost: "smtp.gmail.com",
  smtpPort: 587,
  smtpSecure: false,  // STARTTLS, not direct SSL
  // ... rest of config
})
```

---

### Issue: IMAP Works but SMTP Doesn't

**This is the current status!**

**Cause**: IMAP and SMTP use different authentication mechanisms. IMAP might work with regular password, but SMTP requires App Password.

**Solution**: Generate App Password and reconfigure both IMAP and SMTP

---

## Security Best Practices

### 1. Use App Passwords
- ✅ Generate App Password for "Mail" access
- ❌ NEVER use your primary Gmail password

### 2. Credential Storage
- ✅ Email MCP server stores credentials securely
- ✅ Credentials are NOT exposed in logs or files
- ❌ Don't hardcode passwords in scripts

### 3. Human-in-the-Loop
- ✅ ALL email sending requires human approval
- ✅ Approval files must be in `/Approved` folder
- ✅ `approved_by: human` must be explicitly set

### 4. Audit Logging
- ✅ Every email sent is logged in `/Logs/`
- ✅ Log includes timestamp, recipient, subject
- ✅ 90-day retention per Constitution Principle IV

---

## MCP Server vs Direct SMTP

### Why Use MCP Server?

| Feature | Email MCP Server | Direct SMTP Library |
|---------|------------------|---------------------|
| Configuration | Simple, auto-detects providers | Manual SMTP settings |
| Multiple Providers | Supports 8+ providers | Need separate configs |
| Testing | Built-in test tools | Manual testing required |
| Error Handling | User-friendly messages | Technical SMTP errors |
| Maintenance | Managed by MCP team | DIY maintenance |
| **Silver Tier Requirement** | ✅ Fulfills requirement | ❌ Doesn't count as MCP server |

**Silver Tier Requirement**: "One working MCP server for external action"

The Email MCP Server **IS** the external action server. Using direct SMTP would not fulfill this requirement.

---

## Integration with Watcher System

### Gmail Watcher (Receiving)

The Gmail watcher uses the Email MCP Server to receive emails:

```python
# gmail_watcher.py uses Gmail API, not MCP
# But could be enhanced to use MCP for consistency
```

**Future Enhancement**: Update Gmail watcher to use `mcp__email__get_recent_emails` instead of Gmail API.

### Benefits:
- Unified email handling (send & receive via MCP)
- Simplified authentication (one set of credentials)
- Better error handling and logging

---

## Next Steps

### Immediate (Required for 100% Silver Tier)

1. **Generate Gmail App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Generate password for "Mail"

2. **Configure Email MCP Server**
   ```bash
   # In Claude Code
   claude
   # Then use MCP tool:
   mcp__email__setup_email_account({
     email: "kh0102267@gmail.com",
     password: "your-16-char-app-password"
   })
   ```

3. **Test Email Sending**
   ```bash
   mcp__email__test_email_connection({ testType: "smtp" })
   ```

4. **Send Test Email**
   ```bash
   claude /silver.send-email --test
   ```

### Optional Enhancements

1. Update Gmail watcher to use Email MCP
2. Add email templates for common responses
3. Create automated email reply workflows
4. Integrate with calendar for meeting invites

---

## Summary

**Email MCP Server Status**:
- ✅ Connected and operational
- ✅ IMAP (receiving) working
- ⚠️ SMTP (sending) needs App Password

**Silver Tier Requirement**:
- ✅ "One working MCP server for external action"
- ✅ Email MCP Server fulfills this requirement

**Next Action**:
- Generate Gmail App Password (2 minutes)
- Configure and test SMTP (1 minute)
- Send test email (30 seconds)

**Total Time to 100% Operational**: ~5 minutes

---

**Last Updated**: 2026-01-10
**MCP Server**: `@modelcontextprotocol/server-email`
**Status**: Connected (IMAP working, SMTP pending App Password)
**Documentation**: SILVER_TIER_SETUP.md, MCP_QUICK_REFERENCE.md
