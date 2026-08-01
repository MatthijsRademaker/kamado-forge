import { createRouter, createWebHistory } from "vue-router";
import ProductShell from "@/components/ProductShell.vue";
import KamadoShowcase from "@/components/KamadoShowcase.vue";
import CoachView from "@/views/CoachView.vue";
import LearnView from "@/views/LearnView.vue";
import LogbookView from "@/views/LogbookView.vue";
import LiveView from "@/views/LiveView.vue";
import PlanView from "@/views/PlanView.vue";
import TodayView from "@/views/TodayView.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: { name: "today" } },
    {
      path: "/",
      component: ProductShell,
      children: [
        { path: "today", name: "today", component: TodayView },
        { path: "live/:sessionId", name: "live", component: LiveView },
        { path: "plan", name: "plan", component: PlanView },
        { path: "coach", name: "coach", component: CoachView },
        { path: "learn", name: "learn", component: LearnView },
        { path: "logbook", name: "logbook", component: LogbookView },
      ],
    },
    { path: "/showcase", name: "showcase", component: KamadoShowcase },
  ],
});
