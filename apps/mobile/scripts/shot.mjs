/**
 * Dev-only preview helper. Drives the Expo **web** build (react-native-web) with
 * Playwright so the mobile UI can be screenshotted and reviewed on a desktop
 * without an Android/iOS device. Not shipped — see AGENTS.md "test locally".
 *
 *   node scripts/shot.mjs --out .preview/home.png --path /            --wait 4000
 *   node scripts/shot.mjs --out .preview/hifz.png --clicks "Hifz"     --wait 4000
 *
 * Flags:
 *   --url <base>      Expo web origin (default http://localhost:8081)
 *   --path <p>        deep-link path appended to the origin (default /)
 *   --out <file>      screenshot output path (default .preview/shot.png)
 *   --clicks "a|b"    text labels to click in order before shooting
 *   --wait <ms>       settle time after load / each click (default 3500)
 *   --full            full-page screenshot instead of viewport
 *   --device <name>   Playwright device descriptor (default "iPhone 13")
 */
import { chromium, devices } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const argv = process.argv.slice(2);
const arg = (name, def) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : def;
};

const base = arg("--url", "http://localhost:8081");
// Normalise: callers may pass "hifz" or "/hifz" (Git Bash mangles a leading "/").
const rawPath = arg("--path", "/");
const path = "/" + rawPath.replace(/^\/+/, "");
const out = arg("--out", ".preview/shot.png");
const waitMs = Number(arg("--wait", "3500"));
const clicks = (arg("--clicks", "") || "").split("|").map((s) => s.trim()).filter(Boolean);
const fullPage = argv.includes("--full");
const seedHifz = argv.includes("--seed-hifz");
const scheme = arg("--scheme", "dark");
const device = devices[arg("--device", "iPhone 13")] ?? devices["iPhone 13"];

mkdirSync(dirname(out), { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ ...device, colorScheme: scheme });
const page = await ctx.newPage();

// Bypass the first-run onboarding by default; pass --onboarding to capture it.
if (!argv.includes("--onboarding")) {
  await ctx.addInitScript(() => localStorage.setItem("ul.onboarded", "1"));
}

if (seedHifz) {
  // Seed a realistic local-first Hifz store so the populated dashboard / review
  // can be reviewed without hand-tapping ＋ Hifz across many āyāt.
  await ctx.addInitScript(() => {
    const now = Date.now();
    const day = 86_400_000;
    const iso = (ms) => new Date(ms).toISOString();
    const card = (reps, interval, dueMs, reviewedMs) => ({
      repetitions: reps,
      easeFactor: 2.5,
      intervalDays: interval,
      due: iso(dueMs),
      lastReviewed: reviewedMs === null ? null : iso(reviewedMs),
    });
    const store = {
      "1:1": card(4, 20, now + 12 * day, now - 8 * day),
      "1:2": card(2, 6, now - day, now - 7 * day), // due
      "1:3": card(1, 1, now - day, now - 2 * day), // due
      "1:4": card(0, 0, now - day, null), // due, brand new
      "1:5": card(3, 10, now + 4 * day, now - 6 * day),
      "112:1": card(2, 6, now - day, now - 7 * day), // due
      "112:2": card(0, 0, now - day, null), // due, brand new
      "112:3": card(5, 30, now + 25 * day, now - 5 * day),
    };
    const yesterday = new Date(now - day).toISOString().slice(0, 10);
    localStorage.setItem("ul.hifz", JSON.stringify(store));
    localStorage.setItem("ul.hifz.streak", JSON.stringify({ count: 5, lastDate: yesterday }));
  });
}

if (argv.includes("--seed-home")) {
  await ctx.addInitScript(() => {
    localStorage.setItem("ul.lastRead", JSON.stringify({ surah: 2 }));
    localStorage.setItem("ul.bookmarks", JSON.stringify([18, 36, 67]));
  });
}

if (argv.includes("--seed-coords")) {
  await ctx.addInitScript(() => {
    localStorage.setItem("ul.prayerCoords", JSON.stringify({ latitude: 51.5074, longitude: -0.1278 }));
  });
}

if (argv.includes("--seed-reading")) {
  await ctx.addInitScript(() => {
    const ymd = (off) => {
      const x = new Date();
      x.setDate(x.getDate() - off);
      const p = (n) => String(n).padStart(2, "0");
      return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
    };
    localStorage.setItem("ul.readingGoal", JSON.stringify({ target: 8 }));
    localStorage.setItem(
      "ul.readingLog",
      JSON.stringify({ [ymd(0)]: 5, [ymd(1)]: 8, [ymd(2)]: 3, [ymd(3)]: 9, [ymd(4)]: 4, [ymd(5)]: 6 }),
    );
    localStorage.setItem(
      "ul.readingActive",
      JSON.stringify([ymd(5), ymd(4), ymd(3), ymd(2), ymd(1), ymd(0)]),
    );
    localStorage.setItem(
      "ul.khatma",
      JSON.stringify({ totalPages: 604, currentPage: 124, targetDate: ymd(-45) }),
    );
  });
}

if (argv.includes("--seed-prayer")) {
  await ctx.addInitScript(() => {
    const d = (off) => {
      const x = new Date();
      x.setDate(x.getDate() - off);
      const p = (n) => String(n).padStart(2, "0");
      return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
    };
    const all = { fajr: "ontime", dhuhr: "ontime", asr: "late", maghrib: "ontime", isha: "ontime" };
    localStorage.setItem(
      "ul.prayerLog",
      JSON.stringify({
        [d(0)]: { fajr: "ontime", dhuhr: "ontime", asr: "late" },
        [d(1)]: all,
        [d(2)]: all,
        [d(3)]: { fajr: "ontime", dhuhr: "late", asr: "ontime", maghrib: "ontime", isha: "late" },
        [d(4)]: { fajr: "ontime", dhuhr: "ontime", asr: "ontime", maghrib: "ontime", isha: "ontime" },
      }),
    );
  });
}

if (argv.includes("--seed-plan")) {
  await ctx.addInitScript(() => {
    const ymd = (off) => {
      const x = new Date();
      x.setDate(x.getDate() - off);
      const p = (n) => String(n).padStart(2, "0");
      return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
    };
    localStorage.setItem(
      "ul.readingPlan",
      JSON.stringify({ planId: "ramadan-khatm", startDate: ymd(12), completed: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }),
    );
  });
}

if (argv.includes("--seed-collections")) {
  await ctx.addInitScript(() => {
    localStorage.setItem(
      "ul.collections",
      JSON.stringify([
        { id: "c1", name: "Favourites", ayahs: [{ sura: 2, aya: 255 }, { sura: 112, aya: 1 }] },
        { id: "c2", name: "Duʿās", ayahs: [{ sura: 1, aya: 5 }] },
      ]),
    );
    localStorage.setItem("ul.ayahNotes", JSON.stringify({ "2:255": "Ayat al-Kursi" }));
  });
}

const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

const url = base.replace(/\/$/, "") + path;
await page.goto(url, { waitUntil: "load", timeout: 120_000 });
await page.waitForTimeout(waitMs);

for (const label of clicks) {
  try {
    await page.getByText(label, { exact: false }).first().click({ timeout: 8000 });
    await page.waitForTimeout(Math.min(waitMs, 2500));
  } catch (e) {
    console.log(`click "${label}" failed: ${e.message.split("\n")[0]}`);
  }
}

// Type into the (autofocused) text input, then wait for debounce/results.
const typeText = arg("--type", "");
if (typeText) {
  try {
    await page.locator("input").first().fill(typeText);
    await page.waitForTimeout(waitMs);
  } catch (e) {
    console.log(`type failed: ${e.message.split("\n")[0]}`);
  }
}

// Scroll the tallest scrollable element (RN-web lists scroll internally, so
// window/fullPage can't reach their rows).
const scrollY = Number(arg("--scroll", "0"));
if (scrollY) {
  await page.evaluate((y) => {
    const els = [...document.querySelectorAll("*")].filter((e) => {
      const s = getComputedStyle(e);
      return e.scrollHeight > e.clientHeight + 20 && /auto|scroll/.test(s.overflowY);
    });
    const target = els.sort((a, b) => b.scrollHeight - a.scrollHeight)[0] || document.scrollingElement;
    if (target) target.scrollTop = y;
  }, scrollY);
  await page.waitForTimeout(800);
}

await page.waitForTimeout(400);
await page.screenshot({ path: out, fullPage });
console.log("saved " + out);
if (errors.length) {
  console.log("--- console errors (" + errors.length + ") ---");
  console.log(errors.slice(0, 25).join("\n"));
}
await browser.close();
