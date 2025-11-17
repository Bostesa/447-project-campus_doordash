import { QRCodeSVG } from 'qrcode.react';
import './OrderQRCode.css';

interface Props {
  orderId: string;
  restaurantName: string;
  orderTotal: number;
  verificationCode: string;
  pin: string;
  onClose: () => void;
}

export default function OrderQRCode({ orderId, restaurantName, orderTotal, verificationCode, pin, onClose }: Props) {
  // Create structured QR code data with order ID
  const qrData = JSON.stringify({
    orderId: orderId,
    verificationCode: verificationCode,
    type: 'campus-doordash-order'
  });

  return (
    <>
      <div className="qr-overlay" onClick={onClose} />
      <div className="qr-modal">
        <div className="qr-header">
          <h2>Order Confirmation</h2>
          <button className="qr-close" onClick={onClose}>×</button>
        </div>

        <div className="qr-content">
          <div className="qr-info">
            <p className="qr-restaurant">{restaurantName}</p>
            <p className="qr-amount">Total: ${orderTotal.toFixed(2)}</p>
            <p className="qr-order-id">Order ID: {orderId}</p>
          </div>

          <div className="qr-code-container">
            <QRCodeSVG
              value={qrData}
              size={250}
              level="H"
              includeMargin={true}
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>

          <div className="qr-instructions">
            <p className="qr-pin-label">Delivery PIN</p>
            <p className="qr-pin-code">{pin}</p>
            <p className="qr-code-label">Verification Code</p>
            <p className="qr-code-text">{verificationCode}</p>
            <p className="qr-helper-text">
              Show this QR code or provide the PIN to the delivery worker to confirm your order
            </p>
          </div>
        </div>

        <div className="qr-footer">
          <button className="qr-done-btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </>
  );
}
