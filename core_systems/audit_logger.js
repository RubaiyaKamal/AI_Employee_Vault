/**
 * Audit Logger
 * Comprehensive audit logging system for Gold Tier
 * Gold Tier - Personal AI Employee System
 */

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class AuditLogger {
  constructor(config = {}) {
    this.config = config;
    this.logDir = config.logDir || './logs/audit';
    this.logLevel = config.logLevel || 'info';
    this.maxFileSize = config.maxFileSize || 10 * 1024 * 1024; // 10MB
    this.bufferSize = config.bufferSize || 100;
    this.logBuffer = [];

    this.ensureLogDirectory();
    this.currentLogFile = this.getLogFilePath();
  }

  async ensureLogDirectory() {
    await fs.mkdir(this.logDir, { recursive: true });
  }

  getLogFilePath() {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `audit_${date}.log`);
  }

  async log(level, category, action, details, userId = null, sessionId = null) {
    if (!this.shouldLog(level)) return;

    const auditEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      category,
      action,
      details,
      userId,
      sessionId,
      metadata: {
        hostname: require('os').hostname(),
        processId: process.pid
      }
    };

    this.logBuffer.push(JSON.stringify(auditEntry));

    if (this.logBuffer.length >= this.bufferSize) {
      await this.flushBuffer();
    }

    return auditEntry.id;
  }

  shouldLog(level) {
    const levels = ['debug', 'info', 'warn', 'error', 'fatal'];
    const currentLevelIndex = levels.indexOf(this.logLevel.toLowerCase());
    const messageLevelIndex = levels.indexOf(level.toLowerCase());
    return messageLevelIndex >= currentLevelIndex;
  }

  async flushBuffer() {
    if (this.logBuffer.length === 0) return;

    try {
      const logEntry = this.logBuffer.join('\n') + '\n';
      await fs.appendFile(this.currentLogFile, logEntry);
      this.logBuffer = [];
    } catch (error) {
      console.error('Error flushing audit log buffer:', error);
    }
  }

  async info(category, action, details, userId, sessionId) {
    return await this.log('info', category, action, details, userId, sessionId);
  }

  async warn(category, action, details, userId, sessionId) {
    return await this.log('warn', category, action, details, userId, sessionId);
  }

  async error(category, action, details, userId, sessionId) {
    return await this.log('error', category, action, details, userId, sessionId);
  }

  async shutdown() {
    await this.flushBuffer();
  }
}

module.exports = AuditLogger;
