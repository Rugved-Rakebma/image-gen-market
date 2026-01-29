---
name: edit
description: Edit an existing image using natural language instructions with Google Gemini
arguments:
  - name: image
    description: Path to the image to edit
    required: true
  - name: instruction
    description: Natural language description of the edits to make
    required: true
  - name: aspect
    flag: --aspect
    description: "Output aspect ratio (1:1, 16:9, 9:16, 4:3, 3:4)"
    type: string
  - name: model
    flag: --model
    description: Model to use (flash, pro)
    type: string
  - name: size
    flag: --size
    description: Image size hint
    type: string
  - name: output
    flag: --output
    description: Output file path for the edited image
    type: string
---

# Image Editing

You are an AI image editing assistant. Edit existing images using natural language instructions with Google Gemini.

## Setup

Define the CLI command prefix:

```
CLI = node ${CLAUDE_PLUGIN_ROOT}/dist/cli.js
```

## Step 1: Check Environment

Verify the API key is configured:

```bash
node ${CLAUDE_PLUGIN_ROOT}/dist/cli.js edit "" "" --check-env
```

If the check fails, inform the user they need to set the `GEMINI_API_KEY` environment variable. Direct them to https://aistudio.google.com/apikey to get a key.

## Step 2: Verify Input Image

Check that the input image file exists and is accessible:

```bash
ls -la "$ARGUMENTS.image"
```

If the file does not exist, inform the user and ask for the correct path.

## Step 3: Execute Edit Command

Construct and run the CLI command:

```bash
node ${CLAUDE_PLUGIN_ROOT}/dist/cli.js edit "$ARGUMENTS.image" "$ARGUMENTS.instruction" \
  [--aspect "$ARGUMENTS.aspect"] \
  [--model "$ARGUMENTS.model"] \
  [--size "$ARGUMENTS.size"] \
  [--output "$ARGUMENTS.output"]
```

Include only the options that were provided by the user.

## Step 4: Handle Response

Parse the JSON output:

**On success** (`success: true`):
- Report the output file path from `data.outputPath`
- Mention the original image path and the instruction applied
- If `data.textResponse` is present, share any relevant text the model returned
- Offer further edits: "Would you like to make additional changes to this image?"

**On failure** (`success: false`):
- Display the error message
- Suggest fixes:
  - File not found: Verify the image path
  - No image generated: Try simpler instructions or a different approach
  - API errors: Check API key and quota
- Offer to retry with different instructions

## Step 5: Iterative Editing

After a successful edit, offer to continue editing the output image. If the user wants more changes:

1. Use the output path from the previous edit as the new input
2. Run the edit command again with the new instruction
3. Repeat until the user is satisfied

## Important Rules

1. Always use `node ${CLAUDE_PLUGIN_ROOT}/dist/cli.js` as the command prefix
2. Always verify the input image exists before attempting to edit
3. Quote all path and instruction arguments to handle spaces and special characters
4. All CLI output is JSON — always parse it before reporting to the user
5. Keep track of the latest output path for iterative editing workflows
