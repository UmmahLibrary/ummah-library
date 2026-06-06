/** The three reader presentations, mirroring the web `data-reading-mode`. */
export type ReadingMode = "translation" | "reading" | "reading-tr";

// A fawazahmed0/quran-api slug (the runtime catalogue's id-space — ADR 0011).
export const DEFAULT_EDITION = "eng-mustafakhattaba";
export const DEFAULT_EDITIONS = [DEFAULT_EDITION];

export const MIN_SCALE = 0.8;
export const MAX_SCALE = 1.6;
