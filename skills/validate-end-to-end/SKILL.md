---
name: validate-end-to-end
description: Confirm an MCP integration works end-to-end from Agentforce. Verifies tool discovery, schema correctness, and agent invocation. Use as the final step after deployment and connection testing succeed.
allowed-tools: Bash(sf org open *) Bash(sf data query *) Bash(find *) Bash(cat *) Bash(echo *) Read AskUserQuestion
---

# Validate End to End

Confirm the MCP integration works from Agentforce — not just at the connection level, but as a tool that an agent can discover and invoke.

## When to use

After `/deploy-and-configure` succeeds and `/diagnose-connection` confirms the MCP server responds. This is the final step before handing off to the partner.

## Steps

1. **Verify tool discovery via MCP Workbench.** If not already done during `/diagnose-connection`, execute:

   ```bash
   sf org open -o {ORG_ALIAS} --path "/lightning/n/MCP_Workbench"
   ```

   Guide user through the Workbench UI:
   - Select the Named Credential
   - Click **Connect** (should show server info)
   - Click **List Tools** (should show the partner's tools with names, descriptions, and input schemas)
   - Pick a simple tool and test it with sample parameters

   If tools appear and a test call returns a valid response, the integration layer is working.

2. **Verify the External Service Registration schema.** The schema in the External Service Registration metadata determines what Agentforce can see. Execute read:

   ```bash
   cat force-app/main/default/externalServiceRegistrations/{MCP_NAME}.externalServiceRegistration-meta.xml
   ```

   Look at the `<schema>` element — it should contain JSON with `tools` and optionally `resources`. If the schema was fetched live during `/scaffold-mcp-integration`, it should match what MCP Workbench shows. If a stub was used, the schema may need updating.

3. **Test from Agentforce (if the org has an agent configured).**

   Execute command to open Agentforce Agent Builder:
   ```bash
   sf org open -o {ORG_ALIAS} --path "/lightning/setup/CopilotStudio/home"
   ```

   Guide user to:
   - Open an existing agent or create a test agent
   - The partner's MCP tools should appear in the available actions list
   - Assign a tool to a topic and test it in the agent preview

   If tools do not appear in Agent Builder:
   - Execute query to verify External Service Registration deployed successfully
   - Verify the schema JSON is well-formed (a common issue is XML-escaping problems in the schema)
   - Execute query to confirm the user has the permission set assigned

4. **Document what was built.** Before ending the session, execute summary generation:

   ```bash
   echo "=== MCP Integration: {MCP_NAME} ==="
   echo ""
   echo "Metadata deployed:"
   find force-app/main/default -name "{MCP_NAME}*" -type f
   echo ""
   echo "Deploy command:"
   echo "sf project deploy start --metadata 'ExternalCredential:{MCP_NAME}' --metadata 'NamedCredential:{MCP_NAME}' --metadata 'ExternalServiceRegistration:{MCP_NAME}' --metadata 'PermissionSet:{MCP_NAME}_Perm_Set'"
   echo ""
   echo "Permission set assignment:"
   echo "sf org assign permset -n {MCP_NAME}_Perm_Set"
   ```

5. **Discuss next steps with the partner.** Typical post-session actions:
   - Commit the metadata files to the partner's source control
   - Set up CI/CD to deploy metadata to staging/production orgs
   - If the schema was stubbed, re-run the metadata wizard once the partner's MCP server is live to fetch the real schema
   - Review Agentforce topic/instruction design to ensure the agent uses the MCP tools effectively

## If tools don't appear in Agentforce

When tools fail to appear, diagnose using these patterns:

| Symptom | Likely cause | Fix |
|---|---|---|
| Tools show in MCP Workbench but not in Agent Builder | External Service Registration schema does not match or is empty | Re-run the metadata wizard with live schema fetch, or manually update the schema XML |
| Agent can see tools but invocation fails | Runtime auth issue (different user context than the one you tested with) | Execute permission set assignment to the agent's running user or the integration user |
| "No tools found" in Workbench | MCP server's `tools/list` returns empty | This is a partner-side issue — their server needs to register tools |

## What to explain to the partner

- "MCP Workbench tests the raw connection. Agentforce adds another layer — it reads the schema to know which tools exist and what parameters they take. Both need to work."
- "The metadata files we generated are portable. You can deploy them to any Salesforce org — staging, production, a partner's org — using the same `sf project deploy start` command."
- "If you add new tools to your MCP server, you'll need to update the External Service Registration schema so Agentforce can discover them. The easiest way is to re-run the metadata wizard with the live schema fetch option."
