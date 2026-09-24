import { type NextRequest, NextResponse } from "next/server";
import { uploadToCloudinary } from "~/lib/cloudinary";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const result = await uploadToCloudinary(buffer);

  return NextResponse.json({
    url: result.secure_url,
  });
}
