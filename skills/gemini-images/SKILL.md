---
name: gemini-images
description: >
  This skill should be used when the user asks to "generate an image",
  "create a picture", "design a graphic", "edit an image", "modify this image",
  "make a banner", "create a logo", "generate artwork", "social media graphic",
  "thumbnail", or mentions image generation, AI art, text-to-image, or visual
  content creation.
allowed-tools: Bash, Read
---

# AI Image Generation & Editing

Generate images from text prompts and edit existing images using Google Gemini's image generation capabilities. Supports brand profiles for consistent visual identity.

## CLI Tool

All commands use the bundled CLI:

```bash
node ${CLAUDE_PLUGIN_ROOT}/dist/cli.js <command> [args]
```

All commands return JSON with consistent structure:
```json
{
  "success": true,
  "message": "Operation completed",
  "data": { ... }
}
```

## Command Reference

### generate

Generate an image from a text prompt.

```bash
node ${CLAUDE_PLUGIN_ROOT}/dist/cli.js generate <prompt> [options]
```

| Option | Flag | Description | Default |
|--------|------|-------------|---------|
| Output path | `-o, --output <path>` | Save image to specific path | `generated-<timestamp>.png` |
| Aspect ratio | `-a, --aspect <ratio>` | Image aspect ratio | Model default |
| Model | `-m, --model <model>` | Model choice: `flash` or `pro` | `flash` |
| Seed | `-s, --seed <number>` | Seed for reproducible results | Random |
| Size | `--size <size>` | Image size hint | Model default |
| References | `-r, --ref <paths...>` | Reference image paths | None |
| Brand | `--brand <path>` | Brand profile markdown path | None |
| Category | `-c, --category <name>` | Category name (loads from image-gen/) | None |
| Image-gen dir | `--image-gen-dir <path>` | Path to image-gen directory | `image-gen` |
| Check env | `--check-env` | Only verify API key is set | - |

### edit

Edit an existing image with natural language instructions.

```bash
node ${CLAUDE_PLUGIN_ROOT}/dist/cli.js edit <image> <instruction> [options]
```

| Option | Flag | Description | Default |
|--------|------|-------------|---------|
| Output path | `-o, --output <path>` | Save edited image to path | `edited-<timestamp>.png` |
| Aspect ratio | `-a, --aspect <ratio>` | Output aspect ratio | Same as input |
| Model | `-m, --model <model>` | Model choice: `flash` or `pro` | `flash` |
| Size | `--size <size>` | Image size hint | Model default |
| Check env | `--check-env` | Only verify API key is set | - |

## Models

| Model | ID | Speed | Best For |
|-------|----|-------|----------|
| Flash | `gemini-2.5-flash-image` | Fast | Most use cases, iteration (~$0.039/image) |
| Pro | `gemini-3-pro-image-preview` | Slower | Higher quality, complex scenes |

## Aspect Ratios

| Ratio | Use Case |
|-------|----------|
| `1:1` | Social media posts, profile images, icons |
| `16:9` | YouTube thumbnails, presentations, desktop wallpapers |
| `9:16` | Stories, reels, mobile wallpapers |
| `4:3` | Blog images, standard photos |
| `3:4` | Portrait photos, Pinterest pins |

## Category Workflows (Recommended)

For projects with multiple image types, use the category system:

### Check for Categories

```bash
node ${CLAUDE_PLUGIN_ROOT}/dist/cli.js list-categories
```

### Generate with Category

```bash
node ${CLAUDE_PLUGIN_ROOT}/dist/cli.js generate "Modern kitchen" \
  --category property-interiors \
  -o kitchen.png
```

This automatically loads:
- `image-gen/brand.md` (global brand)
- `image-gen/property-interiors/style.md` (category style)
- `image-gen/property-interiors/references/*` (reference images)

### Setup Category Workflow

If the project doesn't have an `image-gen/` directory yet:

```bash
# First-time setup with optional first category
node ${CLAUDE_PLUGIN_ROOT}/dist/cli.js setup [--category <name>]

# Add more categories
node ${CLAUDE_PLUGIN_ROOT}/dist/cli.js add-category <name>

# Build slash commands from categories
node ${CLAUDE_PLUGIN_ROOT}/dist/cli.js build-cmds
```

This creates commands in `.claude/commands/image-gen/` for each category.

## Brand Profile Discovery (Legacy)

For simpler use cases without categories:

1. Look for `brand-profile.md` in the current project root
2. Look for brand profiles in the project's `brand-profiles/` directory
3. Use templates from `${CLAUDE_PLUGIN_ROOT}/brand-profiles/` as starting points

Brand profiles are markdown files with YAML frontmatter containing colors, style, tone, and reference images. When a brand profile is found, pass it with `--brand <path>`.

## Common Workflows

### Generate with Brand Consistency

```bash
# 1. Check if API key is set
node ${CLAUDE_PLUGIN_ROOT}/dist/cli.js generate "" --check-env

# 2. Generate with brand profile
node ${CLAUDE_PLUGIN_ROOT}/dist/cli.js generate "Hero banner for product launch" \
  --brand ./brand-profile.md \
  --aspect 16:9 \
  -o hero-banner.png
```

### Iterative Image Editing

```bash
# 1. Generate initial image
node ${CLAUDE_PLUGIN_ROOT}/dist/cli.js generate "Modern office workspace" -o workspace.png

# 2. Edit to refine
node ${CLAUDE_PLUGIN_ROOT}/dist/cli.js edit workspace.png "Add a plant on the desk" -o workspace-v2.png

# 3. Continue refining
node ${CLAUDE_PLUGIN_ROOT}/dist/cli.js edit workspace-v2.png "Change lighting to warm sunset tones" -o workspace-v3.png
```

### Generate with Reference Images

```bash
node ${CLAUDE_PLUGIN_ROOT}/dist/cli.js generate "A logo in similar style" \
  --ref reference1.png reference2.png \
  -o new-logo.png
```

## Error Handling

All commands return JSON. Check the `success` field:

```json
{
  "success": false,
  "error": "GEMINI_API_KEY environment variable is not set. Get a key at https://aistudio.google.com/apikey"
}
```

Common errors:
- **Missing API key**: Set `GEMINI_API_KEY` environment variable
- **File not found**: Check image paths are correct and accessible
- **No image generated**: Model returned text only — try rephrasing the prompt
- **Rate limited**: Wait and retry, or use a different API key

## Brand Profile Templates

Copy a template from `${CLAUDE_PLUGIN_ROOT}/brand-profiles/_template.md` to your project and customize it. See `${CLAUDE_PLUGIN_ROOT}/brand-profiles/example-acme.md` for a complete example.

## Prerequisites

- **GEMINI_API_KEY** set in `.env.local` with a valid Google AI Studio API key
- **Billing enabled** on your Google Cloud project (image generation requires a paid tier)
- Get a key at https://aistudio.google.com/apikey
- Node.js >= 18.0.0
