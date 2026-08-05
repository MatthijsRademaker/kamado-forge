import { describe, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";

function readFrontendPackage(): { dependencies: Record<string, string> } {
  try {
    return JSON.parse(readFileSync("frontend/package.json", "utf8")) as {
      dependencies: Record<string, string>;
    };
  } catch (error) {
    throw new Error("Could not read frontend/package.json.", { cause: error });
  }
}

const frontendPackage = readFrontendPackage();
const styleSheet = readFileSync("frontend/src/style.css", "utf8");

function buildFrontendCss(): string {
  execFileSync("bun", ["run", "--cwd", "frontend", "build"], { stdio: "pipe" });

  const cssFiles = readdirSync("frontend/dist/assets").filter((fileName) => fileName.endsWith(".css"));
  if (cssFiles.length === 0) {
    throw new Error("Frontend build did not produce a CSS asset.");
  }

  return cssFiles.map((cssFile) => readFileSync(`frontend/dist/assets/${cssFile}`, "utf8")).join("\n");
}

describe("Kamado Forge design foundation", () => {
  test("declares package-managed local fonts", () => {
    expect(frontendPackage.dependencies).toMatchObject({
      "@fontsource/anton": expect.any(String),
      "@fontsource/bebas-neue": expect.any(String),
      "@fontsource/inter": expect.any(String),
    });
  });

  test("loads local fonts into display, heading, label, and body roles", () => {
    expect(styleSheet).toContain('@import "@fontsource/anton/400.css";');
    expect(styleSheet).toContain('@import "@fontsource/bebas-neue/400.css";');
    expect(styleSheet).toContain('@import "@fontsource/inter/400.css";');
    expect(styleSheet).toContain('--font-display: "Anton"');
    expect(styleSheet).toContain('--font-heading: "Bebas Neue"');
    expect(styleSheet).toContain('--font-label: "Bebas Neue"');
    expect(styleSheet).toContain('--font-body: "Inter"');
  });

  test("exposes semantic palette and foundation primitives", () => {
    const requiredTokens = [
      "--color-ember: #e4511a;",
      "--color-smoke: #f1620f;",
      "--color-char: #101011;",
      "--color-ash: #1f1e1e;",
      "--color-stone: #282727;",
      "--color-neutral-obsidian: #0d0d0d;",
      "--color-neutral-onyx: #141414;",
      "--color-neutral-slate: #1f1f1f;",
      "--color-neutral-pewter: #2d2d2d;",
      "--color-neutral-steel: #3e3e3e;",
      "--color-neutral-mist: #a0a0a0;",
      "--color-neutral-smoke: #d1d1d1;",
      "--color-neutral-frost: #f5f5f5;",
      "--color-fire: #f0311d;",
      "--color-success: #2ba558;",
      "--color-warning: #ecb016;",
      "--color-info: #278cd0;",
      "--color-background: #101011;",
      "--color-foreground: #f5f5f5;",
      "--color-card: #1f1e1e;",
      "--color-muted-foreground: #a0a0a0;",
      "--color-border: #3e3e3e;",
      "--color-canvas: #101011;",
      "--color-surface: #1f1e1e;",
      "--color-text: #f5f5f5;",
      "--color-text-muted: #d1d1d1;",
      "--color-border-subtle: #3e3e3e;",
      "--spacing-1: 4px;",
      "--spacing-32: 128px;",
      "--radius-compact: 2px;",
      "--radius-pill: 9999px;",
      "--shadow-elevated:",
      "--shadow-inset:",
      "--shadow-outline:",
      "--ease-forge: cubic-bezier(0.4, 0, 0.2, 1);",
      "--transition-duration-fast: 150ms;",
      "--transition-duration-normal: 300ms;",
      "--transition-duration-slow: 500ms;",
    ];

    for (const token of requiredTokens) {
      expect(styleSheet).toContain(token);
    }
  });

  test("defines inherited atmosphere budgets with fail-flat defaults", () => {
    for (const token of [
      "--atmosphere-flat-grain-opacity: 0;",
      "--atmosphere-flat-glow-alpha: 0;",
      "--atmosphere-flat-glow-radius: 0px;",
      "--atmosphere-low-grain-opacity: 0;",
      "--atmosphere-mid-grain-opacity:",
      "--atmosphere-high-grain-opacity:",
      "--atmosphere-high-glow-alpha:",
      "--atmosphere-high-glow-radius:",
    ]) {
      expect(styleSheet).toContain(token);
    }

    expect(styleSheet).toContain(":root,\n[data-atmosphere]");
    expect(styleSheet).toContain('[data-atmosphere="low"]');
    expect(styleSheet).toContain('[data-atmosphere="mid"]');
    expect(styleSheet).toContain('[data-atmosphere="high"]');
  });

  test("builds layered surface recipes without replacing depth tokens", () => {
    const builtCss = buildFrontendCss();

    for (const utility of ["surface-elevated", "surface-inset", "surface-outline", "surface-glass"]) {
      expect(builtCss).toContain(`.${utility}{`);
    }

    expect(styleSheet).toContain("box-shadow: var(--shadow-elevated), var(--shadow-inset);");
    expect(styleSheet).toContain("box-shadow: var(--shadow-inset);");
    expect(styleSheet).toContain("box-shadow: var(--shadow-outline), var(--shadow-inset);");
    expect(styleSheet).toContain("backdrop-filter: blur(16px);");
  }, 15_000);

  test("builds one non-interactive grain and ember-glow effect layer", () => {
    const builtCss = buildFrontendCss();

    expect(builtCss).toContain(".atmosphere-effects{");
    expect(builtCss).toContain(".atmosphere-content{");
    expect(styleSheet).toContain("<feTurbulence");
    expect(styleSheet).toContain("baseFrequency='.08'");
    expect(styleSheet).toContain("numOctaves='2'");
    expect(styleSheet).toContain("180px 180px");
    expect(styleSheet).toContain("radial-gradient(");
    expect(styleSheet).toContain("var(--color-accent)");
    expect(styleSheet).toContain("var(--atmosphere-glow-alpha)");
    expect(styleSheet).toContain("var(--atmosphere-glow-radius)");
    expect(styleSheet).toContain("isolation: isolate;");
    expect(styleSheet).toContain("pointer-events: none;");
    expect(styleSheet).toContain("z-index: 0;");
    expect(styleSheet).toContain("z-index: 1;");
  }, 15_000);

  test("builds the smolder field on the atmosphere budget and cancels it under reduced motion", () => {
    const builtCss = buildFrontendCss();

    for (const layer of [
      "smolder-field",
      "smolder-coalbed",
      "smolder-flare",
      "smolder-haze",
      "smolder-sparks",
      "smolder-sparks-near",
      "smolder-sparks-far",
      "smolder-emberline",
    ]) {
      expect(builtCss).toContain(`.${layer}{`);
    }

    for (const keyframes of [
      "smolder-breathe",
      "smolder-flicker",
      "smolder-drift",
      "smolder-rise",
      "smolder-emberline-pulse",
    ]) {
      expect(builtCss).toContain(`@keyframes ${keyframes}`);
    }

    expect(styleSheet).toContain("--atmosphere-flat-smolder-opacity: 0;");
    expect(styleSheet).toContain("--atmosphere-low-smolder-opacity: 0;");
    expect(styleSheet).toContain("--atmosphere-mid-smolder-opacity:");
    expect(styleSheet).toContain("--atmosphere-high-smolder-opacity:");
    expect(styleSheet).toContain("opacity: var(--atmosphere-smolder-opacity, 0);");

    // Every frame must move transform and opacity only. Animating geometry or
    // background position instead would repaint the whole hero each frame.
    const smolderFrames = builtCss.match(/@keyframes smolder-[a-z-]+\{(?:[^{}]|\{[^{}]*\})*\}/g) ?? [];
    expect(smolderFrames).toHaveLength(5);
    for (const frames of smolderFrames) {
      for (const [, property] of frames.matchAll(/([a-z-]+):/g)) {
        expect(property).toMatch(/^(?:opacity|transform)$/);
      }
    }

    const reducedMotionBlocks =
      builtCss.match(/@media \(prefers-reduced-motion:reduce\)\{(?:[^{}]|\{[^{}]*\})*\}/g)?.join("\n") ?? "";
    expect(reducedMotionBlocks).toContain(".smolder-coalbed");
    expect(reducedMotionBlocks).toContain(".smolder-emberline");
    expect(reducedMotionBlocks).toContain("animation:none");
  }, 15_000);

  test("generates a duration-fast utility from its motion token", () => {
    const builtCss = buildFrontendCss();

    expect(builtCss).toMatch(/\.duration-fast\{[^}]*transition-duration:var\(--transition-duration-fast\)/);
  }, 15_000);

  test("encodes role-specific type and spacing scales", () => {
    const requiredTokens = [
      "--text-display-hero: 96px;",
      "--text-display-hero--line-height: 1;",
      "--text-display-hero--letter-spacing: -0.02em;",
      "--text-display-title: 64px;",
      "--text-display-title--line-height: 1;",
      "--text-display-title--letter-spacing: -0.02em;",
      "--text-heading-xl: 36px;",
      "--text-heading-xl--line-height: 1.1;",
      "--text-heading-xl--letter-spacing: 0.02em;",
      "--text-heading-lg: 24px;",
      "--text-heading-lg--line-height: 1.2;",
      "--text-heading-lg--letter-spacing: 0.02em;",
      "--text-label: 18px;",
      "--text-label--line-height: 1.2;",
      "--text-label--letter-spacing: 0.04em;",
      "--text-body: 16px;",
      "--text-body--line-height: 1.6;",
      "--text-ui: 14px;",
      "--text-ui--line-height: 1.6;",
      "--text-small: 12px;",
      "--text-small--line-height: 1.5;",
      "--text-caption: 11px;",
      "--text-caption--line-height: 1.4;",
      "--text-caption--letter-spacing: 0.02em;",
      "--spacing-1: 4px;",
      "--spacing-2: 8px;",
      "--spacing-3: 12px;",
      "--spacing-4: 16px;",
      "--spacing-6: 24px;",
      "--spacing-8: 32px;",
      "--spacing-12: 48px;",
      "--spacing-16: 64px;",
      "--spacing-24: 96px;",
      "--spacing-32: 128px;",
    ];

    for (const token of requiredTokens) {
      expect(styleSheet).toContain(token);
    }
  });

  test("sets accessible dark body defaults", () => {
    expect(styleSheet).toContain(`body {
  margin: 0;
  min-width: 320px;
  background-color: var(--color-canvas);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: var(--text-body);
  line-height: var(--text-body--line-height);
}`);
  });

  test("keeps keyboard focus visible and honors reduced-motion preferences", () => {
    expect(styleSheet).toContain(`:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 4px;
}`);
    expect(styleSheet).toContain("@media (prefers-reduced-motion: reduce)");
    expect(styleSheet).toContain("animation-duration: 0.01ms !important;");
    expect(styleSheet).toContain("animation-iteration-count: 1 !important;");
    expect(styleSheet).toContain("scroll-behavior: auto !important;");
    expect(styleSheet).toContain("transition-duration: 0.01ms !important;");
    expect(styleSheet).not.toContain("* {\n  outline: none;");
    expect(styleSheet).not.toContain("* {\n  outline: 0;");
  });
});
