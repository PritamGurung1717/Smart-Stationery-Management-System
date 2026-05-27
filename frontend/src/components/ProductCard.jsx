// Shared ProductCard component used across Dashboard, InstituteDashboard, ProductsPage, LandingPage
import { useState } from "react";
import { FaHeart, FaShoppingCart, FaShoppingBag, FaStar } from "react-icons/fa";

const CATEGORY_COLORS = {
  book: "#2563EB",
  books: "#2563EB",
  sports: "#16A34A",
  stationery: "#4B5563",
  art: "#9333EA",
  "art & craft": "#9333EA",
  electronics: "#F59E0B",
  donation: "#F59E0B",
  others: "#4B5563",
  copy: "#4B5563",
};

const getCategoryColor = (category) => {
  const key = (category || "").toLowerCase().trim();
  return CATEGORY_COLORS[key] || "#4B5563";
};

const ProductCard = ({
  product,
  onCart,       // (productId, quantity) => void
  onWishlist,   // (product) => void
  inWishlist,   // boolean
  onView,       // (product) => void — opens modal
  onGuestAction, // for landing page guest users
  rating,       // { average, count }
  isGuest = false,
  variant = "default", // "default" | "landing"
}) => {
  const [hovered, setHovered] = useState(false);
  const isLanding = variant === "landing";
  const inStock = (product.stock_quantity || product.stock || 0) > 0;
  const discount = product.original_price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : null;
  const categoryColor = getCategoryColor(product.category);

  const imgSrc = product.image_url
    ? product.image_url.startsWith("http")
      ? product.image_url
      : `http://localhost:5000${product.image_url}`
    : null;

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (isGuest) { onGuestAction?.(); return; }
    onCart?.(product.id, 1);
  };

  const handleWishlist = (e) => {
    e.stopPropagation();
    if (isGuest) { onGuestAction?.(); return; }
    onWishlist?.(product);
  };

  return (
    <div
      onClick={() => onView?.(product)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff",
        border: `1px solid ${hovered && isLanding ? "#1D4ED8" : "#e5e7eb"}`,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow 0.2s, transform 0.2s, border-color 0.2s",
        boxShadow: hovered
          ? (isLanding ? "0 8px 24px rgba(29, 78, 216, 0.12)" : "0 8px 24px rgba(0,0,0,0.12)")
          : "0 1px 3px rgba(0,0,0,0.06)",
        transform: hovered ? "translateY(-2px)" : "none",
        borderRadius: isLanding ? 8 : 4,
        overflow: "hidden",
      }}
    >
      {/* Image area */}
      <div style={{ position: "relative", height: 200, overflow: "hidden", background: "#f3f4f6" }}>
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={product.name}
            style={{
              width: "100%", height: "100%", objectFit: "cover",
              transition: "transform 0.3s",
              transform: hovered ? "scale(1.05)" : "scale(1)",
            }}
            onError={e => { e.target.style.display = "none"; }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FaShoppingBag style={{ fontSize: "3rem", color: "#d1d5db" }} />
          </div>
        )}

        {/* Hover overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "rgba(0,0,0,0.18)",
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.2s",
          pointerEvents: "none",
        }} />

        {/* Discount badge */}
        {discount && (
          <span style={{
            position: "absolute", top: 10, left: 10,
            background: "#ef4444", color: "#fff",
            fontSize: "0.7rem", fontWeight: 700,
            padding: "0.2rem 0.5rem", borderRadius: 4,
          }}>
            -{discount}%
          </span>
        )}

        {/* Wishlist button */}
        {(!isGuest || isLanding) && (
          <button
            onClick={handleWishlist}
            style={{
              position: "absolute", top: 10, right: 10,
              background: isLanding ? "rgba(255,255,255,0.95)" : (inWishlist ? "#ef4444" : "rgba(255,255,255,0.9)"),
              border: "none", borderRadius: "50%",
              width: 32, height: 32,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
              opacity: hovered || inWishlist || isLanding ? 1 : 0,
              transition: "opacity 0.2s, background 0.2s",
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            }}
          >
            <FaHeart style={{
              fontSize: "0.85rem",
              color: inWishlist && !isLanding ? "#fff" : (inWishlist && isLanding ? "#1D4ED8" : "#9CA3AF"),
            }} />
          </button>
        )}

        {/* Out of stock overlay */}
        {!inStock && (
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(255,255,255,0.7)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ background: "#111", color: "#fff", fontSize: "0.75rem", fontWeight: 700, padding: "0.3rem 0.75rem", borderRadius: 4 }}>
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Info area */}
      <div style={{ padding: "0.85rem", display: "flex", flexDirection: "column", gap: "0.3rem", flex: 1 }}>
        <span style={{
          fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em",
          color: isLanding ? categoryColor : "#9ca3af",
          textTransform: "uppercase",
        }}>
          {product.category}
        </span>
        <div style={{
          fontWeight: 600, fontSize: "0.88rem", lineHeight: 1.35,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
          minHeight: "2.4rem", color: "#111",
        }}>
          {product.name}
        </div>

        {/* Rating */}
        {rating?.average > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
            {[1,2,3,4,5].map(s => (
              <FaStar key={s} style={{ fontSize: "0.65rem", color: s <= Math.round(rating.average) ? "#fbbf24" : "#e5e7eb" }} />
            ))}
            <span style={{ fontSize: "0.72rem", color: "#9ca3af", marginLeft: 2 }}>({rating.average})</span>
          </div>
        )}

        {/* Price */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "auto", paddingTop: "0.3rem", flexWrap: "wrap" }}>
          <span style={{
            fontWeight: 700, fontSize: "1rem",
            color: isLanding && product.original_price > product.price ? "#16A34A" : "#111",
          }}>
            ₹{Number(product.price).toLocaleString("en-IN")}
          </span>
          {product.original_price && product.original_price > product.price && (
            <span style={{ fontSize: "0.8rem", color: "#9ca3af", textDecoration: "line-through" }}>
              ₹{Number(product.original_price).toLocaleString("en-IN")}
            </span>
          )}
        </div>

        {/* Add to Cart button */}
        <button
          onClick={handleAddToCart}
          disabled={!inStock && !isGuest}
          style={{
            marginTop: "0.5rem",
            background: inStock || isGuest
              ? (isLanding ? "#1D4ED8" : "#111")
              : "#e5e7eb",
            color: inStock || isGuest ? "#fff" : "#9ca3af",
            border: "none",
            borderRadius: 6,
            padding: "0.5rem",
            fontSize: "0.82rem",
            fontWeight: 600,
            cursor: inStock || isGuest ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.4rem",
            transition: "background 0.15s",
            width: "100%",
          }}
          onMouseEnter={e => {
            if (inStock || isGuest) e.currentTarget.style.background = isLanding ? "#2563EB" : "#374151";
          }}
          onMouseLeave={e => {
            if (inStock || isGuest) e.currentTarget.style.background = isLanding ? "#1D4ED8" : "#111";
          }}
        >
          <FaShoppingCart style={{ fontSize: "0.75rem" }} />
          {inStock || isGuest ? "Add to Cart" : "Out of Stock"}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
