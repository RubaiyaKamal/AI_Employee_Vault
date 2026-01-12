#!/usr/bin/env node

/**
 * Gold Tier - Configuration Validation Script
 *
 * Validates all configuration files and environment variables
 * to ensure the Gold Tier system can start properly.
 */

const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const CONFIG_DIR = path.join(__dirname, '..', 'config');

let hasErrors = false;
let hasWarnings = false;

function logError(message) {
  console.error(`✗ ERROR: ${message}`);
  hasErrors = true;
}

function logWarning(message) {
  console.warn(`⚠ WARNING: ${message}`);
  hasWarnings = true;
}

function logSuccess(message) {
  console.log(`✓ ${message}`);
}

async function validateFileExists(filePath, description) {
  try {
    await fs.access(filePath);
    logSuccess(`${description} found: ${path.basename(filePath)}`);
    return true;
  } catch {
    logError(`${description} not found: ${filePath}`);
    return false;
  }
}

async function validateJSONFile(filePath, description) {
  if (!await validateFileExists(filePath, description)) {
    return null;
  }

  try {
    const content = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(content);
    logSuccess(`${description} is valid JSON`);
    return data;
  } catch (error) {
    logError(`${description} has invalid JSON: ${error.message}`);
    return null;
  }
}

function validateEnvVar(name, required = true) {
  const value = process.env[name];
  if (!value) {
    if (required) {
      logError(`Required environment variable ${name} is not set`);
    } else {
      logWarning(`Optional environment variable ${name} is not set`);
    }
    return false;
  }
  logSuccess(`Environment variable ${name} is set`);
  return true;
}

async function validateMCPServersConfig() {
  console.log('\n=== Validating MCP Servers Configuration ===');

  const configPath = path.join(CONFIG_DIR, 'mcp_servers.json');
  const config = await validateJSONFile(configPath, 'MCP Servers Config');

  if (!config) return;

  const requiredServers = [
    'communication-mcp',
    'business-operations-mcp',
    'personal-assistance-mcp',
    'integration-mcp'
  ];

  for (const serverId of requiredServers) {
    if (!config.servers || !config.servers[serverId]) {
      logError(`MCP server ${serverId} not configured`);
    } else {
      const server = config.servers[serverId];
      if (!server.port) logError(`MCP server ${serverId} missing port`);
      if (!server.script) logError(`MCP server ${serverId} missing script path`);
      if (!server.capabilities) logWarning(`MCP server ${serverId} missing capabilities`);

      if (server.port && server.script && server.capabilities) {
        logSuccess(`MCP server ${serverId} configured correctly`);
      }
    }
  }
}

async function validateAuditConfig() {
  console.log('\n=== Validating Audit Configuration ===');

  const configPath = path.join(CONFIG_DIR, 'audit_config.json');
  const config = await validateJSONFile(configPath, 'Audit Config');

  if (!config) return;

  if (!config.logger) {
    logError('Audit config missing logger configuration');
  } else {
    if (!config.logger.logDir) logError('Audit config missing logDir');
    if (!config.logger.retentionDays) logWarning('Audit config missing retentionDays');
    if (config.logger.logDir && config.logger.retentionDays) {
      logSuccess('Audit logger configuration is valid');
    }
  }

  if (!config.auditDataDir) logError('Audit config missing auditDataDir');
  if (!config.reportOutputDir) logError('Audit config missing reportOutputDir');
}

async function validateEnvironmentVariables() {
  console.log('\n=== Validating Environment Variables ===');

  // Check if .env exists
  const envPath = path.join(__dirname, '..', '.env');
  await validateFileExists(envPath, '.env file');

  // Required variables
  console.log('\nRequired variables:');
  validateEnvVar('NODE_ENV', true);
  validateEnvVar('MCP_SERVER_PORT', true);

  // SMTP Configuration (required for communication)
  console.log('\nSMTP Configuration:');
  validateEnvVar('SMTP_HOST', true);
  validateEnvVar('SMTP_PORT', true);
  validateEnvVar('SMTP_USER', true);
  validateEnvVar('SMTP_PASS', true);

  // Optional integrations
  console.log('\nOptional Integrations:');
  validateEnvVar('LINKEDIN_CLIENT_ID', false);
  validateEnvVar('LINKEDIN_CLIENT_SECRET', false);
  validateEnvVar('GOOGLE_CALENDAR_CLIENT_ID', false);
  validateEnvVar('GOOGLE_CALENDAR_CLIENT_SECRET', false);
  validateEnvVar('DATABASE_URL', false);

  // Error recovery configuration
  console.log('\nError Recovery Configuration:');
  if (!process.env.CIRCUIT_BREAKER_THRESHOLD) {
    logWarning('CIRCUIT_BREAKER_THRESHOLD not set, using default: 5');
  }
  if (!process.env.MAX_RETRY_ATTEMPTS) {
    logWarning('MAX_RETRY_ATTEMPTS not set, using default: 3');
  }
}

async function validateDirectoryStructure() {
  console.log('\n=== Validating Directory Structure ===');

  const requiredDirs = [
    'logs/audit',
    'logs/mcp_servers',
    'data/audits',
    'data/briefings',
    'reports/audits',
    'reports/briefings',
    'config',
    'core_systems',
    'mcp_servers'
  ];

  for (const dir of requiredDirs) {
    const dirPath = path.join(__dirname, '..', dir);
    try {
      await fs.access(dirPath);
      logSuccess(`Directory exists: ${dir}`);
    } catch {
      logWarning(`Directory missing (will be created): ${dir}`);
    }
  }
}

async function validateScriptFiles() {
  console.log('\n=== Validating Core Scripts ===');

  const requiredScripts = [
    'core_systems/weekly_audit_runner.js',
    'core_systems/audit_scheduler.js',
    'core_systems/ceo_briefing_generator.js',
    'core_systems/error_recovery_manager.js',
    'core_systems/audit_logger.js',
    'mcp_servers/base_mcp_server.js',
    'mcp_servers/communication_mcp_server.js',
    'mcp_servers/business_operations_mcp_server.js',
    'mcp_servers/personal_assistance_mcp_server.js',
    'mcp_servers/integration_mcp_server.js'
  ];

  for (const script of requiredScripts) {
    const scriptPath = path.join(__dirname, '..', script);
    await validateFileExists(scriptPath, path.basename(script));
  }
}

async function runValidation() {
  console.log('==========================================');
  console.log('Gold Tier Configuration Validation');
  console.log('==========================================\n');

  await validateDirectoryStructure();
  await validateMCPServersConfig();
  await validateAuditConfig();
  await validateEnvironmentVariables();
  await validateScriptFiles();

  console.log('\n==========================================');
  if (hasErrors) {
    console.error('✗ Validation FAILED with errors');
    console.error('Please fix the errors above before starting the system');
    process.exit(1);
  } else if (hasWarnings) {
    console.warn('⚠ Validation completed with warnings');
    console.warn('The system may not have full functionality');
  } else {
    console.log('✓ Validation PASSED');
    console.log('All configuration is valid!');
  }
  console.log('==========================================\n');
}

// Run validation
runValidation().catch(error => {
  console.error('\n✗ Validation failed with exception:', error.message);
  process.exit(1);
});
