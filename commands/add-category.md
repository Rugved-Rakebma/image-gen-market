---
name: add-category
description: Add a new image category with style template and references directory
arguments:
  - name: name
    description: Category name (e.g., property-interiors, avatars, illustrations)
    required: true
---

# Add Image Category

Add a new category to your image generation workflow.

## Workflow

1. Add the category:
```bash
node ${CLAUDE_PLUGIN_ROOT}/dist/cli.js add-category "$ARGUMENTS.name"
```

2. Follow the next steps in the output to:
   - Edit the category's `style.md`
   - Add reference images
   - Run `/image-gen:build-cmds` to generate the command

## What Gets Created

```
image-gen/
  <category>/
    style.md            # Category-specific style template
    references/         # Directory for reference images
      .gitkeep
```

## Example

```bash
# Add property interiors category
node ${CLAUDE_PLUGIN_ROOT}/dist/cli.js add-category property-interiors

# Add avatars category
node ${CLAUDE_PLUGIN_ROOT}/dist/cli.js add-category avatars
```

## Category Naming

Use lowercase with hyphens:
- `property-interiors` (good)
- `property_interiors` (works but inconsistent)
- `PropertyInteriors` (avoid)

## Next Steps

After adding a category:
1. Edit `image-gen/<category>/style.md` with category-specific guidelines
2. Add reference images to `image-gen/<category>/references/`
3. Run `/image-gen:build-cmds` to generate the slash command
