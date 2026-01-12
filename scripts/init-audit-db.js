#!/usr/bin/env node

/**
 * Gold Tier - Audit Database Initialization Script
 *
 * Initializes the audit logging database structure and creates
 * necessary index files for efficient audit log retrieval.
 */

const fs = require('fs').promises;
const path = require('path');

const AUDIT_DATA_DIR = path.join(__dirname, '..', 'data', 'audits');
const AUDIT_LOG_DIR = path.join(__dirname, '..', 'logs', 'audit');

async function ensureDirectoryExists(dir) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
    console.log(`✓ Created directory: ${dir}`);
  }
}

async function createIndexFile(filePath, content) {
  try {
    await fs.access(filePath);
    console.log(`  Index file already exists: ${path.basename(filePath)}`);
  } catch {
    await fs.writeFile(filePath, content);
    console.log(`✓ Created index file: ${path.basename(filePath)}`);
  }
}

async function initializeAuditDatabase() {
  console.log('Initializing audit database...\n');

  // Ensure directories exist
  await ensureDirectoryExists(AUDIT_DATA_DIR);
  await ensureDirectoryExists(AUDIT_LOG_DIR);

  // Create audit index files
  const auditIndexPath = path.join(AUDIT_DATA_DIR, 'audit_index.json');
  const initialAuditIndex = JSON.stringify({
    version: '1.0.0',
    created: new Date().toISOString(),
    audits: [],
    lastAuditId: 0
  }, null, 2);
  await createIndexFile(auditIndexPath, initialAuditIndex);

  // Create log index for efficient searching
  const logIndexPath = path.join(AUDIT_LOG_DIR, 'log_index.json');
  const initialLogIndex = JSON.stringify({
    version: '1.0.0',
    created: new Date().toISOString(),
    indices: {
      byCategory: {},
      byLevel: {},
      byUserId: {},
      byDate: {}
    }
  }, null, 2);
  await createIndexFile(logIndexPath, initialLogIndex);

  // Create retention policy file
  const retentionPolicyPath = path.join(AUDIT_DATA_DIR, 'retention_policy.json');
  const retentionPolicy = JSON.stringify({
    version: '1.0.0',
    policies: {
      audit_logs: {
        retention_days: 90,
        archive_after_days: 30,
        cleanup_enabled: true
      },
      audit_reports: {
        retention_days: 365,
        archive_after_days: 90,
        cleanup_enabled: false
      }
    },
    last_cleanup: null,
    next_cleanup: null
  }, null, 2);
  await createIndexFile(retentionPolicyPath, retentionPolicy);

  // Create metadata file
  const metadataPath = path.join(AUDIT_DATA_DIR, 'metadata.json');
  const metadata = JSON.stringify({
    system_id: 'gold-tier-ai-employee',
    environment: process.env.NODE_ENV || 'production',
    initialized: new Date().toISOString(),
    schema_version: '1.0.0',
    capabilities: [
      'audit_logging',
      'weekly_audits',
      'ceo_briefings',
      'compliance_reports',
      'log_analysis'
    ]
  }, null, 2);
  await createIndexFile(metadataPath, metadata);

  console.log('\n✓ Audit database initialization complete!');
  console.log(`  Audit data directory: ${AUDIT_DATA_DIR}`);
  console.log(`  Audit log directory: ${AUDIT_LOG_DIR}`);
}

// Run initialization
initializeAuditDatabase().catch(error => {
  console.error('✗ Error initializing audit database:', error.message);
  process.exit(1);
});
