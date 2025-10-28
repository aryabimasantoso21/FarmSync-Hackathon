import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('paid'); // 'paid' or 'all'

  useEffect(() => {
    fetchData();
    fetchConfig();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/transactions`);
      setData(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const response = await axios.get(`${API_URL}/config`);
      setConfig(response.data);
    } catch (err) {
      console.error('Failed to fetch config:', err);
    }
  };

  if (loading) return <div className="loading">⏳ Loading...</div>;
  if (error) return <div className="error">❌ Error: {error}</div>;

  return (
    <div>
      <div className="nav-bar">
        <h2>👨‍💼 Admin Dashboard</h2>
        <button className="btn-logout" onClick={() => navigate('/')}>
          ← Back to Login
        </button>
      </div>

      <div className="dashboard">
        <div className="header" style={{background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'}}>
          <h1>Admin Control Panel</h1>
          <p>Monitor all TBS shipments and transactions across the supply chain</p>
        </div>

        {/* System Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <h3>📦 Total Shipments</h3>
            <div className="value">{data.stats.totalShipments}</div>
            <div className="sub">{data.stats.pendingShipments} pending payment</div>
          </div>

          <div className="stat-card">
            <h3>💰 Total Transactions</h3>
            <div className="value">{data.stats.totalTransactions}</div>
            <div className="sub">Completed payments</div>
          </div>

          <div className="stat-card">
            <h3>⚖️ Total Volume</h3>
            <div className="value">{data.stats.totalVolume} kg</div>
            <div className="sub">TBS delivered</div>
          </div>

          <div className="stat-card">
            <h3>💵 Total Value</h3>
            <div className="value">{data.stats.totalValue?.toFixed(4)} ETH</div>
            <div className="sub">≈ Rp {(data.stats.totalValue * 100000000).toLocaleString('id-ID')}</div>
          </div>
        </div>

        {/* System Configuration */}
        {config && (
          <div className="table-container" style={{marginBottom: '20px'}}>
            <h2>⚙️ System Configuration</h2>
            <table>
              <tbody>
                <tr>
                  <td><strong>Contract Address</strong></td>
                  <td className="address">{config.contractAddress}</td>
                </tr>
                <tr>
                  <td><strong>Estate Address</strong></td>
                  <td className="address">{config.estateAddress}</td>
                </tr>
                <tr>
                  <td><strong>Mill Address</strong></td>
                  <td className="address">{config.millAddress}</td>
                </tr>
                <tr>
                  <td><strong>Price per Kg</strong></td>
                  <td>Rp {parseInt(config.pricePerKgIDR).toLocaleString('id-ID')} ({config.pricePerKgETH} ETH)</td>
                </tr>
                <tr>
                  <td><strong>Network</strong></td>
                  <td>{config.network}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Tab Navigation */}
        <div style={{marginBottom: '20px', display: 'flex', gap: '10px'}}>
          <button 
            onClick={() => setActiveTab('paid')}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              background: activeTab === 'paid' ? '#667eea' : '#e2e8f0',
              color: activeTab === 'paid' ? 'white' : '#4a5568',
              fontWeight: '600'
            }}
          >
            💰 Paid Transactions ({data.paidTransactions.length})
          </button>
          <button 
            onClick={() => setActiveTab('all')}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              background: activeTab === 'all' ? '#667eea' : '#e2e8f0',
              color: activeTab === 'all' ? 'white' : '#4a5568',
              fontWeight: '600'
            }}
          >
            📦 All Shipments ({data.allShipments.length})
          </button>
        </div>

        {/* Paid Transactions Table */}
        {activeTab === 'paid' && (
          <div className="table-container">
            <h2>💰 Completed Transactions</h2>
            {data.paidTransactions.length === 0 ? (
              <p style={{color: '#718096'}}>No completed transactions yet</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Truck ID</th>
                    <th>Estate ID</th>
                    <th>From (Mill)</th>
                    <th>To (Estate)</th>
                    <th>Departure Weight</th>
                    <th>Arrival Weight</th>
                    <th>Weight Diff</th>
                    <th>Amount (IDR)</th>
                    <th>Payment Time</th>
                  </tr>
                </thead>
                <tbody>
                  {data.paidTransactions.map((tx, index) => (
                    <tr key={index}>
                      <td><strong>{tx.truckId}</strong></td>
                      <td>{tx.estateId}</td>
                      <td className="address">{tx.from.substring(0, 10)}...</td>
                      <td className="address">{tx.to.substring(0, 10)}...</td>
                      <td>{tx.departureWeight} kg</td>
                      <td>{tx.arrivalWeight} kg</td>
                      <td>
                        {tx.weightDiff === 0 ? (
                          <span className="badge badge-success">{tx.weightDiff} kg</span>
                        ) : tx.weightDiff <= 1 ? (
                          <span className="badge badge-info">-{tx.weightDiff} kg</span>
                        ) : (
                          <span className="badge badge-warning">-{tx.weightDiff} kg</span>
                        )}
                      </td>
                      <td>Rp {Math.round(tx.amountIDR).toLocaleString('id-ID')}</td>
                      <td>{tx.paymentTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* All Shipments Table */}
        {activeTab === 'all' && (
          <div className="table-container">
            <h2>📦 All Shipments</h2>
            {data.allShipments.length === 0 ? (
              <p style={{color: '#718096'}}>No shipments yet</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Truck ID</th>
                    <th>Estate ID</th>
                    <th>Departure Weight</th>
                    <th>Arrival Weight</th>
                    <th>Departure Time</th>
                    <th>Arrival Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.allShipments.map((shipment, index) => (
                    <tr key={index}>
                      <td><strong>{shipment.truckId}</strong></td>
                      <td>{shipment.estateId}</td>
                      <td>{shipment.departureWeight} kg</td>
                      <td>{shipment.arrivalWeight > 0 ? `${shipment.arrivalWeight} kg` : '-'}</td>
                      <td>{shipment.departureTime}</td>
                      <td>{shipment.arrivalTime || '-'}</td>
                      <td>
                        {shipment.paid ? (
                          <span className="badge badge-success">✓ Paid</span>
                        ) : shipment.arrived ? (
                          <span className="badge badge-warning">⏳ Arrived (Unpaid)</span>
                        ) : shipment.departed ? (
                          <span className="badge badge-info">🚚 In Transit</span>
                        ) : (
                          <span className="badge badge-danger">❌ Unknown</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
