import { openai, type OpenAIImageModelGenerationOptions } from "@ai-sdk/openai";
import { startObservation } from "@langfuse/tracing";
import { generateImage } from "ai";
import {
  v2 as cloudinary,
  type DeleteApiResponse,
  type UploadApiResponse,
} from "cloudinary";
import { env } from "~/env";

/**
 * The model and the settings every recipe photo is generated with. Named and shared with the
 * trace below so the model call and what the trace reports cannot drift apart.
 */
const IMAGE_MODEL = "gpt-image-2.5-flare" as const;
const IMAGE_SIZE = "1024x1024" as const;
const IMAGE_QUALITY = "medium" as const;

cloudinary.config({
  cloud_name: env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export function uploadToCloudinary(buffer: Buffer): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          upload_preset: "mantelazul",
        },
        (error, result) => {
          if (error || !result) reject(error ?? new Error("Upload failed"));
          else resolve(result);
        },
      )
      .end(buffer);
  });
}

export function deleteFromCloudinary(
  publicId: string,
): Promise<DeleteApiResponse> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(
      `mantelazul/${publicId}`,
      {
        resource_type: "image",
      },
      (error, result) => {
        console.log("Cloudinary delete result:", result);
        if (error || !result) reject(error ?? new Error("Delete failed"));
        else resolve(result);
      },
    );
  });
}

function buildImagePrompt(title: string, styleHint?: string): string {
  return `Professional gourmet food photography of ${title}${
    styleHint ? `, ${styleHint} style` : ""
  }, high resolution, 8K, appetizing lighting, beautifully plated, macro photography.`;
}

export async function generateAndUpload(
  title: string,
  styleHint?: string,
): Promise<string> {
  const prompt = buildImagePrompt(title, styleHint);

  // The AI SDK does not instrument image generation: `generateImage` takes no telemetry option
  // and emits no span, so Langfuse would never see this call. The observation is built by hand
  // and carries the tokens the provider charges for, which is all Langfuse needs to price it.
  const generation = startObservation(
    "generate-recipe-image",
    {
      model: IMAGE_MODEL,
      input: prompt,
      modelParameters: { size: IMAGE_SIZE, quality: IMAGE_QUALITY },
    },
    { asType: "generation" },
  );

  try {
    const { image, usage } = await generateImage({
      model: openai.image(IMAGE_MODEL),
      prompt,
      size: IMAGE_SIZE,
      providerOptions: {
        openai: {
          quality: IMAGE_QUALITY,
        } satisfies OpenAIImageModelGenerationOptions,
      },
    });

    // Recorded before the upload, not after: the tokens are already spent, and a failed upload
    // should not hide what the model call cost.
    const inputTokens = usage.inputTokens ?? 0;
    const outputTokens = usage.outputTokens ?? 0;

    if (inputTokens > 0 || outputTokens > 0) {
      generation.update({
        usageDetails: { input: inputTokens, output: outputTokens },
      });
    }

    const result = await uploadToCloudinary(Buffer.from(image.uint8Array));

    // Markdown, so the trace shows the photo that was generated and not just its URL.
    generation.update({ output: `![${title}](${result.secure_url})` });

    return result.secure_url;
  } catch (error) {
    generation.update({
      level: "ERROR",
      statusMessage: error instanceof Error ? error.message : String(error),
    });

    throw error;
  } finally {
    generation.end();
  }
}
