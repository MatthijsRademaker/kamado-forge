<script setup lang="ts">
import {
  borderTokens,
  breakpointTokens,
  colorGroups,
  effectTokens,
  radiusTokens,
  showcaseSections,
  spacingTokens,
  surfaceTokens,
  typeSpecimens,
} from "./showcaseTokens";

const responsiveCells = ["Palette", "Type", "Space", "Surface", "Motion", "Layout"];

type TypeSpecimen = (typeof typeSpecimens)[number];

function colorStyle(variable: string): Record<string, string> {
  return { "--showcase-color": `var(${variable})` };
}

function typeStyle(specimen: TypeSpecimen): Record<string, string> {
  return {
    "--showcase-type-font": `var(${specimen.fontVariable})`,
    "--showcase-type-size": `var(${specimen.sizeVariable})`,
    "--showcase-type-line-height": `var(${specimen.lineHeightVariable})`,
    "--showcase-type-letter-spacing": `var(${specimen.letterSpacingVariable})`,
  };
}

function spacingStyle(variable: string): Record<string, string> {
  return { "--showcase-spacing": `var(${variable})` };
}

function surfaceStyle(variable: string): Record<string, string> {
  return { "--showcase-surface": `var(${variable})` };
}

function borderStyle(variable: string): Record<string, string> {
  return { "--showcase-border": `var(${variable})` };
}

function radiusStyle(variable: string): Record<string, string> {
  return { "--showcase-radius": `var(${variable})` };
}

function effectStyle(variable: string): Record<string, string> {
  return { "--showcase-effect": `var(${variable})` };
}
</script>

<template>
  <main id="main-content" class="showcase-page">
    <header class="showcase-hero">
      <div class="showcase-hero-copy">
        <p class="showcase-kicker">
          <span class="showcase-kicker-mark" aria-hidden="true"></span>
          Internal design system / component showcase
        </p>
        <h1>Forge visual index</h1>
        <p class="showcase-intro">
          A static reference surface for the palette, type, spacing, and responsive rules that shape the Kamado Forge
          interface.
        </p>
      </div>
      <div class="showcase-hero-actions">
        <span class="showcase-status">Not a product page</span>
        <a class="showcase-root-link" href="/">
          Return to application root
          <span aria-hidden="true">↗</span>
        </a>
      </div>
    </header>

    <div class="showcase-layout">
      <nav class="showcase-index" aria-label="Showcase sections">
        <div class="showcase-index-heading">
          <span class="showcase-label">Index</span>
          <span class="showcase-index-count">05 sections</span>
        </div>
        <ol class="showcase-index-list">
          <li v-for="(section, index) in showcaseSections" :key="section.id">
            <a :href="`#${section.id}`">
              <span class="showcase-index-number">0{{ index + 1 }}</span>
              <span>{{ section.label }}</span>
            </a>
          </li>
        </ol>
        <p class="showcase-index-note">
          Internal reference only. Token values live in <code>src/style.css</code>.
        </p>
      </nav>

      <div class="showcase-content">
        <section id="colors" class="showcase-section" aria-labelledby="colors-heading">
          <header class="showcase-section-heading">
            <p class="showcase-section-number">01 / Palette</p>
            <h2 id="colors-heading">Colors &amp; semantic tokens</h2>
            <p>
              Named swatches make the Forge range inspectable without asking hue to carry meaning on its own. Each
              specimen points back to a CSS custom property.
            </p>
          </header>

          <div class="showcase-color-groups">
            <article v-for="group in colorGroups" :key="group.title" class="showcase-token-group">
              <div class="showcase-group-heading">
                <h3>{{ group.title }}</h3>
                <p>{{ group.description }}</p>
              </div>
              <ul class="showcase-color-grid">
                <li v-for="token in group.tokens" :key="token.variable" class="showcase-color-token">
                  <span class="showcase-color-swatch" :style="colorStyle(token.variable)" aria-hidden="true"></span>
                  <span class="showcase-token-copy">
                    <strong>{{ token.name }}</strong>
                    <code>var({{ token.variable }})</code>
                    <small>{{ token.description }}</small>
                  </span>
                </li>
              </ul>
            </article>
          </div>
        </section>

        <section id="typography" class="showcase-section" aria-labelledby="typography-heading">
          <header class="showcase-section-heading">
            <p class="showcase-section-number">02 / Type scale</p>
            <h2 id="typography-heading">Typography roles</h2>
            <p>
              Display, heading, label, and body roles keep hierarchy deliberate. Scale, leading, tracking, and font
              family are all read from the Forge theme variables.
            </p>
          </header>

          <ul class="showcase-type-list">
            <li v-for="specimen in typeSpecimens" :key="`${specimen.role}-${specimen.sizeVariable}`" class="showcase-type-specimen">
              <div class="showcase-type-meta">
                <span class="showcase-label">{{ specimen.role }}</span>
                <code>var({{ specimen.sizeVariable }})</code>
              </div>
              <p class="showcase-type-sample" :style="typeStyle(specimen)">{{ specimen.sample }}</p>
              <dl class="showcase-type-details">
                <div>
                  <dt>Font role</dt>
                  <dd>var({{ specimen.fontVariable }})</dd>
                </div>
                <div>
                  <dt>Leading</dt>
                  <dd>var({{ specimen.lineHeightVariable }})</dd>
                </div>
                <div>
                  <dt>Tracking</dt>
                  <dd>var({{ specimen.letterSpacingVariable }})</dd>
                </div>
              </dl>
            </li>
          </ul>
        </section>

        <section id="spacing" class="showcase-section" aria-labelledby="spacing-heading">
          <header class="showcase-section-heading">
            <p class="showcase-section-number">03 / Rhythm</p>
            <h2 id="spacing-heading">Spacing tokens</h2>
            <p>
              A compact-to-expansive rhythm keeps dense controls and generous section breaks in the same measurable
              system.
            </p>
          </header>

          <ul class="showcase-spacing-list">
            <li v-for="token in spacingTokens" :key="token.variable" class="showcase-spacing-token">
              <div class="showcase-spacing-meta">
                <strong>{{ token.name }}</strong>
                <code>var({{ token.variable }})</code>
              </div>
              <div class="showcase-spacing-track" aria-hidden="true">
                <span class="showcase-spacing-bar" :style="spacingStyle(token.variable)"></span>
              </div>
              <small>{{ token.description }}</small>
            </li>
          </ul>
        </section>

        <section id="surfaces" class="showcase-section" aria-labelledby="surfaces-heading">
          <header class="showcase-section-heading">
            <p class="showcase-section-number">04 / Material</p>
            <h2 id="surfaces-heading">Surfaces &amp; effects</h2>
            <p>
              Layers, edges, corners, and depth treatments create the industrial material language without introducing
              one-off values.
            </p>
          </header>

          <div class="showcase-subsection">
            <div class="showcase-subsection-heading">
              <h3>Surface layers</h3>
              <p>Canvas through card, from quiet background to focused container.</p>
            </div>
            <ul class="showcase-surface-grid">
              <li v-for="token in surfaceTokens" :key="token.variable" class="showcase-surface-token">
                <div class="showcase-surface-sample" :style="surfaceStyle(token.variable)">
                  <span class="showcase-surface-mark" aria-hidden="true"></span>
                  <span>{{ token.name }}</span>
                </div>
                <div class="showcase-token-copy">
                  <strong>{{ token.name }}</strong>
                  <code>var({{ token.variable }})</code>
                  <small>{{ token.description }}</small>
                </div>
              </li>
            </ul>
          </div>

          <div class="showcase-subsection">
            <div class="showcase-subsection-heading">
              <h3>Edges &amp; corners</h3>
              <p>Border contrast and radius scale provide structure before decoration.</p>
            </div>
            <div class="showcase-primitive-grid">
              <article v-for="token in borderTokens" :key="token.variable" class="showcase-primitive-card">
                <div class="showcase-border-sample" :style="borderStyle(token.variable)" aria-hidden="true"></div>
                <strong>{{ token.name }} border</strong>
                <code>var({{ token.variable }})</code>
                <small>{{ token.description }}</small>
              </article>
              <article v-for="token in radiusTokens" :key="token.variable" class="showcase-primitive-card">
                <div class="showcase-radius-sample" :style="radiusStyle(token.variable)" aria-hidden="true">Aa</div>
                <strong>{{ token.name }} radius</strong>
                <code>var({{ token.variable }})</code>
                <small>{{ token.description }}</small>
              </article>
            </div>
          </div>

          <div class="showcase-subsection">
            <div class="showcase-subsection-heading">
              <h3>Depth &amp; focus</h3>
              <p>Elevation, inset edges, and outline treatments stay visible against dark surfaces.</p>
            </div>
            <ul class="showcase-effect-grid">
              <li v-for="token in effectTokens" :key="token.variable" class="showcase-effect-token">
                <div class="showcase-effect-sample" :style="effectStyle(token.variable)">
                  <span class="showcase-effect-label">Aa</span>
                </div>
                <strong>{{ token.name }}</strong>
                <code>var({{ token.variable }})</code>
                <small>{{ token.description }}</small>
              </li>
            </ul>
          </div>
        </section>

        <section id="responsive" class="showcase-section" aria-labelledby="responsive-heading">
          <header class="showcase-section-heading">
            <p class="showcase-section-number">05 / Adaptation</p>
            <h2 id="responsive-heading">Responsive contract</h2>
            <p>
              The layout uses Tailwind's default breakpoints. The specimen below changes its column count as the
              viewport grows, with no resize state or backend dependency.
            </p>
          </header>

          <div class="showcase-responsive-layout">
            <div class="showcase-breakpoint-card">
              <div class="showcase-subsection-heading">
                <h3>Breakpoint index</h3>
                <p>Current utility contract</p>
              </div>
              <ul class="showcase-breakpoint-list">
                <li v-for="breakpoint in breakpointTokens" :key="breakpoint.name">
                  <span class="showcase-breakpoint-name">{{ breakpoint.name }}</span>
                  <code>{{ breakpoint.threshold }}</code>
                </li>
              </ul>
            </div>

            <div class="showcase-responsive-specimen">
              <div class="showcase-responsive-heading">
                <div>
                  <span class="showcase-label">Live reflow specimen</span>
                  <h3>One system, six widths</h3>
                </div>
                <span class="showcase-responsive-range">base → 2xl</span>
              </div>
              <ol class="showcase-responsive-grid" aria-label="Responsive layout specimens">
                <li v-for="(cell, index) in responsiveCells" :key="cell" class="showcase-responsive-cell">
                  <span>0{{ index + 1 }}</span>
                  <strong>{{ cell }}</strong>
                  <small>reflows with viewport</small>
                </li>
              </ol>
              <p class="showcase-responsive-note">
                Base stacks one column; <code>sm</code>, <code>md</code>, <code>lg</code>, <code>xl</code>, and
                <code>2xl</code> progressively open the grid.
              </p>
            </div>
          </div>
        </section>

        <footer class="showcase-footer">
          <span>Forge visual index / static frontend reference</span>
          <a href="/">Back to application root <span aria-hidden="true">↗</span></a>
        </footer>
      </div>
    </div>
  </main>
</template>

<style scoped>
.showcase-page {
  min-height: 100vh;
  overflow-x: clip;
  background: var(--color-canvas);
  color: var(--color-text);
}

.showcase-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--spacing-8);
  padding: var(--spacing-16) clamp(var(--spacing-4), 5vw, var(--spacing-12)) var(--spacing-12);
  border-bottom: 1px solid var(--color-border-subtle);
  background:
    linear-gradient(120deg, color-mix(in srgb, var(--color-ember) 9%, transparent), transparent 42%),
    var(--color-canvas);
}

.showcase-hero-copy,
.showcase-content {
  min-width: 0;
}

.showcase-hero-copy {
  max-width: 760px;
}

.showcase-kicker,
.showcase-label,
.showcase-section-number,
.showcase-status,
.showcase-index-count,
.showcase-responsive-range {
  font-family: var(--font-label);
  letter-spacing: var(--text-label--letter-spacing);
  text-transform: uppercase;
}

.showcase-kicker {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  margin: 0 0 var(--spacing-4);
  color: var(--color-smoke);
  font-size: var(--text-ui);
  line-height: var(--text-ui--line-height);
}

.showcase-kicker-mark {
  width: var(--spacing-2);
  height: var(--spacing-2);
  flex: 0 0 auto;
  border-radius: var(--radius-compact);
  background: var(--color-ember);
  box-shadow: var(--shadow-outline);
}

.showcase-hero h1 {
  max-width: 100%;
  margin: 0;
  color: var(--color-foreground);
  font-family: var(--font-display);
  font-size: min(var(--text-display-title), 18vw);
  font-weight: 400;
  letter-spacing: var(--text-display-title--letter-spacing);
  line-height: var(--text-display-title--line-height);
  overflow-wrap: anywhere;
}

.showcase-intro {
  max-width: 60ch;
  margin: var(--spacing-6) 0 0;
  color: var(--color-text-muted);
  font-size: var(--text-body);
  line-height: var(--text-body--line-height);
}

.showcase-hero-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--spacing-4);
  flex: 0 0 auto;
}

.showcase-status {
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  color: var(--color-neutral-mist);
  font-size: var(--text-caption);
  line-height: var(--text-caption--line-height);
}

.showcase-root-link,
.showcase-footer a {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
  color: var(--color-foreground);
  font-family: var(--font-label);
  font-size: var(--text-label);
  letter-spacing: var(--text-label--letter-spacing);
  line-height: var(--text-label--line-height);
  text-decoration: none;
  text-transform: uppercase;
  transition: color var(--transition-duration-fast) var(--ease-forge);
}

.showcase-root-link:hover,
.showcase-footer a:hover {
  color: var(--color-smoke);
}

.showcase-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--spacing-12);
  width: min(100%, 1600px);
  margin: 0 auto;
  padding: var(--spacing-12) clamp(var(--spacing-4), 5vw, var(--spacing-12)) var(--spacing-16);
}

.showcase-index {
  align-self: start;
  padding: var(--spacing-6);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-roomy);
  background: var(--color-surface);
  box-shadow: var(--shadow-inset);
}

.showcase-index-heading,
.showcase-responsive-heading,
.showcase-subsection-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--spacing-4);
}

.showcase-label {
  color: var(--color-smoke);
  font-size: var(--text-small);
  line-height: var(--text-small--line-height);
}

.showcase-index-count,
.showcase-responsive-range {
  color: var(--color-neutral-mist);
  font-size: var(--text-caption);
  line-height: var(--text-caption--line-height);
}

.showcase-index-list {
  display: grid;
  gap: var(--spacing-2);
  margin: var(--spacing-6) 0;
  padding: 0;
  list-style: none;
}

.showcase-index-list a {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-3);
  padding: var(--spacing-3);
  border: 1px solid transparent;
  border-radius: var(--radius-tight);
  color: var(--color-text-muted);
  font-size: var(--text-ui);
  line-height: var(--text-ui--line-height);
  text-decoration: none;
  transition:
    border-color var(--transition-duration-fast) var(--ease-forge),
    background-color var(--transition-duration-fast) var(--ease-forge),
    color var(--transition-duration-fast) var(--ease-forge);
}

.showcase-index-list a:hover {
  border-color: var(--color-border);
  background: var(--color-surface-raised);
  color: var(--color-foreground);
}

.showcase-index-number,
.showcase-section-number {
  color: var(--color-ember);
  font-family: var(--font-label);
}

.showcase-index-number {
  min-width: 2ch;
  font-size: var(--text-small);
}

.showcase-index-note {
  margin: 0;
  padding-top: var(--spacing-6);
  border-top: 1px solid var(--color-border-subtle);
  color: var(--color-neutral-mist);
  font-size: var(--text-small);
  line-height: var(--text-small--line-height);
}

.showcase-index-note code,
.showcase-section code,
.showcase-footer,
.showcase-responsive-note code {
  color: var(--color-neutral-smoke);
  font-family: var(--font-body);
  font-size: var(--text-caption);
}

.showcase-section {
  scroll-margin-top: var(--spacing-8);
  padding: var(--spacing-12) 0;
  border-top: 1px solid var(--color-border-subtle);
}

.showcase-section:first-child {
  padding-top: 0;
  border-top: 0;
}

.showcase-section-heading {
  max-width: 760px;
  margin-bottom: var(--spacing-8);
}

.showcase-section-number {
  margin: 0 0 var(--spacing-3);
  font-size: var(--text-small);
  line-height: var(--text-small--line-height);
}

.showcase-section h2 {
  margin: 0;
  color: var(--color-foreground);
  font-family: var(--font-heading);
  font-size: var(--text-heading-xl);
  font-weight: 400;
  letter-spacing: var(--text-heading-xl--letter-spacing);
  line-height: var(--text-heading-xl--line-height);
  text-transform: uppercase;
}

.showcase-section-heading > p:last-child {
  margin: var(--spacing-4) 0 0;
  color: var(--color-text-muted);
  font-size: var(--text-body);
  line-height: var(--text-body--line-height);
}

.showcase-color-groups,
.showcase-subsection {
  display: grid;
  gap: var(--spacing-8);
}

.showcase-token-group,
.showcase-subsection {
  padding: var(--spacing-6);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-roomy);
  background: var(--color-surface);
}

.showcase-group-heading,
.showcase-subsection-heading {
  margin-bottom: var(--spacing-6);
}

.showcase-group-heading h3,
.showcase-subsection-heading h3,
.showcase-responsive-heading h3 {
  margin: 0;
  color: var(--color-foreground);
  font-family: var(--font-heading);
  font-size: var(--text-heading-lg);
  font-weight: 400;
  letter-spacing: var(--text-heading-lg--letter-spacing);
  line-height: var(--text-heading-lg--line-height);
  text-transform: uppercase;
}

.showcase-group-heading p,
.showcase-subsection-heading p {
  max-width: 48ch;
  margin: var(--spacing-2) 0 0;
  color: var(--color-neutral-mist);
  font-size: var(--text-small);
  line-height: var(--text-small--line-height);
}

.showcase-color-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 190px), 1fr));
  gap: var(--spacing-3);
  margin: 0;
  padding: 0;
  list-style: none;
}

.showcase-color-token {
  display: grid;
  grid-template-columns: var(--spacing-8) minmax(0, 1fr);
  gap: var(--spacing-3);
  min-width: 0;
  padding: var(--spacing-3);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-tight);
  background: var(--color-canvas);
}

.showcase-color-swatch {
  width: var(--spacing-8);
  height: var(--spacing-8);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-compact);
  background: var(--showcase-color);
}

.showcase-token-copy {
  display: grid;
  align-content: start;
  gap: var(--spacing-1);
  min-width: 0;
}

.showcase-token-copy strong,
.showcase-primitive-card strong,
.showcase-effect-token strong {
  color: var(--color-foreground);
  font-size: var(--text-ui);
  font-weight: 600;
  line-height: var(--text-ui--line-height);
}

.showcase-token-copy code,
.showcase-primitive-card code,
.showcase-effect-token code,
.showcase-spacing-token code,
.showcase-surface-token code,
.showcase-type-meta code,
.showcase-type-details dd,
.showcase-breakpoint-list code {
  overflow-wrap: anywhere;
  color: var(--color-smoke);
  font-family: var(--font-body);
  font-size: var(--text-caption);
  line-height: var(--text-caption--line-height);
}

.showcase-token-copy small,
.showcase-primitive-card small,
.showcase-effect-token small,
.showcase-spacing-token small,
.showcase-surface-token small {
  color: var(--color-neutral-mist);
  font-size: var(--text-caption);
  line-height: var(--text-caption--line-height);
}

.showcase-type-list,
.showcase-spacing-list,
.showcase-surface-grid,
.showcase-effect-grid,
.showcase-breakpoint-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.showcase-type-list {
  display: grid;
  gap: var(--spacing-3);
}

.showcase-type-specimen {
  display: grid;
  grid-template-columns: minmax(110px, 0.22fr) minmax(0, 1fr);
  gap: var(--spacing-4) var(--spacing-8);
  align-items: center;
  min-width: 0;
  padding: var(--spacing-6);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-tight);
  background: var(--color-surface);
}

.showcase-type-meta {
  display: grid;
  align-content: start;
  gap: var(--spacing-2);
  min-width: 0;
}

.showcase-type-sample {
  min-width: 0;
  margin: 0;
  color: var(--color-foreground);
  font-family: var(--showcase-type-font);
  font-size: min(var(--showcase-type-size), 17vw);
  font-weight: 400;
  letter-spacing: var(--showcase-type-letter-spacing);
  line-height: var(--showcase-type-line-height);
  overflow-wrap: anywhere;
}

.showcase-type-details {
  display: grid;
  grid-column: 2;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--spacing-3);
  margin: 0;
  padding-top: var(--spacing-4);
  border-top: 1px solid var(--color-border-subtle);
}

.showcase-type-details div {
  min-width: 0;
}

.showcase-type-details dt {
  color: var(--color-neutral-mist);
  font-size: var(--text-caption);
  line-height: var(--text-caption--line-height);
  text-transform: uppercase;
}

.showcase-type-details dd {
  margin: var(--spacing-1) 0 0;
}

.showcase-spacing-list {
  display: grid;
  gap: var(--spacing-3);
}

.showcase-spacing-token {
  display: grid;
  grid-template-columns: minmax(110px, 0.25fr) minmax(0, 1fr) minmax(120px, 0.5fr);
  gap: var(--spacing-4);
  align-items: center;
  min-width: 0;
  padding: var(--spacing-3) 0;
  border-bottom: 1px solid var(--color-border-subtle);
}

.showcase-spacing-token:last-child {
  border-bottom: 0;
}

.showcase-spacing-meta {
  display: grid;
  gap: var(--spacing-1);
  min-width: 0;
}

.showcase-spacing-meta strong {
  color: var(--color-foreground);
  font-size: var(--text-ui);
  font-weight: 600;
}

.showcase-spacing-track {
  display: flex;
  align-items: center;
  min-width: 0;
  height: var(--spacing-4);
  border-radius: var(--radius-pill);
  background: var(--color-canvas);
  overflow: hidden;
}

.showcase-spacing-bar {
  display: block;
  width: min(var(--showcase-spacing), 100%);
  height: 100%;
  min-width: var(--spacing-1);
  border-radius: inherit;
  background: var(--color-ember);
}

.showcase-spacing-token > small {
  color: var(--color-neutral-mist);
  font-size: var(--text-caption);
  line-height: var(--text-caption--line-height);
}

.showcase-surface-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 190px), 1fr));
  gap: var(--spacing-3);
}

.showcase-surface-token {
  display: grid;
  gap: var(--spacing-3);
  min-width: 0;
}

.showcase-surface-sample {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  min-height: 112px;
  padding: var(--spacing-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-tight);
  background: var(--showcase-surface);
  box-shadow: var(--shadow-inset);
  color: var(--color-foreground);
  font-family: var(--font-label);
  font-size: var(--text-label);
  letter-spacing: var(--text-label--letter-spacing);
  text-transform: uppercase;
}

.showcase-surface-mark {
  width: var(--spacing-4);
  height: var(--spacing-4);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-compact);
  background: var(--color-ember);
}

.showcase-primitive-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr));
  gap: var(--spacing-3);
}

.showcase-primitive-card,
.showcase-effect-token {
  display: grid;
  align-content: start;
  gap: var(--spacing-2);
  min-width: 0;
  padding: var(--spacing-4);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-tight);
  background: var(--color-canvas);
}

.showcase-border-sample {
  height: var(--spacing-8);
  margin-bottom: var(--spacing-2);
  border-bottom: var(--spacing-1) solid var(--showcase-border);
}

.showcase-radius-sample {
  display: grid;
  place-items: center;
  height: var(--spacing-8);
  margin-bottom: var(--spacing-2);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--showcase-radius);
  background: var(--color-surface-raised);
  color: var(--color-foreground);
  font-family: var(--font-heading);
  font-size: var(--text-heading-lg);
}

.showcase-effect-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr));
  gap: var(--spacing-3);
}

.showcase-effect-sample {
  display: grid;
  place-items: center;
  min-height: 96px;
  margin: var(--spacing-2) var(--spacing-2) var(--spacing-4);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-default);
  background: var(--color-surface-raised);
  box-shadow: var(--showcase-effect);
  color: var(--color-foreground);
  font-family: var(--font-heading);
  font-size: var(--text-heading-lg);
}

.showcase-effect-label {
  opacity: 0.8;
}

.showcase-responsive-layout {
  display: grid;
  grid-template-columns: minmax(180px, 0.34fr) minmax(0, 1fr);
  gap: var(--spacing-4);
}

.showcase-breakpoint-card,
.showcase-responsive-specimen {
  min-width: 0;
  padding: var(--spacing-6);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-roomy);
  background: var(--color-surface);
}

.showcase-breakpoint-list {
  display: grid;
  gap: var(--spacing-2);
}

.showcase-breakpoint-list li {
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-4);
  padding: var(--spacing-3) 0;
  border-bottom: 1px solid var(--color-border-subtle);
}

.showcase-breakpoint-list li:last-child {
  border-bottom: 0;
}

.showcase-breakpoint-name {
  color: var(--color-foreground);
  font-family: var(--font-label);
  font-size: var(--text-label);
  letter-spacing: var(--text-label--letter-spacing);
  text-transform: uppercase;
}

.showcase-responsive-heading {
  align-items: flex-start;
  margin-bottom: var(--spacing-6);
}

.showcase-responsive-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--spacing-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.showcase-responsive-cell {
  display: grid;
  gap: var(--spacing-1);
  min-width: 0;
  min-height: 96px;
  padding: var(--spacing-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-tight);
  background: color-mix(in srgb, var(--color-ember) 12%, var(--color-surface-raised));
}

.showcase-responsive-cell > span {
  color: var(--color-ember);
  font-family: var(--font-label);
  font-size: var(--text-small);
}

.showcase-responsive-cell strong {
  color: var(--color-foreground);
  font-family: var(--font-heading);
  font-size: var(--text-heading-lg);
  font-weight: 400;
  letter-spacing: var(--text-heading-lg--letter-spacing);
  line-height: var(--text-heading-lg--line-height);
  text-transform: uppercase;
}

.showcase-responsive-cell small {
  align-self: end;
  color: var(--color-neutral-mist);
  font-size: var(--text-caption);
  line-height: var(--text-caption--line-height);
}

.showcase-responsive-note {
  margin: var(--spacing-6) 0 0;
  color: var(--color-neutral-mist);
  font-size: var(--text-small);
  line-height: var(--text-small--line-height);
}

.showcase-footer {
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-4);
  padding-top: var(--spacing-8);
  border-top: 1px solid var(--color-border-subtle);
  color: var(--color-neutral-mist);
  line-height: var(--text-small--line-height);
}

@media (min-width: 640px) {
  .showcase-color-grid {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }
}

@media (min-width: 768px) {
  .showcase-hero {
    padding-top: var(--spacing-24);
  }

  .showcase-responsive-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .showcase-layout {
    grid-template-columns: minmax(200px, 240px) minmax(0, 1fr);
    align-items: start;
  }

  .showcase-index {
    position: sticky;
    top: var(--spacing-6);
  }

  .showcase-responsive-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 1280px) {
  .showcase-layout {
    gap: var(--spacing-16);
  }

  .showcase-responsive-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (min-width: 1536px) {
  .showcase-responsive-grid {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
}

@media (max-width: 767px) {
  .showcase-hero {
    align-items: flex-start;
    flex-direction: column;
  }

  .showcase-hero-actions {
    align-items: flex-start;
  }

  .showcase-type-specimen,
  .showcase-spacing-token {
    grid-template-columns: minmax(0, 1fr);
  }

  .showcase-type-details {
    grid-column: 1;
  }

  .showcase-spacing-track {
    order: 3;
  }

  .showcase-spacing-token > small {
    order: 2;
  }

  .showcase-responsive-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .showcase-footer {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 420px) {
  .showcase-hero,
  .showcase-layout {
    padding-right: var(--spacing-4);
    padding-left: var(--spacing-4);
  }

  .showcase-index,
  .showcase-token-group,
  .showcase-subsection,
  .showcase-breakpoint-card,
  .showcase-responsive-specimen {
    padding: var(--spacing-4);
  }

  .showcase-type-details {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
