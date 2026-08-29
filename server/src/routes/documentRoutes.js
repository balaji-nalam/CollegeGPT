const express = require('express');
const { body } = require('express-validator');
const documentController = require('../controllers/documentController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const upload = require('../middleware/upload');
const { validate } = require('../middleware/validate');

const router = express.Router();

// All document endpoints require authentication
router.use(protect);

// Read-only endpoints (Admin and Student)
router.get('/', documentController.listDocuments);
router.post('/search', documentController.searchSimilar);
router.get('/:id', documentController.getDocumentById);
router.get('/:id/status', documentController.getDocumentStatus);

// Management endpoints strictly ADMIN ONLY
router.post(
  '/',
  authorize('admin'),
  upload,
  documentController.uploadDocument
);

router.patch(
  '/:id',
  authorize('admin'),
  [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('category').optional().trim(),
    body('department').optional().trim(),
    body('academicYear').optional().trim(),
  ],
  validate,
  documentController.updateDocument
);

router.post(
  '/:id/reprocess',
  authorize('admin'),
  documentController.reprocessDocument
);

router.delete(
  '/:id',
  authorize('admin'),
  documentController.deleteDocument
);

module.exports = router;
