# Skills as the Distribution Layer: A New Model for Scaling Product Adoption

## Abstract

The traditional product rollout model — build, document, present, hope — scales linearly at best. Documentation is written for humans who must read, interpret, and translate instructions into action. Each step in that chain introduces friction, ambiguity, and error. This paper proposes a shift: **documentation should be written for agents, and the primary unit of knowledge distribution should be skills — executable workflows that produce artifacts, not instructions that describe them.** We illustrate this with a concrete case study in the Salesforce MCP ecosystem and argue that this pattern generalizes to any platform where CLI and API tooling exists.

---

## 1. The Problem with Documentation as Distribution

### 1.1 The current model

Product teams follow a well-worn playbook:

1. **Build** the product
2. **Write documentation** — getting started guides, API references, conceptual overviews
3. **Present** — webinars, workshops, enablement sessions, first-call decks
4. **Hope** — that practitioners will read the docs, follow the steps, troubleshoot their own issues, and build successfully

This model has a compounding friction problem. Every step between "product exists" and "practitioner has a working implementation" is a potential drop-off point:

- The documentation assumes context the reader doesn't have
- The reader must translate written instructions into commands, adapting for their specific environment
- Error messages are encountered that the documentation doesn't cover (or covers in a different section the reader hasn't found)
- The reader must context-switch between reading and doing, losing momentum at each transition
- When something goes wrong, the reader must diagnose the problem with whatever troubleshooting guidance exists — or give up

The result is a familiar pattern: high engagement at the top of the funnel (people attend the webinar, clone the repo, read the first page) and steep drop-off at each subsequent step. The practitioners who succeed tend to be the ones who already had adjacent knowledge. The ones who needed the most help got the least.

### 1.2 Why one-to-many doesn't scale

Traditional enablement is constrained by a bandwidth bottleneck: the ratio of experts to practitioners. A webinar can reach hundreds of people, but it cannot answer hundreds of different environment-specific questions. A getting-started guide can be read by thousands, but it cannot adapt to each reader's project structure, authentication setup, or org configuration.

The conventional response is to invest in better documentation — more examples, more troubleshooting tables, more screenshots. But this is an asymptotic game. Documentation improves linearly; the diversity of practitioner environments grows combinatorially. No amount of writing closes that gap.

### 1.3 The interpretation tax

There is a hidden cost embedded in every piece of documentation: **interpretation**. The reader must:

- Parse the instruction ("Create a Named Credential with the following properties...")
- Map it to their tools ("In my version of the CLI, that command is...")
- Adapt it to their context ("My org uses a namespace, so I need to...")
- Verify the result ("Did it work? How do I check?")

This interpretation tax is paid by every practitioner, every time. It is pure overhead — it produces no artifact, advances no integration, and is forgotten immediately after it's performed. It is the most expensive line item in product adoption, and it is almost entirely invisible.

---

## 2. The Shift: Documentation for Agents, Skills for Humans

### 2.1 What changes

The core insight is a separation of concerns:

| Role | Old model | New model |
|---|---|---|
| **Documentation** | Written for humans to read and follow | Written for agents to internalize as context |
| **Skills** | Don't exist — humans translate docs into actions | Executable workflows that produce artifacts directly |
| **Humans** | Read docs, type commands, troubleshoot | State intent, make decisions, handle exceptions |

In the new model, documentation still exists — but its audience changes. A `CLAUDE.md` file doesn't need to be scannable, well-formatted for a browser, or optimized for a human reader skimming for the one section they need. It needs to be **complete, precise, and structured for machine consumption.** It can contain error taxonomies with dozens of entries. It can describe every authentication pattern and its failure modes. It can encode naming conventions, org requirements, and deployment sequences. An agent will read all of it, every time, and apply it correctly.

Skills are the new unit of distribution. A skill is not a document that describes how to do something — it is a workflow that does it. When a practitioner invokes a skill, the agent:

1. Asks for the minimum necessary input
2. Produces real artifacts (files, configurations, deployed metadata)
3. Validates inline (runs commands to verify what it just created)
4. Handles errors using the full context from the documentation

The practitioner's job shifts from "follow instructions" to "make decisions." The agent handles the mechanics; the human handles the judgment calls.

### 2.2 Where manual handoff points remain

This model does not eliminate human involvement — it concentrates it at the points where human judgment is genuinely required. Specifically, manual handoff occurs when:

- **A browser-based UI interaction is required** — entering OAuth credentials in a Salesforce Setup page, completing an authorization flow, navigating a partner's admin console
- **A business decision is needed** — choosing which tools to expose, defining agent instructions, setting permission boundaries
- **No CLI or API exists for the operation** — some platform capabilities are only accessible through a GUI

These handoff points are not failures of the model. They are **signals about where tooling investment would have the highest leverage.** Every manual handoff point that can be converted to a CLI command or API call removes a class of friction for every future practitioner. The skill-based model makes these gaps visible and prioritizable in a way that documentation-based models do not.

### 2.3 Skills stitch together what already exists

A critical property of skills is that they are **orchestrators, not implementations.** A skill does not reimplement a CLI tool — it invokes one. A skill does not replace a wizard — it guides the practitioner through it. A skill does not duplicate documentation — it encodes the documentation as context and applies it situationally.

This means the investment in existing tools, CLIs, and APIs is not wasted — it is amplified. Every command-line tool that exists becomes a building block that skills can compose. The return on past tooling investment increases retroactively.

---

## 3. Case Study: MCP Partner Integrations

### 3.1 The traditional approach

Salesforce's Model Context Protocol (MCP) allows Agentforce agents to call external tools over HTTP. A partner integration requires four metadata components (Named Credential, External Credential, External Service Registration, Permission Set) that reference each other by API name, must be deployed together, and require post-deploy configuration.

The traditional enablement path would be:

1. Publish documentation describing the four metadata types and their relationships
2. Provide XML template files with placeholder values
3. Host a webinar walking through the process
4. Publish a troubleshooting guide for common errors

A partner SE would then: read the docs, copy the templates, manually edit XML files with their partner's values, deploy, hit an error, search the troubleshooting guide, fix, redeploy, hit a different error, and so on. The time from "first contact" to "working integration" would be measured in hours or days, constrained by the SE's availability to help.

### 3.2 The skill-based approach

Instead, we built a toolkit with five skills that map to the natural sequence of a partner engagement:

| Skill | What it does | Time |
|---|---|---|
| `/setup-workspace` | Verifies Node.js, Salesforce CLI, org connection, project structure | 2 min |
| `/scaffold-mcp-integration` | Runs an interactive wizard that generates all four metadata files | 5 min |
| `/deploy-and-configure` | Deploys metadata and walks through OAuth credential setup | 5 min |
| `/diagnose-connection` | Installs a diagnostic tool and troubleshoots failures | As needed |
| `/validate-end-to-end` | Confirms tools appear and work in Agentforce | 5 min |

The skills reference two existing tools:
- **`create-sf-mcp-client-metadata`** — a CLI wizard for metadata generation
- **MCP Workbench** — a Salesforce app for connection diagnostics

The `CLAUDE.md` encodes everything an agent needs to operate effectively: the mental model of how the four metadata components relate, both authentication patterns and their failure modes, a complete error taxonomy (11 HTTP status codes, 5 callout exception types, 3 protocol-level errors), naming conventions, and org requirements.

### 3.3 What changes for the partner SE

In the old model, the SE is a **translator** — they read documentation and manually perform the steps, adapting for each partner's specific setup. Their value is their knowledge of the platform and their ability to troubleshoot.

In the new model, the SE is a **facilitator** — they run skills on a call with the partner, make judgment calls about authentication patterns and tool selection, and handle the browser-based steps that require human interaction. The agent handles the mechanics: generating files, deploying metadata, diagnosing errors.

The SE's knowledge isn't diminished — it's redistributed. Their understanding of the platform is now encoded in the `CLAUDE.md` and skills, available to every agent session. Their live contribution on the call shifts from "I know how to do this" to "I know which decisions matter here."

### 3.4 Distribution economics

The traditional model:
- **One SE** can run **one partner session** at a time
- Knowledge transfer requires the SE to be present
- Each session starts from scratch

The skill-based model:
- **One SE** can run **one partner session** at a time (same)
- But the session is 3x faster (minutes instead of hours)
- Knowledge transfer is embedded in the skills — a junior SE or the partner themselves can run the same workflow
- Each session benefits from every previous session's learnings (error taxonomy grows over time)
- The skills are versionable, reviewable, and improvable by the whole team

The bottleneck shifts from "SE availability" to "skill coverage." And skill coverage improves monotonically — each new failure mode discovered on a call becomes a new entry in the taxonomy, benefiting every future session.

---

## 4. Principles for Skill-Based Distribution

### 4.1 Write documentation for agents, not humans

Documentation should be optimized for machine consumption:
- **Completeness over scannability** — an agent will read everything; a human won't. Include every edge case.
- **Structured data over prose** — tables, taxonomies, and decision trees over paragraphs.
- **Precise commands over conceptual explanations** — the agent needs to know what to run, not why it works.

This doesn't mean human-readable documentation is obsolete. It means the primary artifact is the agent context (`CLAUDE.md`), and human-facing docs (README, guides) are a secondary output that can be generated or maintained separately.

### 4.2 Skills should produce artifacts, not explanations

A skill that explains how to create a Named Credential is documentation. A skill that creates the Named Credential is a capability. Every skill should leave behind a tangible artifact — a file, a deployed component, a verified connection — not just a description of what to do next.

### 4.3 Validate inline, not after the fact

Each skill should verify its own output before handing off to the next step. "Deploy and hope" becomes "deploy, query, confirm." This eliminates the class of problems where a practitioner proceeds through multiple steps before discovering that step 2 failed silently.

### 4.4 Make manual handoff points explicit and minimal

Every point where the skill says "now go to the browser and do X" is a gap in the tooling surface. Track these gaps. Prioritize them. Every manual handoff point that gets automated in the future removes friction for every future practitioner retroactively.

### 4.5 Encode failure knowledge, not just success paths

The error taxonomy is the most valuable part of the system. Getting-started guides describe the happy path. Skills must handle the unhappy paths — and the agent context must contain enough diagnostic knowledge to identify and resolve failures without human escalation.

### 4.6 Skills compose existing tools; they don't replace them

Skills should invoke CLIs, call APIs, and run existing wizards. They should not reimplement functionality that already exists in a tool. This keeps the skills thin (easy to maintain), leverages existing investment in tooling, and ensures that improvements to the underlying tools automatically improve the skills.

---

## 5. Implications for Product Teams

### 5.1 What to build differently

If the primary consumer of your documentation is an agent, and the primary distribution mechanism is skills, then product investment priorities shift:

| Traditional priority | New priority |
|---|---|
| Beautiful docs site | Complete, structured `CLAUDE.md` |
| Getting-started tutorial | End-to-end skill workflow |
| Webinar content | Error taxonomy and diagnostic context |
| Screenshot-heavy guides | CLI commands and API endpoints for every operation |
| FAQ pages | Failure mode tables with symptoms, causes, and fixes |

### 5.2 What to invest in as a platform

The limiting factor in skill-based distribution is the **CLI and API surface area** of the platform. Every operation that can only be performed through a browser UI is a hard boundary for skills. Platform teams should evaluate their feature surface through this lens:

- Can a practitioner complete this operation entirely from the command line?
- If not, what is the minimum browser interaction required?
- Can we expose an API or CLI command to eliminate that interaction?

This is not a new argument — "API-first" has been a platform principle for years. But the skill-based model makes the cost of missing APIs concrete and measurable: it's the difference between a fully automated workflow and one that stops mid-stream for a manual step.

### 5.3 How to measure success

Traditional enablement metrics (webinar attendance, doc page views, support tickets) measure engagement with the enablement content. Skill-based distribution enables a different set of metrics:

- **Time from first contact to working integration** — the most direct measure of enablement effectiveness
- **Skill completion rate** — how often does a skill run to completion vs. error out?
- **Manual handoff frequency** — how often does the workflow stop for human intervention?
- **Error taxonomy coverage** — what percentage of encountered errors are in the taxonomy vs. novel?
- **Skill contribution rate** — how often do practitioners contribute new failure modes or workflow improvements back to the skills?

---

## 6. The Broader Pattern

The MCP Partner Toolkit is one instance of a general pattern:

1. A product has a **setup/integration surface** that practitioners must navigate
2. That surface can be described in **structured context** (domain model, auth patterns, failure modes)
3. The steps to navigate it can be expressed as **composable workflows** that invoke existing tools
4. The result is a **working artifact**, not a read document

This pattern applies anywhere that:
- CLI or API tooling exists for the core operations
- The integration involves multiple coordinated steps
- Practitioners come from diverse environments and contexts
- The knowledge to troubleshoot is learnable but extensive

Examples beyond MCP integrations: CI/CD pipeline setup, cloud infrastructure provisioning, SDK integration, data migration workflows, compliance configuration.

The question for any product team is not "should we write skills?" but "which parts of our adoption surface are already automatable, and what would it take to close the gaps?"

---

## 7. Conclusion

Documentation was the best tool we had for scaling knowledge when humans were the only consumers. It served us well, but it has an inherent scaling limit: every practitioner must read, interpret, and execute independently. The interpretation tax is paid by everyone, every time.

Skills change the economics. They encode expert knowledge once and distribute it as executable capability. They compose existing tools rather than replacing them. They make the gaps in tooling visible and prioritizable. They turn "go read the docs" into "let's build it right now."

This is not a future state. The tools exist today — Claude Code skills, CLI tooling, API surfaces. The shift is in how we think about the output of product enablement: not documents that describe what to do, but workflows that do it, informed by context that an agent can apply at every step.

The product team that adopts this model doesn't just ship a product and documentation. It ships capability.
