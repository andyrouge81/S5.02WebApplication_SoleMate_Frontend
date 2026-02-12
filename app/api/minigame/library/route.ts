import { NextResponse } from "next/server";
import path from "node:path";
import { readdir } from "node:fs/promises";

const IMAGES_ROOT = path.join(process.cwd(), "public", "images");
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif"]);

const toPublicPath = (folder: string, filename: string) => `/${folder}/${filename}`;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedFolder = searchParams.get("folder");

    const dirEntries = await readdir(IMAGES_ROOT, { withFileTypes: true });
    const folders = dirEntries
      .filter((entry) => entry.isDirectory())
      .map((entry) => `images/${entry.name}`)
      .sort();

    if (!folders.length) {
      return NextResponse.json({
        folders: [],
        selectedFolder: null,
        images: [],
      });
    }

    const selectedFolder = folders.includes(requestedFolder ?? "")
      ? (requestedFolder as string)
      : folders.includes("images/feet")
        ? "images/feet"
        : folders[0];

    const selectedAbsolutePath = path.join(process.cwd(), "public", selectedFolder);
    const fileEntries = await readdir(selectedAbsolutePath, { withFileTypes: true });
    const images = fileEntries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((filename) => IMAGE_EXTENSIONS.has(path.extname(filename).toLowerCase()))
      .sort()
      .map((filename) => toPublicPath(selectedFolder, filename));

    return NextResponse.json({
      folders,
      selectedFolder,
      images,
    });
  } catch {
    return NextResponse.json(
      { message: "No se pudo cargar la librería del minijuego" },
      { status: 500 }
    );
  }
}
