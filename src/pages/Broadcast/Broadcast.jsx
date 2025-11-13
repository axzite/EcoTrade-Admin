import React, { useState } from "react";
import "./Broadcast.css";
import { toast } from "react-toastify";
import axios from "axios"; // ✅ Import axios

const Broadcast = () => {
  const [sellers] = useState([
    { id: 1, name: "GreenMart Pvt. Ltd." },
    { id: 2, name: "Nature's Fresh" },
    { id: 3, name: "OrganicHub India" },
  ]);

  const [activeSeller, setActiveSeller] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState({});

  // ✅ Send message to backend
  const handleSend = async () => {
    if (!newMessage.trim() || !activeSeller) {
      toast.error("Please select a seller and enter a message!");
      return;
    }

    try {
      const res = await axios.post("http://localhost:4000/api/broadcast/add", {
        sellerName: activeSeller.name,
        title: "New Broadcast", // you can customize
        message: newMessage,
      });

      if (res.data.success) {
        toast.success("Message broadcasted!");

        // Update local chat UI immediately
        setMessages((prev) => ({
          ...prev,
          [activeSeller.id]: [
            ...(prev[activeSeller.id] || []),
            { sender: "Admin", text: newMessage },
          ],
        }));
        setNewMessage("");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to send broadcast!");
    }
  };

  return (
    <div className="broadcast-container">
      {/* Left - Seller List */}
      <div className="seller-list">
        <h3>Sellers</h3>
        {sellers.map((seller) => (
          <div
            key={seller.id}
            className={`seller-item ${
              activeSeller?.id === seller.id ? "active" : ""
            }`}
            onClick={() => setActiveSeller(seller)}
          >
            {seller.name}
          </div>
        ))}
      </div>

      {/* Right - Chat/Message Panel */}
      <div className="message-panel">
        {activeSeller ? (
          <>
            <h3>Broadcast to {activeSeller.name}</h3>
            <div className="message-area">
              {(messages[activeSeller.id] || []).map((msg, i) => (
                <div
                  key={i}
                  className={`message-bubble ${
                    msg.sender === "Admin" ? "admin" : "seller"
                  }`}
                >
                  <strong>{msg.sender}:</strong> {msg.text}
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="message-input">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a broadcast message..."
              />
              <button onClick={handleSend}>Send</button>
            </div>
          </>
        ) : (
          <p className="no-seller">Select a seller to start broadcasting</p>
        )}
      </div>
    </div>
  );
};

export default Broadcast;
