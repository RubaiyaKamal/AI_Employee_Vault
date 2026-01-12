/**
 * Weekly Audit Runner
 * Collects, analyzes, and reports on weekly business activities
 * Gold Tier - Personal AI Employee System
 */

const fs = require('fs').promises;
const path = require('path');
const moment = require('moment');

class WeeklyAuditRunner {
  constructor(config = {}) {
    this.config = config;
    this.auditDataDir = config.auditDataDir || './data/audits';
    this.reportOutputDir = config.reportOutputDir || './reports/audits';
    this.templatesDir = config.templatesDir || './templates/audit';
    this.dataSourcesDir = config.dataSourcesDir || './data';

    this.ensureDirectories();
  }

  async ensureDirectories() {
    const dirs = [this.auditDataDir, this.reportOutputDir, this.templatesDir];
    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  async runWeeklyAudit(weekDate = null) {
    const auditDate = weekDate ? new Date(weekDate) : new Date();
    const weekId = this.getWeekId(auditDate);
    const auditStartTime = new Date();

    console.log(`Starting weekly audit for week: ${weekId}`);

    try {
      // Step 1: Collect audit data
      const auditData = await this.collectAuditData(auditDate);

      // Step 2: Analyze data
      const analysis = await this.analyzeAuditData(auditData);

      // Step 3: Generate report
      const report = await this.generateAuditReport(analysis, weekId);

      // Step 4: Save audit results
      await this.saveAuditResults(report, weekId);

      const auditDuration = new Date() - auditStartTime;
      console.log(`Weekly audit completed in ${auditDuration}ms for week: ${weekId}`);

      return {
        success: true,
        weekId,
        duration: auditDuration,
        reportPath: report.path
      };
    } catch (error) {
      console.error(`Weekly audit failed for week ${weekId}:`, error);
      await this.handleAuditError(error, weekId);
      throw error;
    }
  }

  getWeekId(date) {
    return moment(date).format('YYYYMMDD');
  }

  async collectAuditData(weekDate) {
    console.log('Collecting audit data...');

    const startOfWeek = moment(weekDate).startOf('isoWeek');
    const endOfWeek = moment(weekDate).endOf('isoWeek');

    const auditData = {
      period: {
        start: startOfWeek.toDate(),
        end: endOfWeek.toDate(),
        label: `${startOfWeek.format('YYYY-MM-DD')} - ${endOfWeek.format('YYYY-MM-DD')}`
      },
      financial: await this.collectFinancialData(startOfWeek, endOfWeek),
      communications: await this.collectCommunicationData(startOfWeek, endOfWeek),
      productivity: await this.collectProductivityData(startOfWeek, endOfWeek),
      social: await this.collectSocialData(startOfWeek, endOfWeek)
    };

    return auditData;
  }

  async collectFinancialData(startDate, endDate) {
    const financialData = {
      transactions: [],
      totalIncome: 0,
      totalExpenses: 0,
      categories: {}
    };

    try {
      const transactionsPath = path.join(this.dataSourcesDir, 'transactions');
      const files = await fs.readdir(transactionsPath);

      for (const file of files.filter(f => f.endsWith('.json'))) {
        const filePath = path.join(transactionsPath, file);
        const content = await fs.readFile(filePath, 'utf8');
        const transactions = JSON.parse(content);

        transactions.forEach(transaction => {
          const transDate = moment(transaction.date);
          if (transDate.isBetween(startDate, endDate, null, '[]')) {
            financialData.transactions.push(transaction);

            if (transaction.amount > 0) {
              financialData.totalIncome += transaction.amount;
            } else {
              financialData.totalExpenses += Math.abs(transaction.amount);
            }

            const category = transaction.category || 'uncategorized';
            financialData.categories[category] =
              (financialData.categories[category] || 0) + transaction.amount;
          }
        });
      }
    } catch (error) {
      console.warn('Error collecting financial data:', error.message);
    }

    return financialData;
  }

  async collectCommunicationData(startDate, endDate) {
    const communicationData = {
      emailsSent: 0,
      emailsReceived: 0,
      meetings: 0
    };

    try {
      const emailsPath = path.join(this.dataSourcesDir, 'emails');
      const files = await fs.readdir(emailsPath);

      for (const file of files.filter(f => f.endsWith('.json'))) {
        const filePath = path.join(emailsPath, file);
        const content = await fs.readFile(filePath, 'utf8');
        const emails = JSON.parse(content);

        emails.forEach(email => {
          const emailDate = moment(email.timestamp);
          if (emailDate.isBetween(startDate, endDate, null, '[]')) {
            if (email.direction === 'sent') {
              communicationData.emailsSent++;
            } else {
              communicationData.emailsReceived++;
            }
          }
        });
      }
    } catch (error) {
      console.warn('Error collecting communication data:', error.message);
    }

    return communicationData;
  }

  async collectProductivityData(startDate, endDate) {
    const productivityData = {
      tasksCompleted: 0,
      tasksCreated: 0
    };

    try {
      const tasksPath = path.join(this.dataSourcesDir, 'tasks');
      const files = await fs.readdir(tasksPath);

      for (const file of files.filter(f => f.endsWith('.json'))) {
        const filePath = path.join(tasksPath, file);
        const content = await fs.readFile(filePath, 'utf8');
        const tasks = JSON.parse(content);

        tasks.forEach(task => {
          const createdDate = moment(task.createdAt);
          const completedDate = task.completedAt ? moment(task.completedAt) : null;

          if (createdDate.isBetween(startDate, endDate, null, '[]')) {
            productivityData.tasksCreated++;
          }

          if (completedDate && completedDate.isBetween(startDate, endDate, null, '[]')) {
            productivityData.tasksCompleted++;
          }
        });
      }
    } catch (error) {
      console.warn('Error collecting productivity data:', error.message);
    }

    return productivityData;
  }

  async collectSocialData(startDate, endDate) {
    const socialData = {
      posts: 0,
      likes: 0,
      shares: 0
    };

    try {
      const socialPath = path.join(this.dataSourcesDir, 'social');
      const files = await fs.readdir(socialPath);

      for (const file of files.filter(f => f.endsWith('.json'))) {
        const filePath = path.join(socialPath, file);
        const content = await fs.readFile(filePath, 'utf8');
        const posts = JSON.parse(content);

        posts.forEach(post => {
          const postDate = moment(post.publishedAt);
          if (postDate.isBetween(startDate, endDate, null, '[]')) {
            socialData.posts++;
            socialData.likes += post.likes || 0;
            socialData.shares += post.shares || 0;
          }
        });
      }
    } catch (error) {
      console.warn('Error collecting social data:', error.message);
    }

    return socialData;
  }

  async analyzeAuditData(auditData) {
    console.log('Analyzing audit data...');

    const analysis = {
      period: auditData.period,
      financial: this.analyzeFinancialData(auditData.financial),
      productivity: this.analyzeProductivityData(auditData.productivity),
      trends: this.identifyTrends(auditData),
      anomalies: this.detectAnomalies(auditData),
      recommendations: this.generateRecommendations(auditData)
    };

    return analysis;
  }

  analyzeFinancialData(financialData) {
    const netChange = financialData.totalIncome - financialData.totalExpenses;
    const expenseRatio = financialData.totalIncome > 0
      ? financialData.totalExpenses / financialData.totalIncome
      : 0;

    const insights = [];

    if (expenseRatio > 0.8) {
      insights.push({
        type: 'warning',
        message: 'Expenses are exceeding 80% of income',
        severity: 'high'
      });
    }

    return {
      summary: {
        totalIncome: financialData.totalIncome,
        totalExpenses: financialData.totalExpenses,
        netChange,
        expenseRatio,
        categoryBreakdown: financialData.categories
      },
      insights
    };
  }

  analyzeProductivityData(productivityData) {
    const completionRate = productivityData.tasksCreated > 0
      ? (productivityData.tasksCompleted / productivityData.tasksCreated) * 100
      : 0;

    const insights = [];

    if (completionRate < 50) {
      insights.push({
        type: 'warning',
        message: `Task completion rate is low: ${completionRate.toFixed(1)}%`,
        severity: 'medium'
      });
    }

    return {
      summary: productivityData,
      completionRate,
      insights
    };
  }

  identifyTrends(auditData) {
    const trends = [];

    if (auditData.financial.totalExpenses > auditData.financial.totalIncome * 0.9) {
      trends.push({
        type: 'expense',
        direction: 'increasing',
        confidence: 0.8,
        description: 'Expenses approaching income levels'
      });
    }

    return trends;
  }

  detectAnomalies(auditData) {
    const anomalies = [];

    const avgWeeklyExpenses = 1000; // Should be calculated from historical data
    if (auditData.financial.totalExpenses > avgWeeklyExpenses * 1.5) {
      anomalies.push({
        type: 'expense_spike',
        severity: 'high',
        description: 'Significant increase in weekly expenses',
        value: auditData.financial.totalExpenses
      });
    }

    return anomalies;
  }

  generateRecommendations(auditData) {
    const recommendations = [];

    if (auditData.financial.totalExpenses > auditData.financial.totalIncome * 0.8) {
      recommendations.push({
        category: 'financial',
        priority: 'high',
        description: 'Reduce expenses to maintain healthy income-to-expense ratio',
        actionItems: [
          'Review subscription services',
          'Analyze spending categories for reduction opportunities'
        ]
      });
    }

    const completionRate = auditData.productivity.tasksCreated > 0
      ? auditData.productivity.tasksCompleted / auditData.productivity.tasksCreated
      : 1;

    if (completionRate < 0.7) {
      recommendations.push({
        category: 'productivity',
        priority: 'medium',
        description: 'Improve task completion rate',
        actionItems: [
          'Review task prioritization methods',
          'Consider workload distribution'
        ]
      });
    }

    return recommendations;
  }

  async generateAuditReport(analysis, weekId) {
    console.log('Generating audit report...');

    const reportContent = this.formatReportContent(analysis);
    const reportPath = path.join(this.reportOutputDir, `audit_report_${weekId}.md`);

    await fs.writeFile(reportPath, reportContent);

    return {
      weekId,
      path: reportPath,
      content: reportContent,
      summary: this.createExecutiveSummary(analysis)
    };
  }

  formatReportContent(analysis) {
    const template = `# Weekly Business Audit Report
**Period:** ${analysis.period.label}
**Generated:** ${new Date().toISOString()}

## Executive Summary
${this.formatExecutiveSummary(analysis)}

## Financial Overview
${this.formatFinancialSection(analysis.financial)}

## Productivity Analysis
${this.formatProductivitySection(analysis.productivity)}

## Trends & Insights
${this.formatTrendsSection(analysis.trends)}

## Anomalies Detected
${this.formatAnomaliesSection(analysis.anomalies)}

## Recommendations
${this.formatRecommendationsSection(analysis.recommendations)}

---
*Automatically generated by Gold Tier AI Employee System*
`;

    return template;
  }

  formatExecutiveSummary(analysis) {
    const netChange = analysis.financial.summary.netChange;
    return `Net financial change: $${netChange.toFixed(2)}\nKey insight: ${analysis.financial.insights[0]?.message || 'No major insights this week.'}`;
  }

  formatFinancialSection(financialAnalysis) {
    const { summary } = financialAnalysis;
    return `**Income:** $${summary.totalIncome.toFixed(2)} | **Expenses:** $${summary.totalExpenses.toFixed(2)} | **Net:** $${summary.netChange.toFixed(2)}`;
  }

  formatProductivitySection(productivityAnalysis) {
    const { summary, completionRate } = productivityAnalysis;
    return `**Tasks Created:** ${summary.tasksCreated} | **Tasks Completed:** ${summary.tasksCompleted} | **Completion Rate:** ${completionRate.toFixed(1)}%`;
  }

  formatTrendsSection(trends) {
    if (trends.length === 0) return 'No significant trends detected this week.';
    return trends.map(t => `- **${t.type}**: ${t.description} (${t.direction})`).join('\n');
  }

  formatAnomaliesSection(anomalies) {
    if (anomalies.length === 0) return 'No anomalies detected this week.';
    return anomalies.map(a => `- **${a.type}**: ${a.description} (Severity: ${a.severity})`).join('\n');
  }

  formatRecommendationsSection(recommendations) {
    if (recommendations.length === 0) return 'No specific recommendations this week.';
    return recommendations.map(r => `### ${r.priority.toUpperCase()}: ${r.category}\n**${r.description}**\n**Action Items:**\n${r.actionItems.map(i => `- ${i}`).join('\n')}`).join('\n\n');
  }

  createExecutiveSummary(analysis) {
    return {
      netChange: analysis.financial.summary.netChange,
      completionRate: analysis.productivity.completionRate,
      anomalies: analysis.anomalies.length,
      recommendations: analysis.recommendations.length
    };
  }

  async saveAuditResults(report, weekId) {
    const auditRecord = {
      weekId,
      timestamp: new Date().toISOString(),
      summary: report.summary,
      reportPath: report.path,
      status: 'completed'
    };

    const recordPath = path.join(this.auditDataDir, `${weekId}_audit_record.json`);
    await fs.writeFile(recordPath, JSON.stringify(auditRecord, null, 2));
  }

  async handleAuditError(error, weekId) {
    const errorLog = {
      weekId,
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      status: 'failed'
    };

    const errorPath = path.join(this.auditDataDir, `${weekId}_audit_error.json`);
    await fs.writeFile(errorPath, JSON.stringify(errorLog, null, 2));
  }
}

module.exports = WeeklyAuditRunner;

// CLI execution
if (require.main === module) {
  const runner = new WeeklyAuditRunner();

  const args = process.argv.slice(2);
  const weekDate = args[0] || null;

  runner.runWeeklyAudit(weekDate)
    .then(result => {
      console.log('Audit completed successfully:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Audit failed:', error);
      process.exit(1);
    });
}
