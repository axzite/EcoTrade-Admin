import React, { useEffect, useState } from 'react';
import './Orders.css';
import { toast } from 'react-toastify';
import axios from 'axios';
import { assets, url, currency } from '../../assets/assets';

const Order = () => {
  const [orders, setOrders] = useState([]);

  const fetchAllOrders = async () => {
    try {
      const response = await axios.get(`${url}/api/order/list`);
      if (response.data.success) {
        setOrders(response.data.data.reverse());
      } else {
        toast.error("Error loading orders");
      }
    } catch (error) {
      toast.error("Failed to fetch orders");
    }
  };

  const statusHandler = async (event, orderId) => {
    try {
      const response = await axios.post(`${url}/api/order/status`, {
        orderId,
        status: event.target.value,
      });
      if (response.data.success) {
        await fetchAllOrders();
        toast.success("Status updated!");
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Food Processing':
        return 'status-processing';
      case 'Out for delivery':
        return 'status-out';
      case 'Delivered':
        return 'status-delivered';
      default:
        return 'status-default';
    }
  };

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h2>All Orders</h2>
        <p className="orders-count">{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <img src={assets.empty_box} alt="No orders" className="empty-icon" />
          <p>No orders found</p>
        </div>
      ) : (
        <div className="orders-grid">
          {orders.map((order) => (
            <div key={order._id} className="order-card">
              <div className="order-card-header">
                <img src={assets.parcel_icon} alt="Parcel" className="parcel-icon" />
                <div className="order-id">#{order._id.slice(-6)}</div>
              </div>

              <div className="order-card-body">
                <div className="order-items">
                  <p className="items-title">Items: </p>
                  <p className="items-list">
                    {order.items.map((item, i) =>
                      i === order.items.length - 1
                        ? `${item.name} × ${item.quantity}`
                        : `${item.name} × ${item.quantity}, `
                    )}
                  </p>
                </div>

                <div className="customer-info">
                  <p className="customer-name">
                    {order.address.firstName} {order.address.lastName}
                  </p>
                  <p className="customer-address">
                    {order.address.street}, {order.address.city}
                  </p>
                  <p className="customer-phone">{order.address.phone}</p>
                </div>

                <div className="order-summary">
                  <div className="summary-item">
                    <span>Items </span>
                    <strong>{order.items.length}</strong>
                  </div>
                  <div className="summary-item">
                    <span>Total </span>
                    <strong className="amount">{currency}{order.amount}</strong>
                  </div>
                </div>
              </div>

              <div className="order-card-footer">
                <span className={`status-badge ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
                <select
                  onChange={(e) => statusHandler(e, order._id)}
                  value={order.status}
                  className="status-dropdown"
                >
                  <option value="Food Processing">Food Processing</option>
                  <option value="Out for delivery">Out for delivery</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Order;