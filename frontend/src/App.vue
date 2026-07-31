<script lang="ts">
import { h } from "vue";
import KamadoShowcase from "@/components/KamadoShowcase.vue";

export default {
  setup() {
    const showcasePath = window.location.pathname === "/showcase" ? "/showcase" : "/";

    return () => h(KamadoShowcase, { "data-showcase-path": showcasePath });
  },
};
</script>
