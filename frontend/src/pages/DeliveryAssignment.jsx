import React, { useState, useEffect } from "react";
import API from "../services/api";

export default function DeliveryAssignment() {
  const [orderId, setOrderId] = useState("");
  const [riderId, setRiderId] = useState("");
  const [riders, setRiders] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Fetch online riders for assignment
    API.get("/riders/online")
      .then((response) => setRiders(response.data.riders || []))
      .catch((error) => console.error("Error fetching riders", error));
  }, []);

  const assignRider = async () => {
    if (!orderId || !riderId) {
      setMessage("Please provide both order ID and rider ID.");
      return;
    }

    try {
      const res = await API.post(`/delivery/assign/${orderId}`, { riderId });
      setMessage(res.data.message);
    } catch (error) {
      setMessage("Error assigning rider.");
    }
  };

  return (
    <div>
      <h1>Assign Rider to Order</h1>
      <input
        type="text"
        placeholder="Order ID"
        value={orderId}
        onChange={(e) => setOrderId(e.target.value)}
      />
      <select
        value={riderId}
        onChange={(e) => setRiderId(e.target.value)}
      >
        <option value="">Select Rider</option>
        {riders.map((rider) => (
          <option key={rider.id} value={rider.id}>
            {rider.name} (ID: {rider.id})
          </option>
        ))}
      </select>
      <button onClick={assignRider}>Assign Rider</button>
      {message && <p>{message}</p>}
    </div>
  );
}
