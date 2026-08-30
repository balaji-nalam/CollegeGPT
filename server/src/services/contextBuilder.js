const config = require('../config/env');

class ContextBuilder {
  buildContext(chunks, options = {}) {
    if (!chunks || chunks.length === 0) {
      return {
        contextText: '',
        sources: [],
        chunkCount: 0,
      };
    }

    const maxChars = options.maxChars || 16000;
    const sources = [];
    const seenSources = new Set();
    const contextBlocks = [];
    let currentLength = 0;

    // Order chunks sequentially by Document Title, Page Number, and Chunk Index for coherent narrative context
    const orderedChunks = [...chunks].sort((a, b) => {
      const docA = a.document_title || '';
      const docB = b.document_title || '';
      if (docA !== docB) return docA.localeCompare(docB);
      const pageA = a.page_number || 1;
      const pageB = b.page_number || 1;
      if (pageA !== pageB) return pageA - pageB;
      const idxA = a.chunk_index !== undefined ? a.chunk_index : 0;
      const idxB = b.chunk_index !== undefined ? b.chunk_index : 0;
      return idxA - idxB;
    });

    for (let i = 0; i < orderedChunks.length; i++) {
      const chunk = orderedChunks[i];
      if (!chunk.chunk_text || chunk.chunk_text.trim().length === 0) continue;

      const docTitle = chunk.document_title || 'Official College Document';
      const page = chunk.page_number || 1;
      const rawScore = Number(chunk.final_score ?? chunk.similarity_score ?? 0);
      const score = Number.isFinite(rawScore) ? parseFloat(rawScore.toFixed(4)) : 0;
      const content = chunk.chunk_text.trim();

      const block = `[DOCUMENT: "${docTitle}" | PAGE: ${page} | RELEVANCE: ${score}]\n"${content}"\n`;

      if (currentLength + block.length > maxChars && contextBlocks.length > 0) {
        break;
      }

      contextBlocks.push(block);
      currentLength += block.length;

      // Track unique document / page citation sources
      const sourceKey = `${chunk.document_id || docTitle}:${page}`;
      if (!seenSources.has(sourceKey)) {
        seenSources.add(sourceKey);
        const simVal = Number(chunk.similarity_score ?? score);
        sources.push({
          documentId: chunk.document_id,
          chunkId: chunk.chunk_id,
          title: docTitle,
          page: page,
          similarity: Number.isFinite(simVal) ? parseFloat(simVal.toFixed(4)) : 0,
          snippet: content.slice(0, 180),
        });
      }
    }

    const contextText = contextBlocks.join('\n');

    return {
      contextText,
      sources,
      chunkCount: contextBlocks.length,
    };
  }
}

module.exports = new ContextBuilder();
