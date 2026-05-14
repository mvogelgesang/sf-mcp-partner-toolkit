# Diagnose Connection

Troubleshoot MCP server connectivity issues using MCP Workbench and CLI diagnostics. This skill covers both installing the diagnostic tool and systematically identifying connection failures.

## When to use

- After `/deploy-and-configure` if the connection is not working
- When a partner reports that their Agentforce agent cannot reach their MCP server
- Proactively after deploy to verify the integration before handing it off

## Tools used

**MCP Workbench** (https://github.com/mvogelgesang/MCP-Workbench) — a Salesforce Lightning app that tests MCP connections from inside the org. It sends real JSON-RPC requests through the Named Credential and provides structured error diagnostics.

## Steps

### Phase 1: Install MCP Workbench (if not already installed)

1. **Check if MCP Workbench is already installed:**

   ```bash
   sf data query --query "SELECT Id, NamespacePrefix, DeveloperName FROM ApexClass WHERE Name = 'McpToolTester'" --json -o {ORG_ALIAS}
   ```

   If it returns a result, skip to Phase 2.

2. **Install the package:**

   ```bash
   sf package install -p "MCPWorkbench@0.1.0-2" -o {ORG_ALIAS} --wait 5
   ```

   For namespaced orgs where package install may not work, deploy from source instead:
   ```bash
   cd /tmp && git clone https://github.com/mvogelgesang/MCP-Workbench.git && cd MCP-Workbench
   sf project deploy start --source-dir force-app/main/default -o {ORG_ALIAS}
   ```

3. **Assign the permission set:**

   ```bash
   sf org assign permset --name MCP_Workbench -o {ORG_ALIAS}
   ```

4. **Open the workbench:**

   ```bash
   sf org open -o {ORG_ALIAS} --path "/lightning/n/MCP_Workbench"
   ```

### Phase 2: Test the connection in MCP Workbench

Walk the user through the MCP Workbench UI:

1. **Select the Named Credential** from the dropdown (it should show `{MCP_NAME}`)
2. **Click "Connect"** — this sends an MCP `initialize` JSON-RPC request
3. **If successful**: the server name, version, and protocol version appear. Continue to "List Tools" to verify tool discovery.
4. **If failed**: the workbench displays a structured error with HTTP status code and troubleshooting guidance. Use the error taxonomy below to diagnose.

### Phase 3: CLI-based diagnostics (when the UI is not enough)

If the workbench error is not sufficient, or you prefer CLI-based investigation:

1. **Verify the Named Credential exists and has the right URL:**

   ```bash
   sf data query --query "SELECT DeveloperName, Endpoint FROM NamedCredential WHERE DeveloperName = '{MCP_NAME}'" --json -o {ORG_ALIAS}
   ```

2. **Check the External Credential has a principal configured:**

   ```bash
   sf data query --query "SELECT Id, DeveloperName, AuthenticationProtocol FROM ExternalCredential WHERE DeveloperName = '{MCP_NAME}'" --json -o {ORG_ALIAS}
   ```

3. **Verify the permission set is assigned:**

   ```bash
   sf data query --query "SELECT Id, Assignee.Name, PermissionSet.Name FROM PermissionSetAssignment WHERE PermissionSet.Name = '{MCP_NAME}_Perm_Set'" --json -o {ORG_ALIAS}
   ```

   If no results, assign it:
   ```bash
   sf org assign permset -n {MCP_NAME}_Perm_Set -o {ORG_ALIAS}
   ```

4. **Test the MCP server directly from your machine (outside Salesforce):**

   ```bash
   curl -s -X POST {MCP_SERVER_URL} \
     -H "Content-Type: application/json" \
     -H "Accept: application/json" \
     -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"diagnostic-test","version":"1.0.0"}}}' \
     | python3 -m json.tool
   ```

   If this works but the Salesforce callout fails, the issue is in the Salesforce-to-server path (auth, networking, Named Credential config).

   If this also fails, the issue is on the MCP server side.

5. **For OAuth — test the token endpoint directly:**

   ```bash
   curl -s -X POST {AUTH_PROVIDER_URL} \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=client_credentials&client_id={CLIENT_ID}&client_secret={CLIENT_SECRET}&scope=read" \
     | python3 -m json.tool
   ```

   Look for a valid `access_token` in the response. If this fails, the OAuth configuration is the problem — not Salesforce.

## Error taxonomy

Use this to diagnose based on the error you see in MCP Workbench or Salesforce debug logs:

### HTTP Status Codes

| Code | Meaning | Action |
|---|---|---|
| **401** | Authentication failed | Check: (1) OAuth client ID + secret entered in External Credential principal? (2) Permission set assigned? (3) Credentials correct? (4) Token endpoint URL correct? |
| **403** | Forbidden | Check: (1) Salesforce outbound IPs allowlisted on partner server? (2) WAF/CDN blocking? (ask partner to check their server logs) (3) OAuth scopes sufficient? |
| **403 with HTML body** | WAF/gateway block (Cloudflare, AWS WAF) | Partner must create an IP allowlist rule for Salesforce outbound IPs. See: https://help.salesforce.com/s/articleView?id=000382092 |
| **404** | Endpoint not found | Verify the URL path — check for missing `/mcp` suffix, wrong API version, trailing slash mismatch |
| **407** | Proxy auth required | Rare — indicates a corporate proxy between Salesforce and the internet. Escalate. |
| **429** | Rate limited | Wait and retry. Ask partner to increase rate limits for Salesforce's integration client. |
| **500** | Server error | Problem is on the partner's MCP server. Share the request payload so they can reproduce. |
| **502/503/504** | Server unavailable/timeout | Partner's server or infrastructure is down or overloaded. Nothing to fix on the Salesforce side. |

### Salesforce Callout Exceptions

| Exception message contains | Meaning | Action |
|---|---|---|
| `Unauthorized endpoint` | Remote Site Setting missing or Named Credential URL does not match | Named Credentials should auto-authorize the endpoint. Verify the URL in the Named Credential metadata matches the actual server URL exactly. |
| `timeout` or `timed out` | Callout exceeded 120-second limit | Partner's server is too slow or unreachable from Salesforce's network. Test with curl from your machine to compare. |
| `No such host` | DNS resolution failed | Typo in the URL, or the server's DNS is not publicly resolvable. Run `nslookup {hostname}` to verify. |
| `Connection refused` | Server is not accepting connections on that port | Server may be down, or the port is wrong. Verify the URL includes the correct port if non-standard. |
| `We couldn't access the credential(s)` | UserExternalCredential record missing | Assign the permission set: `sf org assign permset -n {MCP_NAME}_Perm_Set` |

### JSON-RPC / MCP Protocol Errors

| Symptom | Meaning | Action |
|---|---|---|
| Valid HTTP 200 but empty or malformed response | Server does not implement MCP protocol correctly | Check the server's MCP compliance. The response must be valid JSON-RPC 2.0 with `jsonrpc`, `id`, and `result` fields. |
| `Method not found` in JSON-RPC error | Server does not support the requested method | Verify the server supports `initialize`, `tools/list`, and `tools/call`. |
| Protocol version mismatch | Server expects a different MCP protocol version | Check what version the server advertises. Salesforce and MCP Workbench use `2025-06-18`. |

## What to explain to the partner

- "MCP Workbench is a diagnostic tool — think of it like Postman for MCP connections inside Salesforce."
- "When we test from Workbench, the request goes through the same path as Agentforce — same Named Credential, same auth, same network route. So if it works here, it will work in your agent."
- "If curl works from my machine but the Salesforce callout fails, the issue is usually networking (IP allowlists) or auth configuration (credentials not entered, permission set not assigned)."
