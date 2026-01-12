/**
 * Audit Scheduler
 * Schedules and runs weekly audits automatically
 * Gold Tier - Personal AI Employee System
 */

const cron = require('node-cron');
const WeeklyAuditRunner = require('./weekly_audit_runner');

class AuditScheduler {
  constructor(config = {}) {
    this.runner = new WeeklyAuditRunner(config);
    this.config = config;
    this.scheduledTask = null;
  }

  start() {
    console.log('Starting Weekly Audit Scheduler...');

    // Schedule weekly audit for every Monday at 1 AM
    this.scheduledTask = cron.schedule('0 1 * * 1', async () => {
      console.log('Scheduled weekly audit starting...');
      try {
        const result = await this.runner.runWeeklyAudit();
        console.log('Weekly audit completed:', result);
      } catch (error) {
        console.error('Weekly audit failed:', error);
      }
    });

    console.log('Audit scheduler started. Audits will run every Monday at 1 AM.');
  }

  stop() {
    if (this.scheduledTask) {
      this.scheduledTask.stop();
      console.log('Audit scheduler stopped.');
    }
  }

  async runImmediateAudit() {
    console.log('Running immediate audit...');
    return await this.runner.runWeeklyAudit();
  }
}

module.exports = AuditScheduler;

// CLI execution
if (require.main === module) {
  const scheduler = new AuditScheduler();
  scheduler.start();

  // Keep process running
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, stopping scheduler...');
    scheduler.stop();
    process.exit(0);
  });
}
