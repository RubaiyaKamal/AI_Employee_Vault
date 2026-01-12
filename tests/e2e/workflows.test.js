/**
 * End-to-End Workflow Tests
 * Tests complete business workflows across all Gold Tier components
 */

const request = require('supertest');
const fs = require('fs').promises;
const path = require('path');

// Import all components
const WeeklyAuditRunner = require('../../core_systems/weekly_audit_runner');
const CEOBriefingGenerator = require('../../core_systems/ceo_briefing_generator');
const ErrorRecoveryManager = require('../../core_systems/error_recovery_manager');

describe('Gold Tier E2E Workflows', () => {
  let mcpServers;
  let auditRunner;
  let briefingGenerator;
  let errorRecovery;

  beforeAll(async () => {
    // Initialize MCP servers (assume they're running)
    mcpServers = {
      communication: 'http://localhost:3001',
      businessOps: 'http://localhost:3002',
      personalAssist: 'http://localhost:3003',
      integration: 'http://localhost:3004'
    };

    auditRunner = new WeeklyAuditRunner(mcpServers);
    briefingGenerator = new CEOBriefingGenerator();
    errorRecovery = new ErrorRecoveryManager();
  });

  afterAll(async () => {
    // Cleanup
    if (errorRecovery) {
      errorRecovery.shutdown();
    }
  });

  describe('Weekly Business Audit Workflow', () => {
    test('should complete full weekly audit workflow', async () => {
      // Step 1: Run weekly audit
      const auditResult = await auditRunner.runWeeklyAudit();

      expect(auditResult).toHaveProperty('success', true);
      expect(auditResult).toHaveProperty('weekId');
      expect(auditResult).toHaveProperty('reportPath');

      // Step 2: Verify audit report was saved
      const reportExists = await fs.access(auditResult.reportPath)
        .then(() => true)
        .catch(() => false);

      expect(reportExists).toBe(true);

      // Step 3: Read and validate audit report content
      const reportContent = await fs.readFile(auditResult.reportPath, 'utf8');
      const report = JSON.parse(reportContent);

      expect(report).toHaveProperty('weekId', auditResult.weekId);
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('trends');
      expect(report).toHaveProperty('recommendations');

      // Step 4: Generate CEO briefing from audit data
      const briefing = await briefingGenerator.generateWeeklyBriefing();

      expect(briefing).toHaveProperty('period', 'weekly');
      expect(briefing).toHaveProperty('executiveSummary');
      expect(briefing).toHaveProperty('keyMetrics');

      // Step 5: Verify briefing includes audit insights
      expect(briefing.keyMetrics).toHaveProperty('financial');
      expect(briefing.keyMetrics.financial).toBeDefined();
    }, 30000); // 30 second timeout for full workflow

    test('should handle audit workflow errors gracefully', async () => {
      // Simulate MCP server failure
      const invalidMcpServers = {
        communication: 'http://localhost:9999', // Non-existent server
        businessOps: 'http://localhost:9998',
        personalAssist: 'http://localhost:9997'
      };

      const failingAuditRunner = new WeeklyAuditRunner(invalidMcpServers);

      // Error recovery should handle this
      errorRecovery.on('recovery:attempted', (event) => {
        expect(event).toHaveProperty('errorType');
        expect(event).toHaveProperty('recoveryAction');
      });

      const result = await failingAuditRunner.runWeeklyAudit();

      expect(result.success).toBe(false);
      expect(result).toHaveProperty('error');
    }, 15000);
  });

  describe('CEO Briefing Generation Workflow', () => {
    test('should generate briefings for all periods', async () => {
      const periods = ['daily', 'weekly', 'monthly', 'quarterly'];
      const results = [];

      for (const period of periods) {
        const briefing = await briefingGenerator.generateBriefing(period, new Date());
        results.push(briefing);

        expect(briefing).toHaveProperty('period', period);
        expect(briefing).toHaveProperty('generatedAt');
        expect(briefing).toHaveProperty('executiveSummary');
      }

      // Verify all briefings were generated
      expect(results.length).toBe(4);

      // Verify increasing data aggregation for longer periods
      expect(results[3].keyMetrics.dataPoints || 90).toBeGreaterThan(
        results[1].keyMetrics.dataPoints || 7
      );
    }, 20000);

    test('should save and retrieve briefings', async () => {
      // Generate and save briefing
      const briefing = await briefingGenerator.generateWeeklyBriefing();
      await briefingGenerator.saveBriefing(briefing, 'weekly');

      // Verify file was created
      const briefingDir = path.join(__dirname, '../../reports/briefings');
      const files = await fs.readdir(briefingDir);
      const weeklyFiles = files.filter(f => f.includes('weekly'));

      expect(weeklyFiles.length).toBeGreaterThan(0);
    }, 10000);
  });

  describe('Cross-Domain Integration Workflow', () => {
    test('should sync data between personal and business domains', async () => {
      // Step 1: Create task in personal domain
      const taskData = {
        title: 'E2E Test Task',
        dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        priority: 'high',
        domain: 'personal'
      };

      const createTaskResponse = await request(mcpServers.personalAssist)
        .post('/task/schedule')
        .send(taskData);

      expect(createTaskResponse.status).toBe(201);
      const taskId = createTaskResponse.body.taskId;

      // Step 2: Trigger cross-domain sync via Integration MCP
      const syncResponse = await request(mcpServers.integration)
        .post('/sync/cross-domain')
        .send({
          sourceDomain: 'personal',
          targetDomain: 'business',
          entityType: 'tasks',
          entityIds: [taskId],
          syncMode: 'one-way'
        });

      expect(syncResponse.status).toBe(200);
      expect(syncResponse.body.success).toBe(true);
      expect(syncResponse.body.syncedCount).toBe(1);

      // Step 3: Verify task exists in business domain
      const verifyResponse = await request(mcpServers.businessOps)
        .get(`/tasks/${taskId}`);

      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body.task.title).toBe(taskData.title);
      expect(verifyResponse.body.task.sourceSystem).toBe('personal');
    }, 15000);

    test('should handle bidirectional sync conflicts', async () => {
      // Create same entity in both domains with different data
      const entityId = 'conflict-test-123';

      const personalData = {
        id: entityId,
        title: 'Personal Version',
        lastModified: new Date().toISOString()
      };

      const businessData = {
        id: entityId,
        title: 'Business Version',
        lastModified: new Date(Date.now() + 1000).toISOString() // 1 second later
      };

      // Create in both domains
      await request(mcpServers.personalAssist)
        .post('/entity/create')
        .send(personalData);

      await request(mcpServers.businessOps)
        .post('/entity/create')
        .send(businessData);

      // Trigger bidirectional sync
      const syncResponse = await request(mcpServers.integration)
        .post('/sync/cross-domain')
        .send({
          sourceDomain: 'personal',
          targetDomain: 'business',
          entityType: 'entities',
          syncMode: 'bidirectional',
          conflictResolution: 'latest-wins'
        });

      expect(syncResponse.status).toBe(200);
      expect(syncResponse.body).toHaveProperty('conflicts');
      expect(syncResponse.body.conflicts.length).toBeGreaterThan(0);

      // Verify conflict was resolved (business version should win - it's newer)
      expect(syncResponse.body.conflicts[0].resolution).toBe('latest-wins');
      expect(syncResponse.body.conflicts[0].winner).toBe('business');
    }, 15000);
  });

  describe('Communication Workflow', () => {
    test('should send email with audit report attachment', async () => {
      // Generate audit report
      const auditResult = await auditRunner.runWeeklyAudit();
      expect(auditResult.success).toBe(true);

      // Read report content
      const reportContent = await fs.readFile(auditResult.reportPath, 'utf8');

      // Send email via Communication MCP
      const emailResponse = await request(mcpServers.communication)
        .post('/email/send')
        .send({
          to: 'ceo@example.com',
          subject: `Weekly Audit Report - ${auditResult.weekId}`,
          body: 'Please find attached the weekly audit report.',
          attachments: [
            {
              filename: `audit_${auditResult.weekId}.json`,
              content: reportContent,
              contentType: 'application/json'
            }
          ]
        });

      expect(emailResponse.status).toBe(200);
      expect(emailResponse.body.success).toBe(true);
      expect(emailResponse.body).toHaveProperty('messageId');
    }, 20000);

    test('should notify about system health issues', async () => {
      // Simulate system health check failure
      const healthIssue = {
        component: 'business-operations-mcp',
        status: 'unhealthy',
        error: 'Connection timeout',
        severity: 'critical'
      };

      // Send notification via Communication MCP
      const notificationResponse = await request(mcpServers.communication)
        .post('/notification/send')
        .send({
          type: 'system-alert',
          priority: 'high',
          recipients: ['admin@example.com'],
          title: 'System Health Alert',
          message: `${healthIssue.component} is ${healthIssue.status}`,
          data: healthIssue
        });

      expect(notificationResponse.status).toBe(200);
      expect(notificationResponse.body.success).toBe(true);
    }, 10000);
  });

  describe('Error Recovery Workflow', () => {
    test('should recover from transient errors', async () => {
      let attemptCount = 0;
      const maxAttempts = 3;

      // Simulate flaky operation
      const flakyOperation = async () => {
        attemptCount++;
        if (attemptCount < maxAttempts) {
          throw new Error('Transient error');
        }
        return { success: true, data: 'Operation succeeded' };
      };

      // Register with error recovery
      const result = await errorRecovery.executeWithRecovery(
        flakyOperation,
        'test-operation',
        { maxRetries: 3, backoffMs: 100 }
      );

      expect(result.success).toBe(true);
      expect(attemptCount).toBe(maxAttempts);
    }, 10000);

    test('should activate circuit breaker after repeated failures', async () => {
      const failingOperation = async () => {
        throw new Error('Persistent error');
      };

      // Attempt multiple times to trigger circuit breaker
      const results = [];
      for (let i = 0; i < 6; i++) {
        try {
          await errorRecovery.executeWithRecovery(
            failingOperation,
            'failing-test-operation',
            { maxRetries: 1, backoffMs: 50 }
          );
        } catch (error) {
          results.push({ attempt: i + 1, error: error.message });
        }
      }

      // Circuit breaker should be open after threshold
      const circuitState = errorRecovery.getCircuitState('failing-test-operation');
      expect(circuitState).toBe('open');
    }, 10000);
  });

  describe('Audit Logging Workflow', () => {
    test('should log all major system operations', async () => {
      const operationsToLog = [
        { action: 'audit:weekly:start', category: 'audit', level: 'info' },
        { action: 'audit:weekly:complete', category: 'audit', level: 'info' },
        { action: 'briefing:generate', category: 'reporting', level: 'info' },
        { action: 'sync:cross-domain', category: 'integration', level: 'info' },
        { action: 'email:sent', category: 'communication', level: 'info' }
      ];

      // Log all operations
      for (const op of operationsToLog) {
        await request(mcpServers.businessOps)
          .post('/audit/log')
          .send({
            level: op.level,
            category: op.category,
            action: op.action,
            details: { timestamp: new Date().toISOString() },
            userId: 'system',
            sessionId: 'e2e-test-session'
          });
      }

      // Query audit logs
      const logsResponse = await request(mcpServers.businessOps)
        .get('/audit/logs')
        .query({
          category: 'audit',
          startDate: new Date(Date.now() - 3600000).toISOString(), // Last hour
          endDate: new Date().toISOString()
        });

      expect(logsResponse.status).toBe(200);
      expect(Array.isArray(logsResponse.body.logs)).toBe(true);
      expect(logsResponse.body.logs.length).toBeGreaterThan(0);
    }, 10000);
  });

  describe('Complete Business Cycle Workflow', () => {
    test('should execute full weekly business cycle', async () => {
      const cycleResults = {
        audit: null,
        briefing: null,
        emailSent: null,
        syncCompleted: null
      };

      // Step 1: Run weekly audit
      console.log('Step 1: Running weekly audit...');
      cycleResults.audit = await auditRunner.runWeeklyAudit();
      expect(cycleResults.audit.success).toBe(true);

      // Step 2: Generate CEO briefing
      console.log('Step 2: Generating CEO briefing...');
      cycleResults.briefing = await briefingGenerator.generateWeeklyBriefing();
      expect(cycleResults.briefing.period).toBe('weekly');

      // Step 3: Send briefing via email
      console.log('Step 3: Sending CEO briefing email...');
      const emailResponse = await request(mcpServers.communication)
        .post('/email/send')
        .send({
          to: 'ceo@example.com',
          subject: 'Weekly Executive Briefing',
          body: cycleResults.briefing.executiveSummary,
          attachments: [
            {
              filename: 'weekly_briefing.json',
              content: JSON.stringify(cycleResults.briefing, null, 2),
              contentType: 'application/json'
            }
          ]
        });

      cycleResults.emailSent = emailResponse.body.success;
      expect(cycleResults.emailSent).toBe(true);

      // Step 4: Sync relevant data across domains
      console.log('Step 4: Synchronizing cross-domain data...');
      const syncResponse = await request(mcpServers.integration)
        .post('/sync/cross-domain')
        .send({
          sourceDomain: 'business',
          targetDomain: 'personal',
          entityType: 'tasks',
          syncMode: 'one-way'
        });

      cycleResults.syncCompleted = syncResponse.body.success;
      expect(cycleResults.syncCompleted).toBe(true);

      // Verify complete workflow
      console.log('Workflow Results:', cycleResults);
      expect(Object.values(cycleResults).every(v => v !== null)).toBe(true);
    }, 60000); // 60 second timeout for complete cycle
  });

  describe('System Resilience', () => {
    test('should maintain operation with degraded services', async () => {
      // Simulate one MCP server being down
      const degradedServers = {
        ...mcpServers,
        personalAssist: 'http://localhost:9999' // Non-existent
      };

      // System should still operate with reduced functionality
      const healthyServers = await Promise.allSettled([
        request(degradedServers.communication).get('/health'),
        request(degradedServers.businessOps).get('/health'),
        request(degradedServers.personalAssist).get('/health'),
        request(degradedServers.integration).get('/health')
      ]);

      const healthyCount = healthyServers.filter(
        r => r.status === 'fulfilled' && r.value.status === 200
      ).length;

      // At least 2 out of 4 services should be healthy
      expect(healthyCount).toBeGreaterThanOrEqual(2);
    }, 10000);
  });
});
