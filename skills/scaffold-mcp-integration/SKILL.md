---
name: scaffold-mcp-integration
description: Generate the four Salesforce metadata files needed to register a partner's MCP server. Uses create-sf-mcp-client-metadata CLI tool (v1.1.0+) with flag-based arguments for non-interactive execution. Use after /setup-workspace confirms the environment is ready.
allowed-tools: Bash(npm create @mvogelgesang/sf-mcp-client-metadata*) Bash(npx @mvogelgesang/create-sf-mcp-client-metadata*) Bash(find *) Bash(cat *) Read AskUserQuestion
---

# Scaffold MCP Integration

Generate the four Salesforce metadata files needed to register a partner's MCP server. Executes the `create-sf-mcp-client-metadata` CLI tool non-interactively using command-line flags.

## When to use

After `/setup-workspace` confirms the environment is ready. This is the main build step — the partner sees their integration take shape in real time.

## Steps

1. **Confirm working directory.** Verify you are in the SFDX project root by checking for `sfdx-project.json`.

2. **Gather integration details.**

   Ask the user the following two questions in plain prose and wait for their typed response:

   - **MCP integration name** — "What would you like to name this MCP integration? Use letters only, PascalCase (e.g., `AcmeInventory`, `WeatherAPI`). No numbers, underscores, or spaces."
   - **MCP server URL** — "What is the full HTTPS URL of the MCP server? (e.g., `https://mcp.example.com/v1`)"

   Validate the responses:
   - Name must match `/^[A-Za-z]+$/` and be PascalCase. If not, ask again.
   - URL must start with `https://`. If not, ask again.

   Then ask the authentication method using AskUserQuestion (this one is a genuine choice):

   ```
   AskUserQuestion(
     questions: [
       {
         question: "Which authentication method does the MCP server use?",
         header: "Auth",
         multiSelect: false,
         options: [
           {
             label: "OAuth 2.0 Client Credentials",
             description: "Most common - requires token endpoint URL (Recommended)"
           },
           {
             label: "No Authentication",
             description: "Server uses API keys, IP allowlisting, or other custom auth"
           }
         ]
       }
     ]
   )
   ```

   **If OAuth was selected**, ask in plain prose:

   - **OAuth token endpoint URL** — "What is the OAuth token endpoint URL? (e.g., `https://auth.acme.dev/oauth/token` or `https://acme.auth0.com/oauth/token`)"

   Validate the response starts with `https://`.

   **Optional**: Ask about namespace if the target org might use one:

   ```
   AskUserQuestion(
     questions: [
       {
         question: "Does the target Salesforce org use a namespace?",
         header: "Namespace",
         multiSelect: false,
         options: [
           {
             label: "No namespace",
             description: "Standard org - leave empty (Recommended)"
           },
           {
             label: "Has namespace",
             description: "Managed package or namespaced org"
           }
         ]
       }
     ]
   )
   ```

   If "Has namespace" was selected, ask in plain prose: "What is the namespace?"

3. **Execute the metadata generator.** Run the command with all collected parameters as flags:

   ```bash
   npm create @mvogelgesang/sf-mcp-client-metadata@latest -- \
     --mcp-name {MCP_NAME} \
     --mcp-server-url {SERVER_URL} \
     --auth-type {oauth|noauth} \
     [--auth-provider-url {TOKEN_URL}] \
     [--namespace {NAMESPACE}] \
     [--target {path-to-sfdx-project}]
   ```

   **Parameter mapping:**
   - `--mcp-name`: The integration name (letters only, PascalCase)
   - `--mcp-server-url`: The MCP server URL
   - `--auth-type`: `oauth` or `noauth` based on user selection
   - `--auth-provider-url`: Only include if auth-type is oauth
   - `--namespace`: Only include if user specified a namespace
   - `--target`: Only include if not in the SFDX project root

   **Important:** The command now runs **non-interactively** with all parameters passed via flags. No user input is needed during execution.

   While the command runs, explain what's being generated:
   - "The **Named Credential** is where Salesforce stores your server's URL. Think of it as a URL bookmark with auth attached."
   - "The **External Credential** holds the OAuth configuration. After we deploy, we'll enter your client ID and secret there."
   - "The **External Service Registration** is your MCP server's capabilities manifest — the tools and resources Agentforce can see."
   - "The **Permission Set** controls which users can make callouts to your server."

4. **Review the generated files.** After the command completes, execute verification:

   ```bash
   find force-app/main/default -name "{MCP_NAME}*" -type f
   ```

   Confirm you see four files:
   - `externalCredentials/{MCP_NAME}.externalCredential-meta.xml`
   - `namedCredentials/{MCP_NAME}.namedCredential-meta.xml`
   - `externalServiceRegistrations/{MCP_NAME}.externalServiceRegistration-meta.xml`
   - `permissionsets/{MCP_NAME}_Perm_Set.permissionset-meta.xml`

5. **Quick sanity check.** Read the Named Credential file and confirm the URL is correct:

   ```bash
   cat force-app/main/default/namedCredentials/{MCP_NAME}.namedCredential-meta.xml
   ```

   Verify the `<url>` element matches what the partner provided.

6. **Guide next step.** Report that metadata is ready and suggest proceeding with `/deploy-and-configure`.

## If the wizard fails

When errors occur during wizard execution:

- **"npm create" not found**: They may need `npm >= 7`. Execute fallback: `npx @mvogelgesang/create-sf-mcp-client-metadata@latest`
- **Schema fetch fails**: This is fine — the wizard falls back to a stub schema. The schema can be updated later by re-running the wizard or manually editing the External Service Registration XML.
- **"name must contain only letters"**: The MCP name cannot have numbers, underscores, or spaces. Use PascalCase like `AcmeInventory`. Ask for a corrected name and re-run.
- **Existing files warning**: The wizard detects existing integrations with the same name. Confirm with the user before proceeding (will overwrite).
