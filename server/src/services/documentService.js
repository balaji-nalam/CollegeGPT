const storageService = require('../config/storage');
const documentProcessor = require('./documentProcessor');
const vectorRepository = require('./vectorRepository');
const { query, isPostgresConnected, inMemoryStore } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

const documentService = {
  createDocument: async ({
    title,
    description = '',
    category = 'General',
    department = 'General',
    academicYear = '2025-2026',
    documentType = 'Handbook',
    fileBuffer,
    originalFilename,
    mimeType,
    userId,
  }) => {
    // 1. Upload raw physical file via Storage abstraction (Supabase in prod, Local in dev)
    const uploadResult = await storageService.uploadFile(fileBuffer, originalFilename, mimeType);

    // 2. Persist Document Record
    let documentId;
    let versionId;

    if (isPostgresConnected()) {
      const docRes = await query(
        `INSERT INTO documents (
          title, description, filename, file_path, storage_provider, 
          file_type, file_size, category, department, academic_year, document_type, 
          status, uploaded_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'UPLOADED', $12)
        RETURNING *`,
        [
          title.trim(),
          description.trim(),
          originalFilename,
          uploadResult.filePath,
          uploadResult.provider,
          mimeType.includes('pdf') ? 'pdf' : 'text',
          fileBuffer.length,
          category,
          department,
          academicYear,
          documentType,
          userId,
        ]
      );
      documentId = docRes.rows[0].id;

      // 3. Create Version 1 Record
      const verRes = await query(
        `INSERT INTO document_versions (document_id, version_number, file_path, file_size, status, uploaded_by)
         VALUES ($1, 1, $2, $3, 'UPLOADED', $4)
         RETURNING *`,
        [documentId, uploadResult.filePath, fileBuffer.length, userId]
      );
      versionId = verRes.rows[0].id;
    } else {
      // In-Memory Fallback
      documentId = uuidv4();
      versionId = uuidv4();

      const docRecord = {
        id: documentId,
        title: title.trim(),
        description: description.trim(),
        filename: originalFilename,
        file_path: uploadResult.filePath,
        storage_provider: uploadResult.provider,
        file_type: mimeType.includes('pdf') ? 'pdf' : 'text',
        file_size: fileBuffer.length,
        total_pages: 1,
        total_chunks: 0,
        category,
        department,
        academic_year: academicYear,
        document_type: documentType,
        status: 'UPLOADED',
        error_message: null,
        uploaded_by: userId,
        created_at: new Date(),
        updated_at: new Date(),
      };
      inMemoryStore.documents.set(documentId, docRecord);

      const verRecord = {
        id: versionId,
        document_id: documentId,
        version_number: 1,
        file_path: uploadResult.filePath,
        file_size: fileBuffer.length,
        status: 'UPLOADED',
        uploaded_by: userId,
        created_at: new Date(),
      };
      inMemoryStore.document_versions.set(versionId, verRecord);
    }

    // 4. Trigger Ingestion Pipeline (asynchronously in background)
    setImmediate(async () => {
      try {
        await documentProcessor.processDocument(documentId, versionId);
      } catch (err) {
        logger.error(`Background ingestion failed for #${documentId}:`, err);
      }
    });

    return documentService.getDocumentById(documentId);
  },

  listDocuments: async ({ search, category, department, status, page = 1, limit = 20 }) => {
    if (isPostgresConnected()) {
      let sql = `SELECT * FROM documents WHERE 1=1`;
      const params = [];
      let paramIndex = 1;

      if (status) {
        sql += ` AND status = $${paramIndex++}`;
        params.push(status);
      }
      if (category) {
        sql += ` AND category = $${paramIndex++}`;
        params.push(category);
      }
      if (department) {
        sql += ` AND department = $${paramIndex++}`;
        params.push(department);
      }
      if (search) {
        sql += ` AND (title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      sql += ` ORDER BY created_at DESC LIMIT ${parseInt(limit, 10)} OFFSET ${(page - 1) * limit}`;

      const res = await query(sql, params);
      return {
        documents: res.rows,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      };
    }

    // In-Memory Listing
    let docs = Array.from(inMemoryStore.documents.values());
    if (status) docs = docs.filter((d) => d.status === status);
    if (category) docs = docs.filter((d) => d.category === category);
    if (department) docs = docs.filter((d) => d.department === department);
    if (search) {
      const q = search.toLowerCase();
      docs = docs.filter((d) => d.title.toLowerCase().includes(q) || d.description.toLowerCase().includes(q));
    }

    docs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const start = (page - 1) * limit;
    const paginated = docs.slice(start, start + limit);

    return {
      documents: paginated,
      total: docs.length,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    };
  },

  getDocumentById: async (documentId) => {
    if (isPostgresConnected()) {
      const res = await query('SELECT * FROM documents WHERE id = $1', [documentId]);
      return res.rows[0] || null;
    }
    return inMemoryStore.documents.get(documentId) || null;
  },

  updateDocumentMetadata: async (documentId, updates) => {
    const doc = await documentService.getDocumentById(documentId);
    if (!doc) {
      const error = new Error('Document not found');
      error.statusCode = 404;
      throw error;
    }

    if (isPostgresConnected()) {
      const res = await query(
        `UPDATE documents 
         SET title = COALESCE($1, title),
             description = COALESCE($2, description),
             category = COALESCE($3, category),
             department = COALESCE($4, department),
             academic_year = COALESCE($5, academic_year),
             status = COALESCE($6, status),
             updated_at = NOW()
         WHERE id = $7
         RETURNING *`,
        [
          updates.title,
          updates.description,
          updates.category,
          updates.department,
          updates.academicYear,
          updates.status,
          documentId,
        ]
      );
      return res.rows[0];
    }

    // In-Memory
    if (updates.title) doc.title = updates.title;
    if (updates.description) doc.description = updates.description;
    if (updates.category) doc.category = updates.category;
    if (updates.department) doc.department = updates.department;
    if (updates.academicYear) doc.academic_year = updates.academicYear;
    if (updates.status) doc.status = updates.status;
    doc.updated_at = new Date();

    return doc;
  },

  reprocessDocument: async (documentId) => {
    const doc = await documentService.getDocumentById(documentId);
    if (!doc) {
      const error = new Error('Document not found');
      error.statusCode = 404;
      throw error;
    }

    logger.info(`Admin initiated manual reprocessing for Document #${documentId}`);

    // Fetch latest version ID or generate one
    let versionId = uuidv4();
    if (isPostgresConnected()) {
      const verRes = await query(
        'SELECT id FROM document_versions WHERE document_id = $1 ORDER BY version_number DESC LIMIT 1',
        [documentId]
      );
      if (verRes.rows.length > 0) {
        versionId = verRes.rows[0].id;
      }
    }

    // Run processing
    return documentProcessor.processDocument(documentId, versionId);
  },

  deleteDocument: async (documentId) => {
    const doc = await documentService.getDocumentById(documentId);
    if (!doc) {
      const error = new Error('Document not found');
      error.statusCode = 404;
      throw error;
    }

    // 1. Delete physical file from storage
    try {
      await storageService.deleteFile(doc.file_path, doc.storage_provider);
    } catch (e) {
      logger.warn('Failed to delete physical file from storage:', { error: e.message });
    }

    // 2. Delete vector chunks
    await vectorRepository.deleteChunksByDocumentId(documentId);

    // 3. Delete Document record
    if (isPostgresConnected()) {
      await query('DELETE FROM documents WHERE id = $1', [documentId]);
    } else {
      inMemoryStore.documents.delete(documentId);
      for (const [vId, ver] of inMemoryStore.document_versions.entries()) {
        if (ver.document_id === documentId) inMemoryStore.document_versions.delete(vId);
      }
    }

    return { id: documentId, message: 'Document and all vector chunks deleted successfully.' };
  },
};

module.exports = documentService;
