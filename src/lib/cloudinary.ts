import { generateImage } from "ai";
import {
  v2 as cloudinary,
  type DeleteApiResponse,
  type UploadApiResponse,
} from "cloudinary";
import { env } from "~/env";
import {
  createBlackForestLabs,
  type BlackForestLabsImageModelOptions,
} from "@ai-sdk/black-forest-labs";

cloudinary.config({
  cloud_name: env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

const blackForestLabs = createBlackForestLabs();

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
  const model =
    process.env.NODE_ENV === "production" ? "flux-2-pro" : "flux-2-klein-9b";
  const { image } = await generateImage({
    model: blackForestLabs.image(model),
    prompt: `Professional gourmet food photography of ${title}${
      styleHint ? `, ${styleHint} style` : ""
    }, high resolution, 8k, appetizing lighting, macro lens, elegant plating.`,
    aspectRatio: "1:1",
    providerOptions: {
      blackForestLabs: {
        width: 1024,
        height: 1024,
      } satisfies BlackForestLabsImageModelOptions,
    },
  });

  const buffer = Buffer.from(image.uint8Array);

  const result = await uploadToCloudinary(buffer);

  return result.secure_url;
}
