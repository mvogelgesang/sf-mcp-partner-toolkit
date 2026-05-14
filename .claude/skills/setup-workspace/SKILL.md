---
name: setup-workspace
description: Verify that the current environment has everything needed for an MCP partner integration session. Checks Node.js, Salesforce CLI, org connection, and SFDX project structure. Run this at the start of every partner call.
allowed-tools: Bash Read
---

# Setup Workspace

Verify that the current environment has everything needed for an MCP partner integration session. This skill is the first thing to run on a call.

## When to use

At the start of every partner session, before generating any metadata. Catches missing prerequisites early so you don't hit them mid-demo.

## Steps

1. **Check Node.js version.** Run `node --version`. Must be v18 or later (required by the metadata wizard).

2. **Check Salesforce CLI.** Run `sf --version`. Must be installed.

3. **Check org connection.** Run `sf org display --json` to confirm the CLI is authenticated to a target org. If no default org is set, ask the user which org alias to use and run `sf org display --target-org {alias} --json`.

4. **Verify the org is usable.** From the `sf org display` output, confirm:
   - The access token is present (not expired)
   - The instance URL is reachable
   - Note the org ID and instance — you will need these for troubleshooting

5. **Check for an existing SFDX project.** Look for `sfdx-project.json` in the current directory. If it does not exist, ask the user whether to:
   - (a) Create a new project with `sf project generate --name {partner-name}-mcp-integration`
   - (b) Navigate to an existing project directory

6. **Verify project structure.** Confirm `force-app/main/default/` exists. The metadata wizard writes files here.

7. **Summarize readiness.** Report what is ready and what needs attention:
   ```
   Environment check:
     Node.js:       v20.11.0 ✓
     Salesforce CLI: @salesforce/cli/2.x.x ✓
     Target org:     my-scratch-org (00D...) ✓
     SFDX project:   ./sfdx-project.json ✓
     Ready to proceed.
   ```

## If something is missing

- **No Node.js**: Link to https://nodejs.org/ — they need v18+.
- **No SF CLI**: `npm install -g @salesforce/cli`
- **No org connection**: `sf org login web --alias {alias}` (opens browser for OAuth flow)
- **Expired token**: `sf org login web --alias {alias}` to re-auth, or `sf org open -o {alias}` to test if the session is still valid.
