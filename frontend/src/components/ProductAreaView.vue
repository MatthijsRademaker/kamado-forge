<script setup lang="ts">
import { computed } from "vue";
import ForgePhoto from "@/components/ForgePhoto.vue";
import ForgeSmolder from "@/components/ForgeSmolder.vue";

/**
 * The product-area hero. Matches the full-bleed banners in
 * `designs/learn-books.png` and `designs/fire-management.png`: photograph on the
 * right under a left-to-right scrim, eyebrow and distressed display type on the
 * left, ember tagline, then body copy. A smoldering coal bed burns between the
 * photograph and the type, so the band reads as lit rather than printed — it
 * owns the sparks here, which is why the static `ember-particles` tile is not
 * also applied.
 *
 * The negative margins cancel the padding on the shell's `<main>` so the band
 * reaches the viewport edges the way the references do.
 *
 * The band is atmosphere wherever it appears, so it burns at `mid` even on top
 * of a page whose body is a `low` working surface. `atmosphere` overrides that
 * for a caller that needs the banner to go quiet.
 */
const props = withDefaults(
  defineProps<{
    eyebrow: string;
    heading: string;
    /** Omit on pages whose tagline already says everything the band needs to. */
    description?: string;
    /**
     * Required when `heading` is user data rather than a fixed area name, since
     * the fallback derives the id from the heading text.
     */
    headingId?: string;
    /**
     * `area` is the full display scale for one-word area names. `record` steps
     * down for headings that carry a record's own title, which runs long and
     * arrives at any length.
     */
    headingScale?: "area" | "record";
    image?: string;
    tagline?: string;
    atmosphere?: "flat" | "low" | "mid" | "high";
  }>(),
  {
    atmosphere: "mid",
    description: "",
    headingId: "",
    headingScale: "area",
    image: "",
    tagline: "",
  },
);

/** Below `mid` the coal bed resolves to zero opacity, so it is not rendered at
 * all rather than left animating invisibly behind a dense working page. */
const _smoldering = computed(() => props.atmosphere === "mid" || props.atmosphere === "high");
const _headingId = computed(() => props.headingId || `${props.heading.toLowerCase()}-heading`);
</script>

<template>
  <section
    :data-atmosphere="atmosphere"
    class="atmosphere-effects relative -mx-4 -mt-6 isolate overflow-hidden border-b border-border-subtle bg-core sm:-mx-6 sm:-mt-8 lg:-mx-8 lg:-mt-10 xl:-mx-12"
  >
    <ForgePhoto
      v-if="image"
      :src="image"
      scrim="left"
      class="absolute inset-y-0 right-0 -z-1 w-full sm:w-[68%]"
    />

    <ForgeSmolder v-if="_smoldering" />

    <div
      class="atmosphere-content relative z-1 grid min-h-64 content-center gap-5 px-4 py-12 sm:px-6 sm:py-16 lg:min-h-80 lg:px-8 lg:py-20 xl:px-12"
      :class="$slots.aside && 'md:grid-cols-[minmax(0,1fr)_auto] md:items-end'"
    >
      <div class="max-w-2xl">
        <p class="mb-3 font-label text-label tracking-[0.16em] text-accent uppercase">
          {{ eyebrow }}
        </p>
        <h1
          :id="_headingId"
          class="display-distress font-display leading-[0.88] tracking-[-0.02em] uppercase"
          :class="
            headingScale === 'record'
              ? 'text-[clamp(2.5rem,10vw,5.5rem)] [overflow-wrap:anywhere]'
              : 'text-[clamp(3.5rem,11vw,7rem)]'
          "
        >
          {{ heading }}
        </h1>
        <p v-if="tagline" class="mt-4 font-heading text-heading-lg tracking-[0.06em] text-accent uppercase">
          {{ tagline }}
        </p>
        <template v-if="description">
          <div class="section-hairline my-6" />
          <p class="max-w-xl text-body leading-7 text-text-muted">
            {{ description }}
          </p>
        </template>
      </div>

      <!-- Standing detail about the area itself — a durability note, a count.
           Anything a reader acts on belongs in the page body, not the banner. -->
      <p v-if="$slots.aside" class="text-small text-text-muted">
        <slot name="aside" />
      </p>
    </div>
  </section>
</template>
