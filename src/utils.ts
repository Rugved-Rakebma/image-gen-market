import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';

export interface CommandResult {
  success: boolean;
  message?: string;
  data?: unknown;
  error?: string;
}

export interface BrandProfile {
  name: string;
  colors: Record<string, string>;
  style: string;
  tone: string;
  references: string[];
  body: string;
}

export function createClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log(JSON.stringify({
      success: false,
      error: 'GEMINI_API_KEY environment variable is not set. Get a key at https://aistudio.google.com/apikey'
    }));
    process.exit(1);
  }
  return new GoogleGenAI({ apiKey });
}

export function resolveModel(choice?: string): string {
  const models: Record<string, string> = {
    flash: 'gemini-2.5-flash-image',
    pro: 'gemini-3-pro-image-preview',
  };
  return models[choice || 'flash'] || models.flash;
}

export function fileToInlinePart(filePath: string): { inlineData: { data: string; mimeType: string } } {
  const absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`File not found: ${absPath}`);
  }
  const data = fs.readFileSync(absPath);
  const ext = path.extname(absPath).toLowerCase();
  const mimeMap: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
  };
  const mimeType = mimeMap[ext] || 'image/png';
  return {
    inlineData: {
      data: data.toString('base64'),
      mimeType,
    },
  };
}

export function parseBrandProfile(filePath: string): BrandProfile {
  const absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`Brand profile not found: ${absPath}`);
  }
  const content = fs.readFileSync(absPath, 'utf-8');

  // Split frontmatter from body
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!fmMatch) {
    return {
      name: path.basename(filePath, '.md'),
      colors: {},
      style: '',
      tone: '',
      references: [],
      body: content,
    };
  }

  const frontmatter = fmMatch[1];
  const body = fmMatch[2];

  // Simple YAML parser (no js-yaml dependency)
  const getValue = (key: string): string => {
    const re = new RegExp(`^${key}:\\s*["']?(.+?)["']?\\s*$`, 'm');
    const m = frontmatter.match(re);
    return m ? m[1] : '';
  };

  // Parse colors block
  const colors: Record<string, string> = {};
  const colorsMatch = frontmatter.match(/^colors:\s*\r?\n((?:\s+\w+:\s*["']?#[0-9a-fA-F]+["']?\s*\r?\n?)*)/m);
  if (colorsMatch) {
    const colorLines = colorsMatch[1].matchAll(/^\s+(\w+):\s*["']?(#[0-9a-fA-F]+)["']?\s*$/gm);
    for (const cl of colorLines) {
      colors[cl[1]] = cl[2];
    }
  }

  // Parse references array
  const references: string[] = [];
  const refsMatch = frontmatter.match(/^references:\s*\r?\n((?:\s+-\s+.+\r?\n?)*)/m);
  if (refsMatch) {
    const refLines = refsMatch[1].matchAll(/^\s+-\s+["']?(.+?)["']?\s*$/gm);
    for (const rl of refLines) {
      references.push(rl[1]);
    }
  }

  return {
    name: getValue('name') || path.basename(filePath, '.md'),
    colors,
    style: getValue('style'),
    tone: getValue('tone'),
    references,
    body,
  };
}

export function augmentPromptWithBrand(prompt: string, brand: BrandProfile): string {
  const parts: string[] = [prompt];

  if (brand.style) {
    parts.push(`Style: ${brand.style}`);
  }
  if (brand.tone) {
    parts.push(`Tone: ${brand.tone}`);
  }
  if (Object.keys(brand.colors).length > 0) {
    const colorStr = Object.entries(brand.colors)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
    parts.push(`Brand colors: ${colorStr}`);
  }
  if (brand.body.trim()) {
    parts.push(`Brand guidelines:\n${brand.body.trim()}`);
  }

  return parts.join('\n\n');
}

export function resolveOutputPath(userPath?: string, prefix: string = 'generated'): string {
  if (userPath) {
    return path.resolve(userPath);
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('Z', '');
  return path.resolve(`${prefix}-${timestamp}.png`);
}

export function saveImage(base64Data: string, outputPath: string): void {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(outputPath, Buffer.from(base64Data, 'base64'));
}

export function mergeBrandProfiles(base: BrandProfile, overlay: BrandProfile): BrandProfile {
  return {
    name: overlay.name || base.name,
    colors: { ...base.colors, ...overlay.colors },
    style: [base.style, overlay.style].filter(Boolean).join(', '),
    tone: [base.tone, overlay.tone].filter(Boolean).join(', '),
    references: [...base.references, ...overlay.references],
    body: [base.body, overlay.body].filter(s => s.trim()).join('\n\n'),
  };
}

export function discoverCategories(imageGenDir: string): string[] {
  const absDir = path.resolve(imageGenDir);
  if (!fs.existsSync(absDir)) {
    return [];
  }
  const entries = fs.readdirSync(absDir, { withFileTypes: true });
  const categories: string[] = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const stylePath = path.join(absDir, entry.name, 'style.md');
      if (fs.existsSync(stylePath)) {
        categories.push(entry.name);
      }
    }
  }
  return categories.sort();
}

export function loadCategoryReferences(categoryDir: string): string[] {
  const refsDir = path.join(categoryDir, 'references');
  if (!fs.existsSync(refsDir)) {
    return [];
  }
  const entries = fs.readdirSync(refsDir, { withFileTypes: true });
  const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'];
  const refs: string[] = [];
  for (const entry of entries) {
    if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (imageExts.includes(ext)) {
        refs.push(path.join(refsDir, entry.name));
      }
    }
  }
  return refs.sort();
}

export interface CategoryContext {
  brand: BrandProfile;
  references: string[];
  categoryName: string;
}

export function loadCategory(categoryName: string, imageGenDir: string = 'image-gen'): CategoryContext {
  const absDir = path.resolve(imageGenDir);
  const brandPath = path.join(absDir, 'brand.md');
  const categoryDir = path.join(absDir, categoryName);
  const stylePath = path.join(categoryDir, 'style.md');

  // Load base brand (optional)
  let baseBrand: BrandProfile = {
    name: '',
    colors: {},
    style: '',
    tone: '',
    references: [],
    body: '',
  };
  if (fs.existsSync(brandPath)) {
    baseBrand = parseBrandProfile(brandPath);
  }

  // Load category style (required)
  if (!fs.existsSync(stylePath)) {
    throw new Error(`Category style not found: ${stylePath}`);
  }
  const categoryStyle = parseBrandProfile(stylePath);

  // Merge profiles
  const mergedBrand = mergeBrandProfiles(baseBrand, categoryStyle);

  // Load references from category directory
  const categoryRefs = loadCategoryReferences(categoryDir);

  return {
    brand: mergedBrand,
    references: [...mergedBrand.references, ...categoryRefs],
    categoryName,
  };
}
