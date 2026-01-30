# CLAUDE.md

Claude Code plugin for AI image generation using Google Gemini.

## Build

```bash
npm run build          # esbuild bundles src/cli.ts → dist/cli.js
```

Always rebuild after TypeScript changes. `dist/cli.js` is committed to the repo.

## Test

```bash
node dist/cli.js generate "" --check-env   # Verify API key
node dist/cli.js --help                     # Show all commands
```

## Architecture

```
src/
  cli.ts       # Entry point, Commander.js command definitions
  generate.ts  # Text-to-image generation (calls Gemini API)
  edit.ts      # Image editing (calls Gemini API)
  init.ts      # Category scaffolding: setup, addCategory, buildCommands, listCategories
  utils.ts     # Brand profile parsing, category discovery, shared types

commands/      # Slash command .md files (YAML frontmatter + markdown body)
skills/        # Skill definitions (SKILL.md with frontmatter)
.claude-plugin/# Plugin manifest (plugin.json, marketplace.json)
```

## CLI Output Pattern

All CLI commands return JSON with this structure:

```typescript
interface CommandResult {
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
  error?: string;  // when success is false
}
```

Always `console.log(JSON.stringify(result, null, 2))` and `process.exit(1)` on failure.

## Command File Format

```yaml
---
name: command-name
description: What it does
arguments:
  - name: argName
    description: What it is
    required: true
  - name: optionalArg
    flag: --flag
    description: Optional flag
    type: string
---

# Command Title

Markdown instructions for Claude to follow...
```

## Gemini API

| Model | ID | Notes |
|-------|-----|-------|
| Flash | `gemini-2.5-flash-image` | Fast, ~$0.039/image |
| Pro | `gemini-3-pro-image-preview` | Higher quality |

**Important**: Image generation requires a billing-enabled Google Cloud project. Free tier returns "rate limit 0" errors.

## Environment

API key is loaded from `.env.local` in cli.ts (no dotenv dependency). Format:
```
GEMINI_API_KEY=your-key-here
```

## Category System

User's project structure:
```
image-gen/
  brand.md                 # Global brand (colors, style, tone)
  <category>/
    style.md               # Category-specific style (layered on brand.md)
    references/            # Reference images for style guidance
```

Commands generated in `.claude/commands/image-gen/<category>.md`

Workflow: `setup` → `add-category` → `build-cmds` → use `/image-gen:<category>`

## Don't

- Forget to `npm run build` before committing (dist/ is tracked)
- Use wrong model names (use exact IDs above)
- Assume free tier works (billing required for image generation)
- Bundle @google/genai (it's marked external in esbuild)
