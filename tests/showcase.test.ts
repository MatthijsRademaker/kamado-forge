import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const showcaseSource = readFileSync("frontend/src/components/KamadoShowcase.vue", "utf8");

describe("Kamado primitive showcase", () => {
  test("keeps illustrative interaction state and samples local to the responsive gallery", () => {
    expect(showcaseSource).toContain("const activeTab");
    expect(showcaseSource).toContain("const dialogOpen");
    expect(showcaseSource).toContain("const sheetOpen");
    expect(showcaseSource).toContain("v-model");
    expect(showcaseSource).not.toContain("fetch(");
    expect(showcaseSource).not.toContain("axios");
  });

  test("compares every atmosphere level, surface recipe, and stacking outcome", () => {
    for (const level of ["flat", "low", "mid", "high"]) {
      expect(showcaseSource).toContain(`data-atmosphere="${level}"`);
    }

    for (const recipe of ["surface-elevated", "surface-inset", "surface-outline", "surface-glass"]) {
      expect(showcaseSource).toContain(recipe);
    }

    expect(showcaseSource).toContain("Top-edge highlight + vertical gradient");
    expect(showcaseSource).toContain("Grain + ember glow");
    expect(showcaseSource).toContain("Incorrect — content beneath effect layer");
    expect(showcaseSource).toContain("Correct — content above effect layer");
    expect(showcaseSource).not.toContain('from "@/api');
  });

  test("uses bounded mobile-first layout utilities", () => {
    expect(showcaseSource).toContain("overflow-x-clip");
    expect(showcaseSource).toContain("sm:px-6");
    expect(showcaseSource).toContain("lg:grid-cols");
  });
});
