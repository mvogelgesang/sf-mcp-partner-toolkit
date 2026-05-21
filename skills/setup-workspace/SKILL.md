---
name: setup-workspace
description: Verify that the current environment has everything needed for an MCP partner integration session. Checks Node.js, Salesforce CLI, org connection, and SFDX project structure. Run this at the start of every partner call.
allowed-tools: Bash(node --version) Bash(sf *) Bash(ls *) Bash(find *) Bash(mkdir *) Read AskUserQuestion
---

# Setup Workspace

Verify that the current environment has everything needed for an MCP partner integration session. This skill executes all verification checks automatically.

## When to use

At the start of every partner session, before generating any metadata. Catches missing prerequisites early so you don't hit them mid-demo.

## Steps

1. **Check Node.js version.** Execute `node --version` to verify. Must be v18 or later (required by the metadata wizard). If missing or too old, provide link to https://nodejs.org/ for installation.

2. **Check Salesforce CLI.** Execute `sf --version` to verify installation. If missing, provide installation instructions: `npm install -g @salesforce/cli`

3. **Check org connection.** Execute `sf org display --json` to confirm the CLI is authenticated to a target org. If no default org is set, ask the user which org alias to use and execute `sf org display --target-org {alias} --json`.

4. **Verify the org is usable.** From the `sf org display` output, confirm:
   - The access token is present (not expired)
   - The instance URL is reachable
   - Note the org ID and instance — you will need these for troubleshooting
   
   If the token is expired, execute `sf org open -o {alias}` to test/refresh the session, or guide user through `sf org login web --alias {alias}` (opens browser for OAuth flow).

5. **Check for an existing SFDX project.** Check if `sfdx-project.json` exists in the current directory. If it does not exist, ask the user whether to:
   - (a) Create a new project — execute `sf project generate --name {partner-name}-mcp-integration`
   - (b) Navigate to an existing project directory — ask for the path

6. **Verify project structure.** Confirm `force-app/main/default/` exists. The metadata wizard writes files here. If missing, create it.

7. **Summarize readiness.** Report what is ready and what needs attention:
   ```
   Environment check:
     Node.js:       v20.11.0 ✓
     Salesforce CLI: @salesforce/cli/2.x.x ✓
     Target org:     my-scratch-org (00D...) ✓
     SFDX project:   ./sfdx-project.json ✓
     Ready to proceed.
   ```

## Error recovery

When commands fail, provide specific guidance:

- **No Node.js or version < 18**: Provide link to https://nodejs.org/ — they need v18+ installed
- **No SF CLI**: Provide command `npm install -g @salesforce/cli` for installation
- **No org connection**: Execute `sf org login web --alias {alias}` to authenticate (opens browser for OAuth flow)
- **Expired token**: Execute `sf org login web --alias {alias}` to re-auth, or execute `sf org open -o {alias}` to test if the session is still valid
