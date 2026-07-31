<script setup lang="ts">
import type { ProgressRootProps } from "reka-ui";
import type { HTMLAttributes } from "vue";
import { reactiveOmit } from "@vueuse/core";
import { ProgressIndicator, ProgressRoot } from "reka-ui";
import { cn } from "@/lib/utils";

const props = withDefaults(defineProps<ProgressRootProps & { class?: HTMLAttributes["class"] }>(), {
  modelValue: 0,
});

defineOptions({
  components: { ProgressIndicator, ProgressRoot },
});

const _mergeClasses = cn;
const _delegatedProps = reactiveOmit(props, "class");

function _indicatorTransform(value: number | null | undefined, max: number | undefined) {
  if (value === null || value === undefined) {
    return "translateX(-100%)";
  }

  const maximum = typeof max === "number" && Number.isFinite(max) && max > 0 ? max : 100;
  const percentage = Math.min(100, Math.max(0, (value / maximum) * 100));

  return `translateX(-${100 - percentage}%)`;
}
</script>

<template>
  <ProgressRoot
    data-slot="progress"
    v-bind="_delegatedProps"
    :class="
      _mergeClasses(
        'bg-primary/20 relative h-2 w-full overflow-hidden rounded-full',
        props.class,
      )
    "
  >
    <ProgressIndicator
      data-slot="progress-indicator"
      class="bg-primary h-full w-full flex-1 transition-all"
      :style="`transform: ${_indicatorTransform(props.modelValue, props.max)};`"
    />
  </ProgressRoot>
</template>
