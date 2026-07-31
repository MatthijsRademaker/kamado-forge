import type { RouteRecordRaw } from "vue-router";

export const routeRecords: RouteRecordRaw[] = [
  {
    path: "/",
    name: "home",
    component: () => import("../views/HomeView.vue"),
  },
  {
    path: "/showcase",
    name: "showcase",
    component: () => import("../views/ShowcaseView.vue"),
    meta: {
      internal: true,
      purpose: "Internal Forge design-system showcase",
      surface: "design-system-showcase",
    },
  },
];
