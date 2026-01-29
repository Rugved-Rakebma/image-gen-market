---
name: generate
description: Generate an AI image from a text prompt using Google Gemini
arguments:
  - name: prompt
    description: Text description of the image to generate
    required: true
  - name: aspect
    flag: --aspect
    description: "Aspect ratio (1:1, 16:9, 9:16, 4:3, 3:4)"
    type: string
  - name: model
    flag: --model
    description: Model to use (flash, pro)
    type: string
  - name: seed
    flag: --seed
    description: Seed for reproducible generation
    type: string
  - name: size
    flag: --size
    description: Image size hint
    type: string
  - name: output
    flag: --output
    description: Output file path for the generated image
    type: string
  - name: ref
    flag: --ref
    description: Reference image paths (space-separated)
    type: string
  - name: brand
    flag: --brand
    description: Path to a brand profile markdown file
    type: string
---

# Image Generation

You are an AI image generation assistant. Generate images from text prompts using Google Gemini.

## Setup

Define the CLI command prefix:

```
CLI = node ${CLAUDE_PLUGIN_ROOT}/dist/cli.js
```

## Step 1: Check Environment

Verify the API key is configured:

```bash
node ${CLAUDE_PLUGIN_ROOT}/dist/cli.js generate "" --check-env
```

If the check fails, inform the user they need to set the `GEMINI_API_KEY` environment variable. Direct them to https://aistudio.google.com/apikey to get a key.

## Step 2: Resolve Brand Profile

Check if the user's project has a brand profile for consistent styling:

1. Check if `--brand` was explicitly provided. If so, use that path.
2. Otherwise, look for `brand-profile.md` in the current working directory.
3. If found, add `--brand <path>` to the CLI command.
4. If not found, proceed without brand styling.

## Step 3: Build and Execute CLI Command

Construct the full CLI command with all provided arguments:

```bash
node ${CLAUDE_PLUGIN_ROOT}/dist/cli.js generate "$ARGUMENTS.prompt" \
  [--aspect "$ARGUMENTS.aspect"] \
  [--model "$ARGUMENTS.model"] \
  [--seed "$ARGUMENTS.seed"] \
  [--size "$ARGUMENTS.size"] \
  [--output "$ARGUMENTS.output"] \
  [--ref $ARGUMENTS.ref] \
  [--brand "$ARGUMENTS.brand"]
```

Include only the options that were provided by the user. Omit flags with no values.

## Step 4: Handle Response

Parse the JSON output from the CLI:

**On success** (`success: true`):
- Report the output file path from `data.outputPath`
- Mention the model used and aspect ratio
- If `data.textResponse` is present, share any relevant text the model returned
- Offer to open or preview the image if possible

**On failure** (`success: false`):
- Display the error message
- Suggest fixes based on common errors:
  - Missing API key: Direct to setup instructions
  - File not found: Check reference image paths
  - No image generated: Suggest rephrasing the prompt or adjusting parameters
- Offer to retry with adjusted parameters

## Important Rules

1. Always use `node ${CLAUDE_PLUGIN_ROOT}/dist/cli.js` as the command prefix
2. Always check the environment first before generating
3. Quote the prompt argument to handle spaces and special characters
4. All CLI output is JSON — always parse it before reporting to the user
5. If reference images are provided, verify they exist before running the command
