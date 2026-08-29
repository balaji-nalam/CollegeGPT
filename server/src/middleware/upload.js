const multer = require('multer');
const config = require('../config/env');

const maxSizeBytes = (config.MAX_FILE_SIZE_MB || 25) * 1024 * 1024;
const storage = multer.memoryStorage();

const allowedMimeTypes = [
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const fileFilter = (req, file, cb) => {
  const isAllowed =
    allowedMimeTypes.includes(file.mimetype) ||
    file.originalname.endsWith('.pdf') ||
    file.originalname.endsWith('.txt');

  if (isAllowed) {
    cb(null, true);
  } else {
    const error = new Error('Invalid file type. Only PDF and Text documents are supported.');
    error.statusCode = 400;
    cb(error, false);
  }
};

const uploadSingle = multer({
  storage,
  limits: {
    fileSize: maxSizeBytes,
  },
  fileFilter,
}).single('file');

const handleUpload = (req, res, next) => {
  uploadSingle(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          success: false,
          message: `File upload error: ${err.message}`,
        });
      }
      return res.status(err.statusCode || 400).json({
        success: false,
        message: err.message || 'File upload validation failed',
      });
    }
    next();
  });
};

module.exports = handleUpload;
