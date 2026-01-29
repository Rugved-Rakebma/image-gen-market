import {
  CommandResult,
  createClient,
  resolveModel,
  fileToInlinePart,
  resolveOutputPath,
  saveImage,
} from './utils';

interface EditOptions {
  image: string;
  instruction: string;
  aspect?: string;
  model?: string;
  size?: string;
  output?: string;
}

export async function edit(options: EditOptions): Promise<CommandResult> {
  try {
    const ai = createClient();
    const model = resolveModel(options.model);

    // Load input image
    const imagePart = fileToInlinePart(options.image);

    // Build contents
    const contents: Array<{ inlineData: { data: string; mimeType: string } } | { text: string }> = [
      imagePart,
      { text: options.instruction },
    ];

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
        error: 'No edited image was generated. The model returned text only.',
        data: { textResponse },
      };
    }

    const outputPath = resolveOutputPath(options.output, 'edited');
    saveImage(imageData, outputPath);

    return {
      success: true,
      message: 'Image edited successfully',
      data: {
        outputPath,
        inputPath: options.image,
        model,
        aspectRatio: options.aspect || 'default',
        instruction: options.instruction,
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
