# Auto Error Recovery Command

**Skill**: gold.error-recovery-auto
**Tier**: Gold
**Category**: Error Recovery

## Command

This skill runs automatically when errors are detected. Can also be invoked manually to test error recovery mechanisms.

## Usage

```
/gold.error-recovery-auto --test
```

## Implementation

Uses `core_systems/error_recovery_manager.js` to:
- Detect and classify errors
- Apply retry with exponential backoff
- Manage circuit breakers
- Execute fallback strategies
- Apply graceful degradation

## Automatic Triggers

- Network timeouts
- Service failures
- Database connection issues
- Resource exhaustion
- Authentication failures
