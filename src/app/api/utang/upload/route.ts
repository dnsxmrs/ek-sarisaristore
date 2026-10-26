import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Walang larawang natanggap (No image file received)" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "utang");
    await mkdir(uploadsDir, { recursive: true });

    // Generate safe filename
    const extension = file.type.includes("png")
      ? "png"
      : file.type.includes("webp")
      ? "webp"
      : "jpg";
    const filename = `utang_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${extension}`;
    const filePath = path.join(uploadsDir, filename);

    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/utang/${filename}`;
    return NextResponse.json({ success: true, url: publicUrl });
  } catch (err) {
    console.error("Utang photo upload error:", err);
    return NextResponse.json(
      { success: false, error: "Hindi nai-save ang litrato (Failed to save image)" },
      { status: 500 }
    );
  }
}
