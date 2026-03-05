// backend/middleware/donationValidation.js

// Validate donation creation
const validateDonationCreate = (req, res, next) => {
  const { title, description, category, condition, images, pickup_location } = req.body;
  const errors = [];

  // Title validation
  if (!title || title.trim().length < 5) {
    errors.push("Title must be at least 5 characters");
  }
  if (title && title.length > 100) {
    errors.push("Title cannot exceed 100 characters");
  }

  // Description validation
  if (!description || description.trim().length < 10) {
    errors.push("Description must be at least 10 characters");
  }
  if (description && description.length > 1000) {
    errors.push("Description cannot exceed 1000 characters");
  }

  // Category validation
  const validCategories = ["books", "stationery", "electronics", "furniture", "other"];
  if (!category || !validCategories.includes(category.toLowerCase())) {
    errors.push(`Category must be one of: ${validCategories.join(", ")}`);
  }

  // Condition validation
  const validConditions = ["new", "like_new", "good", "used"];
  if (!condition || !validConditions.includes(condition.toLowerCase())) {
    errors.push(`Condition must be one of: ${validConditions.join(", ")}`);
  }

  // Images validation
  if (!images || !Array.isArray(images) || images.length === 0) {
    errors.push("At least 1 image is required");
  }
  if (images && images.length > 5) {
    errors.push("Maximum 5 images allowed");
  }

  // Pickup location validation
  if (!pickup_location || pickup_location.trim().length === 0) {
    errors.push("Pickup location is required");
  }
  if (pickup_location && pickup_location.length > 200) {
    errors.push("Pickup location cannot exceed 200 characters");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

// Validate donation update
const validateDonationUpdate = (req, res, next) => {
  const { title, description, category, condition, images, pickup_location } = req.body;
  const errors = [];

  // Title validation (if provided)
  if (title !== undefined) {
    if (title.trim().length < 5) {
      errors.push("Title must be at least 5 characters");
    }
    if (title.length > 100) {
      errors.push("Title cannot exceed 100 characters");
    }
  }

  // Description validation (if provided)
  if (description !== undefined) {
    if (description.trim().length < 10) {
      errors.push("Description must be at least 10 characters");
    }
    if (description.length > 1000) {
      errors.push("Description cannot exceed 1000 characters");
    }
  }

  // Category validation (if provided)
  if (category !== undefined) {
    const validCategories = ["books", "stationery", "electronics", "furniture", "other"];
    if (!validCategories.includes(category.toLowerCase())) {
      errors.push(`Category must be one of: ${validCategories.join(", ")}`);
    }
  }

  // Condition validation (if provided)
  if (condition !== undefined) {
    const validConditions = ["new", "like_new", "good", "used"];
    if (!validConditions.includes(condition.toLowerCase())) {
      errors.push(`Condition must be one of: ${validConditions.join(", ")}`);
    }
  }

  // Images validation (if provided)
  if (images !== undefined) {
    if (!Array.isArray(images) || images.length === 0) {
      errors.push("At least 1 image is required");
    }
    if (images.length > 5) {
      errors.push("Maximum 5 images allowed");
    }
  }

  // Pickup location validation (if provided)
  if (pickup_location !== undefined) {
    if (pickup_location.trim().length === 0) {
      errors.push("Pickup location cannot be empty");
    }
    if (pickup_location.length > 200) {
      errors.push("Pickup location cannot exceed 200 characters");
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

// Validate donation request
const validateDonationRequest = (req, res, next) => {
  const { message } = req.body;
  const errors = [];

  if (!message || message.trim().length < 10) {
    errors.push("Message must be at least 10 characters");
  }
  if (message && message.length > 500) {
    errors.push("Message cannot exceed 500 characters");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

// Validate chat message
const validateChatMessage = (req, res, next) => {
  const { message } = req.body;
  const errors = [];

  if (!message || message.trim().length === 0) {
    errors.push("Message cannot be empty");
  }
  if (message && message.length > 1000) {
    errors.push("Message cannot exceed 1000 characters");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

module.exports = {
  validateDonationCreate,
  validateDonationUpdate,
  validateDonationRequest,
  validateChatMessage,
};
