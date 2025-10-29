import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ShipmentTracking from '../components/ShipmentTracking';

const API_URL = 'http://localhost:5000/api';

function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('tracking'); // 'tracking', 'paid' or 'all'
  const [selectedShipment, setSelectedShipment] = useState(null);

  useEffect(() => {
    fetchData();
    fetchConfig();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Auto-select first shipment when data loads
  useEffect(() => {
    if (data && data.allShipments.length > 0 && !selectedShipment) {
      setSelectedShipment(data.allShipments[0]);
    }
  }, [data]);

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
        <div style={{marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
          <button 
            onClick={() => setActiveTab('tracking')}
            style={{
              padding: '12px 24px',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              background: activeTab === 'tracking' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#e2e8f0',
              color: activeTab === 'tracking' ? 'white' : '#4a5568',
              fontWeight: '600',
              fontSize: '15px',
              boxShadow: activeTab === 'tracking' ? '0 4px 15px rgba(102, 126, 234, 0.4)' : 'none',
              transform: activeTab === 'tracking' ? 'translateY(-2px)' : 'none',
              transition: 'all 0.3s ease'
            }}
          >
            � Live Tracking ({data.allShipments.filter(s => s.departed && !s.paid).length})
          </button>
          <button 
            onClick={() => setActiveTab('paid')}
            style={{
              padding: '12px 24px',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              background: activeTab === 'paid' ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' : '#e2e8f0',
              color: activeTab === 'paid' ? 'white' : '#4a5568',
              fontWeight: '600',
              fontSize: '15px',
              boxShadow: activeTab === 'paid' ? '0 4px 15px rgba(17, 153, 142, 0.4)' : 'none',
              transform: activeTab === 'paid' ? 'translateY(-2px)' : 'none',
              transition: 'all 0.3s ease'
            }}
          >
            💰 Completed ({data.paidTransactions.length})
          </button>
          <button 
            onClick={() => setActiveTab('all')}
            style={{
              padding: '12px 24px',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              background: activeTab === 'all' ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' : '#e2e8f0',
              color: activeTab === 'all' ? 'white' : '#4a5568',
              fontWeight: '600',
              fontSize: '15px',
              boxShadow: activeTab === 'all' ? '0 4px 15px rgba(79, 172, 254, 0.4)' : 'none',
              transform: activeTab === 'all' ? 'translateY(-2px)' : 'none',
              transition: 'all 0.3s ease'
            }}
          >
            📦 All Shipments ({data.allShipments.length})
          </button>
        </div>

        {/* Live Tracking View */}
        {activeTab === 'tracking' && (
          <div>
            <div style={{marginBottom: '20px'}}>
              <h2 style={{marginBottom: '10px'}}>📍 Live Shipment Tracking</h2>
              <p style={{color: '#718096', fontSize: '14px'}}>
                Monitor real-time status of all active and completed shipments
              </p>
            </div>

            {/* Shipment Selection */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '15px',
              marginBottom: '30px'
            }}>
              {data.allShipments.length === 0 ? (
                <p style={{color: '#718096', gridColumn: '1 / -1'}}>No shipments to track yet</p>
              ) : (
                data.allShipments.map((shipment, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedShipment(shipment)}
                    style={{
                      padding: '20px',
                      background: selectedShipment?.truckId === shipment.truckId 
                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                        : 'white',
                      color: selectedShipment?.truckId === shipment.truckId ? 'white' : '#1f2937',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      border: selectedShipment?.truckId === shipment.truckId 
                        ? '2px solid #667eea' 
                        : '2px solid #e5e7eb',
                      boxShadow: selectedShipment?.truckId === shipment.truckId 
                        ? '0 8px 20px rgba(102, 126, 234, 0.3)' 
                        : '0 2px 8px rgba(0, 0, 0, 0.05)',
                      transition: 'all 0.3s ease',
                      transform: selectedShipment?.truckId === shipment.truckId ? 'translateY(-2px)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedShipment?.truckId !== shipment.truckId) {
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedShipment?.truckId !== shipment.truckId) {
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
                        e.currentTarget.style.transform = 'none';
                      }
                    }}
                  >
                    <div style={{fontWeight: '700', fontSize: '18px', marginBottom: '8px'}}>
                      🚚 {shipment.truckId}
                    </div>
                    <div style={{fontSize: '13px', opacity: 0.9, marginBottom: '12px'}}>
                      {shipment.estateId}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      display: 'inline-block',
                      background: selectedShipment?.truckId === shipment.truckId
                        ? 'rgba(255, 255, 255, 0.2)'
                        : shipment.paid
                        ? '#d1fae5'
                        : shipment.arrived
                        ? '#dbeafe'
                        : '#fef3c7',
                      color: selectedShipment?.truckId === shipment.truckId
                        ? 'white'
                        : shipment.paid
                        ? '#065f46'
                        : shipment.arrived
                        ? '#1e40af'
                        : '#92400e',
                      fontWeight: '600'
                    }}>
                      {shipment.paid ? '✅ Selesai' : shipment.arrived ? '📍 Tiba' : '🚚 Dalam Perjalanan'}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Detailed Tracking */}
            {selectedShipment ? (
              <ShipmentTracking shipment={selectedShipment} />
            ) : (
              <div style={{
                padding: '60px 20px',
                textAlign: 'center',
                background: '#f9fafb',
                borderRadius: '12px',
                border: '2px dashed #e5e7eb'
              }}>
                <div style={{fontSize: '48px', marginBottom: '16px'}}>📦</div>
                <p style={{color: '#6b7280', fontSize: '16px'}}>
                  Pilih truk di atas untuk melihat detail tracking
                </p>
              </div>
            )}
          </div>
        )}

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
