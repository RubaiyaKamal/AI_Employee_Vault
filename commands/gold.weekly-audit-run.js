/**
 * Gold Tier: Weekly Audit Run Command
 * Generates CEO briefing with financial data from Odoo
 */

const AuditSystem = require('../mcp_servers/audit_system');

module.exports = {
  name: 'gold.weekly-audit-run',
  description: 'Run weekly business and accounting audit with CEO briefing generation',
  tier: 'gold',

  async execute() {
    console.log('🔍 Starting Weekly Business Audit...\n');

    const audit = new AuditSystem();
    const result = await audit.runAudit();

    if (result.success) {
      console.log('\n✅ Weekly Audit Completed Successfully!\n');
      console.log('📄 CEO Briefing Generated');
      console.log(`   Location: ${result.filepath}\n`);
      console.log('📊 Financial Summary:');
      console.log(`   Total Revenue: $${result.metrics.summary.totalRevenue.toLocaleString()}`);
      console.log(`   Outstanding: $${result.metrics.summary.outstandingAmount.toLocaleString()}`);
      console.log(`   Collection Rate: ${result.metrics.summary.collectionRate}%`);
      console.log(`   Total Invoices: ${result.metrics.summary.totalInvoices}`);
      console.log(`   Total Customers: ${result.metrics.summary.totalCustomers}\n`);

      if (result.analysis.issues.length > 0) {
        console.log('⚠️  Issues Detected:');
        result.analysis.issues.forEach((issue, idx) => {
          const icon = issue.severity === 'high' ? '🔴' : issue.severity === 'medium' ? '🟡' : '🟢';
          console.log(`   ${idx + 1}. ${icon} [${issue.category}] ${issue.description}`);
        });
        console.log('');
      }

      if (result.analysis.recommendations.length > 0) {
        console.log('💡 Recommendations:');
        result.analysis.recommendations.forEach((rec, idx) => {
          console.log(`   ${idx + 1}. ${rec}`);
        });
        console.log('');
      }

      console.log('📌 Next Steps:');
      console.log('   1. Review the CEO briefing document');
      console.log('   2. Address any high-priority issues');
      console.log('   3. Monitor outstanding invoices');
      console.log('   4. Follow up with customers as needed\n');

      return {
        success: true,
        briefing: result.filepath,
        metrics: result.metrics,
        issues: result.analysis.issues.length
      };
    } else {
      console.error('\n❌ Audit Failed:', result.error);
      return {
        success: false,
        error: result.error
      };
    }
  }
};
