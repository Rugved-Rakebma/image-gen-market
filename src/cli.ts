import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { generate } from './generate';
import { edit } from './edit';

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
  .option('--check-env', 'Only check if GEMINI_API_KEY is set')
  .action(async (prompt: string, options: {
    output?: string;
    aspect?: string;
    model?: string;
    seed?: number;
    size?: string;
    ref?: string[];
    brand?: string;
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

program.parse();
