import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import './QRScanner.css';

interface Props {
  onScan: (result: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: Props) {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    startScanner();

    return () => {
      isMountedRef.current = false;
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    try {
      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          if (isMountedRef.current) {
            onScan(decodedText);
            stopScanner();
          }
        },
        () => {
          // Ignore errors during scanning (they're frequent and normal)
        }
      );

      setError(null);
    } catch (err) {
      console.error('Error starting scanner:', err);
      setError('Unable to access camera. Please check permissions.');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  return (
    <>
      <div className="qr-scanner-overlay" onClick={handleClose} />
      <div className="qr-scanner-modal">
        <div className="qr-scanner-header">
          <h2>Scan QR Code</h2>
          <button className="qr-close-btn" onClick={handleClose}>×</button>
        </div>

        <div className="qr-scanner-content">
          {error ? (
            <div className="qr-error">
              <span className="error-icon">⚠️</span>
              <p>{error}</p>
              <button className="retry-btn" onClick={startScanner}>
                Try Again
              </button>
            </div>
          ) : (
            <>
              <div id="qr-reader" className="qr-reader-container"></div>
              <p className="qr-instruction">
                Position the QR code within the frame to scan
              </p>
            </>
          )}
        </div>

        <div className="qr-scanner-footer">
          <button className="cancel-scan-btn" onClick={handleClose}>
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}
