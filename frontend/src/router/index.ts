import { createRouter, createWebHistory } from "vue-router";

import { routeRecords } from "./routes";

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routeRecords,
});
