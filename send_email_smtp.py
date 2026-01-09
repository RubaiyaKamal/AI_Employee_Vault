"""
SMTP Email Sender for Personal AI Employee System

This script sends emails using SMTP with credentials from .env file
when the MCP email server is not available.
"""
import os
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import json
from pathlib import Path
from dotenv import load_dotenv
import re
import base64

# Load environment variables
load_dotenv()

def validate_email(email):
    """Validate email address format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email.strip()) is not None

def send_email_via_smtp(recipient, subject, body, cc=None, bcc=None, attachments=None, priority="normal"):
    """
    Send email via SMTP using Gmail credentials

    Args:
        recipient: Email address or comma-separated list of addresses
        subject: Email subject
        body: Email body content
        cc: CC recipients (optional)
        bcc: BCC recipients (optional)
        attachments: List of file paths to attach (optional)
        priority: Email priority (normal, high, low)

    Returns:
        dict: Result with status and message_id or error
    """
    # Get credentials from environment
    email_user = os.getenv('EMAIL_USER')
    email_password = os.getenv('EMAIL_PASSWORD')

    if not email_user or not email_password:
        return {
            "status": "error",
            "message": "Email credentials not found in .env file"
        }

    # Validate recipient
    recipients = []
    if isinstance(recipient, str):
        recipients = [r.strip() for r in recipient.split(',')]
    else:
        recipients = recipient

    for rec in recipients:
        if not validate_email(rec):
            return {
                "status": "error",
                "message": f"Invalid recipient email format: {rec}"
            }

    # Validate subject
    if not subject or len(subject) < 1:
        return {
            "status": "error",
            "message": "Subject cannot be empty"
        }

    if len(subject) > 200:
        return {
            "status": "error",
            "message": "Subject too long (max 200 chars)"
        }

    # Validate body
    if not body or len(body) < 1:
        return {
            "status": "error",
            "message": "Body cannot be empty"
        }

    # Validate attachments if provided
    if attachments:
        total_size = 0
        for attachment_path in attachments:
            if not os.path.exists(attachment_path):
                return {
                    "status": "error",
                    "message": f"Attachment not found: {attachment_path}"
                }
            else:
                size = os.path.getsize(attachment_path)
                if size > 25 * 1024 * 1024:  # 25MB limit
                    return {
                        "status": "error",
                        "message": f"Attachment too large: {attachment_path} ({size} bytes, max 25MB)"
                    }
                total_size += size

        if total_size > 25 * 1024 * 1024:  # 25MB total limit
            return {
                "status": "error",
                "message": f"Total attachment size exceeds 25MB"
            }

        # Check for suspicious file extensions
        suspicious_extensions = ['.exe', '.bat', '.cmd', '.scr', '.com', '.pif', '.vbs', '.js', '.jar']
        for attachment_path in attachments:
            ext = Path(attachment_path).suffix.lower()
            if ext in suspicious_extensions:
                return {
                    "status": "error",
                    "message": f"Suspicious file extension not allowed: {ext} in {attachment_path}"
                }

    # Check for suspicious content in body
    suspicious_patterns = ['<script', 'javascript:', 'onerror=', 'onclick=']
    for pattern in suspicious_patterns:
        if pattern.lower() in body.lower():
            return {
                "status": "error",
                "message": f"Suspicious content detected in email body: {pattern}"
            }

    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = email_user
        msg['To'] = ', '.join(recipients)
        msg['Subject'] = subject

        if cc:
            if isinstance(cc, str):
                cc_list = [c.strip() for c in cc.split(',')]
            else:
                cc_list = cc
            msg['Cc'] = ', '.join(cc_list)

            # Add CC recipients to the full recipient list
            for c in cc_list:
                if validate_email(c):
                    recipients.append(c)

        if bcc:
            if isinstance(bcc, str):
                bcc_list = [b.strip() for b in bcc.split(',')]
            else:
                bcc_list = bcc
            # BCC recipients are not added to headers but included in send
            for b in bcc_list:
                if validate_email(b):
                    recipients.append(b)

        # Set priority header
        priority_map = {
            "high": "High",
            "normal": "Normal",
            "low": "Low"
        }
        msg['X-Priority'] = "2" if priority == "high" else "3" if priority == "normal" else "5"
        msg['Importance'] = priority_map.get(priority, "Normal")

        # Add body to email
        msg.attach(MIMEText(body, 'plain'))

        # Add attachments if any
        if attachments:
            for file_path in attachments:
                with open(file_path, "rb") as attachment:
                    part = MIMEBase('application', 'octet-stream')
                    part.set_payload(attachment.read())

                encoders.encode_base64(part)
                part.add_header(
                    'Content-Disposition',
                    f'attachment; filename= {Path(file_path).name}'
                )

                msg.attach(part)

        # Create SMTP session
        smtp_server = "smtp.gmail.com"
        port = 587  # For starttls

        # Create a secure SSL context
        context = ssl.create_default_context()

        # Connect to server and send email
        with smtplib.SMTP(smtp_server, port) as server:
            server.starttls(context=context)  # Enable encryption
            server.login(email_user, email_password)
            text = msg.as_string()
            message_id = server.sendmail(email_user, recipients, text)

        return {
            "status": "success",
            "message_id": str(message_id) if message_id else "unknown",
            "sent_at": __import__('datetime').datetime.now().isoformat(),
            "recipients": {
                "to": recipients,
                "cc": cc_list if 'cc_list' in locals() else [],
            }
        }

    except smtplib.SMTPAuthenticationError:
        return {
            "status": "error",
            "message": "SMTP Authentication failed. Check your email credentials and App Password settings."
        }
    except smtplib.SMTPRecipientsRefused:
        return {
            "status": "error",
            "message": "All recipients were refused. Check email addresses."
        }
    except smtplib.SMTPSenderRefused:
        return {
            "status": "error",
            "message": "Sender was refused. Check your email address."
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to send email: {str(e)}"
        }

def process_email_approval_file(file_path):
    """
    Process an email approval file and send the email

    Args:
        file_path: Path to the approval markdown file with email parameters in frontmatter

    Returns:
        dict: Result of email sending operation
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Split frontmatter from content
        if content.startswith('---'):
            parts = content.split('---', 2)
            if len(parts) >= 3:
                frontmatter = parts[1]
                body_content = parts[2]
            else:
                return {
                    "status": "error",
                    "message": "Invalid frontmatter format in approval file"
                }
        else:
            return {
                "status": "error",
                "message": "No frontmatter found in approval file"
            }

        # Parse frontmatter manually (since we can't rely on yaml module being available)
        lines = frontmatter.strip().split('\n')
        params = {}
        current_key = None
        current_value = ""

        for line in lines:
            if ':' in line and not line.strip().startswith(' '):
                # New key-value pair
                if current_key is not None:
                    # Save the previous key-value pair
                    if current_value.strip().startswith('[') and current_value.strip().endswith(']'):
                        # It's a list/array
                        try:
                            current_value = [item.strip().strip('"\'') for item in current_value.strip()[1:-1].split(',')]
                        except:
                            pass
                    params[current_key] = current_value.strip().strip('"\'')

                parts = line.split(':', 1)
                current_key = parts[0].strip()
                current_value = parts[1].strip() if len(parts) > 1 else ""
            else:
                # Continuation of a multi-line value
                if current_key is not None:
                    current_value += '\n' + line

        # Save the last key-value pair
        if current_key is not None:
            if current_value.strip().startswith('[') and current_value.strip().endswith(']'):
                # It's a list/array
                try:
                    current_value = [item.strip().strip('"\'') for item in current_value.strip()[1:-1].split(',')]
                except:
                    pass
            params[current_key] = current_value.strip().strip('"\'')

        # Validate approval status
        if params.get('status') != 'approved':
            return {
                "status": "error",
                "message": f"Email not approved. Current status: {params.get('status', 'unknown')}"
            }

        if params.get('approved_by') != 'human':
            return {
                "status": "error",
                "message": "Email not approved by human"
            }

        # Extract required parameters
        recipient = params.get('recipient')
        subject = params.get('subject')
        priority = params.get('priority', 'normal')

        if not recipient:
            return {
                "status": "error",
                "message": "Recipient not specified in approval file"
            }

        if not subject:
            return {
                "status": "error",
                "message": "Subject not specified in approval file"
            }

        # Extract optional parameters
        cc = params.get('cc')
        bcc = params.get('bcc')
        attachments_str = params.get('attachments', '[]')

        # Parse attachments array
        attachments = []
        if attachments_str and attachments_str.strip() != '[]':
            try:
                # Simple parsing of array format like [ "/path/to/file1", "/path/to/file2" ]
                attachments_str_clean = attachments_str.strip().strip('[]')
                if attachments_str_clean:
                    attachments = [path.strip().strip('"\'') for path in attachments_str_clean.split(',')]
            except:
                pass

        # Use the body from the markdown content after frontmatter
        # Find the body section (usually after headers)
        body_lines = body_content.split('\n')
        body_start_idx = 0

        # Look for the body section after headers
        for i, line in enumerate(body_lines):
            if line.strip().startswith('## Body') or 'Body' in line:
                body_start_idx = i + 1
                break

        # Extract body content, skipping headers
        body_parts = []
        for line in body_lines[body_start_idx:]:
            if line.strip().startswith('## ') and body_parts:
                # Another header, stop here
                break
            if not line.strip().startswith('#') or body_parts:
                # Don't add header lines after we've started collecting body
                if not line.strip().startswith('---'):  # Skip closing separator
                    body_parts.append(line)

        body = '\n'.join(body_parts).strip()

        # If we couldn't extract a body from the markdown structure, use the whole content after frontmatter
        if not body:
            body = body_content.strip()

        # Send the email
        result = send_email_via_smtp(
            recipient=recipient,
            subject=subject,
            body=body,
            cc=cc,
            bcc=bcc,
            attachments=attachments if attachments else None,
            priority=priority
        )

        return result

    except FileNotFoundError:
        return {
            "status": "error",
            "message": f"Approval file not found: {file_path}"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error processing approval file: {str(e)}"
        }

if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage:")
        print("  python send_email_smtp.py <recipient> <subject> <body> [cc] [priority]")
        print("  python send_email_smtp.py <approval_file_path>")
        print("\nExamples:")
        print("  python send_email_smtp.py 'test@example.com' 'Test Subject' 'Test body'")
        print("  python send_email_smtp.py 'Approved/APPROVAL_email_file.md'")
        sys.exit(1)

    arg = sys.argv[1]

    if arg.endswith('.md') and Path(arg).exists():
        # Process as approval file
        result = process_email_approval_file(arg)
    else:
        # Process as direct email
        if len(sys.argv) < 4:
            print("Missing required arguments: recipient, subject, body")
            sys.exit(1)

        recipient = sys.argv[1]
        subject = sys.argv[2]
        body = sys.argv[3]
        cc = sys.argv[4] if len(sys.argv) > 4 else None
        priority = sys.argv[5] if len(sys.argv) > 5 else "normal"

        result = send_email_via_smtp(
            recipient=recipient,
            subject=subject,
            body=body,
            cc=cc,
            priority=priority
        )

    print(json.dumps(result, indent=2))