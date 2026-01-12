# Circuit Breaker Control - Gold Tier

## Title
**Circuit Breaker Control** - Manage Circuit Breaker States and Thresholds

## Description

This skill provides manual control over circuit breaker states, allowing operators to open, close, or reset circuit breakers for specific services, and adjust thresholds.

**Capability Level**: Gold Tier
**Category**: Error Recovery
**Risk Level**: High (Direct system behavior control)
**Estimated Duration**: Immediate

## Instructions

### Execution Flow

#### 1. View Circuit Breaker Status
```bash
# View all circuit breakers
node circuit_breaker_control.js status

# View specific service
node circuit_breaker_control.js status --service database

# View detailed statistics
node circuit_breaker_control.js status --detailed
```

**Output**:
```
Circuit Breaker Status
======================
Timestamp: 2026-01-12 10:00:00

Service: database
  State: OPEN
  Failure Count: 7
  Last Failure: 2026-01-12 09:59:30
  Opened At: 2026-01-12 09:59:31
  Next Retry: 2026-01-12 10:00:31

Service: email-service
  State: CLOSED
  Failure Count: 0
  Last Success: 2026-01-12 09:58:45

Service: payment-gateway
  State: HALF-OPEN
  Failure Count: 0
  Last Attempt: 2026-01-12 09:59:55
  Testing Recovery: Yes
```

#### 2. Manual Circuit Control

**Reset Circuit Breaker**:
```bash
node circuit_breaker_control.js reset --service database
```

**Force Open Circuit**:
```bash
node circuit_breaker_control.js open --service payment-gateway --reason "Maintenance"
```

**Force Close Circuit**:
```bash
node circuit_breaker_control.js close --service database --reason "Service recovered"
```

#### 3. Adjust Thresholds

**Update Failure Threshold**:
```bash
node circuit_breaker_control.js config --service database --threshold 10
```

**Update Timeout**:
```bash
node circuit_breaker_control.js config --service database --timeout 120000
```

### Usage Examples

#### Example 1: Emergency Circuit Opening
```bash
# During deployment or maintenance
node circuit_breaker_control.js open --service payment-gateway --reason "Scheduled maintenance 2hr"
```

**Output**:
```
⚠️ Opening circuit breaker for payment-gateway
Reason: Scheduled maintenance 2hr
Previous State: CLOSED
New State: OPEN
Timestamp: 2026-01-12 10:00:00

✓ Circuit breaker opened successfully
All requests to payment-gateway will now fail fast
Cached responses will be served where available

Remember to close the circuit after maintenance:
  node circuit_breaker_control.js close --service payment-gateway
```

#### Example 2: Force Recovery
```bash
# After confirming service is healthy
node circuit_breaker_control.js close --service database --reason "Manual verification completed"
```

### Acceptance Criteria

- [ ] Circuit states displayed accurately
- [ ] Manual state changes work correctly
- [ ] Threshold updates applied immediately
- [ ] Audit logs created for all changes
- [ ] Safety checks prevent unsafe operations
- [ ] Confirmation required for critical actions

### Constraints

**Safety Checks**:
- Cannot close circuit for service that's actually down
- Warning shown before opening critical service circuits
- Audit trail required for all manual interventions

**Service Categories**:
- **Critical**: Require double confirmation (database, auth)
- **Important**: Single confirmation (email, payments)
- **Optional**: No confirmation (analytics, logs)

## References

### Related Skills
- `/gold.error-recovery-auto` - Automatic recovery
- `/gold.system-health-monitor` - System health

### Documentation
- `GOLD_TIER_ERROR_RECOVERY.md` - Error recovery system

---

**Skill Version**: 1.0.0
**Last Updated**: 2026-01-12
**Tier**: Gold
**Status**: Production Ready
