<script setup lang="ts">
import { NotebookTabs } from "lucide-vue-next";

import EmptyState from "@/components/EmptyState.vue";
import ProductAreaView from "@/components/ProductAreaView.vue";
import PrinciplesPanel from "@/components/panels/PrinciplesPanel.vue";
import ProTipPanel from "@/components/panels/ProTipPanel.vue";

defineOptions({ components: { EmptyState, NotebookTabs, PrinciplesPanel, ProductAreaView, ProTipPanel } });
</script>

<template>
  <div class="grid min-w-0 gap-8">
    <ProductAreaView
      eyebrow="Carry it forward"
      heading="Logbook"
      tagline="Every fire teaches something."
      description="Where completed cooks, real timings, outcomes, and hard-earned lessons will build a more useful record over time."
      image="/img/hero-logbook.jpg"
    />

    <div class="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
      <EmptyState
        title="No cooks recorded yet"
        description="Finish a live cook and it will land here with its real timings, notes, and outcome."
        class="min-h-80 border-dashed"
      >
        <template #icon>
          <span class="grid size-16 place-items-center rounded-pill border border-accent/50 bg-accent/10 text-accent" aria-hidden="true">
            <NotebookTabs class="size-8" />
          </span>
        </template>
      </EmptyState>

      <aside class="grid min-w-0 gap-4 xl:sticky xl:top-28" aria-label="Fire reference">
        <PrinciplesPanel />
        <ProTipPanel />
      </aside>
    </div>
  </div>
</template>
