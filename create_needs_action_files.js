const fs = require('fs-extra');
const path = require('path');

// Create the Needs_Action directory if it doesn't exist
const needsActionDir = './Needs_Action';
if (!fs.existsSync(needsActionDir)) {
  fs.mkdirSync(needsActionDir, { recursive: true });
  console.log('Created Needs_Action directory');
}

// Create 7 test files in Needs_Action folder
const testItems = [
  {
    id: 'abc123xyz',
    type: 'email_response',
    description: 'Important business email requiring response/approval',
    priority: 'high',
    deadline: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    created: new Date().toISOString(),
    source: 'gmail_watcher',
    email_details: {
      from: 'client@bigcorp.com',
      subject: 'URGENT: Contract Approval Required - $50,000 Marketing Deal',
      amount_involved: 50000,
      urgency_keywords: ['URGENT', 'ASAP', 'IMMEDIATE'],
      suggested_action: 'Approve contract terms and authorize payment'
    }
  },
  {
    id: 'def456uvw',
    type: 'social_post',
    description: 'LinkedIn company announcement post requiring approval',
    priority: 'medium',
    deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    created: new Date().toISOString(),
    source: 'social_media_automation',
    platform: 'linkedin',
    content: {
      text: 'Exciting news! We\'ve reached 1 million customers. Thank you to our amazing team and loyal customers for making this milestone possible.',
      hashtags: ['#Milestone', '#Achievement', '#Teamwork', '#CustomerFirst'],
      media: {
        url: 'https://internal.company.com/images/milestone_graph.png',
        caption: 'Growth trajectory reaching 1M customers'
      }
    },
    suggested_action: 'Review and approve for LinkedIn posting'
  },
  {
    id: 'ghi789rst',
    type: 'financial_transaction',
    description: 'Vendor invoice requiring approval',
    priority: 'high',
    deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    created: new Date().toISOString(),
    source: 'xero_integration',
    transaction_type: 'invoice',
    vendor: 'Cloud Services Inc.',
    amount: 15500.00,
    currency: 'USD',
    invoice_number: 'INV-2026-0156',
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    department: 'IT Infrastructure',
    purpose: 'Annual cloud hosting services',
    suggested_action: 'Review invoice details and approve for payment'
  },
  {
    id: 'jkl012opq',
    type: 'file_processing',
    description: 'Sensitive document upload requiring approval',
    priority: 'high',
    deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    created: new Date().toISOString(),
    source: 'filesystem_watcher',
    file_event: {
      operation: 'created',
      path: '/data/confidential/salary_reviews_Q4_2025.xlsx',
      size: 2048576,
      extension: '.xlsx',
      classification: 'confidential',
      sensitivity_level: 'high'
    },
    suggested_action: 'Review document and approve for payroll processing'
  },
  {
    id: 'mno345lmn',
    type: 'whatsapp_response',
    description: 'VIP client urgent support request requiring approval',
    priority: 'high',
    deadline: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    created: new Date().toISOString(),
    source: 'whatsapp_watcher',
    message_details: {
      sender: '+1234567890',
      sender_name: 'Acme Corp - Technical Lead',
      timestamp: new Date().toISOString(),
      content: 'Hi, we\'re experiencing complete system downtime since 6 AM EST. Critical production systems are down. Need immediate assistance.',
      urgency_keywords: ['urgent', 'downtime', 'critical', 'immediate'],
      contact_history: 15,
      relationship_status: 'vip_client'
    },
    suggested_action: 'Acknowledge urgently and assign senior support engineer'
  },
  {
    id: 'pqr678ijk',
    type: 'audit_exception',
    description: 'Unusual financial pattern detected in weekly audit',
    priority: 'medium',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    created: new Date().toISOString(),
    source: 'weekly_audit_system',
    exception_details: {
      audit_period: '2026-W02',
      detected_anomaly: 'Marketing spend 300% above usual weekly average',
      affected_department: 'Marketing',
      usual_spend: 5000,
      actual_spend: 20000,
      variance_percentage: 300,
      time_period: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() + ' to ' + new Date().toISOString(),
      potential_risk_level: 'medium'
    },
    suggested_action: 'Review marketing expenses and approve investigation'
  },
  {
    id: 'stu901fgh',
    type: 'ceo_briefing_content',
    description: 'CEO weekly briefing content requiring executive approval',
    priority: 'high',
    deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    created: new Date().toISOString(),
    source: 'ceo_briefing_generator',
    briefing_details: {
      report_period: '2026-W02',
      report_type: 'weekly_ceo_briefing',
      sensitive_sections: ['Competitive Intelligence', 'Strategic Initiatives'],
      competitive_intel: {
        competitor: 'TechRival Inc.',
        intelligence_source: 'market_research',
        sensitivity_level: 'confidential',
        content_summary: 'Competitor planning major product launch in Q2 2026, potential market disruption'
      },
      key_metrics_flagged: [
        'Q1 revenue projection 5% below target',
        'Customer churn rate increased 15% month-over-month'
      ]
    },
    suggested_action: 'Review sensitive sections and approve briefing for distribution'
  }
];

// Write each test item to the Needs_Action folder
testItems.forEach((item, index) => {
  const fileName = `needs_approval_${item.id}.json`;
  const filePath = path.join(needsActionDir, fileName);
  fs.writeJsonSync(filePath, item, { spaces: 2 });
  console.log(`Created: ${fileName} - ${item.description}`);
});

console.log('\nAll 7 Gold Tier test cases have been successfully created in the Needs_Action folder!');
console.log('Files created:', fs.readdirSync(needsActionDir).length);

// Also create the other required directories
const otherDirs = ['./Pending_Approval', './Approved', './Done'];
otherDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});