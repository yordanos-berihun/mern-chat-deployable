import React, { useState, useEffect } from 'react';
import './LinkPreview.css';

const LinkPreview = ({ url, apiCall }) => {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const response = await apiCall(`/api/link-preview?url=${encodeURIComponent(url)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setPreview(data.data);
          } else {
            setError(true);
          }
        } else {
          setError(true);
        }
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [url, apiCall]);

  if (loading) {
    return <div className="link-preview loading">Loading preview...</div>;
  }

  if (error || !preview) {
    return null;
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="link-preview">
      {preview.image && (
        <div className="preview-image">
          <img src={preview.image} alt={preview.title} onError={(e) => e.target.style.display = 'none'} />
        </div>
      )}
      <div className="preview-content">
        <div className="preview-title">{preview.title}</div>
        {preview.description && (
          <div className="preview-description">{preview.description}</div>
        )}
        <div className="preview-url">{new URL(url).hostname}</div>
      </div>
    </a>
  );
};

export default LinkPreview;
