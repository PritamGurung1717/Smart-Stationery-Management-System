// backend/routes/bookSetRoutes.js
const express = require("express");
const router = express.Router();
const BookSetRequest = require("../models/bookSetRequest");
const BookSet = require("../models/bookSet");
const User = require("../models/user");
const { auth, adminAuth, instituteAuth } = require("../middleware/auth");
const nodemailer = require("nodemailer");
const multer = require("multer");
const xlsx = require("xlsx");
const path = require("path");

// Gmail transporter for notifications (optional)
let transporter = null;
try {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    console.log("✅ Email transporter configured");
  } else {
    console.log("⚠️ Email not configured - notifications will be skipped");
  }
} catch (emailError) {
  console.error("⚠️ Email transporter setup failed:", emailError.message);
  transporter = null;
}

// Multer configuration for Excel file upload
const excelStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/excel/");
  },
  filename: (req, file, cb) => {
    cb(null, `bookset-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const excelUpload = multer({
  storage: excelStorage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [".xlsx", ".xls", ".csv"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only Excel files (.xlsx, .xls, .csv) are allowed"));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// ==================== EXCEL UPLOAD ROUTE ====================

// Upload Excel file to create book set request (Institute)
router.post("/institute/book-set-request/upload-excel", instituteAuth, excelUpload.single("excelFile"), async (req, res) => {
  try {
    console.log("📤 Excel upload received");
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No Excel file uploaded",
      });
    }

    const userId = req.user.id || req.decoded.id;
    console.log("User:", userId, req.user.name);

    // Read Excel file
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    console.log(`📊 Excel data rows: ${data.length}`);

    if (data.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Excel file is empty",
      });
    }

    // Expected columns: School Name, Grade, Subject, Book Title, Author, Publisher, Year, ISBN (Price removed - admin sets it)
    const requiredColumns = ["School Name", "Grade", "Book Title", "Author", "Publisher", "Year"];
    const firstRow = data[0];
    const missingColumns = requiredColumns.filter(col => !(col in firstRow));

    if (missingColumns.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required columns: ${missingColumns.join(", ")}`,
      });
    }

    // Group books by school and grade
    const bookSetMap = {};
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const schoolName = String(row["School Name"] || "").trim();
      const grade = String(row["Grade"] || "").trim();
      const subject = String(row["Subject"] || "").trim();
      const bookTitle = String(row["Book Title"] || "").trim();
      const author = String(row["Author"] || "").trim();
      const publisher = String(row["Publisher"] || "").trim();
      const year = parseInt(row["Year"]);
      const isbn = String(row["ISBN"] || "").trim();
      const price = 0; // Price set to 0, admin will update later

      // Validation
      if (!schoolName || !grade || !bookTitle || !author || !publisher || !year) {
        return res.status(400).json({
          success: false,
          message: `Row ${i + 2}: Missing required fields`,
        });
      }

      if (year < 1900 || year > new Date().getFullYear() + 1) {
        return res.status(400).json({
          success: false,
          message: `Row ${i + 2}: Invalid publication year`,
        });
      }

      // Create unique key for school + grade
      const key = `${schoolName}|||${grade}`;
      
      if (!bookSetMap[key]) {
        bookSetMap[key] = {
          school_name: schoolName,
          grade: grade,
          items: [],
        };
      }

      bookSetMap[key].items.push({
        subject_name: subject,
        book_title: bookTitle,
        author: author,
        publisher: publisher,
        publication_year: year,
        isbn: isbn,
        estimated_price: price,
      });
    }

    console.log(`📚 Creating ${Object.keys(bookSetMap).length} book set requests`);

    // Create book set requests
    const createdRequests = [];
    const errors = [];

    for (const key in bookSetMap) {
      const bookSetData = bookSetMap[key];
      
      // Check for duplicate pending request
      const existingRequest = await BookSetRequest.findOne({
        institute_id: userId,
        school_name: bookSetData.school_name,
        grade: bookSetData.grade,
        status: "pending",
      });

      if (existingRequest) {
        errors.push(`${bookSetData.school_name} - Grade ${bookSetData.grade}: Already has a pending request`);
        continue;
      }

      try {
        const bookSetRequest = new BookSetRequest({
          institute_id: userId,
          school_name: bookSetData.school_name,
          grade: bookSetData.grade,
          items: bookSetData.items,
          status: "pending",
        });

        await bookSetRequest.save();
        createdRequests.push(bookSetRequest);
        console.log(`✅ Created request for ${bookSetData.school_name} - Grade ${bookSetData.grade}`);
      } catch (err) {
        console.error(`❌ Error creating request for ${bookSetData.school_name} - Grade ${bookSetData.grade}:`, err);
        errors.push(`${bookSetData.school_name} - Grade ${bookSetData.grade}: ${err.message}`);
      }
    }

    // Send notification email to admins
    try {
      if (transporter && createdRequests.length > 0) {
        const admins = await User.find({ role: "admin" });
        const adminEmails = admins.map(admin => admin.email).filter(Boolean);

        if (adminEmails.length > 0) {
          await transporter.sendMail({
            to: adminEmails.join(","),
            subject: `${createdRequests.length} New Book Set Requests - Smart Stationery`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2c3e50;">Bulk Book Set Requests Uploaded</h2>
                <p>${req.user.name} has uploaded ${createdRequests.length} book set requests via Excel:</p>
                <ul>
                  ${createdRequests.map(r => `<li>${r.school_name} - Grade ${r.grade} (${r.items.length} books)</li>`).join("")}
                </ul>
                <p>Please review and approve/reject these requests.</p>
                <hr>
                <p style="color: #7f8c8d; font-size: 12px;">Smart Stationery © 2025</p>
              </div>
            `,
          });
          console.log("✅ Notification email sent to admins");
        }
      }
    } catch (emailError) {
      console.error("Failed to send notification email:", emailError);
    }

    // Clean up uploaded file
    const fs = require("fs");
    try {
      fs.unlinkSync(req.file.path);
    } catch (cleanupError) {
      console.error("Failed to delete uploaded file:", cleanupError);
    }

    res.status(201).json({
      success: true,
      message: `Successfully created ${createdRequests.length} book set request(s)`,
      created: createdRequests.length,
      errors: errors.length > 0 ? errors : undefined,
      requests: createdRequests,
    });

  } catch (err) {
    console.error("❌ Excel upload error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to process Excel file",
      error: process.env.NODE_ENV === "development" ? err.message : "Internal server error",
    });
  }
});

// ==================== INSTITUTE ROUTES ====================

// Submit new book set request
router.post("/institute/book-set-request", instituteAuth, async (req, res) => {
  try {
    console.log("📝 Book set request received");
    const userId = req.user.id || req.decoded.id;
    console.log("User:", userId, req.user.name, req.user.role);
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    
    const { school_name, grade, items } = req.body;

    // Validation
    if (!school_name || !grade || !items || !Array.isArray(items) || items.length === 0) {
      console.log("❌ Validation failed: Missing required fields");
      return res.status(400).json({
        success: false,
        message: "School name, grade, and at least one book item are required",
      });
    }

    console.log(`✅ Basic validation passed. Items count: ${items.length}`);

    // Validate each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.subject_name || !item.book_title || !item.author || 
          !item.publisher || !item.publication_year || !item.estimated_price) {
        console.log(`❌ Item ${i + 1} validation failed:`, item);
        return res.status(400).json({
          success: false,
          message: `Item ${i + 1}: All fields are required (subject, title, author, publisher, year, price)`,
        });
      }

      // Validate publication year
      const currentYear = new Date().getFullYear();
      if (item.publication_year < 1900 || item.publication_year > currentYear + 1) {
        console.log(`❌ Item ${i + 1} invalid year:`, item.publication_year);
        return res.status(400).json({
          success: false,
          message: `Item ${i + 1}: Invalid publication year`,
        });
      }

      // Validate ISBN if provided
      if (item.isbn) {
        const isbn = item.isbn.replace(/[-\s]/g, '');
        if (!/^(\d{10}|\d{13})$/.test(isbn)) {
          console.log(`❌ Item ${i + 1} invalid ISBN:`, item.isbn);
          return res.status(400).json({
            success: false,
            message: `Item ${i + 1}: Invalid ISBN format. Must be 10 or 13 digits.`,
          });
        }
      }

      // Validate price
      if (item.estimated_price <= 0 || item.estimated_price > 999999.99) {
        console.log(`❌ Item ${i + 1} invalid price:`, item.estimated_price);
        return res.status(400).json({
          success: false,
          message: `Item ${i + 1}: Invalid price`,
        });
      }
    }

    console.log("✅ All items validated");

    // Check for duplicate pending request (same school + grade)
    console.log("🔍 Checking for duplicate pending requests...");
    const existingRequest = await BookSetRequest.findOne({
      institute_id: userId,
      school_name: school_name.trim(),
      grade: grade.trim(),
      status: "pending",
    });

    if (existingRequest) {
      console.log("❌ Duplicate pending request found:", existingRequest.id);
      return res.status(400).json({
        success: false,
        message: `You already have a pending request for ${school_name} - Grade ${grade}. Please wait for admin approval or edit the existing request.`,
      });
    }

    console.log("✅ No duplicate found");

    // Create new request
    console.log("📦 Creating new book set request...");
    const bookSetRequest = new BookSetRequest({
      institute_id: userId,
      school_name: school_name.trim(),
      grade: grade.trim(),
      items: items.map(item => ({
        subject_name: item.subject_name.trim(),
        book_title: item.book_title.trim(),
        author: item.author.trim(),
        publisher: item.publisher.trim(),
        publication_year: parseInt(item.publication_year),
        isbn: item.isbn ? item.isbn.trim() : "",
        estimated_price: parseFloat(item.estimated_price),
      })),
      status: "pending",
    });

    console.log("💾 Saving to database...");
    await bookSetRequest.save();
    console.log("✅ Saved successfully! ID:", bookSetRequest.id);

    // Send notification email to admins
    try {
      if (transporter) {
        const admins = await User.find({ role: "admin" });
        const adminEmails = admins.map(admin => admin.email).filter(Boolean);

        if (adminEmails.length > 0) {
          await transporter.sendMail({
            to: adminEmails.join(","),
            subject: "New Book Set Request - Smart Stationery",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2c3e50;">New Book Set Request</h2>
                <p>A new book set request has been submitted:</p>
                <ul>
                  <li><strong>Institute:</strong> ${req.user.name}</li>
                  <li><strong>School:</strong> ${school_name}</li>
                  <li><strong>Grade:</strong> ${grade}</li>
                  <li><strong>Number of Books:</strong> ${items.length}</li>
                  <li><strong>Total Estimated Price:</strong> ₹${bookSetRequest.total_estimated_price.toFixed(2)}</li>
                </ul>
                <p>Please review and approve/reject this request.</p>
                <hr>
                <p style="color: #7f8c8d; font-size: 12px;">Smart Stationery © 2025</p>
              </div>
            `,
          });
          console.log("✅ Notification email sent to admins");
        }
      } else {
        console.log("⚠️ Email transporter not available, skipping notification");
      }
    } catch (emailError) {
      console.error("Failed to send notification email:", emailError);
      // Don't fail the request if email fails
    }

    console.log("🎉 Request submitted successfully!");
    res.status(201).json({
      success: true,
      message: "Book set request submitted successfully. Waiting for admin approval.",
      request: bookSetRequest,
    });

  } catch (err) {
    console.error("❌ Submit book set request error:", err);
    console.error("Error details:", {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    
    // Handle duplicate key error
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "You already have a pending request for this school and grade combination.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to submit book set request",
      error: process.env.NODE_ENV === "development" ? err.message : "Internal server error",
    });
  }
});

// Get all book set requests for logged-in institute
router.get("/institute/book-set-request", instituteAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = { institute_id: req.user.id };
    if (status && status !== "all") {
      query.status = status;
    }

    const requests = await BookSetRequest.find(query)
      .sort({ created_at: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await BookSetRequest.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      count: requests.length,
      total,
      totalPages,
      currentPage: parseInt(page),
      requests,
    });

  } catch (err) {
    console.error("Get book set requests error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch book set requests",
      error: err.message,
    });
  }
});

// Get single book set request by ID
router.get("/institute/book-set-request/:id", instituteAuth, async (req, res) => {
  try {
    const request = await BookSetRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Book set request not found",
      });
    }

    // Verify ownership
    if (request.institute_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied. This request belongs to another institute.",
      });
    }

    res.json({
      success: true,
      request,
    });

  } catch (err) {
    console.error("Get book set request error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch book set request",
      error: err.message,
    });
  }
});

// Update book set request (only if rejected)
router.put("/institute/book-set-request/:id", instituteAuth, async (req, res) => {
  try {
    const { school_name, grade, items } = req.body;

    const request = await BookSetRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Book set request not found",
      });
    }

    // Verify ownership
    if (request.institute_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied. This request belongs to another institute.",
      });
    }

    // Only allow editing if rejected
    if (request.status !== "rejected") {
      return res.status(400).json({
        success: false,
        message: "Only rejected requests can be edited. Current status: " + request.status,
      });
    }

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one book item is required",
      });
    }

    // Validate each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.subject_name || !item.book_title || !item.author || 
          !item.publisher || !item.publication_year || !item.estimated_price) {
        return res.status(400).json({
          success: false,
          message: `Item ${i + 1}: All fields are required`,
        });
      }
    }

    // Update request
    if (school_name) request.school_name = school_name.trim();
    if (grade) request.grade = grade.trim();
    request.items = items.map(item => ({
      subject_name: item.subject_name.trim(),
      book_title: item.book_title.trim(),
      author: item.author.trim(),
      publisher: item.publisher.trim(),
      publication_year: parseInt(item.publication_year),
      isbn: item.isbn ? item.isbn.trim() : "",
      estimated_price: parseFloat(item.estimated_price),
    }));
    request.status = "pending"; // Reset to pending
    request.admin_remark = ""; // Clear previous remark

    await request.save();

    res.json({
      success: true,
      message: "Book set request updated and resubmitted for approval",
      request,
    });

  } catch (err) {
    console.error("Update book set request error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update book set request",
      error: err.message,
    });
  }
});

// Delete book set request (only if rejected or pending)
router.delete("/institute/book-set-request/:id", instituteAuth, async (req, res) => {
  try {
    const request = await BookSetRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Book set request not found",
      });
    }

    // Verify ownership
    if (request.institute_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied. This request belongs to another institute.",
      });
    }

    // Only allow deleting if rejected or pending
    if (request.status === "approved") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete approved requests",
      });
    }

    // Delete using _id to ensure proper deletion
    await BookSetRequest.findByIdAndDelete(request._id);

    res.json({
      success: true,
      message: "Book set request deleted successfully",
    });

  } catch (err) {
    console.error("Delete book set request error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete book set request",
      error: err.message,
    });
  }
});

// ==================== ADMIN ROUTES ====================

// Get all book set requests (with filters)
router.get("/admin/book-set-requests", adminAuth, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

    const query = {};
    
    // Filter by status
    if (status && status !== "all") {
      query.status = status;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { school_name: { $regex: search, $options: 'i' } },
        { grade: { $regex: search, $options: 'i' } },
      ];
      
      // Search by request ID if numeric
      if (!isNaN(search)) {
        query.$or.push({ id: Number(search) });
      }
    }

    const requests = await BookSetRequest.find(query)
      .sort({ created_at: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Populate institute names
    const instituteIds = [...new Set(requests.map(r => r.institute_id))];
    const institutes = await User.find({ id: { $in: instituteIds } }).select('id name email');
    const instituteMap = {};
    institutes.forEach(inst => {
      instituteMap[inst.id] = { name: inst.name, email: inst.email };
    });

    // Add institute info to requests
    const requestsWithInstitute = requests.map(req => {
      const reqObj = req.toObject();
      reqObj.institute_name = instituteMap[req.institute_id]?.name || "Unknown";
      reqObj.institute_email = instituteMap[req.institute_id]?.email || "";
      return reqObj;
    });

    const total = await BookSetRequest.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      count: requests.length,
      total,
      totalPages,
      currentPage: parseInt(page),
      requests: requestsWithInstitute,
    });

  } catch (err) {
    console.error("Get all book set requests error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch book set requests",
      error: err.message,
    });
  }
});

// Get single book set request by ID (admin)
router.get("/admin/book-set-requests/:id", adminAuth, async (req, res) => {
  try {
    const request = await BookSetRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Book set request not found",
      });
    }

    // Get institute info
    const institute = await User.findOne({ id: request.institute_id }).select('id name email phone instituteInfo');

    const requestObj = request.toObject();
    requestObj.institute = institute ? {
      id: institute.id,
      name: institute.name,
      email: institute.email,
      phone: institute.phone,
      schoolName: institute.instituteInfo?.schoolName,
    } : null;

    res.json({
      success: true,
      request: requestObj,
    });

  } catch (err) {
    console.error("Get book set request error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch book set request",
      error: err.message,
    });
  }
});

// Update book set request (admin) - can edit any status
router.put("/admin/book-set-requests/:id", adminAuth, async (req, res) => {
  try {
    const { school_name, grade, items, total_estimated_price } = req.body;

    const request = await BookSetRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Book set request not found",
      });
    }

    // Validation
    if (items && Array.isArray(items)) {
      if (items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one book item is required",
        });
      }

      // Validate each item
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.subject_name || !item.book_title || !item.author || 
            !item.publisher || !item.publication_year || !item.estimated_price) {
          return res.status(400).json({
            success: false,
            message: `Item ${i + 1}: All fields are required`,
          });
        }

        // Validate publication year
        const currentYear = new Date().getFullYear();
        if (item.publication_year < 1900 || item.publication_year > currentYear + 1) {
          return res.status(400).json({
            success: false,
            message: `Item ${i + 1}: Invalid publication year`,
          });
        }

        // Validate price
        if (item.estimated_price <= 0 || item.estimated_price > 999999.99) {
          return res.status(400).json({
            success: false,
            message: `Item ${i + 1}: Invalid price`,
          });
        }
      }

      // Update items
      request.items = items.map(item => ({
        subject_name: item.subject_name.trim(),
        book_title: item.book_title.trim(),
        author: item.author.trim(),
        publisher: item.publisher.trim(),
        publication_year: parseInt(item.publication_year),
        isbn: item.isbn ? item.isbn.trim() : "",
        estimated_price: parseFloat(item.estimated_price),
      }));
    }

    // Update other fields
    if (school_name) request.school_name = school_name.trim();
    if (grade) request.grade = grade.trim();
    
    // Update total price if provided, otherwise recalculate
    if (total_estimated_price !== undefined) {
      request.total_estimated_price = total_estimated_price;
    }

    await request.save();

    res.json({
      success: true,
      message: "Book set request updated successfully",
      request,
    });

  } catch (err) {
    console.error("Update book set request error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update book set request",
      error: err.message,
    });
  }
});

// Approve book set request
router.put("/admin/book-set-requests/:id/approve", adminAuth, async (req, res) => {
  try {
    console.log("=== APPROVE REQUEST DEBUG ===");
    console.log("req.user:", req.user);
    console.log("req.user.id:", req.user.id);
    console.log("req.user._id:", req.user._id);
    
    const request = await BookSetRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Book set request not found",
      });
    }

    // Check if already processed
    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Request already ${request.status}`,
      });
    }

    // ===== AUTO-CREATE PRODUCTS FOR EACH BOOK =====
    const Product = require("../models/product");
    const Counter = require("../models/counter");
    
    const bookSetItems = [];
    let productsCreated = 0;
    let productsLinked = 0;
    
    console.log(`📚 Processing ${request.items.length} books...`);
    
    for (const item of request.items) {
      // Check if product already exists (by title and author to avoid duplicates)
      let product = await Product.findOne({
        name: item.book_title,
        category: "book"
      });
      
      // If product doesn't exist, create it
      if (!product) {
        // Get next product ID
        const counter = await Counter.findByIdAndUpdate(
          { _id: "productId" },
          { $inc: { sequence_value: 1 } },
          { new: true, upsert: true }
        );
        
        product = await Product.create({
          id: counter.sequence_value,
          name: item.book_title,
          description: `${item.subject_name || 'Book'} by ${item.author}. Published by ${item.publisher} (${item.publication_year})${item.isbn ? `. ISBN: ${item.isbn}` : ''}`,
          price: item.estimated_price,
          category: "book",
          stock_quantity: 100, // Set default stock
          image_url: "", // Can be updated later
        });
        
        productsCreated++;
        console.log(`✅ Created product: ${product.name} (ID: ${product.id})`);
      } else {
        productsLinked++;
        console.log(`🔗 Linked existing product: ${product.name} (ID: ${product.id})`);
      }
      
      // Add to book set items with product_id
      bookSetItems.push({
        product_id: product.id,
        title: item.book_title,
        author: item.author,
        publisher: item.publisher,
        publication_year: item.publication_year,
        isbn: item.isbn,
        price: item.estimated_price,
        subject_name: item.subject_name,
      });
    }
    
    console.log(`📦 Products created: ${productsCreated}, Products linked: ${productsLinked}`);
    // ===== END AUTO-CREATE PRODUCTS =====

    // Create book set from request with linked products
    const adminId = req.user.id || req.decoded?.id || req.user._id;
    console.log("Using admin ID:", adminId);
    console.log("Admin user object:", { id: req.user.id, _id: req.user._id, decoded: req.decoded });
    
    const bookSetData = {
      school_name: request.school_name,
      grade: request.grade,
      created_from_request_id: request.id,
      is_active: true,
      items: bookSetItems, // Use items with product_id
    };
    
    // Only add created_by if we have a valid admin ID
    if (adminId) {
      bookSetData.created_by = adminId;
    }
    
    const bookSet = new BookSet(bookSetData);

    await bookSet.save();

    // Update request status
    request.status = "approved";
    if (adminId) {
      request.approved_by = adminId;
    }
    request.approved_at = new Date();
    await request.save();

    // Send notification email to institute
    try {
      if (transporter) {
        const institute = await User.findOne({ id: request.institute_id });
        if (institute && institute.email) {
          await transporter.sendMail({
            to: institute.email,
            subject: "Book Set Request Approved - Smart Stationery",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #27ae60;">Book Set Request Approved! ✓</h2>
                <p>Hello ${institute.name},</p>
                <p>Great news! Your book set request has been approved:</p>
                <ul>
                  <li><strong>School:</strong> ${request.school_name}</li>
                  <li><strong>Grade:</strong> ${request.grade}</li>
                  <li><strong>Number of Books:</strong> ${request.items.length}</li>
                  <li><strong>Total Price:</strong> ₹${bookSet.total_price.toFixed(2)}</li>
                </ul>
                <p><strong>All books are now available for purchase!</strong></p>
                <p>The book set is now available for customers to view and purchase. You can also add this book set to your cart directly.</p>
                <hr>
                <p style="color: #7f8c8d; font-size: 12px;">Smart Stationery © 2025</p>
              </div>
            `,
          });
          console.log("✅ Approval email sent to institute");
        }
      }
    } catch (emailError) {
      console.error("Failed to send approval email:", emailError);
    }

    res.json({
      success: true,
      message: `Book set request approved successfully! ${productsCreated} new products created, ${productsLinked} existing products linked. All books are now available for purchase.`,
      request,
      bookSet,
      stats: {
        productsCreated,
        productsLinked,
        totalBooks: bookSetItems.length
      }
    });

  } catch (err) {
    console.error("Approve book set request error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to approve book set request",
      error: err.message,
    });
  }
});

// Reject book set request
router.put("/admin/book-set-requests/:id/reject", adminAuth, async (req, res) => {
  try {
    const { admin_remark } = req.body;

    if (!admin_remark || admin_remark.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Admin remark is required when rejecting a request",
      });
    }

    const request = await BookSetRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Book set request not found",
      });
    }

    // Check if already processed
    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Request already ${request.status}`,
      });
    }

    // Update request status
    const adminId = req.user.id || req.decoded?.id || req.user._id;
    request.status = "rejected";
    request.admin_remark = admin_remark.trim();
    if (adminId) {
      request.rejected_by = adminId;
    }
    request.rejected_at = new Date();
    await request.save();

    // Send notification email to institute
    try {
      if (transporter) {
        const institute = await User.findOne({ id: request.institute_id });
        if (institute && institute.email) {
          await transporter.sendMail({
            to: institute.email,
            subject: "Book Set Request Rejected - Smart Stationery",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #e74c3c;">Book Set Request Rejected</h2>
                <p>Hello ${institute.name},</p>
                <p>Unfortunately, your book set request has been rejected:</p>
                <ul>
                  <li><strong>School:</strong> ${request.school_name}</li>
                  <li><strong>Grade:</strong> ${request.grade}</li>
                </ul>
                <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #e74c3c; margin: 20px 0;">
                  <strong>Reason:</strong><br>
                  ${admin_remark}
                </div>
                <p>You can edit and resubmit your request from your dashboard.</p>
                <hr>
                <p style="color: #7f8c8d; font-size: 12px;">Smart Stationery © 2025</p>
              </div>
            `,
          });
          console.log("✅ Rejection email sent to institute");
        }
      }
    } catch (emailError) {
      console.error("Failed to send rejection email:", emailError);
    }

    res.json({
      success: true,
      message: "Book set request rejected successfully",
      request,
    });

  } catch (err) {
    console.error("Reject book set request error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to reject book set request",
      error: err.message,
    });
  }
});

// Delete book set request (admin)
router.delete("/admin/book-set-requests/:id", adminAuth, async (req, res) => {
  try {
    const request = await BookSetRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Book set request not found",
      });
    }

    // If request was approved, also delete the corresponding book set
    if (request.status === "approved") {
      try {
        // Find and delete the book set created from this request
        const bookSet = await BookSet.findOne({ created_from_request_id: request.id });
        if (bookSet) {
          await BookSet.findByIdAndDelete(bookSet._id);
          console.log(`✅ Deleted corresponding book set: ${bookSet._id}`);
        }
      } catch (bookSetError) {
        console.error("Error deleting corresponding book set:", bookSetError);
        // Continue with request deletion even if book set deletion fails
      }
    }

    // Delete the request
    await BookSetRequest.findByIdAndDelete(request._id);

    res.json({
      success: true,
      message: "Book set request deleted successfully",
    });

  } catch (err) {
    console.error("Delete book set request error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete book set request",
      error: err.message,
    });
  }
});

// ==================== PUBLIC ROUTES ====================

// Get all approved book sets (for customers) — no auth required
router.get("/book-sets", async (req, res) => {
  try {
    const { school, grade, page = 1, limit = 20 } = req.query;

    const query = { is_active: true };
    
    if (school && school !== "all") {
      query.school_name = { $regex: school, $options: 'i' };
    }
    
    if (grade && grade !== "all") {
      query.grade = grade;
    }

    // Sort by school_name first (ascending), then by grade (ascending)
    const bookSets = await BookSet.find(query)
      .sort({ school_name: 1, grade: 1, created_at: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await BookSet.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    // Get unique schools and grades for filters
    const schools = await BookSet.distinct("school_name", { is_active: true });
    const grades = await BookSet.distinct("grade", { is_active: true });

    res.json({
      success: true,
      count: bookSets.length,
      total,
      totalPages,
      currentPage: parseInt(page),
      bookSets,
      filters: {
        schools: schools.sort(),
        grades: grades.sort(),
      },
    });

  } catch (err) {
    console.error("Get book sets error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch book sets",
      error: err.message,
    });
  }
});

// Get single book set by ID — no auth required
router.get("/book-sets/:id", async (req, res) => {
  try {
    const bookSet = await BookSet.findById(req.params.id);

    if (!bookSet) {
      return res.status(404).json({
        success: false,
        message: "Book set not found",
      });
    }

    if (!bookSet.is_active) {
      return res.status(404).json({
        success: false,
        message: "Book set is not available",
      });
    }

    res.json({
      success: true,
      bookSet,
    });

  } catch (err) {
    console.error("Get book set error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch book set",
      error: err.message,
    });
  }
});

// ==================== ADMIN BOOK SET MANAGEMENT ====================

// Admin Excel upload to create book sets directly (with price)
router.post("/admin/book-sets/upload-excel", adminAuth, excelUpload.single("excelFile"), async (req, res) => {
  try {
    console.log("📤 Admin Excel upload received");
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No Excel file uploaded",
      });
    }

    const adminId = req.user.id || req.decoded?.id || req.user._id;

    // Read Excel file
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    console.log(`📊 Excel data rows: ${data.length}`);

    if (data.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Excel file is empty",
      });
    }

    // Required columns including PRICE
    const requiredColumns = ["School Name", "Grade", "Book Title", "Author", "Publisher", "Year", "Price"];
    const firstRow = data[0];
    const missingColumns = requiredColumns.filter(col => !(col in firstRow));

    if (missingColumns.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required columns: ${missingColumns.join(", ")}`,
      });
    }

    // Group books by school and grade
    const bookSetMap = {};
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const schoolName = String(row["School Name"] || "").trim();
      const grade = String(row["Grade"] || "").trim();
      const subject = String(row["Subject"] || "").trim();
      const bookTitle = String(row["Book Title"] || "").trim();
      const author = String(row["Author"] || "").trim();
      const publisher = String(row["Publisher"] || "").trim();
      const year = parseInt(row["Year"]);
      const isbn = String(row["ISBN"] || "").trim();
      const price = parseFloat(row["Price"]);

      // Validation
      if (!schoolName || !grade || !bookTitle || !author || !publisher || !year || !price) {
        return res.status(400).json({
          success: false,
          message: `Row ${i + 2}: Missing required fields`,
        });
      }

      if (year < 1900 || year > new Date().getFullYear() + 1) {
        return res.status(400).json({
          success: false,
          message: `Row ${i + 2}: Invalid publication year`,
        });
      }

      if (price <= 0 || price > 999999.99) {
        return res.status(400).json({
          success: false,
          message: `Row ${i + 2}: Invalid price`,
        });
      }

      // Create unique key for school + grade
      const key = `${schoolName}|||${grade}`;
      
      if (!bookSetMap[key]) {
        bookSetMap[key] = {
          school_name: schoolName,
          grade: grade,
          items: [],
        };
      }

      bookSetMap[key].items.push({
        subject_name: subject,
        title: bookTitle,
        author: author,
        publisher: publisher,
        publication_year: year,
        isbn: isbn,
        price: price,
      });
    }

    console.log(`📚 Creating ${Object.keys(bookSetMap).length} book sets`);

    // Create book sets directly
    const createdBookSets = [];
    const errors = [];

    for (const key in bookSetMap) {
      const bookSetData = bookSetMap[key];
      
      try {
        const bookSetPayload = {
          school_name: bookSetData.school_name,
          grade: bookSetData.grade,
          is_active: true,
          items: bookSetData.items,
        };

        if (adminId) {
          bookSetPayload.created_by = adminId;
        }

        const bookSet = new BookSet(bookSetPayload);
        await bookSet.save();
        
        createdBookSets.push(bookSet);
        console.log(`✅ Created book set: ${bookSetData.school_name} - Grade ${bookSetData.grade}`);
      } catch (err) {
        console.error(`❌ Error creating book set for ${bookSetData.school_name} - Grade ${bookSetData.grade}:`, err);
        errors.push(`${bookSetData.school_name} - Grade ${bookSetData.grade}: ${err.message}`);
      }
    }

    // Clean up uploaded file
    const fs = require("fs");
    try {
      fs.unlinkSync(req.file.path);
    } catch (cleanupError) {
      console.error("Failed to delete uploaded file:", cleanupError);
    }

    res.status(201).json({
      success: true,
      message: `Successfully created ${createdBookSets.length} book set(s)`,
      created: createdBookSets.length,
      errors: errors.length > 0 ? errors : undefined,
      bookSets: createdBookSets,
    });

  } catch (err) {
    console.error("❌ Admin Excel upload error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to process Excel file",
      error: process.env.NODE_ENV === "development" ? err.message : "Internal server error",
    });
  }
});

// Create new book set manually (admin) - MUST come before GET /:id
router.post("/admin/book-sets", adminAuth, async (req, res) => {
  try {
    console.log("📝 Creating new book set manually");
    const { school_name, grade, items, is_active } = req.body;

    // Validation
    if (!school_name || !grade || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "School name, grade, and at least one book item are required",
      });
    }

    // Validate each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.title || !item.author || !item.publisher || 
          !item.publication_year || !item.price) {
        return res.status(400).json({
          success: false,
          message: `Item ${i + 1}: Title, author, publisher, year, and price are required`,
        });
      }

      // Validate publication year
      const currentYear = new Date().getFullYear();
      if (item.publication_year < 1900 || item.publication_year > currentYear + 1) {
        return res.status(400).json({
          success: false,
          message: `Item ${i + 1}: Invalid publication year`,
        });
      }

      // Validate price
      if (item.price <= 0 || item.price > 999999.99) {
        return res.status(400).json({
          success: false,
          message: `Item ${i + 1}: Invalid price`,
        });
      }
    }

    const adminId = req.user.id || req.decoded?.id || req.user._id;

    const bookSetData = {
      school_name: school_name.trim(),
      grade: grade.trim(),
      is_active: is_active !== undefined ? is_active : true,
      items: items.map(item => ({
        product_id: item.product_id,
        title: item.title.trim(),
        author: item.author.trim(),
        publisher: item.publisher.trim(),
        publication_year: parseInt(item.publication_year),
        isbn: item.isbn ? item.isbn.trim() : "",
        price: parseFloat(item.price),
        subject_name: item.subject_name ? item.subject_name.trim() : "",
      })),
    };

    if (adminId) {
      bookSetData.created_by = adminId;
    }

    const bookSet = new BookSet(bookSetData);
    await bookSet.save();

    console.log(`✅ Book set created successfully: ${bookSet._id}`);

    res.status(201).json({
      success: true,
      message: "Book set created successfully",
      bookSet,
    });

  } catch (err) {
    console.error("Create book set error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create book set",
      error: err.message,
    });
  }
});

// Get all book sets (admin)
router.get("/admin/book-sets", adminAuth, async (req, res) => {
  try {
    const { search, is_active, page = 1, limit = 20 } = req.query;

    const query = {};
    
    if (is_active !== undefined && is_active !== "all") {
      query.is_active = is_active === "true";
    }

    if (search) {
      query.$or = [
        { school_name: { $regex: search, $options: 'i' } },
        { grade: { $regex: search, $options: 'i' } },
      ];
    }

    // Sort by school_name first (ascending), then by grade (ascending)
    const bookSets = await BookSet.find(query)
      .sort({ school_name: 1, grade: 1, created_at: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await BookSet.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      count: bookSets.length,
      total,
      totalPages,
      currentPage: parseInt(page),
      bookSets,
    });

  } catch (err) {
    console.error("Get all book sets error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch book sets",
      error: err.message,
    });
  }
});

// Toggle book set active status
router.put("/admin/book-sets/:id/toggle-active", adminAuth, async (req, res) => {
  try {
    const bookSet = await BookSet.findById(req.params.id);

    if (!bookSet) {
      return res.status(404).json({
        success: false,
        message: "Book set not found",
      });
    }

    bookSet.is_active = !bookSet.is_active;
    await bookSet.save();

    res.json({
      success: true,
      message: `Book set ${bookSet.is_active ? 'activated' : 'deactivated'} successfully`,
      bookSet,
    });

  } catch (err) {
    console.error("Toggle book set active error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to toggle book set status",
      error: err.message,
    });
  }
});

// Update book set (admin)
router.put("/admin/book-sets/:id", adminAuth, async (req, res) => {
  try {
    const { school_name, grade, items, is_active } = req.body;

    const bookSet = await BookSet.findById(req.params.id);

    if (!bookSet) {
      return res.status(404).json({
        success: false,
        message: "Book set not found",
      });
    }

    // Validation
    if (items && Array.isArray(items)) {
      if (items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one book item is required",
        });
      }

      // Validate each item
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.title || !item.author || !item.publisher || 
            !item.publication_year || !item.price) {
          return res.status(400).json({
            success: false,
            message: `Item ${i + 1}: Title, author, publisher, year, and price are required`,
          });
        }

        // Validate publication year
        const currentYear = new Date().getFullYear();
        if (item.publication_year < 1900 || item.publication_year > currentYear + 1) {
          return res.status(400).json({
            success: false,
            message: `Item ${i + 1}: Invalid publication year`,
          });
        }

        // Validate price
        if (item.price <= 0 || item.price > 999999.99) {
          return res.status(400).json({
            success: false,
            message: `Item ${i + 1}: Invalid price`,
          });
        }
      }

      // Update items
      bookSet.items = items.map(item => ({
        product_id: item.product_id,
        title: item.title.trim(),
        author: item.author.trim(),
        publisher: item.publisher.trim(),
        publication_year: parseInt(item.publication_year),
        isbn: item.isbn ? item.isbn.trim() : "",
        price: parseFloat(item.price),
        subject_name: item.subject_name ? item.subject_name.trim() : "",
      }));
    }

    // Update other fields
    if (school_name) bookSet.school_name = school_name.trim();
    if (grade) bookSet.grade = grade.trim();
    if (is_active !== undefined) bookSet.is_active = is_active;

    await bookSet.save();

    res.json({
      success: true,
      message: "Book set updated successfully",
      bookSet,
    });

  } catch (err) {
    console.error("Update book set error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update book set",
      error: err.message,
    });
  }
});

// Delete book set
router.delete("/admin/book-sets/:id", adminAuth, async (req, res) => {
  try {
    const bookSet = await BookSet.findById(req.params.id);

    if (!bookSet) {
      return res.status(404).json({
        success: false,
        message: "Book set not found",
      });
    }

    // Delete using _id to ensure proper deletion
    await BookSet.findByIdAndDelete(bookSet._id);

    res.json({
      success: true,
      message: "Book set deleted successfully",
    });

  } catch (err) {
    console.error("Delete book set error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete book set",
      error: err.message,
    });
  }
});

// Get single book set by ID (admin) - for editing
router.get("/admin/book-sets/:id", adminAuth, async (req, res) => {
  try {
    const bookSet = await BookSet.findById(req.params.id);

    if (!bookSet) {
      return res.status(404).json({
        success: false,
        message: "Book set not found",
      });
    }

    res.json({
      success: true,
      bookSet,
    });

  } catch (err) {
    console.error("Get book set error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch book set",
      error: err.message,
    });
  }
});

module.exports = router;
