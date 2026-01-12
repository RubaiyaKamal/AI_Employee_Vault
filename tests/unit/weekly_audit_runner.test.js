/**
 * Unit Tests for Weekly Audit Runner
 * Tests the automated weekly audit system
 */

const fs = require('fs').promises;

// Mock dependencies
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn().mockResolvedValue(undefined),
    writeFile: jest.fn().mockResolvedValue(undefined),
    readFile: jest.fn().mockResolvedValue('{}')
  }
}));

jest.mock('axios');
const axios = require('axios');

const WeeklyAuditRunner = require('../../core_systems/weekly_audit_runner');

describe('WeeklyAuditRunner', () => {
  let auditRunner;
  const mockMcpServers = {
    communication: 'http://localhost:3001',
    businessOps: 'http://localhost:3002',
    personalAssist: 'http://localhost:3003'
  };

  beforeEach(() => {
    auditRunner = new WeeklyAuditRunner(mockMcpServers);
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize with MCP server URLs', () => {
      expect(auditRunner.mcpServers).toEqual(mockMcpServers);
    });

    test('should set default audit data directory', () => {
      expect(auditRunner.auditDataDir).toContain('data/audits');
    });
  });

  describe('Data Collection', () => {
    beforeEach(() => {
      // Mock successful API responses
      axios.get.mockResolvedValue({
        data: {
          financial: { revenue: 10000, expenses: 5000 },
          communication: { emailsSent: 100, smsCount: 50 },
          productivity: { tasksCompleted: 75, hoursWorked: 40 },
          social: { postsPublished: 10, engagement: 500 }
        }
      });
    });

    test('should collect financial data from business ops MCP', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-07');

      await auditRunner.collectFinancialData(startDate, endDate);

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('localhost:3002'),
        expect.objectContaining({
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          }
        })
      );
    });

    test('should collect communication data', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-07');

      await auditRunner.collectCommunicationData(startDate, endDate);

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('localhost:3001'),
        expect.any(Object)
      );
    });

    test('should collect productivity data', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-07');

      await auditRunner.collectProductivityData(startDate, endDate);

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('localhost:3003'),
        expect.any(Object)
      );
    });

    test('should handle API errors during data collection', async () => {
      axios.get.mockRejectedValue(new Error('API Error'));

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-07');

      await expect(
        auditRunner.collectFinancialData(startDate, endDate)
      ).rejects.toThrow('API Error');
    });
  });

  describe('Data Analysis', () => {
    const mockAuditData = {
      weekId: '2024-W01',
      startDate: '2024-01-01',
      endDate: '2024-01-07',
      financial: {
        revenue: 10000,
        expenses: 5000,
        profit: 5000
      },
      communication: {
        emailsSent: 100,
        smsCount: 50,
        socialPosts: 10
      },
      productivity: {
        tasksCompleted: 75,
        hoursWorked: 40,
        meetingsAttended: 12
      }
    };

    test('should analyze financial trends', async () => {
      const analysis = await auditRunner.analyzeFinancialTrends(mockAuditData.financial);

      expect(analysis).toHaveProperty('profitMargin');
      expect(analysis).toHaveProperty('trend');
      expect(analysis.profitMargin).toBe(50); // 5000/10000 * 100
    });

    test('should detect anomalies in data', async () => {
      const anomalies = await auditRunner.detectAnomalies(mockAuditData);

      expect(Array.isArray(anomalies)).toBe(true);
    });

    test('should generate recommendations', async () => {
      const recommendations = await auditRunner.generateRecommendations(mockAuditData);

      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
    });

    test('should calculate week-over-week changes', async () => {
      const previousWeekData = {
        financial: { revenue: 9000, expenses: 4500 }
      };

      const changes = await auditRunner.calculateWeekOverWeekChanges(
        mockAuditData,
        previousWeekData
      );

      expect(changes).toHaveProperty('revenue');
      expect(changes.revenue.percentChange).toBeCloseTo(11.11, 1);
    });
  });

  describe('Report Generation', () => {
    const mockAnalysis = {
      weekId: '2024-W01',
      summary: {
        totalRevenue: 10000,
        totalExpenses: 5000,
        profitMargin: 50
      },
      trends: {
        revenue: 'increasing',
        expenses: 'stable'
      },
      anomalies: [
        { type: 'high_expense', description: 'Unusual expense spike' }
      ],
      recommendations: [
        'Review expense categories',
        'Increase marketing spend'
      ]
    };

    test('should generate audit report', async () => {
      const report = await auditRunner.generateAuditReport(mockAnalysis, '2024-W01');

      expect(report).toHaveProperty('weekId', '2024-W01');
      expect(report).toHaveProperty('generatedAt');
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('trends');
      expect(report).toHaveProperty('anomalies');
      expect(report).toHaveProperty('recommendations');
    });

    test('should include executive summary', async () => {
      const report = await auditRunner.generateAuditReport(mockAnalysis, '2024-W01');

      expect(report).toHaveProperty('executiveSummary');
      expect(typeof report.executiveSummary).toBe('string');
      expect(report.executiveSummary.length).toBeGreaterThan(0);
    });

    test('should format numbers correctly', async () => {
      const report = await auditRunner.generateAuditReport(mockAnalysis, '2024-W01');

      // Check that monetary values are formatted
      expect(report.summary.totalRevenue).toBeDefined();
    });
  });

  describe('Report Saving', () => {
    const mockReport = {
      weekId: '2024-W01',
      generatedAt: new Date().toISOString(),
      summary: {},
      trends: {},
      recommendations: []
    };

    test('should save report to file', async () => {
      await auditRunner.saveAuditResults(mockReport, '2024-W01');

      expect(fs.mkdir).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('2024-W01'),
        expect.stringContaining('"weekId":"2024-W01"'),
        'utf8'
      );
    });

    test('should create audit data directory if missing', async () => {
      await auditRunner.saveAuditResults(mockReport, '2024-W01');

      expect(fs.mkdir).toHaveBeenCalledWith(
        expect.any(String),
        { recursive: true }
      );
    });

    test('should handle file write errors', async () => {
      fs.writeFile.mockRejectedValue(new Error('Write failed'));

      await expect(
        auditRunner.saveAuditResults(mockReport, '2024-W01')
      ).rejects.toThrow('Write failed');
    });
  });

  describe('Full Audit Run', () => {
    beforeEach(() => {
      axios.get.mockResolvedValue({
        data: {
          revenue: 10000,
          expenses: 5000,
          emailsSent: 100,
          tasksCompleted: 75
        }
      });
    });

    test('should run complete audit workflow', async () => {
      const result = await auditRunner.runWeeklyAudit();

      expect(result).toHaveProperty('weekId');
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('reportPath');
    });

    test('should use provided week date', async () => {
      const customDate = new Date('2024-01-15');
      const result = await auditRunner.runWeeklyAudit(customDate);

      expect(result.weekId).toContain('2024');
    });

    test('should handle audit errors gracefully', async () => {
      axios.get.mockRejectedValue(new Error('MCP Server unreachable'));

      const result = await auditRunner.runWeeklyAudit();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Week ID Generation', () => {
    test('should generate correct week ID', () => {
      const date = new Date('2024-01-15');
      const weekId = auditRunner.getWeekId(date);

      expect(weekId).toMatch(/^\d{4}-W\d{2}$/);
    });

    test('should generate consistent week IDs', () => {
      const date1 = new Date('2024-01-15');
      const date2 = new Date('2024-01-15');

      const weekId1 = auditRunner.getWeekId(date1);
      const weekId2 = auditRunner.getWeekId(date2);

      expect(weekId1).toBe(weekId2);
    });
  });

  describe('Date Range Calculation', () => {
    test('should calculate week start and end dates', () => {
      const date = new Date('2024-01-15'); // Monday
      const { startDate, endDate } = auditRunner.getWeekDateRange(date);

      expect(startDate.getDay()).toBe(1); // Monday
      expect(endDate.getDay()).toBe(0); // Sunday
    });

    test('should span 7 days', () => {
      const date = new Date('2024-01-15');
      const { startDate, endDate } = auditRunner.getWeekDateRange(date);

      const daysDiff = (endDate - startDate) / (1000 * 60 * 60 * 24);
      expect(daysDiff).toBe(6); // 0-6 inclusive = 7 days
    });
  });
});
