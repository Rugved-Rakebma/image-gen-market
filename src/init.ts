import * as fs from 'fs';
import * as path from 'path';
import { CommandResult, discoverCategories } from './utils';

const BRAND_TEMPLATE = `---
name: "Your Company Name"
colors:
  primary: "#000000"
  secondary: "#666666"
  accent: "#FF0000"
  background: "#FFFFFF"
style: "modern, clean, professional"
tone: "trustworthy, approachable, innovative"
references: []
---

# Global Brand Guidelines

These guidelines apply to ALL image categories.

## Brand Identity

- Company name: Your Company
- Industry: Your industry
- Target audience: Your target audience

## Visual Principles

- Maintain consistency across all visual assets
- Use brand colors as primary palette
- Keep compositions clean and uncluttered

## Do

- Use brand colors consistently
- Maintain visual hierarchy
- Keep backgrounds clean

## Don't

- Use competing color schemes
- Overcrowd compositions
- Use low-quality or pixelated elements
`;

function getCategoryTemplate(categoryName: string): string {
  const titleName = categoryName
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return `---
name: "${titleName}"
colors: {}
style: ""
tone: ""
references: []
---

# ${titleName} Guidelines

These guidelines are layered ON TOP of the global brand.md.

## Purpose

Describe what this image category is used for.

## Style Notes

- Specific visual requirements for this category
- Composition preferences
- Lighting preferences

## Do

- Category-specific best practices

## Don't

- Category-specific things to avoid
`;
}

interface SetupOptions {
  imageGenDir?: string;
  category?: string;
}

export async function setup(options: SetupOptions): Promise<CommandResult> {
  const imageGenDir = options.imageGenDir || 'image-gen';
  const absImageGenDir = path.resolve(imageGenDir);

  const created: string[] = [];
  const alreadyExists: string[] = [];

  // Create image-gen directory
  if (!fs.existsSync(absImageGenDir)) {
    fs.mkdirSync(absImageGenDir, { recursive: true });
    created.push(imageGenDir);
  }

  // Create brand.md
  const brandPath = path.join(absImageGenDir, 'brand.md');
  if (!fs.existsSync(brandPath)) {
    fs.writeFileSync(brandPath, BRAND_TEMPLATE);
    created.push('brand.md');
  } else {
    alreadyExists.push('brand.md');
  }

  // Create first category if specified
  if (options.category) {
    const categoryDir = path.join(absImageGenDir, options.category);
    const stylePath = path.join(categoryDir, 'style.md');
    const refsDir = path.join(categoryDir, 'references');

    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
      fs.mkdirSync(refsDir, { recursive: true });
      fs.writeFileSync(stylePath, getCategoryTemplate(options.category));
      fs.writeFileSync(path.join(refsDir, '.gitkeep'), '# Add reference images here\n');
      created.push(`${options.category}/`);
      created.push(`${options.category}/style.md`);
      created.push(`${options.category}/references/`);
    } else {
      alreadyExists.push(`${options.category}/`);
    }
  }

  return {
    success: true,
    message: `Setup complete`,
    data: {
      imageGenDir,
      created,
      alreadyExists,
      nextSteps: options.category
        ? [
            `Edit ${imageGenDir}/brand.md with your brand guidelines`,
            `Edit ${imageGenDir}/${options.category}/style.md with category-specific style`,
            `Add reference images to ${imageGenDir}/${options.category}/references/`,
            `Run /image-gen:build-cmds to generate commands`,
          ]
        : [
            `Edit ${imageGenDir}/brand.md with your brand guidelines`,
            `Run /image-gen:add-category <name> to add a category`,
            `Run /image-gen:build-cmds to generate commands`,
          ],
    },
  };
}

interface AddCategoryOptions {
  imageGenDir?: string;
  category: string;
}

export async function addCategory(options: AddCategoryOptions): Promise<CommandResult> {
  const imageGenDir = options.imageGenDir || 'image-gen';
  const absImageGenDir = path.resolve(imageGenDir);

  if (!fs.existsSync(absImageGenDir)) {
    return {
      success: false,
      error: `Directory not found: ${imageGenDir}. Run /image-gen:init first.`,
    };
  }

  const categoryDir = path.join(absImageGenDir, options.category);
  const stylePath = path.join(categoryDir, 'style.md');
  const refsDir = path.join(categoryDir, 'references');

  if (fs.existsSync(categoryDir)) {
    return {
      success: false,
      error: `Category already exists: ${options.category}`,
    };
  }

  fs.mkdirSync(categoryDir, { recursive: true });
  fs.mkdirSync(refsDir, { recursive: true });
  fs.writeFileSync(stylePath, getCategoryTemplate(options.category));
  fs.writeFileSync(path.join(refsDir, '.gitkeep'), '# Add reference images here\n');

  return {
    success: true,
    message: `Category created: ${options.category}`,
    data: {
      category: options.category,
      created: [
        `${imageGenDir}/${options.category}/`,
        `${imageGenDir}/${options.category}/style.md`,
        `${imageGenDir}/${options.category}/references/`,
      ],
      nextSteps: [
        `Edit ${imageGenDir}/${options.category}/style.md with category-specific style`,
        `Add reference images to ${imageGenDir}/${options.category}/references/`,
        `Run /image-gen:build-cmds to generate the command`,
      ],
    },
  };
}

function generateCommandContent(categoryName: string, imageGenDir: string): string {
  const titleName = categoryName
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return `---
name: ${categoryName}
description: Generate ${titleName} images with brand consistency
arguments:
  - name: prompt
    description: Description of the image to generate
    required: true
  - name: aspect
    flag: --aspect
    description: "Aspect ratio (1:1, 16:9, 9:16, 4:3, 3:4)"
    type: string
  - name: output
    flag: --output
    description: Output file path
    type: string
---

# ${titleName} Image Generation

Generate images for the **${titleName}** category with automatic brand consistency.

## Workflow

1. Check environment:
\`\`\`bash
node \${CLAUDE_PLUGIN_ROOT}/dist/cli.js generate "" --check-env
\`\`\`

2. Generate the image:
\`\`\`bash
node \${CLAUDE_PLUGIN_ROOT}/dist/cli.js generate "$ARGUMENTS.prompt" \\
  --category "${categoryName}" \\
  --image-gen-dir "${imageGenDir}" \\
  [--aspect "$ARGUMENTS.aspect"] \\
  [--output "$ARGUMENTS.output"]
\`\`\`

## What Gets Loaded

- **Global brand**: \`${imageGenDir}/brand.md\`
- **Category style**: \`${imageGenDir}/${categoryName}/style.md\`
- **Reference images**: \`${imageGenDir}/${categoryName}/references/*\`

## Tips

- Add reference images to \`${imageGenDir}/${categoryName}/references/\` for better style consistency
- Edit \`${imageGenDir}/${categoryName}/style.md\` to refine the category-specific style
- The global brand colors and tone are automatically applied
`;
}

interface BuildCommandsOptions {
  imageGenDir?: string;
  outputDir?: string;
  force?: boolean;
}

export async function buildCommands(options: BuildCommandsOptions): Promise<CommandResult> {
  const imageGenDir = options.imageGenDir || 'image-gen';
  const outputDir = options.outputDir || '.claude/commands/image-gen';

  const absImageGenDir = path.resolve(imageGenDir);
  if (!fs.existsSync(absImageGenDir)) {
    return {
      success: false,
      error: `Directory not found: ${imageGenDir}. Run /image-gen:init first.`,
    };
  }

  const categories = discoverCategories(imageGenDir);
  if (categories.length === 0) {
    return {
      success: false,
      error: `No categories found in ${imageGenDir}. Run /image-gen:add-category <name> first.`,
    };
  }

  const absOutputDir = path.resolve(outputDir);
  if (!fs.existsSync(absOutputDir)) {
    fs.mkdirSync(absOutputDir, { recursive: true });
  }

  const created: string[] = [];
  const skipped: string[] = [];

  for (const category of categories) {
    const commandPath = path.join(absOutputDir, `${category}.md`);

    if (fs.existsSync(commandPath) && !options.force) {
      skipped.push(category);
      continue;
    }

    const content = generateCommandContent(category, imageGenDir);
    fs.writeFileSync(commandPath, content);
    created.push(category);
  }

  const commands = categories.map(c => `/image-gen:${c}`);

  return {
    success: true,
    message: `Built ${created.length} command(s)`,
    data: {
      imageGenDir,
      outputDir,
      categories,
      commands,
      created,
      skipped: skipped.length > 0 ? skipped : undefined,
    },
  };
}

export async function listCategories(imageGenDir: string = 'image-gen'): Promise<CommandResult> {
  const absImageGenDir = path.resolve(imageGenDir);

  if (!fs.existsSync(absImageGenDir)) {
    return {
      success: false,
      error: `Directory not found: ${imageGenDir}. Run /image-gen:init first.`,
    };
  }

  const categories = discoverCategories(imageGenDir);

  if (categories.length === 0) {
    return {
      success: true,
      message: 'No categories found',
      data: {
        imageGenDir,
        categories: [],
        commands: [],
      },
    };
  }

  return {
    success: true,
    data: {
      imageGenDir,
      categories,
      commands: categories.map(c => `/image-gen:${c}`),
    },
  };
}
