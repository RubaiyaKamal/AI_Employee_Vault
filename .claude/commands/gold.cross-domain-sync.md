# Cross-Domain Sync Command

**Skill**: gold.cross-domain-sync
**Tier**: Gold
**Category**: Integration

## Command

When user invokes `/gold.cross-domain-sync`:

1. Load skill from `.claude/skills/gold.cross-domain-sync.md`
2. Validate domains and permissions
3. Read source domain data
4. Merge with target domain data
5. Write synchronized data
6. Create audit trail

## Usage

```
/gold.cross-domain-sync --source personal --target business --entities contacts
/gold.cross-domain-sync --direction bidirectional
```

## Expected Behavior

- Synchronize data between Personal and Business domains
- Handle conflicts with source-wins strategy
- Log all sync operations to audit trail
- Report sync results with counts and conflicts
