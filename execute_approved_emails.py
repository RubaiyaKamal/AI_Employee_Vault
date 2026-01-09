"""
Execute Approved Emails - Silver Tier Skill Handler

This script processes email approval files in the Approved folder
and sends emails using SMTP when they have approved status.
"""
import os
import sys
import json
from pathlib import Path
import shutil
from datetime import datetime
import re

def validate_email(email):
    """Validate email address format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email.strip()) is not None

def parse_frontmatter(content):
    """Parse YAML frontmatter from markdown content"""
    if content.startswith('---'):
        parts = content.split('---', 2)
        if len(parts) >= 3:
            frontmatter = parts[1]
            body_content = parts[2]

            # Parse frontmatter manually
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

            return params, body_content

    return {}, content

def execute_approved_email(file_path):
    """Execute a single approved email"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        params, body_content = parse_frontmatter(content)

        # Verify approval status
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

        # Check if approval is recent (<7 days)
        approved_at = params.get('approved_at')
        if approved_at:
            try:
                from datetime import datetime
                approved_time = datetime.fromisoformat(approved_at.replace('Z', '+00:00'))
                if (datetime.now(approved_time.tzinfo) - approved_time).days > 7:
                    return {
                        "status": "error",
                        "message": "Approval expired (>7 days old)"
                    }
            except:
                pass  # If parsing fails, continue without checking age

        # Extract required parameters
        recipient = params.get('recipient')
        subject = params.get('subject')

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

        # Extract optional parameters
        cc = params.get('cc')
        bcc = params.get('bcc')
        attachments_str = params.get('attachments', '[]')
        priority = params.get('priority', 'normal')

        # Parse attachments array
        attachments = []
        if attachments_str and attachments_str.strip() != '[]':
            try:
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

        # Import and use the SMTP email function
        from send_email_smtp import send_email_via_smtp

        result = send_email_via_smtp(
            recipient=recipient,
            subject=subject,
            body=body,
            cc=cc,
            bcc=bcc,
            attachments=attachments if attachments else None,
            priority=priority
        )

        if result['status'] == 'success':
            # Update the file to mark as sent
            params['status'] = 'sent'
            params['sent_at'] = result.get('sent_at', datetime.now().isoformat())
            params['message_id'] = result.get('message_id', 'unknown')

            # Remove error field if it existed
            if 'error' in params:
                del params['error']

            # Write updated frontmatter back to file
            frontmatter_yaml = "---\n"
            for key, value in params.items():
                if isinstance(value, list):
                    frontmatter_yaml += f"{key}:\n"
                    for item in value:
                        frontmatter_yaml += f"  - \"{item}\"\n"
                else:
                    frontmatter_yaml += f"{key}: {value}\n"
            frontmatter_yaml += "---\n"

            updated_content = frontmatter_yaml + body_content

            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(updated_content)

            # Move file to Done folder
            done_folder = Path("Done")
            done_folder.mkdir(exist_ok=True)

            new_file_path = done_folder / Path(file_path).name
            shutil.move(file_path, new_file_path)

            return {
                "status": "success",
                "message": f"Email sent successfully and moved to Done folder",
                "details": result
            }
        else:
            # Mark as failed but keep in Approved for retry
            params['status'] = 'failed'
            params['error'] = result['message']
            params['failed_at'] = datetime.now().isoformat()

            # Write updated frontmatter back to file
            frontmatter_yaml = "---\n"
            for key, value in params.items():
                if isinstance(value, list):
                    frontmatter_yaml += f"{key}:\n"
                    for item in value:
                        frontmatter_yaml += f"  - \"{item}\"\n"
                else:
                    frontmatter_yaml += f"{key}: {value}\n"
            frontmatter_yaml += "---\n"

            updated_content = frontmatter_yaml + body_content

            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(updated_content)

            return {
                "status": "error",
                "message": f"Email failed to send: {result['message']}",
                "file_kept": "File kept in Approved folder for retry"
            }

    except Exception as e:
        return {
            "status": "error",
            "message": f"Error processing approval file: {str(e)}"
        }

def execute_all_approved_emails():
    """Execute all approved emails in the Approved folder"""
    approved_folder = Path("Approved")
    if not approved_folder.exists():
        return {
            "status": "error",
            "message": "Approved folder does not exist"
        }

    # Find all markdown files in Approved folder that might be email approvals
    approval_files = list(approved_folder.glob("*.md"))

    results = []
    for file_path in approval_files:
        # Check if this is an email approval file
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            if 'action: send_email' in content:
                result = execute_approved_email(str(file_path))
                results.append({
                    "file": str(file_path),
                    "result": result
                })
        except:
            continue  # Skip files that can't be read

    return {
        "status": "success",
        "message": f"Processed {len(results)} email approval files",
        "results": results
    }

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Process specific file
        file_path = sys.argv[1]
        result = execute_approved_email(file_path)
        print(json.dumps(result, indent=2))
    else:
        # Process all approved emails
        result = execute_all_approved_emails()
        print(json.dumps(result, indent=2))