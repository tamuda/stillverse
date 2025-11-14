export type TranslationSource = "bible-api" | "esv-api";

export const TRANSLATIONS = [
  {
    code: "kjv",
    label: "KJV",
    name: "King James Version",
    source: "bible-api",
  },
  {
    code: "web",
    label: "WEB",
    name: "World English Bible",
    source: "bible-api",
  },
  {
    code: "asv",
    label: "ASV",
    name: "American Standard Version",
    source: "bible-api",
  },
  {
    code: "ylt",
    label: "YLT",
    name: "Young's Literal Translation",
    source: "bible-api",
  },
  {
    code: "bbe",
    label: "BBE",
    name: "Bible in Basic English",
    source: "bible-api",
  },
  {
    code: "darby",
    label: "DARBY",
    name: "Darby Translation",
    source: "bible-api",
  },
  {
    code: "esv",
    label: "ESV",
    name: "English Standard Version",
    source: "esv-api",
  },
] as const;

export type TranslationCode = (typeof TRANSLATIONS)[number]["code"];
