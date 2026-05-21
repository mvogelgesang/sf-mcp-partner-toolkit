---
name: deploy-and-configure
description: Deploy generated MCP metadata to a Salesforce org, assign permission sets, and walk through post-deploy OAuth credential configuration. Use after /scaffold-mcp-integration has generated the four metadata files.
allowed-tools: Bash(sf project deploy *) Bash(sf org assign permset *) Bash(sf org open *) Bash(sf data query *) Bash(ls *) Read AskUserQuestion
---

# Deploy and Configure

Deploy the generated MCP metadata to the target Salesforce org and complete post-deploy authentication setup.

## When to use

After `/scaffold-mcp-integration` has generated the four metadata files. This is where the partner sees their integration go live in the org.

## Prerequisites

- The four metadata files exist in `force-app/main/default/` (run `/scaffold-mcp-integration` first)
- The Salesforce CLI is authenticated to the target org (run `/setup-workspace` first)

## Steps

1. **Identify the MCP name.** Execute a search for generated integrations:

   ```bash
   ls force-app/main/default/externalCredentials/*.externalCredential-meta.xml 2>/dev/null | grep -v template
   ```

   Extract the MCP name from the filename (e.g., `AcmeInventory.externalCredential-meta.xml` → `AcmeInventory`).

2. **Deploy the metadata.** Execute deployment of all four components together:

   ```bash
   sf project deploy start \
     --metadata "ExternalCredential:{MCP_NAME}" \
     --metadata "NamedCredential:{MCP_NAME}" \
     --metadata "ExternalServiceRegistration:{MCP_NAME}" \
     --metadata "PermissionSet:{MCP_NAME}_Perm_Set"
   ```

   Explain to partner during deploy: "This pushes the configuration files to your org. It takes about 10-20 seconds."

3. **Assign the permission set.** Execute permission set assignment so the running user has access to the External Credential:

   ```bash
   sf org assign permset -n {MCP_NAME}_Perm_Set
   ```

   If targeting a specific org, include the org alias:
   ```bash
   sf org assign permset -n {MCP_NAME}_Perm_Set -o {ORG_ALIAS}
   ```

4. **Configure OAuth credentials (OAuth integrations only).**

   This step must be done in the browser — there is no CLI equivalent for entering External Credential principal secrets.

   a. Execute command to open the org to Named Credentials setup:
   ```bash
   sf org open -o {ORG_ALIAS} --path "/lightning/setup/NamedCredential/home"
   ```

   b. Guide the partner through the browser UI:
   - Click the **External Credentials** tab (not Named Credentials)
   - Find and click **{MCP_NAME}**
   - Scroll to the **Principals** section
   - Click the dropdown arrow next to **{MCP_NAME}** (the NamedPrincipal) and select **Edit**
   - Enter the **Client ID** and **Client Secret** the partner provides
   - Click **Save**

   c. Explain to the partner: "The client ID and secret are stored encrypted in Salesforce — they never appear in metadata files or source control. This is by design."

5. **Register MCP tools with Agentforce.**

   After deploying the metadata, you must explicitly add the MCP tools to make them available to agents.

   a. Execute command to open the MCP Server configuration:
   ```bash
   sf org open -o {ORG_ALIAS} --path "/lightning/setup/McpServer/home"
   ```

   b. Guide the partner through the browser UI:
   - Find and click on **{MCP_NAME}** in the list of MCP servers
   - Click the **Manage Tools** button
   - Review the list of available tools from the MCP server
   - Click **Add** next to each tool you want to make available to agents
   - Click **Save**

   c. Explain to the partner: "This step registers which tools from your MCP server should be visible to Agentforce. You can add or remove tools at any time without redeploying metadata."

   **Note:** If the MCP server requires OAuth and credentials haven't been configured yet (step 4), the tool list may fail to load. Complete OAuth configuration first, then return to this step.

6. **Verify the deployment.** Execute a query to confirm the Named Credential exists and has the correct URL:

   ```bash
   sf data query --query "SELECT Id, DeveloperName, Endpoint FROM NamedCredential WHERE DeveloperName = '{MCP_NAME}'" --json
   ```

   Confirm the endpoint URL matches what was configured.

7. **Guide next step.** If everything deployed cleanly, suggest:
   - `/diagnose-connection` to validate the MCP server responds correctly
   - If the partner is confident in their server, skip directly to `/validate-end-to-end`

## Common deploy failures

When deployment fails, diagnose using these patterns:

| Error | Cause | Fix |
|---|---|---|
| `ExternalCredential not found` | Deploy order issue — External Credential must exist before Named Credential | Re-run the deploy command (it handles ordering) or deploy External Credential first |
| `Permission set assignment failed` | User already has the permission set, or the permset references a component that failed to deploy | Check the deploy output for the root cause — usually the External Credential deploy failed |
| `Cannot modify managed component` | Trying to deploy to an org where these components are part of a managed package | Use a different MCP name, or work with the package owner |
| `Unknown metadata type: ExternalServiceRegistration` | API version too low | Update `sfdx-project.json` to `"sourceApiVersion": "66.0"` or later, then re-deploy |

## What to explain to the partner

- "The metadata we just deployed is configuration, not code. There is nothing to compile or build."
- "OAuth secrets are never in the metadata files — they are entered through the UI and stored encrypted. This means the metadata is safe to commit to source control."
- "The permission set is what authorizes Agentforce (and users) to make callouts to your server. Without it, the connection will return a 401."
