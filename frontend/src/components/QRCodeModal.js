import React from 'react';

const QRCodeModal = ({ isOpen, onClose, qrCode, shortUrl, shortCode }) => {
  if (!isOpen) return null;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      alert('Short URL copied to clipboard!');
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = shortUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Short URL copied to clipboard!');
    }
  };

  const handleDownloadQR = () => {
    try {
      const link = document.createElement('a');
      link.href = qrCode;
      link.download = `qr-${shortCode}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Download failed. Please try right-clicking the QR code and selecting "Save image as..."');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content qr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>QR Code for {shortCode}</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="qr-container">
          <div className="qr-code-wrapper">
            {qrCode ? (
              <img 
                src={qrCode} 
                alt={`QR Code for ${shortCode}`}
                style={{ width: '250px', height: '250px' }}
              />
            ) : (
              <div style={{ width: '250px', height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa', border: '1px solid #dee2e6' }}>
                <span>No QR Code Available</span>
              </div>
            )}
          </div>
          
          <div className="qr-info">
            <p><strong>Short URL:</strong></p>
            <div className="url-display">
              <span>{shortUrl}</span>
              <button 
                className="btn btn-secondary copy-btn" 
                onClick={handleCopyUrl}
                title="Copy URL to clipboard"
              >
                📋 Copy
              </button>
            </div>
          </div>
          
          <div className="qr-actions">
            {qrCode && (
              <button 
                className="btn btn-primary" 
                onClick={handleDownloadQR}
                title="Download QR code as PNG"
              >
                💾 Download QR Code
              </button>
            )}
            <button 
              className="btn btn-secondary" 
              onClick={onClose}
            >
              Close
            </button>
          </div>
          
          <div className="qr-instructions">
            <p><small>📱 Scan this QR code with your phone camera or QR code app to quickly access the URL</small></p>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        
        .qr-modal {
          background: white;
          border-radius: 12px;
          padding: 0;
          max-width: 400px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #eee;
          background: #f8f9fa;
          border-radius: 12px 12px 0 0;
        }
        
        .modal-header h3 {
          margin: 0;
          color: #333;
        }
        
        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
          padding: 5px;
          border-radius: 50%;
          width: 35px;
          height: 35px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .close-btn:hover {
          background-color: #f0f0f0;
          color: #333;
        }
        
        .qr-container {
          padding: 30px;
          text-align: center;
        }
        
        .qr-code-wrapper {
          display: flex;
          justify-content: center;
          margin-bottom: 25px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 2px dashed #dee2e6;
        }
        
        .qr-info {
          margin-bottom: 25px;
        }
        
        .qr-info p {
          margin-bottom: 10px;
          color: #666;
        }
        
        .url-display {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 6px;
          border: 1px solid #dee2e6;
          margin-bottom: 10px;
        }
        
        .url-display span {
          flex: 1;
          text-align: left;
          font-family: monospace;
          font-size: 14px;
          color: #495057;
          word-break: break-all;
        }
        
        .copy-btn {
          white-space: nowrap;
          padding: 6px 12px !important;
          font-size: 12px !important;
        }
        
        .qr-actions {
          display: flex;
          gap: 15px;
          justify-content: center;
          margin-bottom: 20px;
        }
        
        .qr-instructions {
          padding-top: 15px;
          border-top: 1px solid #eee;
        }
        
        .qr-instructions p {
          margin: 0;
          color: #666;
          line-height: 1.4;
        }
        
        @media (max-width: 480px) {
          .qr-modal {
            width: 95%;
            margin: 10px;
          }
          
          .qr-container {
            padding: 20px;
          }
          
          .qr-code-wrapper img {
            width: 200px !important;
            height: 200px !important;
          }
          
          .url-display {
            flex-direction: column;
            gap: 8px;
          }
          
          .qr-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default QRCodeModal;
