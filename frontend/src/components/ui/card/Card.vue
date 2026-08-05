<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

const _props = defineProps<{
  class?: HTMLAttributes["class"];
}>();
const _mergeClasses = cn;
</script>

<template>
  <div
    data-slot="card"
    :class="
      _mergeClasses(
        'bg-card text-card-foreground flex flex-col gap-6 rounded-default border border-border py-6 shadow-sm',
        _props.class,
      )
    "
  >
    <slot />
  </div>
</template>
