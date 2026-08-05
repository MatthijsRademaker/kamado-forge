<script setup lang="ts">
import { Flame } from "lucide-vue-next";
import ForgePhoto from "@/components/ForgePhoto.vue";
import { placeholderProTip } from "@/content/placeholder";

/**
 * The "Pro tip" rail panel from `designs/fire-management.png`: an ember label,
 * a large serif-weight line of advice, and a coal photograph filling the lower
 * half under a scrim.
 *
 * Placeholder content — tips are not authored in the product yet.
 */
defineOptions({ components: { Flame, ForgePhoto } });
</script>

<template>
  <section
    aria-labelledby="pro-tip-heading"
    data-atmosphere="high"
    data-placeholder="pro-tip"
    class="atmosphere-effects relative isolate grid min-h-72 content-between overflow-hidden rounded-default border border-border-subtle"
  >
    <ForgePhoto src="/img/texture-embers.jpg" scrim="bottom" class="absolute inset-0 -z-1 size-full" />

    <div class="atmosphere-content grid gap-3 p-5">
      <h2 id="pro-tip-heading" class="font-label text-label tracking-[0.16em] text-accent uppercase">
        {{ placeholderProTip.label }}
      </h2>
      <p class="max-w-[18rem] text-body leading-relaxed text-text">{{ placeholderProTip.body }}</p>
    </div>

    <footer class="atmosphere-content flex items-end justify-between gap-3 p-5">
      <p class="font-label text-label tracking-[0.14em] text-accent uppercase">{{ placeholderProTip.signoff }}</p>
      <Flame aria-hidden="true" class="size-5 shrink-0 fill-accent stroke-accent" />
    </footer>
  </section>
</template>
