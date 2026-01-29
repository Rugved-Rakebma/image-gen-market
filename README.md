# image-gen

AI image generation and editing plugin for Claude Code, powered by Google Gemini.

## Features

- **Text-to-Image Generation** — Generate images from natural language prompts
- **Image Editing** — Edit existing images with natural language instructions
- **Brand Profiles** — Apply brand guidelines for consistent visual identity
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
Create a social media post for our product launch using our brand profile
```

### CLI

```bash
# Generate an image
node dist/cli.js generate "A modern office workspace with plants" -o workspace.png

# Generate with specific aspect ratio
node dist/cli.js generate "YouTube thumbnail for coding tutorial" --aspect 16:9 -o thumb.png

# Generate with brand profile
node dist/cli.js generate "Product hero banner" --brand ./brand-profile.md -o hero.png

# Generate with reference images
node dist/cli.js generate "Logo in similar style" --ref reference.png -o logo.png

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

## Brand Profiles

Brand profiles are markdown files with YAML frontmatter that define your visual identity:

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

Copy the template from `brand-profiles/_template.md` to your project as `brand-profile.md` and customize it. See `brand-profiles/example-acme.md` for a complete example.

## Models

| Model | Key | Gemini Model | Cost |
|-------|-----|--------------|------|
| Flash | `flash` | `gemini-2.5-flash-image` | ~$0.039/image |
| Pro | `pro` | `gemini-3-pro-image-preview` | Higher quality |

## Plugin Structure

```
image-gen-market/
├── .claude-plugin/
│   ├── plugin.json          # Plugin manifest
│   └── marketplace.json     # Marketplace registration
├── commands/
│   ├── generate.md          # /image-gen:generate command
│   └── edit.md              # /image-gen:edit command
├── skills/
│   └── image-gen/
│       └── SKILL.md         # Auto-triggers on image requests
├── brand-profiles/
│   ├── _template.md         # Brand profile template
│   └── example-acme.md      # Example brand profile
├── src/
│   ├── cli.ts               # Commander-based CLI
│   ├── generate.ts          # Text-to-image logic
│   ├── edit.ts              # Image editing logic
│   └── utils.ts             # Shared utilities
├── dist/
│   └── cli.js               # Bundled CLI (committed)
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
```

## License

MIT
