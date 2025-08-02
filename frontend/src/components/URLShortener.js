import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { urlAPI } from '../services/api';

const URLShortener = () => {
  const [formData, setFormData] = useState({
    url: '',
    customCode: '',
    expiresInDays: ''
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [urlExistsInfo, setUrlExistsInfo] = useState(null);
  const [showOptions, setShowOptions] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (name === 'url') {
      setUrlExistsInfo(null);
      setShowOptions(false);
    }
  };

  const checkURLExists = async () => {
    if (!formData.url) {
      toast.error('Please enter a URL first');
      return;
    }

    try {
      new URL(formData.url);
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }

    setLoading(true);
    try {
      const response = await urlAPI.checkURL({ url: formData.url });
      setUrlExistsInfo(response);
      setShowOptions(response.exists && response.is_deleted);
      
      if (!response.exists) {
        toast.info('URL is new, you can create a short link');
      } else if (response.is_deleted) {
        toast.warning(`URL was previously deleted. Do you want to reuse '${response.short_code}' or create new?`);
      } else {
        toast.info(`URL already exists with code: ${response.short_code}`);
      }
    } catch (error) {
      console.error('Error checking URL:', error);
      toast.error('Failed to check URL');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.url) {
      toast.error('Please enter a URL');
      return;
    }

    try {
      new URL(formData.url);
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }

    setLoading(true);
    
    try {
      const requestData = {
        url: formData.url,
        ...(formData.customCode && { custom_code: formData.customCode }),
        ...(formData.expiresInDays && { expires_in_days: parseInt(formData.expiresInDays) })
      };

      const response = await urlAPI.shortenURL(requestData);
      
      if (!response.is_active) {
        setUrlExistsInfo({
          exists: true,
          is_deleted: true,
          short_code: response.short_code,
          message: `URL was previously deleted. Do you want to reuse '${response.short_code}' or create new?`
        });
        setShowOptions(true);
        toast.warning('URL was previously deleted. Choose an option below.');
        return;
      }

      setResult(response);
      toast.success('URL shortened successfully!');
      
      setFormData({
        url: '',
        customCode: '',
        expiresInDays: ''
      });
      setUrlExistsInfo(null);
      setShowOptions(false);
    } catch (error) {
      console.error('Error shortening URL:', error);
      toast.error(error.response?.data?.detail || 'Failed to shorten URL');
    } finally {
      setLoading(false);
    }
  };

  const handleReuseCode = async () => {
    setLoading(true);
    try {
      const requestData = {
        url: formData.url,
        use_existing_code: true,
        ...(formData.customCode && { custom_code: formData.customCode }),
        ...(formData.expiresInDays && { expires_in_days: parseInt(formData.expiresInDays) })
      };

      const response = await urlAPI.shortenURL(requestData);
      setResult(response);
      toast.success(`URL reactivated with existing code: ${response.short_code}`);
      
      setFormData({
        url: '',
        customCode: '',
        expiresInDays: ''
      });
      setUrlExistsInfo(null);
      setShowOptions(false);
    } catch (error) {
      console.error('Error reusing code:', error);
      toast.error(error.response?.data?.detail || 'Failed to reuse code');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = async () => {
    const customCode = formData.customCode || `new_${Date.now().toString().slice(-4)}`;
    
    setLoading(true);
    try {
      const requestData = {
        url: formData.url,
        custom_code: customCode,
        ...(formData.expiresInDays && { expires_in_days: parseInt(formData.expiresInDays) })
      };

      const response = await urlAPI.shortenURL(requestData);
      setResult(response);
      toast.success(`New URL created with code: ${response.short_code}`);
      
      setFormData({
        url: '',
        customCode: '',
        expiresInDays: ''
      });
      setUrlExistsInfo(null);
      setShowOptions(false);
    } catch (error) {
      console.error('Error creating new:', error);
      toast.error(error.response?.data?.detail || 'Failed to create new URL');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <div className="card">
      <form onSubmit={handleSubmit} className="url-form">
        <div className="form-group">
          <label htmlFor="url">Enter URL to shorten *</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="url"
              id="url"
              name="url"
              value={formData.url}
              onChange={handleInputChange}
              placeholder="https://example.com/very-long-url"
              required
              style={{ flex: 1 }}
            />
            <button 
              type="button" 
              onClick={checkURLExists}
              className="btn btn-secondary"
              disabled={loading}
              style={{ whiteSpace: 'nowrap' }}
            >
              Check URL
            </button>
          </div>
        </div>

        {urlExistsInfo && (
          <div className={`alert ${urlExistsInfo.is_deleted ? 'alert-warning' : 'alert-info'}`}>
            <p>{urlExistsInfo.message}</p>
            {urlExistsInfo.short_code && !urlExistsInfo.is_deleted && (
              <p><strong>Existing short code:</strong> {urlExistsInfo.short_code}</p>
            )}
          </div>
        )}

        {showOptions && (
          <div className="options-card">
            <h4>⚠️ URL was previously deleted</h4>
            <p>This URL had the short code: <strong>{urlExistsInfo.short_code}</strong></p>
            <p>What would you like to do?</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button 
                type="button"
                onClick={handleReuseCode}
                className="btn btn-success"
                disabled={loading}
              >
                ♻️ Reuse "{urlExistsInfo.short_code}"
              </button>
              <button 
                type="button"
                onClick={handleCreateNew}
                className="btn btn-primary"
                disabled={loading}
              >
                ✨ Create New Code
              </button>
            </div>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="customCode">Custom Short Code (optional)</label>
          <input
            type="text"
            id="customCode"
            name="customCode"
            value={formData.customCode}
            onChange={handleInputChange}
            placeholder="mycustomcode"
            maxLength="10"
          />
        </div>

        <div className="form-group">
          <label htmlFor="expiresInDays">Expires in (days, optional)</label>
          <input
            type="number"
            id="expiresInDays"
            name="expiresInDays"
            value={formData.expiresInDays}
            onChange={handleInputChange}
            placeholder="30"
            min="1"
            max="365"
          />
        </div>

        {!showOptions && (
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Shorten URL'}
          </button>
        )}
      </form>

      {result && (
        <div className="result-card">
          <h3>✅ URL {result.click_count > 0 ? 'Reactivated' : 'Shortened'} Successfully!</h3>
          <div>
            <strong>Original URL:</strong>
            <p style={{ wordBreak: 'break-all', color: '#666' }}>{result.original_url}</p>
          </div>
          <div>
            <strong>Short URL:</strong>
            <div className="short-url">
              {result.short_url}
              <button 
                className="copy-btn"
                onClick={() => copyToClipboard(result.short_url)}
              >
                📋 Copy
              </button>
            </div>
          </div>
          <div style={{ marginTop: '15px', fontSize: '0.9rem', color: '#666' }}>
            <p><strong>Short Code:</strong> {result.short_code}</p>
            <p><strong>Created:</strong> {new Date(result.created_at).toLocaleString()}</p>
            {result.expires_at && (
              <p><strong>Expires:</strong> {new Date(result.expires_at).toLocaleString()}</p>
            )}
            <p><strong>Total Clicks:</strong> {result.click_count}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default URLShortener;
