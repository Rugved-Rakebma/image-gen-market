import {
  CommandResult,
  createClient,
  resolveModel,
  fileToInlinePart,
  parseBrandProfile,
  augmentPromptWithBrand,
  resolveOutputPath,
  saveImage,
} from './utils';

interface GenerateOptions {
  prompt: string;
  aspect?: string;
  model?: string;
  seed?: number;
  size?: string;
  output?: string;
  ref?: string[];
  brand?: string;
}

export async function generate(options: GenerateOptions): Promise<CommandResult> {
  try {
    const ai = createClient();
    const model = resolveModel(options.model);
    let prompt = options.prompt;

    const contents: Array<{ inlineData: { data: string; mimeType: string } } | { text: string }> = [];

    // Add brand reference images and augment prompt
    if (options.brand) {
      const brand = parseBrandProfile(options.brand);
      prompt = augmentPromptWithBrand(prompt, brand);

      // Add brand reference images if specified in profile
      for (const refPath of brand.references) {
        try {
          contents.push(fileToInlinePart(refPath));
        } catch {
          // Skip missing reference images
        }
      }
    }

    // Add user-provided reference images
    if (options.ref && options.ref.length > 0) {
      for (const refPath of options.ref) {
        contents.push(fileToInlinePart(refPath));
      }
    }

    // Add the prompt text last
    contents.push({ text: prompt });

    // Build generation config
    const config: Record<string, unknown> = {
      responseModalities: ['TEXT', 'IMAGE'],
    };

    const imageConfig: Record<string, unknown> = {};
    if (options.aspect) {
      imageConfig.aspectRatio = options.aspect;
    }
    if (options.size) {
      imageConfig.imageSize = options.size;
    }
    if (Object.keys(imageConfig).length > 0) {
      config.imageGenerationConfig = imageConfig;
    }

    if (options.seed !== undefined) {
      config.seed = options.seed;
    }

    const response = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: contents }],
      config,
    });

    // Extract image from response
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      return { success: false, error: 'No response candidates returned from Gemini' };
    }

    const parts = candidates[0].content?.parts;
    if (!parts) {
      return { success: false, error: 'No content parts in response' };
    }

    let imageData: string | null = null;
    let textResponse: string | null = null;

    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        imageData = part.inlineData.data;
      }
      if (part.text) {
        textResponse = part.text;
      }
    }

    if (!imageData) {
      return {
        success: false,
        error: 'No image was generated. The model returned text only.',
        data: { textResponse },
      };
    }

    const outputPath = resolveOutputPath(options.output, 'generated');
    saveImage(imageData, outputPath);

    return {
      success: true,
      message: `Image generated successfully`,
      data: {
        outputPath,
        model,
        aspectRatio: options.aspect || 'default',
        prompt,
        textResponse,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}
