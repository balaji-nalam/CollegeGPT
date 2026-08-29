const pdfParse = require('pdf-parse');
const logger = require('./logger');

const pdfExtractor = {
  extractPagesFromBuffer: async (buffer, mimeType = 'application/pdf') => {
    if (!buffer || buffer.length === 0) {
      throw new Error('Document buffer is empty.');
    }

    // Handle Plain Text (.txt) files
    if (mimeType === 'text/plain' || mimeType.includes('text')) {
      const text = buffer.toString('utf8').trim();
      if (!text) {
        throw new Error('Text document contains no extractable content.');
      }
      return [
        {
          pageNumber: 1,
          text: normalizeWhitespace(text),
        },
      ];
    }

    // PDF Extraction with page number tracking
    const pages = [];
    let currentPage = 1;

    // Custom pagerender to capture text per page index
    function renderPage(pageData) {
      return pageData.getTextContent().then((textContent) => {
        let lastY, text = '';
        for (const item of textContent.items) {
          if (lastY == item.transform[5] || !lastY) {
            text += item.str;
          } else {
            text += '\n' + item.str;
          }
          lastY = item.transform[5];
        }

        const cleaned = normalizeWhitespace(text);
        if (cleaned.length > 0) {
          pages.push({
            pageNumber: currentPage,
            text: cleaned,
          });
        }
        currentPage++;
        return text;
      });
    }

    try {
      const parsed = await pdfParse(buffer, { pagerender: renderPage });

      // Fallback if pagerender produced empty pages but full text exists
      if (pages.length === 0 && parsed.text && parsed.text.trim().length > 0) {
        const cleaned = normalizeWhitespace(parsed.text);
        pages.push({
          pageNumber: 1,
          text: cleaned,
        });
      }

      if (pages.length === 0) {
        throw new Error('PDF contains no extractable text (it may be a scanned image or empty document).');
      }

      logger.info(`Extracted ${pages.length} non-empty page(s) from PDF (Total pages: ${parsed.numpages || pages.length})`);
      return pages;
    } catch (err) {
      logger.error('PDF text extraction failed:', err);
      throw new Error(`Failed to extract text from PDF: ${err.message}`);
    }
  },
};

function normalizeWhitespace(text) {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ') // collapse horizontal spaces
    .replace(/\n\s*\n\s*\n+/g, '\n\n') // collapse multiple blank lines
    .trim();
}

module.exports = pdfExtractor;
