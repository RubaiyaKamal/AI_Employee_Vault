/**
 * Integration Tests for MCP Servers
 * Tests the interaction between different MCP servers
 */

const request = require('supertest');
const express = require('express');

// Mock MCP servers
const CommunicationMCPServer = require('../../mcp_servers/communication_mcp_server');
const BusinessOperationsMCPServer = require('../../mcp_servers/business_operations_mcp_server');
const PersonalAssistanceMCPServer = require('../../mcp_servers/personal_assistance_mcp_server');
const IntegrationMCPServer = require('../../mcp_servers/integration_mcp_server');

describe('MCP Servers Integration Tests', () => {
  let commServer, businessServer, personalServer, integrationServer;
  let commApp, businessApp, personalApp, integrationApp;

  beforeAll(async () => {
    // Initialize all MCP servers
    commServer = new CommunicationMCPServer({
      serverId: 'communication-mcp-test',
      port: 4001
    });
    commApp = commServer.app;

    businessServer = new BusinessOperationsMCPServer({
      serverId: 'business-ops-mcp-test',
      port: 4002
    });
    businessApp = businessServer.app;

    personalServer = new PersonalAssistanceMCPServer({
      serverId: 'personal-assist-mcp-test',
      port: 4003
    });
    personalApp = personalServer.app;

    integrationServer = new IntegrationMCPServer({
      serverId: 'integration-mcp-test',
      port: 4004,
      mcpServers: {
        communication: 'http://localhost:4001',
        businessOps: 'http://localhost:4002',
        personalAssist: 'http://localhost:4003'
      }
    });
    integrationApp = integrationServer.app;
  });

  afterAll(async () => {
    // Cleanup
    if (commServer) await commServer.close();
    if (businessServer) await businessServer.close();
    if (personalServer) await personalServer.close();
    if (integrationServer) await integrationServer.close();
  });

  describe('Health Checks', () => {
    test('Communication MCP should be healthy', async () => {
      const response = await request(commApp)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('serverId', 'communication-mcp-test');
      expect(response.body).toHaveProperty('uptime');
    });

    test('Business Operations MCP should be healthy', async () => {
      const response = await request(businessApp)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('serverId', 'business-ops-mcp-test');
    });

    test('Personal Assistance MCP should be healthy', async () => {
      const response = await request(personalApp)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('serverId', 'personal-assist-mcp-test');
    });

    test('Integration MCP should be healthy', async () => {
      const response = await request(integrationApp)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('serverId', 'integration-mcp-test');
    });
  });

  describe('Capabilities Endpoints', () => {
    test('Communication MCP should list email capabilities', async () => {
      const response = await request(commApp)
        .get('/capabilities')
        .expect(200);

      expect(Array.isArray(response.body.capabilities)).toBe(true);
      expect(response.body.capabilities).toContain('email-send');
      expect(response.body.capabilities).toContain('email-receive');
    });

    test('Business Operations MCP should list financial capabilities', async () => {
      const response = await request(businessApp)
        .get('/capabilities')
        .expect(200);

      expect(response.body.capabilities).toContain('financial-report');
      expect(response.body.capabilities).toContain('audit-log');
    });

    test('Personal Assistance MCP should list calendar capabilities', async () => {
      const response = await request(personalApp)
        .get('/capabilities')
        .expect(200);

      expect(response.body.capabilities).toContain('calendar-manage');
      expect(response.body.capabilities).toContain('task-schedule');
    });

    test('Integration MCP should list orchestration capabilities', async () => {
      const response = await request(integrationApp)
        .get('/capabilities')
        .expect(200);

      expect(response.body.capabilities).toContain('data-sync');
      expect(response.body.capabilities).toContain('workflow-orchestrate');
    });
  });

  describe('Communication MCP - Email Operations', () => {
    test('should send email successfully', async () => {
      const emailData = {
        to: 'test@example.com',
        subject: 'Test Email',
        body: 'This is a test email',
        from: 'ai-employee@example.com'
      };

      const response = await request(commApp)
        .post('/email/send')
        .send(emailData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('messageId');
    });

    test('should validate email data', async () => {
      const invalidEmail = {
        to: 'invalid-email',
        subject: 'Test'
      };

      await request(commApp)
        .post('/email/send')
        .send(invalidEmail)
        .expect(400);
    });

    test('should retrieve recent emails', async () => {
      const response = await request(commApp)
        .get('/email/recent')
        .query({ limit: 10 })
        .expect(200);

      expect(Array.isArray(response.body.emails)).toBe(true);
    });
  });

  describe('Business Operations MCP - Financial Reports', () => {
    test('should generate financial report', async () => {
      const reportRequest = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        reportType: 'monthly'
      };

      const response = await request(businessApp)
        .post('/financial/report')
        .send(reportRequest)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('report');
      expect(response.body.report).toHaveProperty('revenue');
      expect(response.body.report).toHaveProperty('expenses');
    });

    test('should validate date ranges', async () => {
      const invalidRequest = {
        startDate: '2024-02-01',
        endDate: '2024-01-01' // End before start
      };

      await request(businessApp)
        .post('/financial/report')
        .send(invalidRequest)
        .expect(400);
    });

    test('should run compliance check', async () => {
      const complianceRequest = {
        standards: ['GDPR', 'SOX'],
        scope: 'full'
      };

      const response = await request(businessApp)
        .post('/compliance/check')
        .send(complianceRequest)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
    });
  });

  describe('Personal Assistance MCP - Calendar Management', () => {
    test('should create calendar event', async () => {
      const eventData = {
        title: 'Team Meeting',
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T11:00:00Z',
        attendees: ['user1@example.com', 'user2@example.com']
      };

      const response = await request(personalApp)
        .post('/calendar/event')
        .send(eventData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('eventId');
    });

    test('should schedule task', async () => {
      const taskData = {
        title: 'Complete report',
        dueDate: '2024-01-20T17:00:00Z',
        priority: 'high',
        assignee: 'user@example.com'
      };

      const response = await request(personalApp)
        .post('/task/schedule')
        .send(taskData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('taskId');
    });

    test('should set reminder', async () => {
      const reminderData = {
        title: 'Meeting in 30 minutes',
        triggerTime: '2024-01-15T09:30:00Z',
        recipient: 'user@example.com'
      };

      const response = await request(personalApp)
        .post('/reminder/set')
        .send(reminderData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('reminderId');
    });
  });

  describe('Integration MCP - Cross-Domain Synchronization', () => {
    test('should sync data across domains', async () => {
      const syncRequest = {
        sourceDomain: 'personal',
        targetDomain: 'business',
        entityType: 'contacts',
        syncMode: 'bidirectional'
      };

      const response = await request(integrationApp)
        .post('/sync/cross-domain')
        .send(syncRequest)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('syncedCount');
      expect(response.body).toHaveProperty('conflicts');
    });

    test('should correlate events', async () => {
      const correlationRequest = {
        eventIds: ['event1', 'event2', 'event3'],
        correlationType: 'temporal'
      };

      const response = await request(integrationApp)
        .post('/event/correlate')
        .send(correlationRequest)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('correlations');
      expect(Array.isArray(response.body.correlations)).toBe(true);
    });

    test('should execute workflow', async () => {
      const workflowRequest = {
        workflowId: 'weekly-report-generation',
        parameters: {
          startDate: '2024-01-01',
          endDate: '2024-01-07'
        },
        steps: [
          { action: 'collect-data', mcpServer: 'business-ops' },
          { action: 'generate-report', mcpServer: 'business-ops' },
          { action: 'send-email', mcpServer: 'communication' }
        ]
      };

      const response = await request(integrationApp)
        .post('/workflow/execute')
        .send(workflowRequest)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('workflowExecutionId');
      expect(response.body).toHaveProperty('status');
    });
  });

  describe('Error Handling', () => {
    test('should handle 404 for unknown endpoints', async () => {
      await request(commApp)
        .get('/unknown/endpoint')
        .expect(404);
    });

    test('should handle malformed JSON', async () => {
      await request(commApp)
        .post('/email/send')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
    });

    test('should handle missing required fields', async () => {
      await request(commApp)
        .post('/email/send')
        .send({}) // No required fields
        .expect(400);
    });

    test('should return proper error messages', async () => {
      const response = await request(commApp)
        .post('/email/send')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
    });
  });

  describe('Rate Limiting and Performance', () => {
    test('should handle concurrent requests', async () => {
      const requests = Array(10).fill(null).map(() =>
        request(commApp).get('/health')
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('healthy');
      });
    });

    test('should respond within acceptable time', async () => {
      const startTime = Date.now();

      await request(commApp)
        .get('/health')
        .expect(200);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Should respond within 1 second
    });
  });

  describe('Data Consistency', () => {
    test('should maintain consistency across MCP servers', async () => {
      // Create an entity in personal domain
      const taskResponse = await request(personalApp)
        .post('/task/schedule')
        .send({
          title: 'Integration Test Task',
          dueDate: '2024-01-20T17:00:00Z',
          priority: 'medium'
        });

      expect(taskResponse.status).toBe(201);
      const taskId = taskResponse.body.taskId;

      // Sync to business domain via Integration MCP
      const syncResponse = await request(integrationApp)
        .post('/sync/cross-domain')
        .send({
          sourceDomain: 'personal',
          targetDomain: 'business',
          entityType: 'tasks',
          entityIds: [taskId]
        });

      expect(syncResponse.status).toBe(200);
      expect(syncResponse.body.success).toBe(true);
      expect(syncResponse.body.syncedCount).toBeGreaterThan(0);
    });
  });

  describe('Authentication and Authorization', () => {
    test('should accept valid API keys', async () => {
      const response = await request(commApp)
        .get('/health')
        .set('X-API-Key', 'test-api-key')
        .expect(200);

      expect(response.body.status).toBe('healthy');
    });

    test('should handle missing authentication', async () => {
      // Assuming protected endpoints require auth
      const response = await request(businessApp)
        .get('/financial/sensitive-data')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });
});
