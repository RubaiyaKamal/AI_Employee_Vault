# Automatic Error Recovery - Gold Tier

## Title
**Auto Error Recovery** - Automatically Handle and Recover from System Errors

## Description

This skill automatically detects, classifies, and recovers from system errors using retry mechanisms, circuit breakers, fallback strategies, and graceful degradation.

**Capability Level**: Gold Tier
**Category**: Error Recovery
**Risk Level**: Medium (System behavior modification)
**Estimated Duration**: Immediate (< 1 second per error)

## Instructions

### Execution Flow

#### 1. Error Detection and Classification

**Error Types**:
- **Transient**: Network timeouts, temporary service unavailability
- **Infrastructure**: Database connection failures, service crashes
- **Security**: Authentication/authorization failures
- **Resource**: Quota exceeded, rate limits, out of memory
- **Application**: Code errors, validation failures

**Classification Logic**:
```javascript
function classifyError(error) {
  const message = error.message.toLowerCase();

  if (message.includes('timeout') || message.includes('network')) {
    return 'transient';
  } else if (message.includes('database') || message.includes('connection')) {
    return 'infrastructure';
  } else if (message.includes('auth') || message.includes('forbidden')) {
    return 'security';
  } else if (message.includes('quota') || message.includes('rate limit')) {
    return 'resource';
  }

  return 'application';
}
```

#### 2. Recovery Strategy Selection

**Strategy Matrix**:
```javascript
const recoveryStrategies = {
  transient: {
    strategy: 'retry_with_backoff',
    fallback: 'graceful_degradation',
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000
  },
  infrastructure: {
    strategy: 'circuit_breaker',
    fallback: 'alternative_service',
    threshold: 5,
    timeout: 60000
  },
  security: {
    strategy: 'immediate_fail',
    fallback: 'alert_administrator',
    escalate: true
  },
  resource: {
    strategy: 'load_shedding',
    fallback: 'queue_requests',
    timeout: 10000
  },
  application: {
    strategy: 'retry_with_backoff',
    fallback: 'safe_mode',
    maxRetries: 2
  }
};
```

#### 3. Retry with Exponential Backoff

**Implementation**:
```javascript
async function retryWithBackoff(operation, options = {}) {
  const maxRetries = options.maxRetries || 3;
  const baseDelay = options.baseDelay || 1000;
  const maxDelay = options.maxDelay || 30000;
  const multiplier = options.backoffMultiplier || 2;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      if (!isRetryableError(error)) {
        throw error;
      }

      const delay = Math.min(
        baseDelay * Math.pow(multiplier, attempt - 1),
        maxDelay
      );

      // Add jitter (±25%)
      const jitteredDelay = delay * (0.75 + Math.random() * 0.5);

      console.log(`Retry attempt ${attempt}/${maxRetries} after ${jitteredDelay}ms`);
      await sleep(jitteredDelay);
    }
  }
}
```

#### 4. Circuit Breaker Pattern

**Circuit States**:
- **Closed**: Normal operation, requests flow through
- **Open**: Service failing, requests fail fast
- **Half-Open**: Testing if service recovered

**Implementation**:
```javascript
class CircuitBreaker {
  constructor(options = {}) {
    this.threshold = options.threshold || 5;
    this.timeout = options.timeout || 60000;
    this.state = 'closed';
    this.failureCount = 0;
    this.lastFailureTime = null;
  }

  async execute(operation) {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();

      if (this.state === 'half-open') {
        this.state = 'closed';
        this.failureCount = 0;
      }

      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (this.failureCount >= this.threshold) {
        this.state = 'open';
        console.log('Circuit breaker opened');
      }

      throw error;
    }
  }
}
```

#### 5. Fallback Strategies

**Cached Data Fallback**:
```javascript
async function withCacheFallback(operation, cacheKey) {
  try {
    const result = await operation();
    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log('Using cached data due to error');
      return cached;
    }
    throw error;
  }
}
```

**Alternative Service Fallback**:
```javascript
async function withAlternativeService(primaryService, alternativeService) {
  try {
    return await primaryService();
  } catch (error) {
    console.log('Primary service failed, trying alternative');
    return await alternativeService();
  }
}
```

### Usage Examples

#### Example 1: Automatic Retry for Network Error
```javascript
// Transient network error
try {
  const data = await fetchExternalAPI();
} catch (error) {
  // Error Recovery Manager automatically detects and handles
  // - Classifies as 'transient'
  // - Applies retry with exponential backoff
  // - Attempts 3 times with increasing delays
  // - Falls back to cached data if available
}
```

**Console Output**:
```
Error detected: Network timeout
Classified as: transient
Strategy: retry_with_backoff
Retry attempt 1/3 after 1000ms
Retry attempt 2/3 after 2000ms
Retry attempt 3/3 after 4000ms
✓ Operation succeeded on attempt 3
```

#### Example 2: Circuit Breaker for Service Failure
```javascript
// Database service failing repeatedly
try {
  const records = await database.query('SELECT * FROM users');
} catch (error) {
  // After 5 failures, circuit breaker opens
  // - Future requests fail fast
  // - System uses read-only cache
  // - After timeout, circuit enters half-open state
  // - One successful request closes circuit
}
```

**Console Output**:
```
Error detected: Database connection refused
Classified as: infrastructure
Strategy: circuit_breaker
Failure count: 5/5
⚠️ Circuit breaker OPEN for database service
Using fallback: read-only cache mode
Retry will be attempted in 60 seconds
```

#### Example 3: Security Error - Immediate Fail
```javascript
// Authentication failure
try {
  const user = await authenticate(token);
} catch (error) {
  // Security errors fail immediately
  // - No retries
  // - Administrator alerted
  // - Request logged for audit
}
```

**Console Output**:
```
Error detected: Invalid authentication token
Classified as: security
Strategy: immediate_fail
🚨 Administrator alert sent
Audit log entry created: AUTH_FAILURE_20260112_100530
Request terminated - no retry
```

### Acceptance Criteria

- [ ] Errors detected in real-time
- [ ] Error types classified correctly
- [ ] Appropriate strategy selected for each type
- [ ] Retry logic works with exponential backoff
- [ ] Circuit breaker transitions states correctly
- [ ] Fallback strategies execute when needed
- [ ] Administrator alerts sent for critical errors
- [ ] All recovery attempts logged to audit trail
- [ ] Performance metrics captured
- [ ] System health updated after recovery

### Constraints

**Retry Limits**:
- Maximum 3 retries for transient errors
- Maximum 2 retries for application errors
- No retries for security errors

**Timeout Values**:
- Retry base delay: 1 second
- Retry max delay: 30 seconds
- Circuit breaker timeout: 60 seconds
- Operation timeout: 5 seconds

**Circuit Breaker Thresholds**:
- Failure threshold: 5 consecutive failures
- Recovery threshold: 1 successful request
- Reset timeout: 60 seconds

### Error Handling

**Retry Exhausted**:
- Execute fallback strategy
- Log final error
- Update system health status
- Notify monitoring system

**Circuit Breaker Open**:
- Fail fast with clear error message
- Use cached/fallback data if available
- Schedule automatic retry after timeout
- Alert operations team

**All Strategies Failed**:
- Enter safe mode
- Disable non-critical features
- Maintain core functionality
- Generate incident report

## References

### Related Skills
- `/gold.circuit-breaker-control` - Manage circuit breakers
- `/gold.graceful-degradation-apply` - Apply degradation
- `/gold.system-health-monitor` - Monitor health

### Documentation
- `GOLD_TIER_ERROR_RECOVERY.md` - Error recovery system
- `error_recovery_manager.js` - Implementation

### Code References
- `error_recovery_manager.js:94-120` - Error handling
- `error_recovery_manager.js:210-250` - Retry logic
- `error_recovery_manager.js:285-335` - Circuit breaker

---

**Skill Version**: 1.0.0
**Last Updated**: 2026-01-12
**Tier**: Gold
**Author**: Personal AI Employee System - Gold Tier
**Status**: Production Ready
