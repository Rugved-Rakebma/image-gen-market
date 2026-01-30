# image-gen

AI image generation and editing plugin for Claude Code, powered by Google Gemini.

## Features

- **Text-to-Image Generation** — Generate images from natural language prompts
- **Image Editing** — Edit existing images with natural language instructions
- **Category Workflows** — Define image categories with auto-generated commands
- **Brand Consistency** — Global brand + category-specific styles layered automatically
- **Reference Images** — Use reference images to guide generation style
- **Reproducible Results** — Seed support for consistent outputs
- **Multiple Aspect Ratios** — 1:1, 16:9, 9:16, 4:3, 3:4

## Installation

Install as a Claude Code plugin:

```bash
claude plugin add Rugved-Rakebma/image-gen-market
```

Or clone and install locally:

```bash
git clone https://github.com/Rugved-Rakebma/image-gen-market.git
cd image-gen-market
npm install
npm run build
```

## Prerequisites

1. Get an API key at [Google AI Studio](https://aistudio.google.com/apikey)
2. **Enable billing** on your Google Cloud project (image generation requires a paid tier, ~$0.04/image)
3. Copy the env template and add your key:

```bash
cp .env.example .env.local
```

4. Edit `.env.local` and replace `your-api-key-here` with your actual key.

The CLI loads `.env.local` automatically — no need to export anything in your shell.

## Usage

### Natural Language (via Claude Code)

Just ask Claude to generate or edit images:

```
Generate a hero banner for a tech startup, 16:9 aspect ratio
```

```
Edit hero.png to add a sunset gradient in the background
```

```
Create a property interior image using our brand guidelines
```

### CLI

```bash
# Generate an image
node dist/cli.js generate "A modern office workspace with plants" -o workspace.png

# Generate with specific aspect ratio
node dist/cli.js generate "YouTube thumbnail for coding tutorial" --aspect 16:9 -o thumb.png

# Generate with brand profile (legacy)
node dist/cli.js generate "Product hero banner" --brand ./brand-profile.md -o hero.png

# Generate with category (recommended)
node dist/cli.js generate "Modern kitchen with marble counters" --category property-interiors -o kitchen.png

# Edit an image
node dist/cli.js edit photo.png "Remove the background and add a gradient" -o edited.png

# Check environment setup
node dist/cli.js generate "" --check-env
```

## Commands

| Command | Description |
|---------|-------------|
| `/image-gen:generate` | Generate an image from a text prompt |
| `/image-gen:edit` | Edit an existing image with instructions |
| `/image-gen:setup` | First-time setup: create image-gen/ with brand.md |
| `/image-gen:add-category` | Add a new image category |
| `/image-gen:build-cmds` | Generate slash commands from discovered categories |

After running `/image-gen:build-cmds`, you'll also have category-specific commands like:
- `/image-gen:property-interiors`
- `/image-gen:avatars`
- etc.

## Category Workflows

For teams needing consistent image generation across multiple categories (e.g., property photos, avatars, illustrations), set up a category-based workflow:

### 1. Initialize Your Project

```
/image-gen:setup --category property-interiors
```

This creates:
```
your-project/
  image-gen/
    brand.md                    # Global brand template
    property-interiors/
      style.md                  # Category-specific style
      references/               # For reference images
```

### 2. Add More Categories

```
/image-gen:add-category property-exteriors
/image-gen:add-category avatars
```

### 3. Customize Your Brand

Edit `image-gen/brand.md` with your brand colors, style, and tone. Edit each category's `style.md` with category-specific guidelines.

### 4. Build Commands

```
/image-gen:build-cmds
```

This scans your `image-gen/` directory and creates commands in `.claude/commands/image-gen/`.

### 5. Use Category Commands

```
/image-gen:property-interiors "Luxury bathroom with freestanding tub"
/image-gen:avatars "Professional headshot, friendly smile, blue background"
```

Each command automatically loads:
- Global brand from `image-gen/brand.md`
- Category style from `image-gen/<category>/style.md`
- Reference images from `image-gen/<category>/references/`

## Brand Profiles

Brand profiles are markdown files with YAML frontmatter:

```yaml
---
name: "Your Brand"
colors:
  primary: "#2563EB"
  accent: "#F59E0B"
style: "modern, clean, minimalist"
tone: "professional, approachable"
references: []
---

# Visual Guidelines
Your brand guidelines here...
```

For simple use cases, use `--brand path/to/profile.md`. For multi-category workflows, use the category system above.

## Models

| Model | Key | Gemini Model | Cost |
|-------|-----|--------------|------|
| Flash | `flash` | `gemini-2.5-flash-image` | ~$0.039/image |
| Pro | `pro` | `gemini-3-pro-image-preview` | Higher quality |

## Plugin Structure

```
image-gen-market/
├── .claude-plugin/
│   ├── plugin.json              # Plugin manifest
│   └── marketplace.json         # Marketplace registration
├── commands/
│   ├── generate.md              # /image-gen:generate
│   ├── edit.md                  # /image-gen:edit
│   ├── setup.md                 # /image-gen:setup
│   ├── add-category.md          # /image-gen:add-category
│   └── build-cmds.md            # /image-gen:build-cmds
├── skills/
│   └── gemini-images/
│       └── SKILL.md             # Auto-triggers on image requests
├── brand-profiles/              # Legacy single-file profiles
│   ├── _template.md
│   └── example-acme.md
├── src/
│   ├── cli.ts                   # Commander-based CLI
│   ├── generate.ts              # Text-to-image logic
│   ├── edit.ts                  # Image editing logic
│   ├── init.ts                  # Category scaffolding
│   └── utils.ts                 # Shared utilities
├── dist/
│   └── cli.js                   # Bundled CLI (committed)
├── package.json
├── tsconfig.json
└── README.md
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Test environment check
node dist/cli.js generate "" --check-env

# Setup image-gen directory
node dist/cli.js setup --category my-category

# Add another category
node dist/cli.js add-category another-category

# List discovered categories
node dist/cli.js list-categories

# Build category commands
node dist/cli.js build-cmds
```

## License

MIT
