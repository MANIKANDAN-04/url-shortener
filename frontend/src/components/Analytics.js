import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { urlAPI } from '../services/api';

const Analytics = () => {
  const [selectedUrl, setSelectedUrl] = useState('');
  const [urls, setUrls] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingUrls, setLoadingUrls] = useState(true);

  useEffect(() => {
    fetchUrls();
    
    const interval = setInterval(() => {
      fetchUrls();
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const fetchUrls = async () => {
    try {
      setLoadingUrls(true);
      const response = await urlAPI.getURLs(0, 1000); // Get more URLs for dropdown
      setUrls(response);
    } catch (error) {
      console.error('Error fetching URLs:', error);
      toast.error('Failed to load URLs');
      setUrls([]);
    } finally {
      setLoadingUrls(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedUrl) {
      toast.error('Please select a URL from the dropdown');
      return;
    }

    setLoading(true);
    
    try {
      const shortCode = selectedUrl.split('|')[0]; // Format: "shortCode|originalUrl"
      
      const response = await urlAPI.getAnalytics(shortCode);
      
      setAnalytics(response);
      
      await fetchUrls();
    } catch (error) {
      console.error('Error fetching analytics:', error);
      if (error.response?.status === 404) {
        toast.error('URL not found');
      } else {
        toast.error('Failed to fetch analytics');
      }
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>📊 Analytics</h2>
      
      <form onSubmit={handleSubmit} className="url-form">
        <div className="form-group">
          <label htmlFor="urlSelect">Select URL to View Analytics</label>
          {loadingUrls ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
              Loading URLs...
            </div>
          ) : urls.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
              No URLs found. Create some short URLs first!
            </div>
          ) : (
            <select
              id="urlSelect"
              value={selectedUrl}
              onChange={(e) => setSelectedUrl(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '2px solid #e9ecef',
                borderRadius: '8px',
                backgroundColor: 'white',
                marginBottom: '15px'
              }}
            >
              <option value="">-- Select a URL --</option>
              {urls.map((url) => (
                <option 
                  key={url.id} 
                  value={`${url.short_code}|${url.original_url}`}
                >
                  {url.short_code} → {url.original_url.length > 50 
                    ? url.original_url.substring(0, 50) + '...' 
                    : url.original_url
                  } ({url.click_count} clicks)
                </option>
              ))}
            </select>
          )}
        </div>
        
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={loading || loadingUrls || urls.length === 0}
        >
          {loading ? 'Loading Analytics...' : 'Get Analytics'}
        </button>
        
        {!loadingUrls && (
          <button 
            type="button" 
            onClick={fetchUrls}
            className="btn btn-secondary"
            style={{ marginLeft: '10px' }}
            disabled={loading}
          >
            🔄 Refresh URLs
          </button>
        )}
      </form>

      {analytics && (
        <div className="result-card" style={{ marginTop: '20px' }}>
          <h3>📈 Analytics for: {analytics.short_code}</h3>
          
          {/* Show original URL info */}
          {selectedUrl && (
            <div style={{ 
              background: '#f8f9fa', 
              padding: '15px', 
              borderRadius: '8px', 
              marginBottom: '20px',
              border: '1px solid #e9ecef'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#495057', fontSize: '1.1rem' }}>
                🔗 URL Information
              </h4>
              <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                <strong>Short Code:</strong> {selectedUrl.split('|')[0]}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#6c757d', marginTop: '5px' }}>
                <strong>Original URL:</strong>{' '}
                <a 
                  href={selectedUrl.split('|')[1]} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: '#007bff', textDecoration: 'none' }}
                >
                  {selectedUrl.split('|')[1]}
                </a>
              </div>
              <div style={{ fontSize: '0.9rem', color: '#6c757d', marginTop: '5px' }}>
                <strong>Short URL:</strong>{' '}
                <a 
                  href={`http://localhost:8080/${selectedUrl.split('|')[0]}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: '#007bff', textDecoration: 'none' }}
                >
                  http://localhost:8080/{selectedUrl.split('|')[0]}
                </a>
              </div>
            </div>
          )}
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '20px',
            marginTop: '20px' 
          }}>
            <div style={{ 
              background: '#e3f2fd', 
              padding: '20px', 
              borderRadius: '10px', 
              textAlign: 'center' 
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#1565c0' }}>Total Clicks</h4>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0d47a1' }}>
                {analytics.total_clicks}
              </div>
            </div>
            
            <div style={{ 
              background: '#f3e5f5', 
              padding: '20px', 
              borderRadius: '10px', 
              textAlign: 'center' 
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#7b1fa2' }}>Click History</h4>
              <div style={{ fontSize: '1.2rem', color: '#4a148c' }}>
                {analytics.click_history.length} events tracked
              </div>
            </div>
          </div>

          {/* Daily Summary (only shown when using date filter) */}
          {analytics.daily_summary && Object.keys(analytics.daily_summary).length > 0 && (
            <div style={{ marginTop: '30px' }}>
              <h4>📊 Daily Summary</h4>
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '15px',
                marginTop: '15px'
              }}>
                {Object.entries(analytics.daily_summary)
                  .sort(([a], [b]) => new Date(b) - new Date(a))
                  .map(([date, clicks]) => (
                    <div key={date} style={{
                      padding: '15px',
                      backgroundColor: '#fff3cd',
                      border: '1px solid #ffeaa7',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '0.9rem', color: '#856404', marginBottom: '5px' }}>
                        {new Date(date).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#856404' }}>
                        {clicks}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#856404' }}>
                        click{clicks !== 1 ? 's' : ''}
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          )}

          {analytics.click_history.length > 0 ? (
            <div style={{ marginTop: '30px' }}>
              <h4>📅 Recent Activity</h4>
              <div style={{ 
                maxHeight: '300px', 
                overflowY: 'auto',
                border: '1px solid #e9ecef',
                borderRadius: '5px',
                padding: '10px'
              }}>
                {analytics.click_history.map((event, index) => (
                  <div key={index} style={{ 
                    padding: '15px', 
                    borderBottom: '1px solid #f8f9fa',
                    fontSize: '0.9rem',
                    backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                      <strong>Click #{analytics.click_history.length - index}</strong>
                      <span style={{ color: '#666', fontSize: '0.8rem' }}>
                        {event.date} at {event.time} (IST)
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', fontSize: '0.8rem', color: '#666' }}>
                      <div>
                        🔗 From: {event.referer === 'Direct' ? 'Direct access' : event.referer}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '30px', 
              color: '#666',
              marginTop: '20px'
            }}>
              <h4>📊 No detailed click history available</h4>
              <p>Click data will appear here as people use your short URL.</p>
            </div>
          )}
        </div>
      )}

      {!analytics && !loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: '#666',
          marginTop: '20px'
        }}>
          <h3>📊 Analytics Dashboard</h3>
          <p>Select a URL from the dropdown above to view detailed analytics including:</p>
          <ul style={{ textAlign: 'left', maxWidth: '400px', margin: '20px auto' }}>
            <li>📈 Total click count</li>
            <li>📅 Click history</li>
            <li>🔍 Referrer information</li>
          </ul>
          {urls.length === 0 && !loadingUrls && (
            <div style={{ 
              marginTop: '30px', 
              padding: '20px', 
              background: '#fff3cd', 
              borderRadius: '8px',
              border: '1px solid #ffeaa7'
            }}>
              <h4 style={{ color: '#856404', margin: '0 0 10px 0' }}>No URLs Available</h4>
              <p style={{ color: '#856404', margin: 0 }}>
                Create some short URLs first to view their analytics!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Analytics;
