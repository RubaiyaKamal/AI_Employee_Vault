# System Health Monitoring - Gold Tier

## Title
**System Health Monitor** - Comprehensive System Health and Performance Monitoring

## Description

This skill monitors overall system health, performance metrics, and service availability across all Gold Tier components including MCP servers, error recovery systems, and audit logging.

**Capability Level**: Gold Tier
**Category**: Monitoring and Maintenance
**Risk Level**: Low (Read-only monitoring)
**Estimated Duration**: 30-60 seconds

## Instructions

### Execution Flow

#### 1. Initiate Health Check
```bash
# Basic health check
node system_health_monitor.js

# Detailed health check with metrics
node system_health_monitor.js --detailed

# Check specific services
node system_health_monitor.js --services mcp-servers,audit-logging

# Continuous monitoring
node system_health_monitor.js --monitor --interval 60
```

**Parameters**:
- `--detailed`: Include detailed performance metrics
- `--services`: Specific services to check (comma-separated)
- `--monitor`: Continuous monitoring mode
- `--interval`: Monitoring interval in seconds (default: 60)

#### 2. System Component Checks

**MCP Server Health**:
```javascript
// Check all MCP servers
const mcpServers = [
  { id: 'communication-mcp', port: 3001 },
  { id: 'business-operations-mcp', port: 3002 },
  { id: 'personal-assistance-mcp', port: 3003 },
  { id: 'integration-mcp', port: 3004 }
];

for (const server of mcpServers) {
  const health = await checkServerHealth(server.port);
  mcpServerStatus[server.id] = health;
}
```

**Expected MCP Health Response**:
```json
{
  "status": "healthy",
  "serverId": "communication-mcp",
  "capabilities": ["email-send", "email-receive", "social-post"],
  "timestamp": "2026-01-12T10:00:00Z",
  "uptime": 345600,
  "responseTime": 45
}
```

**System Resource Checks**:
```javascript
// Memory usage
const memoryUsage = process.memoryUsage();
const memoryHealthy = memoryUsage.heapUsed / memoryUsage.heapTotal < 0.8;

// CPU usage
const cpuUsage = getCpuUsage();
const cpuHealthy = cpuUsage < 80;

// Disk space
const diskSpace = await getDiskSpace();
const diskHealthy = diskSpace.available / diskSpace.total > 0.1;

// Network connectivity
const networkHealthy = await checkNetworkConnectivity();
```

**Error Recovery System Check**:
```javascript
// Get error recovery system status
const recoveryHealth = errorRecoveryManager.getSystemHealth();

// Expected response:
{
  status: 'healthy',  // healthy | degraded | at_risk
  errorCount: 2,
  openCircuits: 0,
  degradedFeatures: [],
  timestamp: '2026-01-12T10:00:00Z'
}
```

**Audit Logging System Check**:
```javascript
// Verify audit logging operational
const auditHealth = await checkAuditSystem();

// Expected response:
{
  status: 'operational',
  currentLogFile: './logs/audit/audit_2026-01-12.log',
  logFileSize: 5242880,  // 5MB
  bufferSize: 45,
  lastWrite: '2026-01-12T09:59:30Z'
}
```

#### 3. Performance Metrics Collection

**Response Time Metrics**:
```javascript
const performanceMetrics = {
  apiResponseTime: {
    average: 125,  // ms
    p50: 100,
    p95: 250,
    p99: 400
  },
  mcpServerResponseTime: {
    'communication-mcp': 45,
    'business-operations-mcp': 60,
    'personal-assistance-mcp': 38,
    'integration-mcp': 52
  }
};
```

**Throughput Metrics**:
```javascript
const throughputMetrics = {
  requestsPerMinute: 150,
  tasksProcessedPerHour: 480,
  auditLogsPerMinute: 25
};
```

**Error Rate Metrics**:
```javascript
const errorMetrics = {
  totalRequests: 10000,
  failedRequests: 50,
  errorRate: 0.005,  // 0.5%
  criticalErrors: 2,
  warningErrors: 10,
  infoErrors: 38
};
```

#### 4. Health Status Aggregation

**Calculate Overall Health**:
```javascript
function calculateOverallHealth(componentHealth) {
  const totalComponents = Object.keys(componentHealth).length;
  const healthyComponents = Object.values(componentHealth)
    .filter(h => h.status === 'healthy').length;

  const healthPercentage = (healthyComponents / totalComponents) * 100;

  if (healthPercentage >= 95) return 'healthy';
  if (healthPercentage >= 70) return 'degraded';
  return 'critical';
}
```

**Health Report Structure**:
```json
{
  "overall": "healthy",
  "timestamp": "2026-01-12T10:00:00Z",
  "uptime": 345600,
  "components": {
    "mcpServers": {
      "status": "healthy",
      "details": {
        "communication-mcp": "healthy",
        "business-operations-mcp": "healthy",
        "personal-assistance-mcp": "healthy",
        "integration-mcp": "healthy"
      }
    },
    "systemResources": {
      "status": "healthy",
      "memory": {
        "usage": "65%",
        "healthy": true
      },
      "cpu": {
        "usage": "45%",
        "healthy": true
      },
      "disk": {
        "available": "450GB",
        "total": "1TB",
        "usage": "55%",
        "healthy": true
      },
      "network": {
        "connected": true,
        "healthy": true
      }
    },
    "errorRecovery": {
      "status": "healthy",
      "openCircuits": 0,
      "degradedFeatures": [],
      "recentErrors": 2
    },
    "auditLogging": {
      "status": "operational",
      "bufferStatus": "normal",
      "logRotation": "healthy"
    }
  },
  "performance": {
    "responseTime": {
      "average": 125,
      "p95": 250
    },
    "throughput": 150,
    "errorRate": 0.005
  },
  "alerts": []
}
```

#### 5. Alert Generation

**Alert Thresholds**:
```javascript
const alertThresholds = {
  memory: { warning: 0.75, critical: 0.9 },
  cpu: { warning: 70, critical: 85 },
  disk: { warning: 0.2, critical: 0.1 },
  errorRate: { warning: 0.02, critical: 0.05 },
  responseTime: { warning: 2000, critical: 5000 }
};
```

**Alert Types**:
- **INFO**: System status information
- **WARNING**: Potential issues requiring attention
- **ERROR**: Issues requiring immediate action
- **CRITICAL**: System failures requiring emergency response

**Alert Example**:
```json
{
  "level": "WARNING",
  "component": "systemResources.memory",
  "message": "Memory usage at 78% (warning threshold: 75%)",
  "value": 0.78,
  "threshold": 0.75,
  "timestamp": "2026-01-12T10:00:00Z",
  "recommendedAction": "Review memory usage patterns and consider optimization"
}
```

### Usage Examples

#### Example 1: Basic Health Check
```bash
node system_health_monitor.js
```

**Output**:
```
System Health Report
====================
Overall Status: HEALTHY
Timestamp: 2026-01-12 10:00:00
Uptime: 4 days, 0 hours, 0 minutes

MCP Servers: ✓ All healthy (4/4)
- communication-mcp: ✓ Healthy (response time: 45ms)
- business-operations-mcp: ✓ Healthy (response time: 60ms)
- personal-assistance-mcp: ✓ Healthy (response time: 38ms)
- integration-mcp: ✓ Healthy (response time: 52ms)

System Resources: ✓ All healthy
- Memory: 65% used (✓ Healthy)
- CPU: 45% used (✓ Healthy)
- Disk: 450GB available of 1TB (✓ Healthy)
- Network: ✓ Connected

Error Recovery: ✓ Healthy
- Open Circuits: 0
- Degraded Features: 0
- Recent Errors: 2

Audit Logging: ✓ Operational
- Current Log File: audit_2026-01-12.log (5MB)
- Buffer Status: Normal (45 entries)

Performance Metrics:
- Average Response Time: 125ms
- Throughput: 150 requests/min
- Error Rate: 0.5%

Alerts: None
```

#### Example 2: Detailed Health Check
```bash
node system_health_monitor.js --detailed
```

**Includes Additional Metrics**:
- Detailed memory breakdown (heap, external, RSS)
- CPU usage per core
- Network latency to external services
- Detailed error recovery statistics
- Audit log statistics

#### Example 3: Continuous Monitoring
```bash
node system_health_monitor.js --monitor --interval 60
```

**Output** (updates every 60 seconds):
```
[2026-01-12 10:00:00] System Status: HEALTHY
[2026-01-12 10:01:00] System Status: HEALTHY
[2026-01-12 10:02:00] System Status: HEALTHY (WARNING: Memory at 78%)
[2026-01-12 10:03:00] System Status: HEALTHY
```

### Acceptance Criteria

- [ ] All MCP servers health checked successfully
- [ ] System resources monitored accurately
- [ ] Error recovery system status retrieved
- [ ] Audit logging system status verified
- [ ] Performance metrics collected
- [ ] Overall health status calculated
- [ ] Alerts generated for threshold violations
- [ ] Health report formatted correctly
- [ ] Continuous monitoring works reliably
- [ ] No false positives in health checks

### Constraints

**Monitoring Interval**: Minimum 10 seconds (to avoid overwhelming services)

**Health Check Timeout**: 5 seconds per component (total timeout: 30 seconds)

**Performance Impact**: Monitoring should consume <1% CPU and <50MB memory

**Network Requirements**: Requires network access to check MCP server health

**Permissions**: Read-only access to all system components

### Error Handling

**Component Unavailable**:
- Mark component as `unhealthy`
- Log error details
- Continue checking other components
- Generate alert

**Timeout**:
- Mark component as `timeout`
- Retry once after 2 seconds
- If still timeout, mark as `unhealthy`

**Network Error**:
- Check network connectivity
- If network down, mark all remote services as `degraded`
- Continue checking local services

## References

### Related Skills
- `/gold.mcp-server-health-check` - Specific MCP server monitoring
- `/gold.error-recovery-auto` - Error recovery management
- `/gold.log-analyzer` - Log analysis
- `/gold.resource-optimizer` - Resource optimization

### Documentation
- `GOLD_TIER_ERROR_RECOVERY.md` - Error recovery system
- `GOLD_TIER_AUDIT_LOGGING.md` - Audit logging system
- `GOLD_TIER_MCP_SERVERS.md` - MCP server configuration
- `health_check_service.js` - Implementation code

### Code References
- `health_check_service.js:809-965` - Health check service
- `error_recovery_manager.js:544-554` - System health retrieval
- `GOLD_TIER_ARCHITECTURE_DOCS.md:99-157` - Architecture decisions

### Configuration Files
- `health_check_config.json` - Health check configuration
- `alert_thresholds.json` - Alert threshold configuration

---

**Skill Version**: 1.0.0
**Last Updated**: 2026-01-12
**Tier**: Gold
**Author**: Personal AI Employee System - Gold Tier
**Status**: Production Ready
