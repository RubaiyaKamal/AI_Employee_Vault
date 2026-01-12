# System Health Monitor Command

**Skill**: gold.system-health-monitor
**Tier**: Gold
**Category**: Monitoring

## Command

When user invokes `/gold.system-health-monitor`:

1. Load skill from `.claude/skills/gold.system-health-monitor.md`
2. Check all MCP servers
3. Check system resources
4. Check error recovery status
5. Check audit logging status
6. Generate health report

## Usage

```
/gold.system-health-monitor
/gold.system-health-monitor --detailed
```

## Expected Behavior

- Check all 4 MCP servers (ports 3001-3004)
- Monitor CPU, memory, disk, network
- Check circuit breaker states
- Verify audit logging operational
- Display comprehensive health status
- Generate alerts if needed
