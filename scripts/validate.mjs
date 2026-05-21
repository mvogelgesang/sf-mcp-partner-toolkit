#!/usr/bin/env node

/**
 * Plugin Validation
 *
 * Validates the plugin structure before distribution:
 * 1. Required files exist (plugin.json, skills, settings)
 * 2. plugin.json is valid
 * 3. Skills have valid frontmatter
 * 4. CLAUDE.md includes key sections
 * 5. No TODO or FIXME in critical files
 *
 * Usage:
 *   npm test
 *   node scripts/validate.mjs
 */

import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

let errors = 0;
let warnings = 0;

function error(message) {
  console.error(`❌ ${message}`);
  errors++;
}

function warn(message) {
  console.warn(`⚠️  ${message}`);
  warnings++;
}

function success(message) {
  console.log(`✅ ${message}`);
}

function section(title) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${"=".repeat(60)}\n`);
}

// ── 1. Required Files ───────────────────────────────────────────────

section("1. Required Files");

const requiredFiles = [
  ".claude-plugin/plugin.json",
  "settings.json",
  "CLAUDE.md",
  "README.md",
  "LICENSE",
  "skills/setup-workspace/SKILL.md",
  "skills/scaffold-mcp-integration/SKILL.md",
  "skills/deploy-and-configure/SKILL.md",
  "skills/diagnose-connection/SKILL.md",
  "skills/validate-end-to-end/SKILL.md",
];

for (const file of requiredFiles) {
  if (existsSync(file)) {
    success(file);
  } else {
    error(`Missing required file: ${file}`);
  }
}

// ── 2. Plugin Manifest ──────────────────────────────────────────────

section("2. Plugin Manifest (.claude-plugin/plugin.json)");

try {
  const pluginJson = JSON.parse(readFileSync(".claude-plugin/plugin.json", "utf8"));

  // Check required fields
  if (pluginJson.name && typeof pluginJson.name === "string") {
    success(`name: "${pluginJson.name}"`);
    // Validate name format (lowercase, letters/numbers/hyphens)
    if (/^[a-z0-9-]+$/.test(pluginJson.name)) {
      success("name format is valid (lowercase, hyphens allowed)");
    } else {
      error("name must be lowercase with only letters, numbers, and hyphens");
    }
  } else {
    error("Missing or invalid 'name' field");
  }

  if (pluginJson.description) {
    success(`description: "${pluginJson.description.slice(0, 50)}..."`);
  } else {
    warn("Missing description");
  }

  if (pluginJson.version && /^\d+\.\d+\.\d+/.test(pluginJson.version)) {
    success(`version: ${pluginJson.version}`);
  } else {
    warn("Missing or invalid version (will use commit SHA for git-distributed plugins)");
  }

  if (pluginJson.engines && pluginJson.engines["claude-code"]) {
    success(`engines.claude-code: "${pluginJson.engines["claude-code"]}"`);
  } else {
    warn("No engines.claude-code constraint specified");
  }
} catch (err) {
  error(`Cannot parse plugin.json: ${err.message}`);
}

// ── 3. Skill Frontmatter ────────────────────────────────────────────

section("3. Skill Frontmatter");

function validateSkill(skillPath) {
  const content = readFileSync(skillPath, "utf8");

  // Check for frontmatter
  if (!content.startsWith("---\n")) {
    error(`${skillPath}: Missing frontmatter`);
    return;
  }

  const frontmatterEnd = content.indexOf("\n---\n", 4);
  if (frontmatterEnd === -1) {
    error(`${skillPath}: Invalid frontmatter (missing closing ---)`);
    return;
  }

  const frontmatter = content.slice(4, frontmatterEnd);
  const body = content.slice(frontmatterEnd + 5);

  // Check required frontmatter fields
  if (!frontmatter.includes("name:")) {
    error(`${skillPath}: Missing frontmatter field: name`);
  }
  if (!frontmatter.includes("description:")) {
    error(`${skillPath}: Missing frontmatter field: description`);
  }
  if (!frontmatter.includes("allowed-tools:")) {
    warn(`${skillPath}: Missing allowed-tools (will require permission prompts)`);
  }

  // Check for "When to use" section in body
  if (!body.includes("## When to use") && !body.includes("## When to Use")) {
    warn(`${skillPath}: Missing "When to use" section`);
  }

  // Check for "## Steps" section
  if (!body.includes("## Steps")) {
    warn(`${skillPath}: Missing "Steps" section`);
  }

  success(`${skillPath}`);
}

function findSkills(dir) {
  const skills = [];
  if (!existsSync(dir)) return skills;
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      const skillFile = join(fullPath, "SKILL.md");
      if (existsSync(skillFile)) {
        skills.push(skillFile);
      }
    }
  }
  return skills;
}

const skills = findSkills("skills");
for (const skill of skills) {
  validateSkill(skill);
}

// ── 4. Settings.json ────────────────────────────────────────────────

section("4. Settings.json");

try {
  const settings = JSON.parse(readFileSync("settings.json", "utf8"));

  if (settings.permissions && settings.permissions.allow) {
    success(`settings.json has ${settings.permissions.allow.length} permission rules`);
  } else {
    warn("settings.json has no permission rules defined");
  }
} catch (err) {
  error(`Cannot parse settings.json: ${err.message}`);
}

// ── 5. CLAUDE.md Validation ─────────────────────────────────────────

section("5. CLAUDE.md");

const claudeMd = readFileSync("CLAUDE.md", "utf8");

// Check for key sections
const claudeSections = [
  "## Common failure modes",
  "## Integration workflow",
  "## Authentication patterns",
  "## Naming conventions",
];

for (const s of claudeSections) {
  if (claudeMd.includes(s)) {
    success(`Includes "${s}"`);
  } else {
    warn(`Missing section: "${s}"`);
  }
}

// ── 6. No TODO/FIXME in Critical Files ──────────────────────────────

section("6. No Unresolved TODO/FIXME");

const criticalFiles = ["CLAUDE.md", "README.md", "settings.json", ".claude-plugin/plugin.json"];

for (const file of criticalFiles) {
  if (!existsSync(file)) continue;

  const content = readFileSync(file, "utf8");
  const todos = content.match(/TODO|FIXME/gi);

  if (todos) {
    warn(`${file} contains ${todos.length} TODO/FIXME comment(s)`);
  } else {
    success(`${file} has no TODO/FIXME`);
  }
}

// ── Summary ─────────────────────────────────────────────────────────

section("Summary");

console.log(`
Validation Results:
  Passed: ${errors === 0 ? "Yes" : "No"}
  Errors: ${errors}
  Warnings: ${warnings}
`);

if (errors > 0) {
  console.error("Validation failed. Fix errors before distributing.\n");
  process.exit(1);
}

if (warnings > 0) {
  console.warn("Validation passed with warnings. Review before distributing.\n");
}

console.log("Plugin is ready for distribution!\n");
