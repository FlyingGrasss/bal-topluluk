import { chromium } from "playwright";

const base = process.env.BASE_URL || "http://localhost:3100";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const out = { steps: [], errors: [] };
page.on("pageerror", (e) => out.errors.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") out.errors.push(m.text()); });

const step = async (name, fn) => {
  try { await fn(); out.steps.push({ name, ok: true }); }
  catch (e) { out.steps.push({ name, ok: false, error: String(e).slice(0, 260) }); throw e; }
};

const title = `E2E duyuru ${Date.now()}`;

try {
  await step("landing", async () => {
    await page.goto(base, { waitUntil: "networkidle" });
    await page.getByText(/BAL Topluluk/).first().waitFor({ timeout: 15000 });
  });

  await step("board list", async () => {
    await page.goto(`${base}/pano`, { waitUntil: "networkidle" });
    await page.getByText(/Duyuru|pano|Pano/i).first().waitFor({ timeout: 15000 });
  });

  await step("create post", async () => {
    await page.locator("#post-author").fill("E2E Test");
    await page.locator("#post-title").fill(title);
    await page.locator("#post-body").fill("Bu bir e2e test gönderisidir, otomatik doğrulama.");
    await page.getByRole("button", { name: /Panoya gönder/ }).click();
    await page.waitForTimeout(2500);
    await page.getByText(title).first().waitFor({ timeout: 15000 });
  });

  await step("admin unlock and pin", async () => {
    await page.goto(`${base}/admin`, { waitUntil: "networkidle" });
    const token = page.getByLabel(/token|anahtar/i).first();
    if (!(await token.count())) throw new Error("token field missing");
    await token.fill(process.env.ADMIN_TOKEN || "e2e-admin");
    await page.getByRole("button", { name: /Giriş|Kilidi aç|Unlock/i }).first().click();
    await page.waitForTimeout(2000);
    const body = await page.locator("body").innerText();
    out.adminUnlocked = /sabitle|pin|sil|çıkış/i.test(body);
    if (!out.adminUnlocked) throw new Error("admin panel did not unlock");
  });
} catch {}

console.log(JSON.stringify(out, null, 2));
await browser.close();
