# Weekly Audit Run Command

**Skill**: gold.weekly-audit-run
**Tier**: Gold
**Category**: Audit and Reporting

## Command

When user invokes `/gold.weekly-audit-run` or requests weekly audit execution:

1. Load the skill definition from `.claude/skills/gold.weekly-audit-run.md`
2. Execute the weekly audit runner at `core_systems/weekly_audit_runner.js`
3. Follow the execution flow defined in the skill
4. Report results to user

## Usage

```
/gold.weekly-audit-run
```

Or invoke directly:
```bash
node core_systems/weekly_audit_runner.js
```

## Expected Behavior

- Collect data from all configured sources
- Analyze financial, productivity, communication data
- Generate comprehensive audit report
- Save to `./reports/audits/`
- Display executive summary to user
