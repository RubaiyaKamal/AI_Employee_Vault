# Log Analyzer - Gold Tier

## Title
**Log Analyzer** - Analyze System Logs for Patterns and Insights

## Description

This skill analyzes system audit logs to identify patterns, detect anomalies, generate insights, and provide actionable recommendations based on system behavior.

**Capability Level**: Gold Tier
**Category**: Audit and Reporting
**Risk Level**: Low (Read-only analysis)
**Estimated Duration**: 1-3 minutes

## Instructions

### Execution Flow

#### 1. Analyze Logs
```bash
# Analyze logs from last 24 hours
node log_analyzer.js analyze --period 24h

# Analyze specific date range
node log_analyzer.js analyze --start 2026-01-01 --end 2026-01-12

# Analyze specific category
node log_analyzer.js analyze --category SECURITY --period 7d

# Detect anomalies
node log_analyzer.js analyze --detect-anomalies
```

#### 2. Analysis Types

**Pattern Detection**:
- Recurring error patterns
- Usage patterns by time of day
- User behavior patterns
- System performance patterns

**Anomaly Detection**:
- Unusual access patterns
- Spike in error rates
- Abnormal resource usage
- Security threats

**Trend Analysis**:
- Growth trends
- Performance degradation
- Error rate changes
- User activity trends

### Usage Examples

#### Example 1: Security Anomaly Detection
```bash
node log_analyzer.js analyze --category SECURITY --detect-anomalies
```

**Output**:
```
Log Analysis - Security Anomalies
==================================
Period: Last 7 days
Total Logs Analyzed: 125,340
Security Events: 1,247

Anomalies Detected: 3

1. Unusual Login Pattern
   Severity: HIGH
   Description: User 'admin@company.com' logged in from 15 different IPs in 2 hours
   Time: 2026-01-11 14:00 - 16:00
   Impact: Potential account compromise
   Recommendation: Investigate account activity, force password reset

2. Failed Login Spike
   Severity: MEDIUM
   Description: 45 failed login attempts for user 'john@company.com'
   Time: 2026-01-10 09:30 - 09:35
   Impact: Possible brute force attempt
   Recommendation: Implement rate limiting, notify user

3. Unusual Data Access
   Severity: LOW
   Description: User accessed 500+ records in single session (normal: <50)
   Time: 2026-01-09 16:45
   Impact: Potential data exfiltration
   Recommendation: Review user permissions, check data export logs

Security Score: 82/100
Recommendations:
  - Implement IP whitelisting for admin accounts
  - Enable two-factor authentication for all users
  - Set up automated alerting for failed login spikes
```

#### Example 2: Performance Pattern Analysis
```bash
node log_analyzer.js analyze --period 30d --type performance
```

**Output**:
```
Log Analysis - Performance Patterns
====================================
Period: Last 30 days
API Calls Analyzed: 2,450,000

Response Time Patterns:
  Average: 145ms
  P50: 98ms
  P95: 387ms
  P99: 1,243ms

Peak Usage Hours:
  09:00-11:00: 35% of daily traffic
  14:00-16:00: 28% of daily traffic
  21:00-23:00: 12% of daily traffic

Slowest Endpoints:
  1. /api/reports/generate: avg 2,340ms (152 calls)
  2. /api/data/export: avg 1,890ms (89 calls)
  3. /api/search/advanced: avg 987ms (1,245 calls)

Recommendations:
  1. Cache report generation results (potential 80% speedup)
  2. Implement pagination for data exports
  3. Add search index for advanced search queries
  4. Consider horizontal scaling for peak hours
```

#### Example 3: Error Pattern Detection
```bash
node log_analyzer.js analyze --category ERROR --period 7d
```

**Output**:
```
Log Analysis - Error Patterns
==============================
Period: Last 7 days
Error Events: 1,234

Error Distribution:
  Database Connection: 45% (556 occurrences)
  Network Timeout: 30% (370 occurrences)
  Validation Error: 15% (185 occurrences)
  Application Error: 10% (123 occurrences)

Recurring Patterns:

1. Database Connection Errors
   Frequency: Every 2-3 hours
   Peak Times: 02:00-04:00 daily
   Affected Services: user-service, payment-service
   Pattern: Connection pool exhaustion
   Recommendation: Increase connection pool size from 10 to 20

2. Network Timeouts
   Frequency: Sporadic, 50-60 per day
   Affected Services: external-api-integration
   Pattern: Timeout after 30 seconds
   Recommendation: Implement retry with exponential backoff

Root Cause Analysis:
  ✓ Database errors: Resource limitation (connection pool)
  ✓ Network timeouts: External service instability
  ✓ Validation errors: User input issues (normal)

Action Items:
  1. URGENT: Increase database connection pool
  2. HIGH: Implement retry logic for external API
  3. MEDIUM: Add validation hints to UI forms
```

### Acceptance Criteria

- [ ] Logs analyzed from specified period
- [ ] Patterns identified and categorized
- [ ] Anomalies detected with severity levels
- [ ] Trends analyzed with visualizations
- [ ] Actionable recommendations provided
- [ ] Analysis report generated
- [ ] Statistics calculated accurately

### Constraints

**Analysis Scope**:
- Maximum 90 days of historical logs
- Minimum 1 hour of logs required
- Large datasets may require sampling

**Performance**:
- Analysis time: <3 minutes for 30 days
- Memory usage: <1GB for 1 million log entries
- Concurrent analyses: Maximum 2

**Pattern Detection Accuracy**:
- False positive rate: <5%
- Anomaly detection confidence: >80%
- Trend prediction accuracy: >70%

## References

### Related Skills
- `/gold.weekly-audit-run` - Weekly audits
- `/gold.compliance-report-generate` - Compliance reports
- `/gold.system-health-monitor` - Health monitoring

### Documentation
- `GOLD_TIER_AUDIT_LOGGING.md` - Audit system
- `log_analyzer.js` - Implementation

---

**Skill Version**: 1.0.0
**Last Updated**: 2026-01-12
**Tier**: Gold
**Status**: Production Ready
