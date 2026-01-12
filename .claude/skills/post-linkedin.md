# Post to LinkedIn

## Title
**Post to LinkedIn** - Automated LinkedIn Content Publishing with Human-in-the-Loop Approval

## Description

This skill publishes content to LinkedIn after verifying human approval. It implements the complete Human-in-the-Loop workflow for social media posting, ensuring all content is reviewed and explicitly approved before publishing. This helps generate business leads and maintain professional presence on LinkedIn.

**Capability Level**: Silver Tier
**Category**: Social Media Marketing
**Risk Level**: High (Public posting, requires approval)

## Instructions

### Execution Flow

#### 1. Verify Approval Status

**Input**: Path to approval file or scan /Approved folder
**Output**: Approved LinkedIn post actions ready for publishing

**Steps**:
- Check that file is in `/Approved` folder (not `/Pending_Approval`)
- Read frontmatter and verify:
  - `status: approved` (explicitly set by human)
  - `action: post_linkedin`
  - `approved_by: human` (not auto-approved)
  - `approved_at` timestamp exists and is recent (<7 days)
- If any verification fails: STOP and report error

**Security Checks**:
```python
def verify_approval(file_path):
    if '/Approved' not in file_path:
        return False, "File not in Approved folder"

    frontmatter = parse_frontmatter(file_path)

    if frontmatter.get('status') != 'approved':
        return False, "Status is not 'approved'"

    if frontmatter.get('action') != 'post_linkedin':
        return False, "Action type is not 'post_linkedin'"

    if frontmatter.get('approved_by') != 'human':
        return False, "Not approved by human"

    approved_at = parse_datetime(frontmatter.get('approved_at'))
    if (datetime.now() - approved_at).days > 7:
        return False, "Approval expired (>7 days old)"

    return True, "Approval verified"
```

#### 2. Extract Post Parameters

**Required Fields** from frontmatter:
- `content`: Post content (150-3000 characters)
- `visibility`: `public` | `connections` | `private`

**Optional Fields**:
- `hashtags`: Array of hashtags (without #)
- `media`: Path to image/video (up to 10 images or 1 video)
- `article_url`: URL to share with post
- `mention_users`: LinkedIn user IDs to mention
- `scheduled_time`: Future timestamp for scheduled posting

**Example Frontmatter**:
```yaml
---
action: post_linkedin
status: approved
approved_by: human
approved_at: 2026-01-10T10:30:00Z
visibility: public
hashtags:
  - AI
  - Automation
  - BusinessGrowth
  - Productivity
media: /Marketing/Images/success_story.jpg
---
```

#### 3. Validate Post Parameters

**Validation Rules**:

| Field | Validation | Error Message |
|-------|-----------|---------------|
| content | 150-3000 chars | "Content must be 150-3000 characters" |
| visibility | One of: public, connections, private | "Invalid visibility setting" |
| hashtags | Max 30, alphanumeric only | "Too many hashtags or invalid format" |
| media | File exists, <5MB for images, <200MB video | "Media file not found or too large" |
| content | No spam patterns | "Suspicious content detected" |

**Validation Code Pattern**:
```python
def validate_post(params):
    errors = []

    # Validate content length
    content = params.get('content', '')
    if len(content) < 150:
        errors.append("Content too short (minimum 150 characters)")
    if len(content) > 3000:
        errors.append("Content too long (maximum 3000 characters)")

    # Validate visibility
    valid_visibility = ['public', 'connections', 'private']
    if params.get('visibility', 'public') not in valid_visibility:
        errors.append(f"Invalid visibility: {params.get('visibility')}")

    # Validate hashtags
    hashtags = params.get('hashtags', [])
    if len(hashtags) > 30:
        errors.append("Too many hashtags (maximum 30)")

    for tag in hashtags:
        if not tag.replace('_', '').isalnum():
            errors.append(f"Invalid hashtag format: {tag}")

    # Validate media
    if 'media' in params:
        media_path = params['media']
        if not os.path.exists(media_path):
            errors.append(f"Media file not found: {media_path}")
        else:
            size = os.path.getsize(media_path)
            ext = os.path.splitext(media_path)[1].lower()

            if ext in ['.jpg', '.jpeg', '.png', '.gif']:
                if size > 5 * 1024 * 1024:  # 5MB
                    errors.append("Image file too large (max 5MB)")
            elif ext in ['.mp4', '.mov']:
                if size > 200 * 1024 * 1024:  # 200MB
                    errors.append("Video file too large (max 200MB)")
            else:
                errors.append(f"Unsupported media format: {ext}")

    # Check for spam patterns
    spam_patterns = ['click here', 'buy now', 'limited time', '🔥🔥🔥']
    content_lower = content.lower()
    for pattern in spam_patterns:
        if pattern in content_lower:
            errors.append(f"Potential spam content detected: {pattern}")

    return errors
```

#### 4. Check LinkedIn API Connection

**LinkedIn API Requirements**:
- Configuration: Valid LinkedIn OAuth credentials in watcher_config.json
- Required: `linkedin_client_id`, `linkedin_client_secret`, `linkedin_access_token`

**Connection Check**:
```python
def check_linkedin_auth():
    config = load_config('watcher_config.json')

    if not config.get('linkedin_client_id'):
        return False, "LinkedIn Client ID not configured"

    if not config.get('linkedin_access_token'):
        return False, "LinkedIn access token not available - run authentication"

    # Test API connection
    try:
        response = requests.get(
            'https://api.linkedin.com/v2/me',
            headers={'Authorization': f"Bearer {config['linkedin_access_token']}"}
        )
        if response.status_code == 200:
            return True, "LinkedIn API connected"
        else:
            return False, f"LinkedIn API error: {response.status_code}"
    except Exception as e:
        return False, f"Connection error: {str(e)}"
```

**If LinkedIn Not Available**:
- Log error: "LinkedIn API not configured or token expired"
- Mark plan as `status: blocked`
- Keep file in `/Approved` for retry
- Report to user: "LinkedIn posting blocked - authentication needed"

#### 5. Publish to LinkedIn

**API Call Structure**:
```python
def post_to_linkedin(params, access_token):
    """Post content to LinkedIn using v2 API"""

    # Prepare post content
    content_text = params['content']

    # Add hashtags
    if params.get('hashtags'):
        hashtags_text = ' ' + ' '.join([f"#{tag}" for tag in params['hashtags']])
        content_text += hashtags_text

    # Build post payload
    post_data = {
        "author": f"urn:li:person:{get_person_id(access_token)}",
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {
                    "text": content_text
                },
                "shareMediaCategory": "NONE"
            }
        },
        "visibility": {
            "com.linkedin.ugc.MemberNetworkVisibility": params.get('visibility', 'PUBLIC').upper()
        }
    }

    # Add media if present
    if params.get('media'):
        # Upload media first (separate API call)
        media_urn = upload_media_to_linkedin(params['media'], access_token)
        post_data["specificContent"]["com.linkedin.ugc.ShareContent"]["shareMediaCategory"] = "IMAGE"
        post_data["specificContent"]["com.linkedin.ugc.ShareContent"]["media"] = [
            {
                "status": "READY",
                "media": media_urn
            }
        ]

    # Make API request
    response = requests.post(
        'https://api.linkedin.com/v2/ugcPosts',
        headers={
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0'
        },
        json=post_data
    )

    if response.status_code in [200, 201]:
        return {
            "status": "success",
            "post_id": response.json().get('id'),
            "posted_at": datetime.now().isoformat(),
            "url": f"https://www.linkedin.com/feed/update/{response.json().get('id')}"
        }
    else:
        return {
            "status": "error",
            "error": response.text,
            "status_code": response.status_code
        }
```

#### 6. Handle Post Results

**On Success**:
1. Mark post as `status: published` in frontmatter
2. Add `published_at` timestamp
3. Add `post_id` and `post_url` from API response
4. Move file from `/Approved` to `/Done`
5. Update source item (if exists) to `/Done`
6. Create audit log entry
7. Update Dashboard counts

**On Failure**:
1. Mark post as `status: failed`
2. Add `error` field with detailed message
3. Keep file in `/Approved` (for retry)
4. Create error log entry
5. Report to user with troubleshooting steps

#### 7. Comprehensive Audit Logging

**Log Entry Structure**:
```json
{
  "timestamp": "2026-01-10T10:35:00Z",
  "action": "post_linkedin",
  "status": "success",
  "approval_file": "/Approved/APPROVAL_linkedin_post_ai_success.md",
  "source_item": "/Needs_Action/linkedin_post_suggestion_20260110.md",
  "content_preview": "Excited to share how AI automation...",
  "visibility": "public",
  "hashtags": ["AI", "Automation", "BusinessGrowth"],
  "media_included": true,
  "post_url": "https://www.linkedin.com/feed/update/urn:li:share:1234567890",
  "post_id": "urn:li:share:1234567890",
  "execution_time_ms": 2341,
  "approved_by": "human",
  "approved_at": "2026-01-10T10:30:00Z"
}
```

#### 8. Update Dashboard

**Dashboard Updates**:
- **Pending Approval**: Decrement by 1
- **Completed Today**: Increment by 1
- **Active Tasks**: Decrement by 1
- **Recent Activity**: Add entry `"[2026-01-10 10:35] Posted to LinkedIn: [topic]"`

### Acceptance Criteria

- [ ] Post published only after human approval verified
- [ ] All post parameters validated before publishing
- [ ] LinkedIn API used with proper authentication
- [ ] Success/failure logged in audit trail
- [ ] Files moved to appropriate folders (Done or kept in Approved)
- [ ] Dashboard updated with accurate counts
- [ ] Source item updated and moved to Done
- [ ] No posts published without explicit approval

### Constraints

**Constitution Compliance**:
- **Principle II**: Human-in-the-Loop for Sensitive Actions
  - **NEVER** post to LinkedIn without human approval
  - **NEVER** modify content after approval
  - **NEVER** post on behalf of user without consent
- **Principle IV**: Comprehensive Audit Logging
  - **MUST** log every post attempt (success and failure)
  - **MUST** include all details (content, visibility, timestamp)

**Operational Constraints**:
- Content length: 150-3000 characters (LinkedIn limit)
- Hashtags: Maximum 30
- Images: Max 10 images per post, 5MB each
- Video: 1 video per post, max 200MB
- Approval expiration: 7 days
- Retry attempts: 3 maximum

**Security Constraints**:
- No spam content or excessive promotional language
- No executable file attachments
- Media must be within vault directory
- Content must align with professional standards
- OAuth tokens stored securely

## Examples

### Example 1: Publishing Success Story

**Approval File**: `/Approved/APPROVAL_linkedin_ai_success.md`

```markdown
---
action: post_linkedin
status: approved
approved_by: human
approved_at: 2026-01-10T10:30:00Z
source_item: /Needs_Action/linkedin_post_suggestion_20260110.md
visibility: public
hashtags:
  - AI
  - Automation
  - Productivity
  - BusinessGrowth
media: /Marketing/Images/automation_success.jpg
---

# LinkedIn Post: AI Automation Success Story

## Approval Details
Reviewed and approved by: Human
Approved at: 2026-01-10 10:30 AM
Reason: Good content showcasing our AI implementation success

## Post Content

Excited to share how AI automation has transformed our workflow over the past month!

We implemented a Personal AI Employee system that handles:
• Email monitoring and intelligent routing
• Automated task prioritization
• Smart scheduling and reminders
• Document processing and analysis

Results so far:
✅ 40% reduction in routine task time
✅ 95% accuracy in email categorization
✅ Zero missed deadlines
✅ More time for strategic work

The key was starting small, focusing on high-impact tasks, and maintaining human oversight for critical decisions.

What's your experience with AI in your daily work? I'd love to hear your stories!

---
*Approved for posting on 2026-01-10*
```

**Skill Execution Result**:
```
✅ LinkedIn post published successfully!

Post URL: https://www.linkedin.com/feed/update/urn:li:share:1234567890
Visibility: Public
Hashtags: #AI #Automation #Productivity #BusinessGrowth
Media: 1 image attached
Posted at: 2026-01-10 10:35:22

File moved to: /Done/APPROVAL_linkedin_ai_success.md
Source item moved to: /Done/linkedin_post_suggestion_20260110.md
Log entry created: /Logs/2026-01-10.json
Dashboard updated: Pending Approval: 1, Completed Today: 3
```

### Example 2: Failed Post - Not Authenticated

**Output**:
```
❌ LinkedIn posting blocked!

Error: LinkedIn API not configured or token expired
File: /Approved/APPROVAL_linkedin_industry_insight.md
Status: Blocked (kept in Approved for retry)

Troubleshooting Steps:
1. Configure LinkedIn App at https://www.linkedin.com/developers/apps
2. Add credentials to watcher_config.json:
   - linkedin_client_id
   - linkedin_client_secret
3. Run authentication: python linkedin_watcher.py --auth
4. Retry this skill: claude /silver.post-linkedin

The approval file will remain in /Approved until successfully posted.
```

## References

### Related Skills
- `/bronze.generate-plan.md` - Generates LinkedIn post plans
- `/silver.execute-approved.md` - Orchestrates execution including posting
- LinkedIn Watcher - Generates post suggestions

### Documentation
- `watcher_config.json` - LinkedIn API configuration
- `.specify/memory/constitution.md` - Principle II (HITL) and IV (Audit Logging)
- `README.md` - Approval requirements for social media

### LinkedIn API
- **Documentation**: https://learn.microsoft.com/en-us/linkedin/
- **OAuth Guide**: https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication
- **Share API**: https://learn.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/ugc-post-api

### Related Constitution Principles
- **Principle II**: Human-in-the-Loop for Sensitive Actions
- **Principle IV**: Comprehensive Audit Logging
- **Principle VI**: Security and Credential Management

---

**Skill Version**: 1.0.0
**Last Updated**: 2026-01-10
**Tier**: Silver
**Author**: Personal AI Employee System
**Status**: Production Ready
**Requires**: LinkedIn API Access & OAuth Setup
