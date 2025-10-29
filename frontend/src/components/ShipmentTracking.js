import React from 'react';
import './ShipmentTracking.css';

const ShipmentTracking = ({ shipment }) => {
  // Determine current step based on shipment status
  const getCurrentStep = () => {
    if (!shipment.departed) return 0;
    if (shipment.departed && !shipment.arrived) return 1;
    if (shipment.arrived && !shipment.paid) return 2;
    if (shipment.paid) return 3;
    return 0;
  };

  const currentStep = getCurrentStep();

  // Format timestamp
  const formatDate = (timestamp) => {
    if (!timestamp || timestamp === '0') return '-';
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format weight
  const formatWeight = (weight) => {
    if (!weight || weight === '0') return '-';
    return `${parseInt(weight).toLocaleString()} kg`;
  };

  // Calculate weight difference
  const getWeightDiff = () => {
    if (!shipment.arrivalWeight || shipment.arrivalWeight === '0') return null;
    const diff = parseInt(shipment.departureWeight) - parseInt(shipment.arrivalWeight);
    return diff;
  };

  const weightDiff = getWeightDiff();

  // Status badge
  const getStatusBadge = () => {
    if (!shipment.departed) {
      return <span className="status-badge status-pending">Belum Berangkat</span>;
    }
    if (shipment.departed && !shipment.arrived) {
      return <span className="status-badge status-transit">🚚 Dalam Perjalanan</span>;
    }
    if (shipment.arrived && !shipment.paid) {
      return <span className="status-badge status-arrived">Tiba - Menunggu Pembayaran</span>;
    }
    if (shipment.paid) {
      return <span className="status-badge status-completed">✅ Selesai, Terverifikasi di Blockchain</span>;
    }
  };

  return (
    <div className="shipment-tracking-card">
      {/* Header */}
      <div className="tracking-header">
        <h3>Detail Pengiriman</h3>
        <div className="tracking-qr">
          {/* QR Code placeholder - bisa diganti dengan library qrcode.react */}
          <div className="qr-placeholder">
            <svg viewBox="0 0 100 100" width="80" height="80">
              <rect width="100" height="100" fill="#fff"/>
              <rect x="10" y="10" width="20" height="20" fill="#000"/>
              <rect x="40" y="10" width="20" height="20" fill="#000"/>
              <rect x="70" y="10" width="20" height="20" fill="#000"/>
              <rect x="10" y="40" width="20" height="20" fill="#000"/>
              <rect x="70" y="40" width="20" height="20" fill="#000"/>
              <rect x="10" y="70" width="20" height="20" fill="#000"/>
              <rect x="40" y="70" width="20" height="20" fill="#000"/>
              <rect x="70" y="70" width="20" height="20" fill="#000"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Status Badge */}
      <div className="tracking-status">
        <h4>Status Keseluruhan</h4>
        {getStatusBadge()}
      </div>

      {/* Progress Timeline */}
      <div className="tracking-timeline">
        <h4>Verifikasi Alur Proses</h4>
        <div className="timeline-container">
          {/* Step 1: Berangkat Estate */}
          <div className={`timeline-step ${currentStep >= 1 ? 'completed' : ''} ${currentStep === 1 ? 'active' : ''}`}>
            <div className="timeline-dot">
              {currentStep >= 1 ? '✓' : '1'}
            </div>
            <div className="timeline-content">
              <div className="timeline-title">Berangkat Estate</div>
              <div className="timeline-date">{formatDate(shipment.departureTimestamp)}</div>
            </div>
          </div>

          <div className={`timeline-line ${currentStep >= 2 ? 'completed' : ''}`}></div>

          {/* Step 2: Tiba Pabrik */}
          <div className={`timeline-step ${currentStep >= 2 ? 'completed' : ''} ${currentStep === 2 ? 'active' : ''}`}>
            <div className="timeline-dot">
              {currentStep >= 2 ? '✓' : '2'}
            </div>
            <div className="timeline-content">
              <div className="timeline-title">Tiba Pabrik</div>
              <div className="timeline-date">{formatDate(shipment.arrivalTimestamp)}</div>
            </div>
          </div>

          <div className={`timeline-line ${currentStep >= 3 ? 'completed' : ''}`}></div>

          {/* Step 3: Verifikasi Berat */}
          <div className={`timeline-step ${currentStep >= 3 ? 'completed' : ''} ${currentStep === 3 ? 'active' : ''}`}>
            <div className="timeline-dot">
              {currentStep >= 3 ? '✓' : '3'}
            </div>
            <div className="timeline-content">
              <div className="timeline-title">Verifikasi Berat</div>
              <div className="timeline-date">
                {currentStep >= 2 ? (
                  weightDiff !== null && weightDiff <= 1 ? '✅ Valid' : '❌ Invalid'
                ) : '-'}
              </div>
            </div>
          </div>

          <div className={`timeline-line ${currentStep >= 4 ? 'completed' : ''}`}></div>

          {/* Step 4: Pembayaran */}
          <div className={`timeline-step ${currentStep >= 4 ? 'completed' : ''} ${currentStep === 4 ? 'active' : ''}`}>
            <div className="timeline-dot">
              {currentStep >= 4 ? '✓' : '4'}
            </div>
            <div className="timeline-content">
              <div className="timeline-title">Pembayaran</div>
              <div className="timeline-date">
                {shipment.paid ? '✅ Dibayar' : 'Menunggu'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shipment Details */}
      <div className="tracking-details">
        <div className="detail-row">
          <div className="detail-item">
            <span className="detail-label">Nomor Truk</span>
            <span className="detail-value highlight">{shipment.truckId || '-'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Nomor Estate</span>
            <span className="detail-value">{shipment.estateId || '-'}</span>
          </div>
        </div>

        <div className="detail-row">
          <div className="detail-item">
            <span className="detail-label">Berat Berangkat</span>
            <span className="detail-value">{formatWeight(shipment.departureWeight)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Berat Tiba</span>
            <span className="detail-value">
              {formatWeight(shipment.arrivalWeight)}
              {weightDiff !== null && (
                <span className={`weight-diff ${weightDiff <= 1 ? 'valid' : 'invalid'}`}>
                  {weightDiff > 0 ? `-${weightDiff}kg` : '0kg'}
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="detail-row">
          <div className="detail-item">
            <span className="detail-label">Wallet Verifikator Pengirim</span>
            <span className="detail-value wallet">{shipment.seller?.substring(0, 10)}...{shipment.seller?.substring(38)}</span>
          </div>
        </div>

        <div className="detail-row">
          <div className="detail-item">
            <span className="detail-label">Tanggal Pemesanan</span>
            <span className="detail-value">{formatDate(shipment.departureTimestamp)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Batas Harga</span>
            <span className="detail-value">Rp {(parseInt(shipment.departureWeight || 0) * 100000).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      {currentStep === 1 && (
        <div className="tracking-actions">
          <div className="action-note">
            <span className="icon">ℹ️</span>
            <span>Truk sedang dalam perjalanan ke pabrik. Status akan diupdate otomatis saat tiba.</span>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="tracking-actions">
          <div className="action-note warning">
            <span className="icon">⚠️</span>
            <span>Menunggu verifikasi berat dan pembayaran otomatis.</span>
          </div>
        </div>
      )}

      {currentStep === 4 && (
        <div className="tracking-actions">
          <div className="action-note success">
            <span className="icon">✅</span>
            <span>Pengiriman selesai! Data telah diverifikasi dan tersimpan di blockchain.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShipmentTracking;
