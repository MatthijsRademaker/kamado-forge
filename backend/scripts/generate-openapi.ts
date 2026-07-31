import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildOpenApiDocument } from "../src/openapi";

const outputArgument = process.argv[2];
if (!outputArgument) {
  throw new Error("Usage: bun backend/scripts/generate-openapi.ts <output-file>");
}

const outputPath = resolve(outputArgument);
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(buildOpenApiDocument(), null, 2)}\n`);
