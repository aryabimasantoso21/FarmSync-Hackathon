import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

function EstateDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_URL}/estate/balance`);
      setData(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">⏳ Loading...</div>;
  if (error) return <div className="error">❌ Error: {error}</div>;

  return (
    <div>
      <div className="nav-bar">
        <h2>🌴 Estate Dashboard</h2>
        <button className="btn-logout" onClick={() => navigate('/')}>
          ← Back to Login
        </button>
      </div>

      <div className="dashboard">
        <div className="header" style={{background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'}}>
          <h1>Estate Revenue Dashboard</h1>
          <p>Monitor incoming payments from mill for TBS sales</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>💰 Current Balance</h3>
            <div className="value">{parseFloat(data.balance).toFixed(4)} ETH</div>
            <div className="sub">≈ Rp {data.balanceIDR?.toLocaleString('id-ID') || '0'}</div>
          </div>

          <div className="stat-card">
            <h3>💵 Total Received</h3>
            <div className="value">{data.totalReceived?.toFixed(4)} ETH</div>
            <div className="sub">{data.transactions.length} payments</div>
          </div>

          <div className="stat-card">
            <h3>📍 Estate Address</h3>
            <div className="address" style={{fontSize: '0.8em', marginTop: '10px'}}>
              {data.address}
            </div>
          </div>
        </div>

        <div className="table-container">
          <h2>💵 Incoming Payments</h2>
          {data.transactions.length === 0 ? (
            <p style={{color: '#718096'}}>No transactions yet</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Truck ID</th>
                  <th>From Mill</th>
                  <th>Amount (ETH)</th>
                  <th>Amount (IDR)</th>
                  <th>Timestamp</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((tx, index) => (
                  <tr key={index}>
                    <td><strong>{tx.truckId}</strong></td>
                    <td className="address">{tx.from.substring(0, 10)}...</td>
                    <td>{parseFloat(tx.amount).toFixed(4)} ETH</td>
                    <td>Rp {Math.round(tx.amountIDR).toLocaleString('id-ID')}</td>
                    <td>{tx.timestamp}</td>
                    <td>
                      <span className="badge badge-success">✓ Received</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default EstateDashboard;
