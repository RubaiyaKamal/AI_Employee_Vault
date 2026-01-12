# CEO Briefing Generate Command

**Skill**: gold.ceo-briefing-generate
**Tier**: Gold
**Category**: Strategic Reporting

## Command

When user invokes `/gold.ceo-briefing-generate` or requests CEO briefing:

1. Load skill from `.claude/skills/gold.ceo-briefing-generate.md`
2. Execute briefing generator at `core_systems/ceo_briefing_generator.js`
3. Aggregate data from all domains
4. Generate executive-level briefing
5. Save and display results

## Usage

```
/gold.ceo-briefing-generate [period]
```

Periods: weekly, monthly, quarterly

## Expected Behavior

- Aggregate financial and operational metrics
- Process strategic intelligence
- Generate formatted briefing
- Save to `./briefings/`
- Display executive summary
