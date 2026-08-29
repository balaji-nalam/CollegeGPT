const config = require('../config/env');

class ContextBuilder {
  buildContext(chunks) {
    if (!chunks || chunks.length === 0) {
      return {
        contextText: '',
        sources: [],
        chunkCount: 0,
      };
    }

    const maxChars = config.MAX_CONTEXT_CHARS || 4000;
    const sources = [];
    const contextBlocks = [];
    let currentLength = 0;

    // Deduplicate sources and order by highest similarity
    const sortedChunks = [...chunks].sort((a, b) => b.similarity_score - a.similarity_score);

    for (let i = 0; i < sortedChunks.length; i++) {
      const chunk = sortedChunks[i];
      if (!chunk.chunk_text || chunk.chunk_text.trim().length === 0) continue;

      const docTitle = chunk.document_title || 'Official College Document';
      const page = chunk.page_number || 1;
      const score = parseFloat((chunk.similarity_score || 0).toFixed(4));
      const content = chunk.chunk_text.trim();

      const block = `[DOCUMENT: "${docTitle}" | PAGE: ${page} | RELEVANCE: ${score}]\n"${content}"\n`;

      if (currentLength + block.length > maxChars && contextBlocks.length > 0) {
        break;
      }

      contextBlocks.push(block);
      currentLength += block.length;

      // Track unique document / page citation sources
      sources.push({
        documentId: chunk.document_id,
        chunkId: chunk.chunk_id,
        title: docTitle,
        page: page,
        similarity: score,
        snippet: content.slice(0, 180),
      });
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
