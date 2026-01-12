# MCP Server Deployment - Gold Tier

## Title
**MCP Server Deploy** - Deploy and Configure Specialized MCP Servers

## Description

This skill deploys the four specialized MCP servers (Communication, Business Operations, Personal Assistance, and Integration) with proper configuration, health checks, and monitoring.

**Capability Level**: Gold Tier
**Category**: MCP Server Management
**Risk Level**: Medium (System infrastructure changes)
**Estimated Duration**: 2-5 minutes

## Instructions

### Execution Flow

#### 1. Initiate Deployment
```bash
# Deploy all MCP servers
node mcp_server_deploy.js --all

# Deploy specific server
node mcp_server_deploy.js --server communication-mcp

# Deploy with custom configuration
node mcp_server_deploy.js --all --config custom_mcp_config.json

# Deploy in development mode
node mcp_server_deploy.js --all --mode development
```

**Parameters**:
- `--all`: Deploy all four MCP servers
- `--server <id>`: Deploy specific server by ID
- `--config <path>`: Custom configuration file path
- `--mode <mode>`: Deployment mode (production | development | staging)
- `--port-offset <n>`: Port number offset for custom ports

#### 2. Pre-Deployment Validation

**Check Prerequisites**:
```javascript
async function validatePrerequisites() {
  const checks = {
    nodeVersion: await checkNodeVersion(), // Require Node.js 16+
    portsAvailable: await checkPortsAvailable([3001, 3002, 3003, 3004]),
    diskSpace: await checkDiskSpace(), // Require 10GB+ free
    memoryAvailable: await checkMemoryAvailable(), // Require 2GB+ available
    networkConnectivity: await checkNetworkConnectivity()
  };

  return checks;
}
```

**Port Availability Check**:
```javascript
async function checkPortsAvailable(ports) {
  const results = {};

  for (const port of ports) {
    try {
      const server = net.createServer();
      await new Promise((resolve, reject) => {
        server.listen(port, () => {
          server.close();
          resolve();
        });
        server.on('error', reject);
      });
      results[port] = { available: true };
    } catch (error) {
      results[port] = { available: false, error: error.message };
    }
  }

  return results;
}
```

#### 3. Server Configuration

**MCP Server Registry**:
```javascript
const mcpServers = {
  'communication-mcp': {
    name: 'Communication MCP Server',
    port: 3001,
    script: './mcp_servers/communication_mcp_server.js',
    env: {
      MCP_SERVER_ID: 'communication-mcp',
      MCP_SERVER_PORT: '3001',
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASS: process.env.SMTP_PASS,
      LINKEDIN_CLIENT_ID: process.env.LINKEDIN_CLIENT_ID,
      LINKEDIN_CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET
    },
    capabilities: ['email-send', 'email-receive', 'sms-send', 'social-post', 'notification-send'],
    healthCheckPath: '/health',
    dependencies: ['audit-logging']
  },
  'business-operations-mcp': {
    name: 'Business Operations MCP Server',
    port: 3002,
    script: './mcp_servers/business_operations_mcp_server.js',
    env: {
      MCP_SERVER_ID: 'business-operations-mcp',
      MCP_SERVER_PORT: '3002',
      DATABASE_URL: process.env.DATABASE_URL,
      XERO_CLIENT_ID: process.env.XERO_CLIENT_ID,
      XERO_CLIENT_SECRET: process.env.XERO_CLIENT_SECRET
    },
    capabilities: ['financial-report', 'audit-log', 'document-gen', 'compliance-check'],
    healthCheckPath: '/health',
    dependencies: ['audit-logging', 'database']
  },
  'personal-assistance-mcp': {
    name: 'Personal Assistance MCP Server',
    port: 3003,
    script: './mcp_servers/personal_assistance_mcp_server.js',
    env: {
      MCP_SERVER_ID: 'personal-assistance-mcp',
      MCP_SERVER_PORT: '3003',
      GOOGLE_CALENDAR_CLIENT_ID: process.env.GOOGLE_CALENDAR_CLIENT_ID,
      GOOGLE_CALENDAR_CLIENT_SECRET: process.env.GOOGLE_CALENDAR_CLIENT_SECRET
    },
    capabilities: ['calendar-manage', 'task-schedule', 'reminder-set', 'health-track'],
    healthCheckPath: '/health',
    dependencies: ['audit-logging']
  },
  'integration-mcp': {
    name: 'Integration MCP Server',
    port: 3004,
    script: './mcp_servers/integration_mcp_server.js',
    env: {
      MCP_SERVER_ID: 'integration-mcp',
      MCP_SERVER_PORT: '3004',
      COMMUNICATION_MCP_URL: 'http://localhost:3001',
      BUSINESS_OPS_MCP_URL: 'http://localhost:3002',
      PERSONAL_ASSIST_MCP_URL: 'http://localhost:3003'
    },
    capabilities: ['data-sync', 'event-correlate', 'domain-bridge', 'workflow-orchestrate'],
    healthCheckPath: '/health',
    dependencies: ['audit-logging', 'communication-mcp', 'business-operations-mcp', 'personal-assistance-mcp']
  }
};
```

#### 4. Deployment Execution

**Deploy Single Server**:
```javascript
async function deployServer(serverId) {
  const serverConfig = mcpServers[serverId];

  console.log(`Deploying ${serverConfig.name}...`);

  // 1. Check dependencies
  await checkDependencies(serverConfig.dependencies);

  // 2. Create process with environment variables
  const serverProcess = spawn('node', [serverConfig.script], {
    env: { ...process.env, ...serverConfig.env },
    detached: true,
    stdio: 'inherit'
  });

  // 3. Save PID for process management
  await savePID(serverId, serverProcess.pid);

  // 4. Wait for server to be ready
  await waitForServerReady(serverId, serverConfig.port, 30000);

  // 5. Verify health check
  const health = await checkServerHealth(serverId, serverConfig.port);

  if (!health.healthy) {
    throw new Error(`Server ${serverId} failed health check`);
  }

  console.log(`✓ ${serverConfig.name} deployed successfully on port ${serverConfig.port}`);

  return {
    serverId,
    pid: serverProcess.pid,
    port: serverConfig.port,
    status: 'running',
    health
  };
}
```

**Wait for Server Ready**:
```javascript
async function waitForServerReady(serverId, port, timeout = 30000) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      await axios.get(`http://localhost:${port}/health`, { timeout: 1000 });
      return true;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  throw new Error(`Server ${serverId} failed to start within ${timeout}ms`);
}
```

#### 5. Post-Deployment Verification

**Health Check All Servers**:
```javascript
async function verifyDeployment() {
  const results = {};

  for (const serverId in mcpServers) {
    const server = mcpServers[serverId];
    const health = await checkServerHealth(serverId, server.port);
    results[serverId] = health;
  }

  return {
    timestamp: new Date().toISOString(),
    allHealthy: Object.values(results).every(r => r.healthy),
    servers: results
  };
}
```

**Register with Service Discovery**:
```javascript
async function registerWithServiceDiscovery(serverId, serverConfig) {
  // Register server with service discovery system
  const registration = {
    id: serverId,
    name: serverConfig.name,
    address: 'localhost',
    port: serverConfig.port,
    capabilities: serverConfig.capabilities,
    healthCheckPath: serverConfig.healthCheckPath,
    registeredAt: new Date().toISOString()
  };

  await serviceDiscovery.register(registration);
}
```

### Usage Examples

#### Example 1: Deploy All MCP Servers
```bash
node mcp_server_deploy.js --all
```

**Output**:
```
MCP Server Deployment
=====================

Checking prerequisites...
✓ Node.js version: 18.17.0 (meets requirement: 16+)
✓ Port 3001: Available
✓ Port 3002: Available
✓ Port 3003: Available
✓ Port 3004: Available
✓ Disk space: 125GB available (meets requirement: 10GB+)
✓ Memory: 8GB available (meets requirement: 2GB+)
✓ Network connectivity: Online

Deploying MCP servers...

[1/4] Deploying Communication MCP Server...
  - Starting process... PID: 12345
  - Waiting for server ready...
  - Health check: ✓ Healthy
  - Registered capabilities: 5
✓ Communication MCP Server deployed on port 3001

[2/4] Deploying Business Operations MCP Server...
  - Starting process... PID: 12346
  - Waiting for server ready...
  - Health check: ✓ Healthy
  - Registered capabilities: 4
✓ Business Operations MCP Server deployed on port 3002

[3/4] Deploying Personal Assistance MCP Server...
  - Starting process... PID: 12347
  - Waiting for server ready...
  - Health check: ✓ Healthy
  - Registered capabilities: 4
✓ Personal Assistance MCP Server deployed on port 3003

[4/4] Deploying Integration MCP Server...
  - Checking dependencies: communication-mcp, business-operations-mcp, personal-assistance-mcp
  - Starting process... PID: 12348
  - Waiting for server ready...
  - Health check: ✓ Healthy
  - Registered capabilities: 4
✓ Integration MCP Server deployed on port 3004

Deployment Summary
==================
Total Servers: 4
Successfully Deployed: 4
Failed: 0
Total Capabilities: 17

All MCP servers are running and healthy!

Process IDs saved to: ./mcp_server_pids.json
Access logs at: ./logs/mcp_servers/
```

#### Example 2: Deploy Single Server
```bash
node mcp_server_deploy.js --server communication-mcp
```

#### Example 3: Deployment Failure Handling
```bash
node mcp_server_deploy.js --all
```

**Output** (when port is occupied):
```
MCP Server Deployment
=====================

Checking prerequisites...
✓ Node.js version: 18.17.0
✗ Port 3001: In use (process: chrome.exe)
✓ Port 3002: Available
✓ Port 3003: Available
✓ Port 3004: Available

ERROR: Prerequisites check failed
- Port 3001 is already in use

Recommended Actions:
1. Stop the process using port 3001
2. Or deploy with port offset: --port-offset 100
3. Or deploy specific servers: --server business-operations-mcp

Deployment aborted.
```

### Acceptance Criteria

- [ ] Prerequisites validated before deployment
- [ ] All required ports checked for availability
- [ ] Environment variables properly loaded
- [ ] Server processes started successfully
- [ ] PIDs saved for process management
- [ ] Health checks pass for all servers
- [ ] Capabilities registered correctly
- [ ] Service discovery registration complete
- [ ] Deployment logs created
- [ ] Error handling works for failures

### Constraints

**System Requirements**:
- Node.js 16+ installed
- Ports 3001-3004 available (or custom offset)
- 10GB+ disk space
- 2GB+ available memory
- Network connectivity for external services

**Deployment Order**:
1. Communication MCP Server (no dependencies)
2. Business Operations MCP Server (no dependencies)
3. Personal Assistance MCP Server (no dependencies)
4. Integration MCP Server (depends on servers 1-3)

**Timeout Values**:
- Server startup: 30 seconds
- Health check: 5 seconds
- Total deployment: 2 minutes

### Error Handling

**Port Already in Use**:
- Action: Identify process using port
- Suggest: Kill process or use different port
- Retry: Not automatic

**Server Fails to Start**:
- Action: Check server logs
- Suggest: Verify environment variables
- Retry: Manual restart required

**Health Check Fails**:
- Action: Check server is running
- Suggest: Review server logs for errors
- Retry: Automatic with 3 attempts

**Dependency Not Available**:
- Action: Deploy dependency first
- Suggest: Use `--all` flag for automatic ordering
- Retry: After dependency resolution

## References

### Related Skills
- `/gold.mcp-server-health-check` - Check server health
- `/gold.system-health-monitor` - Monitor system
- `/gold.error-recovery-auto` - Handle errors

### Documentation
- `GOLD_TIER_MCP_SERVERS.md` - MCP server specs
- `mcp_server_deploy.js` - Deployment script

### Configuration Files
- `mcp_servers.json` - Server registry
- `mcp_server_pids.json` - Process IDs
- `.env` - Environment variables

---

**Skill Version**: 1.0.0
**Last Updated**: 2026-01-12
**Tier**: Gold
**Author**: Personal AI Employee System - Gold Tier
**Status**: Production Ready
