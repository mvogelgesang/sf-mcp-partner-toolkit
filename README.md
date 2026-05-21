# MCP Integration Toolkit for Salesforce

A Claude Code plugin that provides skills for rapidly building, deploying, and validating MCP (Model Context Protocol) integrations with Salesforce Agentforce.

**Who this is for:**
- Salesforce developers building MCP integrations for their organizations
- ISV partners integrating their products with Agentforce
- Solution Engineers demonstrating MCP capabilities
- Technical architects evaluating MCP integration patterns

## Installation

Inside Claude Code, add this marketplace and install the plugin:

```text
/plugin marketplace add mvogelgesang/sf-mcp-partner-toolkit
/plugin install sf-mcp-partner-toolkit@mvogelgesang-plugins
```

The first command registers the marketplace catalog hosted in this repo. The second installs the plugin. Skills become available immediately, namespaced under `sf-mcp-partner-toolkit` (e.g., `/sf-mcp-partner-toolkit:setup-workspace`).

### Updating

Claude Code checks for updates automatically. To force a check:

```text
/plugin update sf-mcp-partner-toolkit@mvogelgesang-plugins
```

### Local development

To work on the plugin without publishing, point Claude Code at your local clone:

```bash
claude --plugin-dir /path/to/sf-mcp-partner-toolkit
```

Or add the local checkout as a marketplace for repeated testing:

```text
/plugin marketplace add /path/to/sf-mcp-partner-toolkit
/plugin install sf-mcp-partner-toolkit@mvogelgesang-plugins
```

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [Salesforce CLI](https://developer.salesforce.com/tools/salesforcecli) (`sf`)
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) v2.0+
- A Salesforce org with MCP Beta Permissions enabled
- CLI authenticated to the target org (`sf org login web`)

## Skills

Once installed, the following skills are available (namespaced under `sf-mcp-partner-toolkit`):

| Skill | Purpose |
|---|---|
| `/sf-mcp-partner-toolkit:setup-workspace` | Verify prerequisites (Node, SF CLI, org connection, SFDX project) |
| `/sf-mcp-partner-toolkit:scaffold-mcp-integration` | Generate all four metadata files non-interactively |
| `/sf-mcp-partner-toolkit:deploy-and-configure` | Deploy metadata to the org and configure OAuth credentials |
| `/sf-mcp-partner-toolkit:diagnose-connection` | Install MCP Workbench and troubleshoot connectivity issues |
| `/sf-mcp-partner-toolkit:validate-end-to-end` | Confirm tools appear in Agentforce and work end-to-end |

### Typical workflow

```
/sf-mcp-partner-toolkit:setup-workspace          <- Verify environment (2 min)
    |
    v
/sf-mcp-partner-toolkit:scaffold-mcp-integration <- Generate metadata (5 min)
    |
    v
/sf-mcp-partner-toolkit:deploy-and-configure     <- Deploy and configure auth (5 min)
    |
    v
/sf-mcp-partner-toolkit:diagnose-connection      <- Troubleshoot if needed
    |
    v
/sf-mcp-partner-toolkit:validate-end-to-end      <- Confirm integration works (5 min)
```

**Use cases:**
- **Live demos**: Run the full sequence in ~20 minutes
- **Development**: Use individual skills as you iterate
- **Troubleshooting**: Jump to `diagnose-connection` when issues arise

## Tools referenced

### create-sf-mcp-client-metadata
CLI tool that generates Salesforce metadata for MCP integrations.

- **Source**: https://github.com/mvogelgesang/create-sf-mcp-client-metadata
- **Usage**: `npm create @mvogelgesang/sf-mcp-client-metadata@latest -- --mcp-name {name} --mcp-server-url {url} --auth-type {oauth|noauth}`
- **Generates**: Named Credential, External Credential, External Service Registration, Permission Set

### MCP Workbench
Salesforce Lightning app for testing MCP server connections, validating authentication, and diagnosing common permission assignment issues.

- **Source**: https://github.com/mvogelgesang/MCP-Workbench
- **Capabilities**: Connection testing, tool discovery, tool invocation, structured error diagnostics

## Plugin structure

```
sf-mcp-partner-toolkit/
├── .claude-plugin/
│   └── plugin.json            <- Plugin manifest
├── skills/
│   ├── setup-workspace/
│   │   └── SKILL.md
│   ├── scaffold-mcp-integration/
│   │   └── SKILL.md
│   ├── deploy-and-configure/
│   │   └── SKILL.md
│   ├── diagnose-connection/
│   │   └── SKILL.md
│   └── validate-end-to-end/
│       └── SKILL.md
├── settings.json              <- Plugin permission defaults
├── CLAUDE.md                  <- Domain context for MCP integrations
└── README.md
```

## Contributing

Found a new failure mode? Built a workflow for a scenario not covered? Open a PR. The skills are markdown files — no build step, no tests to break.

## License

Apache 2.0
