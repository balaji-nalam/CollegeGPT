const config = require('../config/env');

const textChunker = {
  chunkDocumentPages: (pages, options = {}) => {
    const chunkSize = options.chunkSize || config.CHUNK_SIZE || 700;
    const chunkOverlap = options.chunkOverlap || config.CHUNK_OVERLAP || 100;

    const chunks = [];
    let chunkIndex = 0;

    for (const page of pages) {
      const { pageNumber, text } = page;
      if (!text || text.trim().length === 0) continue;

      const pageChunks = chunkText(text, chunkSize, chunkOverlap);

      for (const chunkContent of pageChunks) {
        if (chunkContent.trim().length === 0) continue;

        chunks.push({
          chunkIndex,
          pageNumber,
          content: chunkContent.trim(),
        });
        chunkIndex++;
      }
    }

    return chunks;
  },
};

function chunkText(text, chunkSize, chunkOverlap) {
  const chunks = [];
  let startIndex = 0;
  const textLength = text.length;

  if (textLength <= chunkSize) {
    return [text];
  }

  while (startIndex < textLength) {
    let endIndex = Math.min(startIndex + chunkSize, textLength);

    // Try to break cleanly on paragraph (\n\n) or sentence (. ) or whitespace
    if (endIndex < textLength) {
      const slice = text.slice(startIndex, endIndex);
      const lastDoubleNewline = slice.lastIndexOf('\n\n');
      const lastPeriod = slice.lastIndexOf('. ');
      const lastNewline = slice.lastIndexOf('\n');
      const lastSpace = slice.lastIndexOf(' ');

      if (lastDoubleNewline > chunkSize * 0.6) {
        endIndex = startIndex + lastDoubleNewline + 2;
      } else if (lastPeriod > chunkSize * 0.6) {
        endIndex = startIndex + lastPeriod + 2;
      } else if (lastNewline > chunkSize * 0.6) {
        endIndex = startIndex + lastNewline + 1;
      } else if (lastSpace > chunkSize * 0.5) {
        endIndex = startIndex + lastSpace + 1;
      }
    }

    const chunk = text.slice(startIndex, endIndex).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    if (endIndex >= textLength) {
      break;
    }

    // Advance sliding window with overlap
    startIndex = Math.max(startIndex + 1, endIndex - chunkOverlap);
  }

  return chunks;
}

module.exports = textChunker;
