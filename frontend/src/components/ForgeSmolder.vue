<script setup lang="ts">
/**
 * The bed of coals burning behind a product-area hero.
 *
 * Purely decorative: it carries no information the headline does not already
 * state, so it is hidden from assistive technology and takes no pointer events.
 * All colour and motion live in the `smolder-*` utilities in `style.css`; this
 * component only declares the stacking order of the layers, back to front.
 *
 * Intensity follows the inherited atmosphere budget, so the field is absent from
 * flat and low regions and never animates on a dense working screen.
 */
</script>

<template>
  <div aria-hidden="true" class="smolder-field">
    <span class="smolder-haze" />
    <span class="smolder-coalbed" />
    <span class="smolder-flare" />
    <span class="smolder-sparks">
      <span class="smolder-sparks-far" />
      <span class="smolder-sparks-near" />
    </span>
    <span class="smolder-emberline" />
  </div>
</template>
