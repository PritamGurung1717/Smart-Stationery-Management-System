// backend/utils/fileUpload.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads/donations");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: timestamp-randomstring-originalname
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, "_");
    cb(null, `donation-${uniqueSuffix}-${sanitizedName}${ext}`);
  },
});

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: fileFilter,
});

// Middleware for handling multiple image uploads (max 5)
const uploadDonationImages = upload.array("images", 5);

// Middleware wrapper with error handling
const handleDonationImageUpload = (req, res, next) => {
  uploadDonationImages(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "File size too large. Maximum size is 5MB per image.",
        });
      }
      if (err.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({
          success: false,
          message: "Too many files. Maximum 5 images allowed.",
        });
      }
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`,
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least 1 image is required",
      });
    }

    // Generate URLs for uploaded files
    req.body.images = req.files.map((file) => {
      return `/uploads/donations/${file.filename}`;
    });

    next();
  });
};

// Middleware for single attachment upload (for chat)
const uploadChatAttachment = upload.single("attachment");

const handleChatAttachmentUpload = (req, res, next) => {
  uploadChatAttachment(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "File size too large. Maximum size is 5MB.",
        });
      }
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`,
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    // If file was uploaded, add URL to request body
    if (req.file) {
      req.body.attachment_url = `/uploads/donations/${req.file.filename}`;
    }

    next();
  });
};

// Helper function to delete files
const deleteFiles = (filePaths) => {
  if (!Array.isArray(filePaths)) {
    filePaths = [filePaths];
  }

  filePaths.forEach((filePath) => {
    if (filePath) {
      // Extract filename from URL
      const filename = path.basename(filePath);
      const fullPath = path.join(uploadsDir, filename);

      // Check if file exists and delete
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
          console.log(`Deleted file: ${filename}`);
        } catch (err) {
          console.error(`Error deleting file ${filename}:`, err);
        }
      }
    }
  });
};

module.exports = {
  handleDonationImageUpload,
  handleChatAttachmentUpload,
  deleteFiles,
};
