import { openai, type OpenAIImageModelGenerationOptions } from "@ai-sdk/openai";
import { generateImage } from "ai";
import {
  v2 as cloudinary,
  type DeleteApiResponse,
  type UploadApiResponse,
} from "cloudinary";
import { env } from "~/env";

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

export async function generateAndUpload(
  title: string,
  styleHint?: string,
): Promise<string> {
  const { image } = await generateImage({
    model: openai.image("gpt-image-2.5-sunburst"),
    prompt: `Professional gourmet food photography of ${title}${
      styleHint ? `, ${styleHint} style` : ""
    }, high resolution, 8K, appetizing lighting, beautifully plated, macro photography.`,
    size: "1024x1024",
    providerOptions: {
      openai: {
        quality: "medium",
      } satisfies OpenAIImageModelGenerationOptions,
    },
  });

  const buffer = Buffer.from(image.uint8Array);

  const result = await uploadToCloudinary(buffer);

  return result.secure_url;
}
