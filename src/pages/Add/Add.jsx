import React, { useState } from "react";
import "./Add.css";
import { assets, url } from "../../assets/assets";
import axios from "axios";
import { toast } from "react-toastify";

const Add = () => {
  // ✅ State
  const [image, setImage] = useState(null);
  const [data, setData] = useState({
    name: "",
    description: "",
    price: "",
    category: "Rice",
    isVerified: 0, // ✅ use 0 or 1, not boolean
  });

  // ✅ Image upload handler
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    setImage(file);
    event.target.value = ""; // Reset input after selecting
  };

  // ✅ Input change handler
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Checkbox handler (toggle 0/1)
  const handleCheckboxChange = (event) => {
    setData((prev) => ({
      ...prev,
      isVerified: event.target.checked ? 1 : 0,
    }));
  };

  // ✅ Submit handler
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!image) {
      toast.error("Please upload an image!");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("description", data.description);
      formData.append("price", Number(data.price));
      formData.append("category", data.category);
      formData.append("isVerified", String(data.isVerified)); // ✅ FIXED HERE
      formData.append("image", image);

      const response = await axios.post(`${url}/api/food/add`, formData);

      if (response.data.success) {
        toast.success(response.data.message);
        setData({
          name: "",
          description: "",
          price: "",
          category: "Rice",
          isVerified: 0, // reset
        });
        setImage(null);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Add product error:", error);
      toast.error("Failed to add product. Please try again.");
    }
  };

  // ✅ Image preview
  const getImagePreview = () => {
    return image ? URL.createObjectURL(image) : assets.upload_area;
  };

  return (
    <div className="add">
      <form className="add-form" onSubmit={handleSubmit}>
        {/* Header */}
        <div className="add-header">
          <h2 className="add-title">
            <span className="add-icon">➕</span> Add New Product
          </h2>
          <p className="add-subtitle">
            Fill in the details below to add a new product
          </p>
        </div>

        {/* Image Upload Section */}
        <div className="add-section">
          <label className="add-label">Product Image</label>
          <p className="add-hint">Click below to upload an image</p>
          <label htmlFor="image-upload" className="add-image-upload">
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              hidden
            />
            <div className="add-image-container">
              <img
                src={getImagePreview()}
                alt="Product preview"
                className="add-image-preview"
              />
              {!image && (
                <div className="add-image-overlay">
                  <span className="add-upload-text">Click to Upload</span>
                </div>
              )}
            </div>
          </label>
        </div>

        {/* Product Info Fields */}
        <div className="add-grid">
          {/* Product Name */}
          <div className="add-section">
            <label htmlFor="product-name" className="add-label">
              Product Name
            </label>
            <input
              id="product-name"
              name="name"
              type="text"
              value={data.name}
              onChange={handleInputChange}
              placeholder="Enter product name..."
              className="add-input"
              required
            />
          </div>

          {/* Verified Seller Checkbox */}
          <div className="add-section">
            <label className="add-label">
              <input
                type="checkbox"
                name="isVerified"
                checked={data.isVerified === 1}
                onChange={handleCheckboxChange}
              />{" "}
              Verified Seller
            </label>
          </div>

          {/* Verified Badge (if checked) */}
          {data.isVerified === 1 && (
            <div className="add-section">
              <span className="verified-badge">✅ Verified Seller</span>
            </div>
          )}

          {/* Description */}
          <div className="add-section add-section-full">
            <label htmlFor="product-description" className="add-label">
              Product Description
            </label>
            <textarea
              id="product-description"
              name="description"
              value={data.description}
              onChange={handleInputChange}
              rows={4}
              placeholder="Describe the product features, quality, and benefits..."
              className="add-textarea"
              required
            />
          </div>

          {/* Category */}
          <div className="add-section">
            <label htmlFor="product-category" className="add-label">
              Category
            </label>
            <select
              id="product-category"
              name="category"
              value={data.category}
              onChange={handleInputChange}
              className="add-select"
            >
              <option value="Rice">Rice</option>
              <option value="Pulses">Pulses</option>
              <option value="Vegetable">Vegetable</option>
              <option value="Flour">Flour</option>
              <option value="Spices">Spices</option>
            </select>
          </div>

          {/* Price */}
          <div className="add-section">
            <label htmlFor="product-price" className="add-label">
              Price (₹)
            </label>
            <div className="add-price-container">
              <span className="add-currency">₹</span>
              <input
                id="product-price"
                name="price"
                type="number"
                value={data.price}
                onChange={handleInputChange}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="add-input add-input-with-currency"
                required
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="add-actions">
          <button type="submit" className="add-btn">
            <span className="add-btn-text">Add Product</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default Add;
