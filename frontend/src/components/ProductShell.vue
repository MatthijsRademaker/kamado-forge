<script setup lang="ts">
import { useMediaQuery } from "@vueuse/core";
import { computed, onUnmounted, provide, ref, watch } from "vue";
import { Flame, Menu } from "lucide-vue-next";
import { useRoute } from "vue-router";
import ProductNavigation from "@/components/ProductNavigation.vue";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { createSessionFlow } from "@/features/session/controller";
import { sessionFlowKey } from "@/features/session/context";
import { productNavigation } from "@/navigation";

defineOptions({
  components: {
    Button,
    Flame,
    Menu,
    ProductNavigation,
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
  },
});

const route = useRoute();
const mobileMenuOpen = ref(false);
const desktopLayoutActive = useMediaQuery("(min-width: 64rem)");
const queryIndex = route.fullPath.indexOf("?");
const sessionFlow = createSessionFlow(queryIndex === -1 ? "" : route.fullPath.slice(queryIndex));
provide(sessionFlowKey, sessionFlow);
onUnmounted(sessionFlow.dispose);

const _currentArea = computed(
  () =>
    productNavigation.find((item) => item.routeName === route.name) ??
    (route.name === "live" ? { label: "Live Cook" } : undefined),
);
const _mainContentId = computed(() => `${String(route.name)}-main-content`);

watch(
  () => route.fullPath,
  () => {
    mobileMenuOpen.value = false;
  },
);

watch(desktopLayoutActive, (isDesktop) => {
  if (isDesktop) {
    mobileMenuOpen.value = false;
  }
});
</script>

<template>
  <div class="min-h-screen min-w-0 bg-canvas text-text">
    <a
      :href="`#${_mainContentId}`"
      class="fixed top-3 left-3 z-[100] -translate-y-24 rounded-tight bg-accent px-4 py-3 font-label text-label tracking-[0.08em] text-accent-foreground uppercase shadow-elevated transition-transform duration-fast focus:translate-y-0"
    >
      Skip to main content
    </a>

    <aside
      data-testid="desktop-navigation"
      class="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-border-subtle bg-neutral-obsidian lg:flex"
    >
      <div class="flex min-h-24 items-center gap-3 border-b border-border-subtle px-7">
        <span class="grid size-11 place-items-center rounded-full border border-accent/50 bg-accent/10 text-accent shadow-inset">
          <Flame aria-hidden="true" class="size-6 fill-current stroke-[1.5]" />
        </span>
        <span class="font-heading text-heading-lg leading-none tracking-[0.1em] uppercase">
          Kamado<br /><span class="text-accent">Forge</span>
        </span>
      </div>

      <div class="flex flex-1 flex-col px-5 py-8">
        <p class="mb-3 px-4 font-label text-caption tracking-[0.18em] text-neutral-mist uppercase">Your fire</p>
        <ProductNavigation />

        <div class="mt-auto border-t border-border-subtle pt-6">
          <RouterLink
            :to="{ name: 'today' }"
            class="group flex items-center justify-between gap-3 rounded-tight border border-accent bg-accent px-4 py-3 font-label text-label tracking-[0.06em] text-accent-foreground uppercase shadow-[0_0_24px_rgb(228_81_26_/_0.16)] transition duration-fast hover:bg-smoke"
          >
            Continue active cook
            <Flame aria-hidden="true" class="size-5 shrink-0 fill-current" />
          </RouterLink>
        </div>
      </div>
    </aside>

    <div class="min-w-0 lg:pl-72">
      <Sheet v-model:open="mobileMenuOpen">
        <header class="sticky top-0 z-20 flex min-h-16 items-center gap-3 border-b border-border-subtle bg-neutral-obsidian/95 px-4 backdrop-blur lg:hidden">
          <SheetTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open product menu"
              aria-controls="product-menu"
              :aria-expanded="mobileMenuOpen"
              class="shrink-0 border border-border-subtle"
            >
              <Menu aria-hidden="true" class="size-5" />
            </Button>
          </SheetTrigger>

          <div class="min-w-0 flex-1">
            <p class="truncate font-heading text-heading-lg leading-none tracking-[0.08em] uppercase">
              {{ _currentArea?.label }}
            </p>
            <p class="truncate text-caption tracking-[0.12em] text-neutral-mist uppercase">Kamado Forge</p>
          </div>

          <RouterLink
            :to="{ name: 'today' }"
            aria-label="Continue active cook"
            class="shrink-0 rounded-tight bg-accent px-3 py-2 font-label text-small tracking-[0.05em] text-accent-foreground uppercase sm:px-4"
          >
            <span class="sm:hidden">Continue</span>
            <span class="hidden sm:inline">Continue active cook</span>
          </RouterLink>
        </header>

        <SheetContent
          id="product-menu"
          side="left"
          class="w-[min(88vw,22rem)] gap-0 border-border-subtle bg-neutral-obsidian p-0"
        >
          <SheetHeader class="border-b border-border-subtle px-6 py-6 text-left">
            <SheetTitle class="font-heading text-heading-xl tracking-[0.08em] text-text uppercase">Product menu</SheetTitle>
            <SheetDescription class="text-small text-text-muted">Navigate Kamado Forge.</SheetDescription>
          </SheetHeader>
          <div class="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-6">
            <ProductNavigation @navigate="mobileMenuOpen = false" />
            <RouterLink
              :to="{ name: 'today' }"
              class="mt-auto flex items-center justify-between gap-3 rounded-tight border border-accent bg-accent px-4 py-3 font-label text-label tracking-[0.06em] text-accent-foreground uppercase"
              @click="mobileMenuOpen = false"
            >
              Continue active cook
              <Flame aria-hidden="true" class="size-5 shrink-0 fill-current" />
            </RouterLink>
          </div>
        </SheetContent>
      </Sheet>

      <header class="hidden min-h-24 items-center justify-between gap-6 border-b border-border-subtle bg-neutral-obsidian/75 px-8 backdrop-blur lg:flex xl:px-12">
        <div>
          <p class="font-label text-caption tracking-[0.18em] text-accent uppercase">Product area</p>
          <p class="font-heading text-heading-lg tracking-[0.08em] uppercase">{{ _currentArea?.label }}</p>
        </div>
        <p class="max-w-md text-right text-small tracking-[0.04em] text-neutral-mist">
          Learn the fire. Trust the process. Keep the lesson.
        </p>
      </header>

      <main
        :id="_mainContentId"
        tabindex="-1"
        :aria-label="_currentArea?.label"
        class="min-w-0 px-4 py-6 focus:outline-none sm:px-6 sm:py-8 lg:px-8 lg:py-12 xl:px-12"
      >
        <RouterView />
      </main>
    </div>
  </div>
</template>
