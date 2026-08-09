/**
 * The privacy policy — a single, framework-free source of truth so the web page
 * (`apps/web/src/app/privacy`) and the mobile screen render identical text and
 * can't drift. Pure data, no I/O. `**bold**` marks emphasis; a plain email
 * address in a paragraph is rendered as a mailto link by each platform.
 */

export const PRIVACY_UPDATED = "16 June 2026";
export const PRIVACY_CONTACT_EMAIL = "ummahlibrary@outlook.com";

export interface PrivacySection {
  heading: string;
  /** Paragraphs of body text (rendered before the list). */
  body: string[];
  /** Optional bullet list rendered after the paragraphs. */
  list?: string[];
}

export const PRIVACY_INTRO =
  "Ummah Library is **local-first**. We don’t ask you to create an account, and we don’t keep a " +
  "copy of your data on our servers. Almost everything happens on your own device. This policy " +
  "explains the few times information leaves it, and why.";

export const PRIVACY_SECTIONS: PrivacySection[] = [
  {
    heading: "Your data stays on your device",
    body: [
      "Bookmarks, reading goals, Hifz (memorization) progress, the tasbih counter, your prayer " +
        "log, reading plans, and app settings are all stored locally on your device using your " +
        "browser’s storage (on the web) or on-device app storage (on mobile). We have no account " +
        "system and no database of users — that data is never sent to us and we cannot see it. " +
        "You can export or erase it at any time from **Settings → Data**.",
    ],
  },
  {
    heading: "Location",
    body: ["Location is used only when you open **Prayer Times** or **Qibla**, and only with your permission:"],
    list: [
      "**Prayer Times:** your coordinates are sent to our prayer-times endpoint to calculate the " +
        "day’s ṣalāh times for your location. They are used for that calculation only — not stored, " +
        "not linked to any identity, and not shared or sold.",
      "**Qibla:** the direction to the Kaaba is computed entirely on your device. Your coordinates never leave it.",
    ],
  },
  {
    heading: "Content we fetch",
    body: [
      "To show you the Qur’ān, translations, tafsīr, and recitation audio, the app requests that " +
        "content from our servers and from third-party content providers and CDNs (including " +
        "quran.com, everyayah.com, and jsDelivr). Like any web request, these carry standard " +
        "technical information such as your IP address. We don’t use this to build a profile of you.",
    ],
  },
  {
    heading: "No tracking, no ads",
    body: [
      "We don’t use analytics or tracking SDKs, we don’t set advertising cookies, and we don’t " +
        "show ads. The app is free and ad-free.",
    ],
  },
  {
    heading: "Children",
    body: [
      "Ummah Library is suitable for all ages and does not knowingly collect personal information " +
        "from anyone, including children.",
    ],
  },
  {
    heading: "Open source",
    body: [
      "Ummah Library is free and open source, licensed under AGPL-3.0. You can review exactly how " +
        "it handles data in the source code.",
    ],
  },
  {
    heading: "Changes & contact",
    body: [
      "If this policy changes, we’ll update the date below. Questions about privacy can be sent to " +
        `${PRIVACY_CONTACT_EMAIL}.`,
    ],
  },
];
