const { query, isPostgresConnected, inMemoryStore } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/env');
const logger = require('../utils/logger');

const vectorRepository = {
  // Insert chunks into PostgreSQL + pgvector
  insertChunks: async (chunks) => {
    if (!chunks || chunks.length === 0) return [];

    if (isPostgresConnected()) {
      const inserted = [];
      for (const chunk of chunks) {
        const { documentId, versionId, chunkIndex, pageNumber, content, embedding, metadata } = chunk;
        const vectorStr = `[${embedding.join(',')}]`;

        const res = await query(
          `INSERT INTO document_chunks (document_id, version_id, chunk_text, chunk_index, page_number, embedding, metadata)
           VALUES ($1, $2, $3, $4, $5, $6::vector, $7)
           RETURNING id, document_id, version_id, chunk_index, page_number, created_at`,
          [documentId, versionId, content, chunkIndex, pageNumber, vectorStr, JSON.stringify(metadata || {})]
        );
        inserted.push(res.rows[0]);
      }
      return inserted;
    }

    // In-Memory Vector Store Fallback
    const inserted = [];
    for (const chunk of chunks) {
      const id = uuidv4();
      const record = {
        id,
        document_id: chunk.documentId,
        version_id: chunk.versionId,
        chunk_text: chunk.content,
        chunk_index: chunk.chunkIndex,
        page_number: chunk.pageNumber,
        embedding: chunk.embedding,
        metadata: chunk.metadata || {},
        created_at: new Date(),
      };
      inMemoryStore.document_chunks.set(id, record);
      inserted.push(record);
    }
    return inserted;
  },

  // Delete all chunks for a document
  deleteChunksByDocumentId: async (documentId) => {
    if (isPostgresConnected()) {
      await query('DELETE FROM document_chunks WHERE document_id = $1', [documentId]);
      return;
    }

    for (const [id, chunk] of inMemoryStore.document_chunks.entries()) {
      if (chunk.document_id === documentId) {
        inMemoryStore.document_chunks.delete(id);
      }
    }
  },

  // Semantic Similarity Search across INDEXED document chunks
  searchSimilarChunks: async (queryEmbedding, options = {}) => {
    const topK = options.topK || config.TOP_K || 5;
    const threshold = options.similarityThreshold !== undefined ? options.similarityThreshold : (config.SIMILARITY_THRESHOLD || 0.15);
    const category = options.category || null;
    const department = options.department || null;

    if (isPostgresConnected()) {
      const vectorStr = `[${queryEmbedding.join(',')}]`;
      let sql = `
        SELECT 
          dc.id AS chunk_id,
          dc.document_id,
          dc.version_id,
          dc.chunk_text,
          dc.page_number,
          dc.metadata,
          d.title AS document_title,
          d.category AS document_category,
          d.department AS document_department,
          1 - (dc.embedding <=> $1::vector) AS similarity_score
        FROM document_chunks dc
        JOIN documents d ON d.id = dc.document_id
        WHERE d.status = 'INDEXED'
      `;

      const params = [vectorStr];
      let paramIdx = 2;

      if (category) {
        sql += ` AND d.category = $${paramIdx++}`;
        params.push(category);
      }
      if (department) {
        sql += ` AND d.department = $${paramIdx++}`;
        params.push(department);
      }

      sql += ` AND (1 - (dc.embedding <=> $1::vector)) >= $${paramIdx++}`;
      params.push(threshold);

      sql += ` ORDER BY similarity_score DESC LIMIT ${parseInt(topK, 10)}`;

      const res = await query(sql, params);
      return res.rows;
    }

    // In-Memory Cosine Similarity Calculation
    const results = [];
    for (const chunk of inMemoryStore.document_chunks.values()) {
      const doc = inMemoryStore.documents.get(chunk.document_id);
      // Strictly only INDEXED documents participate in retrieval
      if (!doc || doc.status !== 'INDEXED') continue;
      if (category && doc.category !== category) continue;
      if (department && doc.department !== department) continue;

      const similarity = computeCosineSimilarity(queryEmbedding, chunk.embedding);
      if (similarity >= threshold) {
        results.push({
          chunk_id: chunk.id,
          document_id: chunk.document_id,
          version_id: chunk.version_id,
          chunk_text: chunk.chunk_text,
          page_number: chunk.page_number,
          metadata: chunk.metadata,
          document_title: doc.title,
          document_category: doc.category,
          document_department: doc.department,
          similarity_score: similarity,
        });
      }
    }

    results.sort((a, b) => b.similarity_score - a.similarity_score);
    return results.slice(0, topK);
  },

  // Alias for backward compatibility
  similaritySearch: async (queryVector, topK = 4, category = null) => {
    return vectorRepository.searchSimilarChunks(queryVector, { topK, category, similarityThreshold: -1.0 });
  },
};

function computeCosineSimilarity(vecA, vecB) {
  let dot = 0.0;
  let normA = 0.0;
  let normB = 0.0;

  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0.0;
  return parseFloat((dot / denominator).toFixed(6));
}

module.exports = vectorRepository;
