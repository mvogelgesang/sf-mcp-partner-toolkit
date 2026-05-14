# MCP Partner Toolkit

A set of Claude Code skills for Salesforce Partner Solution Engineers to rapidly build, deploy, and validate MCP (Model Context Protocol) integrations during partner engagements.

## What this is

This is not an application or a library. It is a **workspace template** — a directory structure containing a `CLAUDE.md` and a set of skills that give Claude Code the context and workflows needed to assist with MCP partner integrations.

When you open this in Claude Code or Cursor, Claude understands:
- What MCP-in-Salesforce means and how the metadata components fit together
- How to invoke the `create-sf-mcp-client-metadata` wizard to generate integration metadata
- How to install and use MCP Workbench to diagnose connectivity issues
- The full error taxonomy for MCP connection failures and how to fix each one

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [Salesforce CLI](https://developer.salesforce.com/tools/salesforcecli) (`sf`)
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) or [Cursor](https://cursor.sh/) with Claude
- A Salesforce org with MCP Beta Permissions enabled
- CLI authenticated to the target org (`sf org login web`)

## Getting started

### Option A: Add to an existing SFDX project (recommended)

From the root of any SFDX project:

```bash
npx @mvogelgesang/sf-mcp-partner-toolkit@latest
```

This copies `CLAUDE.md` and `.claude/skills/` into the current directory. Open the project in Claude Code or Cursor and start with `/setup-workspace`.

To target a different directory:

```bash
npx @mvogelgesang/sf-mcp-partner-toolkit@latest --target ./my-project
```

### Option B: Clone this repo directly

For exploring the toolkit or contributing:

```bash
git clone https://github.com/mvogelgesang/sf-mcp-partner-toolkit.git
cd sf-mcp-partner-toolkit
```

### Updating

Re-run the `npx` command with `--force` to pull in the latest skills:

```bash
npx @mvogelgesang/sf-mcp-partner-toolkit@latest --force
```

## Skills

The skills are designed to be run in sequence during a partner call, but each can be used independently.

| Skill | Purpose |
|---|---|
| `/setup-workspace` | Verify prerequisites (Node, SF CLI, org connection, SFDX project) |
| `/scaffold-mcp-integration` | Generate all four metadata files using the interactive wizard |
| `/deploy-and-configure` | Deploy metadata to the org and walk through OAuth credential setup |
| `/diagnose-connection` | Install MCP Workbench and troubleshoot connectivity issues |
| `/validate-end-to-end` | Confirm tools appear in Agentforce and work end-to-end |

### Typical session flow

```
15-minute intro deck
    │
    ▼
/setup-workspace          ← 2 min: verify environment
    │
    ▼
/scaffold-mcp-integration ← 5 min: generate metadata with the partner
    │
    ▼
/deploy-and-configure     ← 5 min: deploy and enter OAuth credentials
    │
    ▼
/diagnose-connection      ← as needed: troubleshoot if something fails
    │
    ▼
/validate-end-to-end      ← 5 min: prove it works in Agentforce
    │
    ▼
Partner leaves with working metadata + deploy commands
```

## Tools referenced

### create-sf-mcp-client-metadata
Interactive CLI wizard that generates Salesforce metadata for MCP integrations.

- **Source**: https://github.com/mvogelgesang/create-sf-mcp-client-metadata
- **Usage**: `npm create @mvogelgesang/sf-mcp-client-metadata@latest`
- **Generates**: Named Credential, External Credential, External Service Registration, Permission Set

### MCP Workbench
Salesforce Lightning app for testing MCP server connections from inside the org.

- **Source**: https://github.com/mvogelgesang/MCP-Workbench
- **Install**: `sf package install -p "MCPWorkbench@0.1.0-2" -o {ORG}`
- **Capabilities**: Connection testing, tool discovery, tool invocation, structured error diagnostics

## Customizing for your team

### Adding new skills

Create a new `.md` file in `.claude/skills/`. Follow the existing pattern:
1. A clear title and description of when to use it
2. Prerequisites (what must be true before this skill runs)
3. Numbered steps with exact commands
4. A troubleshooting table for common failures
5. "What to explain to the partner" section for the live-call context

### Updating the CLAUDE.md

The `CLAUDE.md` is the shared context that all skills inherit. If you discover a new failure mode during a partner call, add it to the "Common failure modes" table. This benefits every SE on the next call.

### Updating tool versions

When `create-sf-mcp-client-metadata` or MCP Workbench release new versions:
1. Update the version references in `CLAUDE.md` and the relevant skills
2. Test the updated workflow against a scratch org
3. Commit and push — all SEs get the update on their next pull

## Contributing

Found a new failure mode? Built a workflow for a scenario not covered? Open a PR. The skills are markdown files — no build step, no tests to break. The bar for contribution is intentionally low.

## License

Apache 2.0
