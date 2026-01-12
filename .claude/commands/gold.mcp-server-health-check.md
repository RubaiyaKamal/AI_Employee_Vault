# MCP Server Health Check Command

**Skill**: gold.mcp-server-health-check
**Tier**: Gold
**Category**: MCP Server Management

## Command

When user invokes `/gold.mcp-server-health-check`:

1. Check all MCP servers on ports 3001-3004
2. Verify health endpoints responding
3. Measure response times
4. Verify capabilities registered
5. Report status for each server

## Usage

```
/gold.mcp-server-health-check
/gold.mcp-server-health-check --server communication-mcp
/gold.mcp-server-health-check --detailed
```

## Expected Behavior

- Check communication-mcp (port 3001)
- Check business-operations-mcp (port 3002)
- Check personal-assistance-mcp (port 3003)
- Check integration-mcp (port 3004)
- Display health status for each
- Alert if any server unhealthy
