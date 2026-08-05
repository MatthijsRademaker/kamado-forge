import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync, readdirSync } from "node:fs";

const styleSheet = readFileSync("frontend/src/style.css", "utf8");

// Live Cook's layout lives in `features/live` components composed by the view,
// so every Live assertion reads the view and its feature components together.
function readLiveSource(): string {
  return [
    "frontend/src/views/LiveView.vue",
    ...readdirSync("frontend/src/features/live")
      .filter((fileName) => fileName.endsWith(".vue"))
      .map((fileName) => `frontend/src/features/live/${fileName}`),
  ]
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");
}

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

  test("uses a neutral interaction surface instead of ember for hover and open states", () => {
    expect(styleSheet).toContain("--color-interaction-surface: var(--color-neutral-pewter);");
    expect(styleSheet).toContain("--color-interaction-surface-foreground: var(--color-neutral-frost);");

    const interactiveSources = [
      "frontend/src/components/ui/button/index.ts",
      "frontend/src/components/ui/badge/index.ts",
      "frontend/src/components/ui/dialog/DialogContent.vue",
    ]
      .map((path) => readFileSync(path, "utf8"))
      .join("\n");

    expect(interactiveSources).toContain("hover:bg-interaction-surface");
    expect(interactiveSources).toContain("hover:text-interaction-surface-foreground");
    expect(interactiveSources).toContain("data-[state=open]:bg-interaction-surface");
    expect(interactiveSources).not.toMatch(/(?:hover:|data-\[state=open\]:)bg-accent/);
  });

  test("selects Forge radii by element class", () => {
    const registrySource = primitiveDirectories
      .flatMap((directory) => {
        const componentDirectory = `frontend/src/components/ui/${directory}`;

        return readdirSync(componentDirectory)
          .filter((fileName) => fileName.endsWith(".ts") || fileName.endsWith(".vue"))
          .map((fileName) => readFileSync(`${componentDirectory}/${fileName}`, "utf8"));
      })
      .join("\n");
    const productSource = [
      "frontend/src/components/KamadoShowcase.vue",
      "frontend/src/views/TodayView.vue",
      "frontend/src/features/plan/PlanPage.vue",
      "frontend/src/components/ProductAreaView.vue",
      "frontend/src/components/LoadingState.vue",
      "frontend/src/components/ErrorState.vue",
      "frontend/src/components/EmptyState.vue",
    ]
      .map((path) => readFileSync(path, "utf8"))
      .concat(readLiveSource())
      .join("\n");

    expect(registrySource).not.toMatch(/\brounded(?:-(?:xs|sm|md|lg|xl|2xl|3xl|full))?(?![-\w])/);
    expect(productSource).not.toContain("rounded-roomy");
  });

  test("shares structural ember treatments without call-site glow literals", () => {
    const tabsSource = readFileSync("frontend/src/components/ui/tabs/TabsTrigger.vue", "utf8");
    const todaySource = readFileSync("frontend/src/views/TodayView.vue", "utf8");
    const areaSource = readFileSync("frontend/src/components/ProductAreaView.vue", "utf8");
    const shellSource = readFileSync("frontend/src/components/ProductShell.vue", "utf8");
    const showcaseSource = readFileSync("frontend/src/components/KamadoShowcase.vue", "utf8");
    const glowSources = [
      shellSource,
      showcaseSource,
      areaSource,
      todaySource,
      readLiveSource(),
      readFileSync("frontend/src/features/plan/PlanPage.vue", "utf8"),
    ].join("\n");

    expect(styleSheet).toContain("@utility focal-card-rail {");
    expect(styleSheet).toContain("@utility section-hairline {");
    expect(todaySource).toContain("focal-card-rail");
    expect(todaySource).not.toContain('class="absolute inset-y-0 left-0 w-1 bg-accent"');
    expect(areaSource).toContain("section-hairline");
    expect(areaSource).not.toContain('class="my-7 h-px w-20 bg-accent"');
    expect(tabsSource).toContain("data-[state=active]:border-b-accent");
    expect(tabsSource).toContain("data-[state=active]:text-accent");
    expect(tabsSource).not.toContain("data-[state=active]:bg-background");
    expect(tabsSource).not.toContain("data-[state=active]:shadow-sm");
    expect(shellSource).toContain("atmosphere-effects");
    expect(showcaseSource).toContain("atmosphere-effects");
    expect(glowSources).not.toMatch(/shadow-\[0_0|radial-gradient[^\n]*(?:228|color-(?:accent|ember))/);
  });

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

describe("product atmosphere assignments", () => {
  test("declares budgets by reading context and keeps readouts flat", () => {
    const shellSource = readFileSync("frontend/src/components/ProductShell.vue", "utf8");
    const todaySource = readFileSync("frontend/src/views/TodayView.vue", "utf8");
    const liveSource = readLiveSource();
    const planSource = readFileSync("frontend/src/features/plan/PlanPage.vue", "utf8");
    const areaSource = readFileSync("frontend/src/components/ProductAreaView.vue", "utf8");
    const emptySource = readFileSync("frontend/src/components/EmptyState.vue", "utf8");
    const loadingSource = readFileSync("frontend/src/components/LoadingState.vue", "utf8");
    const errorSource = readFileSync("frontend/src/components/ErrorState.vue", "utf8");
    const temperatureSource = readFileSync("frontend/src/components/TemperatureDisplay.vue", "utf8");

    expect(shellSource).toContain('data-atmosphere="low"');
    expect(todaySource).toContain('data-atmosphere="mid"');
    expect(planSource).toContain('data-atmosphere="low"');
    // The banner burns at `mid` wherever it appears, including on top of a page
    // that is otherwise `low`, and takes an override for a caller that needs it.
    expect(areaSource).toContain(':data-atmosphere="atmosphere"');
    expect(areaSource).toContain('atmosphere: "mid",');
    expect(planSource).not.toMatch(/<ProductAreaView[\s\S]*?\satmosphere=/);
    expect(liveSource).toContain('data-atmosphere="low"');
    // The display heading now sits in the timeline's now region, which keeps the
    // `flat` budget that makes Live Cook's largest heading render solid.
    expect(liveSource).toContain('data-testid="live-now"');
    expect(liveSource).toContain('data-atmosphere="flat"');
    expect(temperatureSource).toContain('data-atmosphere="flat"');
    expect(emptySource).toContain('data-atmosphere="high"');
    expect(emptySource).toContain("atmosphere-effects");
    expect(emptySource).toContain("atmosphere-content");
    expect(loadingSource).not.toContain("data-atmosphere");
    expect(errorSource).not.toContain("data-atmosphere");
    expect(temperatureSource).not.toContain("atmosphere-effects");
    expect(liveSource).not.toMatch(/data-atmosphere="(?:mid|high)"/);
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

    for (const size of ["xs", "sm", "lg", "icon", "icon-xs", "icon-sm", "icon-lg"]) {
      expect(showcaseSource).toContain(`size="${size}"`);
    }
    for (const side of ["top", "right", "bottom", "left"]) {
      expect(showcaseSource).toContain(`sheetSide = '${side}'`);
    }
    expect(showcaseSource).toContain('status="neutral"');
  });
});
