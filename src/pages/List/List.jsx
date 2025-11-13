import React, { useEffect, useState } from 'react';
import './List.css';
import { url, currency } from '../../assets/assets';
import axios from 'axios';
import { toast } from 'react-toastify';

const List = () => {
  const [list, setList] = useState([]);

  const fetchList = async () => {
    try {
      const response = await axios.get(`${url}/api/food/list`);
      if (response.data.success) {
        setList(response.data.data);
      } else {
        toast.error("Failed to load list");
      }
    } catch (error) {
      toast.error("Network error");
    }
  };

  const removeFood = async (foodId) => {
    try {
      const response = await axios.post(`${url}/api/food/remove`, { id: foodId });
      await fetchList();
      if (response.data.success) {
        toast.success(response.data.message);
      } else {
        toast.error("Remove failed");
      }
    } catch (error) {
      toast.error("Error removing item");
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  return (
    <div className="list-container">
      <div className="list-header">
        <h2>All Foods List</h2>
        <p className="list-count">{list.length} items</p>
      </div>

      <div className="list-table">
        {/* Table Header */}
        <div className="list-table-format title">
          <strong>Image</strong>
          <strong>Name</strong>
          <strong>Category</strong>
          <strong>Price</strong>
          <strong>Action</strong>
        </div>

        {/* Table Rows */}
        {list.map((item) => (
          <div key={item._id} className="list-table-format">
            <div className="list-image-wrapper">
              <img
                src={`${url}/images/${item.image}`}
                alt={item.name}
                className="list-image"
              />
              
            </div>
            <p className="list-name">{item.name}</p>
            <p className="list-category">{item.category}</p>
            <p className="list-price">{currency}{item.price}</p>
            <button
              onClick={() => removeFood(item._id)}
              className="list-remove-btn"
              aria-label={`Remove ${item.name}`}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {list.length === 0 && (
        <p className="list-empty">No food items found.</p>
      )}
    </div>
  );
};

export default List;