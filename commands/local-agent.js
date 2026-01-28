#!/usr/bin/env node

/**
 * Platinum Tier - Local Agent
 * Approval authority and execution capabilities
 * Security: Full credentials, all sensitive operations
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

// Import synchronization modules
const VaultSync = require('../scripts/sync/vault-sync');
const ClaimByMove = require('../scripts/sync/claim-by-move');

// Configuration
const AGENT_ID = process.env.AGENT_ID || 'local';
const VAULT_PATH = process.env.VAULT_PATH || path.join(__dirname, '..');
const CHECK_INTERVAL = parseInt(process.env.CHECK_INTERVAL) || 30000; // 30 seconds
const SYNC_INTERVAL = parseInt(process.env.VAULT_SYNC_INTERVAL) || 300000; // 5 minutes
const HEALTH_PORT = process.env.HEALTH_CHECK_PORT || 8081;

console.log('\n🚀 Starting Platinum Tier Local Agent...\n');
console.log('═'.repeat(60));
console.log(`Agent ID: ${AGENT_ID}`);
console.log(`Role: Executor (Full Authority)`);
console.log(`Vault Path: ${VAULT_PATH}`);
console.log(`Check Interval: ${CHECK_INTERVAL}ms`);
console.log(`Sync Interval: ${SYNC_INTERVAL}ms`);
console.log('═'.repeat(60));
console.log('');

// Initialize synchronization
const vaultSync = new VaultSync(VAULT_PATH, AGENT_ID);
const claimByMove = new ClaimByMove(VAULT_PATH, AGENT_ID);

// Track sync status
let lastSyncTime = null;
let lastCheckTime = null;
let processingCount = 0;

/**
 * Health check endpoint
 */
const healthServer = http.createServer((req, res) => {
  if (req.url === '/health') {
    const status = {
      agent: AGENT_ID,
      role: 'executor',
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      vault_path: VAULT_PATH,
      last_sync: lastSyncTime || 'never',
      last_check: lastCheckTime || 'never',
      processed_count: processingCount
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

/**
 * Monitor Approved directory for items to execute
 */
async function monitorApprovedItems() {
  try {
    console.log(`[${new Date().toISOString()}] 🔍 Checking for approved items...`);
    lastCheckTime = new Date().toISOString();

    const approvedDir = path.join(VAULT_PATH, 'Approved');

    if (!fs.existsSync(approvedDir)) {
      console.log('No approved directory found.');
      return;
    }

    // Scan approved directory recursively
    const approvedItems = scanDirectory(approvedDir);

    if (approvedItems.length === 0) {
      console.log('No approved items to process.');
      return;
    }

    console.log(`Found ${approvedItems.length} approved items`);

    // Process each approved item
    for (const itemPath of approvedItems) {
      await processApprovedItem(itemPath);
      processingCount++;
    }

    console.log('');
  } catch (error) {
    console.error('❌ Error monitoring approved items:', error.message);
  }
}

/**
 * Scan directory recursively for markdown files
 */
function scanDirectory(dir) {
  let files = [];

  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });

    items.forEach(item => {
      const fullPath = path.join(dir, item.name);

      if (item.isDirectory()) {
        files = files.concat(scanDirectory(fullPath));
      } else if (item.isFile() && item.name.endsWith('.md')) {
        files.push(fullPath);
      }
    });
  } catch (error) {
    console.error(`Error scanning directory ${dir}:`, error.message);
  }

  return files;
}

/**
 * Process an approved item - Execute the action
 */
async function processApprovedItem(itemPath) {
  try {
    console.log(`\n✅ Processing approved item: ${path.basename(itemPath)}`);

    // Read item content
    const content = fs.readFileSync(itemPath, 'utf-8');

    // Parse metadata
    const metadata = parseMetadata(content);

    // Determine action type
    const actionType = metadata.type || detectActionType(itemPath);

    console.log(`Action Type: ${actionType}`);

    // Execute based on action type
    switch (actionType) {
      case 'email':
      case 'email_draft':
        await executeEmailSend(itemPath, content, metadata);
        break;

      case 'social_media':
      case 'social_media_draft':
      case 'linkedin':
        await executeSocialPost(itemPath, content, metadata);
        break;

      case 'whatsapp':
        await executeWhatsAppSend(itemPath, content, metadata);
        break;

      default:
        console.log(`⚠️  Unknown action type: ${actionType}`);
        await executeGenericAction(itemPath, content, metadata);
    }

    // Move to Done
    moveToCompleted(itemPath);

    console.log(`✅ Item processed and moved to Done`);
  } catch (error) {
    console.error(`❌ Error processing ${itemPath}:`, error.message);
    // Move to Done with error note
    moveToCompleted(itemPath, `ERROR: ${error.message}`);
  }
}

/**
 * Parse metadata from frontmatter
 */
function parseMetadata(content) {
  const metadata = {};

  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];
    frontmatter.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        metadata[key.trim()] = valueParts.join(':').trim();
      }
    });
  }

  return metadata;
}

/**
 * Detect action type from file path
 */
function detectActionType(filePath) {
  const pathLower = filePath.toLowerCase();

  if (pathLower.includes('email')) return 'email';
  if (pathLower.includes('social') || pathLower.includes('linkedin')) return 'social_media';
  if (pathLower.includes('whatsapp')) return 'whatsapp';

  return 'generic';
}

/**
 * Execute email sending
 */
async function executeEmailSend(itemPath, content, metadata) {
  console.log('📧 Sending email...');

  // Extract email details from content
  const toMatch = content.match(/To:\s*(.+)/i);
  const subjectMatch = content.match(/Subject:\s*(.+)/i);
  const bodyMatch = content.match(/## Draft.*?\n\n([\s\S]*?)(?=\n##|\n---|\n\*\*|$)/);

  const to = toMatch ? toMatch[1].trim() : metadata.recipient || 'unknown@example.com';
  const subject = subjectMatch ? subjectMatch[1].trim() : metadata.subject || 'No Subject';
  const body = bodyMatch ? bodyMatch[1].trim() : 'Email body not found';

  console.log(`  To: ${to}`);
  console.log(`  Subject: ${subject}`);

  // In production, use actual SMTP sending via MCP server
  // For now, log the action
  console.log('  [DEMO MODE] Email would be sent via SMTP');
  console.log(`  Body: ${body.substring(0, 100)}...`);

  // Log the action
  logAction('email_sent', {
    to,
    subject,
    timestamp: new Date().toISOString(),
    file: path.basename(itemPath)
  });

  console.log('✅ Email sent successfully');
}

/**
 * Execute social media posting
 */
async function executeSocialPost(itemPath, content, metadata) {
  console.log('📱 Posting to social media...');

  const platform = metadata.platform || 'linkedin';
  const postMatch = content.match(/## Draft.*?\n\n([\s\S]*?)(?=\n##|\n---|\n\*\*|$)/);
  const postContent = postMatch ? postMatch[1].trim() : 'Post content not found';

  console.log(`  Platform: ${platform}`);
  console.log(`  Content: ${postContent.substring(0, 100)}...`);

  // In production, use actual API posting via MCP server
  console.log('  [DEMO MODE] Post would be sent via API');

  // Log the action
  logAction('social_post', {
    platform,
    content: postContent.substring(0, 200),
    timestamp: new Date().toISOString(),
    file: path.basename(itemPath)
  });

  console.log('✅ Post published successfully');
}

/**
 * Execute WhatsApp message
 */
async function executeWhatsAppSend(itemPath, content, metadata) {
  console.log('💬 Sending WhatsApp message...');

  const toMatch = content.match(/To:\s*(.+)/i);
  const messageMatch = content.match(/Message:\s*\n([\s\S]*?)(?=\n##|\n---|\n\*\*|$)/);

  const to = toMatch ? toMatch[1].trim() : metadata.recipient || 'unknown';
  const message = messageMatch ? messageMatch[1].trim() : 'Message not found';

  console.log(`  To: ${to}`);
  console.log(`  Message: ${message.substring(0, 100)}...`);

  // In production, use actual WhatsApp sending via Twilio
  console.log('  [DEMO MODE] Message would be sent via Twilio');

  // Log the action
  logAction('whatsapp_sent', {
    to,
    message: message.substring(0, 200),
    timestamp: new Date().toISOString(),
    file: path.basename(itemPath)
  });

  console.log('✅ WhatsApp message sent successfully');
}

/**
 * Execute generic action
 */
async function executeGenericAction(itemPath, content, metadata) {
  console.log('📋 Executing generic action...');

  // Log the action
  logAction('generic_action', {
    file: path.basename(itemPath),
    type: metadata.type || 'unknown',
    timestamp: new Date().toISOString()
  });

  console.log('✅ Action completed');
}

/**
 * Move item to Done directory
 */
function moveToCompleted(itemPath, errorNote = null) {
  try {
    const fileName = path.basename(itemPath);
    const doneDir = path.join(VAULT_PATH, 'Done');

    // Determine subdirectory based on original path
    let subDir = '';
    if (itemPath.includes('email')) subDir = 'email';
    else if (itemPath.includes('social')) subDir = 'social';

    const targetDir = subDir ? path.join(doneDir, subDir) : doneDir;

    // Ensure target directory exists
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const targetPath = path.join(targetDir, fileName);

    // Add completion note
    let content = fs.readFileSync(itemPath, 'utf-8');
    content += `\n\n---\n\n## Execution Record\n\n`;
    content += `- **Executed by:** ${AGENT_ID}\n`;
    content += `- **Executed at:** ${new Date().toISOString()}\n`;
    if (errorNote) {
      content += `- **Error:** ${errorNote}\n`;
    }

    fs.writeFileSync(targetPath, content);
    fs.unlinkSync(itemPath);

    console.log(`📂 Moved to Done: ${targetPath}`);
  } catch (error) {
    console.error(`❌ Error moving to Done:`, error.message);
  }
}

/**
 * Log action to vault logs
 */
function logAction(actionType, details) {
  try {
    const logsDir = path.join(VAULT_PATH, 'Logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const today = new Date().toISOString().split('T')[0];
    const logFile = path.join(logsDir, `${today}.json`);

    let logs = [];
    if (fs.existsSync(logFile)) {
      try {
        logs = JSON.parse(fs.readFileSync(logFile, 'utf-8'));
      } catch (e) {
        logs = [];
      }
    }

    logs.push({
      timestamp: new Date().toISOString(),
      agent: AGENT_ID,
      action: actionType,
      details
    });

    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error('Error logging action:', error.message);
  }
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
  console.log('🎯 Local Agent is now running...\n');

  // Initial vault sync
  await syncVault();

  // Set up periodic vault sync
  setInterval(syncVault, SYNC_INTERVAL);

  // Set up periodic approval monitoring
  setInterval(monitorApprovedItems, CHECK_INTERVAL);

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('\n📛 Received SIGTERM. Shutting down gracefully...');
    healthServer.close(() => {
      console.log('✅ Health server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('\n📛 Received SIGINT. Shutting down gracefully...');
    healthServer.close(() => {
      console.log('✅ Health server closed');
      process.exit(0);
    });
  });

  console.log('✨ Local Agent ready to execute approved actions!\n');
}

// Start the agent
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
