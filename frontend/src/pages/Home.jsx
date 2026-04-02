import React, { useEffect, useState } from 'react';
import API, { setAuthToken } from '../services/api';

export default function Home({ token }) {
  // API client এ token সেট করে secure call করে
  useEffect(() => { setAuthToken(token); }, [token]);
  const [restaurants, setRestaurants] = useState([]);
  const [menu, setMenu] = useState([]);
  const [selectedRest, setSelectedRest] = useState(null);

  // initial restaurant list লোড
  useEffect(() => {
    API.get('/restaurants').then(r => setRestaurants(r.data)).catch(() => {});
  }, []);

  // নির্দিষ্ট রেস্টুরেন্টের menu লোড
  function loadMenu(r) {
    const id = r.ID || r.id;
    API.get(`/restaurants/${id}/menu`).then(rres => {
      setMenu(rres.data);
      setSelectedRest(r);
    });
  }

  return (
    <div style={{ display: 'flex', gap: 24 }}>
      <div style={{ flex: 1 }}>
        <h3>Restaurants</h3>
        <ul>
          {restaurants.map(r => (
            <li key={r.ID || r.id} style={{ marginBottom: 8 }}>
              <strong>{r.NAME || r.name}</strong><br />
              <button onClick={() => loadMenu(r)}>View Menu</button>
            </li>
          ))}
        </ul>
      </div>
      <div style={{ flex: 1 }}>
        <h3>Menu {selectedRest ? `— ${selectedRest.NAME || selectedRest.name}` : ''}</h3>
        <ul>
          {menu.map(m => (
            <li key={m.ID || m.id}>
              {m.NAME || m.name} — ${m.PRICE || m.price}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}