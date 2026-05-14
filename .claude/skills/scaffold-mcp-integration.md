# Scaffold MCP Integration

Generate the four Salesforce metadata files needed to register a partner's MCP server. Uses the `create-sf-mcp-client-metadata` interactive wizard.

## When to use

After `/setup-workspace` confirms the environment is ready. This is the main build step — the partner sees their integration take shape in real time.

## Before you begin

Collect this information from the partner (ask conversationally, not as a form):

| Info needed | Example | Notes |
|---|---|---|
| **Partner/integration name** | `AcmeInventory` | Letters only, no numbers or underscores. PascalCase. |
| **MCP server URL** | `https://mcp.acme.dev/v1` | Must be HTTPS. Confirm the exact path — `/mcp`, `/v1/mcp`, etc. matter. |
| **Auth type** | OAuth or No Auth | OAuth 2.0 Client Credentials is most common. |
| **OAuth token endpoint** | `https://auth.acme.dev/oauth/token` | Only needed for OAuth. |
| **Client ID and Secret** | (partner provides) | Only needed if you want to fetch the live schema during setup. Not stored in metadata — entered post-deploy. |
| **Namespace** | (usually empty) | Only needed if the target org uses a namespace. |

## Steps

1. **Confirm working directory.** Ensure you are in the SFDX project root (where `sfdx-project.json` lives).

2. **Launch the metadata wizard.** Run this command — it is interactive, so the user will answer prompts in their terminal:

   ```bash
   npm create @mvogelgesang/sf-mcp-client-metadata@latest
   ```

   If the project root is not the current directory, use:
   ```bash
   npm create @mvogelgesang/sf-mcp-client-metadata@latest -- --target {path-to-sfdx-project}
   ```

   **Important:** This command opens an interactive prompt. Tell the user what values to enter at each step:
   - **MCP Name**: Enter the partner name (letters only)
   - **MCP Server URL**: Enter the full HTTPS endpoint
   - **Auth Type**: Select OAuth or NoAuth
   - **Auth Provider URL**: Enter the OAuth token endpoint (OAuth only)
   - **Namespace**: Press Enter to skip unless the org uses one
   - **Fetch schema?**: Say Yes if the partner has a running server and can provide credentials. Say No if the server isn't live yet — a stub schema will be used.

3. **Review the generated files.** After the wizard completes, verify the output:

   ```bash
   find force-app/main/default -name "{MCP_NAME}*" -type f
   ```

   You should see four files:
   - `externalCredentials/{MCP_NAME}.externalCredential-meta.xml`
   - `namedCredentials/{MCP_NAME}.namedCredential-meta.xml`
   - `externalServiceRegistrations/{MCP_NAME}.externalServiceRegistration-meta.xml`
   - `permissionsets/{MCP_NAME}_Perm_Set.permissionset-meta.xml`

4. **Quick sanity check.** Read the Named Credential file and confirm the URL is correct:

   ```bash
   cat force-app/main/default/namedCredentials/{MCP_NAME}.namedCredential-meta.xml
   ```

   Verify `<url>` matches what the partner provided.

5. **Guide next step.** Tell the user the metadata is ready and suggest proceeding with `/deploy-and-configure`.

## If the wizard fails

- **"npm create" not found**: They may need `npm >= 7`. Try `npx @mvogelgesang/create-sf-mcp-client-metadata@latest` as a fallback.
- **Schema fetch fails**: This is fine — skip it. The wizard falls back to a stub schema. The schema can be updated later by re-running the wizard or manually editing the External Service Registration XML.
- **"name must contain only letters"**: The MCP name cannot have numbers, underscores, or spaces. Use PascalCase like `AcmeInventory`.
- **Existing files warning**: The wizard detects existing integrations with the same name. Confirm with the user before overwriting.

## What to explain to the partner

While the wizard runs, explain what each file does:
- "The **Named Credential** is where Salesforce stores your server's URL. Think of it as a URL bookmark with auth attached."
- "The **External Credential** holds the OAuth configuration. After we deploy, we'll enter your client ID and secret there."
- "The **External Service Registration** is your MCP server's capabilities manifest — the tools and resources Agentforce can see."
- "The **Permission Set** controls which users can make callouts to your server."
