import React, { useState } from "react";
import API from "../services/api";

export default function OrderStatusUpdate() {
  const [orderId, setOrderId] = useState("");
  const [status, setStatus] = useState("");
  const [riderId, setRiderId] = useState("");
  const [message, setMessage] = useState("");

  const updateStatus = async () => {
    if (!orderId || !status || !riderId) {
      setMessage("Please provide all fields.");
      return;
    }

    try {
      const res = await API.post(`/delivery/update-status/${orderId}`, {
        status,
        riderId,
      });
      setMessage(res.data.message);
    } catch (error) {
      setMessage("Error updating status.");
    }
  };

  return (
    <div>
      <h1>Update Order Status</h1>
      <input
        type="text"
        placeholder="Order ID"
        value={orderId}
        onChange={(e) => setOrderId(e.target.value)}
      />
      <select value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="">Select Status</option>
        <option value="accepted">Accepted</option>
        <option value="picked">Picked</option>
        <option value="delivered">Delivered</option>
      </select>
      <input
        type="text"
        placeholder="Rider ID"
        value={riderId}
        onChange={(e) => setRiderId(e.target.value)}
      />
      <button onClick={updateStatus}>Update Status</button>
      {message && <p>{message}</p>}
    </div>
  );
}
