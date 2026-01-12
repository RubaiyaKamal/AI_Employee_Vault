/**
 * Unit Tests for CEO Briefing Generator
 * Tests the executive briefing generation system
 */

const fs = require('fs').promises;

// Mock dependencies
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn().mockResolvedValue(undefined),
    mkdir: jest.fn().mockResolvedValue(undefined),
    readdir: jest.fn().mockResolvedValue([])
  }
}));

const CEOBriefingGenerator = require('../../core_systems/ceo_briefing_generator');

describe('CEOBriefingGenerator', () => {
  let briefingGenerator;
  const mockConfig = {
    auditDataDir: './data/audits',
    reportOutputDir: './reports/briefings'
  };

  beforeEach(() => {
    briefingGenerator = new CEOBriefingGenerator(mockConfig);
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize with provided config', () => {
      expect(briefingGenerator.auditDataDir).toBe('./data/audits');
      expect(briefingGenerator.reportOutputDir).toBe('./reports/briefings');
    });

    test('should use default directories when not provided', () => {
      const defaultGenerator = new CEOBriefingGenerator({});
      expect(defaultGenerator.auditDataDir).toBeDefined();
      expect(defaultGenerator.reportOutputDir).toBeDefined();
    });
  });

  describe('Period Type Validation', () => {
    test('should accept valid period types', () => {
      expect(() => briefingGenerator.validatePeriod('daily')).not.toThrow();
      expect(() => briefingGenerator.validatePeriod('weekly')).not.toThrow();
      expect(() => briefingGenerator.validatePeriod('monthly')).not.toThrow();
      expect(() => briefingGenerator.validatePeriod('quarterly')).not.toThrow();
    });

    test('should reject invalid period types', () => {
      expect(() => briefingGenerator.validatePeriod('yearly')).toThrow();
      expect(() => briefingGenerator.validatePeriod('invalid')).toThrow();
    });
  });

  describe('Data Aggregation', () => {
    const mockAuditData = [
      {
        weekId: '2024-W01',
        financial: { revenue: 10000, expenses: 5000 },
        communication: { emailsSent: 100, smsCount: 50 },
        productivity: { tasksCompleted: 75, hoursWorked: 40 }
      },
      {
        weekId: '2024-W02',
        financial: { revenue: 12000, expenses: 6000 },
        communication: { emailsSent: 120, smsCount: 60 },
        productivity: { tasksCompleted: 80, hoursWorked: 42 }
      }
    ];

    beforeEach(() => {
      fs.readdir.mockResolvedValue(['2024-W01.json', '2024-W02.json']);
      fs.readFile.mockImplementation((path) => {
        if (path.includes('2024-W01')) {
          return Promise.resolve(JSON.stringify(mockAuditData[0]));
        } else if (path.includes('2024-W02')) {
          return Promise.resolve(JSON.stringify(mockAuditData[1]));
        }
        return Promise.reject(new Error('File not found'));
      });
    });

    test('should aggregate financial data', async () => {
      const aggregated = await briefingGenerator.aggregateFinancialData(mockAuditData);

      expect(aggregated).toHaveProperty('totalRevenue', 22000);
      expect(aggregated).toHaveProperty('totalExpenses', 11000);
      expect(aggregated).toHaveProperty('totalProfit', 11000);
      expect(aggregated).toHaveProperty('profitMargin');
    });

    test('should aggregate communication metrics', async () => {
      const aggregated = await briefingGenerator.aggregateCommunicationData(mockAuditData);

      expect(aggregated).toHaveProperty('totalEmailsSent', 220);
      expect(aggregated).toHaveProperty('totalSmsCount', 110);
    });

    test('should aggregate productivity metrics', async () => {
      const aggregated = await briefingGenerator.aggregateProductivityData(mockAuditData);

      expect(aggregated).toHaveProperty('totalTasksCompleted', 155);
      expect(aggregated).toHaveProperty('totalHoursWorked', 82);
      expect(aggregated).toHaveProperty('averageTasksPerWeek');
    });

    test('should calculate averages correctly', async () => {
      const aggregated = await briefingGenerator.aggregateProductivityData(mockAuditData);

      expect(aggregated.averageTasksPerWeek).toBe(77.5); // (75 + 80) / 2
    });

    test('should handle empty audit data', async () => {
      const aggregated = await briefingGenerator.aggregateFinancialData([]);

      expect(aggregated.totalRevenue).toBe(0);
      expect(aggregated.totalExpenses).toBe(0);
    });
  });

  describe('Trend Analysis', () => {
    const mockTimeSeriesData = [
      { revenue: 10000, date: '2024-01-01' },
      { revenue: 11000, date: '2024-01-08' },
      { revenue: 12000, date: '2024-01-15' },
      { revenue: 13000, date: '2024-01-22' }
    ];

    test('should identify increasing trends', async () => {
      const trend = await briefingGenerator.analyzeTrend(mockTimeSeriesData, 'revenue');

      expect(trend.direction).toBe('increasing');
      expect(trend.percentChange).toBeGreaterThan(0);
    });

    test('should identify decreasing trends', async () => {
      const decreasingData = mockTimeSeriesData.map(d => ({
        ...d,
        revenue: 13000 - d.revenue
      }));

      const trend = await briefingGenerator.analyzeTrend(decreasingData, 'revenue');

      expect(trend.direction).toBe('decreasing');
    });

    test('should identify stable trends', async () => {
      const stableData = Array(4).fill({ revenue: 10000 });

      const trend = await briefingGenerator.analyzeTrend(stableData, 'revenue');

      expect(trend.direction).toBe('stable');
      expect(Math.abs(trend.percentChange)).toBeLessThan(5);
    });

    test('should calculate growth rate', async () => {
      const growth = await briefingGenerator.calculateGrowthRate(
        mockTimeSeriesData,
        'revenue'
      );

      expect(growth).toBeGreaterThan(0);
      expect(growth).toBe(30); // (13000 - 10000) / 10000 * 100
    });
  });

  describe('Strategic Insights', () => {
    const mockAggregatedData = {
      financial: {
        totalRevenue: 50000,
        totalExpenses: 30000,
        profitMargin: 40,
        revenueGrowth: 15
      },
      operational: {
        tasksCompleted: 300,
        efficiency: 85,
        productivity: 90
      },
      strategic: {
        marketPosition: 'strong',
        competitiveAdvantage: ['efficiency', 'innovation']
      }
    };

    test('should generate opportunities', async () => {
      const opportunities = await briefingGenerator.identifyOpportunities(
        mockAggregatedData
      );

      expect(Array.isArray(opportunities)).toBe(true);
      expect(opportunities.length).toBeGreaterThan(0);
      expect(opportunities[0]).toHaveProperty('title');
      expect(opportunities[0]).toHaveProperty('description');
      expect(opportunities[0]).toHaveProperty('priority');
    });

    test('should identify threats', async () => {
      const threats = await briefingGenerator.identifyThreats(mockAggregatedData);

      expect(Array.isArray(threats)).toBe(true);
    });

    test('should prioritize insights', async () => {
      const insights = [
        { priority: 'high', impact: 'critical' },
        { priority: 'medium', impact: 'moderate' },
        { priority: 'low', impact: 'minor' }
      ];

      const prioritized = await briefingGenerator.prioritizeInsights(insights);

      expect(prioritized[0].priority).toBe('high');
      expect(prioritized[prioritized.length - 1].priority).toBe('low');
    });
  });

  describe('Briefing Generation', () => {
    const mockPeriodData = {
      period: 'weekly',
      startDate: '2024-01-01',
      endDate: '2024-01-07',
      financial: {
        totalRevenue: 50000,
        totalExpenses: 30000,
        profitMargin: 40
      },
      operational: {
        tasksCompleted: 300,
        efficiency: 85
      },
      trends: {
        revenue: { direction: 'increasing', percentChange: 15 },
        expenses: { direction: 'stable', percentChange: 2 }
      }
    };

    test('should generate complete briefing', async () => {
      const briefing = await briefingGenerator.generateBriefing('weekly', new Date());

      expect(briefing).toHaveProperty('period', 'weekly');
      expect(briefing).toHaveProperty('generatedAt');
      expect(briefing).toHaveProperty('executiveSummary');
      expect(briefing).toHaveProperty('keyMetrics');
      expect(briefing).toHaveProperty('trends');
      expect(briefing).toHaveProperty('opportunities');
      expect(briefing).toHaveProperty('threats');
      expect(briefing).toHaveProperty('recommendations');
    });

    test('should include executive summary', async () => {
      const briefing = await briefingGenerator.generateBriefing('weekly', new Date());

      expect(briefing.executiveSummary).toBeDefined();
      expect(typeof briefing.executiveSummary).toBe('string');
      expect(briefing.executiveSummary.length).toBeGreaterThan(50);
    });

    test('should format key metrics', async () => {
      const briefing = await briefingGenerator.generateBriefing('weekly', new Date());

      expect(briefing.keyMetrics).toHaveProperty('financial');
      expect(briefing.keyMetrics).toHaveProperty('operational');
    });

    test('should include period-specific data', async () => {
      const weeklyBriefing = await briefingGenerator.generateBriefing('weekly', new Date());
      expect(weeklyBriefing.period).toBe('weekly');

      const monthlyBriefing = await briefingGenerator.generateBriefing('monthly', new Date());
      expect(monthlyBriefing.period).toBe('monthly');
    });
  });

  describe('Report Saving', () => {
    const mockBriefing = {
      period: 'weekly',
      generatedAt: new Date().toISOString(),
      executiveSummary: 'Test summary',
      keyMetrics: {},
      trends: {}
    };

    test('should save briefing to file', async () => {
      await briefingGenerator.saveBriefing(mockBriefing, 'weekly');

      expect(fs.mkdir).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('weekly'),
        expect.any(String),
        'utf8'
      );
    });

    test('should create output directory if missing', async () => {
      await briefingGenerator.saveBriefing(mockBriefing, 'weekly');

      expect(fs.mkdir).toHaveBeenCalledWith(
        expect.any(String),
        { recursive: true }
      );
    });

    test('should format filename with timestamp', async () => {
      await briefingGenerator.saveBriefing(mockBriefing, 'weekly');

      const writeCall = fs.writeFile.mock.calls[0];
      expect(writeCall[0]).toMatch(/weekly_\d{4}-\d{2}-\d{2}/);
    });

    test('should handle save errors', async () => {
      fs.writeFile.mockRejectedValue(new Error('Write failed'));

      await expect(
        briefingGenerator.saveBriefing(mockBriefing, 'weekly')
      ).rejects.toThrow('Write failed');
    });
  });

  describe('Period-Specific Briefings', () => {
    test('should generate daily briefing', async () => {
      const briefing = await briefingGenerator.generateDailyBriefing();

      expect(briefing.period).toBe('daily');
    });

    test('should generate weekly briefing', async () => {
      const briefing = await briefingGenerator.generateWeeklyBriefing();

      expect(briefing.period).toBe('weekly');
    });

    test('should generate monthly briefing', async () => {
      const briefing = await briefingGenerator.generateMonthlyBriefing();

      expect(briefing.period).toBe('monthly');
    });

    test('should generate quarterly briefing', async () => {
      const briefing = await briefingGenerator.generateQuarterlyBriefing();

      expect(briefing.period).toBe('quarterly');
    });
  });

  describe('Date Range Calculation', () => {
    test('should calculate daily date range', () => {
      const date = new Date('2024-01-15');
      const { startDate, endDate } = briefingGenerator.getDailyDateRange(date);

      expect(startDate.toDateString()).toBe(date.toDateString());
      expect(endDate.toDateString()).toBe(date.toDateString());
    });

    test('should calculate weekly date range', () => {
      const date = new Date('2024-01-15');
      const { startDate, endDate } = briefingGenerator.getWeeklyDateRange(date);

      const daysDiff = (endDate - startDate) / (1000 * 60 * 60 * 24);
      expect(daysDiff).toBe(6); // 7 days inclusive
    });

    test('should calculate monthly date range', () => {
      const date = new Date('2024-01-15');
      const { startDate, endDate } = briefingGenerator.getMonthlyDateRange(date);

      expect(startDate.getDate()).toBe(1);
      expect(endDate.getMonth()).toBe(startDate.getMonth());
    });

    test('should calculate quarterly date range', () => {
      const date = new Date('2024-02-15'); // Q1
      const { startDate, endDate } = briefingGenerator.getQuarterlyDateRange(date);

      expect(startDate.getMonth()).toBe(0); // January
      expect(endDate.getMonth()).toBe(2); // March
    });
  });
});
