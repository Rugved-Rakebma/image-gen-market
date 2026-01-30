---
name: setup
description: Initialize image-gen directory with brand.md and optional first category
arguments:
  - name: category
    flag: --category
    description: Create first category during setup (e.g., property-interiors)
    type: string
---

# Setup Image Generation

First-time setup for the image generation workflow. Creates the `image-gen/` directory structure with templates.

## Workflow

1. Run setup (optionally with your first category):
```bash
node ${CLAUDE_PLUGIN_ROOT}/dist/cli.js setup [--category <name>]
```

2. Follow the next steps in the output to:
   - Edit `image-gen/brand.md` with your brand guidelines
   - Edit category style files as needed
   - Add reference images

## What Gets Created

### Without category flag:
```
image-gen/
  brand.md              # Global brand template
```

### With --category flag:
```
image-gen/
  brand.md              # Global brand template
  <category>/
    style.md            # Category-specific style template
    references/         # Directory for reference images
```

## Example

```bash
# Basic setup
node ${CLAUDE_PLUGIN_ROOT}/dist/cli.js setup

# Setup with first category
node ${CLAUDE_PLUGIN_ROOT}/dist/cli.js setup --category property-interiors
```

## Next Steps

After setup:
1. Edit `image-gen/brand.md` with your brand colors, style, and tone
2. Run `/image-gen:add-category <name>` to add more categories
3. Run `/image-gen:build-cmds` to generate category commands
