---
name: build-cmds
description: Generate slash commands from discovered image categories
arguments:
  - name: force
    flag: --force
    description: Overwrite existing command files
    type: boolean
---

# Build Category Commands

Scan your `image-gen/` directory and generate category-specific slash commands.

## Workflow

1. First, list discovered categories:
```bash
node ${CLAUDE_PLUGIN_ROOT}/dist/cli.js list-categories
```

2. Build commands for all categories:
```bash
node ${CLAUDE_PLUGIN_ROOT}/dist/cli.js build-cmds [--force]
```

3. Report what was created:
   - Commands are generated in `.claude/commands/image-gen/`
   - Each category gets a command like `/image-gen:property-interiors`

## What Gets Generated

For each category with a `style.md` file, a command is created:

- `/image-gen:property-interiors` - generates property interior images
- `/image-gen:avatars` - generates avatar images
- etc.

Each generated command automatically:
- Loads `image-gen/brand.md` (global brand)
- Loads `image-gen/<category>/style.md` (category style)
- Includes all images from `image-gen/<category>/references/`

## Example

```bash
# Build commands (skip existing)
node ${CLAUDE_PLUGIN_ROOT}/dist/cli.js build-cmds

# Force rebuild all
node ${CLAUDE_PLUGIN_ROOT}/dist/cli.js build-cmds --force
```

## After Building

Users can run category-specific commands directly:

```
/image-gen:property-interiors "Modern kitchen with marble countertops"
/image-gen:avatars "Professional headshot, friendly smile"
```

## Re-running Build

- By default, existing command files are skipped
- Use `--force` to overwrite existing files
- Run build again after adding new categories
