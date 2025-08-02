import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { urlAPI } from '../services/api';
import QRCodeModal from './QRCodeModal';

const URLList = () => {
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrModal, setQrModal] = useState({
    isOpen: false,
    qrCode: null,
    shortUrl: '',
    shortCode: ''
  });

  useEffect(() => {
    fetchURLs();
    
    const interval = setInterval(() => {
      fetchURLs();
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const fetchURLs = async () => {
    try {
      setLoading(true);
      const response = await urlAPI.getURLs();
      setUrls(response);
    } catch (error) {
      console.error('Error fetching URLs:', error);
      toast.error('Failed to fetch URLs');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (shortCode) => {
    const confirmed = window.confirm(
      `⚠️ Delete URL with code "${shortCode}"?\n\n` +
      '📋 This will:\n' +
      '• Immediately disable the short URL\n' +
      '• Keep it as backup for 2 days\n' +
      '• Remove from analytics after 2 days\n\n' +
      'Continue with deletion?'
    );
    
    if (!confirmed) return;

    try {
      const response = await urlAPI.deleteURL(shortCode);
      setUrls(urls.filter(url => url.short_code !== shortCode));
      
      toast.success(
        `🗑️ URL deleted successfully!\n` +
        `⏰ Backup until: ${new Date(response.backup_until).toLocaleString()}`,
        { autoClose: 5000 }
      );
    } catch (error) {
      console.error('Error deleting URL:', error);
      toast.error('Failed to delete URL');
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('Copied to clipboard!');
    }
  };

  const showQRCode = async (url) => {
    let qrCode = url.qr_code;
    
    if (!qrCode) {
      try {
        const response = await urlAPI.generateQRCode(url.short_code);
        qrCode = response.qr_code;
        setUrls(prevUrls => 
          prevUrls.map(u => 
            u.short_code === url.short_code 
              ? { ...u, qr_code: qrCode }
              : u
          )
        );
        toast.success('QR code generated successfully!');
      } catch (error) {
        console.error('Error generating QR code:', error);
        toast.error('Failed to generate QR code');
        return;
      }
    }
    
    setQrModal({
      isOpen: true,
      qrCode: qrCode,
      shortUrl: url.short_url,
      shortCode: url.short_code
    });
  };

  const closeQRModal = () => {
    setQrModal({
      isOpen: false,
      qrCode: null,
      shortUrl: '',
      shortCode: ''
    });
  };

  const openURL = (url) => {
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="card">
        <div className="loading">Loading URLs...</div>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>📋 My URLs ({urls.length})</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={fetchURLs}
            className="btn btn-secondary"
            disabled={loading}
            title="Refresh URL list and click counts"
          >
            🔄 Refresh
          </button>
        </div>
      </div>
      
      
      {urls.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <h3>No URLs found</h3>
          <p>Start by shortening your first URL!</p>
        </div>
      ) : (
        <div className="urls-list">
          {urls.map((url) => (
            <div key={url.id} className="url-item">
              <div className="url-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h4 style={{ margin: '0', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    🔗 {url.short_code}
                  </h4>
                </div>
                <p><strong>Short URL:</strong> {url.short_url}</p>
                <p><strong>Original:</strong> {url.original_url}</p>
                <p><strong>Created:</strong> {new Date(url.created_at).toLocaleDateString()}</p>
              </div>
              
              <div className="url-actions">
                <span className="click-count">
                  👆 {url.click_count} clicks
                </span>
                
                <button
                  className="btn btn-secondary"
                  onClick={() => copyToClipboard(url.short_url)}
                  title="Copy short URL"
                >
                  📋
                </button>
                
                <button
                  className="btn btn-secondary qr-btn"
                  onClick={() => showQRCode(url)}
                  title="Generate & Show QR Code for mobile scanning"
                >
                  📱 QR
                </button>
                
                <button
                  className="btn btn-secondary"
                  onClick={() => openURL(url.original_url)}
                  title="Open original URL"
                >
                  🔗
                </button>
                
                <button
                  className="btn btn-secondary"
                  onClick={() => openURL(url.short_url)}
                  title="Test short URL"
                >
                  🧪
                </button>
                
                <button
                  className="btn btn-danger"
                  onClick={() => handleDelete(url.short_code)}
                  title="Delete URL (2-day backup)"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button 
          className="btn btn-secondary"
          onClick={fetchURLs}
        >
          🔄 Refresh
        </button>
      </div>
      
      <QRCodeModal
        isOpen={qrModal.isOpen}
        onClose={closeQRModal}
        qrCode={qrModal.qrCode}
        shortUrl={qrModal.shortUrl}
        shortCode={qrModal.shortCode}
      />
    </div>
  );
};

export default URLList;
