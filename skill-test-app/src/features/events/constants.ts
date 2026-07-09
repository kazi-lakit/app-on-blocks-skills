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

export const CATEGORY_KEYS: Record<Category, string> = {
  Music: "CATEGORY_MUSIC",
  Sports: "CATEGORY_SPORTS",
  Conference: "CATEGORY_CONFERENCE",
  Theater: "CATEGORY_THEATER",
  Workshop: "CATEGORY_WORKSHOP",
  Festival: "CATEGORY_FESTIVAL",
  Other: "EVENTS_CATEGORY_OTHER",
};