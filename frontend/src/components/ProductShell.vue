<script setup lang="ts">
import { useMediaQuery } from "@vueuse/core";
import { computed, ref, watch } from "vue";
import { Bell, ChevronRight, Flame, Menu, Search } from "lucide-vue-next";
import { useRoute } from "vue-router";
import ForgeSidebar from "@/components/ForgeSidebar.vue";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { productNavigation } from "@/navigation";

defineOptions({
  components: {
    Bell,
    Button,
    ChevronRight,
    Flame,
    ForgeSidebar,
    Menu,
    Search,
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
  <div data-atmosphere="low" class="min-h-screen min-w-0 bg-canvas text-text">
    <a
      :href="`#${_mainContentId}`"
      class="fixed top-3 left-3 z-[100] -translate-y-24 rounded-tight bg-accent px-4 py-3 font-label text-label tracking-[0.08em] text-accent-foreground uppercase shadow-elevated transition-transform duration-fast focus:translate-y-0"
    >
      Skip to main content
    </a>

    <aside
      data-testid="desktop-navigation"
      class="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col overflow-hidden border-r border-border-subtle bg-neutral-obsidian lg:flex"
    >
      <ForgeSidebar />
    </aside>

    <div class="min-w-0 lg:pl-72">
      <Sheet v-model:open="mobileMenuOpen">
        <header
          class="sticky top-0 z-20 flex min-h-16 items-center gap-3 border-b border-border-subtle bg-neutral-obsidian/95 px-4 backdrop-blur lg:hidden"
        >
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
            class="shrink-0 rounded-tight border border-accent/60 px-3 py-2 font-label text-small tracking-[0.05em] text-accent uppercase"
          >
            <Flame aria-hidden="true" class="inline size-4 fill-current" />
            <span class="ml-1 hidden sm:inline">Continue cook</span>
          </RouterLink>
        </header>

        <SheetContent
          id="product-menu"
          side="left"
          class="flex w-[min(88vw,22rem)] flex-col gap-0 overflow-hidden border-border-subtle bg-neutral-obsidian p-0"
        >
          <SheetHeader class="sr-only">
            <SheetTitle>Product menu</SheetTitle>
            <SheetDescription>Navigate Kamado Forge.</SheetDescription>
          </SheetHeader>
          <ForgeSidebar @navigate="mobileMenuOpen = false" />
        </SheetContent>
      </Sheet>

      <header
        class="atmosphere-effects sticky top-0 z-20 hidden min-h-20 items-center justify-between gap-6 border-b border-border-subtle bg-neutral-obsidian/80 px-8 backdrop-blur lg:flex xl:px-12"
      >
        <nav aria-label="Breadcrumb" class="atmosphere-content min-w-0">
          <ol class="flex min-w-0 items-center gap-2 font-label text-label tracking-[0.1em] uppercase">
            <li class="text-neutral-mist">Kamado Forge</li>
            <li aria-hidden="true"><ChevronRight class="size-4 text-neutral-steel" /></li>
            <li aria-current="page" class="truncate text-accent">{{ _currentArea?.label }}</li>
          </ol>
        </nav>

        <div class="atmosphere-content flex shrink-0 items-center gap-3">
          <label class="relative hidden xl:block">
            <span class="sr-only">Search guides, techniques, topics</span>
            <Search aria-hidden="true" class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-mist" />
            <input
              type="search"
              placeholder="Search guides and techniques…"
              class="min-h-11 w-80 rounded-tight border border-border-subtle bg-surface/70 pr-16 pl-9 text-ui text-text placeholder:text-neutral-mist"
            />
            <kbd
              aria-hidden="true"
              class="absolute top-1/2 right-3 -translate-y-1/2 rounded-compact border border-border-subtle px-1.5 py-0.5 font-label text-caption text-neutral-mist"
            >
              ⌘K
            </kbd>
          </label>

          <Button variant="ghost" size="icon" aria-label="Notifications" class="relative border border-border-subtle">
            <Bell aria-hidden="true" class="size-5" />
            <span aria-hidden="true" class="absolute top-1.5 right-1.5 size-2 rounded-pill bg-accent" />
          </Button>

          <Button as-child variant="outline" class="min-h-11">
            <RouterLink :to="{ name: 'today' }">
              <Flame aria-hidden="true" class="fill-accent stroke-accent" />
              Continue active cook
            </RouterLink>
          </Button>
        </div>
      </header>

      <main
        :id="_mainContentId"
        tabindex="-1"
        :aria-label="_currentArea?.label"
        class="min-w-0 px-4 py-6 focus:outline-none sm:px-6 sm:py-8 lg:px-8 lg:py-10 xl:px-12"
      >
        <RouterView />
      </main>
    </div>
  </div>
</template>
