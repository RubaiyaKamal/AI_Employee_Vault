# MCP Server Health Check - Gold Tier

## Title
**MCP Server Health Check** - Monitor and Verify MCP Server Status

## Description

This skill performs health checks on all MCP servers to ensure they are operational, responsive, and providing expected capabilities. It monitors the Communication, Business Operations, Personal Assistance, and Integration MCP servers.

**Capability Level**: Gold Tier
**Category**: MCP Server Management
**Risk Level**: Low (Read-only monitoring)
**Estimated Duration**: 10-30 seconds

## Instructions

### Execution Flow

#### 1. Initiate Health Check
```bash
# Check all MCP servers
node mcp_server_health_check.js

# Check specific server
node mcp_server_health_check.js --server communication-mcp

# Detailed diagnostics
node mcp_server_health_check.js --detailed

# Continuous monitoring
node mcp_server_health_check.js --watch --interval 30
```

**Parameters**:
- `--server`: Specific server ID to check
- `--detailed`: Include detailed diagnostics
- `--watch`: Continuous monitoring mode
- `--interval`: Check interval in seconds (default: 30)

#### 2. MCP Server Registry

**Server Configuration**:
```javascript
const mcpServers = {
  'communication-mcp': {
    name: 'Communication MCP Server',
    port: 3001,
    baseUrl: 'http://localhost:3001',
    capabilities: ['email-send', 'email-receive', 'sms-send', 'social-post', 'notification-send']
  },
  'business-operations-mcp': {
    name: 'Business Operations MCP Server',
    port: 3002,
    baseUrl: 'http://localhost:3002',
    capabilities: ['financial-report', 'audit-log', 'document-gen', 'compliance-check']
  },
  'personal-assistance-mcp': {
    name: 'Personal Assistance MCP Server',
    port: 3003,
    baseUrl: 'http://localhost:3003',
    capabilities: ['calendar-manage', 'task-schedule', 'reminder-set', 'health-track']
  },
  'integration-mcp': {
    name: 'Integration MCP Server',
    port: 3004,
    baseUrl: 'http://localhost:3004',
    capabilities: ['data-sync', 'event-correlate', 'domain-bridge', 'workflow-orchestrate']
  }
};
```

#### 3. Health Check Endpoints

**GET /health**:
Returns server health status
```javascript
// Request
GET http://localhost:3001/health

// Expected Response
{
  "status": "healthy",
  "serverId": "communication-mcp",
  "capabilities": ["email-send", "email-receive", "sms-send", "social-post"],
  "timestamp": "2026-01-12T10:00:00Z"
}
```

**GET /capabilities**:
Returns server capabilities
```javascript
// Request
GET http://localhost:3001/capabilities

// Expected Response
{
  "id": "communication-mcp",
  "name": "Communication MCP Server",
  "capabilities": ["email-send", "email-receive", "sms-send", "social-post"],
  "config": {
    "email": {
      "smtp_host": "smtp.gmail.com",
      "smtp_port": 587
    },
    "social": {
      "linkedin_enabled": true
    }
  }
}
```

#### 4. Health Check Execution

**Check Individual Server**:
```javascript
async function checkServerHealth(serverId) {
  const server = mcpServers[serverId];
  if (!server) {
    return { status: 'not_found', serverId };
  }

  try {
    // Check health endpoint
    const healthResponse = await axios.get(`${server.baseUrl}/health`, {
      timeout: 5000
    });

    // Measure response time
    const startTime = Date.now();
    await axios.get(`${server.baseUrl}/health`);
    const responseTime = Date.now() - startTime;

    // Check capabilities endpoint
    const capabilitiesResponse = await axios.get(`${server.baseUrl}/capabilities`, {
      timeout: 5000
    });

    return {
      status: 'healthy',
      serverId,
      serverName: server.name,
      port: server.port,
      responseTime,
      capabilities: capabilitiesResponse.data.capabilities,
      timestamp: new Date().toISOString(),
      healthy: healthResponse.data.status === 'healthy'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      serverId,
      serverName: server.name,
      port: server.port,
      error: error.message,
      timestamp: new Date().toISOString(),
      healthy: false
    };
  }
}
```

**Check All Servers**:
```javascript
async function checkAllServers() {
  const results = {};

  for (const serverId in mcpServers) {
    results[serverId] = await checkServerHealth(serverId);
  }

  return {
    timestamp: new Date().toISOString(),
    totalServers: Object.keys(mcpServers).length,
    healthyServers: Object.values(results).filter(r => r.healthy).length,
    unhealthyServers: Object.values(results).filter(r => !r.healthy).length,
    servers: results,
    overallHealth: calculateOverallHealth(results)
  };
}
```

#### 5. Detailed Diagnostics

**Extended Health Check**:
```javascript
async function detailedHealthCheck(serverId) {
  const basicHealth = await checkServerHealth(serverId);

  if (!basicHealth.healthy) {
    return { ...basicHealth, diagnostics: null };
  }

  // Test each capability
  const capabilityTests = await testCapabilities(serverId);

  // Check resource usage
  const resourceUsage = await getServerResourceUsage(serverId);

  // Check recent errors
  const recentErrors = await getServerErrors(serverId);

  return {
    ...basicHealth,
    diagnostics: {
      capabilityTests,
      resourceUsage,
      recentErrors,
      uptime: await getServerUptime(serverId),
      activeConnections: await getActiveConnections(serverId)
    }
  };
}
```

#### 6. Health Status Interpretation

**Status Levels**:
- **healthy**: Server responding normally, all checks passed
- **degraded**: Server responding but with warnings or reduced performance
- **unhealthy**: Server not responding or failing health checks
- **not_found**: Server not in registry or configuration

**Health Indicators**:
```javascript
function interpretHealth(health) {
  const indicators = [];

  if (health.responseTime > 2000) {
    indicators.push({
      level: 'WARNING',
      message: `High response time: ${health.responseTime}ms`,
      threshold: 2000
    });
  }

  if (health.status === 'unhealthy') {
    indicators.push({
      level: 'ERROR',
      message: `Server unhealthy: ${health.error}`,
      action: 'Investigate server logs and restart if necessary'
    });
  }

  if (health.capabilities && health.capabilities.length === 0) {
    indicators.push({
      level: 'WARNING',
      message: 'No capabilities reported',
      action: 'Check server configuration'
    });
  }

  return indicators;
}
```

### Usage Examples

#### Example 1: Check All MCP Servers
```bash
node mcp_server_health_check.js
```

**Output**:
```
MCP Server Health Check
=======================
Timestamp: 2026-01-12 10:00:00

Overall Health: HEALTHY (4/4 servers healthy)

Communication MCP Server (communication-mcp):
  Status: ✓ Healthy
  Port: 3001
  Response Time: 45ms
  Capabilities: 5 (email-send, email-receive, sms-send, social-post, notification-send)

Business Operations MCP Server (business-operations-mcp):
  Status: ✓ Healthy
  Port: 3002
  Response Time: 60ms
  Capabilities: 4 (financial-report, audit-log, document-gen, compliance-check)

Personal Assistance MCP Server (personal-assistance-mcp):
  Status: ✓ Healthy
  Port: 3003
  Response Time: 38ms
  Capabilities: 4 (calendar-manage, task-schedule, reminder-set, health-track)

Integration MCP Server (integration-mcp):
  Status: ✓ Healthy
  Port: 3004
  Response Time: 52ms
  Capabilities: 4 (data-sync, event-correlate, domain-bridge, workflow-orchestrate)

Summary:
- Total Servers: 4
- Healthy: 4
- Unhealthy: 0
- Average Response Time: 49ms

Recommendations: None - All systems operational
```

#### Example 2: Check Specific Server with Details
```bash
node mcp_server_health_check.js --server communication-mcp --detailed
```

**Output**:
```
Communication MCP Server - Detailed Health Check
================================================

Basic Health:
  Status: ✓ Healthy
  Port: 3001
  Response Time: 45ms
  Timestamp: 2026-01-12 10:00:00

Capabilities: 5
  ✓ email-send (operational)
  ✓ email-receive (operational)
  ✓ sms-send (operational)
  ✓ social-post (operational)
  ✓ notification-send (operational)

Resource Usage:
  CPU: 12%
  Memory: 256MB (25% of allocated)
  Network I/O: 1.2 MB/s

Uptime: 4 days, 0 hours, 15 minutes

Active Connections: 8

Recent Errors (last hour): 0

Diagnostics: All tests passed
```

#### Example 3: Unhealthy Server Detection
```bash
node mcp_server_health_check.js
```

**Output** (when server is down):
```
MCP Server Health Check
=======================

Overall Health: DEGRADED (3/4 servers healthy)

Communication MCP Server (communication-mcp):
  Status: ✗ UNHEALTHY
  Port: 3001
  Error: ECONNREFUSED - Connection refused
  Timestamp: 2026-01-12 10:00:00

  ⚠️  CRITICAL: Server not responding
  Recommended Action:
    1. Check if server process is running
    2. Check server logs: ./logs/communication-mcp.log
    3. Restart server: node start_mcp_server.js communication-mcp
    4. Verify port 3001 is not blocked by firewall

Business Operations MCP Server: ✓ Healthy (60ms)
Personal Assistance MCP Server: ✓ Healthy (38ms)
Integration MCP Server: ✓ Healthy (52ms)

Summary:
- Healthy: 3
- Unhealthy: 1
- Action Required: Investigate communication-mcp

⚠️  ALERT: 1 server requires immediate attention
```

#### Example 4: Continuous Monitoring
```bash
node mcp_server_health_check.js --watch --interval 30
```

**Output** (updates every 30 seconds):
```
[10:00:00] All servers healthy (4/4) - Avg response: 49ms
[10:00:30] All servers healthy (4/4) - Avg response: 51ms
[10:01:00] DEGRADED: communication-mcp unhealthy (3/4) - Avg response: 50ms
[10:01:30] DEGRADED: communication-mcp unhealthy (3/4) - Alert sent
[10:02:00] All servers healthy (4/4) - Avg response: 48ms - Recovered
```

### Acceptance Criteria

- [ ] All MCP servers checked successfully
- [ ] Health endpoints respond within timeout
- [ ] Capabilities verified for each server
- [ ] Response times measured accurately
- [ ] Overall health status calculated correctly
- [ ] Detailed diagnostics available when requested
- [ ] Error messages are clear and actionable
- [ ] Continuous monitoring works reliably
- [ ] Alerts generated for unhealthy servers
- [ ] Recovery detected and logged

### Constraints

**Timeout**: 5 seconds per server health check (total timeout: 20 seconds for all servers)

**Retry Policy**:
- Single retry after 2 seconds on timeout
- No retry on connection refused (server definitely down)

**Check Interval**: Minimum 10 seconds for continuous monitoring

**Performance Impact**: Health checks should not impact server performance (<1ms overhead)

**Network Requirements**: Requires network access to localhost ports 3001-3004

### Error Handling

**Connection Refused**:
- Server is down or not listening on port
- Action: Restart server, check configuration

**Timeout**:
- Server responding slowly or overloaded
- Action: Check server load, review performance

**Invalid Response**:
- Server running but not responding correctly
- Action: Check server logs, verify implementation

**Network Error**:
- Network issues preventing connection
- Action: Check network connectivity, firewall rules

## References

### Related Skills
- `/gold.system-health-monitor` - Overall system health
- `/gold.mcp-server-deploy` - Deploy MCP servers
- `/gold.mcp-server-load-balance` - Load balancing
- `/gold.error-recovery-auto` - Error recovery

### Documentation
- `GOLD_TIER_MCP_SERVERS.md` - MCP server configuration
- `GOLD_TIER_ARCHITECTURE_DOCS.md` - System architecture
- `mcp_server.js` - MCP server implementation
- `mcp_client.js` - MCP client implementation

### Code References
- `skills/mcp_server_deploy.js:787-795` - Health check implementation
- `mcp_server.js:290-299` - Health endpoint
- `mcp_server.js:203-212` - Capabilities endpoint
- `mcp_client.js:376-390` - Client health check

### Configuration Files
- `mcp_servers.json` - MCP server registry
- `health_check_config.json` - Health check configuration

---

**Skill Version**: 1.0.0
**Last Updated**: 2026-01-12
**Tier**: Gold
**Author**: Personal AI Employee System - Gold Tier
**Status**: Production Ready
