import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { generate } from './generate';
import { edit } from './edit';
import { setup, addCategory, buildCommands, listCategories } from './init';

// Load .env.local from the plugin root (no external dependency)
function loadEnvLocal() {
  const envPath = path.resolve(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvLocal();

const program = new Command();

program
  .name('image-gen-cli')
  .description('AI image generation and editing CLI using Google Gemini')
  .version('1.0.0');

// Generate command
program
  .command('generate')
  .description('Generate an image from a text prompt')
  .argument('<prompt>', 'Text prompt describing the image to generate')
  .option('-o, --output <path>', 'Output file path')
  .option('-a, --aspect <ratio>', 'Aspect ratio (1:1, 16:9, 9:16, 4:3, 3:4)')
  .option('-m, --model <model>', 'Model to use (flash, pro)', 'flash')
  .option('-s, --seed <number>', 'Seed for reproducible generation', parseInt)
  .option('--size <size>', 'Image size hint')
  .option('-r, --ref <paths...>', 'Reference image paths')
  .option('--brand <path>', 'Brand profile markdown file path')
  .option('-c, --category <name>', 'Category name (loads from image-gen/<category>/)')
  .option('--image-gen-dir <path>', 'Path to image-gen directory', 'image-gen')
  .option('--check-env', 'Only check if GEMINI_API_KEY is set')
  .action(async (prompt: string, options: {
    output?: string;
    aspect?: string;
    model?: string;
    seed?: number;
    size?: string;
    ref?: string[];
    brand?: string;
    category?: string;
    imageGenDir?: string;
    checkEnv?: boolean;
  }) => {
    if (options.checkEnv) {
      const hasKey = !!process.env.GEMINI_API_KEY;
      console.log(JSON.stringify(hasKey
        ? { success: true, message: 'GEMINI_API_KEY is set' }
        : { success: false, error: 'GEMINI_API_KEY environment variable is not set. Get a key at https://aistudio.google.com/apikey' }
      ));
      return;
    }

    const result = await generate({
      prompt,
      output: options.output,
      aspect: options.aspect,
      model: options.model,
      seed: options.seed,
      size: options.size,
      ref: options.ref,
      brand: options.brand,
      category: options.category,
      imageGenDir: options.imageGenDir,
    });
    console.log(JSON.stringify(result, null, 2));
    if (!result.success) process.exit(1);
  });

// Edit command
program
  .command('edit')
  .description('Edit an existing image with instructions')
  .argument('<image>', 'Path to the image to edit')
  .argument('<instruction>', 'Editing instruction describing the changes')
  .option('-o, --output <path>', 'Output file path')
  .option('-a, --aspect <ratio>', 'Aspect ratio (1:1, 16:9, 9:16, 4:3, 3:4)')
  .option('-m, --model <model>', 'Model to use (flash, pro)', 'flash')
  .option('--size <size>', 'Image size hint')
  .option('--check-env', 'Only check if GEMINI_API_KEY is set')
  .action(async (image: string, instruction: string, options: {
    output?: string;
    aspect?: string;
    model?: string;
    size?: string;
    checkEnv?: boolean;
  }) => {
    if (options.checkEnv) {
      const hasKey = !!process.env.GEMINI_API_KEY;
      console.log(JSON.stringify(hasKey
        ? { success: true, message: 'GEMINI_API_KEY is set' }
        : { success: false, error: 'GEMINI_API_KEY environment variable is not set. Get a key at https://aistudio.google.com/apikey' }
      ));
      return;
    }

    const result = await edit({
      image,
      instruction,
      output: options.output,
      aspect: options.aspect,
      model: options.model,
      size: options.size,
    });
    console.log(JSON.stringify(result, null, 2));
    if (!result.success) process.exit(1);
  });

// Setup command (first-time initialization)
program
  .command('setup')
  .description('Initialize image-gen directory with brand.md and optional first category')
  .option('--image-gen-dir <path>', 'Path to image-gen directory', 'image-gen')
  .option('-c, --category <name>', 'Create first category during setup')
  .action(async (options: {
    imageGenDir?: string;
    category?: string;
  }) => {
    const result = await setup({
      imageGenDir: options.imageGenDir,
      category: options.category,
    });
    console.log(JSON.stringify(result, null, 2));
    if (!result.success) process.exit(1);
  });

// Add category command
program
  .command('add-category')
  .description('Add a new image category')
  .argument('<name>', 'Category name (e.g., property-interiors, avatars)')
  .option('--image-gen-dir <path>', 'Path to image-gen directory', 'image-gen')
  .action(async (name: string, options: { imageGenDir?: string }) => {
    const result = await addCategory({
      imageGenDir: options.imageGenDir,
      category: name,
    });
    console.log(JSON.stringify(result, null, 2));
    if (!result.success) process.exit(1);
  });

// Build commands
program
  .command('build-cmds')
  .description('Generate slash commands from discovered categories')
  .option('--image-gen-dir <path>', 'Path to image-gen directory', 'image-gen')
  .option('--output-dir <path>', 'Output directory for generated commands', '.claude/commands/image-gen')
  .option('-f, --force', 'Overwrite existing command files')
  .action(async (options: {
    imageGenDir?: string;
    outputDir?: string;
    force?: boolean;
  }) => {
    const result = await buildCommands({
      imageGenDir: options.imageGenDir,
      outputDir: options.outputDir,
      force: options.force,
    });
    console.log(JSON.stringify(result, null, 2));
    if (!result.success) process.exit(1);
  });

// List categories command
program
  .command('list-categories')
  .description('List discovered categories from image-gen directory')
  .option('--image-gen-dir <path>', 'Path to image-gen directory', 'image-gen')
  .action(async (options: { imageGenDir?: string }) => {
    const result = await listCategories(options.imageGenDir);
    console.log(JSON.stringify(result, null, 2));
    if (!result.success) process.exit(1);
  });

program.parse();
