import { launchPdfBrowser } from "./puppeteer-browser";

const MARGIN_MM_STR = "12mm";
const MARGIN_MM_NUM = 12;
/** A4 landscape (mm): long × short */
const A4_L_MM = 297;
const A4_S_MM = 210;

/** CSS px per mm at 96dpi (Chromium print coordinate system). */
function mmToCssPx(mm: number): number {
  return (mm * 96) / 25.4;
}

/**
 * Printable area inside 12mm margins on A4 landscape.
 * Used to derive a single-page `scale` so the summary fits on one sheet.
 */
function printableInnerCssPx(): { w: number; h: number } {
  const innerWmm = A4_L_MM - 2 * MARGIN_MM_NUM;
  const innerHmm = A4_S_MM - 2 * MARGIN_MM_NUM;
  return { w: mmToCssPx(innerWmm), h: mmToCssPx(innerHmm) };
}

export async function renderPlanSummaryPdfFromUrl(
  absolutePrintUrl: string,
  cookieHeader: string | null,
): Promise<Buffer> {
  const browser = await launchPdfBrowser();
  try {
    const page = await browser.newPage();
    if (cookieHeader?.length) {
      await page.setExtraHTTPHeaders({ Cookie: cookieHeader });
    }

    await page.goto(absolutePrintUrl, {
      waitUntil: "networkidle0",
      timeout: 90_000,
    });

    await page.waitForSelector("html[data-pdf-ready]", { timeout: 45_000 });

    const inner = printableInnerCssPx();

    const contentSize = await page.evaluate(() => {
      const root = document.querySelector("[data-pdf-root]");
      if (!root || !(root instanceof HTMLElement)) {
        return { w: 1, h: 1 };
      }
      return {
        w: Math.max(root.scrollWidth, root.offsetWidth, 1),
        h: Math.max(root.scrollHeight, root.offsetHeight, 1),
      };
    });

    const scaleW = inner.w / Math.max(contentSize.w, 1);
    const scaleH = inner.h / Math.max(contentSize.h, 1);
    /** Slightly under 1 avoids float edge cases that spawn a second blank/extra page. */
    const pdfScale = Math.max(0.08, Math.min(scaleW, scaleH, 1) * 0.99);

    const pdf = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      scale: pdfScale,
      margin: {
        top: MARGIN_MM_STR,
        right: MARGIN_MM_STR,
        bottom: MARGIN_MM_STR,
        left: MARGIN_MM_STR,
      },
      preferCSSPageSize: false,
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
