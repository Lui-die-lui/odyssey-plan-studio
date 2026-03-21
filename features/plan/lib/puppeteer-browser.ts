import puppeteerCore from "puppeteer-core";
import type { Browser } from "puppeteer-core";

/**
 * Local: full `puppeteer` (devDependency) bundles Chromium.
 * Vercel / serverless: `@sparticuz/chromium` + `puppeteer-core` (fits size limits; no full Chrome install).
 */
export async function launchPdfBrowser(): Promise<Browser> {
  const onVercel = process.env.VERCEL === "1";

  if (onVercel) {
    const chromium = (await import("@sparticuz/chromium")).default;
    const executablePath = await chromium.executablePath();
    return puppeteerCore.launch({
      args: chromium.args,
      executablePath,
      headless: true,
      defaultViewport: { width: 1280, height: 800 },
    });
  }

  const puppeteer = await import("puppeteer");
  return puppeteer.default.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
}
