export const showcaseSections = [
  { id: "colors", label: "Colors" },
  { id: "typography", label: "Typography" },
  { id: "spacing", label: "Spacing" },
  { id: "surfaces", label: "Surfaces & effects" },
  { id: "responsive", label: "Responsive contract" },
] as const;

export const colorGroups = [
  {
    title: "Forge palette",
    description: "The ember, smoke, and mineral tones that establish the Forge atmosphere.",
    tokens: [
      { name: "Ember", variable: "--color-ember", description: "Primary ember accent" },
      { name: "Smoke", variable: "--color-smoke", description: "Bright orange accent" },
      { name: "Char", variable: "--color-char", description: "Deepest foundation" },
      { name: "Ash", variable: "--color-ash", description: "Core dark neutral" },
      { name: "Stone", variable: "--color-stone", description: "Raised dark neutral" },
      { name: "Obsidian", variable: "--color-neutral-obsidian", description: "Neutral 950" },
      { name: "Onyx", variable: "--color-neutral-onyx", description: "Neutral 900" },
      { name: "Slate", variable: "--color-neutral-slate", description: "Neutral 800" },
      { name: "Pewter", variable: "--color-neutral-pewter", description: "Neutral 700" },
      { name: "Steel", variable: "--color-neutral-steel", description: "Neutral 600" },
      { name: "Mist", variable: "--color-neutral-mist", description: "Neutral 400" },
      { name: "Neutral smoke", variable: "--color-neutral-smoke", description: "Neutral 300" },
      { name: "Frost", variable: "--color-neutral-frost", description: "Neutral 100" },
    ],
  },
  {
    title: "Semantic status",
    description: "Named intent colors remain legible through labels as well as hue.",
    tokens: [
      { name: "Fire / destructive", variable: "--color-fire", description: "Destructive state" },
      { name: "Success", variable: "--color-success", description: "Positive state" },
      { name: "Warning", variable: "--color-warning", description: "Caution state" },
      { name: "Info", variable: "--color-info", description: "Informational state" },
    ],
  },
  {
    title: "Interface roles",
    description: "Semantic aliases used by the application shell and surface primitives.",
    tokens: [
      { name: "Background", variable: "--color-background", description: "Application background" },
      { name: "Foreground", variable: "--color-foreground", description: "Primary foreground" },
      { name: "Card", variable: "--color-card", description: "Card surface" },
      { name: "Muted foreground", variable: "--color-muted-foreground", description: "Supporting copy" },
      { name: "Border", variable: "--color-border", description: "Default border" },
      { name: "Canvas", variable: "--color-canvas", description: "Page canvas" },
      { name: "Surface", variable: "--color-surface", description: "Base surface" },
      { name: "Raised surface", variable: "--color-surface-raised", description: "Elevated surface" },
      { name: "Text", variable: "--color-text", description: "Primary text" },
      { name: "Muted text", variable: "--color-text-muted", description: "Secondary text" },
      { name: "Subtle border", variable: "--color-border-subtle", description: "Low-contrast border" },
      { name: "Strong border", variable: "--color-border-strong", description: "High-contrast border" },
    ],
  },
] as const;

export const typeSpecimens = [
  {
    role: "Display",
    sample: "Forge the signal",
    fontVariable: "--font-display",
    sizeVariable: "--text-display-title",
    lineHeightVariable: "--text-display-title--line-height",
    letterSpacingVariable: "--text-display-title--letter-spacing",
  },
  {
    role: "Display / hero",
    sample: "Make it visible",
    fontVariable: "--font-display",
    sizeVariable: "--text-display-hero",
    lineHeightVariable: "--text-display-hero--line-height",
    letterSpacingVariable: "--text-display-hero--letter-spacing",
  },
  {
    role: "Heading",
    sample: "Component inspection",
    fontVariable: "--font-heading",
    sizeVariable: "--text-heading-xl",
    lineHeightVariable: "--text-heading-xl--line-height",
    letterSpacingVariable: "--text-heading-xl--letter-spacing",
  },
  {
    role: "Heading / compact",
    sample: "Surface details",
    fontVariable: "--font-heading",
    sizeVariable: "--text-heading-lg",
    lineHeightVariable: "--text-heading-lg--line-height",
    letterSpacingVariable: "--text-heading-lg--letter-spacing",
  },
  {
    role: "Label",
    sample: "INTERNAL REFERENCE",
    fontVariable: "--font-label",
    sizeVariable: "--text-label",
    lineHeightVariable: "--text-label--line-height",
    letterSpacingVariable: "--text-label--letter-spacing",
  },
  {
    role: "Body",
    sample: "A readable sentence for everyday product copy.",
    fontVariable: "--font-body",
    sizeVariable: "--text-body",
    lineHeightVariable: "--text-body--line-height",
    letterSpacingVariable: "--text-body--letter-spacing",
  },
  {
    role: "UI",
    sample: "Navigation and controls",
    fontVariable: "--font-body",
    sizeVariable: "--text-ui",
    lineHeightVariable: "--text-ui--line-height",
    letterSpacingVariable: "--text-ui--letter-spacing",
  },
  {
    role: "Small",
    sample: "Supporting metadata",
    fontVariable: "--font-body",
    sizeVariable: "--text-small",
    lineHeightVariable: "--text-small--line-height",
    letterSpacingVariable: "--text-small--letter-spacing",
  },
  {
    role: "Caption",
    sample: "TOKEN REFERENCE / 11PX",
    fontVariable: "--font-body",
    sizeVariable: "--text-caption",
    lineHeightVariable: "--text-caption--line-height",
    letterSpacingVariable: "--text-caption--letter-spacing",
  },
] as const;

export const spacingTokens = [1, 2, 3, 4, 6, 8, 12, 16, 24, 32].map((step) => ({
  name: `Space ${step}`,
  variable: `--spacing-${step}`,
  description: `Spacing scale step ${step}`,
}));

export const surfaceTokens = [
  { name: "Canvas", variable: "--color-canvas", description: "Page background" },
  { name: "Surface", variable: "--color-surface", description: "Base container" },
  { name: "Raised", variable: "--color-surface-raised", description: "Elevated container" },
  { name: "Card", variable: "--color-card", description: "Focused container" },
] as const;

export const borderTokens = [
  { name: "Subtle", variable: "--color-border-subtle", description: "Quiet separation" },
  { name: "Default", variable: "--color-border", description: "Standard separation" },
  { name: "Strong", variable: "--color-border-strong", description: "Focused separation" },
] as const;

export const radiusTokens = [
  { name: "Compact", variable: "--radius-compact", description: "2px compact corner" },
  { name: "Tight", variable: "--radius-tight", description: "4px tight corner" },
  { name: "Default", variable: "--radius-default", description: "8px standard corner" },
  { name: "Roomy", variable: "--radius-roomy", description: "12px roomy corner" },
  { name: "Pill", variable: "--radius-pill", description: "Full pill corner" },
] as const;

export const effectTokens = [
  { name: "Elevated shadow", variable: "--shadow-elevated", description: "Depth below a raised surface" },
  { name: "Inset shadow", variable: "--shadow-inset", description: "Inner edge treatment" },
  { name: "Outline shadow", variable: "--shadow-outline", description: "Quiet focus boundary" },
] as const;

export const breakpointTokens = [
  { name: "base", threshold: "0px" },
  { name: "sm", threshold: "640px" },
  { name: "md", threshold: "768px" },
  { name: "lg", threshold: "1024px" },
  { name: "xl", threshold: "1280px" },
  { name: "2xl", threshold: "1536px" },
] as const;
