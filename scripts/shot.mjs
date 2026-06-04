// Dev-only headless screenshot helper (Puppeteer + installed Chrome).
// Usage (env vars):
//   URL=http://localhost:3000/?motion=off W=1440 H=900 FULL=1 OUT=scripts/shots/home.png node scripts/shot.mjs
import puppeteer from "puppeteer-core";
import { mkdirSync } from "fs";
import { dirname } from "path";

const CHROME =
  process.env.CHROME || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const url = process.env.URL || "http://localhost:3000/";
const W = parseInt(process.env.W || "1440", 10);
const H = parseInt(process.env.H || "900", 10);
const OUT = process.env.OUT || "scripts/shots/shot.png";
const SCROLL = parseInt(process.env.SCROLL || "0", 10);
const FULL = process.env.FULL === "1";
const WAIT = parseInt(process.env.WAIT || "1500", 10);
// REDUCED=1 -> emulate prefers-reduced-motion so EVERY layer (the inline .anim
// guard, Reveal, Lenis, the Hero matchMedia) agrees and renders the static,
// fully-composed final frame. Best for layout/type/colour polish.
const REDUCED = process.env.REDUCED !== "0";

mkdirSync(dirname(OUT), { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--hide-scrollbars", "--no-sandbox", "--disable-dev-shm-usage"],
});
try {
  const page = await browser.newPage();
  const problems = [];
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning")
      problems.push(`[${m.type()}] ${m.text()}`);
  });
  page.on("pageerror", (e) => problems.push(`[pageerror] ${e.message}`));
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  if (REDUCED) {
    await page.emulateMediaFeatures([
      { name: "prefers-reduced-motion", value: "reduce" },
    ]);
  }
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  try {
    await page.waitForNetworkIdle({ idleTime: 500, timeout: 8000 });
  } catch {
    /* dev keeps a socket open — fine, fall through to the fixed wait */
  }
  await new Promise((r) => setTimeout(r, WAIT));
  if (SCROLL > 0) {
    await page.evaluate((y) => window.scrollTo(0, y), SCROLL);
    await new Promise((r) => setTimeout(r, 900));
  }
  await page.screenshot({ path: OUT, fullPage: FULL, type: "png" });
  console.log(`SAVED ${OUT} ${W}x${H} scroll=${SCROLL} full=${FULL}`);
  if (problems.length) {
    console.log(`\n--- ${problems.length} console problem(s) ---`);
    console.log([...new Set(problems)].slice(0, 20).join("\n"));
  } else {
    console.log("--- no console errors/warnings ---");
  }
} finally {
  await browser.close();
}
