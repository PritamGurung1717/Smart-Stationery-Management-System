// backend/middleware/uploadMiddleware.js
const multer = require("multer");
const path   = require("path");
const fs     = require("fs");

const chatUploadsDir = path.join(__dirname, "../uploads/chat");
if (!fs.existsSync(chatUploadsDir)) fs.mkdirSync(chatUploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, chatUploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext    = path.extname(file.originalname).toLowerCase();
    const base   = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, "_").slice(0, 40);
    cb(null, `chat-${unique}-${base}${ext}`);
  },
});

const ALLOWED_MIME = [
  "image/jpeg", "image/jpg", "image/png",
  "application/pdf",
  "text/csv", "application/vnd.ms-excel",
];
const ALLOWED_EXT = [".jpg", ".jpeg", ".png", ".pdf", ".csv"];

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_MIME.includes(file.mimetype) && ALLOWED_EXT.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only images (jpg, png), PDF, and CSV files are allowed"));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter,
});

const handleChatFileUpload = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ success: false, message: "File too large. Max 5 MB." });
      }
      return res.status(400).json({ success: false, message: err.message });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

module.exports = { handleChatFileUpload };
