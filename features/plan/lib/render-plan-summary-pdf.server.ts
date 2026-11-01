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

/** Below this scale text gets hard to read, so the rating panels move to the next page instead. */
const MIN_PDF_SCALE = 0.75;

/**
 * Printable area inside 12mm margins on A4 landscape.
 * Used to derive a `scale` that fits the summary on its page; details flow after it.
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

    const content = await page.evaluate(() => {
      const root = document.querySelector("[data-pdf-root]");
      if (!root || !(root instanceof HTMLElement)) {
        return { width: 1, summaryHeight: 1, yearGridHeight: 1 };
      }
      const top = root.getBoundingClientRect().top;
      const paddingBottom = parseFloat(getComputedStyle(root).paddingBottom) || 0;
      const heightTo = (selector: string) => {
        const bottom = document.querySelector(selector)?.getBoundingClientRect().bottom;
        return bottom === undefined ? 1 : bottom - top + paddingBottom;
      };
      return {
        width: Math.max(root.scrollWidth, root.offsetWidth, 1),
        summaryHeight: heightTo("[data-pdf-summary]"),
        yearGridHeight: heightTo("[data-pdf-year-grid]"),
      };
    });

    /** Slightly under 1 avoids float edge cases that spawn a second blank/extra page. */
    const fitScale = (height: number) =>
      Math.min(inner.w / content.width, inner.h / height, 1) * 0.99;
    const summaryScale = fitScale(content.summaryHeight);
    const pdfScale =
      summaryScale >= MIN_PDF_SCALE
        ? summaryScale
        : Math.max(MIN_PDF_SCALE, fitScale(content.yearGridHeight));

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
