# Post to LinkedIn - Silver Tier Skill

## User Input
```text
$ARGUMENTS
```

## Outline

You are executing the LinkedIn posting workflow with Human-in-the-Loop approval. This is a Silver Tier external action capability that publishes approved content to LinkedIn.

### Execution Flow:

Refer to the complete skill documentation at `.claude/skills/post-linkedin.md` for detailed execution steps.

**Quick Overview:**

1. **Scan /Approved Folder**
   - Find files with `action: post_linkedin` and `status: approved`
   - If $ARGUMENTS contains a file path, process that specific file
   - Otherwise, process all approved LinkedIn post files

2. **For Each Approved Post:**
   - Verify human approval (approved_by: human, approved_at within 7 days)
   - Extract post content, visibility, hashtags, media
   - Validate content (150-3000 chars, proper hashtag format)
   - Check LinkedIn API connection

3. **Publish to LinkedIn:**
   - Use LinkedIn Share API (v2/ugcPosts)
   - Include hashtags and media if specified
   - Handle success/failure appropriately

4. **Post-Publication:**
   - Move approved file to /Done
   - Update source item (if exists) to /Done
   - Create audit log entry
   - Update Dashboard

5. **Handle Errors:**
   - LinkedIn API not configured: Mark as blocked, keep in /Approved
   - Validation failed: Mark as validation_failed, keep in /Approved
   - API error: Mark as failed with error details, keep in /Approved

### Usage Examples:

```bash
# Process all approved LinkedIn posts
claude /silver.post-linkedin

# Process specific approval file
claude /silver.post-linkedin /Approved/APPROVAL_linkedin_post_ai_success.md
```

### Prerequisites:

**LinkedIn API Setup** (Optional - for actual posting):
1. Create LinkedIn App at https://www.linkedin.com/developers/apps
2. Configure OAuth redirect: http://localhost:8080/callback
3. Request permissions: r_liteprofile, w_member_social
4. Add credentials to watcher_config.json:
   ```json
   {
     "linkedin_client_id": "your_client_id",
     "linkedin_client_secret": "your_client_secret",
     "linkedin_access_token": "your_access_token"
   }
   ```

**Without LinkedIn API** (Draft Mode):
- The skill will still validate content and create drafts
- Posts will be marked as "draft_ready" instead of "published"
- User can manually copy content to LinkedIn

### Acceptance Criteria:

- [ ] Only posts with human approval are published
- [ ] Content is validated before posting (length, hashtags, format)
- [ ] LinkedIn API credentials are verified before posting
- [ ] Success/failure is logged with full audit trail
- [ ] Files are moved to appropriate folders
- [ ] Dashboard is updated with accurate counts

### Constraints:

**Constitution Compliance:**
- **Principle II**: NEVER post without human approval
- **Principle IV**: MUST log all post attempts (success and failure)
- **Principle VI**: MUST use secure credential storage

**Technical Limits:**
- Content: 150-3000 characters
- Hashtags: Maximum 30
- Images: Max 10, 5MB each
- Video: 1 per post, max 200MB
- Approval expiration: 7 days

### Output:

Display results for each post processed:
```
✅ LinkedIn post published successfully!

Post URL: https://www.linkedin.com/feed/update/urn:li:share:1234567890
Visibility: Public
Hashtags: #AI #Automation #BusinessGrowth
Posted at: 2026-01-10 10:35:22

File moved to: /Done/APPROVAL_linkedin_ai_success.md
Dashboard updated: Completed Today: 3
```

Or if LinkedIn API not configured:
```
📝 LinkedIn post draft created!

Content validated and ready to post
File: /Approved/APPROVAL_linkedin_post.md
Status: draft_ready

To enable automated posting:
1. Configure LinkedIn API credentials in watcher_config.json
2. Run: python linkedin_watcher.py --auth
3. Retry: claude /silver.post-linkedin

You can manually copy the approved content to LinkedIn in the meantime.
```

---

**Tier**: Silver
**Risk**: High (Public social media posting)
**Requires**: Human approval (mandatory), LinkedIn API (optional)
**Related Skills**:
- `/bronze.generate-plan.md` - Creates post plans
- `/silver.execute-approved.md` - Orchestrates approvals
- LinkedIn Watcher - Generates post suggestions
