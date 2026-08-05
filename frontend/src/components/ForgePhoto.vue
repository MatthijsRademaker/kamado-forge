<script setup lang="ts">
import { ref } from "vue";

/**
 * A photographic slot. Every photograph in the Kamado Forge references is
 * atmosphere rather than information — the adjacent headline always carries the
 * meaning — so these images are decorative by default and `alt` stays empty
 * unless a caller has a reason to name the subject.
 *
 * Drop the real files into `frontend/public/img/` (see the README there for the
 * expected filenames and crops). Until a file exists the `photo-slot` charcoal
 * and ember gradient shows through, so a missing asset reads as a deliberate
 * dark panel instead of a broken-image box. The `watermark` slot sits behind the
 * photograph, so callers can fill that gradient with a line icon that a real
 * photograph then covers.
 */
withDefaults(
  defineProps<{
    src: string;
    alt?: string;
    scrim?: "none" | "bottom" | "left";
  }>(),
  {
    alt: "",
    scrim: "none",
  },
);

const loadFailed = ref(false);
</script>

<template>
  <div class="photo-slot">
    <span v-if="$slots.watermark" aria-hidden="true" class="absolute inset-0 grid place-items-center">
      <slot name="watermark" />
    </span>
    <img
      v-if="!loadFailed"
      :src="src"
      :alt="alt"
      class="relative size-full object-cover"
      decoding="async"
      loading="lazy"
      @error="loadFailed = true"
    />
    <span v-if="scrim === 'bottom'" aria-hidden="true" class="photo-scrim" />
    <span v-else-if="scrim === 'left'" aria-hidden="true" class="photo-scrim-left" />
    <slot />
  </div>
</template>
