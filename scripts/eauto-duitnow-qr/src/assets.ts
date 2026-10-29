/**
 * Throwaway upload assets, generated on demand into `fixtures/assets/`.
 * Nothing asserts on their contents — but the TYPE matters, because the showroom
 * video row rejects a PDF on its `accept` filter.
 */
import fs from "node:fs";
import path from "node:path";

const DIR = path.join(__dirname, "..", "fixtures", "assets");

/** Smallest structurally valid one-page PDF. */
const PDF = Buffer.from(
  "%PDF-1.4\n" +
  "1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n" +
  "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n" +
  "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]>>endobj\n" +
  "trailer<</Root 1 0 R>>\n%%EOF\n",
  "latin1",
);

/** 1x1 white JPEG. */
const JPG = Buffer.from(
  "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0a" +
  "HBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAA" +
  "AAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==",
  "base64",
);

/** Minimal ftyp+mdat MP4 stub — enough to pass a video `accept` filter. */
const MP4 = Buffer.concat([
  Buffer.from([0, 0, 0, 0x18]), Buffer.from("ftypisom", "latin1"),
  Buffer.from([0, 0, 2, 0]), Buffer.from("isomiso2", "latin1"),
  Buffer.from([0, 0, 0, 8]), Buffer.from("mdat", "latin1"),
]);

export function ensureAsset(name: string): string {
  fs.mkdirSync(DIR, { recursive: true });
  const file = path.join(DIR, name);
  if (!fs.existsSync(file)) {
    const body = /\.mp4$/i.test(name) ? MP4 : /\.jpe?g$/i.test(name) ? JPG : PDF;
    fs.writeFileSync(file, body);
  }
  return file;
}

export const tradingLicencePdf = () => ensureAsset("trading-licence.pdf");
