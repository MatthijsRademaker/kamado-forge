interface NavigationItem {
  label: string;
  path: string;
  routeName: "today" | "plan" | "coach" | "learn" | "logbook";
  icon: "flame" | "calendar" | "message" | "book" | "logbook";
}

export const productNavigation = [
  { label: "Today", path: "/today", routeName: "today", icon: "flame" },
  { label: "Plan", path: "/plan", routeName: "plan", icon: "calendar" },
  { label: "Coach", path: "/coach", routeName: "coach", icon: "message" },
  { label: "Learn", path: "/learn", routeName: "learn", icon: "book" },
  { label: "Logbook", path: "/logbook", routeName: "logbook", icon: "logbook" },
] as const satisfies readonly NavigationItem[];
