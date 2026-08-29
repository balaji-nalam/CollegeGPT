const documentService = require('../services/documentService');

const documentController = {
  uploadDocument: async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'No document file provided. Please upload a PDF or text file.',
          },
          message: 'No document file provided. Please upload a PDF or text file.',
        });
      }

      const { title, description, category, department, academic_year, document_type } = req.body;

      if (!title || title.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Document title is required.',
          },
          message: 'Document title is required.',
        });
      }

      const doc = await documentService.createDocument({
        title,
        description: description || '',
        category: category || 'General',
        department: department || 'General',
        academicYear: academic_year || '2025-2026',
        documentType: document_type || 'Handbook',
        fileBuffer: req.file.buffer,
        originalFilename: req.file.originalname,
        mimeType: req.file.mimetype,
        userId: req.user.id,
      });

      res.status(201).json({
        success: true,
        message: 'Document uploaded successfully and queued for vector indexing',
        data: doc,
      });
    } catch (error) {
      next(error);
    }
  },

  listDocuments: async (req, res, next) => {
    try {
      const { search, category, department, status, page, limit } = req.query;
      const result = await documentService.listDocuments({
        search,
        category,
        department,
        status,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  getDocumentById: async (req, res, next) => {
    try {
      const doc = await documentService.getDocumentById(req.params.id);
      if (!doc) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Document not found',
          },
          message: 'Document not found',
        });
      }

      res.status(200).json({
        success: true,
        data: doc,
      });
    } catch (error) {
      next(error);
    }
  },

  getDocumentStatus: async (req, res, next) => {
    try {
      const doc = await documentService.getDocumentById(req.params.id);
      if (!doc) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Document not found',
          },
          message: 'Document not found',
        });
      }

      res.status(200).json({
        success: true,
        data: {
          id: doc.id,
          status: doc.status,
          totalPages: doc.total_pages,
          totalChunks: doc.total_chunks,
          errorMessage: doc.error_message,
          updatedAt: doc.updated_at,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  updateDocument: async (req, res, next) => {
    try {
      const updated = await documentService.updateDocumentMetadata(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Document metadata updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  },

  reprocessDocument: async (req, res, next) => {
    try {
      const result = await documentService.reprocessDocument(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Document reprocessing completed',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  deleteDocument: async (req, res, next) => {
    try {
      const result = await documentService.deleteDocument(req.params.id);
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  },

  searchSimilar: async (req, res, next) => {
    try {
      const { query: queryText, topK, category } = req.body;
      if (!queryText) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'Query text is required',
          },
          message: 'Query text is required',
        });
      }
      const embeddingService = require('../services/embeddingService');
      const vectorRepository = require('../services/vectorRepository');
      const queryVector = await embeddingService.generateEmbedding(queryText);
      const results = await vectorRepository.similaritySearch(queryVector, topK || 4, category);
      res.status(200).json({
        success: true,
        data: results,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = documentController;
