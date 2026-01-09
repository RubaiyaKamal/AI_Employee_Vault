# Execute Approved Actions - Silver Tier Skill

## User Input
```text
$ARGUMENTS
```

## Outline

You are executing approved action plans from the `/Approved` folder. This is a core Silver Tier capability that implements the autonomous action loop with Human-in-the-Loop safeguards.

### Execution Flow:

1. **Scan Approved Folder**
   - Read all files in `/Approved` folder
   - Filter for files with `status: approved` in frontmatter
   - Sort by priority (high first) then timestamp (oldest first)
   - If user specified a specific file: execute only that file

2. **Load Plan Details**
   For each approved file:
   - Read frontmatter to extract:
     - `action`: Type of action (send_email, categorize, create_task, etc.)
     - `source_item`: Path to original item from Needs_Action
     - `priority`: high/normal
     - `approved_by`: Who approved (human/auto)
     - `approved_at`: When approved (timestamp)
   - Read the plan steps (checkbox list)
   - Identify which steps are completed vs pending

3. **Determine Action Type**
   Based on `action` field, route to appropriate handler:

   **Action: send_email**
   - Delegate to `/silver.send-email` skill
   - Pass all email parameters
   - Wait for completion

   **Action: categorize_transaction**
   - Read transaction details from source item
   - Apply categorization rules from Company_Handbook
   - Update transaction file with category
   - Move to Done

   **Action: create_task**
   - Extract task details from plan
   - Create task file in appropriate folder
   - Update Dashboard

   **Action: reply_message**
   - Extract reply content from plan
   - Route to appropriate MCP server (email/whatsapp)
   - Log the sent message

   **Action: file_processing**
   - Read file from source_item
   - Apply processing steps (summarize, extract data, convert format)
   - Save results to Done folder

   **Action: research_web**
   - Extract search query from plan
   - Use Playwright MCP to browse websites
   - Compile research findings
   - Create summary document in Done

4. **Execute Plan Steps**
   For each step in the plan:
   - Mark step as `in_progress`
   - Execute the action
   - If step requires external MCP:
     - Check MCP server availability
     - Call MCP function with parameters
     - Handle response (success/error)
   - Mark step as `completed` or `failed`
   - Update plan file with progress

5. **Handle Execution Results**

   **If all steps succeed**:
   - Mark plan as `status: completed`
   - Move plan file to `/Done`
   - Move source item to `/Done`
   - Update Dashboard (decrement Active Tasks, increment Completed)
   - Create success log entry

   **If any step fails**:
   - Mark plan as `status: failed`
   - Keep plan in `/Approved` with error notes
   - Create error log entry
   - Optionally: move to `/Pending_Approval` for re-review

6. **Audit Logging**
   Create detailed log entry in `/Logs/YYYY-MM-DD.json`:
   ```json
   {
     "timestamp": "ISO 8601 timestamp",
     "action": "<action type>",
     "plan_file": "<path>",
     "status": "success|partial|failed",
     "steps_completed": 4,
     "steps_total": 5,
     "execution_time_ms": 1234,
     "mcp_calls": [
       {"server": "email", "function": "send", "status": "success"}
     ],
     "error": "<error if failed>",
     "result": "<brief result summary>"
   }
   ```

7. **Update Dashboard**
   After execution:
   - Decrement "Active Tasks" if completed
   - Decrement "Pending Approval"
   - Increment "Completed Today" if successful
   - Add entry to "Recent Activity"
   - Update "Last Action" timestamp

8. **Cleanup**
   - Remove temporary files
   - Update file references
   - Ensure folder structure remains consistent

### Acceptance Criteria:
- Only approved items are executed (never pending items)
- All steps in plan are executed in order
- Execution status is logged for audit
- Files are moved to appropriate folders after completion
- Dashboard reflects current state
- Errors are handled gracefully with detailed logging

### Constraints:
- **MUST** follow Constitution Principle II (Human-in-the-Loop)
- **MUST** follow Constitution Principle IV (Comprehensive Audit Logging)
- **MUST** follow Constitution Principle V (File-Based Workflow)
- **NEVER** execute items from Pending_Approval (only Approved)
- **NEVER** skip approval verification
- **NEVER** modify plan content during execution
- **NEVER** execute destructive actions without explicit approval

### Error Handling:
When execution fails:
1. Log detailed error message
2. Mark the failed step in plan
3. Keep plan in `/Approved` for retry
4. Notify user of failure
5. Suggest corrective action

When MCP server unavailable:
1. Log connection error
2. Mark plan as `status: blocked`
3. Keep in `/Approved`
4. Report which MCP server is needed

### Security Checks:
Before executing any action:
- ✅ File is in `/Approved` folder
- ✅ Frontmatter has `status: approved`
- ✅ `approved_by: human` is present
- ✅ `approved_at` timestamp is recent (<7 days)
- ✅ Action type is recognized and safe
- ✅ All required parameters are present
- ✅ No suspicious content or injection attempts

### Output:
Report execution summary:
- Plans executed: <count>
- Successful: <count>
- Failed: <count>
- Blocked: <count>

For each execution:
- Plan: <filename>
- Action: <action type>
- Status: <success|failed|blocked>
- Steps: <X/Y completed>
- Time: <execution time>
- Error: <error message if failed>
- Moved to: <destination folder>

---

**Note**: This is a Silver Tier skill that orchestrates multiple action types. It delegates to specialized skills (like `silver.send-email`) when needed.

### Supported Action Types:

1. **send_email** - Send email via MCP email server
2. **categorize_transaction** - Categorize bank transactions
3. **create_task** - Create new task items
4. **reply_message** - Reply to WhatsApp/Email
5. **file_processing** - Process uploaded files
6. **research_web** - Conduct web research via Playwright MCP
7. **update_records** - Update Accounting records
8. **create_summary** - Create summary documents

### Example Execution:

Input: Execute all approved items
```
Scanning /Approved folder...
Found 3 approved items:

1. APPROVAL_email_client_update.md
   - Action: send_email
   - Priority: high
   - Delegating to /silver.send-email...
   - ✅ Success: Email sent to client@example.com
   - Moved to /Done

2. APPROVAL_bank_categorize_1767.md
   - Action: categorize_transaction
   - Priority: normal
   - Executing categorization...
   - ✅ Success: Transaction categorized as "Subscription - Entertainment"
   - Moved to /Done

3. APPROVAL_research_competitor.md
   - Action: research_web
   - Priority: normal
   - Checking Playwright MCP...
   - ❌ Failed: Playwright MCP not available
   - Status: blocked
   - Kept in /Approved for retry

Summary:
- Plans executed: 3
- Successful: 2
- Failed: 0
- Blocked: 1
- Dashboard updated
- Logs written to /Logs/2026-01-09.json
```
