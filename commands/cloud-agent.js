#!/usr/bin/env node

/**
 * Platinum Tier - Cloud Agent
 * Draft-only operations, 24/7 availability
 * Security: Read-only credentials, no execution authority
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Import synchronization modules
const VaultSync = require('../scripts/sync/vault-sync');
const ClaimByMove = require('../scripts/sync/claim-by-move');

// Configuration
const AGENT_ID = process.env.AGENT_ID || 'cloud';
const VAULT_PATH = process.env.VAULT_PATH || '/vault';
const CHECK_INTERVAL = parseInt(process.env.CHECK_INTERVAL) || 60000; // 1 minute
const SYNC_INTERVAL = parseInt(process.env.VAULT_SYNC_INTERVAL) || 300000; // 5 minutes

console.log('\n🚀 Starting Platinum Tier Cloud Agent...\n');
console.log('═'.repeat(60));
console.log(`Agent ID: ${AGENT_ID}`);
console.log(`Role: Draft Generator (Read-Only)`);
console.log(`Vault Path: ${VAULT_PATH}`);
console.log(`Check Interval: ${CHECK_INTERVAL}ms`);
console.log(`Sync Interval: ${SYNC_INTERVAL}ms`);
console.log('═'.repeat(60));
console.log('');

// Initialize synchronization
const vaultSync = new VaultSync(VAULT_PATH, AGENT_ID);
const claimByMove = new ClaimByMove(VAULT_PATH, AGENT_ID);

// Health check endpoint
const http = require('http');
const HEALTH_PORT = process.env.HEALTH_CHECK_PORT || 8080;

const healthServer = http.createServer((req, res) => {
  if (req.url === '/health') {
    const status = {
      agent: AGENT_ID,
      role: 'draft_generator',
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      vault_path: VAULT_PATH,
      last_sync: lastSyncTime || 'never'
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(status, null, 2));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

healthServer.listen(HEALTH_PORT, () => {
  console.log(`✅ Health check endpoint: http://localhost:${HEALTH_PORT}/health\n`);
});

// Track last sync time
let lastSyncTime = null;
let lastCheckTime = null;

/**
 * Process available tasks in Needs_Action
 */
async function processTasks() {
  try {
    console.log(`[${new Date().toISOString()}] 🔍 Scanning for tasks...`);
    lastCheckTime = new Date().toISOString();

    // Scan for available tasks
    const availableTasks = claimByMove.scanAvailableTasks();

    if (availableTasks.length === 0) {
      console.log('No tasks available.');
      return;
    }

    console.log(`Found ${availableTasks.length} available tasks`);

    // Process each task
    for (const taskPath of availableTasks) {
      const fileName = path.basename(taskPath);

      // Check if already claimed
      const claimStatus = claimByMove.isTaskClaimed(fileName);
      if (claimStatus.isClaimed) {
        console.log(`⏭️  Skipping ${fileName} (claimed by ${claimStatus.claimedBy})`);
        continue;
      }

      // Attempt to claim the task
      const claimResult = claimByMove.claimTask(taskPath);

      if (claimResult.claimed) {
        console.log(`✅ Claimed: ${fileName}`);

        // Process the task (draft generation)
        await processClaimedTask(claimResult.targetPath);

        // Release task to Done
        claimByMove.releaseTask(claimResult.targetPath, 'completed');
      } else {
        console.log(`⚠️  Failed to claim ${fileName}: ${claimResult.reason}`);
      }
    }

    console.log('');
  } catch (error) {
    console.error('❌ Error processing tasks:', error.message);
  }
}

/**
 * Process a claimed task - Generate draft
 * @param {string} taskPath - Path to claimed task file
 */
async function processClaimedTask(taskPath) {
  try {
    console.log(`\n📝 Processing task: ${path.basename(taskPath)}`);

    // Read task content
    const taskContent = fs.readFileSync(taskPath, 'utf-8');

    // Parse task metadata
    const metadata = parseTaskMetadata(taskContent);

    // Determine task type and generate appropriate draft
    if (metadata.type === 'email' || taskPath.includes('email')) {
      await generateEmailDraft(taskPath, taskContent, metadata);
    } else if (metadata.type === 'social' || taskPath.includes('social') || taskPath.includes('linkedin')) {
      await generateSocialDraft(taskPath, taskContent, metadata);
    } else {
      console.log(`⚠️  Unknown task type: ${metadata.type || 'unspecified'}`);
      await generateGenericDraft(taskPath, taskContent, metadata);
    }

    console.log(`✅ Draft generated successfully`);
  } catch (error) {
    console.error(`❌ Error processing task ${taskPath}:`, error.message);
    throw error;
  }
}

/**
 * Parse task metadata from frontmatter
 */
function parseTaskMetadata(content) {
  const metadata = {
    type: 'unknown',
    priority: 'normal',
    status: 'pending'
  };

  // Extract frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];
    frontmatter.split('\n').forEach(line => {
      const [key, value] = line.split(':').map(s => s.trim());
      if (key && value) {
        metadata[key] = value;
      }
    });
  }

  return metadata;
}

/**
 * Generate email draft (cloud can only draft, not send)
 */
async function generateEmailDraft(taskPath, content, metadata) {
  console.log('📧 Generating email draft...');

  // Create draft in Pending_Approval
  const fileName = path.basename(taskPath);
  const draftFileName = `draft_${fileName}`;
  const draftPath = path.join(VAULT_PATH, 'Pending_Approval', 'email', draftFileName);

  // Ensure directory exists
  const draftDir = path.dirname(draftPath);
  if (!fs.existsSync(draftDir)) {
    fs.mkdirSync(draftDir, { recursive: true });
  }

  // Generate draft content
  const draftContent = `---
type: email_draft
priority: ${metadata.priority || 'normal'}
status: pending_approval
drafted_by: ${AGENT_ID}
drafted_at: ${new Date().toISOString()}
original_task: ${path.basename(taskPath)}
---

# Email Draft - Awaiting Approval

## Original Request
${content}

## Draft Reply

Subject: Re: ${metadata.subject || 'Your inquiry'}

Dear [Recipient],

Thank you for your email.

[DRAFT CONTENT - This is a placeholder. In production, use Claude API to generate actual reply based on the email content and Company Handbook guidelines]

Best regards,
[Your Name]

---

## Approval Instructions

**To approve and send this email:**
1. Review the draft above
2. Make any necessary edits
3. Move this file to: \`/Approved/email/${draftFileName}\`
4. Local agent will send the email using SMTP

**To reject:**
1. Move this file to: \`/Rejected/email/${draftFileName}\`
2. Add rejection reason in the file

---

**Security Note:** Cloud agent has NO email sending credentials. Only local agent can send emails after approval.
`;

  // Write draft file
  fs.writeFileSync(draftPath, draftContent);

  console.log(`📄 Draft created: ${draftPath}`);
}

/**
 * Generate social media draft (cloud can only draft, not post)
 */
async function generateSocialDraft(taskPath, content, metadata) {
  console.log('📱 Generating social media draft...');

  const fileName = path.basename(taskPath);
  const draftFileName = `draft_${fileName}`;
  const draftPath = path.join(VAULT_PATH, 'Pending_Approval', 'social', draftFileName);

  // Ensure directory exists
  const draftDir = path.dirname(draftPath);
  if (!fs.existsSync(draftDir)) {
    fs.mkdirSync(draftDir, { recursive: true });
  }

  // Generate draft content
  const draftContent = `---
type: social_media_draft
platform: linkedin
priority: ${metadata.priority || 'normal'}
status: pending_approval
drafted_by: ${AGENT_ID}
drafted_at: ${new Date().toISOString()}
original_task: ${path.basename(taskPath)}
---

# Social Media Post Draft - Awaiting Approval

## Original Request
${content}

## Draft Post

[DRAFT CONTENT - In production, use Claude API to generate engaging social media content based on Company Handbook and brand voice]

🚀 Exciting update from our AI Employee project!

We're thrilled to share that our Platinum Tier deployment is now live with 24/7 cloud operations. The system intelligently drafts responses while maintaining human oversight for all sensitive actions.

Key achievements:
✅ Always-on monitoring
✅ Automated draft generation
✅ Security-first architecture
✅ Complete audit trail

#AI #Automation #ProductivityTools #CloudComputing

---

## Approval Instructions

**To approve and post:**
1. Review the draft above
2. Make any necessary edits
3. Move this file to: \`/Approved/social/${draftFileName}\`
4. Local agent will post using LinkedIn API

**To reject:**
1. Move this file to: \`/Rejected/social/${draftFileName}\`

---

**Security Note:** Cloud agent has NO social media posting credentials. Only local agent can post after approval.
`;

  fs.writeFileSync(draftPath, draftContent);

  console.log(`📄 Draft created: ${draftPath}`);
}

/**
 * Generate generic draft for unknown task types
 */
async function generateGenericDraft(taskPath, content, metadata) {
  console.log('📋 Generating generic draft...');

  const fileName = path.basename(taskPath);
  const draftFileName = `draft_${fileName}`;
  const draftPath = path.join(VAULT_PATH, 'Pending_Approval', draftFileName);

  const draftContent = `---
type: generic_draft
priority: ${metadata.priority || 'normal'}
status: pending_approval
drafted_by: ${AGENT_ID}
drafted_at: ${new Date().toISOString()}
original_task: ${path.basename(taskPath)}
---

# Draft - Awaiting Approval

## Original Request
${content}

## Analysis & Recommendation

[DRAFT ANALYSIS - Cloud agent has analyzed this request]

**Task Type:** ${metadata.type || 'Unspecified'}
**Priority:** ${metadata.priority || 'Normal'}

**Recommended Action:**
[Recommendations would go here in production]

---

## Next Steps

Please review this draft and either:
1. Move to \`/Approved/\` to proceed
2. Move to \`/Rejected/\` to decline
3. Edit this file with your instructions and move to \`/Approved/\`
`;

  fs.writeFileSync(draftPath, draftContent);
  console.log(`📄 Draft created: ${draftPath}`);
}

/**
 * Sync vault with Git
 */
async function syncVault() {
  try {
    console.log(`\n[${new Date().toISOString()}] 🔄 Syncing vault...`);

    const result = vaultSync.sync();

    lastSyncTime = new Date().toISOString();

    if (result.success) {
      console.log(`✅ Vault sync successful`);
    } else {
      console.log(`⚠️  Vault sync completed with issues:`);
      result.errors.forEach(error => console.log(`   - ${error}`));
    }

    console.log('');
  } catch (error) {
    console.error('❌ Vault sync error:', error.message);
  }
}

/**
 * Main agent loop
 */
async function main() {
  console.log('🎯 Cloud Agent is now running...\n');

  // Initial vault sync
  await syncVault();

  // Set up periodic vault sync
  setInterval(syncVault, SYNC_INTERVAL);

  // Set up periodic task checking
  setInterval(processTasks, CHECK_INTERVAL);

  // Keep process alive
  process.on('SIGTERM', () => {
    console.log('\n📛 Received SIGTERM signal. Shutting down gracefully...');
    healthServer.close(() => {
      console.log('✅ Health server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('\n📛 Received SIGINT signal. Shutting down gracefully...');
    healthServer.close(() => {
      console.log('✅ Health server closed');
      process.exit(0);
    });
  });

  console.log('✨ Cloud Agent ready to process tasks!\n');
}

// Start the agent
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
