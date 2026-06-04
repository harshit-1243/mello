// Reproduce a real Lenis-driven scroll (mouse wheel) and report whether the
// Statement headline words have actually revealed.
import puppeteer from "puppeteer-core";

const CHROME =
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--hide-scrollbars", "--no-sandbox"],
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 2800));

  // Wheel down like a user until the Statement is in view.
  for (let i = 0; i < 16; i++) {
    await page.mouse.wheel({ deltaY: 320 });
    await new Promise((r) => setTimeout(r, 200));
  }
  await new Promise((r) => setTimeout(r, 1800));

  const info = await page.evaluate(() => {
    const all = [...document.querySelectorAll("[data-word-inner]")];
    const st = all.filter((w) =>
      /Every|call|answered|booking|captured/i.test(w.textContent || ""),
    );
    const sample = st.slice(0, 6).map((w) => {
      const r = w.getBoundingClientRect();
      return {
        text: w.textContent,
        top: Math.round(r.top),
        transform: getComputedStyle(w).transform,
      };
    });
    return { scrollY: Math.round(window.scrollY), wordCount: st.length, sample };
  });
  console.log(JSON.stringify(info, null, 2));
  await page.screenshot({ path: "scripts/shots/diag-statement.png", type: "png" });
} finally {
  await browser.close();
}
