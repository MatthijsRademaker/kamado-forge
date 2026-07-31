import { describe, expect, test } from "bun:test";

import {
  borderTokens,
  breakpointTokens,
  colorGroups,
  effectTokens,
  radiusTokens,
  spacingTokens,
  surfaceTokens,
  typeSpecimens,
} from "../frontend/src/views/showcaseTokens";

describe("Forge showcase presentation metadata", () => {
  test("references the existing color, semantic, and font tokens", () => {
    const colorReferences = colorGroups.flatMap((group) => group.tokens.map((token) => token.variable));

    expect(colorReferences).toEqual(
      expect.arrayContaining([
        "--color-ember",
        "--color-neutral-obsidian",
        "--color-success",
        "--color-warning",
        "--color-info",
        "--color-background",
        "--color-surface-raised",
      ]),
    );
    expect(typeSpecimens.map((specimen) => specimen.fontVariable)).toEqual(
      expect.arrayContaining(["--font-display", "--font-heading", "--font-label", "--font-body"]),
    );
  });

  test("covers the Forge type, spacing, surface, and effect contracts", () => {
    expect(typeSpecimens.map((specimen) => specimen.role)).toEqual(
      expect.arrayContaining(["Display", "Heading", "Label", "Body", "UI", "Small", "Caption"]),
    );
    expect(spacingTokens.map((token) => token.variable)).toEqual(
      expect.arrayContaining(["--spacing-1", "--spacing-32"]),
    );
    expect(surfaceTokens.map((token) => token.variable)).toEqual(
      expect.arrayContaining(["--color-canvas", "--color-surface", "--color-surface-raised", "--color-card"]),
    );
    expect(borderTokens.map((token) => token.variable)).toEqual(
      expect.arrayContaining(["--color-border-subtle", "--color-border", "--color-border-strong"]),
    );
    expect(radiusTokens.map((token) => token.variable)).toEqual(
      expect.arrayContaining(["--radius-compact", "--radius-pill"]),
    );
    expect(effectTokens.map((token) => token.variable)).toEqual(
      expect.arrayContaining(["--shadow-elevated", "--shadow-inset", "--shadow-outline"]),
    );
  });

  test("documents every Tailwind breakpoint threshold", () => {
    expect(breakpointTokens).toEqual([
      { name: "base", threshold: "0px" },
      { name: "sm", threshold: "640px" },
      { name: "md", threshold: "768px" },
      { name: "lg", threshold: "1024px" },
      { name: "xl", threshold: "1280px" },
      { name: "2xl", threshold: "1536px" },
    ]);
  });
});
