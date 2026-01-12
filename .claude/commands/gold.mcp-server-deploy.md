# MCP Server Deploy Command

**Skill**: gold.mcp-server-deploy
**Tier**: Gold
**Category**: MCP Server Management

## Command

When user invokes `/gold.mcp-server-deploy`:

1. Load skill from `.claude/skills/gold.mcp-server-deploy.md`
2. Check prerequisites (Node.js, ports, resources)
3. Deploy MCP servers using `mcp_servers/` implementations
4. Verify health checks
5. Report deployment status

## Usage

```
/gold.mcp-server-deploy --all
/gold.mcp-server-deploy --server communication-mcp
```

## Implementation

Deploys these servers:
- Communication MCP (port 3001) - `mcp_servers/communication_mcp_server.js`
- Business Operations MCP (port 3002) - `mcp_servers/business_operations_mcp_server.js`
- Personal Assistance MCP (port 3003) - `mcp_servers/personal_assistance_mcp_server.js`
- Integration MCP (port 3004) - `mcp_servers/integration_mcp_server.js`

## Expected Behavior

- Validate prerequisites
- Start server processes
- Run health checks
- Register capabilities
- Report success/failures
