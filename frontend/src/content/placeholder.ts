/**
 * PLACEHOLDER CONTENT — NOT REAL DATA.
 *
 * The layouts in `designs/` show panels the backend does not serve yet: skill
 * progress, streaks, a Learn library, learning paths, fire-management
 * principles, and a live conditions gauge. This module supplies static stand-ins
 * so those layouts exist and can be reviewed against the references.
 *
 * Every value here is invented. Nothing reads from the API, nothing persists,
 * and nothing reflects the signed-in user. When a real endpoint lands, delete
 * the corresponding export and bind the component to the query — the components
 * take this data as props precisely so that swap is local.
 *
 * Surfaces rendering this content carry `data-placeholder` so it is greppable
 * and obvious in the DOM.
 */

interface PlaceholderBook {
  readonly slug: string;
  readonly category: string;
  readonly title: string;
  readonly description: string;
  readonly lessons: number;
  readonly minutes: number;
  readonly percentComplete: number;
  readonly image: string;
}

interface PlaceholderPath {
  readonly slug: string;
  readonly title: string;
  readonly tagline: string;
  readonly guides: number;
  readonly hours: string;
  readonly percentComplete: number;
  readonly recommended: boolean;
  readonly icon: "flame" | "grill" | "trophy" | "tools";
}

interface PlaceholderPrinciple {
  readonly title: string;
  readonly body: string;
  readonly icon: "anchor" | "clock" | "thermometer" | "wind";
}

export const placeholderProfile = {
  greeting: "Welcome back",
  name: "Grill Master",
  level: "Intermediate",
  levelStep: 3,
  levelStepCount: 6,
} as const;

export const placeholderProgress = {
  milestone: "Fire Management",
  percentComplete: 75,
  skillPercent: 72,
  skillTarget: "Confident kamado driver",
  skillNote: "Keep building. You're on fire.",
  streakDays: 14,
  streakWeek: [true, true, true, true, true, true, false],
} as const;

export const placeholderQuote = {
  text: "You don't master the kamado overnight. You earn it — one fire at a time.",
  attribution: "Unknown",
} as const;

export const placeholderBooks: readonly PlaceholderBook[] = [
  {
    slug: "reverse-searing",
    category: "Technique",
    title: "Reverse searing",
    description: "The ultimate guide to perfectly cooked steaks every time.",
    lessons: 12,
    minutes: 45,
    percentComplete: 75,
    image: "/img/book-reverse-searing.jpg",
  },
  {
    slug: "low-and-slow",
    category: "Technique",
    title: "Low & slow smoking",
    description: "Master the art of smoking for unbelievable flavour and tenderness.",
    lessons: 15,
    minutes: 60,
    percentComplete: 65,
    image: "/img/book-smoking.jpg",
  },
  {
    slug: "fire-management",
    category: "Fire management",
    title: "Fire management 101",
    description: "Learn to control temperature like a legend.",
    lessons: 10,
    minutes: 32,
    percentComplete: 80,
    image: "/img/book-fire-management.jpg",
  },
  {
    slug: "grilling",
    category: "Cooking",
    title: "Grilling & searing",
    description: "High heat, bold flavour, and the crust that comes with it.",
    lessons: 8,
    minutes: 30,
    percentComplete: 60,
    image: "/img/book-grilling.jpg",
  },
  {
    slug: "fuel-and-airflow",
    category: "Fire management",
    title: "Fuel & airflow",
    description: "Understanding charcoal, airflow, and efficiency.",
    lessons: 7,
    minutes: 25,
    percentComplete: 45,
    image: "/img/book-fuel-airflow.jpg",
  },
  {
    slug: "care-and-maintenance",
    category: "Maintenance",
    title: "Care & maintenance",
    description: "Keep your kamado in peak condition for life.",
    lessons: 6,
    minutes: 18,
    percentComplete: 20,
    image: "/img/book-care-maintenance.jpg",
  },
];

export const placeholderPaths: readonly PlaceholderPath[] = [
  {
    slug: "foundations",
    icon: "flame",
    title: "Foundations",
    tagline: "New to kamado?",
    guides: 6,
    hours: "2.5 hrs",
    percentComplete: 60,
    recommended: false,
  },
  {
    slug: "backyard-pitmaster",
    icon: "grill",
    title: "Backyard pitmaster",
    tagline: "Take your skills further.",
    guides: 10,
    hours: "5.5 hrs",
    percentComplete: 30,
    recommended: true,
  },
  {
    slug: "competition-ready",
    icon: "trophy",
    title: "Competition ready",
    tagline: "For the ambitious.",
    guides: 12,
    hours: "8+ hrs",
    percentComplete: 0,
    recommended: false,
  },
  {
    slug: "maintenance-pro",
    icon: "tools",
    title: "Maintenance pro",
    tagline: "Keep it clean. Keep it hot.",
    guides: 5,
    hours: "1.5 hrs",
    percentComplete: 80,
    recommended: false,
  },
];

export const placeholderPrinciples: readonly PlaceholderPrinciple[] = [
  {
    title: "Start small",
    body: "Start with both vents twice as small as you think you need.",
    icon: "anchor",
  },
  {
    title: "Change slowly",
    body: "Small adjustments. Wait. Let the kamado respond.",
    icon: "clock",
  },
  {
    title: "Stabilise",
    body: "Let the temp settle for 10–15 minutes before making changes.",
    icon: "thermometer",
  },
  {
    title: "Control the top",
    body: "Top vent controls temp. Bottom vent controls speed.",
    icon: "wind",
  },
];

export const placeholderProTip = {
  label: "Pro tip",
  body: "Patience is the difference between good BBQ and great BBQ.",
  signoff: "Keep the fire.",
} as const;

export const placeholderConditions = {
  grillTemp: 250,
  targetTemp: 225,
  minTemp: 150,
  maxTemp: 350,
  fanSpeedPercent: 15,
  connected: true,
} as const;

export const placeholderRecentTopics = ["Vent settings", "Dome temp vs grate temp", "Heat soak"] as const;

export const placeholderCurrentFocus = ["Airflow control", "Fire stabilisation", "Reverse searing"] as const;
