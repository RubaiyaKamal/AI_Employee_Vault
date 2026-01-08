# Process Inbox Items - Bronze Tier Skill

## User Input
```text
$ARGUMENTS
```

## Outline

You are processing items from the `/Inbox` or `/Needs_Action` folder in the Personal AI Employee vault. This is a core Bronze Tier capability.

### Execution Flow:

1. **Scan for New Items**
   - Read all files in `/Inbox` and `/Needs_Action` folders
   - Identify unprocessed items (files without a corresponding plan)
   - Sort by priority (high priority first) and timestamp (oldest first)

2. **Read Company Handbook**
   - Load `Company_Handbook.md` to understand decision rules
   - Load `Business_Goals.md` for strategic context (if exists)
   - Note the Decision Matrix for determining actions

3. **Process Each Item**
   For each item found:
   - Read the frontmatter to extract: type, priority, from, subject, received
   - Read the content/body of the item
   - Analyze what action is required based on:
     - Item type (email, whatsapp, bank, file)
     - Content keywords and intent
     - Company Handbook rules
     - Business Goals alignment

4. **Create Action Plan**
   For each item, create a plan file in `/Plans/`:
   - Filename: `PLAN_<item-type>_<timestamp>.md`
   - Include:
     - Objective (what needs to be done)
     - Steps (checkbox list)
     - Approval Required (Yes/No based on sensitivity)
     - Estimated complexity (simple/medium/complex)
   - Mark sensitive steps clearly (email sends, payments, etc.)

5. **Update Dashboard**
   - Increment "Active Tasks" count
   - Update "Needs Action" count
   - Add entry to "Recent Activity"
   - Update "Last Briefing" timestamp

6. **Move Processed Items**
   - Keep items in `/Needs_Action` until plan is approved/completed
   - Create reference link in plan to original item

### Acceptance Criteria:
- All items in Inbox/Needs_Action are processed
- Each item has a corresponding plan in `/Plans`
- Dashboard.md is updated with current counts
- No items are missed or duplicated
- Sensitive actions are flagged for approval

### Constraints:
- MUST follow Constitution Principle II (Human-in-the-Loop)
- MUST follow Constitution Principle IV (Audit Logging)
- MUST follow Constitution Principle V (File-Based Workflow)
- Never execute sensitive actions without approval

### Output:
Report summary:
- Number of items processed
- Number of plans created
- Number requiring approval
- Any errors or issues encountered

---

**Note**: This is a Bronze Tier skill for basic inbox processing. For Silver/Gold tiers, this will be enhanced with MCP integration and automated execution.
