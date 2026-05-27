// backend/utils/fileUpload.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads/donations");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
const requestsDir = path.join(__dirname, "../uploads/requests");
if (!fs.existsSync(requestsDir)) {
  fs.mkdirSync(requestsDir, { recursive: true });
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

// File filter for chat attachments - allow images, PDF, CSV
const chatFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|csv/;
  const allowedMimes = [
    "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp",
    "application/pdf",
    "text/csv", "application/vnd.ms-excel"
  ];
  
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedMimes.includes(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error("Only images (jpg, png, gif, webp), PDF, and CSV files are allowed"));
  }
};

// Configure multer for chat attachments
const chatUpload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: chatFileFilter,
});

// Middleware for single attachment upload (for chat)
const uploadChatAttachment = chatUpload.single("attachment");

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

    // If file was uploaded, add URL and type to request body
    if (req.file) {
      req.body.attachment_url = `/uploads/donations/${req.file.filename}`;
      req.body.attachment_name = req.file.originalname;
      
      // Determine file type
      const ext = path.extname(req.file.originalname).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
        req.body.attachment_type = 'image';
      } else if (ext === '.pdf') {
        req.body.attachment_type = 'pdf';
      } else if (ext === '.csv') {
        req.body.attachment_type = 'csv';
      }
    }

    next();
  });
};


// Configure multer for request images
const requestStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, requestsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, "_");
    cb(null, `request-${uniqueSuffix}-${sanitizedName}${ext}`);
  },
});

const requestUpload = multer({
  storage: requestStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: fileFilter,
});

const uploadRequestImages = requestUpload.array("images", 5);

const handleRequestImageUpload = (req, res, next) => {
  uploadRequestImages(req, res, function (err) {
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

    if (req.files && req.files.length > 0) {
      req.body.images = req.files.map((file) => {
        return `/uploads/requests/${file.filename}`;
      });
    } else {
      req.body.images = [];
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
      // Resolve path relative to backend root
      const fullPath = path.join(__dirname, "..", filePath);

      // Check if file exists and delete
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
          console.log(`Deleted file: ${filePath}`);
        } catch (err) {
          console.error(`Error deleting file ${filePath}:`, err);
        }
      }
    }
  });
};

module.exports = {
  handleDonationImageUpload,
  handleChatAttachmentUpload,
  handleRequestImageUpload,
  deleteFiles,
};

