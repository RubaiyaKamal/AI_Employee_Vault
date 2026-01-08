# Browse Web with Playwright

## Title
**Browse Web** - Extract Content from Websites Using Playwright MCP

## Description

This skill uses the Playwright MCP server to browse websites, extract content, and gather information from the web. It enables the AI Employee to access external data sources, check website status, and retrieve information without manual intervention.

**Capability Level**: Bronze Tier (with Playwright MCP installed)
**Category**: External Data Access
**Risk Level**: Low (Read-only web browsing)

## Instructions

### Prerequisites

**Required MCP Server**: Playwright MCP must be installed and configured.

**Installation**:
```bash
# Install Playwright MCP globally
npm install -g @playwright/mcp@latest

# Add to Claude Code configuration
claude mcp add --transport stdio playwright npx @playwright/mcp@latest

# Verify installation
claude mcp list
```

**Expected Output**:
```
playwright: npx @playwright/mcp@latest - ✓ Connected
```

### Execution Flow

#### 1. Navigate to URL

**Basic Navigation**:
```python
# Using Playwright MCP tools
navigate_to_url(url="https://example.com")
```

**Parameters**:
- `url`: Target URL (must be valid HTTP/HTTPS)
- `wait_until`: Optional - 'load', 'domcontentloaded', 'networkidle'
- `timeout`: Optional - Maximum wait time in milliseconds

#### 2. Extract Content

**A. Get Main Heading**:
```python
# Navigate to page
navigate_to_url("https://example.com")

# Extract main heading (h1)
heading = get_element_text("h1")
```

**B. Get Multiple Elements**:
```python
# Get all headings
all_headings = get_elements_text("h1, h2, h3")

# Get all links
links = get_elements("a")

# Get specific class
content = get_elements_by_class("main-content")
```

**C. Get Page Title**:
```python
title = get_page_title()
```

**D. Get Full Text Content**:
```python
text_content = get_page_text()
```

#### 3. Take Screenshot (Optional)

```python
# Take screenshot
screenshot = take_screenshot()

# Save to vault
save_file("screenshots/example_com.png", screenshot)
```

#### 4. Check Page Status

```python
# Navigate and check status
response = navigate_to_url("https://example.com")
status_code = response.status  # 200, 404, 500, etc.
```

### Acceptance Criteria

- [ ] MCP server connected successfully
- [ ] URL is valid and accessible
- [ ] Content extracted correctly
- [ ] No errors during navigation
- [ ] Results returned in usable format

### Constraints

**Bronze Tier Limitations**:
- Read-only browsing (no form submission)
- No authentication/login
- Public websites only
- No interaction with dynamic elements
- Simple content extraction only

**Security**:
- Only browse trusted websites
- No credential entry
- No file uploads
- Headless mode only (no visible browser)

**Constitution Compliance**:
- **Principle I**: Local-First - Screenshots saved to vault
- **Principle III**: Proactive - Can check website status automatically

## Examples

### Example 1: Extract Main Heading from example.com

**Input**:
```bash
/bronze.browse-web "https://example.com"
```

**Skill Execution**:
```python
# 1. Navigate to URL
page = navigate_to_url("https://example.com")

# 2. Wait for page load
wait_for_selector("h1")

# 3. Extract heading
heading = get_element_text("h1")

# 4. Extract description
description = get_element_text("p")

# 5. Return results
return {
    'url': 'https://example.com',
    'status': 200,
    'title': get_page_title(),
    'heading': heading,
    'description': description
}
```

**Expected Output**:
```
Web Browsing Results
====================
URL: https://example.com
Status: 200 OK
Title: Example Domain

Main Heading: "Example Domain"
Description: "This domain is for use in illustrative examples in documents..."

Content extracted successfully.
```

---

### Example 2: Check Website Status

**Scenario**: Verify client website is online (from urgent WhatsApp message)

**Input**:
```bash
/bronze.browse-web "https://client-website.com" --check-status
```

**Skill Execution**:
```python
# Navigate and capture status
try:
    response = navigate_to_url("https://client-website.com", timeout=10000)
    status = response.status

    if status == 200:
        return {
            'status': 'online',
            'status_code': 200,
            'message': 'Website is accessible'
        }
    else:
        return {
            'status': 'error',
            'status_code': status,
            'message': f'Website returned status {status}'
        }
except TimeoutError:
    return {
        'status': 'timeout',
        'message': 'Website did not respond within 10 seconds'
    }
except Exception as e:
    return {
        'status': 'down',
        'error': str(e),
        'message': 'Website is not accessible'
    }
```

**Output (Success)**:
```
Website Status Check
====================
URL: https://client-website.com
Status: ✅ Online (200 OK)
Response Time: 1.2 seconds

Website is accessible and responding normally.
```

**Output (Failure)**:
```
Website Status Check
====================
URL: https://client-website.com
Status: ❌ Down
Error: Connection refused

URGENT: Website is not accessible. Possible hosting issue.

Action Required:
- Check hosting provider status
- Review recent deployments
- Contact hosting support if needed
```

---

### Example 3: Extract Article Content

**Scenario**: Research competitor blog post

**Input**:
```bash
/bronze.browse-web "https://competitor.com/blog/latest-post"
```

**Skill Execution**:
```python
# Navigate to article
navigate_to_url("https://competitor.com/blog/latest-post")

# Extract article data
data = {
    'title': get_element_text("h1.article-title"),
    'author': get_element_text(".author-name"),
    'date': get_element_text(".publish-date"),
    'content': get_element_text("article.content"),
    'tags': get_elements_text(".tag"),
    'word_count': len(get_element_text("article.content").split())
}

# Create summary
summary = {
    'url': current_url(),
    'article_title': data['title'],
    'author': data['author'],
    'published': data['date'],
    'word_count': data['word_count'],
    'tags': ', '.join(data['tags']),
    'content_preview': data['content'][:200] + '...'
}

return summary
```

**Output**:
```
Article Research Results
========================
URL: https://competitor.com/blog/latest-post
Title: "10 Ways to Improve Customer Retention"
Author: John Smith
Published: January 5, 2026
Word Count: 1,850
Tags: marketing, retention, customer-service

Content Preview:
"Customer retention is crucial for business growth. In this article, we explore proven strategies that can help you keep your customers engaged and loyal. First, let's discuss the importance of..."

Full content saved to: /Research/competitor_article_20260108.md
```

---

### Example 4: Monitor Subscription Service Status

**Scenario**: Check if Netflix is experiencing outages (for cost analysis)

**Input**:
```bash
/bronze.browse-web "https://downdetector.com/status/netflix/"
```

**Skill Execution**:
```python
navigate_to_url("https://downdetector.com/status/netflix/")

# Extract status indicator
status = get_element_text(".status-indicator")
outage_count = get_element_text(".outage-count")

return {
    'service': 'Netflix',
    'status': status,
    'reports': outage_count,
    'checked_at': datetime.now().isoformat()
}
```

**Output**:
```
Service Status Check
====================
Service: Netflix
Status: No problems detected
Outage Reports: 15 (baseline)
Checked: 2026-01-08T14:30:00Z

✅ Service is operating normally.
```

---

### Example 5: Extract Pricing Information

**Scenario**: Research competitor pricing for market analysis

**Input**:
```bash
/bronze.browse-web "https://competitor.com/pricing"
```

**Skill Execution**:
```python
navigate_to_url("https://competitor.com/pricing")

# Extract pricing tiers
tiers = get_elements(".pricing-tier")

pricing_data = []
for tier in tiers:
    pricing_data.append({
        'plan': get_element_text(tier, ".plan-name"),
        'price': get_element_text(tier, ".price"),
        'features': get_elements_text(tier, ".feature")
    })

return {
    'competitor': 'Competitor.com',
    'pricing_url': current_url(),
    'tiers': pricing_data,
    'extracted_at': datetime.now().isoformat()
}
```

**Output**:
```
Competitor Pricing Analysis
============================
Competitor: Competitor.com
URL: https://competitor.com/pricing
Extracted: 2026-01-08T14:45:00Z

Pricing Tiers:
--------------
1. Basic Plan
   Price: $9.99/month
   Features:
   - 5 projects
   - 1 user
   - Email support

2. Pro Plan
   Price: $29.99/month
   Features:
   - Unlimited projects
   - 5 users
   - Priority support
   - API access

3. Enterprise
   Price: Custom pricing
   Features:
   - Unlimited everything
   - Dedicated support
   - Custom integrations

Analysis saved to: /Research/competitor_pricing_20260108.md
```

## References

### Related Skills
- `/bronze.process-inbox.md` - Can use browse-web for email link verification
- `/bronze.generate-plan.md` - Can include web research in plans
- `/bronze.check-watchers.md` - Can check external service status pages

### Documentation
- [Playwright MCP Documentation](https://github.com/microsoft/playwright-mcp)
- [Playwright Selectors](https://playwright.dev/docs/selectors)
- [Playwright API](https://playwright.dev/docs/api/class-playwright)

### MCP Configuration
- **Server Name**: `playwright`
- **Command**: `npx @playwright/mcp@latest`
- **Transport**: stdio
- **Configuration File**: `~/.claude.json` (local) or `.claude-code-mcp.json` (project)

### External Resources
- [Web Scraping Best Practices](https://www.scrapinghub.com/web-scraping-best-practices/)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [CSS Selectors Reference](https://www.w3schools.com/cssref/css_selectors.php)

### Related Constitution Principles
- **Principle I**: Local-First Privacy - Screenshots/content saved locally
- **Principle III**: Proactive Autonomous Management - Automatic status checks
- **Principle IV**: Comprehensive Audit Logging - All web requests logged

### Common Use Cases

**Business Intelligence**:
- Monitor competitor websites
- Track pricing changes
- Research market trends
- Verify client website status

**Cost Optimization**:
- Check service status pages
- Monitor subscription services
- Research alternative tools

**Automation**:
- Verify links in emails before clicking
- Check website availability before sending clients
- Monitor public APIs for status

**Research**:
- Extract article content
- Gather industry news
- Check documentation
- Verify information

### Troubleshooting

**Issue**: MCP server not connecting

**Solution**:
```bash
# Reinstall Playwright MCP
npm install -g @playwright/mcp@latest

# Verify installation
claude mcp list

# Check Node.js version (requires v16+)
node --version
```

---

**Issue**: "Navigation timeout"

**Solution**:
- Increase timeout: `navigate_to_url(url, timeout=30000)`
- Check internet connection
- Verify URL is accessible in browser
- Website may be blocking automated access

---

**Issue**: "Element not found"

**Solution**:
- Check selector is correct
- Wait for element: `wait_for_selector(".my-class")`
- Verify page loaded completely
- Use browser DevTools to inspect element

---

**Skill Version**: 1.0.0
**Last Updated**: 2026-01-08
**Tier**: Bronze (requires Playwright MCP)
**Author**: Personal AI Employee System
**Status**: Production Ready (after MCP installation)
