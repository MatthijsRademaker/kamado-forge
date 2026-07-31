import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync, readdirSync } from "node:fs";

const styleSheet = readFileSync("frontend/src/style.css", "utf8");

describe("Kamado UI semantic theme", () => {
  test("exposes core, surface, text, border, accent, feedback, and focus roles", () => {
    const requiredTokens = [
      "--color-core:",
      "--color-surface:",
      "--color-surface-raised:",
      "--color-text:",
      "--color-text-muted:",
      "--color-border:",
      "--color-border-subtle:",
      "--color-accent:",
      "--color-accent-foreground:",
      "--color-feedback-success:",
      "--color-feedback-warning:",
      "--color-feedback-danger:",
      "--color-feedback-info:",
      "--color-focus:",
    ];

    for (const token of requiredTokens) {
      expect(styleSheet).toContain(token);
    }
  });

  test("uses the semantic focus token for visible keyboard focus", () => {
    expect(styleSheet).toContain("outline: 2px solid var(--color-focus);");
  });

  test("maps registry utilities to the Kamado semantic layer", () => {
    const registryTokens = [
      "--color-primary:",
      "--color-primary-foreground:",
      "--color-secondary:",
      "--color-secondary-foreground:",
      "--color-muted:",
      "--color-destructive:",
      "--color-input:",
      "--color-ring:",
    ];

    for (const token of registryTokens) {
      expect(styleSheet).toContain(token);
    }
  });
});

describe("generic Kamado compositions", () => {
  const compositionPaths = [
    "frontend/src/components/EmptyState.vue",
    "frontend/src/components/LoadingState.vue",
    "frontend/src/components/ErrorState.vue",
    "frontend/src/components/TemperatureDisplay.vue",
    "frontend/src/components/StatusIndicator.vue",
  ];

  test("keeps state, temperature, and status compositions outside the UI registry", () => {
    for (const path of compositionPaths) {
      expect(existsSync(path)).toBe(true);
    }
  });

  test("makes state actions and domain-neutral display values caller supplied", () => {
    const stateSource = compositionPaths
      .slice(0, 3)
      .map((path) => readFileSync(path, "utf8"))
      .join("\n");
    const displaySource = compositionPaths
      .slice(3)
      .map((path) => readFileSync(path, "utf8"))
      .join("\n");

    expect(stateSource).toContain('<slot name="action"');
    expect(displaySource).toContain("label");
    expect(displaySource).toContain("value");
    expect(displaySource).toContain("unit");
    expect(displaySource).toContain("min");
    expect(displaySource).toContain("max");
    expect(displaySource).toContain("success");
    expect(displaySource).toContain("warning");
    expect(displaySource).toContain("danger");
    expect(displaySource).toContain("info");
  });
});

describe("registry-derived UI primitives", () => {
  const primitiveDirectories = ["button", "card", "badge", "input", "textarea", "progress", "tabs", "dialog", "sheet"];

  test("publishes every primitive from the UI boundary", () => {
    for (const directory of primitiveDirectories) {
      expect(existsSync(`frontend/src/components/ui/${directory}/index.ts`)).toBe(true);
    }
  });

  test("composes utilities and Reka behavior rather than feature-specific controls", () => {
    const source = primitiveDirectories
      .flatMap((directory) => {
        const componentDirectory = `frontend/src/components/ui/${directory}`;

        return existsSync(componentDirectory)
          ? readdirSync(componentDirectory)
              .filter((fileName) => fileName.endsWith(".vue"))
              .map((fileName) => readFileSync(`${componentDirectory}/${fileName}`, "utf8"))
          : [];
      })
      .join("\n");

    expect(source).toContain('from "@/lib/utils"');
    expect(source).toContain("cn(");
    expect(source).toContain('from "reka-ui"');
  });

  test("uses the configured Lucide Vue icon package for overlay controls", () => {
    const overlaySource = [
      "frontend/src/components/ui/dialog/DialogContent.vue",
      "frontend/src/components/ui/sheet/SheetContent.vue",
    ]
      .map((path) => readFileSync(path, "utf8"))
      .join("\n");

    expect(overlaySource).toContain('from "lucide-vue-next"');
    expect(overlaySource).not.toContain('from "@lucide/vue"');
  });
});

describe("Kamado primitive showcase", () => {
  const showcasePath = "frontend/src/components/KamadoShowcase.vue";

  test("renders all public primitive and composition families from a local gallery", () => {
    expect(existsSync(showcasePath)).toBe(true);

    const showcaseSource = readFileSync(showcasePath, "utf8");
    const publicComponents = [
      "Button",
      "Card",
      "Badge",
      "Input",
      "Textarea",
      "Progress",
      "Tabs",
      "Dialog",
      "Sheet",
      "EmptyState",
      "LoadingState",
      "ErrorState",
      "TemperatureDisplay",
      "StatusIndicator",
    ];

    for (const component of publicComponents) {
      expect(showcaseSource).toContain(component);
    }

    for (const variant of ["default", "destructive", "outline", "secondary", "ghost", "link"]) {
      expect(showcaseSource).toContain(`variant="${variant}"`);
    }
    expect(showcaseSource).toContain('<Button variant="ghost">Ghost</Button>');
  });
});
