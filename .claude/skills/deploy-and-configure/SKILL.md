---
name: deploy-and-configure
description: Deploy generated MCP metadata to a Salesforce org, assign permission sets, and walk through post-deploy OAuth credential configuration. Use after /scaffold-mcp-integration has generated the four metadata files.
disable-model-invocation: true
allowed-tools: Bash Read
---

# Deploy and Configure

Deploy the generated MCP metadata to the target Salesforce org and walk through post-deploy authentication setup.

## When to use

After `/scaffold-mcp-integration` has generated the four metadata files. This is where the partner sees their integration go live in the org.

## Prerequisites

- The four metadata files exist in `force-app/main/default/` (run `/scaffold-mcp-integration` first)
- The Salesforce CLI is authenticated to the target org (run `/setup-workspace` first)

## Steps

1. **Identify the MCP name.** Check which integrations have been generated:

   ```bash
   ls force-app/main/default/externalCredentials/*.externalCredential-meta.xml 2>/dev/null | grep -v template
   ```

   Extract the MCP name from the filename (e.g., `AcmeInventory.externalCredential-meta.xml` → `AcmeInventory`).

2. **Deploy the metadata.** Deploy all four components together:

   ```bash
   sf project deploy start \
     --metadata "ExternalCredential:{MCP_NAME}" \
     --metadata "NamedCredential:{MCP_NAME}" \
     --metadata "ExternalServiceRegistration:{MCP_NAME}" \
     --metadata "PermissionSet:{MCP_NAME}_Perm_Set"
   ```

   If this is the partner's first time seeing a Salesforce deploy, explain: "This pushes the configuration files to your org. It takes about 10-20 seconds."

3. **Assign the permission set.** The running user needs access to the External Credential:

   ```bash
   sf org assign permset -n {MCP_NAME}_Perm_Set
   ```

   If targeting a specific org:
   ```bash
   sf org assign permset -n {MCP_NAME}_Perm_Set -o {ORG_ALIAS}
   ```

4. **Configure OAuth credentials (OAuth integrations only).**

   This step must be done in the browser — there is no CLI equivalent for entering External Credential principal secrets.

   a. Open the org:
   ```bash
   sf org open -o {ORG_ALIAS} --path "/lightning/setup/NamedCredential/home"
   ```

   b. Walk the partner through:
   - Click the **External Credentials** tab (not Named Credentials)
   - Find and click **{MCP_NAME}**
   - Scroll to the **Principals** section
   - Click the dropdown arrow next to **{MCP_NAME}** (the NamedPrincipal) and select **Edit**
   - Enter the **Client ID** and **Client Secret** the partner provides
   - Click **Save**

   c. Explain to the partner: "The client ID and secret are stored encrypted in Salesforce — they never appear in metadata files or source control. This is by design."

5. **Verify the deployment.** Quick smoke test that the Named Credential exists and is reachable:

   ```bash
   sf data query --query "SELECT Id, DeveloperName, Endpoint FROM NamedCredential WHERE DeveloperName = '{MCP_NAME}'" --json
   ```

   Confirm the endpoint URL matches what was configured.

6. **Guide next step.** If everything deployed cleanly, suggest:
   - `/diagnose-connection` to validate the MCP server responds correctly
   - If the partner is confident in their server, skip directly to `/validate-end-to-end`

## Common deploy failures

| Error | Cause | Fix |
|---|---|---|
| `ExternalCredential not found` | Deploy order issue — External Credential must exist before Named Credential | Re-run the deploy command (it handles ordering) or deploy External Credential first |
| `Permission set assignment failed` | User already has the permission set, or the permset references a component that failed to deploy | Check the deploy output for the root cause — usually the External Credential deploy failed |
| `Cannot modify managed component` | Trying to deploy to an org where these components are part of a managed package | Use a different MCP name, or work with the package owner |
| `Unknown metadata type: ExternalServiceRegistration` | API version too low | Update `sfdx-project.json` to `"sourceApiVersion": "66.0"` or later |

## What to explain to the partner

- "The metadata we just deployed is configuration, not code. There is nothing to compile or build."
- "OAuth secrets are never in the metadata files — they are entered through the UI and stored encrypted. This means the metadata is safe to commit to source control."
- "The permission set is what authorizes Agentforce (and users) to make callouts to your server. Without it, the connection will return a 401."
