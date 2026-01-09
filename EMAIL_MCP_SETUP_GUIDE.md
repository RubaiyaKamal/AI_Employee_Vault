# Email MCP Server Setup Guide

**Generated**: 2026-01-09
**Package**: `mcp-email` v1.0.0
**Status**: Installed ✅ (Configuration Required)

---

## Overview

The Email MCP Server has been installed and added to Claude Code's MCP configuration. To complete the setup, you need to configure it with your email credentials.

**What's Installed**:
- ✅ Package: `mcp-email` (npm global)
- ✅ MCP Configuration: Added to `~/.claude.json`
- ⏳ Email Credentials: **NEEDS CONFIGURATION**

---

## Supported Email Providers

The `mcp-email` server supports 8+ email providers with automatic configuration:

**Personal Email**:
- Gmail
- Outlook
- QQ Mail
- 163 Mail
- Sina Mail
- Sohu Mail

**Enterprise Email**:
- Tencent ExMail
- Netease Enterprise
- Alibaba Cloud Mail

**Note**: Gmail OAuth2.0 is not supported due to Google policy. Use App Password instead.

---

## Configuration Steps

### Step 1: Enable IMAP/SMTP in Your Email Provider

#### Gmail:
1. Go to Gmail Settings → "See all settings"
2. Click "Forwarding and POP/IMAP" tab
3. Enable "IMAP access"
4. Save changes

#### Outlook:
1. Go to Outlook Settings → Mail → Sync Email
2. Enable "POP and IMAP"
3. Save

#### Other Providers:
- Most providers enable IMAP/SMTP by default
- Check provider's settings if connection fails

---

### Step 2: Generate Authorization Code (App Password)

**IMPORTANT**: Use an authorization code, NOT your email password.

#### Gmail App Password:
1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification (if not already enabled)
3. Go to "App passwords"
4. Select app: "Mail"
5. Select device: "Other" (enter "Claude AI Employee")
6. Click "Generate"
7. Copy the 16-character code (no spaces)

#### Outlook App Password:
1. Go to https://account.microsoft.com/security
2. Click "Advanced security options"
3. Under "App passwords", click "Create a new app password"
4. Copy the generated password

#### QQ Mail / 163 Mail:
1. Log in to mail settings
2. Find "Account" or "POP3/IMAP/SMTP" section
3. Enable IMAP/SMTP service
4. Generate authorization code
5. Copy the code

---

### Step 3: Update MCP Configuration

Open your MCP configuration file:
```bash
# Windows
notepad C:\Users\Lap Zone\.claude.json

# macOS/Linux
nano ~/.claude.json
```

Find the `email` server entry and add environment variables:

```json
{
  "mcpServers": {
    "email": {
      "command": "npx",
      "args": ["mcp-email"],
      "env": {
        "EMAIL_USER": "kh0102267@gmail.com",
        "EMAIL_PASSWORD": "xddarqqmjkslhkhw",
        "EMAIL_TYPE": "auto"
      }
    }
  }
}
```

**Configuration Parameters**:
- `EMAIL_USER`: Your full email address
- `EMAIL_PASSWORD`: App password (NOT your login password)
- `EMAIL_TYPE`:
  - `"auto"` - Automatic detection (recommended for personal emails)
  - `"exmail"` - Tencent ExMail (enterprise)
  - `"netease"` - Netease Enterprise
  - `"aliyun"` - Alibaba Cloud Mail

---

### Step 4: Verify Connection

After configuration, restart Claude Code and verify:

```bash
claude mcp list
```

**Expected Output**:
```
Checking MCP server health...

email: npx mcp-email - ✓ Connected
```

If failed:
- Check EMAIL_USER and EMAIL_PASSWORD are correct
- Verify IMAP/SMTP is enabled in email provider
- Try regenerating app password
- Check firewall/network settings (ports 587, 465, 993)

---

### Step 5: Test Email Sending

Create a test approval file to verify email sending:

**File**: `/Pending_Approval/APPROVAL_test_email.md`

```markdown
---
action: send_email
status: approved
approved_by: human
approved_at: 2026-01-09T12:00:00Z
recipient: your-test-email@example.com
subject: Test Email from AI Employee
priority: normal
---

# Email: Test Email

## To
your-test-email@example.com

## Subject
Test Email from AI Employee

## Body

Hi,

This is a test email from your Personal AI Employee system to verify the Email MCP server is working correctly.

If you receive this email, the Silver Tier email integration is successful!

Best regards,
Your AI Employee

---
*This email was approved for sending on 2026-01-09*
```

**Move to Approved and Execute**:
```bash
# Move to Approved folder (do this manually or via file explorer)
# Then run:
claude /silver.execute-approved
```

If successful, you should receive the test email!

---

## MCP Email Server Capabilities

Once configured, the Email MCP server provides these tools:

1. **send_email**
   - Send emails with attachments
   - Used by `/silver.send-email` and `/silver.execute-approved`

2. **get_recent_emails**
   - Retrieve recent inbox messages
   - Filter by date range
   - Future: Auto-create action items from new emails

3. **get_email_content**
   - Read full email details
   - Access attachments
   - Future: Process email attachments automatically

4. **test_email_connection**
   - Verify SMTP/IMAP connectivity
   - Diagnose configuration issues

5. **list_supported_providers**
   - Show all supported email providers
   - Display auto-configuration details

---

## Automatic Server Configuration

The `mcp-email` server automatically configures SMTP/IMAP settings for supported providers:

| Provider | SMTP Host | SMTP Port | IMAP Host | IMAP Port |
|----------|-----------|-----------|-----------|-----------|
| Gmail | smtp.gmail.com | 587 | imap.gmail.com | 993 |
| Outlook | smtp-mail.outlook.com | 587 | outlook.office365.com | 993 |
| QQ Mail | smtp.qq.com | 587 | imap.qq.com | 993 |
| 163 Mail | smtp.163.com | 465 | imap.163.com | 993 |
| Tencent ExMail | smtp.exmail.qq.com | 465 | imap.exmail.qq.com | 993 |

No manual server configuration needed when using `EMAIL_TYPE: "auto"`!

---

## Security Best Practices

### 1. Use App Passwords
- ✅ ALWAYS use app-specific passwords
- ❌ NEVER use your main email password
- ✅ Rotate app passwords every 90 days

### 2. Protect Configuration File
- ✅ `.claude.json` should NOT be committed to git
- ✅ Keep credentials private
- ✅ Use `.gitignore` to exclude `.claude.json`

### 3. Limit Email Scope
- ✅ Create a dedicated email account for AI Employee (recommended)
- ✅ Or use a secondary email address
- ⚠️ Avoid using your primary personal/business email

### 4. Monitor Email Activity
- ✅ Review sent emails regularly
- ✅ Check audit logs in `/Logs/` folder
- ✅ Enable email provider's activity logs

---

## Troubleshooting

### Connection Failed

**Symptom**: `claude mcp list` shows "✗ Failed to connect"

**Solutions**:
1. Verify environment variables are set correctly in `.claude.json`
2. Check EMAIL_PASSWORD is the app password (not login password)
3. Ensure IMAP/SMTP is enabled in email provider settings
4. Try regenerating app password
5. Check network/firewall (allow ports 587, 465, 993, 995)

### Authentication Errors

**Symptom**: "Authentication failed" or "Invalid credentials"

**Solutions**:
1. Regenerate app password
2. Verify EMAIL_USER is the complete email address
3. For Gmail: Ensure 2-Step Verification is enabled
4. For Outlook: Check account is not suspended
5. Try EMAIL_TYPE: "auto" instead of specific provider

### "Unsafe Login" (163 Mail)

**Symptom**: 163 Mail returns "unsafe login" error

**Solution**:
- The `mcp-email` server automatically switches to POP3 protocol for 163 Mail
- This is normal and handled automatically
- No action needed

### Timeout Errors

**Symptom**: Connection timeouts or "ETIMEDOUT"

**Solutions**:
1. Check internet connection
2. Verify firewall allows outbound connections on:
   - SMTP ports: 25, 465, 587
   - IMAP ports: 993
   - POP3 port: 995
3. Try different SMTP port (587 vs 465)
4. Contact IT if on corporate network

---

## Configuration Examples

### Gmail Configuration

```json
{
  "mcpServers": {
    "email": {
      "command": "npx",
      "args": ["mcp-email"],
      "env": {
        "EMAIL_USER": "yourusername@gmail.com",
        "EMAIL_PASSWORD": "abcd efgh ijkl mnop",
        "EMAIL_TYPE": "auto"
      }
    }
  }
}
```

### Outlook Configuration

```json
{
  "mcpServers": {
    "email": {
      "command": "npx",
      "args": ["mcp-email"],
      "env": {
        "EMAIL_USER": "yourusername@outlook.com",
        "EMAIL_PASSWORD": "your-app-password",
        "EMAIL_TYPE": "auto"
      }
    }
  }
}
```

### Enterprise Email (Tencent ExMail)

```json
{
  "mcpServers": {
    "email": {
      "command": "npx",
      "args": ["mcp-email"],
      "env": {
        "EMAIL_USER": "employee@company.com",
        "EMAIL_PASSWORD": "authorization-code",
        "EMAIL_TYPE": "exmail"
      }
    }
  }
}
```

---

## Next Steps

After configuring Email MCP:

1. ✅ Verify connection: `claude mcp list`
2. ✅ Test email sending with approval workflow
3. ✅ Run end-to-end Silver Tier tests
4. ✅ Update `SILVER_TIER_STATUS.md` to mark Email MCP as complete
5. ✅ Configure automated scheduling (next Silver Tier requirement)

---

## Related Documentation

- **Silver Tier Status**: `SILVER_TIER_STATUS.md`
- **Email Sending Skill**: `.claude/skills/send-email.md`
- **Execution Skill**: `.claude/skills/execute-approved.md`
- **Gmail Setup (OAuth)**: `GMAIL_SETUP_GUIDE.md` (for watchers, not MCP)

---

## Package Information

- **Package**: `mcp-email`
- **Version**: 1.0.0
- **GitHub**: https://github.com/TimeCyber/email-mcp
- **npm**: https://www.npmjs.com/package/mcp-email
- **License**: MIT
- **Installation Date**: 2026-01-09

---

**Generated by**: Personal AI Employee System
**Date**: 2026-01-09
**Status**: Email MCP Installed - Configuration Required
**Action**: Add EMAIL_USER and EMAIL_PASSWORD to ~/.claude.json
