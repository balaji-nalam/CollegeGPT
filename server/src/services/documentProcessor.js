const pdfExtractor = require('../utils/pdfExtractor');
const textChunker = require('../utils/textChunker');
const embeddingService = require('./embeddingService');
const vectorRepository = require('./vectorRepository');
const storageService = require('../config/storage');
const { query, isPostgresConnected, inMemoryStore } = require('../config/db');
const logger = require('../utils/logger');

class DocumentProcessor {
  async processDocument(documentId, versionId) {
    logger.info(`Starting ingestion pipeline for Document #${documentId} (Version: ${versionId})`);

    // 1. Fetch Document Record
    let doc = await this.getDocumentRecord(documentId);
    if (!doc) {
      throw new Error(`Document #${documentId} not found.`);
    }

    // Set status to PROCESSING
    await this.updateDocumentStatus(documentId, 'PROCESSING', null);

    try {
      // 2. Fetch File Buffer
      const fileBuffer = await storageService.getFileStream(doc.file_path, doc.storage_provider);

      // 3. Text & Page Extraction
      const pages = await pdfExtractor.extractPagesFromBuffer(fileBuffer, doc.file_type);
      if (!pages || pages.length === 0) {
        throw new Error('No extractable text found in document.');
      }

      // 4. Chunking (700 chars / 100 overlap)
      const rawChunks = textChunker.chunkDocumentPages(pages);
      if (!rawChunks || rawChunks.length === 0) {
        throw new Error('Document produced 0 valid chunks after parsing.');
      }

      logger.info(`Generated ${rawChunks.length} text chunks for Document #${documentId}`);

      // 5. Generate Vector Embeddings (Batch)
      const chunkTexts = rawChunks.map((c) => c.content);
      const embeddings = await embeddingService.generateBatchEmbeddings(chunkTexts);

      if (!embeddings || embeddings.length !== rawChunks.length) {
        throw new Error(`Embedding count mismatch: expected ${rawChunks.length}, received ${embeddings?.length}`);
      }

      // 6. Clean up any previous chunks for idempotency
      await vectorRepository.deleteChunksByDocumentId(documentId);

      // 7. Store Chunks & Vectors in PostgreSQL + pgvector
      const preparedChunks = rawChunks.map((c, idx) => ({
        documentId,
        versionId,
        chunkIndex: c.chunkIndex,
        pageNumber: c.pageNumber,
        content: c.content,
        embedding: embeddings[idx],
        metadata: {
          title: doc.title,
          category: doc.category,
          department: doc.department,
          academic_year: doc.academic_year,
          page: c.pageNumber,
        },
      }));

      await vectorRepository.insertChunks(preparedChunks);

      // 8. Update Document Status to INDEXED
      await this.updateDocumentStats(documentId, {
        totalPages: pages.length,
        totalChunks: rawChunks.length,
        status: 'INDEXED',
        errorMessage: null,
      });

      logger.info(`Document #${documentId} successfully INDEXED with ${rawChunks.length} vector chunks`);

      return {
        success: true,
        documentId,
        totalPages: pages.length,
        totalChunks: rawChunks.length,
        status: 'INDEXED',
      };
    } catch (error) {
      logger.error(`Ingestion failed for Document #${documentId}:`, error);

      // Clean up partial chunks on failure
      try {
        await vectorRepository.deleteChunksByDocumentId(documentId);
      } catch (cleanupErr) {
        logger.error('Failed to clean up partial chunks:', cleanupErr);
      }

      // Mark Document as FAILED with safe error message
      const safeErrorMessage = error.message.replace(/[\r\n]/g, ' ').slice(0, 300);
      await this.updateDocumentStatus(documentId, 'FAILED', safeErrorMessage);

      return {
        success: false,
        documentId,
        status: 'FAILED',
        error: safeErrorMessage,
      };
    }
  }

  async getDocumentRecord(documentId) {
    if (isPostgresConnected()) {
      const res = await query('SELECT * FROM documents WHERE id = $1', [documentId]);
      return res.rows[0] || null;
    }
    return inMemoryStore.documents.get(documentId) || null;
  }

  async updateDocumentStatus(documentId, status, errorMessage = null) {
    if (isPostgresConnected()) {
      await query(
        'UPDATE documents SET status = $1, error_message = $2, updated_at = NOW() WHERE id = $3',
        [status, errorMessage, documentId]
      );
      return;
    }

    const doc = inMemoryStore.documents.get(documentId);
    if (doc) {
      doc.status = status;
      doc.error_message = errorMessage;
      doc.updated_at = new Date();
    }
  }

  async updateDocumentStats(documentId, { totalPages, totalChunks, status, errorMessage }) {
    if (isPostgresConnected()) {
      await query(
        `UPDATE documents 
         SET total_pages = $1, total_chunks = $2, status = $3, error_message = $4, updated_at = NOW() 
         WHERE id = $5`,
        [totalPages, totalChunks, status, errorMessage, documentId]
      );
      return;
    }

    const doc = inMemoryStore.documents.get(documentId);
    if (doc) {
      doc.total_pages = totalPages;
      doc.total_chunks = totalChunks;
      doc.status = status;
      doc.error_message = errorMessage;
      doc.updated_at = new Date();
    }
  }
}

module.exports = new DocumentProcessor();
