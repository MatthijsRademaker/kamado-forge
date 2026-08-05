<script setup lang="ts">
import type { TabsTriggerProps } from "reka-ui";
import type { HTMLAttributes } from "vue";
import { reactiveOmit } from "@vueuse/core";
import { TabsTrigger as _TabsTrigger, useForwardProps } from "reka-ui";
import { cn as _cn } from "@/lib/utils";

defineOptions({ components: { TabsTrigger: _TabsTrigger } });

const props = defineProps<TabsTriggerProps & { class?: HTMLAttributes["class"] }>();

const delegatedProps = reactiveOmit(props, "class");

const _forwardedProps = useForwardProps(delegatedProps);
const _mergeClasses = _cn;
</script>

<template>
  <TabsTrigger
    data-slot="tabs-trigger"
    :class="_mergeClasses(
      `focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-tight border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,border-color] focus-visible:ring-3 focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-b-2 data-[state=active]:border-b-accent data-[state=active]:text-accent [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4`,
      props.class,
    )"
    v-bind="_forwardedProps"
  >
    <slot />
  </TabsTrigger>
</template>
