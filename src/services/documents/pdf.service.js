export const MAX_PDF_TEXT_CHARACTERS = 60000;

export async function extractPdfText(buffer) {
    // pdf-parse is loaded only for an actual PDF upload. This keeps an
    // optional heavy parser from preventing health checks, text chat, or
    // image chat from starting in a serverless function.
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });

    try {
        const result = await parser.getText();
        const text = result.text.replace(/\s+\n/g, "\n").trim();

        if (!text) {
            throw new Error("This PDF has no extractable text. Please upload a text-based PDF.");
        }

        if (text.length > MAX_PDF_TEXT_CHARACTERS) {
            return `${text.slice(0, MAX_PDF_TEXT_CHARACTERS)}\n\n[Document truncated for analysis.]`;
        }

        return text;
    } finally {
        await parser.destroy();
    }
}
