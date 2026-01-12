/**
 * Unit Tests for Audit Logger
 * Tests the comprehensive audit logging system
 */

const fs = require('fs').promises;
const path = require('path');

// Mock dependencies
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn().mockResolvedValue(undefined),
    appendFile: jest.fn().mockResolvedValue(undefined),
    stat: jest.fn().mockResolvedValue({ size: 1000 }),
    readdir: jest.fn().mockResolvedValue([])
  }
}));

// Import after mocking
const AuditLogger = require('../../core_systems/audit_logger');

describe('AuditLogger', () => {
  let auditLogger;
  const mockConfig = {
    logger: {
      logDir: './logs/audit',
      logLevel: 'info',
      maxFileSize: 10485760,
      retentionDays: 90,
      bufferSize: 100
    }
  };

  beforeEach(() => {
    auditLogger = new AuditLogger(mockConfig);
    jest.clearAllMocks();
  });

  afterEach(async () => {
    if (auditLogger) {
      await auditLogger.close();
    }
  });

  describe('Initialization', () => {
    test('should initialize with provided config', () => {
      expect(auditLogger.logDir).toBe('./logs/audit');
      expect(auditLogger.logLevel).toBe('info');
      expect(auditLogger.maxFileSize).toBe(10485760);
      expect(auditLogger.retentionDays).toBe(90);
      expect(auditLogger.bufferSize).toBe(100);
    });

    test('should use default config when not provided', () => {
      const defaultLogger = new AuditLogger({});
      expect(defaultLogger.logLevel).toBe('info');
      expect(defaultLogger.bufferSize).toBe(100);
    });

    test('should create log directory', async () => {
      expect(fs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('logs/audit'),
        { recursive: true }
      );
    });
  });

  describe('Logging', () => {
    test('should log INFO level message', async () => {
      await auditLogger.log(
        'info',
        'user_action',
        'login',
        { ip: '127.0.0.1' },
        'user123',
        'session456'
      );

      expect(auditLogger.logBuffer.length).toBe(1);
      const logEntry = JSON.parse(auditLogger.logBuffer[0]);
      expect(logEntry.level).toBe('INFO');
      expect(logEntry.category).toBe('user_action');
      expect(logEntry.action).toBe('login');
      expect(logEntry.details).toEqual({ ip: '127.0.0.1' });
      expect(logEntry.userId).toBe('user123');
      expect(logEntry.sessionId).toBe('session456');
      expect(logEntry.id).toBeTruthy();
      expect(logEntry.timestamp).toBeTruthy();
    });

    test('should log ERROR level message', async () => {
      await auditLogger.log(
        'error',
        'system_error',
        'database_connection_failed',
        { error: 'Connection timeout' },
        null,
        null
      );

      const logEntry = JSON.parse(auditLogger.logBuffer[0]);
      expect(logEntry.level).toBe('ERROR');
      expect(logEntry.category).toBe('system_error');
    });

    test('should log WARN level message', async () => {
      await auditLogger.log(
        'warn',
        'security',
        'suspicious_activity',
        { attempts: 3 }
      );

      const logEntry = JSON.parse(auditLogger.logBuffer[0]);
      expect(logEntry.level).toBe('WARN');
    });

    test('should convert log level to uppercase', async () => {
      await auditLogger.log('debug', 'test', 'test_action', {});
      const logEntry = JSON.parse(auditLogger.logBuffer[0]);
      expect(logEntry.level).toBe('DEBUG');
    });

    test('should generate unique UUID for each log entry', async () => {
      await auditLogger.log('info', 'test', 'action1', {});
      await auditLogger.log('info', 'test', 'action2', {});

      const entry1 = JSON.parse(auditLogger.logBuffer[0]);
      const entry2 = JSON.parse(auditLogger.logBuffer[1]);
      expect(entry1.id).not.toBe(entry2.id);
    });
  });

  describe('Buffer Management', () => {
    test('should add logs to buffer', async () => {
      await auditLogger.log('info', 'test', 'action', {});
      expect(auditLogger.logBuffer.length).toBe(1);
    });

    test('should flush buffer when reaching buffer size', async () => {
      auditLogger.bufferSize = 3;

      await auditLogger.log('info', 'test', 'action1', {});
      await auditLogger.log('info', 'test', 'action2', {});
      await auditLogger.log('info', 'test', 'action3', {});

      // Wait for flush
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(fs.appendFile).toHaveBeenCalled();
      expect(auditLogger.logBuffer.length).toBe(0);
    });

    test('should manually flush buffer', async () => {
      await auditLogger.log('info', 'test', 'action', {});
      await auditLogger.flush();

      expect(fs.appendFile).toHaveBeenCalled();
      expect(auditLogger.logBuffer.length).toBe(0);
    });

    test('should not flush empty buffer', async () => {
      await auditLogger.flush();
      expect(fs.appendFile).not.toHaveBeenCalled();
    });
  });

  describe('File Rotation', () => {
    test('should check file size before writing', async () => {
      await auditLogger.log('info', 'test', 'action', {});
      await auditLogger.flush();

      expect(fs.stat).toHaveBeenCalled();
    });

    test('should rotate file when exceeding max size', async () => {
      // Mock large file size
      fs.stat.mockResolvedValue({ size: 11000000 }); // 11MB

      await auditLogger.log('info', 'test', 'action', {});
      await auditLogger.flush();

      // Should have created new log file with timestamp
      expect(auditLogger.currentLogFile).toContain('.log');
    });
  });

  describe('Helper Methods', () => {
    test('logInfo should log at INFO level', async () => {
      await auditLogger.logInfo('test', 'action', { data: 'test' });
      const logEntry = JSON.parse(auditLogger.logBuffer[0]);
      expect(logEntry.level).toBe('INFO');
    });

    test('logWarn should log at WARN level', async () => {
      await auditLogger.logWarn('test', 'action', { data: 'test' });
      const logEntry = JSON.parse(auditLogger.logBuffer[0]);
      expect(logEntry.level).toBe('WARN');
    });

    test('logError should log at ERROR level', async () => {
      await auditLogger.logError('test', 'action', { data: 'test' });
      const logEntry = JSON.parse(auditLogger.logBuffer[0]);
      expect(logEntry.level).toBe('ERROR');
    });

    test('logDebug should log at DEBUG level', async () => {
      await auditLogger.logDebug('test', 'action', { data: 'test' });
      const logEntry = JSON.parse(auditLogger.logBuffer[0]);
      expect(logEntry.level).toBe('DEBUG');
    });
  });

  describe('Cleanup', () => {
    test('should close and flush buffer', async () => {
      await auditLogger.log('info', 'test', 'action', {});
      await auditLogger.close();

      expect(fs.appendFile).toHaveBeenCalled();
      expect(auditLogger.logBuffer.length).toBe(0);
    });

    test('should clear flush interval on close', async () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      await auditLogger.close();
      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle file write errors gracefully', async () => {
      fs.appendFile.mockRejectedValue(new Error('Write failed'));

      await auditLogger.log('info', 'test', 'action', {});
      await expect(auditLogger.flush()).rejects.toThrow('Write failed');
    });

    test('should handle stat errors during rotation check', async () => {
      fs.stat.mockRejectedValue(new Error('File not found'));

      await auditLogger.log('info', 'test', 'action', {});
      await auditLogger.flush();

      // Should still append to file despite stat error
      expect(fs.appendFile).toHaveBeenCalled();
    });
  });
});
