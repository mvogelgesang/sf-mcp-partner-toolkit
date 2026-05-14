#!/usr/bin/env node

/**
 * MCP Partner Toolkit initializer
 *
 * Copies CLAUDE.md and .claude/skills/ into the current working directory
 * (or a --target path) so Claude Code / Cursor picks up the MCP partner
 * integration skills automatically.
 *
 * Usage:
 *   npx @mvogelgesang/sf-mcp-partner-toolkit@latest
 *   npx @mvogelgesang/sf-mcp-partner-toolkit@latest --target ./my-project
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { resolve, join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── CLI args ────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.includes("-h") || args.includes("--help")) {
  console.log(`
MCP Partner Toolkit

Copies Claude Code skills for Salesforce MCP partner integrations
into your project directory.

Usage:
  npx @mvogelgesang/sf-mcp-partner-toolkit@latest [--target <path>]

Options:
  --target <path>  Directory to write files into (default: current directory)
  --force          Overwrite existing files without prompting
  -h, --help       Show this help message

What gets created:
  CLAUDE.md                              Domain context for Claude Code
  .claude/skills/setup-workspace.md      Verify prerequisites
  .claude/skills/scaffold-mcp-integration.md  Generate MCP metadata
  .claude/skills/deploy-and-configure.md Deploy and configure auth
  .claude/skills/diagnose-connection.md  Troubleshoot with MCP Workbench
  .claude/skills/validate-end-to-end.md  Confirm Agentforce integration
`);
  process.exit(0);
}

const targetIdx = args.indexOf("--target");
const targetDir = targetIdx !== -1 && args[targetIdx + 1]
  ? resolve(args[targetIdx + 1])
  : process.cwd();

const force = args.includes("--force");

// ── Files to copy ───────────────────────────────────────────────────

const filesToCopy = [
  "CLAUDE.md",
  ...readdirSync(join(__dirname, ".claude", "skills")).map(
    (f) => join(".claude", "skills", f)
  ),
];

// ── Pre-flight checks ───────────────────────────────────────────────

if (!existsSync(targetDir)) {
  console.error(`Error: target directory does not exist: ${targetDir}`);
  process.exit(1);
}

// Check for existing files
const existing = filesToCopy.filter((f) => existsSync(join(targetDir, f)));

if (existing.length > 0 && !force) {
  console.log("\nThe following files already exist in the target directory:\n");
  for (const f of existing) {
    console.log(`  ${f}`);
  }
  console.log("\nRe-run with --force to overwrite, or remove them first.\n");
  process.exit(1);
}

// ── Copy files ──────────────────────────────────────────────────────

const skillsDir = join(targetDir, ".claude", "skills");
if (!existsSync(skillsDir)) {
  mkdirSync(skillsDir, { recursive: true });
}

let written = 0;

for (const relPath of filesToCopy) {
  const src = join(__dirname, relPath);
  const dest = join(targetDir, relPath);

  const content = readFileSync(src, "utf8");
  writeFileSync(dest, content, "utf8");
  written++;
}

// ── Summary ─────────────────────────────────────────────────────────

console.log(`
MCP Partner Toolkit initialized (${written} files)

  ${filesToCopy.join("\n  ")}

Target: ${targetDir}

Next steps:
  1. Open this directory in Claude Code or Cursor
  2. Run /setup-workspace to verify your environment
  3. Run /scaffold-mcp-integration to generate MCP metadata

Docs: https://github.com/mvogelgesang/sf-mcp-partner-toolkit
`);
