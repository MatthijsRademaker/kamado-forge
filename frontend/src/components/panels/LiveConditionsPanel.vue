<script setup lang="ts">
import { ChevronRight } from "lucide-vue-next";
import ForgeTempGauge from "@/components/ForgeTempGauge.vue";
import { Button } from "@/components/ui/button";
import { placeholderConditions } from "@/content/placeholder";

/**
 * The "Live conditions" rail panel from `designs/fire-management.png`: a radial
 * grill-temp gauge over target and fan-speed readouts.
 *
 * Placeholder content — no probe or controller feed exists yet.
 */
defineOptions({ components: { Button, ChevronRight, ForgeTempGauge } });
</script>

<template>
  <section
    aria-label="Live conditions"
    data-placeholder="live-conditions"
    class="grid gap-4 rounded-default border border-border-subtle bg-surface p-5"
  >
    <div class="flex items-center justify-between gap-3">
      <h2 class="font-label text-label tracking-[0.1em] text-neutral-mist uppercase">Live conditions</h2>
      <p class="flex shrink-0 items-center gap-2 text-caption text-feedback-success">
        <span aria-hidden="true" class="size-2 rounded-pill bg-feedback-success" />
        {{ placeholderConditions.connected ? "Connected" : "Offline" }}
      </p>
    </div>

    <ForgeTempGauge
      label="Grill temp"
      :max="placeholderConditions.maxTemp"
      :min="placeholderConditions.minTemp"
      :value="placeholderConditions.grillTemp"
    />

    <dl class="grid grid-cols-2 gap-3 border-t border-border-subtle pt-4">
      <div class="grid gap-1">
        <dt class="font-label text-caption tracking-[0.12em] text-neutral-mist uppercase">Target</dt>
        <dd class="font-heading text-heading-lg leading-none text-accent">{{ placeholderConditions.targetTemp }}°F</dd>
      </div>
      <div class="grid gap-1 text-right">
        <dt class="font-label text-caption tracking-[0.12em] text-neutral-mist uppercase">Fan speed</dt>
        <dd class="font-heading text-heading-lg leading-none text-text">{{ placeholderConditions.fanSpeedPercent }}%</dd>
      </div>
    </dl>

    <Button variant="outline" class="w-full justify-between">
      View full dashboard
      <ChevronRight aria-hidden="true" />
    </Button>
  </section>
</template>
