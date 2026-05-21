# MCP Integration Toolkit for Salesforce

This plugin provides Claude Code with the context and workflows needed to build, deploy, and validate MCP (Model Context Protocol) integrations with Salesforce Agentforce. Use it for development, live demos, troubleshooting, or as reference documentation for your MCP integration project.

## What MCP-in-Salesforce means

MCP is a protocol that lets Agentforce agents call external tools and read external resources over HTTP. You register your MCP server with Salesforce, and Agentforce agents can discover and invoke your tools at runtime.

The integration surface is four metadata components:

| Metadata Type | What it does |
|---|---|
| **Named Credential** | Stores the MCP server endpoint URL and links to the External Credential for auth |
| **External Credential** | Holds the authentication configuration (OAuth client credentials, or no auth) |
| **External Service Registration** | Registers the MCP server's tool/resource schema so Agentforce can discover capabilities |
| **Permission Set** | Grants users access to the External Credential (required for callouts to work) |

These four files are tightly coupled — they reference each other by API name. The `create-sf-mcp-client-metadata` wizard generates all four in sync.

## Authentication patterns

### OAuth 2.0 Client Credentials (most common)
- You will need: token endpoint URL, client ID, client secret, scopes
- External Credential uses `authenticationProtocol=Oauth` with `ClientCredentialsClientSecret`
- After deploy, an admin must enter the client ID and secret in Setup > Named Credentials > External Credentials > {name} > edit the principal
- **Common failure**: forgetting to populate the principal after deploy — the callout will return 401

### No Authentication
- External Credential uses `authenticationProtocol=NoAuthentication`
- Simpler setup, but the MCP server must handle auth differently (API key in URL, IP allowlisting, etc.)

### Post-deploy configuration checklist
1. Deploy metadata (`sf project deploy start`)
2. Assign the permission set to the running user (`sf org assign permset`)
3. For OAuth: navigate to Setup > Named Credentials > External Credentials > {name} and enter client ID + secret on the NamedPrincipal
4. **Register tools**: navigate to Setup > MCP Servers (`/lightning/setup/McpServer`), click the server name, then **Manage Tools** and add the tools you want available to agents
5. Test the connection using MCP Workbench (see `/diagnose-connection` skill)

## Common failure modes

These are the issues you will encounter most often when building MCP integrations.

| Symptom | Cause | Fix |
|---|---|---|
| Tools not appearing in Agent Builder | MCP tools not registered in Setup | Navigate to Setup > MCP Servers > {server name} > Manage Tools and add the tools |
| 401 Unauthorized | OAuth credentials not populated in External Credential principal | Enter client ID + secret in Setup > Named Credentials > External Credentials |
| 401 Unauthorized | Permission set not assigned | `sf org assign permset -n {MCP_NAME}_Perm_Set` |
| 403 Forbidden | Salesforce outbound IPs not allowlisted on your MCP server | Allowlist Salesforce IP ranges for the org's instance (find in Setup > Security > Network Access) |
| 403 with HTML body | WAF/CDN blocking the request (Cloudflare, AWS WAF, etc.) | Configure allowlist or bypass rule in your firewall/CDN |
| 404 Not Found | Wrong endpoint URL in Named Credential | Check the URL — common mistakes: missing `/mcp`, trailing slash mismatch, wrong version path |
| `Unauthorized endpoint` exception | Remote Site Setting missing or Named Credential URL mismatch | Verify the Named Credential URL matches the MCP server exactly |
| `No such host` exception | DNS resolution failure — typo in URL or server is down | Verify URL, try resolving from your machine: `nslookup {hostname}` |
| Connection timeout | MCP server is unreachable from Salesforce's network | Check if the server is publicly accessible (not behind a VPN/private network) |
| `We couldn't access the credential(s)` | UserExternalCredential record missing | Assign the permission set, or manually create the UserExternalCredential in Setup |
| 429 Too Many Requests | Rate limiting on the MCP server | Wait and retry, or increase rate limits on your MCP server for Salesforce requests |
| Schema validation errors after deploy | External Service Registration schema is stale | Re-run the metadata wizard and fetch a fresh schema from the MCP server |

## Tools in this toolkit

### create-sf-mcp-client-metadata
**What:** Interactive CLI wizard that generates all four metadata files for an MCP integration.
**Install:** `npm create @mvogelgesang/sf-mcp-client-metadata@latest` (run from SFDX project root)
**Source:** https://github.com/mvogelgesang/create-sf-mcp-client-metadata
**Key details:**
- Zero dependencies — uses only Node.js built-ins
- Prompts for: MCP name (letters only), server URL (https), auth type (OAuth or NoAuth), OAuth token URL, namespace
- Can optionally fetch the live schema from the MCP server during setup (requires client ID + secret for OAuth servers)
- Outputs to `force-app/main/default/` under `externalCredentials/`, `namedCredentials/`, `externalServiceRegistrations/`, `permissionsets/`
- MCP protocol version: `2025-06-18`

### MCP Workbench
**What:** Salesforce Lightning app for testing MCP server connections inside the org.
**Install:** `sf package install -p "MCPWorkbench@0.1.0-2" -o {TARGET_ORG}` then `sf org assign permset --name MCP_Workbench -o {TARGET_ORG}`
**Source:** https://github.com/mvogelgesang/MCP-Workbench
**Key details:**
- In-org UI — accessed via App Launcher > MCP Workbench
- Tests `initialize`, `tools/list`, `resources/list`, and `tools/call` JSON-RPC methods
- Dynamically generates input forms from tool schemas
- Provides structured error messages with troubleshooting guidance for every HTTP status code and callout exception type
- For source deploy to namespaced orgs: clone the repo and run `sf project deploy start --source-dir force-app/main/default`

## Naming conventions

When generating metadata, use these conventions:
- **MCP Name**: PascalCase, letters only (e.g., `AcmeInventory`, `StripePayments`)
- **Permission Set**: `{MCP_NAME}_Perm_Set` (auto-generated by the wizard)
- **Description fields**: Always fill these in — they surface in Agentforce's tool picker and affect agent routing quality

## Org requirements

- Salesforce org with **MCP Beta Permissions** enabled
- API version 66.0 or later
- The running user needs System Administrator profile or equivalent permissions to deploy metadata and configure Named Credentials
- For scratch orgs: include the MCP beta feature flag in `project-scratch-def.json`

## Integration workflow

The plugin skills follow this sequence:

1. `/sf-mcp-partner-toolkit:setup-workspace` — Verify prerequisites and connect to the target org
2. `/sf-mcp-partner-toolkit:scaffold-mcp-integration` — Generate all metadata using the create wizard
3. `/sf-mcp-partner-toolkit:deploy-and-configure` — Deploy metadata and configure authentication
4. `/sf-mcp-partner-toolkit:diagnose-connection` — Install MCP Workbench and/or troubleshoot failures
5. `/sf-mcp-partner-toolkit:validate-end-to-end` — Confirm the integration works from Agentforce
