const express = require("express");
const router = express.Router();
const Review = require("../models/review");
const { auth } = require("../middleware/auth");

// GET /api/reviews/batch?ids=1,2,3 — fetch average ratings for multiple products
router.get("/batch/averages", async (req, res) => {
  try {
    const ids = (req.query.ids || "").split(",").map(Number).filter(Boolean);
    if (!ids.length) return res.json({ success: true, averages: {} });
    const reviews = await Review.aggregate([
      { $match: { product_id: { $in: ids } } },
      { $group: { _id: "$product_id", average: { $avg: "$rating" }, count: { $sum: 1 } } }
    ]);
    const averages = {};
    reviews.forEach(r => { averages[r._id] = { average: r.average.toFixed(1), count: r.count }; });
    res.json({ success: true, averages });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch averages" });
  }
});

// GET /api/reviews/:productId — fetch all reviews for a product
router.get("/:productId", async (req, res) => {
  try {
    const reviews = await Review.find({ product_id: parseInt(req.params.productId) })
      .sort({ created_at: -1 });
    const avg = reviews.length
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;
    res.json({ success: true, reviews, average: avg, count: reviews.length });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch reviews" });
  }
});

// POST /api/reviews/:productId — submit a review (auth required)
router.post("/:productId", auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const productId = parseInt(req.params.productId);

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
    }
    if (!comment || comment.trim().length < 3) {
      return res.status(400).json({ success: false, message: "Comment is required (min 3 characters)" });
    }

    // Upsert — update if already reviewed, create if not
    const review = await Review.findOneAndUpdate(
      { product_id: productId, user_id: req.user.id },
      {
        product_id: productId,
        user_id: req.user.id,
        user_name: req.user.name,
        rating: parseInt(rating),
        comment: comment.trim(),
        created_at: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, message: "Review submitted!", review });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to submit review" });
  }
});

// DELETE /api/reviews/:productId — delete own review
router.delete("/:productId", auth, async (req, res) => {
  try {
    await Review.findOneAndDelete({ product_id: parseInt(req.params.productId), user_id: req.user.id });
    res.json({ success: true, message: "Review deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete review" });
  }
});

module.exports = router;
