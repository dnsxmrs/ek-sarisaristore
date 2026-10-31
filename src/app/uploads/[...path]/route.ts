import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

export async function GET(
  _req: NextRequest,
  props: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: segments } = await props.params;

    if (!segments || segments.length === 0) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Security: sanitize path segments against directory traversal
    const safeSegments = segments.filter(
      (segment) =>
        segment &&
        segment !== "." &&
        segment !== ".." &&
        !segment.includes("/") &&
        !segment.includes("\\")
    );

    const uploadsDir = path.resolve(process.cwd(), "public", "uploads");
    const targetFile = path.resolve(uploadsDir, ...safeSegments);

    // Verify target path remains strictly within uploads directory
    if (!targetFile.startsWith(uploadsDir)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const fileStats = await stat(targetFile);
    if (!fileStats.isFile()) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const fileBuffer = await readFile(targetFile);

    const ext = path.extname(targetFile).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".svg": "image/svg+xml",
      ".gif": "image/gif",
    };
    const contentType = mimeTypes[ext] || "application/octet-stream";

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": fileStats.size.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }
}

