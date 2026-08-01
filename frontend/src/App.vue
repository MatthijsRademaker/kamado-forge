<script lang="ts">
import { h } from "vue";
import KamadoShowcase from "@/components/KamadoShowcase.vue";
import PlanPage from "@/features/plan/PlanPage.vue";

export default {
  setup() {
    if (window.location.pathname === "/plan") return () => h(PlanPage);

    const showcasePath = window.location.pathname === "/showcase" ? "/showcase" : "/";
    return () => h(KamadoShowcase, { "data-showcase-path": showcasePath });
  },
};
</script>
