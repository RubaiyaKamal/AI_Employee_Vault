# MCP Setup Guide for Personal AI Employee

## Overview

Model Context Protocol (MCP) servers extend Claude Code's capabilities by allowing it to interact with external systems. For the Personal AI Employee project, MCP servers act as the "hands" for taking actions.

## Bronze Tier MCP Setup

For Bronze Tier, we focus on **read-only** or **low-risk** MCP servers:
1. **Filesystem MCP** (built-in) - Already available in Claude Code
2. **Browser MCP** (optional) - For viewing web pages
3. **Calendar MCP** (optional) - For viewing calendar events

**Note**: Email sending, payment execution, and other high-risk actions are **Silver/Gold Tier** capabilities.

## MCP Configuration File Location

Claude Code looks for MCP configuration in:
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/claude/claude_desktop_config.json`

Alternatively, for Claude Code CLI, you can create:
- `.claude-code/mcp.json` in your home directory
- Or specify with `--mcp-config` flag

## Sample MCP Configuration (Bronze Tier)

Create a file at the location above with this content:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "C:\\Users\\Lap Zone\\Personal AI Employee\\AI_Employee_Vault"],
      "env": {}
    },
    "browser": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-server-browser"],
      "env": {
        "HEADLESS": "true"
      }
    }
  }
}
```

## Installing MCP Servers

### 1. Filesystem MCP (Built-in)
This is already available in Claude Code. No installation needed.

### 2. Browser MCP (Optional for Bronze)

```bash
# Install globally
npm install -g @anthropic/mcp-server-browser

# Or use npx (no install needed)
# The config above uses npx -y which auto-downloads
```

## Testing MCP Setup

1. **Check if Claude Code can see MCP servers:**
   ```bash
   claude mcp list
   ```

2. **Test filesystem access:**
   Ask Claude Code: "List files in the vault using MCP"

3. **Test browser MCP (if installed):**
   Ask Claude Code: "Use MCP to fetch the title of https://example.com"

## Bronze Tier MCP Capabilities

With the Bronze Tier setup, Claude Code can:
- ✅ Read files in the vault
- ✅ Write files in the vault
- ✅ Create folders
- ✅ Search file contents
- ✅ Browse web pages (read-only)
- ❌ Send emails (Silver/Gold tier)
- ❌ Execute payments (Silver/Gold tier)
- ❌ Post to social media (Silver/Gold tier)

## Security Notes

For Bronze Tier:
- Filesystem MCP is restricted to the vault directory only
- Browser MCP is read-only (can view pages but not submit forms)
- No credentials or API keys are exposed yet
- All actions are logged in Claude Code's session

## Next Steps (Silver Tier)

For Silver Tier, you'll add:
- **Email MCP** - For sending/drafting emails
- **Slack MCP** - For team communication
- Custom MCP servers for your specific integrations

## Troubleshooting

**Problem**: Claude Code doesn't see MCP servers
- **Solution**: Check config file location and JSON syntax
- Run: `cat "$APPDATA\Claude\claude_desktop_config.json"` (Windows)
- Verify JSON is valid at jsonlint.com

**Problem**: `npx` command not found
- **Solution**: Install Node.js v24+ from nodejs.org
- Verify: `node --version` and `npm --version`

**Problem**: Permission denied errors
- **Solution**: Ensure vault path in config is correct
- On Windows, use double backslashes: `C:\\Users\\...`
- Or use forward slashes: `C:/Users/...`

## Reference

Official MCP Documentation:
- https://modelcontextprotocol.io/introduction
- https://modelcontextprotocol.io/quickstart
- https://github.com/anthropics/mcp-servers (reference implementations)

## MCP Configuration for This Project

Save this as `.claude-code-mcp.json` in the vault root:

```json
{
  "mcpServers": {
    "vault-filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "C:\\Users\\Lap Zone\\Personal AI Employee\\AI_Employee_Vault"
      ],
      "description": "Access Personal AI Employee vault files"
    }
  }
}
```

Then start Claude Code with:
```bash
cd "C:\Users\Lap Zone\Personal AI Employee\AI_Employee_Vault"
claude --mcp-config .claude-code-mcp.json
```

---

**Status**: Bronze Tier MCP setup ready
**Last Updated**: 2026-01-08
