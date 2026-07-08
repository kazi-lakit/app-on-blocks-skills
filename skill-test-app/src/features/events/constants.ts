export const CATEGORIES = [
  "Music",
  "Sports",
  "Conference",
  "Theater",
  "Workshop",
  "Festival",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];