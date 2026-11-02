import { env } from "~/env";

/**
 * True only for images uploaded to this app's Cloudinary account. The URL of an attached image
 * arrives from the client, so without this check a crafted message could make the agent use any
 * external image as a recipe cover, or point it at a private URL the server should not touch.
 */
export function isOwnedCloudinaryUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;

  try {
    const url = new URL(value);

    return (
      url.protocol === "https:" &&
      url.hostname === "res.cloudinary.com" &&
      url.pathname.startsWith(`/${env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/`)
    );
  } catch {
    return false;
  }
}
