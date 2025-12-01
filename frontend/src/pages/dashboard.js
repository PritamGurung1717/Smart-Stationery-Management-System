import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./dashboard.css";

const Dashboard = ({ setUser }) => {
  const [user, setLocalUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) setLocalUser(storedUser);
  }, []);

  const stationeryItems = [
    { id: 1, name: "Notebook", price: 120, image: "" },
    { id: 2, name: "Pen Set", price: 80, image: "" },
    { id: 3, name: "Marker Pack", price: 150, image: "" },
    { id: 4, name: "Pencil Box", price: 90, image: "" },
    { id: 5, name: "Sticky Notes", price: 60, image: "" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null); // ✅ instantly update App’s state
    navigate("/login", { replace: true }); // ✅ no page reload, smooth redirect
  };

  return (
    <div className="dashboard-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-logo">✏️ Smart Stationery</div>
        <div className="nav-search">
          <input type="text" placeholder="Search stationery..." />
        </div>
        <div className="nav-links">
          <span className="cart">🛒</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </nav>

      {/* Welcome Section */}
      <header className="welcome">
        <h1>Welcome, {user?.name || "Guest"} </h1>
        <p>Explore and order your favorite stationery items!</p>
      </header>

      {/* Products Section */}
      <section className="product-grid">
        {stationeryItems.map(item => (
          <div className="product-card" key={item.id}>
            <img src={item.image} alt={item.name} />
            <h3>{item.name}</h3>
            <p>₹{item.price}</p>
            <button className="add-btn">Add to Cart</button>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>© 2025 Smart Stationery | All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Dashboard;
