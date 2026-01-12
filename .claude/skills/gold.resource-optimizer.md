# Resource Optimizer - Gold Tier

## Title
**Resource Optimizer** - Optimize System Resource Usage

## Description

This skill analyzes system resource usage (CPU, memory, disk, network) and applies optimizations to improve performance and reduce resource consumption.

**Capability Level**: Gold Tier
**Category**: Monitoring and Maintenance
**Risk Level**: Low (Performance optimization)
**Estimated Duration**: 1-3 minutes

## Instructions

### Execution Flow

#### 1. Analyze Resource Usage
```bash
# Analyze all resources
node resource_optimizer.js analyze

# Analyze specific resource
node resource_optimizer.js analyze --resource memory

# Detailed analysis with recommendations
node resource_optimizer.js analyze --detailed
```

#### 2. Apply Optimizations
```bash
# Apply all recommended optimizations
node resource_optimizer.js optimize --apply-all

# Apply specific optimization
node resource_optimizer.js optimize --type memory-cache --apply

# Dry run (show what would be done)
node resource_optimizer.js optimize --dry-run
```

### Usage Examples

#### Example 1: Memory Optimization
```bash
node resource_optimizer.js analyze --resource memory
```

**Output**:
```
Memory Analysis
===============
Timestamp: 2026-01-12 10:00:00

Current Usage:
  Heap Used: 2.3 GB / 4.0 GB (58%)
  RSS: 2.8 GB
  External: 156 MB

Memory Distribution:
  Application Code: 45%
  Cached Data: 30%
  Buffers: 15%
  Other: 10%

Recommendations:
  1. Reduce cache size from 1.2GB to 800MB (saves 400MB)
  2. Clear stale cache entries older than 1 hour (saves ~200MB)
  3. Enable memory pooling for frequent allocations
  4. Increase garbage collection frequency

Estimated Savings: 600MB (21%)

Apply optimizations:
  node resource_optimizer.js optimize --type memory --apply
```

#### Example 2: CPU Optimization
```bash
node resource_optimizer.js analyze --resource cpu
```

**Output**:
```
CPU Analysis
============
Current Usage: 72% (6/8 cores)

Top CPU Consumers:
  1. Background jobs: 35%
  2. API request processing: 25%
  3. Data synchronization: 12%

Recommendations:
  1. Throttle background jobs to run during low-traffic hours
  2. Implement request queuing to smooth spikes
  3. Optimize data sync algorithm (reduce polling frequency)
  4. Enable worker thread pooling

Estimated Reduction: 20% CPU usage
```

### Acceptance Criteria

- [ ] Resource usage analyzed accurately
- [ ] Optimization recommendations generated
- [ ] Optimizations applied successfully
- [ ] Performance metrics captured
- [ ] No service disruption during optimization
- [ ] Rollback available if needed

### Constraints

**Safe Optimization Thresholds**:
- Memory: Don't reduce cache below 20% of heap
- CPU: Keep at least 25% capacity available
- Disk: Maintain 15% free space minimum

**Optimization Timing**:
- Non-critical optimizations: Anytime
- Memory-intensive: During low-traffic periods
- CPU-intensive: Schedule for maintenance windows

## References

### Related Skills
- `/gold.system-health-monitor` - Health monitoring
- `/gold.graceful-degradation-apply` - Degradation

### Documentation
- `resource_optimizer.js` - Implementation

---

**Skill Version**: 1.0.0
**Last Updated**: 2026-01-12
**Tier**: Gold
**Status**: Production Ready
