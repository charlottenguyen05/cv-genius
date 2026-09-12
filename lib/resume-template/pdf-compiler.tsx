import { renderToBuffer } from '@react-pdf/renderer';
import { JakeResumeDocument, computeScale } from './jake-resume';
import { CVFormData } from '@/types';
import './fonts'; // Register fonts

// ---------------------------------------------------------------------------
// One-page guard:
//   1. Compute initial scale from content density.
//   2. Render the PDF.
//   3. Count pages by parsing the raw PDF byte stream.
//   4. If pages > 1 and scale > SCALE_MIN, reduce scale by SCALE_STEP and retry.
//   5. Give up (best-effort) when scale hits SCALE_MIN or PDF is already 1 page.
// ---------------------------------------------------------------------------
const SCALE_MIN = 1.0;  // 10pt readability floor — never shrink below base scale
const SCALE_STEP = 0.05; // reduction increment per retry

/**
 * Counts the number of pages in a PDF buffer by parsing the /Count entry
 * in the PDF page tree. This avoids adding a heavy PDF library dependency.
 */
function countPdfPages(buffer: Buffer): number {
    const text = buffer.toString('latin1');
    // PDF stores the total page count as e.g. /Count 3
    const matches = [...text.matchAll(/\/Count\s+(\d+)/g)];
    if (matches.length === 0) return 1; // assume 1 if not found
    // The largest /Count value is the root page tree node's count
    return Math.max(...matches.map(m => parseInt(m[1], 10)));
}

export async function generatePDFBuffer(cvData: CVFormData): Promise<Buffer> {
    let scale = computeScale(cvData);

    // Render loop — retry with smaller scale if page count > 1
    while (true) {
        const buffer = Buffer.from(
            await renderToBuffer(
                <JakeResumeDocument cvData={cvData} scale={scale} />
            )
        );

        const pages = countPdfPages(buffer);

        if (pages <= 1) {
            // Perfect — single page achieved
            return buffer;
        }

        const nextScale = Math.round((scale - SCALE_STEP) * 1000) / 1000;
        if (nextScale < SCALE_MIN) {
            // Best-effort: cannot shrink further without violating the 8pt floor.
            // Return the buffer as-is (may be 2 pages for extreme content).
            console.warn(
                `[pdf-compiler] Could not fit content on 1 page at scale=${scale}. ` +
                `Content is too dense to fit in 1 page while respecting 10pt minimum font size. Returning best-effort PDF (${pages} pages).`
            );
            return buffer;
        }

        console.log(
            `[pdf-compiler] PDF has ${pages} pages at scale=${scale}. ` +
            `Retrying at scale=${nextScale}...`
        );
        scale = nextScale;
    }
}
