# Cross-Domain Synchronization - Gold Tier

## Title
**Cross-Domain Sync** - Synchronize Data Between Personal and Business Domains

## Description

This skill synchronizes data between Personal and Business domains, enabling seamless integration while maintaining appropriate security boundaries and audit trails.

**Capability Level**: Gold Tier
**Category**: Cross-Domain Integration
**Risk Level**: Medium (Data modification across domains)
**Estimated Duration**: 1-3 minutes

## Instructions

### Execution Flow

#### 1. Initiate Cross-Domain Sync
```bash
# Sync all entities from Personal to Business
node cross_domain_sync.js --source personal --target business

# Sync specific entity types
node cross_domain_sync.js --source personal --target business --entities contacts,calendar

# Bidirectional sync
node cross_domain_sync.js --source personal --target business --direction bidirectional
```

**Parameters**:
- `--source`: Source domain (personal | business)
- `--target`: Target domain (personal | business)
- `--entities`: Entity types to sync (contacts, calendar, tasks, documents, communications)
- `--direction`: Sync direction (bidirectional | source_to_target | target_to_source)

#### 2. Validation Phase

**Domain Validation**:
- Verify source and target domains are different
- Check domains exist and are accessible
- Validate user has permissions for both domains

**Entity Type Validation**:
- Verify entity types are supported
- Check entity schemas are compatible
- Validate data structure matches expected format

#### 3. Data Reading Phase

**Read Source Data**:
```javascript
// Example: Read contacts from Personal domain
const sourceDataPath = path.join(process.cwd(), `data/${source_domain}/contacts.json`);
const sourceData = await fs.readJson(sourceDataPath);
```

**Data Structure Example**:
```json
{
  "contacts": [
    {
      "id": "contact-001",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1-555-0100",
      "category": "business",
      "lastModified": "2026-01-12T10:00:00Z"
    }
  ]
}
```

#### 4. Data Merging Phase

**Merge Strategies**:

**Bidirectional Merge**:
- Combines data from both domains
- Source takes precedence for conflicts
- Maintains unique IDs across domains

**Source-to-Target**:
- Copies all data from source to target
- Overwrites target data completely
- Simple one-way synchronization

**Target-to-Source**:
- Reverse of source-to-target
- Useful for importing data back

**Merge Algorithm**:
```javascript
function mergeDataArrays(sourceArray, targetArray) {
  const mergedMap = new Map();

  // Add target data first
  targetArray.forEach(item => {
    if (item.id) {
      mergedMap.set(item.id, item);
    }
  });

  // Add/overwrite with source data
  sourceArray.forEach(item => {
    if (item.id) {
      mergedMap.set(item.id, {
        ...item,
        syncedAt: new Date().toISOString(),
        syncDirection: `${source_domain}->${target_domain}`
      });
    }
  });

  return Array.from(mergedMap.values());
}
```

#### 5. Data Writing Phase

**Write Merged Data**:
```javascript
const targetDataPath = path.join(process.cwd(), `data/${target_domain}/contacts.json`);
await fs.writeJson(targetDataPath, mergedData, { spaces: 2 });
```

**Create Sync Record**:
```json
{
  "syncId": "sync-20260112-100530",
  "timestamp": "2026-01-12T10:05:30Z",
  "sourceDomain": "personal",
  "targetDomain": "business",
  "entities": ["contacts", "calendar"],
  "syncDirection": "bidirectional",
  "results": {
    "contacts": {
      "sourceCount": 150,
      "targetCount": 120,
      "mergedCount": 180,
      "conflicts": 15
    },
    "calendar": {
      "sourceCount": 45,
      "targetCount": 60,
      "mergedCount": 85,
      "conflicts": 5
    }
  },
  "errors": [],
  "status": "success"
}
```

#### 6. Audit Logging

**Log Sync Activity**:
```javascript
await auditLogger.info('CROSS_DOMAIN', 'DATA_SYNC', {
  syncId: results.syncId,
  sourceDomain,
  targetDomain,
  entityTypes: entity_types,
  syncDirection,
  results: results.summary,
  timestamp: new Date().toISOString()
}, userId, sessionId);
```

### Usage Examples

#### Example 1: Sync Contacts from Personal to Business
```bash
node cross_domain_sync.js --source personal --target business --entities contacts
```

**Output**:
```
Synchronizing data from personal to business
Syncing contacts entities...
Successfully synced contacts entities

Results:
- Source Count: 150 contacts
- Target Count: 120 contacts
- Merged Count: 180 contacts
- Conflicts Resolved: 15

Sync completed successfully
Sync ID: sync-20260112-100530
Duration: 2.3 seconds
```

#### Example 2: Bidirectional Sync All Entities
```bash
node cross_domain_sync.js --source personal --target business --direction bidirectional
```

**Output**:
```
Synchronizing data from personal to business (bidirectional)
Syncing contacts entities...
Syncing calendar entities...
Syncing tasks entities...
Syncing documents entities...
Syncing communications entities...

Results:
Total Entities Synced: 5
Total Items Synced: 450
Total Errors: 0

Sync Summary:
- contacts: 150 → 180 items
- calendar: 45 → 85 items
- tasks: 80 → 95 items
- documents: 120 → 145 items
- communications: 55 → 60 items

Sync completed successfully
```

#### Example 3: Error Handling
```bash
# If source domain doesn't exist
node cross_domain_sync.js --source nonexistent --target business
```

**Output**:
```
Error: Invalid domain specified
Valid domains: personal, business
Source domain 'nonexistent' not found
```

### Acceptance Criteria

- [ ] Domain validation successful
- [ ] Entity types validated and supported
- [ ] Source data read successfully
- [ ] Target data read successfully
- [ ] Data merged according to sync direction
- [ ] Conflicts resolved appropriately
- [ ] Merged data written to target
- [ ] Sync record created with results
- [ ] Audit log entry created
- [ ] No data loss during sync
- [ ] Errors handled gracefully

### Constraints

**Supported Domains**:
- Personal: User's personal data domain
- Business: Business/work data domain

**Supported Entity Types**:
- `contacts`: Contact information
- `calendar`: Calendar events and appointments
- `tasks`: Task lists and to-dos
- `documents`: Document metadata and references
- `communications`: Email and message metadata

**Data Size Limits**:
- Maximum 10,000 items per entity type
- Maximum 100MB total data per sync
- Timeout: 5 minutes per sync operation

**Conflict Resolution**:
- Source data always wins in conflicts
- Conflicts logged for review
- Manual resolution available via audit logs

**Security Requirements**:
- User must have permissions for both domains
- All syncs logged to audit trail
- Sensitive data filtered per domain policies
- Encryption for data in transit

### Error Handling

**Common Errors**:
- `DOMAIN_NOT_FOUND`: Source or target domain doesn't exist
- `PERMISSION_DENIED`: User lacks permissions for domain
- `ENTITY_TYPE_UNSUPPORTED`: Requested entity type not supported
- `DATA_FORMAT_INVALID`: Source data format incompatible
- `SYNC_CONFLICT`: Unable to resolve data conflicts
- `STORAGE_ERROR`: Unable to write merged data

**Recovery Actions**:
- Retry with exponential backoff for transient errors
- Roll back partial changes on critical errors
- Create error report for manual review
- Notify user of sync failures

## References

### Related Skills
- `/gold.domain-bridge` - Create integration bridges
- `/gold.log-analyzer` - Analyze sync logs
- `/gold.system-health-monitor` - Monitor sync operations

### Documentation
- `GOLD_TIER_CROSS_DOMAIN_INTEGRATION.md` - Integration architecture
- `GOLD_TIER_AUDIT_LOGGING.md` - Audit logging details
- `cross_domain_sync.js` - Implementation code

### Code References
- `skills/cross_domain_sync.js:431-512` - Main sync function
- `skills/cross_domain_sync.js:514-536` - Merge algorithm
- `GOLD_TIER_CROSS_DOMAIN_INTEGRATION.md:69-88` - Data models

### Configuration Files
- `cross_domain_config.json` - Domain configuration
- `entity_mappings.json` - Entity type mappings

---

**Skill Version**: 1.0.0
**Last Updated**: 2026-01-12
**Tier**: Gold
**Author**: Personal AI Employee System - Gold Tier
**Status**: Production Ready
